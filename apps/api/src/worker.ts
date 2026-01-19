import { config } from 'dotenv';
import { loadEnv } from './env.js';
import { createSupabaseAdmin } from './supabase.js';
import { analyzeRoom, generateRedesign } from './openai.js';
import { downloadFromStorage, uploadBuffer } from './storage.js';
import { PNG } from 'pngjs';
import { imageSize as sizeOf } from 'image-size';
import { randomUUID } from 'crypto';

// Allow local .env to override OS env during dev to simplify toggling
config({ override: true });
const env = loadEnv();
const supabase = createSupabaseAdmin(env);
const WORKER_INSTANCE_ID = randomUUID();

/*
Option A (storage.download) integration summary
- Existing state (Step 0):
  - jobs table present with RLS and indexes; storage buckets room_inputs/room_outputs created via migrations 0001/0002/0003
  - Prior worker downloaded via signed URLs; claim was non-atomic
- Changes applied:
  - Added migration 0013_claim_next_job.sql providing atomic claim_next_job() using FOR UPDATE SKIP LOCKED
  - Switched downloads to Supabase Storage download() (service role) via downloadFromStorage()
  - Added basic download validation and structured logs; kept outputs private and uploaded to room_outputs
  - Preserved existing schema (input_image_path, output_image_paths[]) to avoid breaking API/mobile
*/

