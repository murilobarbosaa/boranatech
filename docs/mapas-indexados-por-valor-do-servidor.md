# Mapas indexados por valor do servidor: levantamento

**Levantado em 2026-07-31.** Nada foi consertado. É a lista para decidir com ela na mão.

## Por que existe

A regra do `CLAUDE.md` ("Lookups por valor do servidor") nasceu de um incidente real: `STATUS_META[item.status].label` derrubou o admin em produção com `Cannot read properties of undefined (reading 'label')`. A contramedida é um resolver com fallback neutro, no molde de `notificationTypeMetaOf`.

O conserto de 2026-07-31 cobriu LinkedIn, Currículo e Portfólio. **O padrão não está contido nessas três features**, e este documento é o resto.

## Metodologia, e o que ela NÃO garante

A lista abaixo sai de duas varreduras cruzadas: todos os `Record<>` declarados em `client/src`, e todos os sítios `NOME[` fora do arquivo de definição.

**A coluna "fallback" é mecânica; a coluna "risco" não.** Um acesso sem `??` só é dívida se a chave vier de fora. No mesmo levantamento eu classifiquei três sítios do LinkedIn como dívida e **dois eram falso positivo**:

- `LINKEDIN_CATEGORY_LABELS[d.categoria]` parecia risco, mas `d.categoria` vem de `decomporNota(..., LINKEDIN_CATEGORIES)`, iterando uma constante local. Não pode ser desconhecida.
- `VERDICT_UI[verdict]` idem: `verdict` sai de `deriveSectionVerdict`, função local com retorno de união fechada.

**Classificar por forma (é um `Record` indexado por variável?) produz falso positivo. O que decide é a ORIGEM da chave.** Os itens marcados como "traçado" abaixo tiveram a origem seguida até a fonte; os marcados "candidato" não, e precisam da mesma checagem antes de virar trabalho.

## Grupo 1: chave vem do servidor, sem fallback (dívida confirmada ou provável)

| mapa | arquivo:linha | indexa | dano | origem |
|---|---|---|---|---|
| `STATUS_META` | `Admin.tsx` 1546, 3767, 3769, 3980, 4136, 4155, 4158, 4269 | status de várias entidades | **crash** se usado como `.algo` | candidato |
| `STATUS_META` | `ContactListsManager.tsx` 77, 347, 623 | status de membro de lista | **crash** | candidato |
| `STATUS_META` | `SubscribersTable.tsx` 70 | status de assinante | **crash** | candidato |
| `STATUS_META` | `UserAuditHistory.tsx` 11 | status de auditoria | **crash** | candidato |
| `SEVERITY_META` | `BugsDashboard.tsx` 65, 236 | severidade de bug | **crash** | candidato |
| `STATUS_LABEL` | `BugsDashboard.tsx` 641 | status de bug | rótulo vazio | candidato |
| `TOOL_STATUS_LABELS` | `AgentWidget.tsx` 429 | status de tool do agente | rótulo vazio | candidato |
| `ACTIVITY_STATUS_LABELS` | `userFormat.ts` 75 | status de atividade | rótulo vazio | candidato |
| `ICON_MAP` | `BadgeCard.tsx` 31, `BadgeDetailModal.tsx` 16, `ConquistasPreview.tsx` 12 | slug de ícone de badge, vindo do banco | **crash** se renderizado como componente | candidato |
| `PRIORITY_META` | `taskBoardStyles.ts` 28, 81 | prioridade de tarefa | **crash** | candidato |
| `TYPE_META` | `taskBoardStyles.ts` 84, `notificationTypeMeta.ts` 37 | tipo de tarefa / notificação | **crash** | candidato |
| `LINKEDIN_CAMPO_LABELS` | `RecruiterFinder.tsx` 18 | campo de keyword, de `deterministic.keywordsCampos` | **texto "undefined"** no meio de um `join` | **traçado** |
| `TIER_WEIGHTS` | `shared/linkedin/schema.ts` 435 | tier de check, numa soma | **nota inteira vira `NaN`, sem erro** | **traçado** |

## Grupo 2: já tem fallback (sem dívida)

`ACAO_META`, `OUTCOME_META`, `TIPO_META`, `SUBSCRIPTION_STATUS_BADGES`, `AUDIENCE_META`, `PLAN_LABELS`, `PAYMENT_METHOD_LABELS`, `CANCELLATION_REASON_LABELS`, `AVATAR_MODE_LABELS`, `PRO_BADGES`, `REASON_LABELS`, `FREQUENCY_LABELS`, `LAST_ACCESS_LABELS`, `TX_TYPE_LABEL`, `LEVEL_BADGES`, `TYPE_META_HISTORICO` e os demais sítios com `??`.

Notar que vários mapas aparecem nos **dois** grupos, com sítios protegidos e desprotegidos no mesmo arquivo (`ACTIVITY_STATUS_LABELS` em `userFormat.ts` 75 sem e 83 com; `PRIORITY_META` em `taskBoardStyles.ts` 69 com e 28/81 sem). É o padrão que a regra do `CLAUDE.md` chama de guarda no call site: cobre quem alguém lembrou.

## Grupo 3: indexado por constante local (não é dívida)

`CATEGORY_LABEL` em `ChecklistByCategory.tsx` (iterado por `CATEGORY_ORDER`), `FAIXA_UI`/`FAIXA_LABELS` em `LinkedinAnalyzerIntro.tsx` (literal do arquivo), `LINKEDIN_CATEGORY_LABELS` no Hero, `VERDICT_UI` no `SectionReport`, os `*_LABEL` de formulário em `LinkedinAnalisar.tsx` (`CONEXOES_LABEL`, `ATIVIDADE_LABEL`, `SIM_NAO_LABEL`, `OPEN_TO_WORK_LABEL`, indexados por estado local do form).

Aplicar resolver aqui protegeria onde o risco não existe e diluiria o sinal de que resolver significa "valor externo".

## Ordem que eu consertaria

1. **`TIER_WEIGHTS`** — único que falha em silêncio. Os outros crasheiam, e crash é detectável; nota `NaN` viaja como dado.
2. **`ICON_MAP`** — o slug vem do banco (tabela de badges), é o mais fácil de ganhar valor novo sem deploy de front, e renderizar `undefined` como componente derruba a árvore.
3. **`STATUS_META` no `Admin.tsx`** — oito sítios, é literalmente o mapa do incidente original, e a aba de admin é onde ele já aconteceu.
4. **`PRIORITY_META` / `TYPE_META` em `taskBoardStyles.ts`** — mistura protegido com desprotegido no mesmo arquivo, que é o pior estado possível: parece coberto.
5. O resto, por dano.

**Antes de consertar qualquer um do Grupo 1 marcado "candidato": trace a origem da chave.** Dois de três palpites meus estavam errados quando não tracei.
