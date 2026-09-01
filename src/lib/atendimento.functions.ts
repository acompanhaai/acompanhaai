import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FinishResult = { ok: boolean; error?: string };

/**
 * Finaliza o atendimento somente com o código de 4 dígitos informado pelo cliente.
 * A validação acontece no servidor: o motorista nunca recebe o código.
 */
export const finishWithCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        protocolId: z.string().uuid(),
        code: z
          .string()
          .trim()
          .regex(/^\d{4}$/, "O código deve ter exatamente 4 dígitos"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<FinishResult> => {
    const { supabase } = context;

    // O motorista autenticado precisa ser o responsável pela solicitação (RLS aplica).
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!driver) return { ok: false, error: "Conta de motorista não vinculada." };

    const { data: protocol } = await supabase
      .from("protocols")
      .select("id, status, driver_id")
      .eq("id", data.protocolId)
      .maybeSingle();
    if (!protocol || protocol.driver_id !== driver.id) {
      return { ok: false, error: "Este atendimento não é seu." };
    }
    if (protocol.status === "concluido") {
      return { ok: false, error: "Este atendimento já foi finalizado." };
    }
    if (protocol.status === "cancelado") {
      return { ok: false, error: "Este atendimento foi cancelado." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("protocol_codes")
      .select("code")
      .eq("protocol_id", data.protocolId)
      .maybeSingle();
    if (!row?.code) {
      return { ok: false, error: "Código ainda não gerado para este atendimento." };
    }
    if (row.code !== data.code) {
      return { ok: false, error: "Código incorreto. Confirme os 4 dígitos com o cliente." };
    }

    const now = new Date().toISOString();
    const completionPatch = {
      status: "concluido",
      finished_at: now,
      ...(protocol.status === "chegou" ? {} : { arrived_at: now }),
    };
    const { error } = await supabaseAdmin
      .from("protocols")
      .update(completionPatch)
      .eq("id", data.protocolId)
      .neq("status", "concluido");
    if (error) return { ok: false, error: "Não foi possível finalizar agora." };

    await supabaseAdmin.from("drivers").update({ status: "disponivel" }).eq("id", driver.id);
    return { ok: true };
  });
