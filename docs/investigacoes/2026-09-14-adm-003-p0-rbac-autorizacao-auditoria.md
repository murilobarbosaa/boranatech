# ADM-003-P0: RBAC, autorização e auditoria administrativa

- Data da investigação: 14/09/2026
- Base autoritativa: `fe1e62381841f7cd621f4038e20e3a89602c91d6`
- Checkout: `/tmp/boranatech-adm003`
- Branch local: `audit/adm-003-rbac`
- Natureza: investigação estática e testes locais somente leitura

## Resumo executivo

O backend protege todas as 128 rotas administrativas inventariadas com autenticação e com a existência de uma linha em `admin_roles`. Essa proteção é aplicada também a requisições diretas. Porém, o campo `role`, que já admite `owner`, `editor` e `viewer`, não participa de nenhuma decisão de autorização. Na prática, os três papéis possuem hoje a mesma capacidade no servidor. Um `viewer` pode chamar diretamente as mesmas 63 rotas mutáveis que um `owner`, inclusive reembolso, cancelamento, revogação de acesso, resolução de pagamento órfão, sincronização financeira e disparo de comunicação.

O achado ADM-19 está confirmado e é P0. Esconder controles no cliente não corrigiria o problema. A correção precisa ser uma política fechada de capabilities no servidor, com negação por padrão e inventário completo de rotas.

A autenticação por JWT é local, criptograficamente validada e centralizada. `requireAdmin` consulta o banco em toda requisição e falha de modo fechado. Isso é uma base boa para revogação administrativa no próximo request. O ponto fraco não é ausência de guarda, mas a guarda booleana ignorar o papel.

A auditoria atual é fragmentada. Algumas ações críticas escrevem uma intenção antes do efeito e falham de modo fechado. Outras usam `logAudit`, que engole falhas, e várias rotas mutáveis não registram uma auditoria comum. `content_audit_logs` também não é imutável no banco e não preserva capability, papel, request ID, resultado ou motivo em campos próprios.

Não houve acesso ao banco de produção. Portanto, não foi possível contar administradores por papel, confirmar quem deve ser o primeiro `owner`, medir a cobertura real dos logs ou verificar configurações externas de claims. Nenhuma ausência de linhas foi tratada como ausência de evento.

## Escopo, versão e método

- O objeto Git da base foi validado localmente com `git cat-file`.
- O checkout isolado foi criado exatamente na base informada e permaneceu separado dos checkouts de ADM-001 e ADM-002.
- Foram lidos os middlewares, o registro de rotas, os subrouters administrativos, os consumidores no cliente, as migrations relevantes e os testes de guarda.
- O inventário foi derivado das declarações reais de rotas e conferido nos dois sentidos contra o teste de contagem existente.
- Não houve rede, banco, provedor, migration, backfill, escrita de dados, commit, push, PR, merge ou deploy.

Artefatos complementares:

- `2026-09-14-adm-003-rotas.csv`: as 128 rotas com método, caminho, efeito, guarda, papel proposto, capability e exigência de auditoria.
- `2026-09-14-adm-003-capabilities.csv`: matriz papel por capability.

## Fatos comprovados, hipóteses e bloqueios

### Comprovado no código

