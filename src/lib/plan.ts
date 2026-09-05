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

/** Código estável usado entre backend e frontend para a experiência de upgrade. */
export const PLAN_LIMIT_CODE = "PLAN_LIMIT_REACHED";

export type PlanUsage = {
  planId: PlanId;
  planName: string;
  price: number;
  limit: number;
  used: number;
  remaining: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  company: string | null;
  userName: string | null;
};

export function isPlanId(value: string): value is PlanId {
  return value === "free" || value === "start" || value === "growth" || value === "scale";
}

export function usagePercent(usage: Pick<PlanUsage, "used" | "limit">) {
  if (usage.limit <= 0) return 100;
  return Math.min(100, Math.round((usage.used / usage.limit) * 100));
}

export type UsageLevel = "ok" | "warn70" | "warn80" | "warn90" | "full";

export function usageLevel(usage: Pick<PlanUsage, "used" | "limit">): UsageLevel {
  if (usage.used >= usage.limit) return "full";
  const pct = usagePercent(usage);
  if (pct >= 90) return "warn90";
  if (pct >= 80) return "warn80";
  if (pct >= 70) return "warn70";
  return "ok";
}

export function usageMessage(usage: Pick<PlanUsage, "used" | "limit">): string | null {
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

export function formatPeriodDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Próximo plano recomendado para upgrade a partir do plano atual. */
export function nextPlan(current: PlanId) {
  const order: PlanId[] = ["free", "start", "growth", "scale"];
  const index = order.indexOf(current);
  return order[Math.min(index + 1, order.length - 1)] ?? "start";
}

export const paidPlans = plans.filter((p) => p.price > 0);
export const planLabel = (id: PlanId) => planById(id).name;
