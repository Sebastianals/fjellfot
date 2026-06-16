// Design tokens lifted straight from the Fjellfot web prototype.
export type Palette = {
  snow: string;
  surface: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  ember: string;
  emberDeep: string;
  emberGlow: string;
  stone: string;
  stoneLine: string;
  gold: string;
  silver: string;
  bronze: string;
  mapBase: string;
  isDark: boolean;
};

export const light: Palette = {
  snow: '#FBFAF7',
  surface: '#FFFFFF',
  ink: '#16120F',
  inkSoft: '#6A625B',
  inkFaint: '#A89F96',
  ember: '#FF6B1A',
  emberDeep: '#E2480A',
  emberGlow: 'rgba(255,107,26,0.14)',
  stone: '#EFEBE4',
  stoneLine: '#E3DDD3',
  gold: '#E8B14C',
  silver: '#A9AFBC',
  bronze: '#C08A55',
  mapBase: '#E6E1D8',
  isDark: false,
};

export const dark: Palette = {
  snow: '#0E0C0B',
  surface: '#1A1613',
  ink: '#F6F2EC',
  inkSoft: '#A39A8F',
  inkFaint: '#6B635A',
  ember: '#FF6B1A',
  emberDeep: '#E2480A',
  emberGlow: 'rgba(255,107,26,0.18)',
  stone: '#241F1B',
  stoneLine: '#2E2823',
  gold: '#E8B14C',
  silver: '#A9AFBC',
  bronze: '#C08A55',
  mapBase: '#221C17',
  isDark: true,
};

export const radius = { sm: 12, md: 18, lg: 24, xl: 32 };
export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 28 };

export const font = {
  // Loaded via @expo-google-fonts in App.tsx
  display: 'Sora_800ExtraBold',
  heading: 'Sora_700Bold',
  semi: 'Sora_600SemiBold',
  body: 'Inter_500Medium',
  bodyBold: 'Inter_700Bold',
};