- O JWT Supabase é validado com JWKS, algoritmo ES256, expiração e tolerância de cinco segundos em `server/middleware/auth.ts:83-119`.
- Toda `/api` passa por `validateSupabaseJwt` em `server/app.ts:525`. O router admin é montado em `server/app.ts:562`.
- O router principal aplica `requireAuth` e `requireAdmin` antes de registrar ou montar rotas em `server/routes/admin.ts:182-183`.
- `requireAdmin` chama `is_user_admin` em toda requisição e devolve 403 quando a resposta não é exatamente verdadeira em `server/middleware/auth.ts:38-43` e `server/middleware/auth.ts:197-218`.
- `is_user_admin` testa somente se há linha em `admin_roles`, sem ler `role`, em `supabase/migrations/20260517231011_remote_schema.sql:189-196`.
- A tabela já restringe o valor de `role` a `owner`, `editor` ou `viewer` em `supabase/migrations/20260517231011_remote_schema.sql:252-258`.
- O cliente usa a claim decodificada `admin_role` apenas para UX e faz fallback para `/api/admin/me` em `client/src/lib/adminClaim.ts:1-23`, `client/src/hooks/useAdmin.ts:37-55` e `client/src/pages/Admin.tsx:6893-6934`.
- Não há decisão de autorização por role no servidor nem no cliente. Os controles administrativos são apresentados para qualquer administrador aceito.
- O servidor usa `SUPABASE_SERVICE_ROLE_KEY` em `server/lib/supabaseAdmin.ts:22-29`, logo suas queries ignoram RLS e dependem das guardas Express e dos filtros do handler.
- As 67 rotas diretas do arquivo principal e todos os subrouters montados ficam depois das guardas. Três rotas administrativas de vagas possuem `requireAdmin` próprio.
- Os endpoints novos de ADM-001 e ADM-002 permanecem protegidos pelas mesmas guardas.

### Hipóteses que exigem validação externa

- Uma configuração Supabase externa pode preencher `admin_role` no access token, mas não há migration ou hook versionado que o demonstre.
- A distribuição atual de owner, editor e viewer pode tornar um rollout imediato seguro ou pode bloquear operadores. Ela não foi medida.
- A retenção e a cobertura de `content_audit_logs` em produção não foram medidas.

### Medições bloqueadas

- Contagem agregada de administradores por papel.
- Existência de pelo menos um owner operacional identificado por `user_id` estável.
- Sessões ativas por papel e tempo real até revogação do token.
- Cobertura percentual de ações mutáveis auditadas.
- Configuração efetiva de custom access-token hook no projeto Supabase.
- Políticas e grants realmente aplicados quando divergirem das migrations versionadas.

## Fluxo de autenticação e autorização atual

```text
Navegador
  -> obtém sessão Supabase
  -> adminFetch inclui Authorization: Bearer <access token>
  -> validateSupabaseJwt valida assinatura e expiração
  -> requireAuth exige req.user
  -> requireAdmin chama is_user_admin(req.user.id) com service role
  -> RPC responde somente existência da linha em admin_roles
  -> handler usa supabaseAdmin, que ignora RLS
```

O request recebe um identificador em `server/app.ts:93-95`, mas esse valor não é persistido pelos escritores de auditoria administrativa. A validação local do token aceita um token criptograficamente válido até sua expiração, mesmo se o provedor tiver revogado a sessão. Para rotas administrativas, isso não mantém o acesso depois de remover a linha de `admin_roles`, porque a consulta booleana acontece novamente a cada request.

Existe uma exceção de produto: administradores também são tratados como Pro. O cache dessa decisão tem TTL de 60 segundos em `server/lib/proStatusCache.ts:3-12`. Assim, revogar o papel bloqueia as rotas admin no próximo request, mas pode manter o entitlement Pro por até o TTL. Isso não amplia o acesso administrativo, mas precisa entrar no runbook de revogação.

### Cliente não é autoridade

`adminClaim.ts` apenas decodifica o payload do JWT, sem verificar a assinatura no navegador. Uma claim forjada ou obsoleta pode fazer a interface administrativa aparecer, mas não passa pelas guardas do servidor. Portanto:

- isso é uma limitação de UX e frescor, não uma escalada comprovada no backend;
- esconder botão por papel é útil, mas nunca pode ser a proteção;
- o cliente deve reagir a 403 e atualizar `/api/admin/me` quando volta ao foco ou após mudança de papel.

### Banco e RLS

`admin_roles` tem RLS e uma policy para a pessoa ler a própria linha em `supabase/migrations/20260517231011_remote_schema.sql:1385-1388`. Os grants amplos do dump não bastam para permitir escrita pelo cliente porque não há policy de INSERT, UPDATE ou DELETE. No servidor, entretanto, service role ignora essa barreira.

A função `is_user_admin` é `SECURITY DEFINER`, não fixa `search_path` na definição observada e tem EXECUTE concedido a `anon` e `authenticated` em `supabase/migrations/20260517231011_remote_schema.sql:1815-1817`. Como ela recebe qualquer UUID, pode servir como oráculo de pertencimento administrativo. Não concede administração por si só, mas deve ser endurecida.

