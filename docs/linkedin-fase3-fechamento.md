# Fase 3 do Analisador de LinkedIn: fechamento

Escrito em 2026-08-21, no fim do lote 5. Registra o que a fase mudou, que
politicas ficam vigentes, o que ficou de fora sabendo que ficou, e a sequencia
de deploy.

A Fase 1 tratou do deterministico (parser, checks, nota). A Fase 2 tratou do
qualitativo (o que a IA escreve e o que a plataforma aceita publicar em nome do
usuario). Esta fase tratou de **honestidade e observabilidade**: o que a
interface AFIRMA sobre o que a plataforma decidiu, e o que da para medir depois.

Contexto das fases anteriores, sem duplicar aqui:
`docs/linkedin-fase2-fechamento.md` e `docs/linkedin-limitacoes-parser.md`.

## 1. Os lotes

| Lote | Commits                            | O que mudou                                                                                                                                          |
| ---- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `49cc78bd`, `bf79dae3`             | Procedencia por campo no payload (origem `modelo`, `fallback`, `sem_modelo`, contagens de sugestao) e as notas de entrega conservadora na interface. |
| 2    | `38c79f9e`                         | Nota parcial sinalizada e criterio PENDENTE distinto de REPROVADO na interface.                                                                      |
| 2b   | `e31db077`                         | Constantes de preco do modelo datadas, com URL da fonte no comentario.                                                                               |
| 3    | `13feb359`, `6fcbb78a`             | Privacidade do lado do servidor: texto do usuario fora do log e do Sentry, com contexto seguro e teste permanente anti-vazamento.                    |
| 4    | `e5ad3a10`, `9a5399a6`             | Legibilidade validada ANTES da reserva de cota (`unreadable_text`), e os estados de falha da entrada de PDF nomeados um a um na interface.           |
| 5    | `7b93ac25`, `940837ab`, `a30c5ed8` | Funil do analisador instrumentado sem texto de usuario; resumo de violacoes de lastro persistido por analise; painel de contagens no admin.          |
| 6    | `41ac7c72`, `c0c1ef5f`             | Detalhe por tentativa em coluna estruturada (`ai_usage_logs.attempt_details`), e indice de janela em `linkedin_analyses`.                            |

### Os PAREs, que fazem parte da historia

Dois lotes pararam antes de implementar, e as duas paradas mudaram o que foi
entregue. Ficam registradas porque a premissa que caiu pode voltar a parecer
verdadeira para quem ler o codigo depois.

1. **A premissa do warm empty caiu.** O lote 4 partia de "PDF escaneado chega ao
   atalho caloroso e consome a analise diaria". Medido, os tres elos supostos
   abertos ja estavam fechados: a extracao barra o escaneado no navegador
   (`too_little_text`, 0 caractere contra `MIN_TEXT_CHARS = 200`), texto
   ilegivel nunca alcanca o warm empty (`analyzeLinkedin` lanca antes de
   `quaseVazio` ser avaliado), e a cota nao era cobrada (linha `error` nao ocupa
   vaga). Implementar por cima teria criado protecao para um caminho que nao
   existia.

2. **A troca de grandeza foi autorizada no lugar de uma constante nova.** O
   mesmo lote pedia um limiar de caracteres para separar lixo de perfil.
   Medido, **nenhum numero separa os conjuntos**: o perfil escasso legitimo do
   golden `perfil-vazio-sem-ia` tem 211 caracteres nao-whitespace, e os tres
   lixos medidos tem 252, 288 e 960. Qualquer teto que barrasse o lixo barraria
   o perfil legitimo junto. O criterio virou `parseLinkedinText(...).usable`,
   fonte unica que ja existia, e o defeito real (de ORDENACAO, nao de limiar)
   foi corrigido movendo a checagem para antes da reserva.

## 2. Politicas vigentes

