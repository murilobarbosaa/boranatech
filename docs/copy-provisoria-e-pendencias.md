# Copy provisória e pendências abertas

Levantado em 2026-07-28, logo depois de `feat/consentimento-signin-wrap` entrar
na `main` (`e9a8249`).

Este documento existe por uma razão específica: **artefato crítico que mora só
na conversa some na primeira compactação de contexto.** O CLAUDE.md já registra
o episódio (o checklist de smoke test que perdeu 3 dos 11 passos exatamente
durante o deploy que ele existia para validar), e a contramedida é esta: se não
está em arquivo commitado, não existe.

Duas frentes aqui, e elas não se misturam:

1. **Copy provisória** que já está em produção e precisa de revisão editorial.
2. **Pendências da frente de billing**, com prazo, para não virarem dívida sem dono.

---

## 1. Copy provisória: 33 marcadores `TODO(Ana)`

Todos entraram na `main` no merge do consentimento e **já estão no ar**. Nenhum
é placeholder tipo "lorem ipsum": todos têm texto funcional escrito, que serve
enquanto não houver revisão. O pedido é revisão editorial, não preenchimento de
vazio.

**Como ler a coluna "visível":**

- **Sim** — a pessoa lê na tela, em condição normal ou de erro.
- **Corpo da resposta** — a string vai no JSON da API e aparece em DevTools,
  log e Sentry, mas **a interface não a renderiza**: o cliente monta a própria
  mensagem. Conferido em `client/src/services/consentService.ts`
  (`attemptRecord` lança `Erro ao registrar consentimento (HTTP ${res.status})`,
  sem ler o campo `message` do servidor) e em `ConsentGate.tsx`, que exibe texto
  próprio no `submitError`.

### 1.1. `client/src/components/auth/AuthCallbackGate.tsx` (3)

Tela cheia no retorno do login social, quando a sessão não pôde ser confirmada.
Fica acima do `ConsentGate` na árvore, então substitui a página inteira.

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 44 | "Confirmando seu login, só um instante..." | Espera longa no retorno do OAuth (mensagem de progresso, não de erro) | Sim |
| 85 | "Tentar novamente" / "Verificando..." | Botão primário do aviso de callback | Sim |
| 98 | "Fazer login novamente" | Link secundário, recomeça o login do zero | Sim |

### 1.2. `client/src/components/auth/authCallbackMessages.ts` (5)

Título e texto de cada desfecho de retorno de OAuth. Renderizados pelo
`AuthCallbackGate`.

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 16 | "Não foi possível concluir seu login" / "O login com o Google não foi concluído. Isso costuma ser temporário: tente novamente." | Fallback genérico, qualquer `error_code` desconhecido | Sim |
| 24 | "Login cancelado" / "Você fechou a tela do Google antes de concluir. Pode tentar de novo quando quiser." | `access_denied` | Sim |
| 30 | "Este link expirou" / "Links de acesso têm validade curta. Faça o login novamente." | `otp_expired` | Sim |
| 35 | "Não conseguimos validar seu login" / "O login parece ter começado em outro navegador ou aplicativo. Tente novamente nesta mesma janela." | `bad_oauth_state` | Sim |
| 53 | "Não foi possível confirmar sua sessão" / "Sua conexão demorou mais que o esperado e não conseguimos confirmar seu login. Nada foi perdido: tente novamente." | Sessão não confirmada dentro do limite (não houve recusa do provider) | Sim |

### 1.3. `client/src/components/consent/ConsentGate.tsx` (12)

