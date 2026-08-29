import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";

export type MapPoint = {
  lat: number;
  lng: number;
  label: string;
  kind: "driver" | "client";
};

function icon(kind: MapPoint["kind"]) {
  const isDriver = kind === "driver";
  const bg = isDriver ? "#37C53C" : "#2D2A2D";
  const ring = isDriver ? "rgba(55,197,60,.24)" : "rgba(45,42,45,.16)";
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:${bg};border:3px solid #fff;box-shadow:0 0 0 8px ${ring},0 6px 16px rgba(0,0,0,.18)">
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${
        isDriver
          ? '<path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>'
          : '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/>'
      }</svg>
    </span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function Fit({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0]!.lat, points[0]!.lng], 15, { animate: true });
      return;
    }
    map.fitBounds(
      points.map((p) => [p.lat, p.lng] as [number, number]),
      { padding: [64, 64], maxZoom: 15 },
    );
  }, [map, points]);
  return null;
}

export default function LeafletMap({
  points,
  trail = [],
  className = "h-full w-full",
}: {
  points: MapPoint[];
  trail?: Array<[number, number]>;
  className?: string;
}) {
  const center: [number, number] = points[0]
    ? [points[0].lat, points[0].lng]
    : [-23.5505, -46.6333];

  const route: Array<[number, number]> =
    trail.length > 1
      ? trail
      : points.length === 2
        ? [
            [points[0]!.lat, points[0]!.lng],
            [points[1]!.lat, points[1]!.lng],
          ]
        : [];

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {route.length > 1 ? (
        <>
          <Polyline
            positions={route}
            pathOptions={{ color: "#ffffff", weight: 9, opacity: 0.9, lineCap: "round" }}
          />
          <Polyline
            positions={route}
            pathOptions={{
              color: "#37C53C",
              weight: 4,
              opacity: 1,
              lineCap: "round",
              dashArray: trail.length > 1 ? undefined : "8 10",
            }}
          />
        </>
      ) : null}
      {points.map((p, i) => (
        <Marker key={`${p.kind}-${i}`} position={[p.lat, p.lng]} icon={icon(p.kind)}>
          <Tooltip direction="top" offset={[0, -16]} opacity={1}>
            {p.label}
          </Tooltip>
        </Marker>
      ))}
      <Fit points={points} />
    </MapContainer>
  );
}
