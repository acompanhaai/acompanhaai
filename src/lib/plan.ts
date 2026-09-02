import { planById, plans, type PlanId } from "@/config/plans";

/** Mapeia o produto do provedor de pagamento para o plano interno. */
export const PRODUCT_TO_PLAN: Record<string, PlanId> = {
  acompanha_plus: "start",
  acompanha_pro: "growth",
  acompanha_max: "scale",
};

export const PLAN_TO_PRICE: Record<Exclude<PlanId, "free">, string> = {
  start: "acompanha_plus_monthly",
  growth: "acompanha_pro_monthly",
  scale: "acompanha_max_monthly",
};

export type PlanUsage = {
  planId: PlanId;
  planName: string;
  price: number;
  limit: number;
  used: number;
  remaining: number;
  periodStart: string;
  periodEnd: string;
  status: "free" | "active" | "trialing" | "past_due" | "canceled";
  company: string | null;
};

/**
 * Período mensal do plano gratuito, ancorado no dia de criação da conta.
 * Renova sozinho: nunca depende de alguém abrir o dashboard.
 */
export function freePeriod(anchorISO: string, now = new Date()) {
  const anchor = new Date(anchorISO);
  const day = anchor.getUTCDate();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), Math.min(day, daysInMonth(now)), 0, 0, 0),
  );
  if (start > now) start.setUTCMonth(start.getUTCMonth() - 1);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

function daysInMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

export function usagePercent(usage: Pick<PlanUsage, "used" | "limit">) {
  if (usage.limit <= 0) return 100;
  return Math.min(100, Math.round((usage.used / usage.limit) * 100));
}

export type UsageLevel = "ok" | "warn70" | "warn80" | "warn90" | "full";

export function usageLevel(usage: Pick<PlanUsage, "used" | "limit">): UsageLevel {
  const pct = usagePercent(usage);
  if (usage.used >= usage.limit) return "full";
  if (pct >= 90) return "warn90";
  if (pct >= 80) return "warn80";
  if (pct >= 70) return "warn70";
  return "ok";
}

export function usageMessage(usage: PlanUsage): string | null {
  switch (usageLevel(usage)) {
    case "warn70":
      return `Você já utilizou ${usage.used} de ${usage.limit} solicitações.`;
    case "warn80":
      return "Sua operação está próxima do limite mensal.";
    case "warn90":
      return "Você está próximo do limite do seu plano. Considere fazer upgrade.";
    case "full":
      return "Limite mensal atingido.";
    default:
      return null;
  }
}

export function daysUntil(iso: string, now = new Date()) {
  const diff = new Date(iso).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

export const upgradeTargets = plans.filter((p) => p.price > 0);
export const planLabel = (id: PlanId) => planById(id).name;

/** Código estável usado entre backend e frontend para a experiência de upgrade. */
export const PLAN_LIMIT_CODE = "PLAN_LIMIT_REACHED";
