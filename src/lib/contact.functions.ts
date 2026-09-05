import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactInput = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(8).max(20),
  message: z.string().trim().min(10).max(1000),
});

/** Formulário público /contato — sem sessão, então grava via service role. */
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert(data);
    if (error) throw new Error("Não foi possível registrar sua mensagem.");

    // Best-effort: a missing RESEND_API_KEY or CONTACT_NOTIFICATION_EMAIL
    // just skips the notification — the message is already saved above.
    const notifyTo = process.env["CONTACT_NOTIFICATION_EMAIL"];
    if (notifyTo) {
      const { sendEmail } = await import("@/lib/email.server");
      await sendEmail(
        notifyTo,
        `Novo contato: ${data.company}`,
        `<p><strong>${data.name}</strong> (${data.company})</p><p>${data.email} · ${data.phone}</p><p>${data.message}</p>`,
      ).catch((error) => console.error(error));
    }

    return { ok: true as const };
  });
