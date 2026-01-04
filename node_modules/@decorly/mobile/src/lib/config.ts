import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra || {}) as Record<string, any>;

// Fallback to process.env on web and infer demo mode if Supabase creds missing
const SUPABASE_URL = String(extra.SUPABASE_URL ?? (process.env as any)?.SUPABASE_URL ?? '');
const SUPABASE_ANON_KEY = String(extra.SUPABASE_ANON_KEY ?? (process.env as any)?.SUPABASE_ANON_KEY ?? '');
const API_BASE_URL = String(extra.API_BASE_URL ?? (process.env as any)?.API_BASE_URL ?? '');
const REVENUECAT_PUBLIC_SDK_KEY = String(extra.REVENUECAT_PUBLIC_SDK_KEY ?? (process.env as any)?.REVENUECAT_PUBLIC_SDK_KEY ?? '');
const DEMO_MODE = Boolean(extra.DEMO_MODE ?? (!SUPABASE_URL || !SUPABASE_ANON_KEY));

export const CONFIG = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  API_BASE_URL,
  REVENUECAT_PUBLIC_SDK_KEY,
  DEMO_MODE
};
