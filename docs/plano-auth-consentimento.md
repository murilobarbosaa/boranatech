# Plano: consentimento no cadastro e estabilidade do login social

**Estado:** em execução. Última atualização: 2026-07-28.

Artefato vivo. Atualizar ao fim de **cada** passo, no mesmo commit que fecha o
passo.

## Por que este arquivo existe

Os Passos 4 e 5 deste plano sumiram numa compactação de contexto, e o que restou
na conversa **parecia completo**. É a mesma classe já documentada no CLAUDE.md (o
checklist de smoke que morava só no chat e perdeu 3 dos 11 passos), com outro
suporte: o escopo foi derivado de um armazenamento que encolhe em silêncio.

O plano é, de todos os artefatos, o que menos pode morar só na conversa: é ele que
diz o que ainda falta, e a ausência de um item não se parece com nada.

---

## 1. As quatro decisões

### A — Modelo de dados do consentimento

> Manter `user_consents` como única fonte de verdade do consentimento. **NÃO** criar
> `termsAcceptedAt` / `termsVersion` / `consentMethod` no registro do usuário, como
> pedia o brief original. Motivo: uma linha por (usuário, documento, versão) com IP,
> user agent e timestamp do banco é prova mais forte para LGPD que três colunas no
> perfil, e a tabela já está ligada no gate, no servidor e no admin. Alternativas
> rejeitadas: criar segunda fonte de verdade (risco de divergência), ou migrar e
> dropar a tabela (destrutivo, exigiria a janela das 05h às 09h). Única mudança de
> schema autorizada: `ADD COLUMN consent_method text NULL`, aditiva.

### B — Usuários existentes sem linha

> **Não escrever consentimento retroativo** para os usuários existentes sem linha.
> Eles veem o gate, que é o comportamento correto: ninguém fabrica prova de aceite
> que não aconteceu.

### C — Item 2.5 do brief, fallback popup → redirect

> Não implementável como escrito: **não existe popup no OAuth do Supabase**.
> `signInWithOAuth` atribui `window.location` e o fluxo é sempre redirect de página
> inteira, logo não há popup do qual cair. O brief usava vocabulário de Firebase
> (popup, authDomain), que não se aplica a esta stack. Substituição aprovada:
> detecção de webview de app (Instagram, Facebook, LinkedIn) com caminho explícito
> de "abrir no navegador" antes de iniciar o OAuth, somado a fazer aparecer os erros
> de OAuth que hoje são engolidos. Motivo do webview: fluxo iniciado em webview e
> concluído no navegador do sistema **perde o `code_verifier` do PKCE**. Escopo do
> **Passo 6**.

### D — Marketing sem migration

> **Sem migration no Passo 5.** Não remover o `NOT NULL` de
> `profiles.marketing_opt_in`. "Nunca perguntado" passa a ser
> `marketing_opt_in_at IS NULL`, que já existe e é nullable.

> **Nota sobre a decisão C:** a parte de detecção de webview já tem código no
> repositório (`client/src/lib/webview.ts`, `detectInAppBrowser`, usado pela
> telemetria do Passo 1 no campo `is_webview`). O caminho de "abrir no navegador" na
> interface é que continua pendente, no Passo 6.

---

## 2. Os três problemas de origem

1. **Cadastro com Google exigia marcar um checkbox** que ficava longe do botão, e
   sem ele o botão do Google ficava `disabled`. Atrito real e consentimento frágil.
2. **Contas nascendo sem linha em `user_consents`.**
3. **Login com Google instável:** o timer de salvaguarda de 5000ms declarava "não
   logado" enquanto a troca PKCE ainda estava em voo. Latência de rede móvel virava
   logout, com um `console.warn` como único rastro.

---

## 3. Números do Passo 2 (forense, 2026-07-28)

Fonte: `scripts/consentForensics.mts` (somente leitura). Reproduzível.

