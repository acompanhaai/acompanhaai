import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — AcompanhaAí" },
      {
        name: "description",
        content: "Fale com o time do AcompanhaAí e agende uma demonstração da plataforma.",
      },
      { property: "og:title", content: "Contato — AcompanhaAí" },
      { property: "og:description", content: "Agende uma demonstração do AcompanhaAí." },
    ],
  }),
  component: Contato,
});

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  company: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "Conte um pouco mais").max(1000),
});

function Contato() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      company: form.get("company") || undefined,
      message: form.get("message"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setSending(true);
    const subject = encodeURIComponent(`Demonstração AcompanhaAí — ${parsed.data.name}`);
    const body = encodeURIComponent(
      `Nome: ${parsed.data.name}\nE-mail: ${parsed.data.email}\nEmpresa: ${
        parsed.data.company ?? "—"
      }\n\n${parsed.data.message}`,
    );
    window.location.href = `mailto:contato@acompanhaai.app?subject=${subject}&body=${body}`;
    setSending(false);
    setSent(true);
    toast.success("Mensagem preparada", { description: "Finalize o envio no seu app de e-mail." });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-5">
          <Link to="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-12">
        <h1 className="text-2xl font-bold text-foreground">Vamos conversar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Conte sobre a sua operação e agendamos uma demonstração.
        </p>
        {sent ? (
          <div className="surface mt-6 p-6 text-sm">
            <p className="font-medium text-foreground">Obrigado pelo contato!</p>
            <p className="mt-1 text-muted-foreground">
              Responderemos em até um dia útil. Enquanto isso, você pode criar sua conta e explorar
              a base operacional.
            </p>
            <Button asChild className="mt-4">
              <Link to="/auth" search={{ mode: "signup" }}>
                Criar conta
              </Link>
            </Button>
          </div>
        ) : (
          <form className="surface mt-6 space-y-4 p-6" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" name="company" maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea id="message" name="message" rows={5} required maxLength={1000} />
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? "Enviando..." : "Enviar mensagem"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
