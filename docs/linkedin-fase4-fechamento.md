# Analisador de LinkedIn, Fase 4: fechamento e sequencia de deploy

Continuacao de `docs/linkedin-fase3-fechamento.md`. **A sequencia de deploy da
secao 5 deste arquivo substitui a daquele** como fonte operacional; o resto
daquele doc (historico da Fase 3, decisoes anteriores) segue valendo e nao esta
duplicado aqui.

Branch `feat/linkedin-fase-4`, base `1e5f60fc`, 16 commits.

---

## 1. Os lotes reais

Os PAREs fazem parte da historia, e nao sao rodape: em tres pontos a
investigacao apontou um defeito que a re-medicao nao encontrou, e o trabalho foi
provar isso em vez de escrever codigo.

| Lote   | Commits                                        | O que aconteceu                                                                                                                                                                                                                                                                                                                                   |
| ------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | `359b959d`, `c94100a3`, `07db3c40`, `b47c78a4` | **PARE inicial e remedicao.** A conta de pior caso do relatorio de investigacao contava um round-trip de banco depois da IA; o codigo faz quatro (cinco no degradado). O pior caso real era 150,4s contra um teto de client de 120s: **margem negativa de 30,4s**. Prazo proprio de banco (5s), teto do client derivado, recuperacao pos-timeout. |
| **2**  | `d97f4c0c`, `e01bf301`                         | Serializacao por usuario na RPC de reserva, com 409 nomeado e tela propria. A migration foi escrita e **nao aplicada**.                                                                                                                                                                                                                           |
| **3**  | `f3cde30e`, `1a6e781c`                         | **PARE de item**: `server/routes/ai.ts` (stream) ja derivava custo de tokens medidos, ao contrario do que o achado 3 dizia. Os outros tres call sites do arquivo, mais `agent.ts`, foram corrigidos. Regua do fallback calibrada de 4 para 2,2.                                                                                                   |
| **3b** | `e484cfae`                                     | `usage` repassado pelos helpers que o descartavam.                                                                                                                                                                                                                                                                                                |
| **3c** | `880319ec`                                     | Quinto call site de custo (geracao do plano de carreira) saindo de zero.                                                                                                                                                                                                                                                                          |
| **3d** | `e9e2750a`                                     | Seis call sites de custo em `interview.ts`. A familia de custo fecha.                                                                                                                                                                                                                                                                             |
| **4**  | `e46207ea`                                     | **DOIS PAREs de item.** Rate limit: ja existe limiter global cobrindo todas as rotas do analisador (180 req/min por usuario). Campo livre sem teto: **nao existe**, todo campo de texto ja tinha `.max()`. Sobrou o teto de corpo por rota, que foi feito.                                                                                        |
| **5**  | `d63436dd`, `cd3608f2`, `648c6855`, `4fa81ab1` | Confirmacao de reserva por identidade, consolidacao das auxiliares de uso, escopo do guard (**PARE parcial**: ja corrigido no lote 2, faltava a prova) e caminho JSONB no duble.                                                                                                                                                                  |

**Nota sobre os PAREs de rate limit e teto de corpo**: o proprio relatorio de
investigacao ja listava, na secao "Ja coberto, com prova", que o rate limit global
cobre o analisador e que o teto de corpo de 2 MB existia. A Parte C do plano
pediu esses itens mesmo assim; a re-medicao os devolveu ao lugar.

---

## 2. Politicas vigentes

1. **Prazo de banco no caminho da analise.** Cada round-trip tem prazo proprio de
   5s (`PRAZO_BANCO_ANALISE_MS`), separado do teto global de 15s do
   `supabaseAdmin`, que nao mudou para o resto da plataforma. A lista tipada
   `CALL_SITES_BANCO_ANALISE` (`shared/linkedin/prazos.ts`) enumera os cinco
   round-trips: **um round-trip novo nao compila sem entrar nela**, e entrar
   aumenta a conta do pior caso automaticamente.

2. **Teto do client DERIVADO.** `TETO_CLIENT_MS` = pior caso do servidor
   (115.400ms, caminho degradado incluido) + folga nomeada de 15.000ms =
   **130.400ms**. Nenhum literal solto: `client/src/lib/linkedinClient.ts` importa
   a constante, e um teste trava que ele nao volte a escrever numero proprio.

