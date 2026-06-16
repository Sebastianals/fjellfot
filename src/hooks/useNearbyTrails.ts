import { useEffect, useState } from 'react';

export type Trail = { id: string; name: string; lat: number; lng: number; km: number; kind: string; info: string; image: string };

// Representative Norwegian-hiking photos, picked deterministically per trail.
const PHOTOS = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=240&q=60',
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=240&q=60',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=240&q=60',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=240&q=60',
  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=240&q=60',
  'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=240&q=60',
];
const SAC: Record<string, string> = {
  hiking: 'Lett', mountain_hiking: 'Moderat', demanding_mountain_hiking: 'Krevende',
  alpine_hiking: 'Krevende', demanding_alpine_hiking: 'Svært krevende',
};
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

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
            const t = e.tags || {};
            if (!center?.lat || !t.name) return null;
            const kind = e.type === 'relation' ? 'Tursti' : 'Sti';
            const len = t.distance ? `${String(t.distance).replace('.', ',')} km` : '';
            const diff = SAC[t.sac_scale] || '';
            const info = [kind, len, diff].filter(Boolean).join(' · ');
            const img = typeof t.image === 'string' && t.image.startsWith('http') ? t.image : PHOTOS[hash(String(e.id)) % PHOTOS.length];
            return {
              id: String(e.id),
              name: t.name as string,
              lat: center.lat,
              lng: center.lon,
              km: +haversineKm(lat, lng, center.lat, center.lon).toFixed(1),
              kind,
              info,
              image: img,
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
