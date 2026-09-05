import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Send } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapView, type MapPoint } from "@/components/map/MapView";
import { Input } from "@/components/ui/input";
import {
  getPublicTracking,
  getTrackingMessages,
  sendTrackingMessage,
  type PublicTracking,
} from "@/lib/tracking.functions";
import {
  STATUS_LABEL,
  TIMELINE_ORDER,
  formatTime,
  haversineKm,
  statusTone,
  type ProtocolStatus,
} from "@/lib/protocol";

export const Route = createFileRoute("/acompanhar/$query")({
  head: () => ({
    meta: [
      { title: "Status do atendimento — AcompanhaAí" },
      {
        name: "description",
        content: "Acompanhe em tempo real o status, o motorista e a posição do guincho.",
      },
      { property: "og:title", content: "Status do atendimento — AcompanhaAí" },
      { property: "og:description", content: "Rastreamento ao vivo do seu atendimento." },
    ],
  }),
  component: TrackingPage,
});

const STEP_TIME: Record<string, keyof PublicTracking> = {
  aguardando_aceite: "created_at",
  aceito: "accepted_at",
  em_deslocamento: "en_route_at",
  chegou: "arrived_at",
  em_atendimento: "service_started_at",
  concluido: "finished_at",
};

function TrackingPage() {
  const { query } = Route.useParams();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["tracking", query],
    queryFn: () => getPublicTracking({ data: { query } }),
    refetchInterval: 8000,
  });

  const points: MapPoint[] = [];
  if (data?.origin_lat != null && data.origin_lng != null) {
    points.push({
      lat: data.origin_lat,
      lng: data.origin_lng,
      label: "Local do cliente",
      kind: "client",
    });
  }
  if (data?.driver?.last_lat != null && data.driver.last_lng != null) {
    points.push({
      lat: data.driver.last_lat,
      lng: data.driver.last_lng,
      label: data.driver.name,
      kind: "driver",
    });
  }

  const distanceKm = points.length === 2 ? haversineKm(points[0]!, points[1]!) : null;
  const etaMin = distanceKm != null ? Math.max(2, Math.round((distanceKm / 30) * 60)) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-5">
          <Link
            to="/"
            className="interactive min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Logo />
          </Link>
          <Button
            className="shrink-0"
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            loading={isFetching}
          >
            {!isFetching ? <RefreshCw className="size-4" /> : null}
            {isFetching ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : isError ? (
          <div className="surface surface-elevated p-8 text-center">
            <p className="font-medium text-foreground">Não foi possível consultar agora</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tente novamente em alguns segundos.
            </p>
            <Button
              className="mt-4"
              onClick={() => refetch()}
              loading={isFetching}
              disabled={isFetching}
            >
              {isFetching ? "Atualizando..." : "Tentar novamente"}
            </Button>
          </div>
        ) : !data ? (
          <div className="surface surface-elevated p-8 text-center">
            <p className="font-medium text-foreground">Protocolo não encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Confira o número informado ou o CPF do segurado.
            </p>
            <Button asChild className="mt-4">
              <Link to="/acompanhar">Nova consulta</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="surface surface-elevated flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Protocolo {data.number}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-foreground">
                  {STATUS_LABEL[data.status as ProtocolStatus] ?? data.status}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.service_type ?? "Atendimento"} · {data.origin}
                  {data.destination ? ` → ${data.destination}` : ""}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(data.status)}`}
              >
                {STATUS_LABEL[data.status as ProtocolStatus] ?? data.status}
              </span>
            </div>

            {data.confirmation_code && data.status !== "concluido" ? (
              <div className="rounded-xl border-2 border-warning/40 bg-warning/10 p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Código de confirmação
                </p>
                <p className="mt-2 text-4xl font-bold tracking-[0.35em] text-foreground">
                  {data.confirmation_code}
                </p>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  ⚠️ Só informe este código quando o motorista chegar ao local.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nunca informe o código durante o deslocamento. O atendimento só é finalizado
                  depois que você passar estes 4 dígitos ao motorista.
                </p>
              </div>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <div className="surface surface-elevated overflow-hidden">
                <div className="h-full min-h-[420px]">
                  {points.length > 0 ? (
                    <MapView
                      points={points}
                      trail={data.trail.map((t) => [t.lat, t.lng] as [number, number])}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                      A posição aparecerá aqui quando o motorista iniciar o deslocamento.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div className="surface surface-elevated p-5">
                  <h2 className="text-sm font-semibold text-foreground">Motorista</h2>
                  {data.driver ? (
                    <div className="mt-3 flex items-center gap-3">
                      <span className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                        {data.driver.photo_url ? (
                          <img
                            src={data.driver.photo_url}
                            alt={data.driver.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          data.driver.name.slice(0, 2).toUpperCase()
                        )}
                      </span>
                      <div className="text-sm">
                        <p className="font-semibold text-foreground">{data.driver.name}</p>
                        <p className="text-muted-foreground">
                          {data.driver.vehicle ?? "Veículo"} · {data.driver.plate ?? "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Estamos designando um motorista para o seu atendimento.
                    </p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">Distância</p>
                      <p className="font-semibold text-foreground">
                        {distanceKm != null ? `${distanceKm.toFixed(1)} km` : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">Tempo estimado</p>
                      <p className="font-semibold text-foreground">
                        {etaMin != null ? `${etaMin} min` : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <TrackingChat query={query} driverName={data.driver?.name ?? null} />

                <div className="surface surface-elevated p-5">
                  <h2 className="text-sm font-semibold text-foreground">Linha do tempo</h2>
                  <ol className="mt-4 space-y-3">
                    {TIMELINE_ORDER.map((step) => {
                      const key = STEP_TIME[step];
                      const time = key ? (data[key] as string | null) : null;
                      const done = Boolean(time);
                      return (
                        <li key={step} className="flex items-start gap-3">
                          <span
                            className={`mt-1 size-2.5 shrink-0 rounded-full ${
                              done ? "bg-primary" : "bg-border"
                            }`}
                          />
                          <div className="flex-1 text-sm">
                            <p
                              className={
                                done ? "font-medium text-foreground" : "text-muted-foreground"
                              }
                            >
                              {STATUS_LABEL[step]}
                            </p>
                            {done ? (
                              <p className="text-xs text-muted-foreground">{formatTime(time)}</p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TrackingChat({ query, driverName }: { query: string; driverName: string | null }) {
  const messages = useQuery({
    queryKey: ["tracking-messages", query],
    queryFn: () => getTrackingMessages({ data: { query } }),
    refetchInterval: 6000,
  });

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("body") as HTMLInputElement;
    const body = input.value.trim();
    if (!body) return;
    const res = await sendTrackingMessage({ data: { query, body } });
    if (!res.ok) {
      toast.error("Mensagem não enviada");
      return;
    }
    input.value = "";
    messages.refetch();
  }

  return (
    <div className="surface surface-elevated p-5">
      <h2 className="text-sm font-semibold text-foreground">
        Chat com {driverName ? `o motorista ${driverName}` : "o motorista"}
      </h2>
      <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
        {(messages.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Envie uma mensagem para falar direto com quem está no atendimento.
          </p>
        ) : (
          (messages.data ?? []).map((m) => (
            <div
              key={m.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                m.sender_role === "segurado" ? "bg-primary/10" : "bg-muted"
              }`}
            >
              <p className="text-[11px] text-muted-foreground">
                {m.sender_role === "segurado" ? "Você" : (m.sender_name ?? m.sender_role)} ·{" "}
                {formatTime(m.created_at)}
              </p>
              <p className="text-foreground">{m.body}</p>
            </div>
          ))
        )}
      </div>
      <form className="mt-3 flex gap-2" onSubmit={send}>
        <Input name="body" placeholder="Escreva sua mensagem" maxLength={1000} />
        <Button type="submit" size="icon" aria-label="Enviar mensagem">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
