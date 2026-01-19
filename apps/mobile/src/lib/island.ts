import React from 'react';

export type BottomIslandCtx = { visible: boolean; setVisible: (v: boolean) => void };

export const BottomIslandContext = React.createContext<BottomIslandCtx | null>(null);

export function useBottomIsland() {
  const ctx = React.useContext(BottomIslandContext);
  if (!ctx) throw new Error('BottomIslandContext missing');
  return ctx;
}

