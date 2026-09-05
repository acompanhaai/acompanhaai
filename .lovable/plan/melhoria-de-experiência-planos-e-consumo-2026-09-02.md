# Melhoria de experiência, planos e consumo

## Objetivo

Implementar controle mensal real de solicitações, experiência autenticada mais clara e microinterações leves, preservando o Paddle, as rotas e as funcionalidades operacionais existentes.

## Entregas

- Criar autoridade de consumo no banco: plano, limite, período, status e uso por conta; reset automático por período sem apagar histórico.
- Tornar a criação de protocolo atômica e server-side: validar limite, criar a solicitação e incrementar o uso na mesma operação; devolver um resultado tratável quando o limite for atingido.
- Sincronizar o plano da conta com eventos do Paddle, mantendo acesso durante o período já pago em cancelamentos.
- Expor uso/plano da conta autenticada por função protegida e adicionar card de utilização, aviso progressivo e card de plano ao dashboard.
- Carregar a razão social do perfil autenticado e mostrar saudação dinâmica com fallback amigável.
- Criar modal/estado de limite com upgrade e link para planos/checkout; manter planos, preços e limites existentes.
- Aplicar feedback consistente em ações: loading, toasts, hover/pressed states e skeletons de dados.
- Adicionar transições CSS curtas e respeitar `prefers-reduced-motion`, sem dependências novas ou animações de layout.
- Verificar responsividade e performance em desktop e mobile, além de typecheck, lint, rotas, console e fluxo principal.

## Detalhes técnicos

- Reutilizar `profiles`, `protocols`, `subscriptions`, Paddle e componentes shadcn existentes.
- Não criar autenticação, checkout, tabela de planos ou sistema de notificações paralelo.
- Funções de banco usarão `auth.uid()`, RLS/grants existentes e privilégios mínimos; nenhum valor de uso enviado pelo navegador será confiável.
- A interface tratará o código de limite de forma amigável e não exibirá erro técnico.
