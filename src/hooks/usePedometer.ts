import { useEffect, useState } from 'react';
import { Pedometer } from 'expo-sensors';

export type WeekDay = { label: string; steps: number };
const DAYS = ['S', 'M', 'T', 'O', 'T', 'F', 'L']; // nb. søn..lør

/**
 * Live step tracking via the device pedometer (works in Expo Go:
 * iOS CMPedometer / Android step sensor).
 *  - `steps`     today's live count (updates as you walk)
 *  - `week`      last 7 days of daily totals (iOS historical query)
 *  - `available` whether the sensor exists / permission granted
 */
export function usePedometer(fallback = 0) {
  const [steps, setSteps] = useState<number>(fallback);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [week, setWeek] = useState<WeekDay[]>([]);

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    let mounted = true;
    let baseline = 0;

    (async () => {
      const isAvailable = await Pedometer.isAvailableAsync().catch(() => false);
      if (!mounted) return;
      setAvailable(isAvailable);
      if (!isAvailable) return;

      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      try {
        const past = await Pedometer.getStepCountAsync(midnight, new Date());
        if (mounted && past) { baseline = past.steps; setSteps(past.steps); }
      } catch {
        /* historical query unsupported (e.g. Android) — rely on the live watcher */
      }

      // Last 7 days, oldest → newest (iOS supports per-day historical queries).
      try {
        const days: WeekDay[] = [];
        for (let i = 6; i >= 0; i--) {
          const s = new Date(); s.setDate(s.getDate() - i); s.setHours(0, 0, 0, 0);
          const e = new Date(s); e.setHours(23, 59, 59, 999);
          const r = await Pedometer.getStepCountAsync(s, e).catch(() => null);
          days.push({ label: DAYS[s.getDay()], steps: r?.steps ?? 0 });
        }
        if (mounted) setWeek(days);
      } catch {
        /* ignore */
      }

      sub = Pedometer.watchStepCount((res) => {
        if (mounted) setSteps(baseline + res.steps);
      });
    })();

    return () => { mounted = false; sub?.remove(); };
  }, []);

  return { steps, available, week };
}