3. **Recuperacao pos-timeout.** O estado de timeout deixou de sugerir "tente de
   novo" como primeira acao e passou a apontar o historico
   (`GET /api/linkedin/analyses`), que **nao custa IA nem cota**. A acao de
   analisar continua disponivel como secundaria.

4. **Serializacao por usuario.** A RPC de reserva ganhou uma sobrecarga de quatro
   argumentos que, dentro do advisory lock ja existente, recusa quando ha reserva
   pendente do mesmo par (usuario, ferramenta) dentro da janela. A rota responde
   **409 `analise_em_andamento`**, distinto do 429 de cota.

5. **Custo derivado dos tokens medidos, no escritor.** `logAiUsage` calcula o
   custo a partir da uniao discriminada `FonteDoCusto`. Os tokens so entram por
   dentro da variante que tambem produz o custo, entao **os campos da linha nao
   tem como discordar**: nao existe forma de dizer "token medido com custo de
   caractere".

6. **Fallback por caracteres calibrado e datado.** `CHARS_PER_TOKEN` foi de 4 para
   **2,2** (medido: 9.097 caracteres viraram 4.130 tokens reais), com a data e a
   origem no comentario. Continua sendo estimativa declarada, e so governa as
   rotas em que nao ha `usage`.

7. **`usage` somado ANTES de qualquer reprova nossa.** Uma tentativa que a OpenAI
   respondeu e que nos reprovamos (JSON invalido, schema, coerencia) foi cobrada
   do mesmo jeito. **Custo e o que o fornecedor cobrou**, nao o que aproveitamos.

8. **Confirmacao de reserva por identidade.** `logAiUsage` confirma somente a
   reserva daquela requisicao (`reservationId`). Fim do sequestro (requisicao que
   falha fechando reserva alheia) e da troca de linhas (duas concorrentes
   terminando fora de ordem e gravando uma nos dados da outra).

9. **Teto de corpo por rota**, derivado dos `.max()` do zod: 95.348 bytes na
   analise, 4.096 nas rotas menores, contra os 2 MB do global, que nao mudou. O
   teto fica acima do maior corpo que o zod aceita, entao quem exagera continua
   recebendo o 400 que explica o problema, e nao um 413.

---

## 3. Limitacoes conhecidas

1. **Residuo raro ao quadrado.** Timeout do client empilhado com falha da
   persistencia fail-soft: a analise e cobrada, entregue a ninguem e nao entra no
   historico. As duas condicoes juntas sao raras, e a recuperacao do lote 1 nao
   alcanca este caso porque nao ha o que recuperar.

2. **Modo degradado da reserva sem checagem best-effort.** Quando a RPC atomica
   esta fora, a serializacao some e a janela volta a ser a de antes do lote 2.
   Medido e nao feito: fechar exigiria um round-trip novo, que por construcao
   (`CALL_SITES_BANCO_ANALISE`) obriga a refazer a derivacao do teto do client.

3. **`GET /analyses/:id/improvements` muta estado.** Ele cria revisao via RPC, ou
   seja um GET que escreve: preflight, prefetch ou retry automatico criam
   revisao. E desenho de contrato do checklist (a revisao fecha uma corrida
   documentada); mudar exige repensar o protocolo do progresso.

4. **413 rotulado `internal_error` na plataforma inteira.** O
   `PayloadTooLargeError` do body-parser tem `code` indefinido, e o handler central
   cai em `internal_error`. Traduzido **so** no caminho do analisador. Candidato a
   lote proprio global, de poucas linhas.

5. **TTS da ElevenLabs e o UNICO ponto de custo nao medido.** Outro fornecedor,
   outra modalidade, sem tokens comparaveis e sem preco cadastrado. O guard em
   `server/lib/aiCustoIntegro.test.ts` afirma o conjunto e o numero
   (`{server/routes/interview.ts}`, 1): se subir, alguem acrescentou um call site
   com a forma do defeito.

