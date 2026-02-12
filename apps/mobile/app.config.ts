import 'dotenv/config';

// Export a plain Expo config (no nested `expo` key) so EAS/Expo CLI
// read version/buildNumber correctly in a monorepo.
export default ({ config }: any) => ({
  ...config,
  name: 'Decorly',
  slug: 'decorly-monorepo',
  scheme: 'decorly',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/App Logo.png',
  userInterfaceStyle: 'automatic',
  splash: {
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  ios: {
    bundleIdentifier: 'com.decorly.app',
    buildNumber: '66',
    icon: './assets/App Logo.png',
    infoPlist: {
      NSCameraUsageDescription: 'Used to capture room photos for redesigns.',
      NSPhotoLibraryAddUsageDescription: 'Saves redesigned images to your photo library.',
      NSPhotoLibraryUsageDescription: 'Allows selecting photos from your library for redesigns.',
      NSUserTrackingUsageDescription: 'Allow tracking to measure and improve ad performance.',
      FacebookAppID: '756211593884193',
      FacebookClientToken: 'c7541959cb2775a0b91e3c6a892fb4d2',
      FacebookDisplayName: 'Decorly',
      LSApplicationQueriesSchemes: ['fbapi', 'fb-messenger-share-api', 'fbauth2', 'fbshareextension'],
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ['fb756211593884193']
        }
      ],
      SKAdNetworkItems: [
        { SKAdNetworkIdentifier: 'v9wttpbfk9.skadnetwork' },
        { SKAdNetworkIdentifier: 'n38lu8286q.skadnetwork' }
      ],
      ITSAppUsesNonExemptEncryption: false
    }
  },
  // RevenueCat config plugin removed due to EAS plugin resolution error.
  // If you need a plugin, use the official Expo plugin package instead.
  extra: {
    SUPABASE_URL: 'https://zcgugmsysxvycpnkhibo.supabase.co',
    SUPABASE_ANON_KEY:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZ3VnbXN5c3h2eWNwbmtoaWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzI3MjMsImV4cCI6MjA4MzkwODcyM30.GxRjW3m9ULm_RJJZW85DqzHyuNAet3O6v1GZMZSHprI',
    // Use production URL when provided by EAS env, else fall back to local
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
    REVENUECAT_PUBLIC_SDK_KEY: 'appl_hVluoMtIVjQADTUPsEFPTiyZPwT',
    REVENUECAT_PUBLIC_SDK_KEY_IOS: 'appl_hVluoMtIVjQADTUPsEFPTiyZPwT',
    META_APP_ID: '756211593884193',
    META_CLIENT_TOKEN: 'c7541959cb2775a0b91e3c6a892fb4d2',
    META_DISPLAY_NAME: 'Decorly',
    eas: {
      projectId: '082ebae8-7b08-4de4-8f68-c329fc5d5502'
    }
  }
});