| Assunto                       | Politica                                                                                                                                                                                                                                                                      | Onde                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Procedencia por campo         | O payload declara a ORIGEM de cada campo entregue e as contagens de sugestao. Ausencia e ilegibilidade viram estados NOMEADOS (`desconhecida`, `indisponivel`), nunca o valor mais proximo. A interface diz o que a plataforma decidiu em vez de deixar o usuario inferir.    | `readQualitative.ts`, `ProcedenciaNota.tsx`                 |
| Nota parcial e pendencia      | Nota incompleta e sinalizada como parcial. Criterio PENDENTE (nao pudemos avaliar) e visualmente distinto de REPROVADO (avaliamos e nao passou), porque pedem acoes opostas.                                                                                                  | `NotaParcial.tsx`, `SectionReport.tsx`                      |
| Legibilidade antes da reserva | A rota recusa texto ilegivel com `unreadable_text` ENTRE a validacao do zod e o `checkAiDailyLimit`. O criterio e `parseLinkedinText(...).usable`, sem nenhuma constante numerica nova. A guarda dentro de `analyzeLinkedin` fica como invariante, para os outros chamadores. | `routes/linkedin.ts`, `linkedinAnalyze.ts`                  |
| Estados da entrada de PDF     | Seis estados nomeados (`wrong_type`, `too_large`, `too_little_text`, `senha_protegido`, `pdf_invalido`, `erro_desconhecido`), classificados pelo `name` real da excecao da pdfjs. Cada um tem mensagem propria, e a totalidade e afirmada por igualdade de conjunto.          | `pdfExtract.ts`, `PDF_ERROR_COPY` em `LinkedinAnalisar.tsx` |
| Telemetria sem texto          | Nenhum evento carrega texto do usuario, nome de arquivo, headline, prompt ou resposta do modelo. So enums de uniao fechada, booleans e contagens. A mensagem de erro do servidor e reduzida a um valor de conjunto fechado antes de virar property.                           | `analytics.ts`, `LinkedinTelemetriaSemTexto.test.tsx`       |
| Privacidade no servidor       | Texto do usuario fora do stdout e do Sentry, por um conversor unico usado nos dois destinos. Teste permanente com marcadores e varredura recursiva.                                                                                                                           | `linkedinObservabilidade.ts`, `linkedinLogSemTexto.test.ts` |
| Resumo de violacoes           | Nasce da lista COMPLETA e deterministica, antes da amostragem do Sentry, e sai nos dois ramos de retorno. Os 15 goldens congelam o resumo e a lista, e um teste afirma que um e a agregacao do outro.                                                                         | `lastro.ts`, `linkedinAnalyze.ts`, `lastroResumo.test.ts`   |
| Denominador do painel         | O agregado declara `comResumo` e `semResumo`. Analise anterior ao resumo NAO conta como zero violacao: ela sai do denominador e o card diz quantas foram. "Medi e deu zero" e "nao medi" nunca compartilham tela.                                                             | `agregarResumos`, `LinkedinLastroDashboard.tsx`             |
| Detalhe por tentativa         | Array integro em `ai_usage_logs.attempt_details` (jsonb), com desfecho classificado e tokens medidos ou o estado nomeado de usage indisponivel. `error_message` volta a carregar SOMENTE a mensagem, sem teto artificial. Coluna nula le como estado nomeado, nunca `[]`.     | `aiUsage.ts`, `lerDetalheDeTentativas`                      |

## 3. Limitacoes registradas

1. **Granularidade do desfecho na telemetria para no que o cliente distingue.**
   A rota tem mais codigos do que o evento (`unreadable_text` e
   `unreadable_profile` sao dois; `analysis_truncated` e `upstream_error`
   tambem), mas `linkedinClient.ts` classifica por STATUS HTTP antes de ler o
   corpo, e os pares colapsam antes de chegar la. Instrumentar uma distincao que
   o cliente nao possui daria uma property sempre com o mesmo valor, o que e
   pior que nao ter: pareceria medicao. Separar passa por `linkedinClient`.

2. **`invalid_request` unico do zod.** A rota devolve o mesmo `400
invalid_request`, com a mesma frase, para qualquer falha do schema, incluindo
   o estouro do `max(12_000)` de `profileText`. O cliente entao mostra "Confira
   os campos do formulario", que nao tem relacao com tamanho. Melhorar a
   mensagem exige o SERVIDOR discriminar o estouro com codigo proprio; mexer so
   no cliente nao muda nada, porque a informacao nao existe no corpo.

3. **`TIPOS_DE_VIOLACAO` e uma segunda lista em runtime da mesma uniao.** Ja
   existe `TODOS_OS_TIPOS_CLASSIFICADOS` em `linkedinObservabilidade.ts`, mas
   `shared/` nao pode importar de `server/`. As duas sao travadas contra a MESMA
   declaracao por teste que le a fonte do disco, entao nao podem divergir em
   silencio. Unificar exige mover a lista canonica para `shared/linkedin/`.

4. **`criarSupabaseDouble` nao entende acesso a JSONB.** O double compartilhado
   valida cada coluna do `select` contra `shared/database.types.ts` e recusa
   `result->qualitative->lastroResumo`, apesar de a sintaxe ser valida e ja rodar
   em producao. Por isso o teste do endpoint de lastro usa stub local, com a
   string de `select` afirmada como contramedida.

5. **O guard `aiUsageTool.test.ts` varre `.test.ts` junto com as rotas.** O
   filtro e `endsWith(".ts")` sobre `server/routes/`, entao um mock de teste
   chamado como a funcao real casa o regex de quatro argumentos pelo parenteses
   de fechamento. Falha ALTO (falso positivo), que e o modo seguro, mas o escopo
   dele deveria excluir testes.

6. **`termo` sem redacao nos tipos de violacao com string livre.** `termo` e o
   unico campo que diz O QUE o modelo fabricou, e e ele que calibra o prompt.
   Uma das familias (`skill_estudo_sem_lastro`) traz string escrita pelo modelo,
   sem tamanho garantido por catalogo, e `MAX_TERMO_CHARS = 80` a limita. Redigir
   o campo mudaria quatro valores congelados em tres goldens
   (`prosa-numeral-inventado`, `prosa-tech-inventada`, `skills-estudo-filtradas`)
   e tres asserts, e **exige autorizacao previa de regravacao de golden**, que
   nao houve.

