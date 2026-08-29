import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { LogOut, MapPin, Plus, Send, Truck, Users } from "lucide-react";
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
  formatDateTime,
  formatTime,
  onlyDigits,
  statusTone,
  type ProtocolStatus,
} from "@/lib/protocol";

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
  client_name: z.string().trim().min(2, "Informe o nome do cliente").max(120),
  client_phone: z.string().trim().max(20).optional(),
  client_cpf: z.string().trim().max(20).optional(),
  insurer: z.string().trim().max(120).optional(),
  service_type: z.string().trim().max(60),
  priority: z.string().trim().max(20),
  origin: z.string().trim().min(3, "Informe o local de origem").max(200),
  destination: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  origin_lat: z.coerce.number().min(-90).max(90).optional(),
  origin_lng: z.coerce.number().min(-180).max(180).optional(),
  notes: z.string().trim().max(1000).optional(),
});

const driverSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  cpf: z.string().trim().min(11, "CPF inválido").max(14),
  phone: z.string().trim().max(20).optional(),
  vehicle: z.string().trim().max(80).optional(),
  plate: z.string().trim().max(10).optional(),
  city: z.string().trim().max(120).optional(),
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ativos");

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

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <NewProtocolDialog drivers={drivers.data ?? []} />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-7">
        <h1 className="text-2xl font-bold text-foreground">Base operacional</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todos os atendimentos em andamento, em tempo real.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Atendimentos abertos" value={kpis.abertos} />
          <Kpi label="Aguardando aceite" value={kpis.aguardando} />
          <Kpi label="Em rota / no local" value={kpis.rota} />
          <Kpi label="Concluídos hoje" value={kpis.concluidosHoje} />
        </div>

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
                  onClick={() => setFilter(key)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
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
                      onClick={() => setSelectedId(p.id)}
                      className={`surface w-full p-4 text-left transition-colors ${
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
                <div key={d.id} className="surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{d.name}</p>
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
    <div className="surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function ProtocolDetail({ protocol, drivers }: { protocol: Protocol; drivers: Driver[] }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
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
    setBusy(true);
    const stamps: Record<string, string> = {
      aceito: "accepted_at",
      em_deslocamento: "en_route_at",
      chegou: "arrived_at",
      em_atendimento: "service_started_at",
      concluido: "finished_at",
      cancelado: "cancelled_at",
    };
    const patch: Record<string, unknown> = { status };
    const stamp = stamps[status];
    if (stamp) patch[stamp] = new Date().toISOString();
    const { error } = await supabase.from("protocols").update(patch).eq("id", protocol.id);
    setBusy(false);
    if (error) toast.error("Não foi possível atualizar", { description: error.message });
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
    const input = e.currentTarget.elements.namedItem("body") as HTMLInputElement;
    const body = input.value.trim();
    if (!body) return;
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("messages").insert({
      protocol_id: protocol.id,
      body: body.slice(0, 1000),
      sender_role: "base",
      sender_id: auth.user?.id ?? null,
      sender_name: (auth.user?.user_metadata?.["full_name"] as string) ?? "Base operacional",
    });
    if (error) toast.error("Mensagem não enviada", { description: error.message });
    else {
      input.value = "";
      messages.refetch();
    }
  }

  const nextStatuses = PROTOCOL_STATUSES.filter((s) => s !== protocol.status);

  return (
    <div className="space-y-5">
      <div className="surface p-5">
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
                {driver.name} · {driver.plate ?? "—"}
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
                      onClick={() => assignDriver(d.id)}
                    >
                      Designar {d.name.split(" ")[0]}
                    </Button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Alterar status</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {nextStatuses.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => updateStatus(s)}
                >
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
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

      <div className="surface p-5">
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

      <div className="surface p-5">
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
          <Input name="body" placeholder="Escreva uma mensagem" maxLength={1000} />
          <Button type="submit" size="icon" aria-label="Enviar mensagem">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function NewProtocolDialog({ drivers }: { drivers: Driver[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const raw = Object.fromEntries(form.entries());
    const parsed = protocolSchema.safeParse({
      ...raw,
      origin_lat: raw["origin_lat"] || undefined,
      origin_lng: raw["origin_lng"] || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    const driverId = String(raw["driver_id"] ?? "");
    const { error } = await supabase.from("protocols").insert({
      ...parsed.data,
      client_cpf: parsed.data.client_cpf ? onlyDigits(parsed.data.client_cpf) : null,
      driver_id: driverId || null,
      status: driverId ? "aceito" : "aguardando_aceite",
      accepted_at: driverId ? new Date().toISOString() : null,
      created_by: auth.user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível criar o protocolo", { description: error.message });
      return;
    }
    toast.success("Protocolo criado");
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["protocols"] });
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
            <Field label="Nome do cliente" name="client_name" required />
            <Field label="Telefone" name="client_phone" />
            <Field label="CPF" name="client_cpf" />
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
          <Field label="Local de origem" name="origin" required />
          <Field label="Destino" name="destination" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cidade" name="city" />
            <Field label="Latitude" name="origin_lat" />
            <Field label="Longitude" name="origin_lng" />
          </div>
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
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={3} maxLength={1000} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
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
    const { error } = await supabase.from("drivers").insert({
      ...parsed.data,
      cpf: onlyDigits(parsed.data.cpf),
      status: "disponivel",
    });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível cadastrar", { description: error.message });
      return;
    }
    toast.success("Motorista cadastrado");
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
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
          <Field label="Nome" name="name" required />
          <Field label="CPF (usado no login do app)" name="cpf" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone" name="phone" />
            <Field label="Cidade" name="city" />
            <Field label="Veículo" name="vehicle" />
            <Field label="Placa" name="plate" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
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
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} maxLength={200} />
    </div>
  );
}
