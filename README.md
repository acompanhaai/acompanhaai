# Acompanha AÍ

Primeiro, sobre GitHub e LinkedIn.

GitHub

Grandes empresas usam GitHub, mas normalmente:

repositórios privados;

somente bibliotecas open source ficam públicas;

o produto principal quase nunca fica aberto.

Exemplos:

Netflix → open source de ferramentas, mas não do sistema da Netflix.

Uber → open source de bibliotecas, não do app do Uber.

Stripe → SDKs públicos, backend privado.

Então o AcompanhaAÍ deve ficar privado.

LinkedIn

Aqui sim.

Na verdade, eu faria uma estratégia muito forte.

Não venderia o software.

Eu venderia o problema que ele resolve.

Por exemplo:

"Você já ligou para uma assistência e ficou 40 minutos sem saber onde estava o guincho?"

Depois mostra:

mapa;

protocolo;

motorista chegando.

Isso gera muito mais curiosidade.

Depois de alguns vídeos, você mostra:

"Estamos abrindo as primeiras demonstrações."

Isso parece muito mais profissional.

Agora vamos para o Base44.

Eu faria diferente do que a maioria faria.

Não pediria:

"Crie uma tela."

Eu pediria:

"Crie um produto."

O Base44 funciona MUITO melhor quando recebe contexto completo.

Então eu escreveria praticamente uma especificação do sistema.

PROMPT

(Cole exatamente isso.)

AcompanhaAÍ — Sistema SaaS para acompanhamento operacional de assistências 24h

Você atuará como arquiteto de software, designer UX/UI e desenvolvedor full-stack.

Sua missão é transformar este projeto em um SaaS profissional, moderno, intuitivo e totalmente funcional.

NÃO crie apenas telas.

Crie um sistema completo.

Todo o fluxo deve funcionar.

Não utilize dados fictícios permanentes.

Tudo deve ser preparado para banco de dados real.

Manter design minimalista semelhante ao Linear, Notion e Stripe.

Paleta moderna em verde e branco.

Interface extremamente limpa.

Sem excesso de informação.

Utilizar componentes consistentes.

Animações suaves.

Feedback visual em todas ações.

Tela Inicial

A Home deve permanecer extremamente simples.

Exibir três cartões:

Base Operacional

Área do Motorista

Acompanhar Protocolo

Cada cartão leva ao seu fluxo.

Adicionar também:

botão Login

botão Criar Conta

botão Contato

Rodapé institucional.

1 — Base Operacional

Login por:

email

senha

Recuperação de senha.

Após login abrir Dashboard.

Dashboard deve conter:

KPIs

Protocolos ativos

Protocolos concluídos hoje

Motoristas online

Tempo médio atendimento

Protocolos aguardando aceite

Chamados críticos

Gráfico diário.

Timeline em tempo real.

Tabela dos protocolos.

Filtros:

Status

Cidade

Prestador

Data

Pesquisa rápida.

Botão:

NOVO PROTOCOLO

Abrir modal.

Campos:

Cliente

Telefone

Origem

Destino

Tipo de atendimento

Seguradora

Prioridade

Observações

Motorista responsável

Ao salvar:

Criar protocolo.

Gerar número automaticamente.

Enviar para motorista.

Atualizar dashboard.

Registrar auditoria.

Tela Protocolos

Lista completa.

Editar.

Cancelar.

Finalizar.

Transferir motorista.

Duplicar protocolo.

Pesquisar.

Exportar CSV.

Tela Motoristas

Lista.

Online.

Offline.

Em atendimento.

Última localização.

Percentual de aceite.

Tempo médio.

Histórico.

Ao clicar motorista:

Abrir perfil.

Mostrar:

foto

telefone

veículo

placa

OS atuais

Histórico

Mapa em tempo real.

Tela Segurados

Pesquisar segurado.

Histórico.

Protocolos anteriores.

Contato.

Seguradora.

Tela Configurações

Empresa

Logo

Usuários

Perfis

Permissões

Integrações

API

Webhook

SMTP

Domínio

2 — Área do Motorista

Login por:

CPF

Senha

Após login:

Dashboard simples.

Exibir:

Protocolos pendentes

Em andamento

Concluídos

Ao abrir protocolo:

Mostrar:

Cliente

Telefone

Origem

Destino

Observações

Botão abrir Google Maps.

Botão Aceitar.

Botão Iniciar Deslocamento.

Botão Cheguei.

Botão Atendimento iniciado.

