# Postmortems de instrumentos de verificação

Este arquivo é a versão canônica das lições sobre instrumentos que verificam. O `CLAUDE.md`
carrega apenas a regra de uma linha e aponta para cá. Se uma lição aparecer nos dois lugares
com redação diferente, esta aqui é a que vale.

<a id="escopo-derivado-por-parser"></a>

## Instrumento cujo escopo é derivado por um parser

**Instrumento de verificação cujo escopo é derivado por um parser que pode sub-casar em silêncio sempre falha PASSANDO.** Lista escrita à mão é só o caso degenerado; regex, janela de contexto e casamento de padrão são o mesmo mecanismo. Instâncias nesta base, **sem numeral de propósito**: uma contagem escrita à mão nesta frase seria ela mesma um caso da classe que o parágrafo documenta, e ficaria desatualizada no primeiro esquecimento. A lista cresce, o total não é afirmado aqui.

- a migration que dependia de alguém lembrar de aplicar;
- o regex do `checkMigrationsApplied` que enxergava 38 de 72 tabelas;
- o pre-commit com lista de arquivos, que liberou árvore vermelha;
- a janela de 4000 caracteres que classificou duas RPC reais como trigger e as tirou da verificação;
- o `stripSqlComments` que casou o `/*` de `/api/cron/*` com o `*/` de um cron `*/6` e apagou 3663 caracteres de SQL real;
- o parser que aplicava todos os `CREATE` antes de todos os `DROP`, desfazendo declaração de quem dropa e recria;
- o `contarLinhas` devolvendo -1: erro de rede virou "protegida", e falha de infra foi contada como sucesso de segurança;
- as 35 tabelas reportadas como cobertas por policy quando estavam cobertas por privilégio, um veredito certo sobre o efeito e errado sobre o mecanismo;
- o `env -i`, que para provar "a suíte roda sem ambiente" limpou as variáveis do shell em vez do arquivo `.env` do disco, que o `dotenv` lê direto, e devolveu 549 testes verdes sobre uma condição que nunca existiu;
- o **blip de disponibilidade** usado para detectar quando o Railway terminou um deploy: o Railway troca sem downtime, e as 150 amostras deram 200 sem uma exceção. O instrumento não teria funcionado nem num dia limpo, e o silêncio dele era indistinguível de "ainda não subiu";
- o **checklist de smoke test que morava só na conversa**: sumiu numa compactação de contexto, no meio do deploy que ele existia para validar, e a reconstrução de memória perdeu 3 dos 11 passos, justamente os três dos bugs que motivaram a Fase 1. É a mesma classe com outro suporte: o escopo foi derivado de um armazenamento que encolhe em silêncio, e o que sobrou parecia uma lista completa. **Contramedida: artefato de release é documento versionado no repositório (`docs/smoke-linkedin.md`), nunca mensagem de chat.** Serve para qualquer artefato crítico: se não está em arquivo commitado, não existe.

- o **`check:migrations` verificando função por NOME**: a migration `20260713160000_split_roadmap_intake_chat_quota.sql` só fazia `create or replace` do corpo de `get_ai_usage_today`, e nunca foi aplicada. A função já existia, então o guard ficou **verde por 17 dias** sobre um banco em que a mudança não estava lá, e cada turno do chat de intake do Roadmap com IA cobrou uma vaga a mais da cota diária de quem usava. Existência não implica conteúdo: o objeto estava lá, o comportamento não. **Contramedida em `scripts/checkMigrationsApplied.mts`, seção "ASSERÇÕES COMPORTAMENTAIS": a lista canônica virou uma função (`ai_usage_excluded_tools()`) e o guard AFIRMA O CONTEÚDO dela, por igualdade de conjunto, não a existência.** Comparar o texto do corpo foi descartado de propósito: o Postgres normaliza a definição e os arquivos usam `$$` e `$func$` aninhados, então a comparação textual gera alarme falso, e guard ruidoso é guard que alguém desliga.

