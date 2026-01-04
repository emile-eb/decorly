import { config } from 'dotenv';
import { loadEnv } from './env';
import { createSupabaseAdmin } from './supabase';
import { analyzeRoom, generateRedesign } from './openai';
import { downloadFile, uploadBuffer } from './storage';

config();
const env = loadEnv();
const supabase = createSupabaseAdmin(env);

async function processOne() {
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!job) return false;

  const id = job.id as string;
  try {
    await supabase.from('jobs').update({ status: 'processing' }).eq('id', id);

    // Download input image via signed URL
    const imageBytes = await downloadFile(env, 'room_inputs', job.input_image_path);

    // Analyze
    const analysis = await analyzeRoom(env, imageBytes);

    // Generate redesign image
    const outputBuffer = await generateRedesign(env, analysis, job.style || 'modern', job.constraints || {});
    const outputPath = `${job.user_id}/${id}_v1.png`;
    await uploadBuffer(env, 'room_outputs', outputPath, outputBuffer);

    await supabase
      .from('jobs')
      .update({ status: 'complete', analysis, output_image_paths: [outputPath] })
      .eq('id', id);
    return true;
  } catch (e: any) {
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