## Inventário de rotas

Foram encontradas 128 rotas:

| Conjunto                 | Rotas |
| ------------------------ | ----: |
| `server/routes/admin.ts` |    67 |
| Campanhas de email       |    11 |
| Listas de contato        |     6 |
| Notificações             |    10 |
| Bugs                     |     4 |
| CRM, em `adminTasks.ts`  |    27 |
| Vagas administrativas    |     3 |
| Total                    |   128 |

Por efeito, são 65 leituras e 63 mutações. A classificação proposta exige no mínimo viewer para 56 rotas, editor para 37 e owner para 35. O inventário individual, que faz parte deste relatório, está em `2026-09-14-adm-003-rotas.csv`.

### Guarda de subrouters

Os routers de campanhas, listas, notificações, bugs e CRM são montados depois de `router.use(requireAuth)` e `router.use(requireAdmin)`. Não há desvio conhecido de guarda nesses mounts. As rotas administrativas em `server/routes/vagas.ts:238`, `server/routes/vagas.ts:442` e `server/routes/vagas.ts:489` aplicam `requireAdmin` diretamente.

O teste `server/routes/adminUsersGuards.test.ts:153-190` afirma a posição das guardas e o total de 67 rotas diretas. Isso é valioso contra rotas colocadas antes do middleware, mas não verifica papel ou capability.

## Ações críticas encontradas

| Família                  | Fato atual                                                             | Risco                                     | Papel mínimo proposto                                |
| ------------------------ | ---------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| Reembolso                | Chama Stripe e caminho legado de Asaas; há razão e alguma idempotência | Movimento financeiro externo irreversível | owner                                                |
| Reembolso externo        | Consulta e registra devolução já feita fora do sistema                 | Reescrita de histórico financeiro local   | owner                                                |
| Cancelamento e revogação | Pode remover acesso e cancelar assinatura no provedor                  | Impacto comercial e no cliente            | owner                                                |
| Órfão                    | Associa pagamento local, altera caso e pode conceder acesso            | Atribuição financeira e entitlement       | owner                                                |
| Sincronização financeira | Inicia ingestão e atualização de ledger                                | Mutação ampla e contato com provedor      | owner                                                |
| Nota fiscal retry        | Recoloca processamento fiscal em fila                                  | Efeito fiscal externo posterior           | owner                                                |
| Comissão                 | Ajustes e baixas alteram saldo comercial                               | Perda por concorrência e fraude           | owner                                                |
| Identidade               | Atualiza Auth, profile e tenta atualizar Stripe                        | Account takeover e PII                    | owner                                                |
| CPF                      | Revela dado pessoal completo                                           | Alta sensibilidade                        | owner                                                |
| Creators                 | Concede ou revoga acesso e edita relação comercial                     | Entitlement e comissão                    | owner para acesso, editor para cadastro              |
| Conteúdo e vagas         | Publica ou remove conteúdo                                             | Integridade editorial                     | editor                                               |
| Campanhas e notificações | Pode disparar comunicação externa                                      | Reputação, privacidade e custo            | owner para envio, editor para rascunho               |
| CRM e listas             | Manipula contato, atividades e segmentação                             | PII e comunicação                         | editor para fluxo, owner para exportações            |
| IA                       | Leituras exibem custo e comportamento                                  | Informação financeira e de uso            | viewer para agregados, controle futuro somente owner |

Nenhuma dessas famílias distingue papel hoje. A simples existência em `admin_roles` autoriza todas.

## Auditoria atual

### O que existe

`content_audit_logs` guarda ator, ação, tipo e ID de recurso, JSON anterior e posterior e `created_at` em `supabase/migrations/20260517232009_create_content_audit_logs.sql:8-18`.

Alguns fluxos críticos escrevem diretamente antes do efeito e recusam a operação se a auditoria falhar. Isso ocorre, entre outros, na resolução de órfão, revelação de CPF, concessão e revogação de creator, reembolso, cancelamento, troca de email e edição sensível de perfil.

