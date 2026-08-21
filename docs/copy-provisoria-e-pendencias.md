# Copy provisória e pendências abertas

Levantado em 2026-07-28, logo depois de `feat/consentimento-signin-wrap` entrar
na `main` (`e9a8249`).

Este documento existe por uma razão específica: **artefato crítico que mora só
na conversa some na primeira compactação de contexto.** O CLAUDE.md já registra
o episódio (o checklist de smoke test que perdeu 3 dos 11 passos exatamente
durante o deploy que ele existia para validar), e a contramedida é esta: se não
está em arquivo commitado, não existe.

---

## ⚠️ A copy provisória JÁ ESTÁ NO AR

Não é "vai para produção no próximo deploy". **Foi para produção em
2026-07-28.**

O motivo é que **push para a `main` é deploy**: não há workflow de deploy no
repositório (só `ci.yml`) e o `vercel.json` não tem `ignoreCommand`, então as
integrações de GitHub da Vercel e do Railway sobem sozinhas a cada push. Isso
está detalhado na seção 4.

Linha do tempo medida:

| Instante (UTC) | Instante (BRT) | Evento | Como foi medido |
| --- | --- | --- | --- |
| 2026-07-28T23:06:01Z | 20:06:01 | `e9a8249` (auth + os 33 `TODO(Ana)`) chega na `main` | `created_at` da run de CI da `main` |
| ~23:06 a 23:15 | ~20:06 a 20:15 | Vercel e Railway sobem, cada um no seu tempo (deploy não é atômico) | — |
| 2026-07-28T23:15:40Z | 20:15:40 | **Primeira prova de que a copy nova está servindo**: duas linhas em `user_consents` gravadas com `consent_method = 'signup_wrap_implicit'`, valor que só o código novo escreve | consulta ao banco de produção |

Ou seja: **a partir de 2026-07-28 20:15 BRT, no mais tardar, toda pessoa que
passa pelo login, pelo retorno do OAuth ou pela tela de boas-vindas está lendo
os textos abaixo.** A revisão editorial não é preparação para um deploy futuro,
é correção de algo que já está publicado.

---

## 1. Copy provisória: 33 marcadores `TODO(Ana)`

Nenhum é placeholder vazio tipo "lorem ipsum": todos têm texto funcional
escrito, que serve enquanto não houver revisão. O pedido é revisão editorial.

**Ordem das seções: por alcance, do maior para o menor.** Quem revisar de cima
para baixo corrige primeiro o que mais gente lê.

**Como ler a coluna "visível":**

- **Sim** — a pessoa lê na tela.
- **Corpo da resposta** — a string vai no JSON da API e aparece em DevTools, log
  e Sentry, mas **a interface não a renderiza**: o cliente monta a própria
  mensagem. Conferido em `client/src/services/consentService.ts`
  (`attemptRecord` lança `Erro ao registrar consentimento (HTTP ${res.status})`,
  sem ler o campo `message` do servidor) e em `ConsentGate.tsx`, que exibe texto
  próprio no `submitError`.

### 1.1. Fluxo de login e cadastro — alcance máximo

Todo mundo que entra na plataforma passa por aqui.

#### `client/src/pages/Auth.tsx` (1)

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 231 | "Criar minha conta" / "Entrar" / "Processando..." | Botão de submit do formulário. O cadastro agora leva a `/bem-vindo` | Sim |

#### `client/src/components/consent/ConsentGate.tsx` (12)

