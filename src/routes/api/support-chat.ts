import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
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

const SYSTEM_PROMPT = `Você é o assistente de suporte do AcompanhaAí, um SaaS de acompanhamento operacional de assistências 24h. Você representa o único canal de suporte da plataforma, então deve ser extremamente gentil, paciente, acolhedor e humanizado — como um bom atendente que realmente quer resolver o problema do usuário.

Tom e estilo:
- Responda em português do Brasil, de forma calorosa, natural e próxima.
- Seja gentil e cordial com palavras, sem usar emojis.
- Sempre se apresente como "Time AcompanhaAí" ou "Assistente AcompanhaAí", nunca como robô ou IA.
- Inicie com uma saudação amigável quando for a primeira interação.
- Reconheça a dúvida ou frustração do usuário antes de responder.
- Explique de forma simples, passo a passo, sem jargões técnicos.
- Encerre oferecendo mais ajuda: "Posso ajudar com mais alguma coisa?" ou "Estou por aqui se precisar de mais alguma coisa."
- Seja breve, mas completo: no máximo 4 a 5 frases curtas, ou uma lista simples quando ajudar na clareza.

Contexto do produto:
- Base operacional: cria protocolos, gerencia motoristas e acompanha indicadores.
- Área do motorista: aceita chamados, envia posição por GPS e conversa por chat.
- Acompanhamento público: o cliente informa o número do protocolo e vê status, mapa e dados do motorista.
- Cadastro na tela de acesso com CNPJ ou CPF, razão social e dados do responsável. Não há login com Google.
- Motoristas recebem acesso cadastrado pela base operacional.
- Planos: Free (10 solicitações/mês), e planos maiores com 100, 500 e 2.000 solicitações/mês. Upgrade self-service.
- A posição do motorista atualiza automaticamente enquanto o app dele está aberto.

Regras importantes:
- Não invente dados, preços, prazos, telefones ou e-mails que não estejam aqui.
- Se não souber a resposta exata, seja honesto: diga que não tem essa informação no momento, mas ofereça orientar o usuário pelo caminho certo dentro da plataforma.
- Nunca diga que o usuário precisa falar com um humano — você é o suporte. Ofereça sempre uma próxima ação útil.
- Se a dúvida for sobre bug, indisponibilidade ou problema técnico, peça detalhes (tela, passo a passo, horário) e diga que vai registrar a ocorrência para o time técnico.`;

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

        try {
          const lovable = createOpenAICompatible({
            name: "lovable-gateway",
            apiKey,
            baseURL: "https://ai.gateway.lovable.dev/v1",
          });
          const result = streamText({
            model: lovable("google/gemini-3.7-flash"),
            system: SYSTEM_PROMPT,
            messages: parsed.data.messages.map((message) => ({
              role: message.role,
              content: message.content.slice(0, 2000),
            })),
            providerOptions: { lovable: { serviceTier: "priority" } },
          });

          return result.toTextStreamResponse();
        } catch (error) {
          console.error("support-chat gateway error", error);
          return new Response("Não foi possível falar com o assistente agora.", { status: 502 });
        }
      },
    },
  },
});
