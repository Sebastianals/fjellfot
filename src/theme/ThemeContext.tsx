import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { light, dark, Palette } from './theme';

type Mode = 'system' | 'light' | 'dark';

type ThemeCtx = {
  c: Palette;
  mode: Mode;
  isDark: boolean;
  setMode: (m: Mode) => void;
  toggle: () => void;
};

const Ctx = createContext<ThemeCtx>({
  c: light,
  mode: 'system',
  isDark: false,
  setMode: () => {},
  toggle: () => {},
});

const KEY = 'fjellfot.themeMode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
    });
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m);
  }, []);

  const resolved = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const isDark = resolved === 'dark';
  const c = isDark ? dark : light;

  const toggle = useCallback(() => setMode(isDark ? 'light' : 'dark'), [isDark, setMode]);

  return <Ctx.Provider value={{ c, mode, isDark, setMode, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