Modal bloqueante. Aparece para **qualquer pessoa logada** que ainda não tenha
aceite registrado na versão atual dos documentos, em qualquer rota não
allowlistada. É a tela que mais gente encontra depois do login, e ela não tem
botão de fechar.

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 316 | "Antes de continuar" | Título do modal bloqueante | Sim |
| 320 | "Para usar a plataforma, precisamos do seu aceite dos documentos abaixo." | Texto explicativo | Sim |
| 334 | "Li e aceito os **Termos de Uso**." | Rótulo da checkbox de termos | Sim |
| 356 | "Li e aceito a **Política de Privacidade**." | Rótulo da checkbox de privacidade | Sim |
| 385 | "Aceitar e continuar" / "Processando..." | Botão primário | Sim |
| 394 | "Recusar e sair da conta" | Recusa explícita | Sim |
| 374 | "Não foi possível registrar seu aceite. Tente novamente." | Erro ao gravar o aceite | Sim |
| 250 | "Registrando seu aceite, só um instante..." | Espera pela gravação vinda do cadastro | Sim |
| 277 | "Não foi possível verificar sua conta" | Título do estado de falha de verificação | Sim |
| 281 | "Tivemos um problema para confirmar seus dados. Verifique sua conexão e tente novamente." | Texto do estado de falha | Sim |
| 291 | "Tentar novamente" | Retry no estado de falha | Sim |
| 299 | "Sair da conta" | Saída no estado de falha | Sim |

### 1.2. Retorno do login social (callback) — alcance médio

Só quem usa login social **e** cai num desfecho não conclusivo. Menos gente que
o grupo acima, mas é exatamente a tela de quem já está com problema, então o
texto errado aqui custa caro.

#### `client/src/components/auth/authCallbackMessages.ts` (5)

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 16 | "Não foi possível concluir seu login" / "O login com o Google não foi concluído. Isso costuma ser temporário: tente novamente." | Fallback genérico, qualquer `error_code` desconhecido | Sim |
| 53 | "Não foi possível confirmar sua sessão" / "Sua conexão demorou mais que o esperado e não conseguimos confirmar seu login. Nada foi perdido: tente novamente." | Sessão não confirmada no limite (não houve recusa do provider) | Sim |
| 24 | "Login cancelado" / "Você fechou a tela do Google antes de concluir. Pode tentar de novo quando quiser." | `access_denied` | Sim |
| 30 | "Este link expirou" / "Links de acesso têm validade curta. Faça o login novamente." | `otp_expired` | Sim |
| 35 | "Não conseguimos validar seu login" / "O login parece ter começado em outro navegador ou aplicativo. Tente novamente nesta mesma janela." | `bad_oauth_state` | Sim |

#### `client/src/components/auth/AuthCallbackGate.tsx` (3)

Tela cheia: substitui a página inteira enquanto está ativa.

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 44 | "Confirmando seu login, só um instante..." | Espera longa no retorno do OAuth. Mensagem de progresso, não de erro | Sim |
| 85 | "Tentar novamente" / "Verificando..." | Botão primário do aviso | Sim |
| 98 | "Fazer login novamente" | Link secundário, recomeça o login do zero | Sim |

### 1.3. Boas-vindas — alcance menor

Só quem acabou de criar conta, e uma vez só.

#### `client/src/pages/BemVindo.tsx` (9)

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 122 | "Boas vindas ao **Bora na Tech!**" / "Sua conta tá pronta. Vamos te mostrar o caminho do primeiro passo até a primeira vaga." | Título e subtítulo | Sim |
| 167 | "Primeiros passos" | Botão primário | Sim |
| 175 | "Leva a um passo a passo rápido pra te situar." | Linha discreta sob o botão | Sim |
| 182 | "Explorar por conta própria" | Link secundário | Sim |
| 152 | "Aceito receber e-mails com novidades e promoções do Bora na Tech. Dá pra mudar isso no perfil quando quiser." | Consentimento promocional. Card dispensável, nunca bloqueia | Sim |
| 200 | "Bora na Tech Pro" / "Tudo que acelera sua entrada em TI, com IA:" | Nome e chamada do bloco Pro | Sim |
| 12 | Lista `PRO_BENEFICIOS` inteira (7 itens) | Grade de benefícios; a nota pede revisão de títulos e ordem | Sim |
| 18 | "Plano de carreira" | Um item da grade, marcado para validação de rótulo | Sim |
| 229 | "Conhecer o Pro" | Link para `/planos` | Sim |

