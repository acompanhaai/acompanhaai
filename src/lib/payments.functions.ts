import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLAN_TO_PRICE } from "@/lib/plan";
import { getPaymentsEnvironment } from "@/lib/payments-env";

const checkoutInput = z.object({
  plan: z.enum(["start", "growth", "scale"]),
});

/**
 * Prepara o checkout no servidor: resolve o preço real do provedor e assina o
 * vínculo entre a conta autenticada, o plano e o ambiente. O webhook só aplica
 * o plano quando essa assinatura confere, então o navegador não consegue
 * reivindicar um plano para outra conta nem para outro ambiente.
 */
export const prepareCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkoutInput.parse(data))
  .handler(async ({ data, context }) => {
    const environment = getPaymentsEnvironment();
    const externalPriceId = PLAN_TO_PRICE[data.plan];

    const { paddleFetch } = await import("@/lib/paddle.server");
    const response = await paddleFetch(
      environment,
      `/prices?external_id=${encodeURIComponent(externalPriceId)}`,
    );
    if (!response.ok) throw new Error("Não foi possível validar o preço do plano.");
    const result = (await response.json()) as { data?: { id: string }[] };
    const priceId = result.data?.[0]?.id;
    if (!priceId) throw new Error("Preço do plano não encontrado.");

    const { signCheckoutIntent } = await import("@/lib/checkout-intent.server");

    return {
      paddlePriceId: priceId,
      environment,
      customData: {
        userId: context.userId,
        plan: data.plan,
        environment,
        signature: signCheckoutIntent(context.userId, data.plan, environment),
      },
    };
  });