O CRM preserva `created_by`, `updated_by` ou `actor_id` em partes de sua modelagem, mas isso não equivale a uma trilha administrativa comum.

### Lacunas comprovadas

- `server/lib/audit.ts:3-24` captura a falha e apenas registra `console.warn`. Conteúdo é alterado mesmo sem log.
- Despesas, sincronização financeira, partes do fiscal, campanhas, listas, notificações, vagas e outras mutações não usam uma política uniforme fail-closed.
- O schema não possui papel, capability, request ID, correlation ID, resultado, código de erro ou motivo dedicado.
- O ator tem FK com `ON DELETE SET NULL`. A exclusão da conta perde o vínculo estável do ator.
- Não há trigger ou grant que torne a tabela append-only para service role. O comentário de imutabilidade não é uma garantia do banco.
- O fluxo pode gravar intenção antes do efeito sem uma segunda linha de resultado. Isso deixa operações emitidas no provedor e falhas locais sem fechamento estruturado.
- Leituras sensíveis e exportações não têm política de auditoria consistente.

### Contrato de auditoria proposto

Cada evento deve conter:

| Campo                                | Regra                                                            |
| ------------------------------------ | ---------------------------------------------------------------- |
| `actor_user_id`                      | UUID estável preservado mesmo se a conta for excluída            |
| `actor_role`                         | Papel efetivo no instante da decisão                             |
| `capability`                         | Capability que autorizou a ação                                  |
| `action`                             | Verbo fechado, não texto livre                                   |
| `resource_type` e `resource_id`      | Recurso opaco afetado                                            |
| `before_redacted` e `after_redacted` | Estado mínimo, com segredo, token, CPF e payload bruto proibidos |
| `occurred_at`                        | Instante do servidor                                             |
| `request_id` e `correlation_id`      | Vínculo com request e efeitos assíncronos                        |
| `outcome`                            | attempted, succeeded, failed ou rejected                         |
| `reason`                             | Obrigatório para ação crítica                                    |
| `error_code`                         | Código interno sem mensagem sensível                             |

Para ação externa, a intenção e o resultado precisam ser eventos distintos ligados pelo mesmo correlation ID. A escrita de auditoria deve ser fail-closed antes de iniciar efeito crítico. Uma falha ao registrar o resultado depois de um efeito externo não pode fingir rollback: deve produzir alerta operacional de inconsistência.

## Matriz papel por capability

A matriz detalhada está em `2026-09-14-adm-003-capabilities.csv`. Regras principais:

### viewer

- Pode ver dashboards, alertas, séries e consultas operacionais.
- Pode ler usuários, assinaturas, finanças, IA, creators, conteúdo, CRM e comunicação conforme escopo de dados.
- Não pode executar nenhuma mutação.
- Leituras de CPF completo, exportação em massa, configuração de integrações, papéis e audit log ficam fora.

### editor

- Herda leituras de viewer.
- Pode editar conteúdo, vagas, CRM, despesas locais, creators descritivos, moderação e rascunhos.
- Não pode alterar papéis, identidade, acesso, assinatura, reembolso, comissão, sincronização, disparo amplo ou outras ações financeiras críticas.

### owner

- Herda editor.
- Pode executar operações críticas explicitamente classificadas.
- É o único papel que administra papéis e consulta a trilha administrativa completa.
- Capability, motivo, confirmação, idempotência e auditoria continuam obrigatórios. O papel não é um passe para ignorar controles de domínio.

### Default deny

Uma rota sem capability declarada deve falhar na inicialização ou no teste de inventário e não deve ser publicada. A política precisa verificar nos dois sentidos:

1. toda rota declarada possui uma capability;
2. toda entrada do manifesto corresponde a uma rota real;
3. método e caminho fazem parte da identidade, pois GET e POST no mesmo caminho têm riscos diferentes;
4. subrouters e rotas fora de `admin.ts` entram no mesmo total.

## Matriz de achados

