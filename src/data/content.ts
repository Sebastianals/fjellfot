// Static app content (design/config, not user data).

// Tier ladder — keyed to level ranges.
export const ladder = [
  { name: 'Turgåer', range: 'Nivå 1-5 · fra 0 skritt', min: 0 },
  { name: 'Stifinner', range: 'Nivå 6-10 · 250k skritt', min: 250000 },
  { name: 'Fjellvandrer', range: 'Nivå 11-19 · 800k skritt', min: 800000 },
  { name: 'Toppturist', range: 'Nivå 20-29 · 2M skritt', min: 2000000 },
  { name: 'Villmarksjeger', range: 'Nivå 30+ · 5M skritt', min: 5000000 },
];

// Achievement definitions. `need` = total steps to unlock (rough demo rule).
export const achievements = [
  { name: 'Første tur', need: 1, c1: '#3fb56e', c2: '#2a8a4f', icon: 'leaf' },
  { name: '10k på en dag', need: 10000, c1: '#FF8A47', c2: '#E2480A', icon: 'flame' },
  { name: '100k totalt', need: 100000, c1: '#5b8def', c2: '#3a6fd8', icon: 'pulse' },
  { name: '500k totalt', need: 500000, c1: '#f0a93c', c2: '#d97f1a', icon: 'sunny' },
  { name: '1M totalt', need: 1000000, c1: '#9c6b8a', c2: '#7a4f6b', icon: 'triangle' },
  { name: '5 fylker', need: 99999999, c1: '#3a6fd8', c2: '#5b8def', icon: 'map' },
];

export const tierForLevel = (level: number) =>
  level >= 30 ? 'Villmarksjeger' : level >= 20 ? 'Toppturist' : level >= 11 ? 'Fjellvandrer' : level >= 6 ? 'Stifinner' : 'Turgåer';

export const diffColor: Record<string, { bg: string; fg: string }> = {
  Lett: { bg: 'rgba(63,181,110,0.15)', fg: '#2a8a4f' },
  Moderat: { bg: 'rgba(232,177,76,0.18)', fg: '#a07a1a' },
  Krevende: { bg: 'rgba(255,107,26,0.14)', fg: '#E2480A' },
};
