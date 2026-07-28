# Smoke test: consentimento e login social (Passos 3 + 4 + 5)

Artefato de release. Mora aqui, versionado, e **nunca** numa mensagem de chat: o
checklist do deploy do LinkedIn viveu só na conversa, sumiu numa compactação de
contexto no meio do próprio deploy que existia para validar, e a reconstrução de
memória perdeu 3 dos 11 passos, justamente os três dos bugs que motivaram a fase.
Se não está em arquivo commitado, não existe.

Este documento cobre o deploy conjunto dos Passos 3, 4 e 5. Rodar **inteiro**, na
ordem, e marcar cada item. Item que falhar interrompe: não seguir para o próximo.

---

## 1. Ordem de deploy (a migration vem ANTES do código)

A regra geral do projeto é código antes da migration, e ela vale para migration
**destrutiva**: schema novo não é tolerado por código antigo. Aqui é o inverso, e
inverter é obrigatório:

- `add column consent_method` é **aditiva**, e o código antigo nunca menciona a
  coluna. Aplicar antes não quebra nada.
- O código **novo** manda `consent_method` no upsert. Se a coluna ainda não
  existir, o PostgREST recusa o corpo inteiro e **toda** gravação de consentimento
  falha na janela entre o deploy e a migration.

Migration aditiva é compatível com o código antigo; código novo **não** é
compatível com o schema antigo. Logo, migration primeiro.

| # | Passo | Como |
|---|---|---|
| 1 | Aplicar a migration aditiva | `20260728180000_add_consent_method_to_user_consents.sql` no SQL Editor. **Sem janela**: é aditiva, não tem o que perder. |
| 2 | `pnpm check:migrations` | Contra o banco de produção. |
| 3 | Confirmar a coluna no banco | `select column_name from information_schema.columns where table_name='user_consents' and column_name='consent_method';` tem que devolver 1 linha. |
| 4 | Push + deploy | Vercel e Railway. Deploy **não** é atômico: 1 a 3 min de front novo com backend antigo. |
| 5 | Smoke | Seções 2 e 3 deste documento. |

O servidor ainda regrava sem o campo se encontrar a coluna ausente
(`isMissingColumnError` em `server/routes/consent.ts`, evento
`consent_method_column_missing` no Sentry). Isso é rede de segurança para a ordem
errada, **não** autorização para usá-la. Se esse evento aparecer no Sentry, a
ordem foi invertida.

---

## 1-bis. Onde há checkbox e onde não há (escopo do item 4.2)

Confundir isso torna metade do checklist ambíguo, então fica explícito:

| Superfície | Tem checkbox de termos? | `consent_method` gravado |
|---|---|---|
| `/cadastro` e `/login` (página) | **NÃO.** Sign-in wrap: aviso abaixo dos botões | `signup_wrap_implicit` |
| `AuthModal` (modal de auth) | **NÃO.** Mesmo sign-in wrap | `signup_wrap_implicit` |
| **Modal do `ConsentGate`** | **SIM, permanece.** Aceite explícito, bloqueante | `consent_gate_checkbox` |

O Passo 4 removeu o checkbox das telas de **cadastro e login**. O modal do
`ConsentGate` é outra coisa: ele existe justamente para quem **não** passou pelo
clique novo (usuário com sessão ativa após um bump de versão, ou conta antiga sem
linha). Ali o aceite continua explícito e continua tendo caixa a marcar.

`signup_form_checkbox` permanece na allowlist como **histórico** e não deve ser
gravado por nenhum caminho novo. Nenhuma linha existente tem esse valor: a coluna
nasce neste mesmo deploy.

## 2. Checklist funcional

Ambiente: produção, depois do passo 4 acima. Aba anônima nova a cada item, salvo
onde indicado. Conferência de banco:

```sql
select document, version, consent_method, accepted_at
from user_consents where user_id = '<uuid>' order by accepted_at;
```

