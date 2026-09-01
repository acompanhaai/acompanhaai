import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Falar com o time — AcompanhaAí" },
      {
        name: "description",
        content:
          "Envie uma mensagem para o time do AcompanhaAí e entenda como a plataforma pode funcionar na sua operação.",
      },
      { property: "og:title", content: "Falar com o time — AcompanhaAí" },
      {
        property: "og:description",
        content: "Fale com o time do AcompanhaAí sobre a sua operação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contato,
});

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  company: z.string().trim().min(2, "Informe a empresa").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(8, "Informe um telefone válido").max(20),
  message: z.string().trim().min(10, "Conte um pouco mais").max(1000),
});


function Contato() {
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: form.get("name"),
      company: form.get("company"),
      email: form.get("email"),
      phone: form.get("phone"),
      message: form.get("message"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setSent(true);
    toast.success("Mensagem registrada", {
      description: "Nosso time entrará em contato em breve.",
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
        <h1 className="text-3xl font-bold text-foreground">Falar com o time</h1>
        <p className="mt-4 text-base text-muted-foreground">
          Quer conhecer o AcompanhaAí ou entender como ele pode funcionar na sua operação? Envie uma
          mensagem.
        </p>

        {sent ? (
          <p className="mt-10 text-sm text-muted-foreground">
            Obrigado pelo contato. Recebemos a sua mensagem e o time responderá em breve.
          </p>
        ) : (
          <form className="mt-10 space-y-5" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" name="company" required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" type="tel" required maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea id="message" name="message" rows={5} required maxLength={1000} />
            </div>
            <Button type="submit" className="w-full">
              Enviar mensagem
            </Button>
          </form>
        )}

      </main>
      <SiteFooter />
    </div>
  );
}
