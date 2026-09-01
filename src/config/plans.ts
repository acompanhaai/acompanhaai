export type PlanId = "free" | "start" | "growth" | "scale";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  requests: number;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  note?: string;
};

export const plans: Plan[] = [
  {
    id: "free",
    name: "Acompanha",
    price: 0,
    requests: 10,
    tagline: "Para começar a usar o AcompanhaAí.",
    features: [
      "10 solicitações por mês",
      "Rastreamento em tempo real",
      "Link de acompanhamento para o cliente",
      "Informações do prestador",
      "Histórico",
      "Painel de operação",
    ],
    cta: "Começar grátis",
    note: "Sem cartão de crédito.",
  },
  {
    id: "start",
    name: "Acompanha+",
    price: 49,
    requests: 100,
    tagline: "Para pequenas operações.",
    features: [
      "100 solicitações por mês",
      "Rastreamento em tempo real",
      "Link de acompanhamento para o cliente",
      "Informações do prestador",
      "Histórico",
      "Painel de operação",
      "Automações",
      "Suporte padrão",
    ],
    cta: "Começar agora",
  },
  {
    id: "growth",
    name: "Acompanha Pro",
    price: 149,
    requests: 500,
    tagline: "Para operações em crescimento.",
    features: [
      "500 solicitações por mês",
      "Tudo do Acompanha+",
      "Automações avançadas",
      "Recursos avançados de acompanhamento",
      "Maior capacidade operacional",
      "Suporte prioritário",
    ],
    cta: "Começar agora",
    highlight: true,
  },
  {
    id: "scale",
    name: "Acompanha Max",
    price: 399,
    requests: 2000,
    tagline: "Para operações de maior volume.",
    features: [
      "2.000 solicitações por mês",
      "Tudo do Acompanha Pro",
      "Maior capacidade operacional",
      "Recursos avançados",
      "Suporte prioritário",
    ],
    cta: "Começar agora",
  },
];

export const planById = (id: PlanId) => plans.find((p) => p.id === id)!;

export const formatPrice = (price: number) =>
  price === 0 ? "R$ 0" : `R$ ${price.toLocaleString("pt-BR")}`;

export const formatRequests = (requests: number) => requests.toLocaleString("pt-BR");

/** Linhas da tabela de comparação (curta, por definição). */
export const comparison: { label: string; values: (string | boolean)[] }[] = [
  { label: "Solicitações/mês", values: plans.map((p) => formatRequests(p.requests)) },
  { label: "Rastreamento em tempo real", values: [true, true, true, true] },
  { label: "Link para cliente", values: [true, true, true, true] },
  { label: "Informações do prestador", values: [true, true, true, true] },
  { label: "Histórico", values: [true, true, true, true] },
  { label: "Painel de operação", values: [true, true, true, true] },
  { label: "Automações", values: [false, true, true, true] },
  { label: "Automações avançadas", values: [false, false, true, true] },
  { label: "Suporte prioritário", values: [false, false, true, true] },
];

/** Definição usada em toda a comunicação sobre limites. */
export const requestDefinition =
  "Uma solicitação corresponde a um protocolo de atendimento acompanhado pelo AcompanhaAí.";
