import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { cellsAround } from '../lib/zones';
import { revealCells, subscribeZones } from '../lib/db';

type Status = 'idle' | 'granted' | 'denied';

/**
 * Live fog-of-war exploration.
 * - Subscribes to the user's already-revealed cells in Firestore.
 * - Requests foreground location and, as the user moves, reveals the cells
 *   around their position (persisted to Firestore).
 *
 * Foreground location works in Expo Go. Background tracking (revealing while
 * the app is closed) needs a development build — see README.
 */
export function useExploration(uid: string | undefined) {
  const [cells, setCells] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const watcher = useRef<Location.LocationSubscription | null>(null);
  const known = useRef<Set<string>>(new Set());

  // Firestore -> local
  useEffect(() => {
    if (!uid) return;
    return subscribeZones(uid, (ids) => {
      known.current = new Set(ids);
      setCells(ids);
    });
  }, [uid]);

  // Location -> reveal
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;
      if (perm !== 'granted') { setStatus('denied'); return; }
      setStatus('granted');

      const reveal = async (lat: number, lng: number) => {
        setPosition({ latitude: lat, longitude: lng });
        const around = cellsAround(lat, lng, 1);
        const fresh = around.filter((id) => !known.current.has(id));
        if (fresh.length) {
          fresh.forEach((id) => known.current.add(id));
          setCells(Array.from(known.current));
          revealCells(uid, fresh).catch(() => {});
        }
      };

      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
      if (cur && mounted) reveal(cur.coords.latitude, cur.coords.longitude);

      watcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 60, timeInterval: 10000 },
        (loc) => reveal(loc.coords.latitude, loc.coords.longitude),
      );
    })();

    return () => { mounted = false; watcher.current?.remove(); };
  }, [uid]);

  return { cells, status, position };
}