### 1.4. Não renderizados

#### `server/routes/consent.ts` (3)

| Linha | Texto atual | Onde aparece | Visível |
| --- | --- | --- | --- |
| 127 | "É necessário aceitar os Termos de Uso e a Política de Privacidade." | `400 consent_required` | Corpo da resposta |
| 207 | "Não foi possível registrar o consentimento. Tente novamente." | `500 consent_write_failed` | Corpo da resposta |
| 234 | "Não foi possível confirmar o registro do consentimento. Tente novamente." | `500 consent_readback_failed` | Corpo da resposta |

### 1.5. Resumo

| Grupo | Marcadores | Na tela | Só no corpo da resposta |
| --- | --- | --- | --- |
| Login e cadastro (`Auth.tsx`, `ConsentGate.tsx`) | 13 | 13 | 0 |
| Callback (`authCallbackMessages.ts`, `AuthCallbackGate.tsx`) | 8 | 8 | 0 |
| Boas-vindas (`BemVindo.tsx`) | 9 | 9 | 0 |
| Backend (`server/routes/consent.ts`) | 3 | 0 | 3 |
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
| 1 | **Rebase sobre a `main`** | Necessário: a branch ficou atrás quando auth, hero counter e Dicas entraram. Não foi feito de propósito, para não reescrever a branch sem decisão. |
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

### 2.3. Prazo: 2026-08-08

**Adiado de 2026-08-01 para 2026-08-08 em 2026-08-01**, no dia do vencimento, por ato deliberado.

#### A distancia, ao lado da data

Registrada aqui porque **sem ela a data parece um prazo e e um sintoma**:

| medicao | a frente da `main` | atras da `main` |
| --- | --- | --- |
| quando o prazo foi marcado (2026-07-28) | | **10** |
| primeiro adiamento (2026-07-29) | | **15** |
| **hoje (2026-08-01)** | **20** | **119** |

O mecanismo e circular e esta medido: **cada adiamento aumenta o custo do proximo rebase, que causa o
adiamento seguinte.** Em quatro dias a distancia multiplicou por doze. Nenhuma das duas prorrogacoes mexeu
nisso: as duas trataram a data, nao a causa.

#### A pergunta que a proxima revisao TEM de responder antes de adiar de novo

> **A billing sobe, ou a branch e descartada e o trabalho recomeca a partir da `main`?**

119 commits atras e o ponto em que rebase deixa de ser barato: sao quatro dias de auth, home, LinkedIn e
admin passando por baixo, e o custo de reconciliar nao e linear no numero de commits, e no numero de
arquivos que os dois lados tocaram.

**Ninguem decidiu isso.** As duas prorrogacoes anteriores adiaram a data sem colocar a pergunta, e ela e a
decisao real. Um terceiro adiamento que nao a responda e o mesmo movimento pela terceira vez.

Insumos para decidir, medidos em 2026-08-01:

- as **3 tabelas ja existem em producao** e estao **protegidas**: RLS declarada mais
  `REVOKE ALL FROM PUBLIC, anon, authenticated` nas tres migrations, e a leitura com a chave anon devolve
  `42501 permission denied` nas tres;
- as **5 migrations nao aplicadas** continuam nao aplicadas;
- o `backfillStripeCustomers.mjs` **nunca foi executado**;
- o aviso do `check:migrations` continua saindo, e desde 2026-08-01 o guard **tambem verifica a RLS delas**
  (direcao inversa), entao a lacuna de seguranca que a demora abria esta fechada independentemente da branch.

#### Prazo anterior: 2026-08-01

**Adiado de 2026-07-31 para 2026-08-01 em 2026-07-29**, por ato deliberado e não
por esquecimento, que é a única forma de mudança de prazo que este documento
aceita.

Os dois motivos, medidos:

