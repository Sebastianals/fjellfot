import { useEffect, useState } from 'react';

export type LatLng = { latitude: number; longitude: number };
export type RouteTrail = { id: string; name: string; coords: LatLng[]; mid: LatLng; km: number; image: string };

const WFS = 'https://wfs.geonorge.no/skwms1/wfs.turogfriluftsruter';
const PHOTOS = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=240&q=60',
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=240&q=60',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=240&q=60',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=240&q=60',
  'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=240&q=60',
];
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const km = (a: LatLng, b: LatLng) => {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude), dLng = toRad(b.longitude - a.longitude);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

// GML posList → points. Norway lat 55–73 / lng 3–33: detect axis order per pair.
function parsePosList(text: string): LatLng[] {
  const n = text.trim().split(/\s+/).map(Number).filter((x) => !isNaN(x));
  const pts: LatLng[] = [];
  for (let i = 0; i + 1 < n.length; i += 2) {
    const a = n[i], b = n[i + 1];
    const aIsLat = a >= 55 && a <= 73;
    pts.push(aIsLat ? { latitude: a, longitude: b } : { latitude: b, longitude: a });
  }
  return pts;
}

function parseGml(xml: string): RouteTrail[] {
  const out: RouteTrail[] = [];
  const blocks = xml.split(/<app:Fotrute\b/).slice(1);
  blocks.forEach((blk, idx) => {
    const coords: LatLng[] = [];
    const re = /<gml:posList[^>]*>([\s\S]*?)<\/gml:posList>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(blk))) coords.push(...parsePosList(m[1]));
    if (coords.length < 2) return;
    const nm = blk.match(/<app:rutenavn>([\s\S]*?)<\/app:rutenavn>/) || blk.match(/<app:navn>([\s\S]*?)<\/app:navn>/);
    const name = (nm ? nm[1] : '').trim().replace(/&amp;/g, '&') || 'Umerket tursti';
    let dist = 0;
    for (let i = 1; i < coords.length; i++) dist += km(coords[i - 1], coords[i]);
    const id = 'f' + idx + '_' + Math.round(coords[0].latitude * 1000);
    out.push({ id, name, coords, mid: coords[Math.floor(coords.length / 2)], km: +dist.toFixed(1), image: PHOTOS[hash(name) % PHOTOS.length] });
  });
  return out;
}

/**
 * Official Norwegian trails (Kartverket "Tur- og friluftsruter", app:Fotrute)
 * fetched by bounding box as you zoom in. WFS returns GML 3.2 (no JSON),
 * parsed here. Only queries when zoomed in enough to keep results local.
 */
export function useGeonorgeTrails(region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) {
  const [trails, setTrails] = useState<RouteTrail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const zoomedIn = region.latitudeDelta < 0.35;

  useEffect(() => {
    if (!zoomedIn) { setTrails([]); return; }
    let alive = true;
    const minLat = region.latitude - region.latitudeDelta / 2;
    const maxLat = region.latitude + region.latitudeDelta / 2;
    const minLng = region.longitude - region.longitudeDelta / 2;
    const maxLng = region.longitude + region.longitudeDelta / 2;
    const bbox = `${minLat},${minLng},${maxLat},${maxLng},urn:ogc:def:crs:EPSG::4326`;
    const url = `${WFS}?service=WFS&version=2.0.0&request=GetFeature&typeNames=app:Fotrute&count=60&srsName=urn:ogc:def:crs:EPSG::4326&bbox=${encodeURIComponent(bbox)}`;

    setLoading(true); setError(false);
    fetch(url)
      .then((r) => r.text())
      .then((txt) => { if (alive) setTrails(parseGml(txt)); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [Math.round(region.latitude * 40), Math.round(region.longitude * 40), zoomedIn]);

  return { trails, loading, error, zoomedIn };
}
