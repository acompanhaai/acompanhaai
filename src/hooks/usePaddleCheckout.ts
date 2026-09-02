import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: {
    priceId: string;
    customerEmail?: string | undefined;
    customData?: Record<string, string> | undefined;
    successUrl?: string | undefined;
    frameTarget?: string | undefined;
  }) => {
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: options.customData,
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
