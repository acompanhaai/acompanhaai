import { supabase } from "@/integrations/supabase/client";

/** Painel correspondente ao perfil do usuário autenticado. */
export type HomePath = "/dashboard" | "/motorista";

export async function resolveHomePath(): Promise<HomePath | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);

  const list = (roles ?? []).map((r) => r.role as string);
  const isStaff = list.includes("admin") || list.includes("operator");
  if (!isStaff && list.includes("driver")) return "/motorista";
  return "/dashboard";
}
