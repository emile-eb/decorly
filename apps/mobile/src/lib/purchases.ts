import { Linking, Platform } from 'react-native';
import { CONFIG } from './config';
import { supabase } from './supabase';

let initialized = false;
let Purchases: any | null = null;

export async function initPurchases() {
  if (initialized) return;
  if (CONFIG.DEMO_MODE) {
    initialized = true;
    return;
  }
  if (Platform.OS === 'web') {
    // No purchases on web
    initialized = true;
    return;
  }
  if (!Purchases) {
    const mod: any = await import('react-native-purchases');
    Purchases = mod.default ?? mod;
  }
  await Purchases.configure({ apiKey: CONFIG.REVENUECAT_PUBLIC_SDK_KEY });
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (uid) {
    await Purchases.logIn(uid);
  }
  initialized = true;
}

export async function getOfferings() {
  await initPurchases();
  if (CONFIG.DEMO_MODE) {
    return { current: { availablePackages: [{ identifier: 'demo', product: { priceString: '$0.00' } }] } } as any;
  }
  return Purchases.getOfferings();
}

export async function purchasePackage(pkg: any) {
  await initPurchases();
  if (CONFIG.DEMO_MODE) {
    return { customerInfo: { entitlements: { active: { pro: {} } } } } as any;
  }
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  await initPurchases();
  if (CONFIG.DEMO_MODE) {
    return { customerInfo: {} } as any;
  }
  return Purchases.restorePurchases();
}

export async function getCustomerInfo() {
  await initPurchases();
  if (CONFIG.DEMO_MODE) {
    return { entitlements: { active: { pro: { latestPurchaseDate: new Date().toISOString() } } }, latestExpirationDate: null } as any;
  }
  if (Platform.OS === 'web') {
    return { entitlements: { active: {} }, latestExpirationDate: null } as any;
  }
  return Purchases.getCustomerInfo();
}

export async function openManageSubscriptions() {
  // Always defer to the platform storefront pages
  const iosUrl = 'itms-apps://apps.apple.com/account/subscriptions';
  const androidUrl = 'https://play.google.com/store/account/subscriptions';
  const url = Platform.OS === 'ios' ? iosUrl : Platform.OS === 'android' ? androidUrl : 'https://support.apple.com/en-us/HT202039';
  try {
    const can = await Linking.canOpenURL(url);
    await Linking.openURL(can ? url : 'https://support.apple.com/en-us/HT202039');
  } catch {
    // no-op
  }
}
