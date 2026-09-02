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
import { onlyDigits } from "@/lib/protocol";
import { resolveHomePath } from "@/lib/session";
import { suggestCompanies } from "@/lib/tracking.functions";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
  plan: z.enum(["free", "start", "growth", "scale"]).optional(),
});

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
  company: z.string().trim().min(2, "Informe a razão social (nome da empresa)").max(120),
  tax_id: z
    .string()
    .trim()
    .refine((v) => {
      const d = onlyDigits(v);
      return d.length === 11 || d.length === 14;
    }, "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido"),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(72),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [taxId, setTaxId] = useState("");
  const [company, setCompany] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(mode === "signup" ? "signup" : "login");

  useEffect(() => {
    resolveHomePath().then((path) => {
      if (path) navigate({ to: path, replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    const digits = onlyDigits(taxId);
    if (digits.length !== 11 && digits.length !== 14) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      suggestCompanies({ data: { tax_id: digits } })
        .then((list) => {
          if (!cancelled) setSuggestions(list);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [taxId]);
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    const path = error ? null : await resolveHomePath();
    setLoading(false);
    if (error || !path) {
      toast.error("Não foi possível entrar", { description: "Verifique e-mail e senha." });
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: path, replace: true });
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone") || undefined,
      company: form.get("company"),
      tax_id: form.get("tax_id"),
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
          company: parsed.data.company,
          tax_id: onlyDigits(parsed.data.tax_id),
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
      const path = await resolveHomePath();
      navigate({ to: path ?? "/dashboard", replace: true });
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
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="surface w-full max-w-md p-7">
          <h1 className="text-xl font-bold text-foreground">Base Operacional</h1>
          <p className="mt-1 text-sm text-muted-foreground">
             {activeTab === "signup"
               ? "Crie sua conta e comece a gerenciar sua operação em um só lugar."
               : "Acesse o painel de gestão da sua operação."}
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
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
                      <Label htmlFor="name">Nome do responsável</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" name="phone" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">CNPJ ou CPF&nbsp;</Label>
                    <Input
                      id="tax_id"
                      name="tax_id"
                      inputMode="numeric"
                      required
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Razão social</Label>
                    <Input
                      id="company"
                      name="company"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                    {suggestions.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">
                          Empresas já cadastradas com este documento:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setCompany(s)}
                              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary-strong transition-colors hover:bg-primary/20"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
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
        </div>
      </main>
    </div>
  );
}
