import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { isValidBRPhone, isValidCPF, isValidCEP, SERVICE_TYPES, PRIORITIES } from "@/lib/protocol";
import { composeAddress } from "@/lib/protocol";
import { PLAN_LIMIT_CODE } from "@/lib/plan";
import { getPaymentsEnvironment } from "@/lib/payments-env";

/** Empresa (tenant) da conta autenticada — toda linha nova precisa dela. */
async function getCompanyId(supabase: SupabaseClient<Database>, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .single();
  if (error || !data?.company_id) throw new Error("Não foi possível identificar sua empresa.");
  return data.company_id;
}

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
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail do motorista")
    .email("E-mail inválido")
    .max(255),
  phone: z
    .string()
    .trim()
    .refine(isValidBRPhone, "Telefone brasileiro inválido")
    .nullable()
    .optional(),
  vehicle: z.string().trim().max(80).nullable().optional(),
  vehicle_color: z.string().trim().max(40).nullable().optional(),
  vehicle_year: z.string().trim().max(4).nullable().optional(),
  plate: z.string().trim().max(10).nullable().optional(),
  address_cep: z
    .string()
    .trim()
    .refine((v) => !v || isValidCEP(v))
    .nullable()
    .optional(),
  address_street: z.string().trim().max(200).nullable().optional(),
  address_number: z.string().trim().max(20).nullable().optional(),
  address_complement: z.string().trim().max(120).nullable().optional(),
  address_district: z.string().trim().max(120).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  address_state: z.string().trim().max(2).nullable().optional(),
});

type AssignmentProtocol = {
  number: string;
  service_type: string | null;
  origin: string;
  destination: string | null;
  client_name: string;
  priority: string;
};

/** Avisa o motorista por e-mail sobre um novo atendimento — nunca falha a operação principal. */
async function notifyDriverAssignment(
  supabase: SupabaseClient<Database>,
  supabaseAdmin: SupabaseClient<Database>,
  driverId: string,
  protocol: AssignmentProtocol,
) {
  try {
    const { data: driver } = await supabase
      .from("drivers")
      .select("user_id, notify_email, name")
      .eq("id", driverId)
      .maybeSingle();
    if (!driver?.user_id || !driver.notify_email) return;
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(driver.user_id);
    const email = userRes.user?.email;
    if (!email) return;
    const { sendEmail } = await import("@/lib/email.server");
    await sendEmail(
      email,
      `Novo atendimento — ${protocol.number || protocol.service_type || "AcompanhaAí"}`,
      `<p>Olá, ${driver.name}!</p>
       <p>Você foi designado para um novo atendimento.</p>
       <p><strong>Serviço:</strong> ${protocol.service_type ?? "—"}<br/>
       <strong>Cliente:</strong> ${protocol.client_name}<br/>
       <strong>Origem:</strong> ${protocol.origin}<br/>
       ${protocol.destination ? `<strong>Destino:</strong> ${protocol.destination}<br/>` : ""}
       <strong>Prioridade:</strong> ${protocol.priority}</p>
       <p>Acesse o app do motorista para ver os detalhes.</p>`,
    );
  } catch {
    // Notificação é best-effort — a designação já foi feita e não deve falhar por causa disso.
  }
}

export const createProtocol = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => protocolInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const companyId = await getCompanyId(supabase, userId);

    // Autoridade do limite: o banco reserva o slot do período atual.
    const environment = getPaymentsEnvironment();
    const { data: reserved, error: reserveError } = await supabaseAdmin.rpc(
      "reserve_request_slot",
      {
        _user_id: userId,
        _environment: environment,
      },
    );
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
    const { data: row, error } = await supabase
      .from("protocols")
      .insert({
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
        company_id: companyId,
      })
      .select("id, number")
      .single();
    if (error) {
      // Devolve a reserva quando a criação não se concretiza.
      await supabaseAdmin.rpc("release_request_slot", {
        _user_id: userId,
        _environment: environment,
      });
      throw new Error("Não foi possível criar o atendimento.");
    }
    if (driverId) {
      await notifyDriverAssignment(supabase, supabaseAdmin, driverId, {
        number: row.number,
        service_type: data.service_type,
        origin,
        destination: data.destination ?? null,
        client_name: data.client_name,
        priority: data.priority,
      });
    }
    return { id: row.id, usage: { used: reserved.requests_used, limit: reserved.requests_limit } };
  });

const assignDriverInput = z.object({
  protocolId: z.string().uuid(),
  driverId: z.string().uuid(),
});

export const assignDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => assignDriverInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: protocol, error: protoError } = await context.supabase
      .from("protocols")
      .select("id, number, service_type, origin, destination, client_name, priority")
      .eq("id", data.protocolId)
      .single();
    if (protoError || !protocol) throw new Error("Atendimento não encontrado.");

    const { error } = await context.supabase
      .from("protocols")
      .update({ driver_id: data.driverId, status: "aceito", accepted_at: new Date().toISOString() })
      .eq("id", data.protocolId);
    if (error) throw new Error("Não foi possível designar o motorista.");
    await context.supabase
      .from("drivers")
      .update({ status: "em_atendimento" })
      .eq("id", data.driverId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await notifyDriverAssignment(context.supabase, supabaseAdmin, data.driverId, protocol);

    return { ok: true };
  });

export const createDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => driverInput.parse(data))
  .handler(async ({ data, context }) => {
    const companyId = await getCompanyId(context.supabase, context.userId);
    const cpfDigits = data.cpf.replace(/\D/g, "");
    const { data: row, error } = await context.supabase
      .from("drivers")
      .insert({
        re: data.re,
        name: data.name,
        cpf: cpfDigits,
        phone: data.phone ? data.phone.replace(/\D/g, "") : null,
        vehicle: data.vehicle ?? null,
        vehicle_color: data.vehicle_color ?? null,
        vehicle_year: data.vehicle_year ?? null,
        plate: data.plate ?? null,
        address_cep: data.address_cep ? data.address_cep.replace(/\D/g, "") : null,
        address_street: data.address_street ?? null,
        address_number: data.address_number ?? null,
        address_complement: data.address_complement ?? null,
        address_district: data.address_district ?? null,
        city: data.city ?? null,
        address_state: data.address_state ? data.address_state.toUpperCase() : null,
        status: "disponivel",
        company_id: companyId,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("Este RE já está cadastrado.");
      throw new Error("Não foi possível cadastrar o motorista.");
    }

    // Não falha o cadastro do motorista por causa do convite — o motorista já
    // existe e pode ser convidado depois; só reporta se o convite não saiu.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const appUrl = process.env["APP_URL"] ?? "http://localhost:8080";
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      data: {
        name: data.name,
        role: "driver",
        company_id: companyId,
        driver_cpf: cpfDigits,
      },
      redirectTo: new URL("/reset-password", appUrl).toString(),
    });
    const duplicateEmail = inviteError?.code === "email_exists";

    return { id: row.id, invited: !inviteError, duplicateEmail };
  });
