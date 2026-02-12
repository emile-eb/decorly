import { Platform } from 'react-native';
import { CONFIG } from './config';

let initialized = false;

async function getFbSdk() {
  if (Platform.OS === 'web') return null;
  try {
    return await import('react-native-fbsdk-next');
  } catch {
    return null;
  }
}

export async function initMeta() {
  if (initialized) return;
  if (!CONFIG.META_APP_ID || !CONFIG.META_CLIENT_TOKEN) return;
  const sdk = await getFbSdk();
  if (!sdk) return;
  try {
    const { Settings, AppEventsLogger } = sdk as any;
    Settings.setAppID(CONFIG.META_APP_ID);
    Settings.setClientToken(CONFIG.META_CLIENT_TOKEN);
    Settings.setAdvertiserIDCollectionEnabled(true);

    if (Platform.OS === 'ios') {
      try {
        const { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
        const existing = await getTrackingPermissionsAsync();
        const status = existing.status === 'undetermined'
          ? (await requestTrackingPermissionsAsync()).status
          : existing.status;
        Settings.setAdvertiserTrackingEnabled(status === 'granted');
      } catch {}
    }
    AppEventsLogger.logEvent('app_open');
    initialized = true;
  } catch {}
}

export async function trackEvent(name: string, params?: Record<string, any>) {
  const sdk = await getFbSdk();
  if (!sdk) return;
  try {
    const { AppEventsLogger } = sdk as any;
    AppEventsLogger.logEvent(name, 0, params || {});
  } catch {}
}

export async function trackPurchase(amount: number, currency = 'USD', params?: Record<string, any>) {
  const sdk = await getFbSdk();
  if (!sdk) return;
  try {
    const { AppEventsLogger } = sdk as any;
    AppEventsLogger.logPurchase(amount, currency, params || {});
  } catch {}
}
