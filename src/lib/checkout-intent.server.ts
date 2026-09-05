import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaddleEnv } from "@/lib/paddle.server";

function signingSecret(environment: PaddleEnv): string {
  const key =
    environment === "sandbox"
      ? process.env["PADDLE_SANDBOX_API_KEY"]
      : process.env["PADDLE_LIVE_API_KEY"];
  if (!key) throw new Error("Payment signing secret is not configured");
  return key;
}

export function signCheckoutIntent(userId: string, plan: string, environment: PaddleEnv): string {
  return createHmac("sha256", signingSecret(environment))
    .update(`${userId}|${plan}|${environment}`)
    .digest("hex");
}

export function verifyCheckoutIntent(
  userId: string,
  plan: string,
  environment: PaddleEnv,
  signature: string | undefined,
): boolean {
  if (!signature) return false;
  const expected = signCheckoutIntent(userId, plan, environment);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
