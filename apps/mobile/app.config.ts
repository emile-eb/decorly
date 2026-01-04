import 'dotenv/config';

export default ({ config }: any) => ({
  expo: {
    name: 'Decorly',
    slug: 'decorly',
    scheme: 'decorly',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.decorly.app',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'Used to capture room photos for redesigns.',
        NSPhotoLibraryAddUsageDescription: 'Saves redesigned images to your photo library.'
      }
    },
    android: {
      package: 'com.decorly.app'
    },
    // No native plugins needed for demo/web preview.
    // Add RevenueCat plugin only for native builds if needed later.
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      API_BASE_URL: process.env.API_BASE_URL,
      REVENUECAT_PUBLIC_SDK_KEY: process.env.REVENUECAT_PUBLIC_SDK_KEY,
      DEMO_MODE: process.env.DEMO_MODE === 'true' || !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: 'REPLACE_WITH_EAS_PROJECT_ID'
      }
    }
  }
});
