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
const META_APP_ID = String(extra.META_APP_ID ?? (process.env as any)?.META_APP_ID ?? '');
const META_CLIENT_TOKEN = String(extra.META_CLIENT_TOKEN ?? (process.env as any)?.META_CLIENT_TOKEN ?? '');
const META_DISPLAY_NAME = String(extra.META_DISPLAY_NAME ?? (process.env as any)?.META_DISPLAY_NAME ?? '');

export const CONFIG = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  API_BASE_URL,
  REVENUECAT_PUBLIC_SDK_KEY,
  REVENUECAT_PUBLIC_SDK_KEY_IOS,
  META_APP_ID,
  META_CLIENT_TOKEN,
  META_DISPLAY_NAME
};