// Option A pipeline notes:
// - Downloads use Supabase Storage download() with service role (no signed URLs)
// - Claiming uses an atomic RPC (claim_next_job) to avoid double processing
// - We log key milestones and validate downloads before sending to OpenAI
async function processOne() {
  const { data: raw, error } = await supabase.rpc('claim_next_job');
  if (error) throw error;
  // Normalize possible shapes from RPC depending on driver/version
  let job: any = null;
  if (!raw) {
    return false;
  } else if (Array.isArray(raw)) {
    if (raw.length === 0) return false;
    job = raw[0];
  } else if ((raw as any).id) {
    job = raw as any;
  } else if ((raw as any).claim_next_job) {
    job = (raw as any).claim_next_job as any;
  }
  if (!job || !job.id) return false;

  const id = (job as any)?.id as string | undefined;
  try {
    // id is guaranteed above
    const inputBucket = (job as any).input_bucket || 'room_inputs';
    const inputPath = (job as any).input_image_path;
    // Download input image via Supabase Storage (Option A)
    const dl = await downloadFromStorage(env, inputBucket, inputPath);
    const imageBytes = dl.bytes;
    const contentType = dl.contentType || 'application/octet-stream';
    const byteLen = imageBytes.byteLength || imageBytes.length || 0;
    console.log('[worker] claimed job', { instance: WORKER_INSTANCE_ID, id, inputBucket, inputPath, contentType, byteLen });
    if (byteLen < 10000 || /text\/html/i.test(contentType)) {
      throw new Error(`invalid download: contentType=${contentType} bytes=${byteLen}`);
    }

    // Analyze (non-blocking for some flows)
    const provider = (env as any).IMAGE_PROVIDER || 'openai';
    const analysis = provider === 'openai' ? await analyzeRoom(env, imageBytes) : {};

    // Generate image depending on flow
    const constraints = ((job as any).constraints || {}) as any;
    const flow = constraints.flow || constraints.mode;
    // Dev pass-through for interior
    if (flow === 'interior' && (env as any).PASS_THROUGH_INTERIOR) {
      try {
        const outputPath = `${job.user_id}/${id}_v1.jpg`;
        await uploadBuffer(env, 'room_outputs', outputPath, Buffer.from(imageBytes), 'image/jpeg');
        await supabase
          .from('jobs')
          .update({ status: 'complete', analysis, output_image_paths: [outputPath] })
          .eq('id', id);
        return true;
      } catch (e) {
        await supabase.from('jobs').update({ status: 'failed', error: String((e as any)?.message || e) }).eq('id', id);
        return true;
      }
    }
    // Always pass original image bytes so downstream can prefer image edits (preserves structure)
    constraints.__inputBytes = imageBytes;
    constraints.__jobId = id;
    constraints.__inputContentType = contentType;
    if (flow === 'replace') {
      // If marks from client are provided, build a binary mask matching the input image size
      try {
        if (Array.isArray(constraints.marks) && constraints.canvas?.width && constraints.canvas?.height) {
          const dim = sizeOf(imageBytes as unknown as Buffer);
          const imgW = dim.width || 1024;
          const imgH = dim.height || 1024;
          const viewW = Number(constraints.canvas.width);
          const viewH = Number(constraints.canvas.height);
          const sx = imgW / Math.max(1, viewW);
          const sy = imgH / Math.max(1, viewH);
          const png = new PNG({ width: imgW, height: imgH });
          // Start with opaque mask (keep everywhere)
          for (let i = 0; i < png.data.length; i += 4) {
            png.data[i] = 0;        // R
            png.data[i + 1] = 0;    // G
            png.data[i + 2] = 0;    // B
            png.data[i + 3] = 255;  // A opaque (keep)
          }
          // Draw transparent circles where we want edits
          const setTransparent = (x: number, y: number) => {
            if (x < 0 || y < 0 || x >= imgW || y >= imgH) return;
            const idx = (imgW * y + x) << 2;
            png.data[idx] = 0;        // R
            png.data[idx + 1] = 0;    // G
            png.data[idx + 2] = 0;    // B
            png.data[idx + 3] = 0;    // A transparent (edit)
          };
          const drawCircle = (cx: number, cy: number, rr: number) => {
            const r2 = rr * rr;
            const minY = Math.max(0, Math.floor(cy - rr));
            const maxY = Math.min(imgH - 1, Math.ceil(cy + rr));
            for (let y = minY; y <= maxY; y++) {
              const dy = y - cy; const dxm = Math.floor(Math.sqrt(Math.max(0, r2 - dy * dy)));
              const minX = Math.max(0, Math.floor(cx - dxm));
              const maxX = Math.min(imgW - 1, Math.ceil(cx + dxm));
              for (let x = minX; x <= maxX; x++) setTransparent(x, y);
            }
          };
          for (const m of constraints.marks as Array<{ x: number; y: number; r: number }>) {
            const cx = Math.round(m.x * sx);
            const cy = Math.round(m.y * sy);
            const rr = Math.max(1, Math.round(m.r * Math.max(sx, sy)));
            drawCircle(cx, cy, rr);
          }
          // Encode PNG
          const maskBuffer: Buffer = PNG.sync.write(png);
          const maskPath = `${job.user_id}/${id}_mask.png`;
          await uploadBuffer(env, 'room_masks', maskPath, maskBuffer);
          constraints.maskPath = maskPath;
        }
      } catch (e) {
        // If mask fails, continue with prompt-only generation
        console.error('mask build failed', e);
      }
    }
    const { buffer: outputBuffer, mode: generationMode, promptPreview, promptHash } = await generateRedesign(env, analysis, (job as any).style || 'modern', constraints);
    // A) After decode
    const decodedBytes = outputBuffer.length || 0;
    const outputContentType = 'image/png';
    console.log('[worker] post-openai decode', { instance: WORKER_INSTANCE_ID, job_id: id, decoded_bytes: decodedBytes, output_format: 'png', generation_mode: generationMode });
    if (decodedBytes < 50000) throw new Error(`decoded image too small: ${decodedBytes} bytes`);
    const outputBucket = (job as any).output_bucket || 'room_outputs';
    const outputPath = `${(job as any).user_id}/${id}_v1.png`;
    // B) Before upload
    console.log('[worker] upload start', { instance: WORKER_INSTANCE_ID, job_id: id, outputBucket, outputPath, contentType: outputContentType });
    try {
      await uploadBuffer(env, outputBucket, outputPath, outputBuffer, outputContentType);
      // C) After upload
      console.log('[worker] upload done', { instance: WORKER_INSTANCE_ID, job_id: id, upload_ok: true });
    } catch (e: any) {
      console.log('[worker] upload done', { instance: WORKER_INSTANCE_ID, job_id: id, upload_ok: false, upload_error: String(e?.message || e) });
      throw e;
    }

    await supabase
      .from('jobs')
      .update({ status: 'complete', analysis, output_image_paths: [outputPath], generation_mode: generationMode, prompt_preview: promptPreview, prompt_hash: promptHash })
      .eq('id', id);
    // D) After DB update
    console.log('[worker] job complete', { instance: WORKER_INSTANCE_ID, job_id: id, status: 'complete', output_image_paths: [outputPath] });
    return true;
  } catch (e: any) {
    console.error('[worker] job failed', { instance: WORKER_INSTANCE_ID, id, error: String(e?.message || e) });
    await supabase.from('jobs').update({ status: 'failed', error: String(e?.message || e) }).eq('id', id);
    return true;
  }
}

async function mainLoop() {
  // Simple polling worker loop for MVP
  // In production, replace with a queue (e.g., pg-boss, bullmq)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const didWork = await processOne();
      await new Promise((r) => setTimeout(r, didWork ? 500 : 2000));
    } catch (e) {
      console.error(e);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

mainLoop();

// Log key env toggles once to help diagnose prompt path
console.log('[worker] startup', {
  provider: (env as any).IMAGE_PROVIDER || 'openai',
  debug: (env as any).DEBUG_OPENAI || false
});
