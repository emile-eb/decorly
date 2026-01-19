import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';
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

export async function uploadToInputs(userId: string | null, localUri: string): Promise<string> {
  let uid = userId;
  if (!uid) {
    try {
      const { data } = await supabase.auth.getSession();
      uid = (data.session as any)?.user?.id ?? null;
      if (!uid) {
        await supabase.auth.signInAnonymously();
        const { data: d2 } = await supabase.auth.getSession();
        uid = (d2.session as any)?.user?.id ?? null;
      }
    } catch (e: any) {
      console.error('[upload] ensure session failed', e);
    }
  }
  if (!uid) {
    throw new Error('No user session');
  }
  // Always upload to Supabase storage
  const resp = await fetch(localUri);
  const blob = await resp.blob();
  const ab = await blob.arrayBuffer();
  const bytes = new Uint8Array(ab);
  const fileName = `${uuidv4Compat()}.jpg`;
  const path = `${uid}/${fileName}`;
  const { error } = await supabase.storage.from('room_inputs').upload(path, bytes, {
    contentType: 'image/jpeg'
  });
  if (error) {
    console.error('[upload] storage.upload error', { path, error });
    throw error;
  }
  return path; // return storage path
}
