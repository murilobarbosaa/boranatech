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

<a id="codigo-morto-ativado"></a>

## Ativar código morto é mudança de comportamento, não conserto de digitação

**Quando um conserto ATIVA código que nunca rodou, o que sobe é código NOVO e sem produção nenhuma atrás dele, por mais antigo que o arquivo seja.** A `registerPreloadErrorGuard` escutava `"vite:preloaderror"`, tudo minúsculo, contra o `"vite:preloadError"` que o Vite despacha. Nome de evento DOM é case-sensitive, então o listener nunca disparou: a guarda era código morto desde que foi escrita. Corrigir a letra parecia conserto de digitação de risco zero. Não era. A linha que passou a rodar junto foi um `event.preventDefault()` incondicional, e ela custou duas issues novas em produção (`BORANATECH-FRONT-P` e `-Q`, 7 eventos, 3 releases).

O mecanismo, que é o que vale guardar: o Vite chama o handler dentro de um `.catch` encadeado (`baseModule().catch(handlePreloadError)`, `config.js:23433`) e só relança se ninguém cancelou (`if (!e$1.defaultPrevented) throw err$2;`, `config.js:23425`). **Cancelar o evento não impede apenas o relance: faz o handler do `.catch` retornar normalmente, e um `.catch` que retorna normalmente RESOLVE a promise, com `undefined`.** Quem recebia esse `undefined` era o `React.lazy`, que lê `.default` dele. E como a promise passou a resolver em vez de rejeitar, o `try/catch` do `lazyWithRetry` parou de rodar: o retry de 300ms, a guarda anti-loop e a queda controlada no ErrorBoundary ficaram desligados. **A guarda desligou o mecanismo que já tratava o problema que ela existia para tratar.**

Duas lições, e a segunda é a que dói:

1. **Dois mecanismos disputando a mesma recuperação é uma corrida, não uma redundância.** A guarda e o `lazyWithRetry` chamavam ambos `reloadOnceForStaleChunk`. O reload até acontecia (`cooldown=false` em 10 de 10 eventos medidos), só não chegava antes do React ler `.default`, porque `location.reload()` não interrompe o JS que já está rodando. Contramedida: dono único. A guarda virou observador puro, sem `preventDefault` e sem reload.

2. **O teste passou a assertar o design defeituoso.** Havia teste da guarda, com controle negativo, escrito com cuidado, e ele afirmava `expect(evento.defaultPrevented).toBe(true)` — ou seja, exigia exatamente a linha que causava o bug. Testar que o código faz o que o código faz não é verificação; o teste que faltava era o do CONTEXTO em que a função roda, e nenhuma das três rodadas que mexeram nesse arquivo exercitou o `.catch` encadeado do Vite. **A pergunta que separa os dois: o teste roda contra uma descrição do ambiente ou contra o ambiente?** Hoje o arquivo tem uma cópia literal do `handlePreloadError` do `config.js` e afirma o desfecho da promise (`rejects.toBe(erro)`), mais um controle negativo que reproduz o comportamento antigo e mostra a promise resolvendo `undefined`. É a mesma família do CI que não tem `.env` em vez de simular a ausência dele.

<a id="escopo-somente-leitura"></a>

## "Somente leitura" é propriedade da FUNÇÃO, não da intenção de quem chama

**Escopo de leitura se julga pelo efeito COMPLETO da função chamada, nunca pelas chamadas que se tem em mente.** Em 2026-08-14, sob uma regra explícita de sessão que proibia escrita em produção, uma verificação do detector de pagamentos órfãos rodou `detectOrphanPayments({ full: true })` e **gravou uma linha em `billing_orphan_payments` às 05:52:27 UTC**. O raciocínio que levou ao erro é curto e vale registrar inteiro: a operação foi classificada como leitura porque as chamadas à Stripe eram `list` e `retrieve`, e essas eram as chamadas que estavam na cabeça de quem rodou. O `persistFindings` no fim da função não estava, e não estava porque ninguém releu a função antes de chamá-la — ela era "o detector", e detectar soa como ler.

A linha não foi apagada, e o motivo é o mesmo princípio: apagar seria uma **segunda** escrita em produção para consertar a primeira. Ela é, aliás, exatamente a linha que o cron gravaria em operação normal, então o dano é zero e o registro do erro fica visível no banco.

Três coisas mudaram:

1. **Contramedida estrutural: o parâmetro `dryRun`.** Antes dele a regra "verificação é somente leitura" era **inverificável**, porque a função não tinha modo de leitura. Regra que depende de quem chama lembrar de não chamar é a mesma família da guarda escrita no call site: some no primeiro esquecimento. `dryRun: true` devolve `dryRun` na resposta de propósito, para `persisted: false` de dry-run não ser confundido com `persisted: false` por falha de escrita — as duas coisas pedem reações opostas.
2. **Verificação em sessão SEMPRE com `dryRun: true`**, sem exceção de "só esta vez para ver".
3. **Persistência é exclusiva do job agendado.** Quem grava é o cron, com `recordCronRun` em volta; execução manual observa.