6. **Nao existe harness de rota para o interview.** As tres funcoes de chamada
   estao cobertas de ponta a ponta, mas os ramos de erro das seis rotas nunca
   foram exercitados assim: elas exigem sessao e turnos no banco.

7. **Modo legado na confirmacao de reserva.** `reservationId` ausente ainda
   procura a reserva mais antiga do par, para os 43 call sites que nunca passaram
   por uma reserva. Nenhum deles pode sequestrar hoje (as ferramentas que os usam
   nao reservam), mas a compatibilidade e para extinguir: **call site novo nasce
   com id ou com `null` explicito**.

8. **Duplicacao remanescente das auxiliares de uso: ZERO.** Conferido: so
   `server/lib/aiUsoMedido.ts` define `UsoAcumulado`, `somarUso` e
   `usoDoContrato`. As quatro copias e as duas de `somarUsoDeChamadas` foram
   consolidadas no lote 5.

---

## 4. Fila da Ana

1. **Politica de cache e o N de dias.** A conta E2 do relatorio de investigacao
   tem as variaveis para plugar volume real: `U` (usuarios ativos no mes), `A`
   (analises por usuario), `R` (fracao que gasta a segunda tentativa) e `D`
   (fracao de reanalise do MESMO texto, as candidatas a cache). Medido: entrada
   tipica de cerca de 17.200 caracteres e saida de cerca de 2.000, o que a 2,2
   chars/token da 7.818 tokens de entrada e 909 de saida.

2. **Limites de produto do PDF**: paginas e tamanho de arquivo. A Fase 4 nao
   tocou em nenhum dos dois de proposito (os tetos que ela criou sao tecnicos).

3. **Conferencia dos 180 req/min** como teto de plataforma
   (`RATE_LIMIT_MAX_REQUESTS`, default no `env`). Ele cobre todas as rotas do
   analisador e nunca foi calibrado com dado.

4. **Preco da ElevenLabs**, com procedencia e data, mais a decisao de produto
   sobre servico sem fatura aparecer no painel.

5. **Conferencia humana dos precos da OpenAI** e atualizacao do comentario datado
   em `MODEL_PRICING`, que hoje diz "ULTIMA CONFERENCIA HUMANA: nunca registrada".
   A conta do item 1 depende desses numeros.

6. **Unique constraint em `linkedin_analyses`**: registrada e nao feita. A chave
   obvia, `(user_id, texto_hash)`, esta errada por dois motivos: reanalisar o
   mesmo perfil depois de aplicar melhorias e uso legitimo e desejado, e o hash
   nao muda quando so o formulario de contexto muda.

7. **AS QUATRO NOTAS DE DESCONTINUIDADE DO PAINEL DE CUSTO.** Elas somam, e a
   instrucao vale para as quatro: **nao comparar semanas que atravessam o
   deploy**. Um salto na serie nao e aumento de uso nem de preco.

   | Nota                        | Efeito                                                                                                                                                                   |
   | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | Fallback calibrado          | quatro rotas passam a reportar cerca de **1,82 vez** (4 dividido por 2,2) o valor anterior                                                                               |
   | Rotas migradas para medicao | as mesmas quatro saem da estimativa para os tokens cobrados, e passam a incluir as tentativas reprovadas                                                                 |
   | Plano de carreira           | sai de **zero** para valor: a chamada mais cara da rota aparecia custando nada                                                                                           |
   | Entrevista                  | sai de **zero** para valor em **seis** pontos (sessao, turno, fechamento, dica, traducao). Tende a ser o maior salto: mais chamadas por sessao e teto de tres tentativas |

   Linhas historicas ficam como estao. Cada serie so volta a ser comparavel a
   partir da primeira semana inteira depois do deploy.

---

## 5. Sequencia de deploy

**Esta secao substitui a do doc da Fase 3 como fonte operacional.**

1. **Push apos o "pode publicar"** da Ana. Fast-forward, conferido com
   `git rev-list --count feat/linkedin-fase-4..origin/main` igual a 0.
