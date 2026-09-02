import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PaddleEnv } from "@/lib/paddle.server";

const environmentInput = z.object({
  environment: z.enum(["sandbox", "live"]),
});

function runtimePaymentEnvironment(): PaddleEnv {
  return process.env["VITE_PAYMENTS_CLIENT_TOKEN"]?.startsWith("test_") ? "sandbox" : "live";
}

/** Cria uma sessão temporária do portal oficial para a assinatura da conta autenticada. */
export const createCustomerPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => environmentInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: subscription, error } = await context.supabase
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id, environment")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error("Não foi possível carregar a assinatura da conta.");
    if (!subscription) throw new Error("Nenhuma assinatura paga ativa foi encontrada.");

    const environment = runtimePaymentEnvironment();
    if (environment !== subscription.environment) {
      throw new Error("O ambiente de pagamentos da conta está indisponível no momento.");
    }

    // O SDK e as credenciais privadas permanecem no servidor e só são carregados
    // depois que a sessão autenticada e a assinatura própria foram verificadas.
    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(environment);
    const session = await paddle.customerPortalSessions.create(
      subscription.paddle_customer_id,
      [subscription.paddle_subscription_id],
    );

    return { url: session.urls.general.overview };
  });
