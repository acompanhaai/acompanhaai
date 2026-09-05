import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { planById, type PlanId } from "@/config/plans";
import { PLAN_TO_PRICE } from "@/lib/plan";
import { getPaymentsEnvironment } from "@/lib/payments-env";
import type { PaddleEnv } from "@/lib/paddle.server";

const environmentInput = z.object({
  environment: z.enum(["sandbox", "live"]),
});

const paidPlanInput = z.object({
  plan: z.enum(["start", "growth", "scale"]),
});

async function getSubscription(
  context: { supabase: SupabaseClient<Database>; userId: string },
  environment: PaddleEnv,
) {
  const { data, error } = await context.supabase
    .from("subscriptions")
    .select("paddle_customer_id, paddle_subscription_id, environment, status, product_id, price_id")
    .eq("user_id", context.userId)
    .eq("environment", environment)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar a assinatura da conta.");
  return data;
}

/** Cria uma sessão temporária do portal oficial para a assinatura da conta autenticada. */
export const createCustomerPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => environmentInput.parse(data))
  .handler(async ({ data, context }) => {
    const subscription = await getSubscription(context, data.environment);
    if (!subscription) throw new Error("Nenhuma assinatura paga foi encontrada.");

    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(subscription.environment as PaddleEnv);
    const session = await paddle.customerPortalSessions.create(subscription.paddle_customer_id, [
      subscription.paddle_subscription_id,
    ]);

    return { url: session.urls.general.overview };
  });

/**
 * Altera uma assinatura existente no servidor. O plano só é aplicado no banco
 * pelo webhook depois que o provedor confirma a atualização.
 */
export const changeSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => paidPlanInput.parse(data))
  .handler(async ({ data, context }) => {
    const environment = getPaymentsEnvironment();
    const subscription = await getSubscription(context, environment);
    if (!subscription) throw new Error("Nenhuma assinatura paga ativa foi encontrada.");
    if (["canceled", "paused"].includes(subscription.status)) {
      throw new Error("Essa assinatura não pode ser alterada neste estado.");
    }

    const { paddleFetch, getPaddleClient } = await import("@/lib/paddle.server");
    const response = await paddleFetch(
      environment,
      `/prices?external_id=${encodeURIComponent(PLAN_TO_PRICE[data.plan])}`,
    );
    if (!response.ok) throw new Error("Não foi possível validar o preço do novo plano.");
    const result = (await response.json()) as { data?: { id: string }[] };
    const priceId = result.data?.[0]?.id;
    if (!priceId) throw new Error("Preço do novo plano não encontrado.");

    const paddle = getPaddleClient(environment);
    await paddle.subscriptions.update(subscription.paddle_subscription_id, {
      items: [{ priceId, quantity: 1 }],
      prorationBillingMode: "prorated_immediately",
    });

    return { plan: planById(data.plan as PlanId).name };
  });

/** Agenda o cancelamento para o final do período já pago. */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const environment = getPaymentsEnvironment();
    const subscription = await getSubscription(context, environment);
    if (!subscription) throw new Error("Nenhuma assinatura paga foi encontrada.");
    if (subscription.status === "canceled") throw new Error("O cancelamento já está agendado.");

    const { getPaddleClient } = await import("@/lib/paddle.server");
    await getPaddleClient(environment).subscriptions.cancel(subscription.paddle_subscription_id, {
      effectiveFrom: "next_billing_period",
    });

    return { scheduled: true };
  });
