import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { planById } from "@/config/plans";
import { isPlanId, type PlanUsage } from "@/lib/plan";
import { getPaymentsEnvironment } from "@/lib/payments-env";

/** Plano, período e consumo da conta autenticada. O banco é a autoridade. */
export const getAccountPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlanUsage> => {
    const { supabase, userId, claims } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const environment = getPaymentsEnvironment();

    const [{ data: row, error }, { data: profile }] = await Promise.all([
      supabaseAdmin.rpc("ensure_account_plan", { _user_id: userId, _environment: environment }),
      supabase.from("profiles").select("company, name").eq("id", userId).maybeSingle(),
    ]);

    if (error || !row) throw new Error("Não foi possível carregar o plano da conta.");

    const planId = isPlanId(row.plan_id) ? row.plan_id : "free";
    const plan = planById(planId);
    const used = row.requests_used ?? 0;
    const limit = row.requests_limit ?? plan.requests;

    // profiles.name pode estar vazio em contas antigas — cai para o nome
    // salvo nos metadados do usuário no momento do cadastro.
    const metadataName =
      typeof claims.user_metadata?.["name"] === "string" ? claims.user_metadata["name"] : null;

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
      userName: profile?.name?.trim() || metadataName?.trim() || null,
    };
  });
