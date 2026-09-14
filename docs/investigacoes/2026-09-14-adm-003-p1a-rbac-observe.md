# ADM-003-P1A: principal tipado e RBAC em observação

- Data: 14/09/2026
- Base: `fe1e62381841f7cd621f4038e20e3a89602c91d6`
- Branch: `feat/adm-003-rbac-observe`
- Modo: `observe`, fixo no código
- Enforcement por papel: não implementado

## Resultado

A P1A introduz um principal administrativo tipado, uma união fechada de 47 capabilities e um manifesto executável que cobre exatamente as 128 rotas administrativas. A decisão futura de RBAC é calculada em toda requisição administrativa válida e registrada como evento estruturado, mas não interfere no fluxo da requisição.

O comportamento de autorização desta fase continua equivalente ao anterior:

- pessoa deslogada recebe 401;
- pessoa sem linha em `admin_roles` recebe 403;
- qualquer pessoa com ao menos uma linha continua autorizada, como na guarda da main;
- owner, editor e viewer são resolvidos; papel nulo, legado ou duplicado fica explicitamente não reconciliado;
- a decisão hipotética de capability nunca gera 403 nesta entrega.

Não existe flag, parser de ambiente ou ramo de enforcement. `ADMIN_RBAC_MODE` é o literal `observe`, e `observeAdminCapability` sempre chama `next()`.

## Arquitetura

### Principal administrativo

`server/lib/adminRbac.ts` define a fonte única:

```ts
interface AdminPrincipal {
  userId: string;
  role: "owner" | "editor" | "viewer" | null;
  roleResolution: "resolved" | "null" | "legacy" | "duplicate";
  authorizationSource: "admin_roles";
  context: { mode: "observe"; meRole: string };
}
```

`requireAdmin` passou a ler todas as linhas correspondentes de `admin_roles` numa única consulta com service role e anexar o principal em `Express.Request.adminPrincipal`. O handler não usa claim do navegador. Ausência de linha ou erro da leitura falha fechado. Uma linha com papel nulo ou legado e linhas duplicadas continuam autorizadas em observe, pois a guarda da main testava apenas existência. Elas recebem `role: null`, resolução explícita e decisão hipotética `unresolved`.

A migration versionada declara `role NOT NULL`, check para os três papéis e `user_id UNIQUE`. Isso descreve a estrutura pretendida, mas não foi usado como prova de reconciliação dos dados reais. Nenhum dado foi consultado nesta rodada.

A leitura substitui a RPC booleana no caminho de `requireAdmin`, portanto não adiciona uma segunda consulta. A RPC `is_user_admin` foi preservada apenas no caminho independente de resolução de status Pro, que não possui o principal de uma requisição administrativa.

`GET /api/admin/me` reutiliza `req.adminPrincipal`, sem consultar o papel de novo. `context.meRole` preserva o valor compatível que o endpoint já fornecia: papel textual da única linha ou fallback `editor` para nulo/duplicidade. Esse valor não participa da autorização nem da telemetria. O shape de sucesso permanece `{ data: { user, role } }`.

### Capabilities e policies

Cada entrada do manifesto contém:

- método e template normalizado da rota;
- capability de negócio;
- natureza `read` ou `mutation`;
- risco `low`, `medium`, `high` ou `critical`;
- papéis que seriam autorizados numa fase futura;
- exigência futura de motivo, confirmação, idempotência e auditoria.

A matriz completa está em `2026-09-14-adm-003-p1a-matriz-rotas.csv`. Ela é exportada da mesma estrutura usada pelo middleware, não constitui uma segunda fonte de autorização.

### Inventário fechado

Um teste independente lê a AST TypeScript de `app.ts` e dos routers, deriva imports, mounts e chamadas `router.METHOD`, sem construir o esperado a partir do manifesto:

- 67 rotas diretas de `admin.ts`;
- 11 de campanhas de email;
- 6 de listas de contato;
- 10 de notificações;
- 4 de bugs;
- 27 de CRM;
- 3 rotas administrativas de vagas.

Os prefixes são obtidos dos `app.use` e `router.use` reais. O teste percorre os routers aninhados, exige paths literais enumeráveis, preserva parâmetros dinâmicos, verifica a ausência atual de wildcards e normaliza trailing slash apenas para a chave de comparação. Ele também prova a ordem `requireAuth`, `requireAdmin`, `observeAdminCapability` antes das rotas e subrouters de admin, e a ordem equivalente nas três rotas administrativas de vagas.

O validador recusa:

- método e caminho duplicados;
- rota real sem classificação;
- entrada sem rota real;
- divergência de método ou caminho;
- GET marcado como mutação;
- POST, PATCH, PUT ou DELETE marcado como leitura;
- capability com conjuntos de papéis contraditórios;
- lista vazia ou duplicada de papéis.

Resultado atual: 128 rotas únicas, 65 leituras e 63 mutações.

## Modo de observação

Depois de `requireAdmin`, o middleware resolve a policy usando apenas método e pathname. A query string é removida antes do matching. O evento emitido contém somente:

```text
event
schemaVersion
mode
capability
role
roleResolution
hypotheticalDecision
method
routeTemplate
risk
requestId
```

