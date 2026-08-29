import { Suspense, lazy, useEffect, useState } from "react";
import type { MapPoint } from "./LeafletMap";
import { Skeleton } from "@/components/ui/skeleton";

const LeafletMap = lazy(() => import("./LeafletMap"));

export type { MapPoint };

export function MapView({
  points,
  trail,
  className,
}: {
  points: MapPoint[];
  trail?: Array<[number, number]>;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <Skeleton className="h-full w-full" />;

  return (
    <Suspense fallback={<Skeleton className="h-full w-full" />}>
      <LeafletMap points={points} trail={trail} className={className} />
    </Suspense>
  );
}
