import { Resend } from "resend";

const FROM = "AcompanhaAí <onboarding@resend.dev>";

/**
 * No-ops without RESEND_API_KEY. Sends from Resend's shared test domain
 * until a real sending domain is verified (needs DNS records on
 * acompanhai.app — not configured yet, see .env.example).
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) console.error(new Error(`Resend send failed: ${error.message}`));
}
