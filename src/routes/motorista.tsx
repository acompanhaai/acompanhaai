import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Navigation, Send } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MapView, type MapPoint } from "@/components/map/MapView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { finishWithCode } from "@/lib/atendimento.functions";
import {
  STATUS_LABEL,
  formatTime,
  haversineKm,
  onlyDigits,
  statusTone,
  type ProtocolStatus,
} from "@/lib/protocol";

export const Route = createFileRoute("/motorista")({
  head: () => ({
    meta: [
      { title: "Área do motorista — AcompanhaAí" },
      {
        name: "description",
        content: "Aceite chamados, atualize o status e envie sua posição em tempo real.",
      },
      { property: "og:title", content: "Área do motorista — AcompanhaAí" },
      { property: "og:description", content: "App operacional do motorista AcompanhaAí." },
    ],
  }),
  ssr: false,
  component: DriverGate,
});

const FLOW: { status: ProtocolStatus; label: string; stamp: string }[] = [
  { status: "em_deslocamento", label: "Iniciar deslocamento", stamp: "en_route_at" },
  { status: "chegou", label: "Cheguei ao local", stamp: "arrived_at" },
  { status: "em_atendimento", label: "Iniciar atendimento", stamp: "service_started_at" },
];

function DriverGate() {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(Boolean(s)));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === null) return <Skeleton className="h-40 w-full" />;
  if (!session) return <DriverLogin />;
  return <DriverApp />;
}

function DriverLogin() {
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    setLoading(false);
    if (error) toast.error("Não foi possível entrar", { description: "Verifique seus dados." });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-5">
          <Link to="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="surface w-full max-w-sm p-7">
          <h1 className="text-xl font-bold text-foreground">Área do Motorista</h1>
          <p className="mt-1 text-sm text-muted-foreground">
             Acesse sua conta com os dados cadastrados pela base operacional
          </p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="driver-email">E-mail</Label>
              <Input
                id="driver-email"
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver-password">Senha</Label>
              <Input
                id="driver-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar como motorista"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
             Não tem acesso? Peça à base operacional para cadastrar você na lista de motoristas
          </p>
        </div>
      </main>
    </div>
  );
}