## 4. Backlog de produto

1. **Limite de paginas e de tamanho do PDF.** Nao ha teto de paginas
   (`pdfExtract.ts` itera `numPages` sem limite); um export de cerca de oito
   paginas ultrapassa o `max(12_000)` do zod. Criar limite e decisao da Ana, e
   se vier deve nascer junto com a mensagem que o explica.
2. **Seletor de periodo no card de lastro.** Hoje a janela e fixa e declarada
   pelo servidor.
3. **Superficie de admin para o detalhe por tentativa.** A coluna existe e e
   consultavel; nao ha tela lendo dela.
4. **Gates de idioma nos campos restantes.**
5. **Conferencia humana dos precos da OpenAI**, com atualizacao do comentario
   datado nas constantes de preco.
6. **Indice em `created_at`**: entregue neste lote. O que resta e observar o
   plano em producao depois de aplicado.

## 5. Sequencia de deploy

A ordem NAO e opcional. A coluna nova torna a migration obrigatoria ANTES do
backend: backend antigo contra banco novo e inofensivo (nao escreve a coluna),
mas backend novo contra banco antigo FALHA no insert, porque o PostgREST recusa
coluna inexistente. Nao ha codigo defensivo para coluna ausente de proposito: a
ordem e o contrato.

1. **Push apos o "pode publicar".** Nada sobe antes.
2. **CI verde no SHA exato** que sera publicado.
3. **Migrations, manualmente no SQL Editor, NESTA ordem:**
   1. `20260815120000_linkedin_progress_nonnegative.sql`
   2. `20260815130000_linkedin_progress_revision.sql`
   3. `20260821120000_add_attempt_details_to_ai_usage_logs.sql`
   4. `20260821120100_index_linkedin_analyses_created_at.sql`
4. **`supabase migration repair --status applied <timestamp>`** para cada um dos
   quatro, para o historico local nao divergir do banco.
5. **`pnpm check:migrations` contra o banco alvo.** Passo obrigatorio: ele existe
   porque a regra "codigo antes da migration" protege contra a migration cedo
   demais, e nao contra a migration que nunca chega.
6. **Deploy do backend (Railway), DEPOIS das migrations.**
7. **Deploy do frontend (Vercel).**
8. **Janela conhecida do bundle antigo.** Vercel e Railway sobem independentes, e
   aba aberta desde antes do deploy segue com o JS anterior ate recarregar. Todo
   campo novo desta fase e aditivo e degrada sozinho; `readQualitative` e
   `readAnalysis` leem payload de qualquer idade.
9. **Smoke test**: `docs/smoke-linkedin.md`.

**Nota operacional**: o teste manual do checklist de progresso exige as
migrations `20260815120000` e `20260815130000` aplicadas no banco onde o teste
roda. Sem elas o checklist responde erro, e o sintoma parece bug de aplicacao.

## 6. Inventario de TODO(Ana), para a sessao de aprovacao visual

82 marcadores nos caminhos do analisador, por arquivo:

| Arquivo                                                   | Qtd | Assunto                                                                   |
| --------------------------------------------------------- | --- | ------------------------------------------------------------------------- |
| `client/src/pages/LinkedinAnalisar.tsx`                   | 25  | Copy do fluxo de entrada, revisao, checklist e as seis mensagens de PDF.  |
| `client/src/components/admin/LinkedinLastroDashboard.tsx` | 14  | Titulo, subtitulo, rotulos dos 12 tipos e os estados vazio, erro e corte. |
| `client/src/lib/pdfExtract.ts`                            | 6   | As seis mensagens neutras, servidas tambem ao analisador de curriculo.    |
| `client/src/components/linkedin/ProcedenciaNota.tsx`      | 5   | Notas de entrega conservadora e de sugestoes removidas.                   |
| `server/routes/linkedin.ts`                               | 4   | Texto ilegivel, limite de uso, analise cortada, falha do progresso.       |
| `client/src/components/linkedin/LinkedinStates.tsx`       | 3   | Limite de uso (503), timeout e falha de rede.                             |
| `server/lib/linkedinAnalyze.ts`                           | 3   | Bloco de quantidades do prompt e os dois textos conservadores.            |
| `shared/linkedin/schema.ts`                               | 1   | Rotulo do nivel pleno.                                                    |
| `server/lib/linkedinChecks.ts`                            | 1   | Detail do Open to Work sem confirmacao.                                   |
| `client/src/lib/linkedinClient.ts`                        | 1   | Mensagem generica de erro do progresso.                                   |

Comando para regerar a lista:

```bash
grep -rn "TODO(Ana)" shared/linkedin server/lib/linkedinAnalyze.ts \
  server/lib/linkedinChecks.ts server/routes/linkedin.ts \
  client/src/lib/pdfExtract.ts client/src/lib/linkedinClient.ts \
  client/src/lib/analytics.ts client/src/lib/headlineAvisoTelemetria.ts \
  client/src/components/linkedin \
  client/src/components/admin/LinkedinLastroDashboard.tsx \
  client/src/pages/LinkedinAnalisar.tsx
```
