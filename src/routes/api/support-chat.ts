import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(30),
});

const SYSTEM_PROMPT = `Você é o assistente de suporte do AcompanhaAí, um SaaS de acompanhamento operacional de assistências 24h.
Responda em português do Brasil, de forma curta, clara e cordial (no máximo 4 frases ou uma lista curta).

Contexto do produto:
- Base operacional: cria protocolos, gerencia motoristas e acompanha indicadores.
- Área do motorista: aceita chamados, envia posição por GPS e conversa por chat.
- Acompanhamento público: o cliente informa o número do protocolo e vê status, mapa e dados do motorista.
- Cadastro na tela de acesso com CNPJ ou CPF, razão social e dados do responsável. Não há login com Google.
- Motoristas recebem acesso cadastrado pela base operacional.
- Planos: Free (10 solicitações/mês), e planos maiores com 100, 500 e 2.000 solicitações/mês. Upgrade self-service.
- A posição do motorista atualiza automaticamente enquanto o app dele está aberto.

Regras: não invente dados, preços, prazos, telefones ou e-mails que não estejam aqui. Se não souber, diga que não tem essa informação e sugira enviar uma mensagem pela página "Falar com o time".`;

export const Route = createFileRoute("/api/support-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
          return new Response("Requisição inválida", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("Suporte de IA indisponível", { status: 503 });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.7-flash",
            stream: true,
            service_tier: "priority",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...parsed.data.messages.map((m) => ({
                role: m.role,
                content: m.content.slice(0, 2000),
              })),
            ],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          console.error("support-chat gateway error", upstream.status, detail);
          if (upstream.status === 429) {
            return new Response("Muitas mensagens agora. Tente novamente em instantes.", {
              status: 429,
            });
          }
          return new Response("Não foi possível falar com o assistente agora.", { status: 502 });
        }

        return new Response(upstream.body, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
            connection: "keep-alive",
          },
        });
      },
    },
  },
});
