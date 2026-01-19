import { Platform } from 'react-native';
import { supabase } from './supabase';

export async function initPurchases() {
  if (Platform.OS === 'web') return;
  try {
    const Purchases = (await import('react-native-purchases')).default as any;
    const { data } = await supabase.auth.getSession();
    const appUserID = (data.session as any)?.user?.id || undefined;
    // Keys are read from CONFIG in native config; if not present, skip
    const { CONFIG } = await import('./config');
    const apiKey = Platform.select({ ios: (CONFIG as any).REVENUECAT_PUBLIC_SDK_KEY_IOS || CONFIG.REVENUECAT_PUBLIC_SDK_KEY, android: (CONFIG as any).REVENUECAT_PUBLIC_SDK_KEY_ANDROID || CONFIG.REVENUECAT_PUBLIC_SDK_KEY, default: undefined });
    if (!apiKey) return;
    await Purchases.configure({ apiKey, appUserID });
  } catch {}
}

export async function getCustomerInfo(): Promise<any> {
  if (Platform.OS === 'web') return { entitlements: { active: {} } } as any;
  try {
    const Purchases = (await import('react-native-purchases')).default as any;
    return await Purchases.getCustomerInfo();
  } catch {
    return { entitlements: { active: {} } } as any;
  }
}

