import type { Env } from './env';
import { createSupabaseAdmin } from './supabase';

export async function createSignedUrl(env: Env, bucket: string, path: string, expiresIn = 60 * 60) {
  const supabase = createSupabaseAdmin(env);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) throw error || new Error('signed url failed');
  return data.signedUrl;
}

export async function downloadFile(env: Env, bucket: string, path: string): Promise<Uint8Array> {
  const url = await createSignedUrl(env, bucket, path, 60);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

export async function uploadBuffer(env: Env, bucket: string, path: string, buffer: Buffer) {
  const supabase = createSupabaseAdmin(env);
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: 'image/png',
    upsert: true
  });
  if (error) throw error;
}

