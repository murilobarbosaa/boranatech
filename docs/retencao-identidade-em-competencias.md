# Identidade gravada no campo de competências: decisão de NÃO limpar

**Data da decisão:** 2026-07-31
**Decisão:** os dados já gravados **ficam**. Não haverá limpeza retroativa.
**Quem decide revisar:** ver "Gatilhos de revisão", no fim. Sem um deles, esta decisão não muda.

Este documento existe para responder a quem perguntar daqui a seis meses. Se ele não estivesse
escrito, a decisão de não limpar seria indistinguível de ninguém ter percebido.

---

## O que aconteceu

O analisador de LinkedIn pré-preenchia o campo de competências do formulário com a lista lida da
seção "Principais competências" do PDF, quando a pessoa deixava o campo vazio. Em parte dos perfis,
essa lista vinha contaminada: o corte da coluna lateral passava do fim e engolia o bloco de
identidade que vem logo depois (nome, headline, localização).

O resultado é que o produto **escrevia dado de identidade num campo que a pessoa então submetia como
declaração de competência profissional**, e esse campo ia no prompt enviado à OpenAI.

A causa é a mesma do truncamento de headline: o índice da headline alimenta `inicioDaIdentidade`, e
com o índice errado o corte cai tarde. São dois sintomas do mesmo defeito, não dois defeitos.

## O que existe hoje no banco

- **13 pessoas distintas**, em 16 linhas de `linkedin_analyses` (algumas são reanálises da mesma
  pessoa).
- **Janela: 11 a 30 de julho de 2026.**
- **Natureza do dado:** nome próprio em todas; cidade, estado e país na maioria; headline em
  pedaços em várias; **em três linhas, empregador atual ou instituição de ensino**.
- Em **17** análises o campo `skills` submetido era exatamente o pré-preenchimento não editado, ou
  seja, o conteúdo contaminado **foi enviado à OpenAI** no prompt.

Os valores não são reproduzidos aqui de propósito. Este documento é sobre a decisão, não é uma
segunda cópia do dado.

## As três cópias, e por que limpar uma é pior que não limpar

O mesmo conteúdo está gravado em três lugares diferentes da mesma linha:

1. `input.parseResumo.skillsPdf` — a lista lida do PDF, com o excedente.
2. `input.skills` — o texto do formulário, nas 17 em que o pré-preenchimento foi aceito sem edição.
3. `result.deterministic.perfilDedup` — tudo concatenado de novo, para deduplicar recomendação de
   curso.

A limpeza óbvia (`jsonb_set` cortando `skillsPdf` no terceiro item) resolve **só a primeira**. A
segunda é texto livre que a pessoa pode ter editado, então não dá para cortar por posição sem
arriscar apagar competência que ela mesma escreveu. A terceira é uma string concatenada, sem
estrutura para cortar.

**Limpar só a primeira produziria o pior resultado possível:** o dado continua em duas cópias, e
fica registrado que "a limpeza foi feita". Um `UPDATE` que resolve um terço do problema e cria a
impressão de que resolveu tudo é pior que nenhum, porque a próxima pessoa que olhar vai confiar no
registro em vez de conferir.

## Por que a decisão é guardar

1. **É dado público de perfil.** Nome, cidade e cargo estão no perfil público do LinkedIn de onde o
   PDF saiu, e foram enviados pela própria pessoa. Não é conteúdo sensível em sentido legal.
2. **O erro é de campo semântico, não de conteúdo.** O problema não é o produto ter o nome; é o nome
   ter viajado rotulado como "competência declarada". Apagar a cópia não desfaz o envio já feito.
3. **O conserto está no ar** (`fix/pii-prefill-competencias`, bump para `DETERMINISTIC_VERSION = 6`),
   então não existem casos novos. Limpeza retroativa não previne nada daqui pra frente.
4. **A evidência forense some junto.** Essas 16 linhas são a única amostra real do defeito. Se a
   correção do parser (ainda pendente) precisar ser validada, é contra elas.
5. **O `UPDATE` é destrutivo** e cairia na janela de migration do `CLAUDE.md` (05h-09h, com backup
   `COMPLETED` confirmado), por um ganho que os pontos 1 a 4 já tornam pequeno.

A frase que resume a posição, e ela é desconfortável de propósito:

> **Estava coberto pela política de privacidade e ainda assim estava errado.**

A política fala em processar "textos de currículo, LinkedIn, objetivos de carreira", e o dado veio
do PDF que a pessoa enviou, então o envio está coberto. O que não está coberto é a **expectativa**:
ninguém entende que o próprio nome vai ser reescrito num campo rotulado "competências" que ela vê na
tela e submete. Consentimento e expectativa são coisas diferentes, e a segunda foi violada mesmo com
a primeira em ordem.

## Gatilhos de revisão

Esta decisão **muda** se qualquer um destes acontecer. Sem gatilho escrito, decisão de não agir vira
esquecimento com data.

- **Pedido de exclusão de uma das 13 pessoas.** Hoje não existe endpoint de exclusão de análise
  individual (só cascata na remoção da conta), então o atendimento seria `DELETE` manual no SQL
  Editor, por `id`. Se isso acontecer, o pedido deve cobrir **as três cópias**, e o mais simples é
  apagar a linha inteira.
- **O repositório ou o banco virarem públicos**, em qualquer forma: dump compartilhado, ambiente de
  demonstração com dados reais, ou abertura do código com fixture real junto.
- **Entrada de uma política de retenção geral** para `linkedin_analyses`. Se passar a existir prazo
  de expiração, estas linhas entram nele como qualquer outra, e a decisão aqui deixa de ser
  necessária.
- **Um quarto caso aparecer depois do conserto.** Seriam casos novos, o que significaria que o teto
  posicional não cobriu tudo, e aí a conversa volta para o parser.

## Onde está o conserto

- `shared/linkedin/competenciasDoPdf.ts` — teto posicional em 3 (o export do LinkedIn lista 3),
  com descarte rastreável. **Não olha o conteúdo**: por construção não consegue descartar `Kanban`
  por parecer nome nem manter um nome por não parecer.
- `shared/linkedin/competenciasDoPdf.test.ts` — as duas linhas reais, anonimizadas, com a forma
  preservada; mais o teste que afirma que um nome próprio nas três primeiras posições **passa**, que
  é o que a proteção deliberadamente não cobre.
- `client/src/pages/LinkedinAnalisar.tsx` — o guard na entrada do formulário.
- `DETERMINISTIC_VERSION = 6` — move `skills-quantidade` em 7 das 162 análises, sempre para baixo.
