import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { planById } from "@/config/plans";
import { isPlanId, type PlanUsage } from "@/lib/plan";

/**
 * Plano, período e consumo da conta autenticada.
 * O banco é a autoridade: nada aqui aceita valores enviados pelo navegador.
 */
export const getAccountPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlanUsage> => {
    const { supabase, userId } = context;

    const [{ data: row, error }, { data: profile }] = await Promise.all([
      supabase.rpc("ensure_account_plan").maybeSingle(),
      supabase.from("profiles").select("company, name").eq("id", userId).maybeSingle(),
    ]);

    if (error || !row) throw new Error("Não foi possível carregar o plano da conta.");

    const planId = isPlanId(row.plan_id) ? row.plan_id : "free";
    const plan = planById(planId);
    const used = row.requests_used ?? 0;
    const limit = row.requests_limit ?? plan.requests;

    return {
      planId,
      planName: plan.name,
      price: plan.price,
      limit,
      used,
      remaining: Math.max(0, limit - used),
      periodStart: row.period_start,
      periodEnd: row.period_end,
      status: row.status ?? "free",
      company: profile?.company?.trim() || null,
    };
  });
