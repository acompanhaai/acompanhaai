import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isPlanId } from "@/lib/plan";
import { getPaymentsEnvironment } from "@/lib/payments-env";

const intentInput = z.object({
  plan: z.string().refine(isPlanId, "Plano inválido").refine((value) => value !== "free", "O plano gratuito não usa checkout"),
});

export const createCheckoutIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => intentInput.parse(data))
  .handler(async ({ data, context }) => {
    const environment = getPaymentsEnvironment();
    const { signCheckoutIntent } = await import("@/lib/checkout-intent.server");
    return {
      userId: context.userId,
      environment,
      signature: signCheckoutIntent(context.userId, data.plan, environment),
    };
  });