| Medida | Valor |
|---|---|
| Total de usuários em `auth.users` | 2841 |
| Com consentimento na versão atual | 2777 |
| **Grupo A** (linha em versão anterior, nenhuma na atual) | **0** |
| **Grupo B** (nenhuma linha, nenhuma versão) | **64** |
| Grupo B criado **antes** do bump (2026-07-13) | 35 |
| **Grupo B criado após o bump (o tamanho real do problema 2)** | **29** |
| Providers dos 29 | 23 google, 6 email |
| Conta mais antiga | 2026-05-03 |
| Cadastros/semana (últimas 3) | 352 → 1342 → 1100 |

**Corrida de leitura-antes-da-escrita, confirmada:** 50 usuários viram o modal
tendo linha já gravada, e os **50** com menos de 5s de distância. É a faixa que só
a corrida explica.

**A escrita do cadastro funciona quando chega:** de 2764 contas criadas após o
bump e com consentimento atual, 2477 têm a linha gravada em menos de 10s do
`created_at`.

### Causas, e o que cada uma explica

| Causa | Explica | Fechada por |
|---|---|---|
| Corrida leitura/escrita (gate lê antes do POST commitar) | Os 50 que viram o modal já tendo linha | Passo 3.1 a 3.4 |
| Lacuna determinística: a flag só era gravada em `mode === "cadastro"` | Os 23 do Google | Passo 4.3 |
| POST perdido (`.catch` silencioso, sem retry, flag apagada antes) | Os 6 de e-mail | Passo 3.2, 3.3 |
| Timer de 5000ms transformando lentidão em logout | Problema 3 | Passo 1 |

> A linha dos 6 de e-mail é **conclusão por eliminação**, não medição direta. Ver
> seção 6.

---

## 4. Bloqueantes externos e fatos de ambiente verificados

| Fato | Valor | Como foi verificado |
|---|---|---|
| Confirmação de e-mail | **DESLIGADA** (`mailer_autoconfirm: true`) | Management API `/config/auth`, e `email_confirmed_at` não-nulo nos 2841 usuários |
| Deploy não é atômico | Vercel antes de Railway, janela de 1 a 3 min | CLAUDE.md |
| Backup Supabase | Diário ~04:15 BRT, **PITR desabilitado** | CLAUDE.md |
| Rate limit | 180 req/min **por IP** | `server/lib/env.ts` |
| Pico de usuários/dia com `consent_check` | 291 | PostHog, 14 dias |
| **Migration `consent_method`** | **APLICADA em 2026-07-28**, via SQL Editor (não pelo CLI) | `information_schema.columns`: `consent_method / text / is_nullable=YES` |

### O histórico do CLI não reflete o banco, e isso é anterior a este trabalho

`supabase_migrations.schema_migrations` tem **16 registros**, o mais recente de
**2026-05-26**. O repositório tem **118 arquivos** de migration. Ou seja, a defasagem
não é "faltou registrar a do `consent_method`": o histórico do CLI parou de ser
alimentado em maio, e cerca de uma centena de migrations aplicadas não estão nele.

**`pnpm check:migrations` não acusa isso, e não é defeito dele:** o guard compara o
que as migrations DECLARAM com o que existe no banco, por introspecção. Ele nunca lê
`schema_migrations` (verificado: zero ocorrências no script e nas libs). Guard verde
diz que o schema confere; **não** diz nada sobre a tabela de histórico.

Consequência prática: `supabase db push` não é utilizável neste projeto sem antes
reconciliar o histórico, porque ele tentaria reaplicar ~102 migrations. O fluxo real
já é SQL Editor, e é por isso que o guard por introspecção existe. **Não escrever no
histórico para "consertar" sem decisão explícita:** um `INSERT` de 102 versões que
não foram verificadas uma a uma é afirmar um estado que ninguém conferiu, que é a
classe de erro que este projeto documenta.

**Consequência da primeira linha:** a hipótese de "cadastro por e-mail com
confirmação pendente" como causa terciária **não existe neste projeto**. O item
foi derrubado, não implementado.

**Próximo bump de `TERMS_VERSION`:** 2777 usuários cairiam no gate, mas não
simultaneamente. O `GET /status` já roda em toda carga de app, então o bump não
adiciona nenhum GET; o delta é ~300 POSTs espalhados pelo dia de pico, um por
usuário. **Não precisa de rollout gradual.**

