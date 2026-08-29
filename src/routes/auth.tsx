import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const searchSchema = z.object({ mode: z.enum(["login", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar na Base Operacional — AcompanhaAí" },
      {
        name: "description",
        content: "Acesse a base operacional do AcompanhaAí para gerenciar protocolos e motoristas.",
      },
      { property: "og:title", content: "Base Operacional — AcompanhaAí" },
      { property: "og:description", content: "Login e criação de conta da base operacional." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(20).optional(),
  company: z.string().trim().max(120).optional(),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(72),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: "Verifique e-mail e senha." });
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard" });
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone") || undefined,
      company: form.get("company") || undefined,
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    if (parsed.data.password !== String(form.get("confirm") ?? "")) {
      toast.error("As senhas não conferem");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone ?? null,
          company: parsed.data.company ?? null,
          role: "operator",
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }
    if (data.session) {
      toast.success("Conta criada!");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Confirme seu e-mail", {
        description: "Enviamos um link de verificação para sua caixa de entrada.",
      });
    }
  }


  async function handleRecover(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail");
      return;
    }
    toast.success("E-mail enviado", { description: "Siga o link para definir uma nova senha." });
    setRecovering(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link to="/">
            <Logo />
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/motorista">Sou motorista</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="surface w-full max-w-md p-7">
          <h1 className="text-xl font-bold text-foreground">Base Operacional</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse o painel de gestão da sua assistência.
          </p>

          {recovering ? (
            <form className="mt-6 space-y-4" onSubmit={handleRecover}>
              <div className="space-y-2">
                <Label htmlFor="recover-email">E-mail da conta</Label>
                <Input id="recover-email" name="email" type="email" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setRecovering(false)}
              >
                Voltar
              </Button>
            </form>
          ) : (
            <Tabs defaultValue={mode === "signup" ? "signup" : "login"} className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setRecovering(true)}
                  >
                    Esqueci minha senha
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form className="space-y-4" onSubmit={handleSignup}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" name="phone" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input id="company" name="company" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input id="signup-email" name="email" type="email" required />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input id="signup-password" name="password" type="password" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirmar senha</Label>
                      <Input id="confirm" name="confirm" type="password" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle}>
            Continuar com Google
          </Button>
        </div>
      </main>
    </div>
  );
}
