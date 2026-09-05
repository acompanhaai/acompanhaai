import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowUpRight, BarChart3, CalendarDays, CreditCard, LogOut, MapPin, Plus, Send, Truck, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MapView, type MapPoint } from "@/components/map/MapView";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  DRIVER_STATUS_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  PROTOCOL_STATUSES,
  SERVICE_TYPES,
  STATUS_LABEL,
  TIMELINE_ORDER,
  composeAddress,
  formatCEP,
  formatDateTime,
  formatPhone,
  formatTime,
  isValidBRPhone,
  isValidCEP,
  isValidCPF,
  onlyDigits,
  statusTone,
  type ProtocolStatus,
} from "@/lib/protocol";
import { geocodeAddress, lookupCep } from "@/lib/address.functions";
import { createDriver, createProtocol } from "@/lib/ops.functions";
import { getAccountPlan } from "@/lib/plan.functions";
import { formatPeriodDate, nextPlan, planLabel, usageLevel, usageMessage, usagePercent, PLAN_LIMIT_CODE, type PlanUsage } from "@/lib/plan";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Base operacional — AcompanhaAí" },
      {
        name: "description",
        content: "Painel operacional para criar, designar e acompanhar atendimentos 24h.",
      },
      { property: "og:title", content: "Base operacional — AcompanhaAí" },
      { property: "og:description", content: "Gestão de protocolos, motoristas e rastreamento." },
    ],
  }),
  component: Dashboard,
});

type Protocol = {
  id: string;
  number: string;
  status: string;
  priority: string;
  service_type: string | null;
  client_name: string;
  client_phone: string | null;
  client_cpf: string | null;
  insurer: string | null;
  origin: string;
  origin_lat: number | null;
  origin_lng: number | null;
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_district: string | null;
  address_state: string | null;
  destination: string | null;
  city: string | null;
  notes: string | null;
  driver_id: string | null;
  created_at: string;
  accepted_at: string | null;
  en_route_at: string | null;
  arrived_at: string | null;
  service_started_at: string | null;
  finished_at: string | null;
};

type Driver = {
  id: string;
  name: string;
  cpf: string;
  re: string;
  phone: string | null;
  vehicle: string | null;
  plate: string | null;
  city: string | null;
  status: string;
  last_lat: number | null;
  last_lng: number | null;
  last_seen: string | null;
};

const protocolSchema = z.object({
  client_name: z.string().trim().min(2, "Informe o nome completo do cliente").max(120),
  client_phone: z.string().trim().min(10, "Informe um telefone válido").max(20).refine(isValidBRPhone, "Informe um telefone brasileiro válido"),
  client_cpf: z.string().trim().min(11, "Informe o CPF").max(20).refine(isValidCPF, "Informe um CPF válido"),
  insurer: z.string().trim().max(120).optional(),
  service_type: z.enum(SERVICE_TYPES, { message: "Selecione um tipo de serviço válido" }),
  priority: z.enum(PRIORITIES),
  address_cep: z.string().trim().refine(isValidCEP, "Informe um CEP válido"),
  address_street: z.string().trim().min(2, "Informe o logradouro").max(200),
  address_number: z.string().trim().min(1, "Informe o número").max(20),
  address_complement: z.string().trim().max(120).optional(),
  address_district: z.string().trim().min(2, "Informe o bairro").max(120),
  city: z.string().trim().min(2, "Informe a cidade").max(120),
  address_state: z.string().trim().length(2, "Informe a UF").toUpperCase(),
  destination: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
  driver_id: z.string().uuid().nullable().optional(),
});