---

## 5. Estado de cada passo

| Passo | O que é | Estado |
|---|---|---|
| **0** | Tirar o plano do chat (este arquivo) | ✅ **feito** |
| **1** | Estabilizar o retorno do OAuth: limite 5s → 20s, o estouro nunca zera sessão, `AuthCallbackGate` com retry, telemetria de falha e de timing | ✅ **feito**, 2 commits, **sem push** |
| **2** | Forense somente-leitura (`scripts/consentForensics.mts`) | ✅ **feito** |
| **3** | Escrita de consentimento determinística: resposta carrega o estado, await com retry, flag só sai no 2xx, gate segura com teto, `consent_method` | 🔵 **em revisão** |
| **4** | Remover o checkbox bloqueante, sign-in wrap, flag em toda iniciação de auth, `consent_method` = `signup_wrap_implicit` | 🔵 **em revisão** |
| **5** | Marketing fora do cadastro, "nunca perguntado" = `marketing_opt_in_at IS NULL`, dispensar grava a recusa | 🔵 **em revisão** |
| **Fechamento** | Reexecutar a forense 7 dias após o deploy | ⏳ **pendente** |

### Commits do Passo 1: vão JUNTOS

São dois por assunto (instrumentação, depois timer), mas **o mesmo push e o mesmo
deploy**. O intermediário tem o timer antigo de 5000ms ainda deslogando: subir só
ele seria deployar de propósito um bug conhecido para colher linha de base. A linha
de base vem dos eventos do segundo commit em diante.

### Mudança de significado: `profiles.marketing_opt_in_at`

Não é mudança de schema, e por isso não aparece em migration nenhuma. É mudança de
**quando a coluna é escrita**, e fica registrada aqui porque é o tipo de coisa que
some do radar.

- **Antes:** "quando a pessoa consentiu". `false` zerava o carimbo para `null`.
- **Agora:** "quando a decisão foi registrada". `false` **também** carimba.

Motivo: sem uma coluna nova (decisão D), este carimbo é o único sinal capaz de
separar "nunca perguntado" de "perguntado e recusado". Com a regra antiga os dois
estados eram a mesma linha, e por isso o card do `/bem-vindo` reaparecia para quem
já havia dispensado.

**Por que é seguro:** toda decisão de envio promocional filtra pelo booleano
`marketing_opt_in === true`, nunca pelo carimbo. Verificado em `audienceReach`,
`emailCampaignQueue`, `notificationAudience` e `adminEmailCampaigns`; o carimbo só
aparece na listagem do admin. Se algum código futuro passar a ler o carimbo como
prova de consentimento, esta decisão precisa ser revisitada.

### Ordem de deploy: a migration aditiva vai ANTES do código

A regra do CLAUDE.md (código antes da migration) é sobre migration **destrutiva**.
Aqui é o inverso, e inverter é obrigatório. Procedimento completo em
[`smoke-consentimento.md`](./smoke-consentimento.md), seção 1.

---

## 6. Teste que fecha o problema (2)

Reexecutar `scripts/consentForensics.mts` **7 dias após o deploy**.

**Critério:** o Grupo B **para de crescer**. O recorte "Grupo B com `created_at`
posterior ao deploy" deve ser zero, ou indistinguível de zero contra 1100+
cadastros por semana.

**Se continuar crescendo,** a explicação de "POST perdido" para os 6 de e-mail
estava errada e existe um quarto mecanismo não medido. Nesse caso: instrumentar
antes de ajustar. Detalhe e registro de execuções em
[`smoke-consentimento.md`](./smoke-consentimento.md), seção 4.

---

## 7. Fora de escopo, deliberadamente

- Consentimento retroativo para os 64 (decisão B).
- Qualquer mudança de schema além do `ADD COLUMN consent_method`.
- Remover o `NOT NULL` de `marketing_opt_in` (decisão D).
- Rollout gradual do bump de versão: medido, não é necessário.
