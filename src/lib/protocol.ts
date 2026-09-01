export const PROTOCOL_STATUSES = [
  "aguardando_aceite",
  "aceito",
  "em_deslocamento",
  "chegou",
  "em_atendimento",
  "concluido",
  "cancelado",
] as const;

export type ProtocolStatus = (typeof PROTOCOL_STATUSES)[number];

export const STATUS_LABEL: Record<ProtocolStatus, string> = {
  aguardando_aceite: "Aguardando aceite",
  aceito: "Motorista aceitou",
  em_deslocamento: "Em deslocamento",
  chegou: "Chegou ao local",
  em_atendimento: "Atendimento iniciado",
  concluido: "Finalizado",
  cancelado: "Cancelado",
};

export const TIMELINE_ORDER: ProtocolStatus[] = [
  "aguardando_aceite",
  "aceito",
  "em_deslocamento",
  "chegou",
  "em_atendimento",
  "concluido",
];

export function statusTone(status: string) {
  switch (status) {
    case "concluido":
      return "bg-primary/15 text-primary-strong border-primary/30";
    case "cancelado":
      return "bg-destructive/10 text-destructive border-destructive/25";
    case "aguardando_aceite":
      return "bg-warning/15 text-warning-foreground border-warning/30";
    case "em_atendimento":
    case "chegou":
      return "bg-info/10 text-info border-info/25";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

export const SERVICE_TYPES = [
  "Taxi",
  "Reboque",
  "Chaveiro",
  "Mecânico",
  "Troca de pneu",
  "Recarga de bateria",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];


export const PRIORITIES = ["baixa", "normal", "alta", "critica"] as const;

export const PRIORITY_LABEL: Record<string, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  critica: "Crítica",
};

export const DRIVER_STATUS_LABEL: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  em_atendimento: "Em atendimento",
};

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function driverEmailFromCpf(cpf: string) {
  return `motorista-${onlyDigits(cpf)}@acompanhaai.app`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Validação de CPF pelo algoritmo dos dígitos verificadores. */
export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i += 1) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

/** Telefone brasileiro com DDD válido (10 ou 11 dígitos). */
export function isValidBRPhone(value: string): boolean {
  const p = onlyDigits(value);
  if (p.length !== 10 && p.length !== 11) return false;
  const ddd = Number(p.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (p.length === 11 && p[2] !== "9") return false;
  if (/^(\d)\1+$/.test(p.slice(2))) return false;
  return true;
}

export function isValidCEP(value: string): boolean {
  return onlyDigits(value).length === 8;
}

export function formatCPF(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatCEP(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, "$1-$2");
}

/** Monta o endereço completo em uma linha. */
export function composeAddress(a: {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  cep: string;
}): string {
  const parts = [
    `${a.street}, ${a.number}`,
    a.complement?.trim() ? a.complement.trim() : null,
    a.district,
    `${a.city} - ${a.state}`,
    `CEP ${formatCEP(a.cep)}`,
  ].filter(Boolean);
  return parts.join(" · ");
}
