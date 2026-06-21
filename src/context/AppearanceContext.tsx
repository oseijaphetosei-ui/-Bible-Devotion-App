import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePref = 'light' | 'dark' | 'system';

const PREF_KEY = '@theme_pref';

type Ctx = { pref: ThemePref; setPref: (p: ThemePref) => Promise<void> };

export const AppearanceContext = createContext<Ctx>({
  pref: 'system',
  setPref: async () => {},
});

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [pref, setState] = useState<ThemePref>('system');

  useEffect(() => {
    AsyncStorage.getItem(PREF_KEY).then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') setState(v);
    });
  }, []);

  const setPref = useCallback(async (p: ThemePref) => {
    setState(p);
    await AsyncStorage.setItem(PREF_KEY, p);
  }, []);

  const value = useMemo(() => ({ pref, setPref }), [pref, setPref]);

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
