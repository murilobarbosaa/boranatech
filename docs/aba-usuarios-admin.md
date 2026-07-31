# Aba Usuários do admin: limites conhecidos e pendências

Fechamento da demanda de melhoria da aba (Fatias 0 a 8, julho de 2026). Este
documento tem só o que **não tem sítio natural no código**: condição de dado que
ninguém enxerga lendo arquivo, e trabalho decidido e não feito.

O que tem sítio natural mora junto do código, e o índice abaixo diz onde. Não
duplicar aqui: comentário e doc que contam a mesma coisa divergem no primeiro
que alguém atualizar.

## Índice do que mora no código

| Assunto                                              | Onde                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `identity_data.email` fica com o endereço antigo     | `server/routes/admin.ts`, cabeçalho de `POST /users/:id/email`                        |
| `email_suppressions` não acompanha a troca de e-mail | idem                                                                                  |
| Boleto não tem reembolso pela API da Stripe          | `server/routes/admin.ts`, cabeçalho de `POST /users/:id/refunds`                      |
| Como (a) e (b) são distinguidos no registro manual   | `server/routes/admin.ts`, cabeçalho de `POST /users/:id/external-refunds`             |
| Por que a revogação usa `status` e não o período     | `server/routes/admin.ts`, docstring de `revogarAcessoPro`                             |
| A regra de quando revogar (saldo zerado)             | `server/lib/proRevocation.ts`, `devolucaoZeraOSaldo`                                  |
| Junção das duas fontes de devolução                  | `server/lib/userTransactions.ts`, cabeçalho                                           |
| Bug latente do cron `process-cancellations`          | `server/routes/cron.ts` e `server/providers/stripe.ts` (`getStripeSubscriptionState`) |
| Teto de reembolso é por processo                     | `server/lib/refund.ts`, `criarLimitadorDeReembolso`                                   |
| Allowlist de renderização do histórico               | `shared/auditVisibleFields.ts`                                                        |
| Overlay dos diálogos do admin                        | `client/src/components/admin/tasks/taskLayers.ts`                                     |
| FinanceDashboard cego a devolução externa            | `server/lib/financeMetrics.ts`, bloco no topo                                         |

## Condição de dado: 6 contas com e-mail divergente

Medido em 2026-07-30, **anterior a este trabalho**: 6 contas têm
`auth.users.email` diferente de `raw_user_meta_data->>'email'`.

Não foi causado pela rota de troca de e-mail (que escreve os dois, via
`mergedUserMetadata`), e não foi corrigido aqui: um backfill que sobrescreve
metadata alheia é escrita em dado de identidade, e escrita de identidade sem
alguém confirmando caso a caso é exatamente o tipo de conserto que cria o
problema seguinte.

O que **usa** cada um decide a gravidade: login, recuperação de senha e a
listagem do admin leem `auth.users.email`, que está correto nas 6. A metadata
entra em template de e-mail transacional, então uma dessas contas pode receber
mensagem endereçada ao e-mail antigo.

Consulta para reconferir antes de decidir qualquer coisa:

```sql
select id, email, raw_user_meta_data->>'email' as meta_email
  from auth.users
 where raw_user_meta_data->>'email' is not null
   and lower(raw_user_meta_data->>'email') <> lower(email);
```

## Pendências abertas

Todas conhecidas e nenhuma iniciada. Estão aqui porque a alternativa seria elas
viverem numa conversa, e checklist que mora em conversa some na primeira
compactação (é o caso registrado no `CLAUDE.md`). A lista cresce; o total não é
afirmado aqui, pelo mesmo motivo do parágrafo sobre numerais no `CLAUDE.md`.

### 1. `filter=pro` da lista é mais frouxo que o gate real

O filtro da listagem monta a lista de Pro por assinatura `active`, enquanto o
acesso de verdade sai da RPC `is_user_pro`, que também exige plano diferente de
`free` e período não vencido, e ainda tem o ramo de `influencers`. Efeito: a
lista pode marcar como Pro alguém que o gate recusa.

Não foi alinhado porque alinhar significa reproduzir a condição da RPC no
`WHERE` do filtro, e duas cópias da mesma regra divergem. O caminho certo é o
filtro chamar a própria RPC, o que é uma fatia com custo próprio.

O enriquecimento **por linha** (`is_pro`, `pro_source`) já espelha a RPC
condição a condição, em `server/lib/userListEnrichment.ts`. A divergência é só
do FILTRO.

### 2. Filtro "ativo" custa cerca de 2,5 s por requisição

O filtro por atividade resolve em memória a partir de uma varredura, e é o mais
lento da aba com folga. Aceitável no uso de hoje (uma pessoa, filtro pouco
usado), inaceitável se virar padrão de navegação.

### 3. Cobranças sem dono não aparecem em lugar nenhum

`finance_transactions` com `user_id` nulo não entra no extrato de ninguém, e
nada na interface diz que elas existem. É dinheiro real invisível: hoje 4
linhas, R$ 450,03, todas de boleto.

Falta uma visibilidade mínima no admin (contagem e total), para que a existência
delas não dependa de alguém rodar SQL.

### 4. Backfill de donos não executado

`docs/backfill-donos-finance-transactions.sql`, três blocos, escrito e
**não rodado**. Os blocos A e B afetam 0 linhas hoje; o C afeta as 4 acima.

É `UPDATE` de dado existente, então vale a janela de migration destrutiva do
`CLAUDE.md` (05h-09h de Brasília, com backup `COMPLETED` confirmado). A ingestão
já foi corrigida, então boleto novo resolve sozinho; o backfill é só para as
linhas gravadas antes.

**O registro manual de devolução de boleto depende deste backfill.** Conferido
no código, não suposto: `GET /users/:id/transactions` filtra
`finance_transactions` por `.eq("user_id", uid)`, e as 4 cobranças de boleto têm
`user_id` nulo. Elas não entram no extrato de ninguém, e a tela oferece o botão
"Registrar devolução" a partir das linhas do extrato. **Enquanto o bloco C não
rodar, a interface não tem nenhuma cobrança de boleto sobre a qual operar**; a
rota existe e funciona, mas nenhuma tela chega até ela. Depois do backfill as 4
passam a aparecer no extrato dos respectivos donos e ganham o botão.

### 5. FinanceDashboard não desconta devolução externa

Uma linha em `admin_refunds` com `settlement='external'` entra no extrato do
usuário e **não** entra no dashboard financeiro global, que lê
`finance_transactions` direto. Duas telas discordando sobre o mesmo dinheiro.

Medido, por devolução externa de N centavos na janela consultada:
`reembolsosCents` subestimado em N; `receitaLiquidaCents`, `lucroCents` e
`margemPercent` superestimados; a série mensal superestima receita e lucro no mês
da declaração. `receitaBrutaCents`, `taxasStripeCents` e `getDeferredRevenue`
ficam corretos.

Efeito hoje: **zero**, porque nenhuma linha `external` existe ainda. O caminho de
correção (uma linha sintética em memória dentro de `loadTransactions`, sem
escrever nada e sem tocar na natureza Stripe-only de `finance_transactions`) está
escrito no topo de `server/lib/financeMetrics.ts`.
