import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AvatarDef } from '../data/avatars';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProfilePicture =
  | { type: 'photo';  uri: string }
  | { type: 'avatar'; avatar: AvatarDef }
  | null;

const PICTURE_KEY = '@profile_picture';

// ── Context ───────────────────────────────────────────────────────────────────

type Ctx = {
  picture:    ProfilePicture;
  setPicture: (p: ProfilePicture) => Promise<void>;
  refresh:    () => Promise<void>;
};

const ProfileContext = createContext<Ctx>({
  picture:    null,
  setPicture: async () => {},
  refresh:    async () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [picture, setState] = useState<ProfilePicture>(null);

  const refresh = useCallback(async () => {
    const raw = await AsyncStorage.getItem(PICTURE_KEY);
    setState(raw ? JSON.parse(raw) : null);
  }, []);

  useEffect(() => { refresh(); }, []);

  const setPicture = useCallback(async (p: ProfilePicture) => {
    setState(p);
    if (p) {
      await AsyncStorage.setItem(PICTURE_KEY, JSON.stringify(p));
    } else {
      await AsyncStorage.removeItem(PICTURE_KEY);
    }
  }, []);

  const value = useMemo(() => ({ picture, setPicture, refresh }), [picture, setPicture, refresh]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProfilePicture() {
  return useContext(ProfileContext);
}
