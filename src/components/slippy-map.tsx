import { useEffect, useMemo, useRef, useState } from "react";
import type { Place } from "@/lib/domain";
import { metersPerPixel, project, unproject } from "@/lib/geo";

type Props = {
  center: { lat: number; lon: number };
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  radiusM: number;
};

export function SlippyMap({ center, places, selectedId, onSelect, radiusM }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: { x: number; y: number }; z: number } | null>(null);
  const [size, setSize] = useState({ w: 640, h: 320 });
  const [view, setView] = useState({ lat: center.lat, lon: center.lon, z: 13 });

  useEffect(() => {
    setView((v) => ({ ...v, lat: center.lat, lon: center.lon }));
  }, [center.lat, center.lon]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const apply = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const origin = project(view.lat, view.lon, view.z);
  const tiles = useMemo(() => {
    const left = origin.x - size.w / 2;
    const top = origin.y - size.h / 2;
    const x0 = Math.floor(left / 256);
    const y0 = Math.floor(top / 256);
    const x1 = Math.floor((left + size.w) / 256);
    const y1 = Math.floor((top + size.h) / 256);
    const max = 2 ** view.z;
    const list: Array<{ key: string; href: string; left: number; top: number }> = [];
    for (let x = x0; x <= x1; x += 1) {
      for (let y = y0; y <= y1; y += 1) {
        if (y < 0 || y >= max) continue;
        const wrapped = ((x % max) + max) % max;
        list.push({
          key: `${view.z}-${x}-${y}`,
          href: `https://tile.openstreetmap.org/${view.z}/${wrapped}/${y}.png`,
          left: x * 256 - left,
          top: y * 256 - top,
        });
      }
    }
    return list;
  }, [origin.x, origin.y, size.w, size.h, view.z]);

  const mpp = metersPerPixel(view.lat, view.z);
  const radiusPx = radiusM / mpp;

  function markerStyle(place: Place): { left: number; top: number } {
    const p = project(place.lat, place.lon, view.z);
    return { left: p.x - origin.x + size.w / 2, top: p.y - origin.y + size.h / 2 };
  }

  return (
    <div
      ref={wrapRef}
      className="relative h-72 w-full touch-none overflow-hidden rounded-card border border-line bg-line select-none md:h-96"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          x: event.clientX,
          y: event.clientY,
          px: project(view.lat, view.lon, view.z),
          z: view.z,
        };
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (!start || start.z !== view.z) return;
        const next = unproject(start.px.x - (event.clientX - start.x), start.px.y - (event.clientY - start.y), view.z);
        setView((v) => ({ ...v, lat: next.lat, lon: next.lon }));
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      {tiles.map((tile) => (
        <img
          key={tile.key}
          src={tile.href}
          alt=""
          draggable={false}
          className="pointer-events-none absolute h-64 w-64 max-w-none"
          style={{ left: tile.left, top: tile.top }}
        />
      ))}
      <div
        className="pointer-events-none absolute rounded-full border-2 border-primary/70 bg-primary/10"
        style={{
          width: radiusPx * 2,
          height: radiusPx * 2,
          left: size.w / 2 - radiusPx,
          top: size.h / 2 - radiusPx,
        }}
      />
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink" />
      {places.map((place) => {
        const pos = markerStyle(place);
        const active = place.id === selectedId;
        if (pos.left < -20 || pos.top < -20 || pos.left > size.w + 20 || pos.top > size.h + 20) return null;
        return (
          <button
            key={place.id}
            type="button"
            aria-label={place.name}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onSelect(place.id)}
            className={
              "press absolute z-10 h-9 min-w-9 -translate-x-1/2 -translate-y-full rounded-full border px-2 text-xs font-semibold shadow-sm " +
              (place.kind === "azteca"
                ? "border-accent bg-accent text-on-primary"
                : "border-primary bg-primary text-on-primary") +
              (active ? " ring-2 ring-ink ring-offset-2 ring-offset-surface" : "")
            }
            style={{ left: pos.left, top: pos.top }}
          >
            {place.kind === "azteca" ? "Az" : "Cc"}
          </button>
        );
      })}
      <div
        className="absolute top-3 right-3 flex flex-col gap-2"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="press h-11 w-11 rounded-full border border-line bg-surface text-lg text-ink" onClick={() => setView((v) => ({ ...v, z: Math.min(17, v.z + 1) }))} aria-label="Acercar">
          +
        </button>
        <button type="button" className="press h-11 w-11 rounded-full border border-line bg-surface text-lg text-ink" onClick={() => setView((v) => ({ ...v, z: Math.max(11, v.z - 1) }))} aria-label="Alejar">
          −
        </button>
      </div>
      <p className="absolute bottom-2 left-2 rounded-full bg-surface/90 px-2 py-1 text-xs text-muted">
        © OpenStreetMap
      </p>
    </div>
  );
}
