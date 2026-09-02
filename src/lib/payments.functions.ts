import { createServerFn } from "@tanstack/react-start";
import { PLAN_TO_PRICE } from "@/lib/plan";

const allowedPriceIds = new Set(Object.values(PLAN_TO_PRICE));

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: { priceId: string; environment: "sandbox" | "live" }) => data)
  .handler(async ({ data }) => {
    if (!allowedPriceIds.has(data.priceId)) {
      throw new Error("Plano de pagamento inválido.");
    }

    const { gatewayFetch } = await import("@/lib/paddle.server");
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    if (!response.ok) throw new Error("Não foi possível validar o preço do plano.");
    const result = (await response.json()) as { data?: { id: string }[] };
    const price = result.data?.[0];
    if (!price) throw new Error("Preço do plano não encontrado.");
    return price.id;
  });
