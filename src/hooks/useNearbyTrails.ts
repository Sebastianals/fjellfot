import { useEffect, useState } from 'react';

export type Trail = { id: string; name: string; lat: number; lng: number; km: number; kind: string };

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

async function queryOverpass(body: string): Promise<any> {
  let lastErr: any;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { method: 'POST', body });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/**
 * Live hiking trails near a coordinate, from OpenStreetMap via Overpass.
 * Real data (the same network shown on the trail overlay) — named hiking
 * routes and paths within ~6 km, sorted by distance.
 */
export function useNearbyTrails(lat: number, lng: number) {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const q = `[out:json][timeout:25];(
      relation["route"="hiking"]["name"](around:8000,${lat},${lng});
      way["highway"~"path|footway|track"]["name"](around:4000,${lat},${lng});
    );out tags center 60;`;

    setLoading(true); setError(false);
    queryOverpass('data=' + encodeURIComponent(q))
      .then((j) => {
        if (!alive) return;
        const seen = new Set<string>();
        const list: Trail[] = (j.elements || [])
          .map((e: any) => {
            const center = e.center || { lat: e.lat, lon: e.lon };
            if (!center?.lat || !e.tags?.name) return null;
            return {
              id: String(e.id),
              name: e.tags.name as string,
              lat: center.lat,
              lng: center.lon,
              km: +haversineKm(lat, lng, center.lat, center.lon).toFixed(1),
              kind: e.type === 'relation' ? 'Tursti' : 'Sti',
            } as Trail;
          })
          .filter((t: Trail | null): t is Trail => {
            if (!t || seen.has(t.name)) return false;
            seen.add(t.name);
            return true;
          })
          .sort((a: Trail, b: Trail) => a.km - b.km)
          .slice(0, 30);
        setTrails(list);
      })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [Math.round(lat * 100), Math.round(lng * 100)]);

  return { trails, loading, error };
}
