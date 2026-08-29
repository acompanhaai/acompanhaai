import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const querySchema = z.object({
  query: z.string().trim().min(3).max(40),
});

export type PublicTracking = {
  number: string;
  status: string;
  client_name: string;
  origin: string;
  destination: string | null;
  service_type: string | null;
  insurer: string | null;
  created_at: string;
  accepted_at: string | null;
  en_route_at: string | null;
  arrived_at: string | null;
  service_started_at: string | null;
  finished_at: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  driver: {
    name: string;
    photo_url: string | null;
    vehicle: string | null;
    plate: string | null;
    last_lat: number | null;
    last_lng: number | null;
  } | null;
  trail: Array<{ lat: number; lng: number }>;
};

/** Consulta pública: aceita número do protocolo ou CPF do cliente. */
export const getPublicTracking = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => querySchema.parse(data))
  .handler(async ({ data }): Promise<PublicTracking | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const raw = data.query.trim();
    const digits = raw.replace(/\D/g, "");

    let builder = supabaseAdmin
      .from("protocols")
      .select(
        "id, number, status, client_name, client_cpf, origin, destination, service_type, insurer, created_at, accepted_at, en_route_at, arrived_at, service_started_at, finished_at, origin_lat, origin_lng, driver_id",
      )
      .order("created_at", { ascending: false })
      .limit(1);

    builder =
      digits.length === 11 && !raw.toUpperCase().startsWith("AC")
        ? builder.eq("client_cpf", digits)
        : builder.ilike("number", raw);

    const { data: rows, error } = await builder;
    if (error) throw new Error("Não foi possível consultar o protocolo.");
    const p = rows?.[0];
    if (!p) return null;

    let driver: PublicTracking["driver"] = null;
    if (p.driver_id) {
      const { data: d } = await supabaseAdmin
        .from("drivers")
        .select("name, photo_url, vehicle, plate, last_lat, last_lng")
        .eq("id", p.driver_id)
        .maybeSingle();
      driver = d ?? null;
    }

    const { data: trail } = await supabaseAdmin
      .from("location_history")
      .select("lat, lng")
      .eq("protocol_id", p.id)
      .order("created_at", { ascending: true })
      .limit(200);

    return {
      number: p.number,
      status: p.status,
      client_name: p.client_name,
      origin: p.origin,
      destination: p.destination,
      service_type: p.service_type,
      insurer: p.insurer,
      created_at: p.created_at,
      accepted_at: p.accepted_at,
      en_route_at: p.en_route_at,
      arrived_at: p.arrived_at,
      service_started_at: p.service_started_at,
      finished_at: p.finished_at,
      origin_lat: p.origin_lat,
      origin_lng: p.origin_lng,
      driver,
      trail: (trail ?? []).map((t) => ({ lat: t.lat, lng: t.lng })),
    };
  });