Não entram no evento:

- userId;
- email;
- path concreto com UUID;
- query string;
- body;
- token;
- payload de provedor.

O request ID vem de `res.locals.requestId` quando disponível. Uma rota reconhecida gera exatamente um evento. URL desconhecida que seguirá para 404 e rota pública não geram evento, pois não existe template classificado seguro. O teste fechado impede que uma rota administrativa declarada chegue sem policy a uma revisão aprovada. Erros de autenticação anteriores ao observador também não geram evento. Falha síncrona do logger é absorvida e nunca altera a requisição já autorizada.

Não há pseudônimo do ator nesta fase. A alternativa deliberada é telemetria agregável por capability, papel e resolução, ligada somente ao request ID já existente. Não foi usado hash simples de UUID. Um pseudônimo estável exigiria HMAC com segredo dedicado, rotação e retenção definidos; sua ausência não pode quebrar requests. A finalidade recomendada é medir incompatibilidades antes do enforcement. Retenção recomendada: curta, com acesso operacional restrito e agregação antes do descarte.

As 125 rotas sob `/api/admin` recebem o middleware único depois das guardas e antes dos subrouters. As três rotas administrativas de vagas incluem o mesmo middleware imediatamente depois de `requireAdmin`. Rotas públicas e Pro de vagas não recebem observação administrativa.

## Matriz conservadora

| Papel mínimo futuro | Rotas | Regra                                                                             |
| ------------------- | ----: | --------------------------------------------------------------------------------- |
| viewer              |    55 | Leituras operacionais não críticas                                                |
| editor              |    37 | Operações administrativas não financeiras e leituras internas limitadas           |
| owner               |    36 | Finanças, contratos, acesso, PII altamente sensível, exportação e disparo externo |

Owner aparece em todas as 128 policies, editor em 92 e viewer em 55.

### Decisões conservadoras relevantes

- Reembolsos, resolução de órfão, cancelamento, revogação, concessão de creator, sincronização financeira e retry fiscal são owner.
- Despesas são financeiras e permanecem owner, embora sejam registros locais.
- Contatos, exportações, destinatários e disparos são owner.
- Cadastro editorial, CRM, vagas, rascunhos de notificação e moderação de avatar são editor.
- Dashboards, atenção, séries, assinaturas e finanças agregadas são viewer.
- Saúde de integrações começa em editor por revelar postura operacional.
- CPF completo, troca de identidade e perfil administrativo sensível são owner.
- A lista de newsletter contém emails completos. Ela foi elevada a owner, corrigindo a classificação ampla do P0.
- As rotas de bugs mutáveis devolvem 405 atualmente. Continuam classificadas como mutação owner para que uma futura reativação não herde permissão ampla em silêncio.

Não existe rota administrativa de baixa de comissão ou gestão de papéis nesta base. Por isso, `commissions.settle` e `admin_roles.manage` não foram criadas como entradas sem consumidor. Quando uma dessas rotas for introduzida, o teste exigirá policy nova antes de aceitá-la.

## Diferenças em relação ao inventário P0

### Estrutura

Não houve diferença estrutural. As 128 combinações de método e caminho do P0 coincidiram com os routers reais.

### Semântica refinada

- A matriz executável separou `subscriptions.read` de `finance.read`.
- Leitura de órfãos, detalhe de usuário, uso de email, assinaturas e sessão administrativa receberam capabilities próprias.
- Concessão e revogação de creator foram separadas.
- Reembolso emitido e reembolso externo registrado foram separados.
- Leitura de destinatários foi separada de leitura agregada de campanhas e notificações.
- Newsletter deixou o agrupamento genérico do P0 e passou a `newsletter.subscribers.read`, somente owner, porque a resposta contém email completo.
- O P0 tinha 56 rotas com mínimo viewer, 37 editor e 35 owner. A matriz final tem 55 viewer, 37 editor e 36 owner por causa da newsletter.
- Requisitos futuros foram normalizados em campos fechados, em vez de descrições livres.

Os três artefatos P0 foram preservados para manter a evidência original. A matriz P1A registra deliberadamente essas mudanças, sem reescrever a investigação.

## Compatibilidade

- Contratos v3 de ADM-001 e ADM-002 não foram alterados.
- Não houve mudança em payload de dashboard, séries, atenção, usuário ou financeiro.
- O sucesso de `/api/admin/me` conserva user e role e reutiliza o principal.
- Não há chamada nova a Stripe, Asaas ou outro provedor.
- Não há consulta por item ou N+1.
- Há uma leitura local de `admin_roles` por requisição administrativa, substituindo a RPC booleana anterior.
- A claim `admin_role` do frontend continua somente como atalho visual e não participa do principal do servidor.
- Deep links, refresh e polling continuam usando as rotas administrativas existentes e as mesmas guardas.

## Testes

### Novos testes focais

