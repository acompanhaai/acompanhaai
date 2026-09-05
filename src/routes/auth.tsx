import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { passwordSchema } from "@/lib/password";
import { onlyDigits } from "@/lib/protocol";
import { resolveHomePath } from "@/lib/session";
import { suggestCompanies } from "@/lib/tracking.functions";
import { track } from "@/lib/analytics";

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
  password: passwordSchema,
});

const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6,10}$/, "Informe o código recebido por e-mail");

function AuthPage() {
  const { mode, plan } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recoverStep, setRecoverStep] = useState<"closed" | "request" | "code" | "password">(
    "closed",
  );
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverPassword, setRecoverPassword] = useState("");
  const [taxId, setTaxId] = useState("");
  const [company, setCompany] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(mode === "signup" ? "signup" : "login");

  function goAfterAuth(path: string) {
    if (plan && plan !== "free") {
      navigate({ to: "/checkout", search: { plan }, replace: true });
      return;
    }
    navigate({ to: path, replace: true });
  }

  useEffect(() => {
    resolveHomePath().then((path) => {
      if (path) goAfterAuth(path);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, plan]);

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
    goAfterAuth(path);
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
    track("empresa_criada", { company: parsed.data.company });
    if (data.session) {
      toast.success("Conta criada!");
      const path = await resolveHomePath();
      goAfterAuth(path ?? "/dashboard");
    } else {
      toast.success("Confirme seu e-mail", {
        description: "Enviamos um link de verificação para sua caixa de entrada.",
      });
    }
  }

  async function requestRecoveryCode(email: string) {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o código");
      return false;
    }
    return true;
  }

  async function handleRecoverRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!email) return;
    const sent = await requestRecoveryCode(email);
    if (!sent) return;
    setRecoverEmail(email);
    setRecoverPassword("");
    toast.success("Código enviado", {
      description: `Enviamos um código de verificação para ${email}.`,
    });
    setRecoverStep("code");
  }

  async function handleRecoverCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const code = codeSchema.safeParse(form.get("code"));
    if (!code.success) {
      toast.error(code.error.issues[0]?.message ?? "Código inválido");
      return;
    }
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: recoverEmail,
      token: code.data,
      type: "recovery",
    });
    setLoading(false);
    if (verifyError) {
      toast.error("Código inválido ou expirado", {
        description: "Confira o código recebido por e-mail ou peça um novo.",
      });
      return;
    }
    setRecoverStep("password");
  }

  async function handleRecoverPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = passwordSchema.safeParse(form.get("password"));
    if (!password.success) {
      toast.error(password.error.issues[0]?.message ?? "Senha inválida");
      return;
    }
    if (password.data !== String(form.get("confirm") ?? "")) {
      toast.error("As senhas não conferem");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: password.data });
    setLoading(false);
    if (updateError) {
      toast.error("Não foi possível atualizar a senha", { description: updateError.message });
      return;
    }
    toast.success("Senha atualizada!");
    const path = await resolveHomePath();
    goAfterAuth(path ?? "/dashboard");
  }

  function closeRecovery() {
    setRecoverStep("closed");
    setRecoverEmail("");
    setRecoverPassword("");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link
            to="/"
            className="interactive inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Logo />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="surface surface-elevated w-full max-w-md p-7">
          <h1 className="text-xl font-bold text-foreground">Base Operacional</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeTab === "signup"
              ? "Crie sua conta e comece a gerenciar sua operação em um só lugar."
              : "Acesse o painel de gestão da sua operação."}
          </p>

          {recoverStep === "request" ? (
            <form className="mt-6 space-y-4" onSubmit={handleRecoverRequest}>
              <div className="space-y-2">
                <Label htmlFor="recover-email">E-mail da conta</Label>
                <Input id="recover-email" name="email" type="email" required autoComplete="email" />
              </div>
              <Button type="submit" className="w-full" disabled={loading} loading={loading}>
                {loading ? "Enviando..." : "Enviar código"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={closeRecovery}>
                Voltar
              </Button>
            </form>
          ) : recoverStep === "code" ? (
            <form className="mt-6 space-y-4" onSubmit={handleRecoverCode}>
              <p className="text-sm text-muted-foreground">
                Digite o código enviado para <strong>{recoverEmail}</strong>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="recover-code">Código</Label>
                <Input
                  id="recover-code"
                  name="code"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  autoComplete="one-time-code"
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10);
                  }}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading} loading={loading}>
                {loading ? "Verificando..." : "Verificar código"}
              </Button>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm text-muted-foreground"
                  disabled={loading}
                  onClick={async () => {
                    const sent = await requestRecoveryCode(recoverEmail);
                    if (sent) toast.success("Novo código enviado");
                  }}
                >
                  Reenviar código
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm text-muted-foreground"
                  onClick={closeRecovery}
                >
                  Voltar
                </Button>
              </div>
            </form>
          ) : recoverStep === "password" ? (
            <form className="mt-6 space-y-4" onSubmit={handleRecoverPassword}>
              <p className="text-sm text-muted-foreground">
                Código verificado. Defina uma nova senha para <strong>{recoverEmail}</strong>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="recover-password">Nova senha</Label>
                <Input
                  id="recover-password"
                  name="password"
                  type="password"
                  required
                  value={recoverPassword}
                  onChange={(e) => setRecoverPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo de 8 caracteres, com pelo menos um número e um caractere especial.
                </p>
                <PasswordStrengthMeter password={recoverPassword} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recover-confirm">Confirmar senha</Label>
                <Input id="recover-confirm" name="confirm" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading} loading={loading}>
                {loading ? "Salvando..." : "Redefinir senha"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="h-auto w-full text-sm text-muted-foreground"
                onClick={closeRecovery}
              >
                Cancelar
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
                  <Button type="submit" className="w-full" disabled={loading} loading={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto w-full text-sm text-muted-foreground"
                    onClick={() => setRecoverStep("request")}
                  >
                    Esqueci minha senha
                  </Button>
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
                            <Button
                              key={s}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setCompany(s)}
                              className="h-auto rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary-strong hover:bg-primary/20"
                            >
                              {s}
                            </Button>
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
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirmar senha</Label>
                      <Input id="confirm" name="confirm" type="password" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 8 caracteres, com pelo menos um número e um caractere especial.
                    </p>
                    <PasswordStrengthMeter password={signupPassword} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} loading={loading}>
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
