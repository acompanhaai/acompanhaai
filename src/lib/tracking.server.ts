import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolve o id do protocolo a partir do número ou do CPF do segurado. */
export async function resolveProtocolId(
  client: SupabaseClient<any, any, any>,
  query: string,
): Promise<string | null> {
  const raw = query.trim();
  const digits = raw.replace(/\D/g, "");
  let builder = client
    .from("protocols")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);
  builder =
    digits.length === 11 && !raw.toUpperCase().startsWith("AC")
      ? builder.eq("client_cpf", digits)
      : builder.ilike("number", raw);
  const { data } = await builder;
  return data?.[0]?.id ?? null;
}
