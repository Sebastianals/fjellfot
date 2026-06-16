# Apple Health (HealthKit) — advanced step source

The in-app pedometer (`expo-sensors`) already gives **live today + 7-day history** and works in **Expo Go right now**. HealthKit adds deeper history, floors climbed, heart rate, and works even when the app hasn't been opened — but HealthKit **cannot run in Expo Go**; it needs a **development build**.

## 1. Add the library (dev build only)
```bash
npx expo install @kingstinct/react-native-healthkit
npx expo install expo-dev-client
```
Add the config plugin + entitlement in `app.json`:
```json
"plugins": [
  ["@kingstinct/react-native-healthkit", { "NSHealthShareUsageDescription": "Fjellfot leser skritt fra Apple Health." }]
]
```

## 2. Drop-in hook (`src/hooks/useHealthSteps.ts`)
Keep the pedometer as the fallback so Expo Go still works:
```ts
import { useEffect, useState } from 'react';
import { usePedometer } from './usePedometer';

let HK: any = null;
try { HK = require('@kingstinct/react-native-healthkit'); } catch {}

export function useHealthSteps() {
  const pedometer = usePedometer(0);          // Expo Go / fallback
  const [hkSteps, setHkSteps] = useState<number | null>(null);

  useEffect(() => {
    if (!HK?.isHealthDataAvailable) return;    // not a dev build → use pedometer
    (async () => {
      try {
        await HK.requestAuthorization(['HKQuantityTypeIdentifierStepCount']);
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const res = await HK.queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], start, new Date());
        setHkSteps(Math.round(res?.sumQuantity?.quantity ?? 0));
      } catch {}
    })();
  }, []);

  return { steps: hkSteps ?? pedometer.steps, week: pedometer.week, source: hkSteps != null ? 'health' : 'pedometer' };
}
```
The `require` in a `try/catch` keeps it out of the Expo Go bundle (the module isn't installed there), so the app keeps bundling. In a dev build, the module resolves and HealthKit takes over.

## 3. Build & run
```bash
eas build --profile development --platform ios
npx expo start --dev-client
```

Then swap `usePedometer()` for `useHealthSteps()` on the Home screen.