1. **A branch afastou.** Quando o prazo foi marcado ela estava 10 commits atrás da
   `main`; com o trabalho de design da home ela ficou 15. O rebase, o CI verde, o
   merge-deploy, as 5 migrations aplicadas à mão, o `check:migrations`, a decisão
   sobre o `backfillStripeCustomers.mjs` e o smoke não cabem em dois dias com
   folga para dar errado.
2. **Conflito de janela.** O deploy visual da home ficou marcado para
   **2026-07-30, 05h-09h BRT**, e duas dessas migrations (`schedule_payment_recovery`
   mexe em `cron.schedule`, `add_episodio` altera tabela existente) pedem a mesma
   janela. Subir as duas coisas no mesmo dia deixaria dois suspeitos para qualquer
   problema, em vez de um.

Se ESTA data também não for cumprida, as saídas continuam sendo as mesmas duas, e
nenhuma delas é o silêncio:

- **Adiar com data nova escrita aqui**, no mesmo commit que muda a data.
- **Transformar o aviso em erro temporário** no `check:migrations`, com a data de
  remoção no comentário, para que ele volte a ser um sinal em vez de ruído.

### 2.4. Ordem de deploy quando ela subir

Vale repetir aqui porque o merge da billing dispara deploy automático (seção 4):

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

## 3. Achado de design não endereçado: a sombra flat não é universal

Medido em 2026-07-28 durante a auditoria da home, em Chrome real.

O CLAUDE.md lista `shadow-[5px_5px_0_#0f172a]` como sombra flat do design
system, mas o `box-shadow` computado dos cards principais da home vem `none` ou
totalmente transparente. A sombra aparece em badges e pills (o badge do
`DorSolucao` usa `shadow-[3px_3px_0_#0f172a]`), não nos cards.

**Decisão de 2026-07-28: NÃO retro-aplicar.** O achado é real, mas padronizar
sombra em toda a home é tarefa própria, com seu próprio risco visual, e
misturá-la ao trabalho de fundo decorado faria o diff contar duas histórias.
Fica registrado aqui para não se perder.

Na mesma linha, e pelo mesmo motivo, ficaram fora do escopo daquele trabalho:

- **retrofit do container canônico** nas seções que não o wrapper novo;
- **conversão dos sítios de `viewport={{ margin: "-100px" }}`** para o preset do
  wrapper novo.

---

## 3-bis. Achados medidos em 2026-07-28, registrados sem correção

### a) CLS residual de 0.015 no desktop, por volta de 3.8s

Um `span.relative.isolate.inline-block.px-3.py-1` dentro do Hero produz uma
entrada de `layout-shift` de 0.01504 em 1440px, cerca de 3.8s depois da carga.
**Aparece nos dois modos de movimento**, inclusive com `prefers-reduced-motion:
reduce`, então não é animação de entrada. Também aparece no código anterior ao
contador do hero (medido em 0.01517), o que descarta relação com aquele trabalho.

Suspeita não verificada: troca de fonte, ou alguma alternância no headline.
**Não investigado de propósito**, registrado para não virar achado perdido.

### b) `tracking-[0.18em]` do `SectionLabel` contra `tracking-[0.2em]` da home

`client/src/components/shared/SectionLabel.tsx` renderiza `text-xs font-black
uppercase tracking-[0.18em]`, sem `font-display`. As 9 seções da home que têm
eyebrow usam `font-display text-xs md:text-sm font-black uppercase
tracking-[0.2em]`.

Ao adotar o `SectionLabel` na home, a tipografia da home é passada por
`className` para o renderizado continuar igual ao das outras seções. **Unificar
os dois valores em toda a aplicação é decisão separada**, com impacto fora da
home, e não foi tomada aqui.

### c) A reflow da Novidades não pontuava CLS, e isso quase a escondeu

O skeleton de altura fixa da Novidades movia a seção em 98px, e mesmo assim a
métrica de CLS marcava praticamente zero, porque a seção está **abaixo da dobra**
quando o fetch chega, e deslocamento fora do viewport não pontua.

