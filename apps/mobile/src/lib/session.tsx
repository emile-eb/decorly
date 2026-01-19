import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

type CtxType = { session: Session | null; userId: string | null; signOut: () => Promise<void> };
const Ctx = createContext<CtxType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
      } else {
        try {
          // Create an anonymous account/session on first launch (no user signup)
          await supabase.auth.signInAnonymously();
        } catch {}
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const signOut = async () => {
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
