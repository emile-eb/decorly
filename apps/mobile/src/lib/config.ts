import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra || {}) as Record<string, any>;

// Fallback to process.env on web
const SUPABASE_URL = String(extra.SUPABASE_URL ?? (process.env as any)?.SUPABASE_URL ?? '');
const SUPABASE_ANON_KEY = String(extra.SUPABASE_ANON_KEY ?? (process.env as any)?.SUPABASE_ANON_KEY ?? '');
const RAW_API_BASE_URL = String(extra.API_BASE_URL ?? (process.env as any)?.API_BASE_URL ?? '');
// Normalize to avoid double slashes when joining paths
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');
const REVENUECAT_PUBLIC_SDK_KEY = String(extra.REVENUECAT_PUBLIC_SDK_KEY ?? (process.env as any)?.REVENUECAT_PUBLIC_SDK_KEY ?? '');
const REVENUECAT_PUBLIC_SDK_KEY_IOS = String(extra.REVENUECAT_PUBLIC_SDK_KEY_IOS ?? (process.env as any)?.REVENUECAT_PUBLIC_SDK_KEY_IOS ?? '');

export const CONFIG = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  API_BASE_URL,
  REVENUECAT_PUBLIC_SDK_KEY,
  REVENUECAT_PUBLIC_SDK_KEY_IOS
};
