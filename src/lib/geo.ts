export function haversineM(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000;
  const p1 = (aLat * Math.PI) / 180;
  const p2 = (bLat * Math.PI) / 180;
  const dp = ((bLat - aLat) * Math.PI) / 180;
  const dl = ((bLon - aLon) * Math.PI) / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function project(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom;
  const s = Math.sin((lat * Math.PI) / 180);
  const x = ((lon + 180) / 360) * n * 256;
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n * 256;
  return { x, y };
}

export function unproject(x: number, y: number, zoom: number): { lat: number; lon: number } {
  const n = 2 ** zoom;
  const lon = (x / (n * 256)) * 360 - 180;
  const t = Math.PI * (1 - (2 * y) / (n * 256));
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(t));
  return { lat, lon };
}

export function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}
