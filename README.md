# AcompanhaAí

SaaS de gestão de assistência 24h: Base Operacional, App do Motorista e
acompanhamento público do Segurado, com rastreamento em tempo real.

> Mais controle para a operação. Mais transparência para quem espera.

## Stack

- **Frontend/Backend:** [TanStack Start](https://tanstack.com/start) (React 19) + Vite 8 + TypeScript
- **UI:** Tailwind CSS v4 + Radix UI / shadcn
- **Banco/Auth/Realtime:** Supabase (Postgres, Auth, Row Level Security, Realtime)
- **Pagamentos:** [Paddle](https://www.paddle.com) (assinaturas, checkout, portal do cliente, webhooks)
- **IA de suporte:** Google Gemini via [Vercel AI SDK](https://ai-sdk.dev)
- **Mapa:** Leaflet + OpenStreetMap (sem chave de API)
- **Deploy:** Cloudflare Workers (via [Nitro](https://nitro.build))
- **Gerenciador de pacotes:** [Bun](https://bun.sh)

## Rodando localmente

```sh
bun install
cp .env.example .env   # preencha com suas chaves (veja abaixo)
bun run dev             # http://localhost:8080
```

Outros comandos: `bun run build`, `bun run lint`, `bun run format`, `bunx tsc --noEmit`.

## Variáveis de ambiente

Veja `.env.example` para a lista completa e onde obter cada chave. Resumo:

| Variável | Onde obter |
|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Idem (secreta, só servidor) |
| `PADDLE_SANDBOX_API_KEY`, `PADDLE_LIVE_API_KEY` | Paddle Dashboard → Developer Tools → Authentication |
| `PAYMENTS_SANDBOX_WEBHOOK_SECRET`, `PAYMENTS_LIVE_WEBHOOK_SECRET` | Paddle Dashboard → Developer Tools → Notifications (uma por webhook cadastrado) |
| `VITE_PAYMENTS_CLIENT_TOKEN` | Paddle Dashboard → Developer Tools → Authentication (client-side token) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |

Nenhum secret fica no código ou é commitado — apenas `SUPABASE_URL` e a chave
publishable (protegidas por RLS, não por sigilo) são seguras de expor.

## Arquitetura

```
src/
  routes/            rotas TanStack Router (file-based) — páginas e endpoints /api
  routes/_authenticated/   painel da Base Operacional (protegido, ssr: false)
  lib/*.functions.ts       server functions (validação zod + acesso ao banco)
  lib/*.server.ts          código só-servidor (Paddle, checkout, cron etc.)
  integrations/supabase/   clientes Supabase (browser, service-role, auth middleware)
  components/               componentes de UI (components/ui = shadcn)
supabase/migrations/  schema Postgres, RLS, triggers e funções (SQL, ordem cronológica)
```

- **Autenticação:** Supabase Auth (e-mail/senha). Multi-tenant por empresa via
  Row Level Security no Postgres — nunca confiar só no frontend.
- **Tempo real:** Supabase Realtime (protocolos, mensagens, localização do motorista).
- **Pagamentos:** integração direta com a API do Paddle (sem proxy/gateway
  intermediário) — assinatura, upgrade/downgrade, cancelamento, portal do
  cliente e webhook idempotente em `src/routes/api/public/payments/webhook.ts`.

## Deploy

Build gera um Cloudflare Worker (`bun run build` → `.output/`). Deploy com
`npx nitro deploy --prebuilt` ou via CI apontando para o Worker gerado.
Configure as mesmas variáveis de ambiente do `.env.example` como secrets do
Worker (`wrangler secret put <nome>` ou pelo dashboard da Cloudflare).

## Serviços externos

Supabase, Paddle e Google AI Studio (assistente de suporte). Nenhuma
dependência de plataforma de terceiros para rodar em produção — veja
`CUSTOS_DO_PROJETO.md` para o detalhamento de custos de cada serviço.
