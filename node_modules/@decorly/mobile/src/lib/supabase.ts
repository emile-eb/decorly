import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config';

let supabaseInstance: any;

if (CONFIG.DEMO_MODE) {
  const demoUser = { id: 'demo-user' } as any;
  supabaseInstance = {
    auth: {
      getSession: async () => ({ data: { session: { access_token: 'demo-token', user: demoUser } }, error: null }),
      getUser: async () => ({ data: { user: demoUser }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async (_: any) => ({ data: { user: demoUser, session: { access_token: 'demo-token' } }, error: null }),
      signUp: async (_: any) => ({ data: { user: demoUser }, error: null })
    },
    storage: {
      from: () => ({ upload: async () => ({ error: null }) })
    }
  };
} else {
  supabaseInstance = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      storageKey: 'decorly-auth'
    }
  });
}

export const supabase = supabaseInstance as ReturnType<typeof createClient> & { auth: any; storage: any };
