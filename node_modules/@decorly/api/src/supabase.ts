import { createClient } from '@supabase/supabase-js';
import type { Env } from './env';

export function createSupabaseAdmin(env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return supabase;
}

export async function getUserFromToken(env: Env, token: string) {
  const supabase = createSupabaseAdmin(env);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error('Invalid or expired token');
  }
  return data.user;
}

