import type { Env } from './env.js';
import { createSupabaseAdmin } from './supabase.js';

export async function createSignedUrl(env: Env, bucket: string, path: string, expiresIn = 60 * 60) {
  const supabase = createSupabaseAdmin(env);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) throw error || new Error('signed url failed');
  return data.signedUrl;
}

// Option A: Download directly via Supabase Storage using service role (no signed URLs)
export async function downloadFromStorage(env: Env, bucket: string, path: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const supabase = createSupabaseAdmin(env);
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) throw error || new Error('storage.download failed');
  const ab = await data.arrayBuffer();
  const bytes = new Uint8Array(ab);
  const contentType = (data as any).type || 'application/octet-stream';
  return { bytes, contentType };
}

// Legacy helper kept for API routes that mint signed URLs for the client
export async function downloadFile(env: Env, bucket: string, path: string): Promise<Uint8Array> {
  const url = await createSignedUrl(env, bucket, path, 60);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

export async function uploadBuffer(env: Env, bucket: string, path: string, buffer: Buffer, contentType = 'image/png') {
  const supabase = createSupabaseAdmin(env);
  let lastErr: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
        contentType,
        upsert: true
      });
      if (error) throw error;
      return;
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || e);
      // Log richer context to help diagnose
      console.error('[storage] upload failed', { bucket, path, attempt, error: msg });
      // Retry only on network-ish/transient errors
      const transient = /fetch failed|ECONNRESET|ENOTFOUND|ETIMEDOUT|EAI_AGAIN/i.test(msg);
      if (attempt < 3 && transient) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      break;
    }
  }
  throw lastErr;
}
