import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { initializePaddle } from "@/lib/paddle";
import { prepareCheckout } from "@/lib/payments.functions";

/**
 * Abre o checkout do provedor com dados preparados no servidor. O preço e o
 * vínculo com a conta nunca são montados no navegador.
 */
export function usePaddleCheckout() {
  const prepare = useServerFn(prepareCheckout);
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: {
    plan: "start" | "growth" | "scale";
    customerEmail?: string | undefined;
    successUrl?: string | undefined;
    frameTarget?: string | undefined;
  }) => {
    setLoading(true);
    try {
      const [intent] = await Promise.all([
        prepare({ data: { plan: options.plan } }),
        initializePaddle(),
      ]);

      window.Paddle.Checkout.open({
        items: [{ priceId: intent.paddlePriceId, quantity: 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: intent.customData,
        settings: {
          displayMode: options.frameTarget ? "inline" : "overlay",
          frameTarget: options.frameTarget,
          frameStyle: options.frameTarget
            ? "width: 100%; min-width: 312px; background-color: transparent; border: none;"
            : undefined,
          successUrl: options.successUrl ?? `${window.location.origin}/checkout/sucesso`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