| ID         | Prioridade | Tipo             | Conclusão       | Evidência e impacto                                                                                                                                             |
| ---------- | ---------- | ---------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADM-19     | P0         | Erro comprovado  | Confirmado      | `role` existe no schema, mas `is_user_admin` e `requireAdmin` só testam existência. Viewer e editor têm as mesmas 63 mutações do owner.                         |
| ADM-003-01 | P0         | Erro comprovado  | Confirmado      | Não há política de capabilities nem default deny. O teste atual prova guarda binária e total de rotas, não permissão mínima.                                    |
| ADM-003-02 | P0         | Erro comprovado  | Confirmado      | Auditoria fragmentada e parcialmente fail-open. Ações mutáveis podem ocorrer sem evento comum; o log não é imutável no banco.                                   |
| ADM-003-03 | P0         | Risco comprovado | Confirmado      | Service role ignora RLS. Um erro de guarda ou IDOR em handler tem alcance privilegiado no banco.                                                                |
| ADM-003-04 | P1         | Hardening        | Confirmado      | `is_user_admin` SECURITY DEFINER não fixa search path e é executável por anon/authenticated com UUID arbitrário. Permite enumeração da condição administrativa. |
| ADM-003-05 | P1         | Erro de contrato | Confirmado      | `/api/admin/me` usa fallback `editor` sem tratar explicitamente erro ou ausência na leitura do papel. Pode informar papel incorreto.                            |
| ADM-003-06 | P1         | Limitação        | Confirmado      | A claim do cliente pode estar obsoleta ou forjada para UX. Ela não amplia o backend, mas pode mostrar controles indevidos e degradar revogação visual.          |
| ADM-003-07 | P1         | Cobertura        | Confirmado      | Leituras de PII, exportações e várias mutações não têm auditoria consistente nem motivo obrigatório.                                                            |
| ADM-003-08 | P1         | Sessão           | Alterado        | Remover `admin_roles` revoga admin no próximo request, mas entitlement Pro pode permanecer até 60 segundos no cache.                                            |
| ADM-003-09 | P2         | Modelagem        | Confirmado      | Ator pode virar NULL após exclusão; não há snapshot estável do principal nem versão da decisão de autorização.                                                  |
| ADM-003-10 | P2         | Operação         | Não verificável | Quantidade de administradores, distribuição de roles e existência de owner não foram medidas sem acesso ao banco.                                               |

## Validação pós-produção de ADM-001 e ADM-002

### Endpoints protegidos

`GET /api/admin/overview`, `GET /api/admin/overview-series` e `GET /api/admin/attention` são registrados depois de `requireAuth` e `requireAdmin` em `server/routes/admin.ts:182-183`, com handlers nas linhas 1313, 1635 e 1744. Uma chamada direta ainda precisa de JWT válido e linha em `admin_roles`.

### Deep links

O contrato compartilhado de atenção usa união fechada de ações, IDs de sujeito validados e destinos permitidos. O cliente constrói a URL. O servidor não entrega um `href` arbitrário. Os parâmetros `user`, `panel` e `orphan` apenas selecionam contexto visual. As consultas posteriores continuam passando por `adminFetch` e pelas guardas do backend.

Não foi encontrado caminho em que um deep link conceda capability ou substitua a autorização do servidor. Resta o risco geral de IDOR dentro de cada handler, por isso capabilities não substituem validação de recurso.

### Refresh e polling

`client/src/components/admin/overview/useAttentionData.ts:25-62` impede requisições concorrentes, limpa o timer e só faz polling com a Visão ativa. As leituras usam `adminFetch`, que injeta o token. `refresh=1` muda a política de cache, não ignora `requireAdmin`. Ao perder a autorização, a próxima leitura recebe 403.

### Limite desta validação

ADM-001 e ADM-002 estão protegidas contra usuário comum ou deslogado. Elas não estão protegidas contra um administrador de papel insuficiente, porque esse conceito ainda não é aplicado em nenhuma rota.

## Plano ADM-003-P1

### Etapa 0: preflight de dados, sem mudança de autorização

1. Executar uma consulta agregada revisada para contar `admin_roles` por papel.
2. Confirmar ao menos um owner por UUID estável fora dos artefatos públicos.
3. Resolver roles nulos, inválidos ou defaults herdados antes do enforcement.
4. Definir dois operadores de recuperação e um procedimento break-glass auditado.

