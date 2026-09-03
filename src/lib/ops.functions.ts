import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isValidBRPhone, isValidCPF, isValidCEP, SERVICE_TYPES, PRIORITIES } from "@/lib/protocol";
import { composeAddress } from "@/lib/protocol";
import { PLAN_LIMIT_CODE } from "@/lib/plan";
import { getPaymentsEnvironment } from "@/lib/payments-env";

const protocolInput = z.object({
  client_name: z.string().trim().min(2).max(120),
  client_phone: z.string().trim().refine(isValidBRPhone, "Telefone brasileiro inválido"),
  client_cpf: z.string().trim().refine(isValidCPF, "CPF inválido"),
  insurer: z.string().trim().max(120).nullable().optional(),
  service_type: z.enum(SERVICE_TYPES),
  priority: z.enum(PRIORITIES),
  address_cep: z.string().trim().refine(isValidCEP, "CEP inválido"),
  address_street: z.string().trim().min(2).max(200),
  address_number: z.string().trim().min(1).max(20),
  address_complement: z.string().trim().max(120).nullable().optional(),
  address_district: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  address_state: z.string().trim().length(2),
  destination: z.string().trim().max(200).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  driver_id: z.string().uuid().nullable().optional(),
});

const driverInput = z.object({
  re: z.string().trim().min(1).max(30),
  name: z.string().trim().min(2).max(120),
  cpf: z.string().trim().refine(isValidCPF, "CPF inválido"),
  phone: z.string().trim().refine(isValidBRPhone, "Telefone brasileiro inválido").nullable().optional(),
  vehicle: z.string().trim().max(80).nullable().optional(),
  plate: z.string().trim().max(10).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
});

export const createProtocol = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => protocolInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Autoridade do limite: o banco reserva o slot do período atual.
    const environment = getPaymentsEnvironment();
    const { data: reserved, error: reserveError } = await supabaseAdmin.rpc("reserve_request_slot", {
      _user_id: userId,
      _environment: environment,
    });
    if (reserveError) throw new Error("Não foi possível validar o seu plano agora.");
    if (!reserved) throw new Error(PLAN_LIMIT_CODE);

    const origin = composeAddress({
      cep: data.address_cep,
      street: data.address_street,
      number: data.address_number,
      complement: data.address_complement ?? null,
      district: data.address_district,
      city: data.city,
      state: data.address_state,
    });
    const driverId = data.driver_id ?? null;
    const { data: row, error } = await supabase.from("protocols").insert({
      number: "",
      client_name: data.client_name,
      client_phone: data.client_phone.replace(/\D/g, ""),
      client_cpf: data.client_cpf.replace(/\D/g, ""),
      insurer: data.insurer ?? null,
      service_type: data.service_type,
      priority: data.priority,
      origin,
      destination: data.destination ?? null,
      city: data.city,
      address_cep: data.address_cep.replace(/\D/g, ""),
      address_street: data.address_street,
      address_number: data.address_number,
      address_complement: data.address_complement ?? null,
      address_district: data.address_district,
      address_state: data.address_state.toUpperCase(),
      notes: data.notes ?? null,
      driver_id: driverId,
      status: driverId ? "aceito" : "aguardando_aceite",
      accepted_at: driverId ? new Date().toISOString() : null,
      created_by: context.userId,
    }).select("id").single();
    if (error) {
      // Devolve a reserva quando a criação não se concretiza.
      await supabaseAdmin.rpc("release_request_slot", { _user_id: userId, _environment: environment });
      throw new Error("Não foi possível criar o atendimento.");
    }
    return { id: row.id, usage: { used: reserved.requests_used, limit: reserved.requests_limit } };
  });

export const createDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => driverInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("drivers").insert({
      re: data.re,
      name: data.name,
      cpf: data.cpf.replace(/\D/g, ""),
      phone: data.phone ? data.phone.replace(/\D/g, "") : null,
      vehicle: data.vehicle ?? null,
      plate: data.plate ?? null,
      city: data.city ?? null,
      status: "disponivel",
    }).select("id").single();
    if (error) {
      if (error.code === "23505") throw new Error("Este RE já está cadastrado.");
      throw new Error("Não foi possível cadastrar o motorista.");
    }
    return { id: row.id };
  });