É a mesma classe que o CLAUDE.md cataloga: **um instrumento reportando sucesso
sobre uma superfície menor que a do problema.** O CLS estava certo sobre o que
mede (o que o usuário vê pular na carga) e cego para o que importava aqui (todas
as âncoras abaixo mudando de lugar). Quem olhasse só o CLS concluiria que não
havia nada a corrigir.

A lição prática: para ancoragem e scroll spy a métrica é **estabilidade de
posição das seções**, não CLS. São perguntas diferentes.

### d) Alternativa disponível para o badge do hero: encurtar a frase

**Corrigido em 2026-07-29, mas a alternativa fica registrada.**

A frase do badge é "+N pessoas já encontraram seu caminho", 40 caracteres. Ela
não cabe em uma linha abaixo de 395px (medido pixel a pixel), então nas larguras
estreitas o badge ocupa duas linhas, com a quebra forçada em ponto escolhido
(`<br className="hidden max-[395px]:inline" />`, entre "pessoas" e "já").

**A alternativa que devolveria uma linha só em todas as larguras é encurtar a
copy**, por exemplo "+N já encontraram seu caminho". Foi descartada em 2026-07-29
por decisão editorial: "pessoas" é a palavra que carrega a prova social.

Se a copy mudar depois e passar a caber em 320px, **a única coisa a fazer é
remover o `<br>`**. Nada mais depende dele.

### e) O `check:hero-counter` comparava com uma constante que envelhece

**Corrigido em 2026-07-29**, registrado porque a forma do erro se repete.

O script assumia `HERO_COUNTER_VALUE = "2776"` por padrão e semeava o
`localStorage` com ele, dizendo no comentário que assim não dependia do backend.
**Não era verdade quando o backend responde**: em desenvolvimento o dev server
fala com a API real, o valor volta do servidor e sobrescreve a semente. Em
2026-07-28 a contagem real já era **2922**, e o script reprovou as 26 amostras
por isso, não por defeito da página.

A correção não foi atualizar o número: foi **interceptar a chamada** de
`/api/stats/users-count` e servir um valor conhecido, trocando a asserção
absoluta ("é 2776") pela relacional ("é o que a API devolveu"). Um contador de
intercepções atendidas aborta se a página deixar de chamar o endpoint, para o
teste não passar medindo um número vindo de outro lugar.

Um efeito colateral vale registro, porque é a mesma armadilha em outro lugar: a
cópia invisível que reserva a largura do contador entra no `textContent`, e tanto
o script quanto o teste de unidade passaram a ler o número duplicado
(`"+4.3214.321 pessoas..."`). Os dois leitores agora removem os nós
`aria-hidden` antes de medir, e a remoção mora **no leitor único** de cada um
(`readCounter` e `bodyText`), não em cada asserção.

### f) A Novidades não tem eyebrow, e a ausência é DELIBERADA

Registrado em 2026-07-29 para ninguém "corrigir" isso depois.

As outras seções decoradas da home abrem com um eyebrow (`SectionLabel` em
uppercase com `tracking-[0.2em]`). A **Novidades não tem, e nunca teve**: ela abre
direto no `<h2>Novidades</h2>`.

Os rótulos "Última notícia", "Próximos eventos" e "Dica rápida" que aparecem ali
são dos **cards**, não da seção — quem procurar um eyebrow com um seletor genérico
vai encontrar um deles e concluir errado, que foi o que aconteceu na primeira
auditoria.

**Por que fica assim:** é a seção mais curta do bloco do topo e funciona como
faixa de novidades, não como seção-marco. O `h2` já basta. Adicionar um eyebrow
seria escrever copy nova, e copy é decisão editorial.

### g) `CARD_LABEL` da Novidades sem `font-display`

Os rótulos dos cards usam `text-sm font-black uppercase tracking-[0.2em]`, sem
`font-display`, então renderizam em Plus Jakarta Sans enquanto os eyebrows de
seção renderizam em Space Grotesk.