Critério de saída: ao menos um owner confirmado e nenhum administrador atual sem papel deliberado.

### Etapa 1: principal tipado e inventário fechado

1. Criar módulo compartilhado puro com `AdminRole`, `AdminCapability` e grants.
2. Trocar a resolução booleana por `resolveAdminPrincipal(userId)`, que retorna role validado ou nega.
3. Anexar o principal ao request, sem confiar na claim do cliente.
4. Declarar capability para as 128 rotas e criar guard que afirma o total nos dois sentidos.
5. Manter inicialmente a autorização binária em modo de observação, registrando qual decisão o enforcement produziria.
6. Fazer `/api/admin/me` falhar fechado em erro e devolver role e capabilities reais.

Essa etapa é reversível e não muda o resultado das ações. Ela produz evidência antes de negar acesso.

### Etapa 2: hardening de banco e bootstrap

1. Aplicar a migration de funções com search path fixo e grants mínimos.
2. Aplicar o bootstrap do primeiro owner por UUID estável revisado.
3. Criar RPC transacional para promover, rebaixar e revogar, com proteção contra remover o último owner.
4. Validar contagens e decisões em modo de observação.

Rollback: manter os roles e voltar somente o modo de enforcement. Não apagar a trilha nem rebaixar owner automaticamente.

### Etapa 3: enforcement progressivo

1. Ativar primeiro default deny em ambiente de teste.
2. Bloquear mutations para viewer.
3. Bloquear capabilities de owner para editor.
4. Ativar as famílias críticas uma por vez, começando por papéis, reembolsos, cancelamento, acesso e comunicações.
5. Monitorar 401, 403 e decisões divergentes sem registrar PII.

Cada ativação deve ter rollback por configuração do servidor. Nunca usar apenas ocultação no frontend.

### Etapa 4: auditoria imutável

1. Criar `admin_audit_events` append-only.
2. Propagar request ID e correlation ID.
3. Centralizar autorização e auditoria no boundary da ação.
4. Tornar falha de auditoria bloqueante nas ações críticas.
5. Registrar attempted e resultado para efeitos externos.
6. Migrar consumidores de `content_audit_logs` por expand and contract, preservando histórico antigo como legado.

### Etapa 5: UX e gestão de papéis

1. Consumir `/api/admin/me` para apresentar apenas controles pertinentes.
2. Tratar 403 como revogação ou mudança de papel e atualizar a sessão visual.
3. Criar gestão de papéis somente para owner, com reautenticação, motivo, confirmação e proteção do último owner.
4. Nunca expor lista de owners a usuários comuns.

## Migrations necessárias

### 1. Hardening de funções administrativas

- Recriar `is_user_admin` com `SET search_path = ''` e nomes totalmente qualificados, ou substituí-la por `get_admin_role`.
- Revogar EXECUTE de PUBLIC, anon e authenticated.
- Conceder somente a service role usada pelo backend.
- Fazer retorno fechado e validado para `owner`, `editor` ou `viewer`.

### 2. Tabela append-only `admin_audit_events`

- Campos do contrato de auditoria descrito acima.
- UUID do ator preservado sem `ON DELETE SET NULL` que apague identidade histórica.
- Grants mínimos: inserção pelo backend e leitura apenas pela capability apropriada.
- Bloqueio de UPDATE e DELETE também para caminhos privilegiados da aplicação, com trigger defensivo.
- Índices por instante, ator, recurso, request e correlation ID.
- Política explícita de retenção e redação de JSON.

### 3. RPC de alteração de papel

- Operação transacional com expected role, new role, reason e request ID.
- Impedir remoção ou rebaixamento do último owner.
- Registrar tentativa e resultado no mesmo boundary.
- EXECUTE somente pela service role.

### 4. Bootstrap e backfill revisado

- Atribuir o primeiro owner por UUID estável confirmado pelo operador, nunca somente por email.
- Classificar explicitamente os administradores existentes.
- Validar contagens antes e depois sem imprimir identidades.
- O UUID não deve ser inventado nem gravado numa migration genérica antes da revisão operacional.