const driverSchema = z.object({
  re: z.string().trim().min(1, "Informe o RE").max(30),
  name: z.string().trim().min(2, "Informe o nome").max(120),
  cpf: z.string().trim().min(11, "CPF inválido").max(14).refine(isValidCPF, "Informe um CPF válido"),
  phone: z.string().trim().max(20).optional().refine((value) => !value || isValidBRPhone(value), "Informe um telefone brasileiro válido"),
  vehicle: z.string().trim().max(80).optional(),
  plate: z.string().trim().max(10).optional(),
  city: z.string().trim().max(120).optional(),
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ativos");
  const accountPlanFn = useServerFn(getAccountPlan);

  const accountPlan = useQuery({
    queryKey: ["account-plan"],
    queryFn: () => accountPlanFn(),
  });

  const protocols = useQuery({
    queryKey: ["protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocols")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Protocol[];
    },
  });

  const drivers = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Driver[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("ops-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "protocols" }, () => {
        queryClient.invalidateQueries({ queryKey: ["protocols"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["drivers"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const list = useMemo(() => {
    const all = protocols.data ?? [];
    if (filter === "ativos")
      return all.filter((p) => !["concluido", "cancelado"].includes(p.status));
    if (filter === "todos") return all;
    return all.filter((p) => p.status === filter);
  }, [protocols.data, filter]);

  const selected = (protocols.data ?? []).find((p) => p.id === selectedId) ?? null;

  const kpis = useMemo(() => {
    const all = protocols.data ?? [];
    return {
      abertos: all.filter((p) => !["concluido", "cancelado"].includes(p.status)).length,
      aguardando: all.filter((p) => p.status === "aguardando_aceite").length,
      rota: all.filter((p) => ["em_deslocamento", "chegou", "em_atendimento"].includes(p.status))
        .length,
      concluidosHoje: all.filter(
        (p) =>
          p.finished_at && new Date(p.finished_at).toDateString() === new Date().toDateString(),
      ).length,
    };
  }, [protocols.data]);

  const [signOutBusy, setSignOutBusy] = useState(false);

  async function signOut() {
    if (signOutBusy) return;
    setSignOutBusy(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-2 sm:flex-nowrap sm:py-0">
          <Link to="/" className="min-w-0">
            <Logo />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <NewProtocolDialog
              drivers={drivers.data ?? []}
              disabled={accountPlan.data?.remaining === 0}
            />
            <Button variant="ghost" size="sm" onClick={signOut} disabled={signOutBusy} loading={signOutBusy}>
              {!signOutBusy ? <LogOut className="size-4" /> : null}
              {signOutBusy ? "Saindo..." : "Sair"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-7">
        <h1 className="text-2xl font-bold text-foreground">
          {accountPlan.data?.company ? `Olá, ${accountPlan.data.company}` : "Base operacional"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todos os atendimentos em andamento, em tempo real.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Atendimentos abertos" value={kpis.abertos} />
          <Kpi label="Aguardando aceite" value={kpis.aguardando} />
          <Kpi label="Em rota / no local" value={kpis.rota} />
          <Kpi label="Concluídos hoje" value={kpis.concluidosHoje} />
        </div>

        {accountPlan.isLoading ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : accountPlan.data ? (
          <AccountPlanOverview usage={accountPlan.data} />
        ) : null}

        <Tabs defaultValue="protocolos" className="mt-7">
          <TabsList>
            <TabsTrigger value="protocolos">
              <Truck className="size-4" />
              Protocolos
            </TabsTrigger>
            <TabsTrigger value="motoristas">
              <Users className="size-4" />
              Motoristas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="protocolos" className="mt-5">
            <div className="flex flex-wrap gap-2">
              {["ativos", "todos", ...PROTOCOL_STATUSES].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    filter === key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {key === "ativos"
                    ? "Ativos"
                    : key === "todos"
                      ? "Todos"
                      : STATUS_LABEL[key as ProtocolStatus]}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
              <div className="space-y-3">
                {protocols.isLoading ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : list.length === 0 ? (
                  <div className="surface p-8 text-center text-sm text-muted-foreground">
                    Nenhum protocolo neste filtro. Crie o primeiro atendimento.
                  </div>
                ) : (
                  list.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`interactive surface w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        selectedId === p.id ? "ring-2 ring-primary" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{p.number}</p>
                          <p className="mt-0.5 font-semibold text-foreground">{p.client_name}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {p.origin}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(p.status)}`}
                        >
                          {STATUS_LABEL[p.status as ProtocolStatus] ?? p.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {p.service_type ?? "Atendimento"} · {PRIORITY_LABEL[p.priority] ?? p.priority}
                        </span>
                        <span>{formatDateTime(p.created_at)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="lg:sticky lg:top-24 lg:self-start">
                {selected ? (
                  <ProtocolDetail protocol={selected} drivers={drivers.data ?? []} />
                ) : (
                  <div className="surface p-8 text-center text-sm text-muted-foreground">
                    Selecione um protocolo para ver mapa, linha do tempo e chat.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="motoristas" className="mt-5">
            <div className="mb-4 flex justify-end">
              <NewDriverDialog />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(drivers.data ?? []).map((d) => (
                <div key={d.id} className="surface surface-elevated p-4">
                  <div className="flex items-center justify-between gap-2">
                   <div>
                     <p className="font-semibold text-foreground">{d.name}</p>
                     <p className="text-xs text-muted-foreground">RE {d.re}</p>
                   </div>
                     <span
                       className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                         d.status === "disponivel"
                           ? "border-primary/30 bg-primary/10 text-primary"
                           : "border-border text-muted-foreground"
                       }`}
                     >
                      {DRIVER_STATUS_LABEL[d.status] ?? d.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d.vehicle ?? "Veículo"} · {d.plate ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{d.city ?? "—"}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Último sinal: {d.last_seen ? formatDateTime(d.last_seen) : "—"}
                  </p>
                </div>
              ))}
              {(drivers.data ?? []).length === 0 && !drivers.isLoading ? (
                <div className="surface p-8 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
                  Cadastre os motoristas da sua operação.
                </div>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface surface-elevated p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function AccountPlanOverview({ usage }: { usage: PlanUsage }) {
  const level = usageLevel(usage);
  const percent = usagePercent(usage);
  const message = usageMessage(usage);
  const upgradePlan = nextPlan(usage.planId);
  const isAtLimit = level === "full";

  return (
    <section className="mt-5 grid gap-3 lg:grid-cols-[1.25fr_1fr]" aria-label="Plano e utilização">
      <div className="surface surface-elevated p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <BarChart3 className="size-4 text-primary" /> Utilização mensal
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {usage.used} <span className="text-base font-medium text-muted-foreground">de {usage.limit} solicitações</span>
            </p>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {percent}% usado
          </span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted" aria-label={`${percent}% do limite utilizado`}>
          <div className="usage-progress h-full rounded-full" data-level={level} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{isAtLimit ? "Novas solicitações bloqueadas" : `${usage.remaining} solicitações restantes`}</span>
          <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> Renova em {formatPeriodDate(usage.periodEnd)}</span>
        </div>
        {message ? (
          <div className={`mt-4 rounded-md border px-3 py-2 text-sm ${isAtLimit ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-warning/30 bg-warning/10 text-warning-foreground"}`}>
            {message} {isAtLimit ? "Escolha um plano maior para continuar criando atendimentos." : ""}
          </div>
        ) : null}
      </div>

      <div className="surface surface-elevated p-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <CreditCard className="size-4 text-primary" /> Plano da conta
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-foreground">{usage.planName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {usage.price === 0 ? "Gratuito" : `R$ ${usage.price.toLocaleString("pt-BR")}/mês`}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link to="/plano" className="text-sm font-semibold text-primary transition-colors hover:text-primary-strong">Ver assinatura</Link>
            <Link to="/planos" className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-strong">
              {usage.planId === "scale" ? "Ver planos" : `Ir para ${planLabel(upgradePlan)}`} <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
        {usage.status === "past_due" ? (
          <div className="mt-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
            Não conseguimos confirmar o último pagamento. Seu acesso continua liberado enquanto tentamos novamente.{" "}
            <Link to="/plano" className="font-semibold underline">Atualizar cobrança</Link>
          </div>
        ) : null}
        {usage.status === "canceled" ? (
          <div className="mt-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
            Cancelamento agendado. Você mantém o plano até {formatPeriodDate(usage.periodEnd)}.
          </div>
        ) : null}
        <p className="mt-4 text-xs text-muted-foreground">O histórico permanece disponível mesmo quando o limite mensal é atingido.</p>

      </div>
    </section>
  );
}

function ProtocolDetail({ protocol, drivers }: { protocol: Protocol; drivers: Driver[] }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);
  const driver = drivers.find((d) => d.id === protocol.driver_id) ?? null;

  const messages = useQuery({
    queryKey: ["messages", protocol.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("protocol_id", protocol.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const points: MapPoint[] = [];
  if (protocol.origin_lat != null && protocol.origin_lng != null)
    points.push({
      lat: protocol.origin_lat,
      lng: protocol.origin_lng,
      label: protocol.client_name,
      kind: "client",
    });
  if (driver?.last_lat != null && driver.last_lng != null)
    points.push({ lat: driver.last_lat, lng: driver.last_lng, label: driver.name, kind: "driver" });

  async function updateStatus(status: string) {
    if (status === "concluido") {
      toast.error("A finalização exige o código informado pelo cliente.");
      return;
    }
    setBusy(true);
    const stamps: Record<string, string> = {
      aceito: "accepted_at",
      em_deslocamento: "en_route_at",
      chegou: "arrived_at",
      em_atendimento: "service_started_at",
      cancelado: "cancelled_at",
    };
    const now = new Date().toISOString();
    const stamp = stamps[status];
    const patch = { status, ...(stamp ? { [stamp]: now } : {}) };
    const { error } = await supabase.from("protocols").update(patch).eq("id", protocol.id);
    setBusy(false);
    if (error) toast.error("Não foi possível atualizar", { description: "A transição não foi aceita pelo atendimento." });
    else {
      toast.success(`Status: ${STATUS_LABEL[status as ProtocolStatus] ?? status}`);
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
    }
  }

  async function assignDriver(driverId: string) {
    setBusy(true);
    const { error } = await supabase
      .from("protocols")
      .update({ driver_id: driverId, status: "aceito", accepted_at: new Date().toISOString() })
      .eq("id", protocol.id);
    if (!error) await supabase.from("drivers").update({ status: "em_atendimento" }).eq("id", driverId);
    setBusy(false);
    if (error) toast.error("Não foi possível designar", { description: error.message });
    else {
      toast.success("Motorista designado");
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    }
  }

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (messageBusy) return;
    const input = e.currentTarget.elements.namedItem("body") as HTMLInputElement;
    const body = input.value.trim();
    if (!body) return;
    setMessageBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("messages").insert({
        protocol_id: protocol.id,
        body: body.slice(0, 1000),
        sender_role: "base",
        sender_id: auth.user?.id ?? null,
        sender_name: (auth.user?.user_metadata?.["full_name"] as string) ?? "Base operacional",
      });
      if (error) {
        toast.error("Mensagem não enviada", { description: error.message });
        return;
      }
      input.value = "";
      await messages.refetch();
    } finally {
      setMessageBusy(false);
    }
  }

  const nextStatuses = PROTOCOL_STATUSES.filter((s) => s !== protocol.status);

  return (
    <div className="space-y-5">
      <div className="surface surface-elevated p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{protocol.number}</p>
            <h2 className="mt-0.5 text-xl font-bold text-foreground">{protocol.client_name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {protocol.origin}
              {protocol.destination ? ` → ${protocol.destination}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {protocol.client_phone ?? "sem telefone"} · {protocol.insurer ?? "sem seguradora"}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(protocol.status)}`}
          >
            {STATUS_LABEL[protocol.status as ProtocolStatus] ?? protocol.status}
          </span>
        </div>

         <div className="mt-4 space-y-3">
           <div>
             <p className="text-xs font-medium text-muted-foreground">Motorista</p>
             {driver ? (
               <p className="mt-1 text-sm font-medium text-foreground">
                 RE {driver.re} · {driver.name} · {driver.plate ?? "—"}
               </p>
             ) : (
               <div className="mt-2 flex flex-wrap gap-2">
                 {drivers.length === 0 ? (
                   <p className="text-sm text-muted-foreground">Cadastre motoristas primeiro.</p>
                 ) : (
                   drivers.map((d) => (
                      <Button
                        key={d.id}
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        loading={busy}
                        onClick={() => assignDriver(d.id)}
                      >
                        {busy ? "Designando..." : `Designar RE ${d.re}`}
                      </Button>
                   ))
                 )}
               </div>
             )}
           </div>

           <div>
             <p className="text-xs font-medium text-muted-foreground">Alterar status</p>
             <div className="mt-2 flex flex-wrap gap-2">
               {nextStatuses.filter((s) => s !== "concluido").map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    loading={busy}
                    onClick={() => updateStatus(s)}
                  >
                    {busy ? "Atualizando..." : STATUS_LABEL[s]}
                  </Button>
               ))}
             </div>
           </div>
         </div>
      </div>

      <div className="surface surface-elevated overflow-hidden">
        <div className="h-[300px]">
          {points.length > 0 ? (
            <MapView points={points} />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Sem coordenadas ainda. Informe latitude/longitude na criação ou aguarde o motorista.
            </div>
          )}
        </div>
      </div>

      <div className="surface surface-elevated p-5">
        <h3 className="text-sm font-semibold text-foreground">Linha do tempo</h3>
        <ol className="mt-3 space-y-2.5">
          {TIMELINE_ORDER.map((step) => {
            const map: Record<string, string | null> = {
              aguardando_aceite: protocol.created_at,
              aceito: protocol.accepted_at,
              em_deslocamento: protocol.en_route_at,
              chegou: protocol.arrived_at,
              em_atendimento: protocol.service_started_at,
              concluido: protocol.finished_at,
            };
            const time = map[step] ?? null;
            return (
              <li key={step} className="flex items-start gap-3 text-sm">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${time ? "bg-primary" : "bg-border"}`}
                />
                <span className={time ? "text-foreground" : "text-muted-foreground"}>
                  {STATUS_LABEL[step]}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {time ? formatTime(time) : "—"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="surface surface-elevated p-5">
        <h3 className="text-sm font-semibold text-foreground">Chat com o motorista</h3>
        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
          {(messages.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
          ) : (
            (messages.data ?? []).map((m) => (
              <div
                key={m.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  m.sender_role === "base"
                    ? "bg-primary/10 text-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-[11px] text-muted-foreground">
                  {m.sender_name ?? m.sender_role} · {formatTime(m.created_at)}
                </p>
                <p>{m.body}</p>
              </div>
            ))
          )}
        </div>
        <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
          <Input name="body" placeholder="Escreva uma mensagem" maxLength={1000} disabled={messageBusy} />
          <Button type="submit" size="icon" aria-label="Enviar mensagem" disabled={messageBusy} loading={messageBusy}>
            {!messageBusy ? <Send className="size-4" /> : null}
          </Button>
        </form>
      </div>
    </div>
  );
}

function NewProtocolDialog({ drivers, disabled }: { drivers: Driver[]; disabled?: boolean }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const createProtocolFn = useServerFn(createProtocol);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const raw = Object.fromEntries(form.entries());
    const parsed = protocolSchema.safeParse({
      ...raw,
      address_complement: raw["address_complement"] || undefined,
      destination: raw["destination"] || undefined,
      insurer: raw["insurer"] || undefined,
      notes: raw["notes"] || undefined,
      driver_id: raw["driver_id"] || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setBusy(true);
    try {
      const cepData = await lookupCep({ data: { cep: parsed.data.address_cep } });
      if (!cepData) {
        toast.error("CEP não encontrado", { description: "Confira o CEP e revise o endereço antes de criar." });
        return;
      }
      const d = parsed.data;
      const coordinates = await geocodeAddress({ data: {
        cep: d.address_cep,
        street: d.address_street,
        number: d.address_number,
        city: d.city,
        state: d.address_state,
      } });
      await createProtocolFn({ data: {
        ...d,
        client_phone: d.client_phone,
        client_cpf: d.client_cpf,
        address_cep: d.address_cep,
        origin_lat: coordinates?.lat ?? null,
        origin_lng: coordinates?.lng ?? null,
        driver_id: d.driver_id || null,
      } });
      toast.success("Protocolo criado");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
      queryClient.invalidateQueries({ queryKey: ["account-plan"] });
    } catch (error) {
      if (error instanceof Error && error.message === PLAN_LIMIT_CODE) {
        toast.error("Limite mensal atingido", { description: "Acesse Planos para escolher uma opção com mais solicitações." });
      } else {
        toast.error(error instanceof Error ? error.message : "Não foi possível criar o protocolo");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Novo protocolo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo atendimento</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo do cliente" name="client_name" required />
            <Field label="Telefone" name="client_phone" required inputMode="tel" />
            <Field label="CPF" name="client_cpf" required inputMode="numeric" />
            <Field label="Seguradora" name="insurer" />
            <div className="space-y-2">
              <Label htmlFor="service_type">Tipo de serviço</Label>
              <select
                id="service_type"
                name="service_type"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue={SERVICE_TYPES[0]}
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <select
                id="priority"
                name="priority"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="normal"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">Endereço do atendimento</p>
            <p className="mt-1 text-xs text-muted-foreground">Informe o CEP para preencher os dados e revise tudo antes de criar.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <Field label="CEP" name="address_cep" required inputMode="numeric" onBlur={async (e) => {
                const result = await lookupCep({ data: { cep: e.currentTarget.value } });
                if (!result) return;
                const form = e.currentTarget.form;
                if (!form) return;
                for (const [name, value] of [["address_street", result.street], ["address_district", result.district], ["city", result.city], ["address_state", result.state]] as const) {
                  const field = form.elements.namedItem(name);
                  if (field instanceof HTMLInputElement && !field.value) field.value = value;
                }
              }} />
              <Field label="Logradouro" name="address_street" required />
              <Field label="Número" name="address_number" required />
              <Field label="Complemento" name="address_complement" />
              <Field label="Bairro" name="address_district" required />
              <Field label="Cidade" name="city" required />
              <Field label="Estado/UF" name="address_state" required maxLength={2} />
            </div>
          </div>
          <Field label="Destino" name="destination" />
          <div className="space-y-2">
            <Label htmlFor="driver_id">Motorista (opcional)</Label>
            <select
              id="driver_id"
              name="driver_id"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue=""
            >
              <option value="">Aguardar aceite</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  RE {d.re} · {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={3} maxLength={1000} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy} loading={busy}>
              {busy ? "Criando..." : "Criar protocolo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewDriverDialog() {
  const queryClient = useQueryClient();
  const createDriverFn = useServerFn(createDriver);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = driverSchema.safeParse(Object.fromEntries(form.entries()));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setBusy(true);
    try {
      await createDriverFn({ data: parsed.data });
      toast.success("Motorista cadastrado");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4" />
          Novo motorista
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar motorista</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <Field label="RE" name="re" required />
          <Field label="Nome" name="name" required />
          <Field label="CPF (usado no login do app)" name="cpf" required inputMode="numeric" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone" name="phone" inputMode="tel" />
            <Field label="Cidade" name="city" />
            <Field label="Veículo" name="vehicle" />
            <Field label="Placa" name="plate" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy} loading={busy}>
              {busy ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  required,
  onBlur,
  inputMode,
  maxLength,
}: {
  label: string;
  name: string;
  required?: boolean;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} maxLength={maxLength ?? 200} inputMode={inputMode} onBlur={onBlur} />
    </div>
  );
}
