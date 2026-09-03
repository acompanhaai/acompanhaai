/**
 * Ambiente de pagamento único para cliente e servidor.
 *
 * O token é substituído em tempo de build (`.env.development` no preview e
 * `.env.production` no app publicado), então cliente e servidor derivam
 * sempre o mesmo ambiente e o plano de teste nunca vaza para a operação real.
 */
export type PaymentsEnv = "sandbox" | "live";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

export function getPaymentsEnvironment(): PaymentsEnv {
  return clientToken?.startsWith("test_") ? "sandbox" : "live";
}

export function getPaymentsClientToken(): string | undefined {
  return clientToken;
}
