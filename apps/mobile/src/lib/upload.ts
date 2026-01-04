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

export async function uploadToInputs(userId: string | null, localUri: string): Promise<string> {
  if (!userId) {
    throw new Error('No user ID provided');
  }
  if (CONFIG.DEMO_MODE) {
    // In demo, skip upload and just echo local URI
    return `demo://${encodeURIComponent(localUri)}`;
  }
  const resp = await fetch(localUri);
  const blob = await resp.blob();
  const ab = await blob.arrayBuffer();
  const bytes = new Uint8Array(ab);
  const fileName = `${crypto.randomUUID()}.jpg`;
  const path = `${userId}/${fileName}`;
  const { error } = await supabase.storage.from('room_inputs').upload(path, bytes, {
    contentType: 'image/jpeg'
  });
  if (error) throw error;
  return path; // return storage path
}