Modal bloqueante de consentimento e seus estados de espera e falha. Só aparece
para quem está logado.

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 250 | "Registrando seu aceite, só um instante..." | Espera pela gravação do aceite vinda do cadastro | Sim |
| 277 | "Não foi possível verificar sua conta" | Título do estado de falha de verificação | Sim |
| 281 | "Tivemos um problema para confirmar seus dados. Verifique sua conexão e tente novamente." | Texto do estado de falha | Sim |
| 291 | "Tentar novamente" | Botão de retry no estado de falha | Sim |
| 299 | "Sair da conta" | Saída no estado de falha | Sim |
| 316 | "Antes de continuar" | Título do modal bloqueante | Sim |
| 320 | "Para usar a plataforma, precisamos do seu aceite dos documentos abaixo." | Texto explicativo do modal | Sim |
| 334 | "Li e aceito os **Termos de Uso**." | Rótulo da checkbox de termos | Sim |
| 356 | "Li e aceito a **Política de Privacidade**." | Rótulo da checkbox de privacidade | Sim |
| 374 | "Não foi possível registrar seu aceite. Tente novamente." | Erro ao gravar o aceite | Sim |
| 385 | "Aceitar e continuar" / "Processando..." | Botão primário do modal | Sim |
| 394 | "Recusar e sair da conta" | Recusa explícita | Sim |

### 1.4. `client/src/pages/Auth.tsx` (1)

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 231 | "Criar minha conta" / "Entrar" / "Processando..." | Botão de submit do formulário de cadastro e login (o cadastro agora leva a `/bem-vindo`) | Sim |

### 1.5. `client/src/pages/BemVindo.tsx` (9)

Primeira tela depois do cadastro.

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 12 | Lista `PRO_BENEFICIOS` inteira (7 itens) | Grade de benefícios do bloco Pro; a nota pede revisão de títulos e ordem | Sim |
| 18 | "Plano de carreira" | Um item da grade, marcado individualmente para validação de rótulo | Sim |
| 122 | "Boas vindas ao **Bora na Tech!**" / "Sua conta tá pronta. Vamos te mostrar o caminho do primeiro passo até a primeira vaga." | Título e subtítulo da página | Sim |
| 152 | "Aceito receber e-mails com novidades e promoções do Bora na Tech. Dá pra mudar isso no perfil quando quiser." | Consentimento promocional (card dispensável, nunca bloqueia) | Sim |
| 167 | "Primeiros passos" | Botão primário | Sim |
| 175 | "Leva a um passo a passo rápido pra te situar." | Linha discreta sob o botão | Sim |
| 182 | "Explorar por conta própria" | Link secundário | Sim |
| 200 | "Bora na Tech Pro" / "Tudo que acelera sua entrada em TI, com IA:" | Nome e chamada do bloco Pro | Sim |
| 229 | "Conhecer o Pro" | Link para `/planos` | Sim |

### 1.6. `server/routes/consent.ts` (3)

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 127 | "É necessário aceitar os Termos de Uso e a Política de Privacidade." | `400 consent_required` | Corpo da resposta |
| 207 | "Não foi possível registrar o consentimento. Tente novamente." | `500 consent_write_failed` | Corpo da resposta |
| 234 | "Não foi possível confirmar o registro do consentimento. Tente novamente." | `500 consent_readback_failed` | Corpo da resposta |

### 1.7. Resumo

| Grupo | Marcadores | Visíveis na tela | Só no corpo da resposta |
| --- | --- | --- | --- |
| `AuthCallbackGate.tsx` | 3 | 3 | 0 |
| `authCallbackMessages.ts` | 5 | 5 | 0 |
| `ConsentGate.tsx` | 12 | 12 | 0 |
| `Auth.tsx` | 1 | 1 | 0 |
| `BemVindo.tsx` | 9 | 9 | 0 |
| `server/routes/consent.ts` | 3 | 0 | 3 |
| **Total** | **33** | **30** | **3** |

Para reconferir o total a qualquer momento, sem confiar nesta tabela:

```bash
grep -rn "TODO(Ana)" client/src/components/auth client/src/components/consent \
  client/src/pages/Auth.tsx client/src/pages/BemVindo.tsx server/routes/consent.ts | wc -l
```

O número acima é do escopo do consentimento. Existem outros `TODO(Ana)` na base
(avatares, CTAs de roadmap) que são anteriores a este lote e não entram aqui.

---

## 2. Pendências da frente de billing