2. **CI verde no SHA exato** que sera publicado.
3. **Aplicar as CINCO migrations pendentes a mao no SQL Editor**, na ordem
   cronologica:

   | #   | Arquivo                                                   |
   | --- | --------------------------------------------------------- |
   | 1   | `20260815120000_linkedin_progress_nonnegative.sql`        |
   | 2   | `20260815130000_linkedin_progress_revision.sql`           |
   | 3   | `20260821120000_add_attempt_details_to_ai_usage_logs.sql` |
   | 4   | `20260821120100_index_linkedin_analyses_created_at.sql`   |
   | 5   | `20260821130000_serialize_ai_usage_in_flight.sql`         |

   Todas aditivas, portanto **isentas da janela de migration destrutiva**.

4. **`supabase migration repair --status applied <timestamp>`** para cada um dos
   cinco timestamps, senao o histórico local e o remoto divergem.
5. **`pnpm check:migrations`** contra o banco alvo.
6. **Deploy do backend (Railway) DEPOIS das migrations**, e a razao e dupla:
   - sem a coluna `attempt_details`, o insert de uso **falha**;
   - sem a RPC de quatro argumentos, `checkAiDailyLimit` cai no **modo degradado
     em silencio**: as analises continuam, a serializacao some e a corrida de cota
     reabre. O aviso do Sentry sai no maximo uma vez a cada cinco minutos.
7. **Deploy do frontend (Vercel).**

### Verificacoes pos-deploy

- **`/api/health`** devolvendo o SHA publicado (amostra unica; nao usar loop de
  requisicoes, ver o doc da Fase 3);
- **serializacao ativa**: duas submissoes rapidas do mesmo usuario, e a segunda
  responde **409 `analise_em_andamento`** com a tela propria;
- **funil no PostHog** recebendo os desfechos novos, `analise_em_andamento`
  inclusive;
- **painel de custo** com as linhas novas: entrevista e plano de carreira deixando
  de aparecer com zero.

### Janela conhecida

O deploy nao e atomico: a Vercel costuma terminar antes da Railway, e ha 1 a 3
minutos com **frontend novo contra backend antigo**. Nenhum campo novo de
resposta foi introduzido nesta fase, entao nao ha o que degradar. O que muda
nessa janela e o teto de aborto do client: o bundle novo espera 130,4s contra um
backend cujo pior caso ainda e 150,4s, ou seja **a margem volta a ser negativa ate
a Railway subir**, exatamente como era antes da fase. Nao piora nada; so nao
melhora ainda.

**Teste manual do checklist de melhorias exige as migrations aplicadas.** Sem as
duas de progresso, a rota devolve 503 `progress_unavailable` e o checklist some,
o que e degradacao correta e nao bug.

---

## 6. Inventario `TODO(Ana)`

Nos 26 arquivos de producao tocados pela fase ha **133** marcadores `TODO(Ana)`.
A grande maioria e de fases anteriores (revisoes de copy de rota inteira). **Seis
nasceram nesta fase**, e sao os que a sessao de aprovacao visual precisa cobrir:

| Arquivo, linha                                         | O que revisar                                           |
| ------------------------------------------------------ | ------------------------------------------------------- |
| `client/src/components/linkedin/LinkedinStates.tsx:55` | copy do estado de timeout e da busca no historico       |
| `client/src/components/linkedin/LinkedinStates.tsx:79` | copy do estado de analise ja em andamento (409)         |
| `server/routes/linkedin.ts:239`                        | mensagem de analise ja em andamento (409), corpo da API |
| `server/lib/linkedinCorpo.ts:119`                      | mensagem de corpo grande demais (413)                   |
| `server/lib/linkedinCorpo.ts:70`                       | calibracao do teto tecnico de corpo da analise          |
| `server/lib/linkedinCorpo.ts:83`                       | calibracao do teto tecnico de corpo das rotas menores   |

Os dois ultimos sao numero, nao copy: so precisam de revisao se o uso real mudar.

Das quatro de copy, **duas sao lidas por usuario de verdade** (as de
`LinkedinStates.tsx`). A do 413 e praticamente inalcancavel (o teto fica acima do
maior corpo que o zod aceita) e a do 409 no servidor nao chega a ser exibida: o
cliente traduz o status antes.

O inventario completo dos 133 esta no relatorio do fechamento, fora do
repositorio.
