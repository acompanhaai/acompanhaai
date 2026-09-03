import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Assina o vínculo entre a assinatura e a conta.
 *
 * O `customData` do checkout é montado no navegador, então o webhook não pode
 * confiar apenas no `userId` recebido. A assinatura abaixo é emitida no
 * servidor, só depois da sessão autenticada, e verificada no webhook antes de
 * aplicar qualquer plano.
 */
function getSigningSecret(): string {
  const secret = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!secret) throw new Error("Payment signing secret is not configured");
  return secret;
}

export function signCheckoutIntent(userId: string, plan: string, environment: string): string {
  return createHmac("sha256", getSigningSecret())
    .update(`${userId}|${plan}|${environment}`)
    .digest("hex");
}

export function verifyCheckoutIntent(
  userId: string,
  plan: string,
  environment: string,
  signature: string | undefined,
): boolean {
  if (!signature) return false;
  const expected = signCheckoutIntent(userId, plan, environment);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