Branch: `fix/billing-customer-reuse`, em `99fae9c`, pushada, CI verde no head.
Ela **não está em produção** e **não é mais fast-forward**.

### 2.1. Lista

| # | Pendência | Estado em 2026-07-28 |
| --- | --- | --- |
| 1 | **Rebase sobre a `main`** | Necessário: a branch ficou 10 commits atrás quando auth, hero counter e Dicas entraram. Não foi feito de propósito, para não reescrever a branch sem decisão. |
| 2 | **5 migrations não aplicadas** | `20260728190000_create_billing_failed_payments`, `20260728200000_create_stripe_customers`, `20260728210000_create_payment_recovery_emails`, `20260728220000_schedule_payment_recovery`, `20260728230000_add_episodio_to_payment_recovery_emails` |
| 3 | **`scripts/backfillStripeCustomers.mjs` nunca executado** | Tem dry-run por padrão e exige `--confirm`. Nenhuma execução real registrada. |
| 4 | **Aviso das 3 tabelas na `main`** | `check:migrations` reporta `payment_recovery_emails, stripe_customers, billing_failed_payments` expostas pelo PostgREST e não declaradas. Some sozinho quando a billing entrar. |

### 2.2. Sobre o item 4, e por que ele tem prazo

As três tabelas já existem no banco (foram aplicadas pela frente de billing),
mas as migrations que as declaram vivem nos commits de billing. Enquanto a
branch não entra, **toda run de CI da `main` passa verde com um aviso sobre uma
inconsistência real na direção inversa** ("o que existe está declarado?").

Isso é exatamente a forma que o CLAUDE.md cataloga: instrumento reportando
sucesso sobre uma superfície menor. A diferença é que aqui a inconsistência é
conhecida e temporária. **O risco não é o aviso, é o aviso virar paisagem.**
Depois de algumas semanas ninguém lê mais, e o dia em que ele mudar de conteúdo
não vai chamar atenção de ninguém.

### 2.3. Prazo

**Proposta, pendente de confirmação: subir a billing até 2026-07-31.**

Três dias, coerente com "branch de dias, não de semanas" do CLAUDE.md. Se a data
não for viável, a decisão a tomar não é adiar em silêncio, e sim uma destas:

- **Adiar com data nova escrita aqui**, no mesmo commit que muda a data.
- **Transformar o aviso em erro temporário** no `check:migrations`, com a data de
  remoção no comentário, para que ele volte a ser um sinal em vez de ruído.

### 2.4. Ordem de deploy quando ela subir

Vale repetir aqui porque o merge da billing dispara deploy automático (ver
seção 3):

1. rebase sobre a `main` e CI verde;
2. merge fast-forward e push (**isto já deploya**);
3. aplicar as 5 migrations;
4. `pnpm check:migrations` contra produção;
5. decidir sobre o `backfillStripeCustomers.mjs`, que é execução separada e
   deliberada;
6. smoke test.

Atenção ao passo 3: `20260728220000_schedule_payment_recovery` mexe em
`cron.schedule` e `20260728230000_add_episodio_...` altera tabela existente.
Conferir a janela de migration destrutiva antes.

---

## 3. Push para a `main` deploya. Não existe passo manual.

Medido em 2026-07-28, e registrado aqui porque muda o significado de "fazer
merge".

Não há workflow de deploy no `.github/workflows/` (só `ci.yml`), e o
`vercel.json` não tem `ignoreCommand`. O deploy vem das integrações de
GitHub da Vercel e do Railway, que sobem sozinhas a cada push na `main`.

A medição, por endpoint que DECLARA o estado, em amostra única (nunca por
frequência, ver CLAUDE.md):

```bash
curl -s https://api.boranatech.com.br/api/health
# {"status":"ok","env":"production","uptime":36.31,...}
```

`uptime` de 36 segundos logo após o push confirma que o processo tinha acabado
de subir.

**Consequência prática:** `git push origin main` é um deploy de produção. Todo
merge para a `main` deve ser tratado como tal, inclusive na escolha do horário.
