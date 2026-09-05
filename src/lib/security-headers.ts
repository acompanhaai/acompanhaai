import { createMiddleware } from "@tanstack/react-start";

const SUPABASE_ORIGIN = "https://rrwnlmvaukisgyioovvs.supabase.co";
const SUPABASE_WS_ORIGIN = "wss://rrwnlmvaukisgyioovvs.supabase.co";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.paddle.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${SUPABASE_ORIGIN} ${SUPABASE_WS_ORIGIN} https://api.paddle.com https://sandbox-api.paddle.com https://us.i.posthog.com https://*.ingest.us.sentry.io https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org https://viacep.com.br https://generativelanguage.googleapis.com`,
  "frame-src https://cdn.paddle.com https://buy.paddle.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Sets standard hardening headers on every response. CSP allows
 * 'unsafe-inline' for scripts/styles — TanStack Start's SSR hydration
 * bootstrap relies on inline <script> tags and there's no nonce plumbing
 * here yet — but still restricts which origins can be loaded/connected to
 * at all, which is the main value against third-party script injection.
 */
export const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();
  const headers = result.response.headers;
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "geolocation=(self), camera=(), microphone=(), payment=(self)");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set("Content-Security-Policy", CSP);
  return result;
});