| # | Cenário | Esperado |
|---|---|---|
| 1 | Cadastro com Google em `/cadastro` | Sem modal. Duas linhas, `consent_method = signup_wrap_implicit`. |
| 2 | **LOGIN** com Google em `/login`, conta **nova** | Sem modal. Duas linhas, `signup_wrap_implicit`. Era o caminho que não gravava nada (a flag só era escrita em `mode === "cadastro"`); é o conserto do 4.3. |
| 3 | Login com Google, usuário existente **com** consentimento atual | Sem modal, sem linha nova. |
| 4 | Cadastro por e-mail | Sem modal. Duas linhas, `signup_wrap_implicit`. |
| 5 | Recarregar imediatamente após o primeiro login | Sem modal. Nenhuma linha adicional. |
| 6 | DevTools bloqueando `**/api/consent`, cadastrar, **recarregar durante o backoff** | `bnt_pending_consent` intacto no `sessionStorage`; o hold **não** passa de ~10s; o gate pede; aceitar grava `consent_gate_checkbox`; nenhuma tela morta em momento algum. |
| 7 | POST lento mas bem-sucedido depois do hold expirar (throttling pesado, sem bloquear) | Se o modal apareceu, ele **fecha sozinho** quando a escrita conclui, sem clique. |
| 8 | Um dos 29 do Grupo B, provider Google | O gate pede **uma vez**, aceita, resolve. Recarregar: sem modal. Sem loop. |
| 9 | Bump de `TERMS_VERSION` com sessão ativa | Modal, aceite, linha **nova** na versão nova, linha antiga **preservada** (`accepted_at` original intacto), `consent_method = consent_gate_checkbox`. Reverter a versão depois. |
| 10 | Aceite duplicado (aceitar, recarregar, forçar novo POST) | `accepted_at` **não** muda. |
| 11 | Inspeção visual de `/cadastro`, `/login` e do `AuthModal` | Nenhum botão de auth fica `disabled`. Nenhuma caixa de aceite nem de marketing. Aviso do sign-in wrap **acima da dobra**, legível (não cinza-claro miúdo). Links de Termos e Política abrem em **nova aba** sem interromper o fluxo. |
| 12 | Janela de deploy, nos dois sentidos | Front novo × backend antigo: `hasConsented` continua vindo no corpo, cadastro grava. Backend novo × front antigo: `method` ausente, linha grava com `consent_method` NULL. |
| 13 | `/bem-vindo`, seguir **sem** marcar o card de marketing | Grava `marketing_opt_in = false` **e** `marketing_opt_in_at = now()`. Voltar ao `/bem-vindo`: o card **não** reaparece. |
| 14 | Toggle de marketing no `/perfil`, nos dois sentidos | Liga e desliga funcionam. Desligar **carimba** `marketing_opt_in_at` (não zera mais). Nenhum e-mail promocional para quem está `false`. |

> **Item 9, cuidado:** `TERMS_VERSION` é lido pelo servidor **e** pelo cliente.
> Testar em produção significa um deploy só para o bump e outro para reverter.
> Preferir validar pelos testes automatizados (`server/routes/consent.test.ts`,
> bloco "bump de versao") e reservar o teste manual para o bump de verdade.

---

## 3. Sinais para observar nas 24h seguintes

| Sinal | Onde | O que significa |
|---|---|---|
| `consent_method_column_missing` | Sentry | Ordem de deploy invertida. A prova foi salva, o campo de auditoria não. |
| `consent_readback_failed` | Sentry / logs Railway | Escreveu e não conseguiu confirmar. O cliente retenta; a prova está no banco. Raro; se for frequente, investigar o Supabase. |
| `consent_accept result=failed` | PostHog | Aceite no modal falhando. É o número que importa num bump de versão. |
| `auth_failure stage=session_unconfirmed` | Sentry / PostHog | Retorno de OAuth não confirmado. Deve cair a quase zero com o limite de 20s. |
| `auth_timing stage=session_recovered_after_timeout` | PostHog | Sessão válida encontrada **depois** do limite. Se aparecer, 20s ainda é curto. |
| `auth_timing stage=oauth_return_succeeded` | PostHog | Distribuição dos retornos saudáveis. Responde retroativamente que fração passava de 5000ms. |

---

## 4. Teste que FECHA o problema (2), 7 dias após o deploy

Hoje a explicação dos 6 usuários de e-mail do Grupo B é **conclusão por
eliminação**, não medição direta: a confirmação de e-mail está desligada
(`mailer_autoconfirm = true`, e nenhum usuário com `email_confirmed_at` nulo),
então a hipótese da causa terciária caiu, e sobrou "POST perdido" por ser a única
explicação restante. Isso não é o mesmo que ter medido.

**Procedimento**, 7 dias corridos após o deploy:

```bash
set -a && . ./.env && set +a
npx tsx scripts/consentForensics.mts
```

**Critério de aprovação:** o Grupo B **para de crescer**. Especificamente, o
recorte "Grupo B com `created_at` posterior ao deploy" deve ser **zero**, ou
indistinguível de zero contra o volume de cadastros do período (referência atual:
1100 a 1342 cadastros por semana).

**Se contas criadas após o deploy continuarem sem linha nenhuma**, a explicação
de "POST perdido" estava errada e existe um quarto mecanismo que não medimos.
Nesse caso, não ajustar nada às cegas: instrumentar antes. Os eventos de
`consent_request_failed` e `auth_failure` já deployados devem dizer por onde.

Registrar o resultado neste arquivo, com data.

### Registro de execuções

| Data | Grupo B pós-deploy | Veredito |
|---|---|---|
| _(pendente)_ | | |