- o **`git status` cego para `.claude/` inteiro**: o `.gitignore` trazia a linha `.claude/`, e como o git não desce em diretório excluído, arquivo novo ali nunca aparecia no `status`. As três rules escritas em 2026-08-06 não foram listadas, e um commit feito pelo caminho normal teria saído sem elas, com o `CLAUDE.md` apontando para arquivos inexistentes e a árvore parecendo limpa. Este é o primeiro da lista **pego antes do dano**, e o motivo é a mesma família do CI sem `.env`: a precondição do commit não perguntava "o status está limpo?", que é a pergunta que o instrumento cego responde bem, e sim **afirmava o conjunto exato de arquivos esperados no índice**, então a ausência apareceu como diferença em vez de silêncio. **Contramedida: o `.gitignore` passou a ignorar só `.claude/settings.local.json`**, e a negação `!.claude/rules/` embaixo de `.claude/` foi descartada de propósito, porque é no-op: negação não alcança conteúdo de diretório já excluído, e o fix pareceria aplicado com o status continuando cego.

Nenhum deles acusou nada: todos reportaram sucesso sobre uma superfície menor, e o único que foi pego a tempo foi pego por uma verificação de fora dele.

<a id="afirmar-o-total"></a>

## Afirmar o TOTAL, não só a pertinência

**Contramedida que funcionou nas três vezes em que foi aplicada: afirmar o TOTAL, não só a pertinência.** Um guard que responde "os N que eu conheço estão lá" é inútil; um que responde "existem exatamente N, e são estes" quebra quando o conjunto muda. Na prática: (1) contar as ocorrências amplas e comparar com as que o parser leu, abortando na diferença; (2) asserção de tamanho do conjunto (`EXPECTED_TABLE_COUNT`, `EXPECTED_FUNCTION_COUNT`, `EXPECTED_RLS_COUNT`), cuja alteração é ato deliberado no commit da migration; (3) descoberta a partir da fonte com **aborto em item não classificado**, como em `scripts/mutateLinkedinThresholds.mjs`, onde todo sítio numérico precisa estar em uma de duas listas e um sítio novo derruba a execução.

<a id="ausencia-de-arquivo"></a>

## Reproduzir ausência de ARQUIVO renomeando o arquivo

**Reproduzir ausência de ARQUIVO renomeando o arquivo, nunca limpando variável.** Contramedida da sétima instância, e ela generaliza: quando a afirmação é "roda sem X", o teste precisa remover X, não algo correlacionado com X. `env -i` limpa o ambiente do shell, mas `server/lib/env.ts` chama `config()` do `dotenv`, que lê `.env` do disco e não depende do shell; a checagem válida é `mv .env .env.probe-bak`, rodar, restaurar, e conferir o md5 depois. Detalhe em `docs/harness-fidelidade-instrumento.md`, seção 2-bis.

Consequência prática para quem escreve teste: **teste que lê `env.*` precisa mockar `./env`**, porque no CI não existe arquivo `.env` e o job `qualidade` não recebe secret nenhum.

<a id="nao-simular-a-condicao"></a>

## O instrumento que não simula a condição é o que pega

**O instrumento que não simula a condição é o que pega.** Ponto positivo a copiar, não só erro a evitar: o CI é o primeiro instrumento desta série sem o defeito da classe, e o motivo é estrutural. Ele não _simula_ a ausência do `.env`, ele simplesmente **não tem** `.env` (o job `qualidade` não recebe secret nenhum). Não existe parser meu decidindo o escopo, então não existe escopo para encolher em silêncio. Foi ele quem pegou o que o `env -i` deixou passar, no primeiro push. Sempre que der para trocar uma simulação por um ambiente que genuinamente não tem a coisa, trocar.

<a id="verificar-nos-dois-sentidos"></a>

## Verificar nos dois sentidos

**Verificar nos dois sentidos.** "O que declarei existe?" não é a mesma pergunta que "o que existe está declarado?". A segunda é o que separa backup físico de reconstrução a partir das migrations, que é o que um ambiente de ensaio faz.
