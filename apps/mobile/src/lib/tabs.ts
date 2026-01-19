import React from 'react';

export type Tab = 'Explore' | 'Discover' | 'Profile';

export const TabContext = React.createContext<{ tab: Tab; setTab: (t: Tab) => void } | null>(null);

export function useTabs() {
  const ctx = React.useContext(TabContext);
  if (!ctx) throw new Error('TabContext missing');
  return ctx;
}

