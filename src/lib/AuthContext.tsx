import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { ensureProfile, subscribeProfile, Profile } from './db';

type AuthCtx = {
  user: User | null;
  profile: Profile | null;
  ready: boolean;          // initial auth state resolved
  profileLoaded: boolean;  // Firestore profile fetched at least once
  /** Called from the profile-setup screen for a brand-new user. */
  completeProfile: (name: string, city: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null, profile: null, ready: false, profileLoaded: false,
  completeProfile: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); }), []);

  useEffect(() => {
    setProfile(null);
    setProfileLoaded(false);
    if (!user) return;
    const unsub = subscribeProfile(user.uid, (p) => { setProfile(p); setProfileLoaded(true); });
    // Safety net: never hang on a black screen if Firestore is slow/unreachable.
    const timer = setTimeout(() => setProfileLoaded(true), 6000);
    return () => { unsub(); clearTimeout(timer); };
  }, [user?.uid]);

  const completeProfile = async (name: string, city: string) => {
    if (!user) return;
    // Don't await the server ack — the local write updates the cache immediately
    // (latency compensation), so the UI advances even on a poor connection.
    ensureProfile(user.uid, name, city).catch(() => {});
  };

  const signOut = async () => { await fbSignOut(auth); };

  return (
    <Ctx.Provider value={{ user, profile, ready, profileLoaded, completeProfile, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