- Principal é criado a partir de owner, editor ou viewer do banco.
- Usuário comum sem linha e erro de banco falham fechados.
- Papel nulo, legado e linhas duplicadas passam em observe com resolução explícita e decisão `unresolved`.
- Claim forjada como owner não altera um principal viewer.
- Principal não vaza entre requests.
- A guarda realiza uma leitura de papel por request.
- Viewer, editor e owner continuam passando no modo observe.
- Decisões hipotéticas são diferentes conforme a policy.
- Evento estruturado não contém userId, email, token, body ou query.
- O middleware chama `next()` para decisões `allow`, `deny` e `unresolved`.
- Manifesto e enumeração AST independente reconciliam exatamente 128 rotas, 65 leituras e 63 mutações.
- Duplicidade, órfão, rota sem policy, método divergente e natureza errada são recusados.

### Resultados

- Regressão final sem socket de principal, manifesto, ADM-001, ADM-002, deep links e auth: 203 de 203 testes em 13 arquivos aprovados.
- O bloco selecionado de cache e refresh de `GET /attention v3` teve 6 de 6 testes aprovados; outros 27 casos do arquivo foram deliberadamente filtrados e não foram contabilizados.
- Uma tentativa ampla adicional encontrou `listen EPERM` nos handlers HTTP de creators e órfãos. Os casos com socket expiraram e a execução foi interrompida antes de continuar para evitar uma sequência de timeouts. Eles não foram contabilizados como aprovados.
- TypeScript principal e TypeScript de scripts foram aprovados.
- Roadmap meta, registry v2, sitemap, CSP, arquivos gerados, paleta e auditoria de limiares foram aprovados pelos comandos equivalentes sem IPC.
- O primeiro `pnpm check:all`, sem dependências ligadas ao checkout isolado, falhou no TypeScript por módulos ausentes e não foi chamado de aprovado. Depois, todos os subcomandos equivalentes foram executados com a instalação local já existente em outro checkout.
- Prettier formatou os arquivos novos e os arquivos tocados que já seguiam o formato. O check completo ainda acusa `admin.ts` e `vagas.ts`; os mesmos dois arquivos da base já não eram idênticos à saída do Prettier. Eles não foram reformatados por inteiro para evitar centenas de mudanças fora do escopo.
- `git diff --check` e a verificação equivalente dos arquivos novos foram aprovados.

## Limitações

- Observe gera telemetria em stdout, não auditoria persistente.
- Sem pseudônimo de ator, a observação mede uso por papel/resolução e capability, mas não permite reconciliar um administrador específico somente pelos logs.
- Cada chamada administrativa reconhecida gera um evento. Polling de `/attention` enquanto a Visão está ativa pode gerar até um evento por minuto por sessão, além de refresh e retorno à aba; capacidade, amostragem e retenção do coletor ainda precisam ser definidas antes de produção em escala.
- Não há snapshot de papel nem correlação persistida de decisão e efeito.
- Mudança de papel é efetiva na próxima consulta, mas ainda não há operação segura de promoção ou rebaixamento.
- A policy futura ainda não bloqueia nenhuma ação.
- O banco ainda possui `is_user_admin` SECURITY DEFINER com grants e search path a endurecer.
- O cliente ainda pode exibir controles por uma claim obsoleta, embora o backend não confie nela.
- Não houve acesso ao banco para medir distribuição de papéis ou identificar owner.
- Testes HTTP dependentes de listen permanecem bloqueados neste sandbox.

## Plano ADM-003-P1B

### 1. Preflight e bootstrap

1. Medir apenas contagens agregadas de `admin_roles` por papel.
2. Escolher o primeiro owner por UUID estável com revisão de dois operadores.
3. Classificar todos os administradores atuais antes do enforcement.
4. Fazer o rollout abortar se não houver owner.

### 2. Hardening do banco

1. Criar migration para `get_admin_role` com search path fixo e nomes qualificados.
2. Revogar EXECUTE de anon, authenticated e PUBLIC.
3. Conceder somente ao backend privilegiado.
4. Criar RPC transacional de mudança de papel com expected role, motivo e trava contra remover o último owner.

### 3. Auditoria persistente

1. Criar `admin_audit_events` append-only.
2. Preservar ator, papel, capability, método, template, recurso, request ID, correlation ID, motivo e resultado.
3. Redigir before e after e proibir token, CPF, email completo e payload bruto.
4. Tornar a auditoria fail-closed para ações críticas.
5. Registrar intenção e resultado separadamente para efeitos externos.

### 4. Ativação gradual

1. Comparar telemetria observe com papéis planejados.
2. Implementar `requireAdminCapability` com modo fechado e validado.
3. Ativar primeiro em ambiente de teste.
4. Negar mutações para viewer.
5. Negar capabilities owner para editor por famílias pequenas.
6. Manter rollback do enforcement sem apagar papéis ou eventos.

### 5. Cliente

1. Fazer `/api/admin/me` entregar capabilities efetivas quando o enforcement estiver pronto.
2. Ocultar ou desabilitar controles apenas para UX.
3. Atualizar principal visual após 403, foco ou mudança de papel.
4. Implementar gestão de papéis somente depois da RPC e da auditoria persistente.

## Estado da entrega

Não houve migration, backfill, consulta ou alteração de dados, mudança de administrador, provider call, commit, push, PR, merge ou deploy. O enforcement permanece ausente por construção.