**Não corrigido de propósito.** Mexer no interior dos cards dessincroniza os
skeletons, que derivam a altura das classes de tipografia dos cards reais (ver
item h). O ganho é pequeno e o risco é de layout.

### h) Resíduo de 22px no card de dica da Novidades

Os três skeletons da Novidades espelham cada um o seu próprio card, e o delta
medido é **0 para notícia, 0 para eventos e 0 ou +22 para a dica**, em 390px. No
desktop os três dão 0.

A origem é sorteio: `DicaCard` escolhe a dica com `Math.random()`, e as dicas têm
comprimentos diferentes. O skeleton reserva 3 linhas, que é a mediana; quando sai
uma de 4 linhas faltam 22px, exatamente uma linha de `text-base leading-snug`.

**Aceito em 2026-07-29.** Zerar exigiria `line-clamp-3` no parágrafo, o que trunca
conteúdo. **Se alguém mexer na tipografia dentro dos cards, os deltas das três
variantes precisam ser remedidos**, porque a altura dos skeletons é derivada
dessas classes.

### i) A alternância A-B-A-B de ProQuemE até TurbineComIA: ACEITA

Decidido em 2026-07-29, depois do trabalho de fundo decorado da home.

Quatro seções seguidas alternam entre exatamente dois tons quase idênticos,
`#f5f3ff` e `#fafaf9`, com delta 10 entre eles:

```
o-que-e-bora-na-tech   #f5f3ff
do-zero-ao-primeiro..  #fafaf9
por-onde-comecar       #f5f3ff
turbine-com-ia         #fafaf9
```

Visto numa coluna comprimida da página inteira, isso lê como padrão mecânico.
**Foi avaliado e mantido**, por três motivos:

1. **Ninguém vê duas bases no mesmo frame.** As quatro seções medem de 1000px a
   1827px de altura, contra uma viewport de 844px no mobile e 900px no desktop. A
   alternância existe no documento, não na tela: para percebê-la é preciso rolar
   por mais de uma tela inteira entre uma base e a seguinte.
2. **Mudar o violet da ProQuemE reintroduziria a emenda #6.** Ela hoje mede delta
   **0** porque a base bate exatamente com o fim do gradiente do LogoLoop
   (`#faf8f4 -> #f5f3ff`, medido). Escolher outro violet para quebrar a
   alternância recria ali um degrau que hoje não existe: troca um problema teórico
   por um visível.
3. **Três das quatro são pré-existentes.** Mapa, PorOndeComecar e TurbineComIA já
   alternavam antes deste trabalho. O que mudou foi a ProQuemE entrar na
   sequência, estendendo-a de 3 para 4. Reordenar bases fora das quatro seções do
   escopo é outro trabalho.

**Aviso de método, e ele vale para qualquer revisão futura de ritmo visual:** a
coluna com a página inteira é **visão de revisor, não de usuário**. Ela comprime
14 mil pixels de altura em uma imagem de dois mil, ou seja, mostra de uma vez algo
que a pessoa percorre em dezenas de segundos. Padrões que saltam ali podem ser
invisíveis no uso real. Reabrir esta decisão olhando um screenshot comprimido é
reabrir com o instrumento errado.

### j) Emendas #2 e #3 em delta 13: aceitas

O bloco do topo passou a alternar `#faf8f4` (Hero) → `#f5f3ff` (Novidades) →
`#faf8f4` (DorSolucao), com delta **13** nas duas fronteiras.

Isso fica **acima da faixa de 0 a 10** em que as demais emendas não deliberadas da
página se encaixam. **É intencional:** essas duas emendas SÃO a alternância que o
trabalho pediu, e reduzi-las para caber em 10 significaria escolher um violet mais
próximo do cream, enfraquecendo justamente o efeito. 13 contra 10 é a mesma ordem
de grandeza, longe das trocas deliberadas de seção (263 a 415).