function DriverApp() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sharing, setSharing] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishCode, setFinishCode] = useState("");
  const [finishBusy, setFinishBusy] = useState(false);
  const finishWithCodeFn = useServerFn(finishWithCode);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const driver = useQuery({
    queryKey: ["me-driver"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;
      const linked = await supabase.from("drivers").select("*").eq("user_id", user.id).maybeSingle();
      if (linked.data) return linked.data;
      const cpf = onlyDigits((user.email ?? "").split("@")[0] ?? "");
      if (cpf.length >= 11) {
        const byCpf = await supabase.from("drivers").select("*").eq("cpf", cpf).maybeSingle();
        if (byCpf.data) {
          await supabase.from("drivers").update({ user_id: user.id }).eq("id", byCpf.data.id);
          return { ...byCpf.data, user_id: user.id };
        }
      }
      return null;
    },
  });

  const protocols = useQuery({
    queryKey: ["driver-protocols", driver.data?.id],
    enabled: Boolean(driver.data?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocols")
        .select("*")
        .or(`driver_id.eq.${driver.data!.id},status.eq.aguardando_aceite`)
        .not("status", "in", "(concluido,cancelado)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const active = (protocols.data ?? []).find(
    (p) => p.driver_id === driver.data?.id && p.status !== "aguardando_aceite",
  );
  const pending = (protocols.data ?? []).filter((p) => p.status === "aguardando_aceite");

  useEffect(() => {
    if (!sharing || !driver.data?.id) return;
    const push = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });
          await supabase
            .from("drivers")
            .update({ last_lat: lat, last_lng: lng, last_seen: new Date().toISOString() })
            .eq("id", driver.data!.id);
          await supabase.from("location_history").insert({
            driver_id: driver.data!.id,
            protocol_id: active?.id ?? null,
            lat,
            lng,
          });
        },
        () => {
          toast.error("Não foi possível obter sua localização");
          setSharing(false);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    };
    push();
    timer.current = setInterval(push, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [sharing, driver.data?.id, active?.id]);

  async function accept(id: string) {
    if (!driver.data?.id) return;
    const { error } = await supabase
      .from("protocols")
      .update({ driver_id: driver.data.id, status: "aceito", accepted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Não foi possível aceitar", { description: error.message });
    else {
      toast.success("Chamado aceito");
      setSharing(true);
      queryClient.invalidateQueries({ queryKey: ["driver-protocols"] });
    }
  }

  async function advance(step: (typeof FLOW)[number]) {
    if (!active) return;
    const now = new Date().toISOString();
    const patch =
      step.status === "em_deslocamento"
        ? { status: step.status, en_route_at: now }
        : step.status === "chegou"
          ? { status: step.status, arrived_at: now }
          : { status: step.status, service_started_at: now };
    const { error } = await supabase.from("protocols").update(patch).eq("id", active.id);
    if (error) toast.error("Não foi possível atualizar", { description: error.message });
    else {
      toast.success(STATUS_LABEL[step.status]);
      queryClient.invalidateQueries({ queryKey: ["driver-protocols"] });
    }
  }

  async function finish() {
    if (!active || !/^\d{4}$/.test(finishCode)) {
      toast.error("Digite o código de 4 dígitos informado pelo cliente.");
      return;
    }
    setFinishBusy(true);
    const result = await finishWithCodeFn({ data: { protocolId: active.id, code: finishCode } });
    setFinishBusy(false);
    if (!result.ok) {
      toast.error("Não foi possível finalizar", { description: result.error });
      return;
    }
    setFinishOpen(false);
    setFinishCode("");
    setSharing(false);
    toast.success("Atendimento finalizado");
    queryClient.invalidateQueries({ queryKey: ["driver-protocols"] });
    queryClient.invalidateQueries({ queryKey: ["me-driver"] });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const points: MapPoint[] = [];
  if (active?.origin_lat != null && active.origin_lng != null)
    points.push({
      lat: active.origin_lat,
      lng: active.origin_lng,
      label: active.client_name,
      kind: "client",
    });
  if (coords) points.push({ ...coords, label: "Você", kind: "driver" });
  const distanceKm = points.length === 2 ? haversineKm(points[0]!, points[1]!) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-5">
          <Link to="/" className="min-w-0">
            <Logo />
          </Link>
          <Button className="shrink-0" variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-7">
        {driver.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !driver.data ? (
          <div className="surface p-8 text-center">
            <p className="font-medium text-foreground">Conta de motorista não vinculada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Peça à base operacional para cadastrar o seu CPF na lista de motoristas.
            </p>
          </div>
        ) : (
          <>
            <div className="surface flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <h1 className="text-xl font-bold text-foreground">Olá, {driver.data.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  RE {driver.data.re} · {driver.data.vehicle ?? "Veículo"} · {driver.data.plate ?? "—"}
                </p>
              </div>
              <Button
                variant={sharing ? "secondary" : "default"}
                onClick={() => setSharing((v) => !v)}
              >
                <Navigation className={sharing ? "size-4 animate-pulse" : "size-4"} />
                {sharing ? "Enviando posição" : "Compartilhar posição"}
              </Button>
            </div>

            {sharing ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Posição enviada a cada 5 segundos enquanto esta tela estiver aberta.
              </p>
            ) : null}

            {active ? (
              <div className="surface mt-5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{active.number}</p>
                    <h2 className="mt-0.5 text-lg font-bold text-foreground">{active.client_name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{active.origin}</p>
                    {active.destination ? (
                      <p className="text-sm text-muted-foreground">Destino: {active.destination}</p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(active.status)}`}
                  >
                    {STATUS_LABEL[active.status as ProtocolStatus] ?? active.status}
                  </span>
                </div>

                {distanceKm != null ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Distância até o cliente: {distanceKm.toFixed(1)} km
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {FLOW.filter((step) => {
                    const order = ["aceito", "em_deslocamento", "chegou", "em_atendimento"];
                    return order.indexOf(step.status) === order.indexOf(active.status) + 1;
                  }).map((step) => (
                    <Button key={step.status} size="sm" variant="secondary" onClick={() => advance(step)}>
                      {step.label}
                    </Button>
                  ))}
                  {active.status === "em_atendimento" ? (
                    <Button size="sm" onClick={() => setFinishOpen(true)}>
                      Finalizar atendimento
                    </Button>
                  ) : null}
                  {active.client_phone ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${active.client_phone}`}>Ligar para o cliente</a>
                    </Button>
                  ) : null}
                </div>

                {finishOpen ? (
                  <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-4">
                    <p className="text-sm font-semibold text-foreground">Atenção</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      O atendimento só pode ser finalizado após a confirmação do cliente.
                    </p>
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <div className="min-w-48 flex-1 space-y-2">
                        <Label htmlFor="finish-code">Digite o código de 4 dígitos informado pelo cliente</Label>
                        <Input
                          id="finish-code"
                          value={finishCode}
                          onChange={(event) => setFinishCode(onlyDigits(event.target.value).slice(0, 4))}
                          inputMode="numeric"
                          maxLength={4}
                          autoComplete="off"
                        />
                      </div>
                      <Button onClick={finish} disabled={finishBusy || finishCode.length !== 4}>
                        {finishBusy ? "Validando..." : "Confirmar e finalizar"}
                      </Button>
                      <Button variant="ghost" onClick={() => { setFinishOpen(false); setFinishCode(""); }}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : null}

                {points.length > 0 ? (
                  <div className="mt-4 h-64 overflow-hidden rounded-lg">
                    <MapView points={points} />
                  </div>
                ) : null}

                <DriverChat protocolId={active.id} driverName={driver.data.name} />
              </div>
            ) : (
              <div className="surface mt-5 p-6 text-sm text-muted-foreground">
                Nenhum atendimento em andamento.
              </div>
            )}

            <h2 className="mt-8 text-sm font-semibold text-foreground">Chamados disponíveis</h2>
            <div className="mt-3 space-y-3">
              {pending.length === 0 ? (
                <div className="surface p-5 text-sm text-muted-foreground">
                  Nenhum chamado aguardando aceite.
                </div>
              ) : (
                pending.map((p) => (
                  <div key={p.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{p.number}</p>
                      <p className="font-semibold text-foreground">{p.client_name}</p>
                      <p className="text-xs text-muted-foreground">{p.origin}</p>
                    </div>
                    <Button size="sm" onClick={() => accept(p.id)}>
                      Aceitar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function DriverChat({ protocolId, driverName }: { protocolId: string; driverName: string }) {
  const messages = useQuery({
    queryKey: ["messages", protocolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    refetchInterval: 8000,
  });

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("body") as HTMLInputElement;
    const body = input.value.trim();
    if (!body) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Sessão expirada", { description: "Entre novamente para enviar mensagens." });
      return;
    }
    const { error } = await supabase.from("messages").insert({
      protocol_id: protocolId,
      body: body.slice(0, 1000),
      sender_role: "motorista",
      sender_id: auth.user.id,
      sender_name: driverName,
    });
    if (error) toast.error("Mensagem não enviada", { description: error.message });
    else {
      input.value = "";
      messages.refetch();
    }
  }

  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground">Chat com a base</h3>
      <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
        {(messages.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
        ) : (
          (messages.data ?? []).map((m) => (
            <div
              key={m.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                m.sender_role === "motorista" ? "bg-primary/10" : "bg-muted"
              }`}
            >
              <p className="text-[11px] text-muted-foreground">
                {m.sender_name ?? m.sender_role} · {formatTime(m.created_at)}
              </p>
              <p className="text-foreground">{m.body}</p>
            </div>
          ))
        )}
      </div>
      <form className="mt-3 flex gap-2" onSubmit={send}>
        <Input name="body" placeholder="Mensagem para a base" maxLength={1000} />
        <Button type="submit" size="icon" aria-label="Enviar mensagem">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