Não é necessária migration para a matriz de capabilities se ela permanecer versionada no código. Uma custom claim pode ser atualizada para UX, mas não deve participar da decisão de segurança.

## Rollout e revogação

- O primeiro owner deve ser escolhido por UUID proveniente do sistema de identidade e conferido por dois operadores.
- Antes de enforcement, executar preflight que falha se não houver owner.
- Promoção e rebaixamento precisam de owner, motivo, confirmação explícita e auditoria fail-closed.
- Remover ou mudar o role deve valer no próximo request. Não cachear a decisão de capability sem uma versão de role e invalidação atômica.
- Limpar `proStatusCache` na revogação para não manter entitlement Pro pelo TTL.
- Se houver suporte operacional seguro, revogar também sessões do usuário. Isso complementa, mas não substitui, a consulta do papel no servidor.
- Rollback de emergência desativa enforcement para o modelo booleano por janela curta e auditada. Não desfaz migrations nem apaga eventos.

## Testes necessários

### Autenticação e matriz

- Deslogado recebe 401 em toda rota administrativa.
- Usuário comum recebe 403.
- Viewer lê somente capabilities permitidas e recebe 403 em toda mutação.
- Editor executa conteúdo e fluxo operacional permitido, mas recebe 403 em capability de owner.
- Owner executa a ação classificada.
- Requisição direta tem o mesmo resultado que a interface.
- Claim forjada não altera o papel resolvido no banco.
- Role inválido, ausente ou erro de banco falha fechado.

### Default deny

- Toda rota tem método, caminho e capability declarados.
- Toda declaração corresponde a uma rota real.
- Uma rota nova sem capability faz o teste falhar.
- Subrouters e rotas administrativas em outros arquivos entram no total.
- Montar rota antes da autenticação continua impossível pelo guard existente.

### Recurso e IDOR

- Parâmetro adulterado ou UUID de outro recurso não amplia o escopo.
- Deep links de usuário e órfão não pulam capability.
- Exportação e revelação de PII exigem capability própria.
- Um recurso inexistente não faz fallback para outro usuário ou pagamento.

### Mudança de papel durante sessão

- Rebaixar owner para editor bloqueia capability de owner no próximo request.
- Revogar a linha bloqueia toda rota admin no próximo request.
- Cliente remove controles após 403 ou refresh de `/me`.
- Polling e refresh da atenção recebem 403 e não preservam falso estado verde.
- Cache Pro é invalidado conforme o runbook.

### Auditoria

- Evento contém ator, role, capability, request ID, recurso, motivo e resultado.
- Falha de auditoria impede ação crítica antes do efeito.
- Falha ao registrar resultado após efeito externo cria inconsistência operacional, não sucesso falso.
- Before e after são redigidos e não contêm token, CPF, email completo ou payload bruto.
- UPDATE e DELETE de evento são rejeitados.
- Alteração de papel não pode remover o último owner.

## Critérios de aceitação da primeira entrega

1. As 128 rotas estão classificadas e o teste afirma o total nos dois sentidos.
2. O servidor resolve role no banco em cada request e nunca confia na claim do cliente.
3. `/api/admin/me` devolve um principal válido ou falha fechado.
4. O modo de observação registra decisão prevista sem PII e sem mudar comportamento.
5. Nenhuma rota, capability ou papel tem fallback permissivo.
6. Testes cobrem deslogado, usuário comum, os três papéis, acesso direto e role alterado na sessão.
7. Não há mudança financeira, provider call ou migration na primeira entrega de código.
8. O relatório de preflight define o owner por UUID antes da fase de enforcement.

## Verificações executadas nesta investigação

