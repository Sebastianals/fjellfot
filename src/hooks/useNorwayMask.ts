import { useEffect, useState } from 'react';

export type LatLng = { latitude: number; longitude: number };

// jsDelivr GitHub mirror — cached + reliable.
const URL = 'https://cdn.jsdelivr.net/gh/georgique/world-geojson@develop/countries/norway.json';

/**
 * Norway's national border as a downsampled ring, used to mask out everything
 * outside Norway on the map. Fetched once; returns null until ready (map shows
 * normally meanwhile, so a blocked fetch degrades gracefully).
 */
export function useNorwayMask() {
  const [ring, setRing] = useState<LatLng[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(URL)
      .then((r) => r.json())
      .then((j) => {
        const geom = j?.features?.[0]?.geometry;
        // Polygon → coords[0] is the outer ring; MultiPolygon → largest ring.
        let outer: any[] | undefined;
        if (geom?.type === 'Polygon') outer = geom.coordinates?.[0];
        else if (geom?.type === 'MultiPolygon') {
          outer = (geom.coordinates ?? [])
            .map((poly: any) => poly?.[0])
            .reduce((a: any, b: any) => ((b?.length ?? 0) > (a?.length ?? 0) ? b : a), []);
        }
        if (!Array.isArray(outer) || outer.length < 10) return;
        const step = Math.max(1, Math.floor(outer.length / 320));
        const pts: LatLng[] = [];
        for (let i = 0; i < outer.length; i += step) {
          const [lng, lat] = outer[i];
          if (typeof lat === 'number' && typeof lng === 'number') pts.push({ latitude: lat, longitude: lng });
        }
        if (alive && pts.length > 12) setRing(pts);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return ring;
}