Botão Atendimento concluído.

Cada ação atualiza imediatamente a Base Operacional.

Durante deslocamento

Ativar GPS.

Enviar latitude e longitude automaticamente.

Atualizar posição a cada 5 segundos.

Caso conexão caia:

armazenar posições.

Enviar assim que voltar.

Chat

Chat em tempo real.

Motorista conversa com Base.

Mensagens instantâneas.

Indicador digitando.

Mensagem entregue.

Mensagem lida.

Botão emergência.

Compartilhar localização.

Ligar para cliente.

Ligar para base.

3 — Acompanhar Protocolo

Usuário informa:

Número protocolo

OU

CPF

OU

Link recebido.

Sistema localiza protocolo.

Abrir tela pública.

Mostrar:

Status atual

Nome motorista

Foto

Veículo

Placa

Tempo estimado

Distância

Mapa em tempo real.

Linha do tempo.

Solicitado.

Motorista aceitou.

Em deslocamento.

Chegou.

Atendimento iniciado.

Finalizado.

Mapa

Utilizar OpenStreetMap.

Mostrar:

Cliente

Motorista

Trajeto.

Atualizar automaticamente.

Zoom inteligente.

Notificações

Sempre que status mudar:

Atualizar automaticamente.

Sem recarregar página.

Cadastro

Cadastrar:

Nome

Email

Telefone

Empresa

Senha

Confirmar senha.

Verificação email.

Recuperação senha

Enviar email.

Token temporário.

Nova senha.

Segurança

JWT

Refresh Token

Sessão persistente

Logout

Proteção de rotas

Rate Limit

Logs

Auditoria

Banco

Criar estrutura preparada para:

Usuários

Motoristas

Protocolos

Segurados

Mensagens

Notificações

Logs

Auditoria

Histórico localização

OTP

Reset senha

Integrações

Google Maps opcional.

OpenStreetMap padrão.

WhatsApp preparado.

Email preparado.

Socket.IO para tempo real.

UX

Sempre mostrar loading.

Sempre mostrar sucesso.

Sempre mostrar erro amigável.

Nenhuma tela vazia.

Sempre existir estado:

loading

erro

sem dados

dados carregados

Objetivo

Este NÃO é um protótipo.

Este é um SaaS pronto para comercialização.

Todo fluxo deve estar conectado.

Toda tela deve conversar entre si.

Nenhum botão pode existir sem funcionalidade.

Todo CRUD deve funcionar.

Todo login deve funcionar.

Todo rastreamento deve atualizar em tempo real.

Todo cadastro deve persistir no banco.

O sistema deve parecer um software corporativo moderno utilizado por grandes seguradoras.

O raciocínio por trás desse prompt

A ideia não é apenas "desenhar telas", mas criar um fluxo operacional completo.

Home: serve como portal de entrada para três públicos diferentes (operador, motorista e segurado), sem misturar experiências.

Base Operacional: concentra toda a gestão. Os KPIs dão uma visão rápida da operação, enquanto protocolos e motoristas são o coração do sistema.

Área do Motorista: foi desenhada para exigir o mínimo de interação possível. O motorista passa por etapas claras (aceitar → deslocar → chegar → iniciar → concluir), reduzindo erros e atualizando a operação em tempo real.

Acompanhamento Público: é a funcionalidade que gera valor para o segurado. Em vez de ligar para perguntar "onde está o guincho?", ele acompanha tudo sozinho.

Chat: reduz ligações entre base e motorista e mantém o histórico vinculado ao protocolo.

Mapa em tempo real: integra os três módulos. A posição enviada pelo motorista alimenta a base operacional e a tela pública do segurado simultaneamente.

Estrutura SaaS: usuários, permissões, integrações, auditoria, configurações e segurança já deixam o sistema preparado para ser vendido para diferentes empresas, sem precisar redesenhar a arquitetura depois.

Uma observação importante: no trecho "atualizar posição a cada 5 segundos", eu manteria isso como comportamento quando o app do motorista estiver aberto. Se, no futuro, você decidir criar um aplicativo Android/iOS, essa mesma arquitetura poderá evoluir para rastreamento em segundo plano, sem precisar mudar a lógica do restante do sistema. Isso deixa o MVP viável hoje e abre caminho para uma versão ainda mais robusta no futuro.

está anexado o design / paleta de cores, icone logo tipo etc, use

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://acompanhaai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/58fe2675-5eef-41cc-a38a-aa6b5ebee010).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
