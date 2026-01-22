import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { CONFIG } from './config';

export async function compressImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1600 } }], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG
  });
  return result.uri;
}

function uuidv4Compat() {
  // RFC4122 v4, via crypto.getRandomValues (polyfilled by react-native-get-random-values)
  const bytes = new Uint8Array(16);
  (global as any).crypto?.getRandomValues?.(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function ensureSessionUserId(): Promise<string> {
  // Try a few times to avoid races where the anon session isn't ready yet
  for (let i = 0; i < 3; i++) {
    const u = (await supabase.auth.getUser()).data.user as any;
    if (u?.id) return u.id as string;
    try {
      await supabase.auth.signInAnonymously();
    } catch {}
    await new Promise((r) => setTimeout(r, 250 * (i + 1)));
  }
  const u2 = (await supabase.auth.getUser()).data.user as any;
  if (u2?.id) return u2.id as string;
  throw new Error('No user session');
}

async function getAuthHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('No auth session');
  return { Authorization: `Bearer ${token}` };
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

async function uploadViaApi(localUri: string, mime = 'image/jpeg', ext = 'jpg'): Promise<string> {
  if (!CONFIG.API_BASE_URL) throw new Error('API_BASE_URL is not set');
  const headers = await getAuthHeader();
  const payload: any = { mime, ext };

  if (typeof window !== 'undefined') {
    const resp = await fetch(localUri);
    const blob = await resp.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read image in web runtime'));
      reader.readAsDataURL(blob);
    });
    payload.dataUrl = dataUrl;
  } else {
    const b64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
    payload.base64 = b64;
  }

  const url = joinUrl(CONFIG.API_BASE_URL, '/v1/uploads');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed with status ${res.status}`);
  }
  const json = (await res.json()) as { path: string };
  if (!json?.path) throw new Error('Upload response missing path');
  return json.path;
}

export async function uploadToInputs(_userId: string | null, localUri: string): Promise<string> {
  const session = await supabase.auth.getSession();
  console.log('[debug] session user', session.data.session?.user?.id, 'has token', Boolean(session.data.session?.access_token));
  const user = await supabase.auth.getUser();
  console.log('[debug] getUser', user.data.user?.id);
  // Prefer API upload for both web and native to avoid Storage RLS failures
  try {
    return await uploadViaApi(localUri, 'image/jpeg', 'jpg');
  } catch (e: any) {
    console.error('[upload] api upload failed, falling back to storage', e?.message || e);
  }

  // Always derive folder prefix from the CURRENT auth session to satisfy RLS
  const uid = await ensureSessionUserId();
  console.log('[upload] using uid for storage path', uid);
  // Build destination path once
  const fileName = `${uuidv4Compat()}.jpg`;
  const path = `${uid}/${fileName}`;

  // Web: must upload a real Blob/File (RN file object won't work on web)
  if (typeof window !== 'undefined') {
    let blob: Blob | null = null;
    try {
      const resp = await fetch(localUri);
      blob = await resp.blob();
    } catch {}
    if (!blob || (blob as any).size === 0) {
      throw new Error('Unable to read image in web runtime');
    }
    const fileObj = new File([blob], fileName, { type: 'image/jpeg' });
    const { error } = await supabase.storage.from('room_inputs').upload(path, fileObj as any, {
      contentType: 'image/jpeg',
      upsert: true
    } as any);
    if (error) {
      const msg = (error as any)?.message || String(error);
      console.error('[upload] storage.upload error', { path, error: msg });
      if (/row-level security/i.test(msg)) {
        return uploadViaApi(localUri, 'image/jpeg', 'jpg');
      }
      throw new Error(msg);
    }
    return path;
  }
  // Always upload to Supabase storage
  // Strategy 1: RN File-like object (uri, name, type) — most reliable on iOS release/TestFlight
  const rnFile: any = { uri: localUri, name: fileName, type: 'image/jpeg' };
  try {
    const up1 = await supabase.storage.from('room_inputs').upload(path, rnFile as any, { contentType: 'image/jpeg', upsert: true } as any);
    if (!up1.error) return path;
  } catch {}

  // Strategy 2: fetch(uri).blob() → fallback
  let blob: Blob | null = null;
  try {
    const resp = await fetch(localUri);
    blob = await resp.blob();
  } catch {}

  // In some iOS/TestFlight cases, fetch(file://) returns an empty blob.
  // Fallback: read as base64 and rehydrate to a Blob via data URL.
  if (!blob || (typeof (blob as any).size === 'number' && (blob as any).size === 0)) {
    try {
      const b64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
      const dataUrl = `data:image/jpeg;base64,${b64}`;
      const r2 = await fetch(dataUrl);
      blob = await r2.blob();
    } catch (e) {
      console.error('[upload] fallback read failed', e);
      throw new Error('Unable to read image data');
    }
  }
  // path already defined above
  // Prefer uploading the Blob object in RN/Expo for best compatibility
  const { error } = await supabase.storage.from('room_inputs').upload(path, blob as any, {
    contentType: 'image/jpeg',
    upsert: true
  } as any);
  if (error) {
    const msg = (error as any)?.message || String(error);
    console.error('[upload] storage.upload error', { path, error: msg });
    if (/row-level security/i.test(msg)) {
      return uploadViaApi(localUri, 'image/jpeg', 'jpg');
    }
    throw new Error(msg);
  }
  return path; // return storage path
}