### k) O `clip` do Puppeteer é coordenada de PÁGINA, não de viewport

Registrado porque o instrumento de medição de emendas vai ser reusado.

**O método correto**, para ler o pixel renderizado nos dois lados de uma
fronteira:

1. calcular o `y` ABSOLUTO da fronteira
   (`getBoundingClientRect().top + window.scrollY`), **remedindo imediatamente
   antes de cada leitura**, porque a página assenta depois da rolagem e as
   coordenadas envelhecem;
2. rolar até a fronteira ficar dentro da viewport, para o browser rasterizar a
   região de verdade;
3. tirar o screenshot com `clip` no `y` **absoluto**, sem subtrair `window.scrollY`;
4. decodificar o pixel com um `<canvas>` dentro da própria página, o que evita
   adicionar biblioteca de imagem ao projeto por causa de uma medição.

**O erro que motivou este registro:** o passo 3 foi escrito subtraindo o
`scrollY`, por analogia errada com coordenada de viewport. As 13 emendas passaram
a ler o mesmo cream do topo do documento.

**Como foi pego:** não pelo instrumento, que reportava números plausíveis, mas por
um valor IMPOSSÍVEL. A emenda #10 é `#fafaf9` contra `slate-950`, preto contra
quase branco, e devolveu **delta 0**. Um número que não pode existir naquela
fronteira. Sem uma emenda de contraste extremo na tabela, o erro teria passado
como resultado.

A lição prática: **toda tabela de medição deve conter pelo menos um caso cujo
valor esperado é conhecido e extremo**, para servir de âncora de sanidade. É o
mesmo princípio das asserções de tamanho de conjunto do `check:migrations`.

### l) Limite latente: o gate do `<br>` do badge do hero envelhece com a contagem

O badge do hero quebra em duas linhas abaixo de 395px, com a quebra forçada num
ponto escolhido por `<br className="hidden max-[395px]:inline" />`.

**Os 395px foram medidos com o contador em 5 caracteres** (`"2.936"`). Quando a
contagem de pessoas passar de **10.000**, o número passa a `"10.000"`, seis
caracteres, a frase fica mais larga e **395 deixa de ser o limite certo**: vai
existir uma faixa de larguras em que a frase não cabe e o `<br>` ainda não entrou,
reproduzindo exatamente a quebra acidental que ele existe para evitar.

É a mesma classe da constante `HERO_COUNTER_VALUE = "2776"` que envelheceu no
`check:hero-counter` (item e): **um número medido uma vez, correto no dia, que
apodrece sozinho conforme o produto cresce**.

**Não corrigido de propósito**, porque a correção honesta não é ajustar 395 para
outro número igualmente perecível, e sim medir a largura da frase em tempo de
execução ou aceitar a quebra natural. Registrado para não ser descoberto por
alguém olhando um badge torto sem entender por quê.

---

## 4. Push para a `main` deploya. Não existe passo manual.

Medido em 2026-07-28, e registrado aqui porque muda o significado de "fazer
merge".

Não há workflow de deploy no `.github/workflows/` (só `ci.yml`), e o
`vercel.json` não tem `ignoreCommand`. O deploy vem das integrações de GitHub da
Vercel e do Railway, que sobem sozinhas a cada push na `main`.

A medição, por endpoint que DECLARA o estado, em amostra única (nunca por
frequência, ver CLAUDE.md):

```bash
curl -s https://api.boranatech.com.br/api/health
# {"status":"ok","env":"production","uptime":36.31,...}
```

`uptime` de 36 segundos logo após o push confirma que o processo tinha acabado
de subir.

**Consequências práticas:**

- `git push origin main` é um deploy de produção. Todo merge para a `main` deve
  ser tratado como tal, inclusive na escolha do horário.
- Não existe janela entre "mergear" e "publicar" para revisar o resultado. A
  revisão tem que acontecer **antes** do merge, na branch.
