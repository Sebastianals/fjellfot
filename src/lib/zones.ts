// Fog-of-war grid. Norway is sliced into fixed lat/lng cells; walking into a
// cell reveals it permanently. Cell ids are stored per user in Firestore.

// ~0.012° lat ≈ 1.3 km; lng scaled so cells stay roughly square at Norwegian latitudes.
export const CELL_LAT = 0.012;
export const CELL_LNG = 0.022;

export type Cell = { id: string; lat: number; lng: number };

export function cellIdFor(lat: number, lng: number): string {
  const r = Math.floor(lat / CELL_LAT);
  const c = Math.floor(lng / CELL_LNG);
  return `${r}_${c}`;
}

export function cellFromId(id: string): Cell {
  const [r, c] = id.split('_').map(Number);
  return { id, lat: r * CELL_LAT, lng: c * CELL_LNG };
}

// The four corners of a cell as a polygon ring (for react-native-maps holes).
export function cellPolygon(id: string): { latitude: number; longitude: number }[] {
  const { lat, lng } = cellFromId(id);
  return [
    { latitude: lat, longitude: lng },
    { latitude: lat + CELL_LAT, longitude: lng },
    { latitude: lat + CELL_LAT, longitude: lng + CELL_LNG },
    { latitude: lat, longitude: lng + CELL_LNG },
  ];
}

// Cells touching the current one, so a single GPS ping reveals a small patch
// rather than a lone square (feels better and tolerates GPS jitter).
export function cellsAround(lat: number, lng: number, ring = 1): string[] {
  const baseR = Math.floor(lat / CELL_LAT);
  const baseC = Math.floor(lng / CELL_LNG);
  const out: string[] = [];
  for (let dr = -ring; dr <= ring; dr++) {
    for (let dc = -ring; dc <= ring; dc++) {
      out.push(`${baseR + dr}_${baseC + dc}`);
    }
  }
  return out;
}

// Rough share of a bounding region explored, for the "% utforsket" stat.
export function explorePct(count: number, regionCells = 4000): number {
  return Math.min(100, (count / regionCells) * 100);
}
