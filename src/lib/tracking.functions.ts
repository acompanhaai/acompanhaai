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
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_district: string | null;
  address_state: string | null;
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
  confirmation_code: string | null;
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

export type TrackingMessage = {
  id: string;
  body: string;
  sender_role: string;
  sender_name: string | null;
  created_at: string;
};

/** Mensagens do chat entre segurado e motorista de um protocolo. */
export const getTrackingMessages = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ query: z.string().trim().min(3).max(40) }).parse(data))
  .handler(async ({ data }): Promise<TrackingMessage[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveProtocolId } = await import("./tracking.server");
    const id = await resolveProtocolId(supabaseAdmin, data.query);
    if (!id) return [];
    const { data: rows } = await supabaseAdmin
      .from("messages")
      .select("id, body, sender_role, sender_name, created_at")
      .eq("protocol_id", id)
      .order("created_at", { ascending: true })
      .limit(200);
    return rows ?? [];
  });

/** Envia mensagem do segurado para o motorista/base. */
export const sendTrackingMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        query: z.string().trim().min(3).max(40),
        body: z.string().trim().min(1).max(1000),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveProtocolId } = await import("./tracking.server");
    const id = await resolveProtocolId(supabaseAdmin, data.query);
    if (!id) return { ok: false };
    const { error } = await supabaseAdmin.from("messages").insert({
      protocol_id: id,
      body: data.body,
      sender_role: "segurado",
      sender_name: "Segurado",
    });
    return { ok: !error };
  });

/** Sugere razões sociais já cadastradas com o mesmo CPF/CNPJ. */
export const suggestCompanies = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ tax_id: z.string().trim().min(11).max(20) }).parse(data),
  )
  .handler(async ({ data }): Promise<string[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const digits = data.tax_id.replace(/\D/g, "");
    if (digits.length < 11) return [];
    const { data: rows } = await supabaseAdmin
      .from("profiles")
      .select("company")
      .eq("tax_id", digits)
      .not("company", "is", null)
      .limit(5);
    return Array.from(new Set((rows ?? []).map((r) => r.company).filter(Boolean) as string[]));
  });
