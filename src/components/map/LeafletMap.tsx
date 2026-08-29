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
  const color = kind === "driver" ? "#37C53C" : "#2D2A2D";
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:${color};box-shadow:0 0 0 4px rgba(55,197,60,.22);color:#fff;font-size:13px">${
      kind === "driver" ? "🚚" : "📍"
    }</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function Fit({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0]!.lat, points[0]!.lng], 14, { animate: true });
      return;
    }
    map.fitBounds(
      points.map((p) => [p.lat, p.lng] as [number, number]),
      { padding: [48, 48], maxZoom: 15 },
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

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {trail.length > 1 ? (
        <Polyline positions={trail} pathOptions={{ color: "#37C53C", weight: 4, opacity: 0.75 }} />
      ) : null}
      {points.map((p, i) => (
        <Marker key={`${p.kind}-${i}`} position={[p.lat, p.lng]} icon={icon(p.kind)}>
          <Tooltip direction="top">{p.label}</Tooltip>
        </Marker>
      ))}
      <Fit points={points} />
    </MapContainer>
  );
}