A generalização: antes de chamar qualquer função sob uma regra de leitura, a pergunta não é "as chamadas que eu vou fazer escrevem?", é **"esta função, do começo ao fim, escreve?"**. E se a resposta exigir ler o corpo dela, ler o corpo dela é parte do custo da verificação.

<a id="replica-nao-e-evidencia"></a>

## Réplica não é evidência de comportamento

**Uma réplica que eu escrevo para "conferir" o que uma função faz é uma segunda implementação, e ela pode divergir da função exatamente no ponto que estou investigando.** Em 2026-08-14 uma investigação afirmou que o card "Assinantes Pro" do admin exibia 96 e 25 e perdia 3 pessoas (as com assinatura **e** concessão de influencer). A evidência era uma query SQL rotulada, no relatório, como "réplica de `tallyProSources`". Ela contava as três categorias como **mutuamente exclusivas**. A função conta os dois ramos como **inclusivos** — `bySubscription = só_assinatura + both` —, e diz isso num comentário logo acima do `return`: "quem tem os dois conta nos DOIS ramos".

O resultado é a assinatura da classe: a réplica **falhou passando**. Produziu números plausíveis (96, 25, 3, 124, e o total até estava certo), fechou uma decomposição contra a Stripe sem resíduo, e inverteu o mecanismo do defeito. O card exibe **99** e **28**; a soma dá 127 contra 124 reais, ou seja, as 3 pessoas são contadas **duas vezes**, não perdidas. A ação corretiva era a mesma (headline = `total` deduplicado), o que é justamente o que torna esse tipo de erro difícil de pegar: o veredito prático não muda, e nada cobra a diferença.

Quem acusou foi um **teste escrito contra a função real** (`server/routes/adminOverviewCards.test.ts`), na primeira execução. Não foi releitura, não foi revisão: foi o único instrumento da rodada que não era uma descrição do código.

Regra: **evidência de comportamento é o código lido ou um teste contra a função real.** Réplica serve para explorar, para achar candidato, para estimar ordem de grandeza. Não serve para afirmar o que o sistema faz, e **não pode ser rotulada com o nome da função** — o rótulo "réplica de X" foi o que transportou a autoridade de X para uma query que não era X. É a mesma família das 35 tabelas reportadas como cobertas por policy quando estavam cobertas por privilégio: veredito certo sobre o efeito, errado sobre o mecanismo.

<a id="guard-nao-ve-rendering"></a>

## Guard estrutural afirma presença e posição, nunca legibilidade

**Duas famílias de instrumento passaram verdes sobre uma tela que estava quebrada para quem a usa.** Na revisão visual da Fase 4 a Ana Julia achou, em minutos, o que 2.735 testes não viram: o contêiner da antiga "Aquisição de usuários" ficou órfão hospedando só um botão e, ao lado de um painel sem teto de altura com ~26 itens, esticou até virar um pill gigante; vinte cards idênticos de "Saída agendada" empilhados; centavos crus impressos num badge ("39333 → 14846"); links "Abrir" que não levavam a lugar nenhum.

Os dois instrumentos que deveriam ter pego, e por que não pegaram:

1. **O teste de inventário da Visão afirma PRESENÇA, não integridade.** Ele pergunta "o bloco X está na tela?" e responde certo: o botão estava lá. Ele não pergunta "o contêiner que sobrou faz sentido sem o conteúdo que saiu?". Foi por isso que, ao remover a Aquisição, o botão **ressuscitou dentro de um contêiner esvaziado** — e o teste comemorou, porque o que ele mede é exatamente o que continuou verdadeiro. É a mesma classe do `git status` cego para `.claude/`: a pergunta que o instrumento faz bem não é a pergunta que importa.

2. **O autocheque de hunks verifica POSIÇÃO, não rendering.** Ele garante que toda edição caiu dentro de uma região mapeada, o que impede editar a aba errada (e impediu, duas vezes). Não tem nada a dizer sobre o resultado visual da edição: um `grid xl:grid-cols-3` com um filho é tão "dentro do mapa" quanto qualquer outra coisa.

**Contramedida, e ela é de PROCESSO porque o defeito é de processo:** rodada que toca UI **não mergeia para `main`**. Entrega na branch e num preview, e o merge acontece na rodada seguinte, depois do OK visual de quem usa a tela. Não existe asserção barata que substitua olhar; o que existe é não deixar o não-olhado chegar em produção.

A consequência arquitetural vale registrar, porque restringe o desenho e não só o calendário: **o preview roda contra a API de PRODUÇÃO**. Então mudança de UI precisa ser client-side ou estritamente aditiva no servidor — o client novo tem de funcionar contra o `/overview` e o `/admin/attention` que já estão no ar. Foi por isso que o agrupamento do painel de atenção nasceu no client, a partir do `itens[]` que a API já devolve, em vez de virar um campo novo no servidor.
