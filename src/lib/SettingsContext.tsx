import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Units = 'metric' | 'imperial';

type Settings = {
  units: Units;
  language: 'nb' | 'en';
  push: boolean;
  streak: boolean;
  weather: boolean;
  healthSync: boolean;
};

const DEFAULTS: Settings = { units: 'metric', language: 'nb', push: true, streak: true, weather: false, healthSync: false };

type Ctx = Settings & {
  set: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  /** Format a distance given in km according to the chosen units. */
  fmtDistance: (km: number) => string;
};

const SettingsCtx = createContext<Ctx>({ ...DEFAULTS, set: () => {}, fmtDistance: () => '' });
const KEY = 'fjellfot.settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => { if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) }); });
  }, []);

  const set = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => {
    setS((prev) => { const next = { ...prev, [k]: v }; AsyncStorage.setItem(KEY, JSON.stringify(next)); return next; });
  }, []);

  const fmtDistance = useCallback((km: number) => {
    if (s.units === 'imperial') return `${(km * 0.621371).toFixed(1).replace('.', ',')} mi`;
    return `${km.toFixed(1).replace('.', ',')} km`;
  }, [s.units]);

  return <SettingsCtx.Provider value={{ ...s, set, fmtDistance }}>{children}</SettingsCtx.Provider>;
}

export const useSettings = () => useContext(SettingsCtx);