| Verificação                                    | Resultado                   | Alcance                                                                             |
| ---------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| Existência e tipo do objeto Git da base        | Aprovado                    | Commit `fe1e62381841f7cd621f4038e20e3a89602c91d6` disponível localmente             |
| Inventário estático                            | Aprovado                    | 128 pares únicos de método e caminho, 65 leituras e 63 mutações                     |
| `server/routes/adminUsersGuards.test.ts`       | 12 de 12 aprovados          | Autenticação, guarda binária, falha fechada e posição das guardas                   |
| Seis suítes sem socket de contrato e deep link | 100 testes aprovados        | Contrato de atenção, séries v3, painel, hook, usuário e órfão                       |
| `server/routes/adminOverviewCache.test.ts`     | 29 aprovados e 4 bloqueados | Os quatro casos HTTP de `/overview` expiraram após `listen EPERM` em `127.0.0.1`    |
| Busca por decisões de role                     | Concluída                   | Nenhum consumidor de owner, editor ou viewer encontrado para autorização            |
| Conferência de rotas nos dois sentidos         | Aprovada                    | Sem duplicidade de método e caminho no inventário; totais por arquivo reconciliados |

Os 4 timeouts não foram contados como aprovação. Os testes de atenção do mesmo arquivo, inclusive negociação, cache v3, refresh e handler sem socket, passaram. Não foi feita tentativa repetida de abrir socket após a restrição ficar comprovada.

`pnpm check:all` foi invocado, mas não iniciou subcomandos: o gerenciador tentou criar sua própria instalação em `/home/s0ft/.local/share/pnpm`, fora das áreas graváveis, e terminou com `ENOENT`. Todos os equivalentes offline foram então executados diretamente e aprovados: TypeScript principal, roadmap meta, registry v2, sitemap, hashes CSP, arquivos gerados, paleta, TypeScript de scripts e auditoria de limiares. A dependência instalada em outro checkout foi usada temporariamente por symlink e removida depois, sem modificar código ou lockfile.

## Prompt copiável para ADM-003-P1, etapa 1

```text
ADM-003-P1A: introduzir principal administrativo tipado e inventário fechado, sem ativar bloqueios por papel

Baseie a implementação na main integrada e verificada. Leia CLAUDE.md e o relatório ADM-003-P0. Trabalhe em checkout isolado. Não faça deploy, migration, backfill, operação financeira ou chamada a provedor.

Objetivo: preparar RBAC no servidor sem mudar ainda quem consegue executar uma rota. Crie uma fonte única e pura para AdminRole, AdminCapability, grants e o manifesto exato de todas as rotas administrativas. O papel deve ser lido de admin_roles pelo backend em toda requisição, validado como owner, editor ou viewer e anexado como principal ao request. Não confie na claim do cliente. Ausência, valor inválido ou erro deve falhar fechado.

Mantenha a autorização binária atual nesta etapa e adicione modo de observação que calcula allowedByRole sem negar o administrador já existente. Não registre IDs pessoais, parâmetros, tokens ou payloads. GET /api/admin/me deve devolver role e capabilities reais e não usar fallback editor. O cliente pode consumir isso para UX, mas não pode ser autoridade.

O manifesto deve cobrir método e caminho das 128 rotas inventariadas, inclusive subrouters e vagas, e falhar nos dois sentidos: rota sem capability e capability sem rota. Rotas novas não classificadas devem quebrar o teste. Preserve as guardas atuais e ADM-001/ADM-002.

Implemente testes para deslogado, usuário comum, owner, editor, viewer, erro de banco, role inválido, claim forjada, requisição direta, mudança de papel entre requests e inventário exato. Demonstre que o modo de observação não altera o resultado atual. Não implemente tela de gestão, enforcement, migration ou auditoria nova nesta etapa.

Execute testes focais de auth/admin, guardas, ADM-001/ADM-002 afetados, TypeScript, Prettier dos arquivos tocados, git diff --check e pnpm check:all. Entregue patch, relatório de compatibilidade e plano de ativação. Não publique sem revisão.
```

## Conclusão

O sistema não está sem autenticação administrativa. Ele possui uma guarda binária consistente e fail-closed. O problema é que essa guarda reduz três papéis existentes a um único booleano, dando a qualquer administrador acesso às operações mais sensíveis. O caminho seguro é preservar a validação server-side atual, trocar a resolução booleana por principal e capability, classificar todas as rotas com default deny e só então ativar enforcement depois de confirmar e inicializar owners. A auditoria precisa de uma trilha append-only própria antes de sustentar operações críticas como um controle confiável.
