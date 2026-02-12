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

export async function isPro(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    await initPurchases();
    const info = await getCustomerInfo();
    const active = (info as any)?.entitlements?.active || {};
    return Boolean(active?.pro);
  } catch {
    return false;
  }
}


export async function getOfferings(): Promise<any> {
  if (Platform.OS === 'web') return { current: null, all: {} } as any;
  try {
    const Purchases = (await import('react-native-purchases')).default as any;
    return await Purchases.getOfferings();
  } catch {
    return { current: null, all: {} } as any;
  }
}

export async function purchasePackage(pkg: any): Promise<any> {
  if (Platform.OS === 'web') throw new Error('Purchases unavailable on web');
  const Purchases = (await import('react-native-purchases')).default as any;
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases(): Promise<any> {
  if (Platform.OS === 'web') return null;
  try {
    const Purchases = (await import('react-native-purchases')).default as any;
    return await Purchases.restorePurchases();
  } catch {
    return null;
  }
}
