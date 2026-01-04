import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { CONFIG } from './config';

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

type CtxType = { session: Session | null; userId: string | null; signOut: () => Promise<void> };
const Ctx = createContext<CtxType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (CONFIG.DEMO_MODE) {
      // Fake session for demo
      setSession({ access_token: 'demo', user: { id: 'demo-user' } } as any);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const signOut = async () => {
    if (CONFIG.DEMO_MODE) {
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  };
  const userId = (session as any)?.user?.id ?? null;
  return <Ctx.Provider value={{ session, userId, signOut }}>{children}</Ctx.Provider>;
}

export function useSessionGate() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('SessionProvider missing');
  return ctx;
}
