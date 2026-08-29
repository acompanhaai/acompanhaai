import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Definir nova senha — AcompanhaAí" },
      { name: "description", content: "Crie uma nova senha para acessar o AcompanhaAí." },
      { property: "og:title", content: "Nova senha — AcompanhaAí" },
      { property: "og:description", content: "Redefinição de senha da conta AcompanhaAí." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < 8) {
      toast.error("A senha precisa ter ao menos 8 caracteres");
      return;
    }
    if (password !== String(form.get("confirm") ?? "")) {
      toast.error("As senhas não conferem");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível atualizar a senha", { description: error.message });
      return;
    }
    toast.success("Senha atualizada!");
    navigate({ to: "/dashboard" });
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
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <form className="surface w-full max-w-sm space-y-4 p-7" onSubmit={submit}>
          <h1 className="text-xl font-bold text-foreground">Definir nova senha</h1>
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input id="confirm" name="confirm" type="password" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </main>
    </div>
  );
}
