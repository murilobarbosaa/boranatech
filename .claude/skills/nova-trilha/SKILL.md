---
name: nova-trilha
description: Use quando o prédio do Bora na Tech for pedir, construir ou revisar uma trilha nova da vitrine /roadmaps (linguagem, framework, ferramenta, área ou carreira), mesmo que o pedido diga só "trilha de X" ou "roadmap de X". Cobre para quem é, estrutura pedagógica, tom, receita técnica, checklist da vitrine e o PR com prévia que a Ana e o Murilo aprovam.
---

# Nova trilha

O Construtor (1º andar) entrega uma trilha completa num PR com prévia. A meta é a Ana e o Murilo aprovarem pela prévia, só com ajuste de texto. Cada volta a mais gasta crédito: acerte de primeira.

**Quem usa**
- Prompteiro de Produto: escreve o pedido em até 5 linhas, como no Exemplo: tipo, público (pela tabela Para quem), nível e a referência, que é sempre a TypeScript do Zero. O que a Ana não disse vira "a confirmar". Não investiga o repositório: isso é do Construtor. Registra em Lições cada correção da Ana ou do Murilo, uma linha por regra, com data.
- Construtor: segue a Receita técnica e abre o PR.
- Aprovador de Produto: lê o diff do PR passo a passo e confere Tom, fontes (conte por passo) e Checklist da vitrine, também na prévia. A descrição do PR guia a leitura, mas não prova nada. Fora do diff, só abre arquivo para uma dúvida pontual.

**Antes de começar**
- Referência de qualidade: TypeScript do Zero (`shared/roadmapV2/content/typescript.ts`).
- Regras finas de escrita, código e prova: `.claude/commands/build-next-trilha.md`.
- Onde o guia ou o CLAUDE.md divergirem desta skill (tom, tamanho do passo, fontes, push e PR), vale esta skill.
- Caminhos, comandos e grupos desta skill já foram conferidos. Não confira de novo: se algo mudar, `pnpm check:all` e os testes acusam.
- Leia só a referência, o guia e os arquivos que vai editar.
- Faltou informação? Pergunte ao Prompteiro ou escreva "a confirmar" no PR. Nunca invente curso, link, arquivo ou comando.

## Para quem

| Tipo (`kind`) | Exemplos | Para quem | Sai sabendo |
|---|---|---|---|
| `linguagem` | JavaScript, Python, TypeScript | quem quer aprender a linguagem do zero, mesmo sem nunca ter programado | escrever e rodar código de verdade e entregar um projeto |
| `framework` | React, Node | depende do nível: pode começar do zero ou pedir a linguagem base | montar uma aplicação com o framework |
| `ferramenta` | Git, GitHub, Docker | quem estuda ou trabalha e precisa da ferramenta no dia a dia | usar a ferramenta no fluxo real, do primeiro comando ao fluxo completo |
| área (sem `kind`) | Front-end, Back-end, Dados | quem escolheu uma área de TI e quer chegar à primeira vaga | o básico da área de ponta a ponta, com projeto publicado |
| `carreira` | Começar do Zero em TI, LinkedIn | quem precisa de um passo de carreira que serve para qualquer área | a ação feita (sem prova nem projeto) |

- Linguagem, framework, ferramenta e área terminam com projeto, prova e certificado.
- Pré-requisito só quando o nível pede. Aí a description avisa e o primeiro passo cita a trilha base pelo nome.

## Estrutura pedagógica

O tamanho vem do assunto. Muda de trilha para trilha: número de etapas e passos, tamanho do texto do passo e níveis presentes. Nem toda trilha vai até o avançado.

Fixo em toda trilha:
- Etapas (`sections`) com `level` `iniciante`, `intermediario` ou `avancado`, sempre subindo.
- Passo (bloco de lição) nesta ordem: o que é, em uma frase; por que existe (o porquê antes do como); modelo mental; prática real; ponte para o próximo passo.
- Fecho do passo: "Você domina este passo quando..." com frase variada.
- Código curto que roda de verdade, sem saída inventada. Limites na seção 11 do guia.
- Etapas que conversam: um passo promete e outro, mais adiante, cumpre, citando o nome do passo.
- Um projeto de portfólio no fim: id real de `shared/projects/catalog.ts`, nunca `pro: true`.
- A prova vem depois, em PR próprio.

Fontes gratuitas (`resources`, de 0 a 3 por passo):
- Documentação oficial e MDN em português.
- Vídeos gratuitos do YouTube, com o canal citado no PR para a Ana aprovar.
- Cursos do catálogo com `tipo: "Gratuito"` (`cursosGratuitos` em `client/src/lib/data.ts`): no máximo 3 na trilha inteira.
- Plataformas do catálogo com `tipo: "Gratuita"` (`plataformas`, mesmo arquivo): no máximo 3 na trilha inteira.
- O teto existe para a trilha grátis não entregar o que é do Pro.
- No catálogo, busque pelo id ou pelo link. Nunca leia o `data.ts` inteiro: são mais de 20 mil linhas.
- Link só entra conferido, com a página aberta. Uma fonte boa por passo costuma bastar: menos link, menos crédito.

## Tom

- Leve e bem-humorado, com o mesmo rigor. O humor vem da linguagem: gíria da internet na medida ("bora", "deu ruim", "salvou o dia").
- Não entra: emoji, referência de série, jogo ou meme.
- Fala com "você", direto e brasileiro. Sem infantilizar e sem motivacional vazio.
- Jargão sempre explicado. No texto é "passo" e "trilha", nunca "folha" ou "nó".
- Sem travessão nem meia-risca, em texto ou código.

O que a Ana mais corrige (o Aprovador confere antes dela):
- Acento e português.
- Afirmação exagerada ou dado sem fonte. Sem fonte, vira qualitativo ou sai.
- Texto longo ou enrolado. O passo chega logo no ponto.
- Título de passo confuso. O título diz o que o passo ensina.

## Receita técnica

Worktree próprio a partir da `origin/main` atualizada, branch `feat/<slug>-trail`.

Commit 1, a trilha (ex.: `feat(roadmaps): add the git tool trail`):
1. Crie `shared/roadmapV2/content/<slug>.ts` exportando um `RoadmapV2`. Abra com cabeçalho `// TODO(Ana)` pedindo revisão editorial e marque `// TODO(Ana)` em title, description e summary.
2. Campos: `slug` (a-z, 0-9 e hífen; `ia` é reservado), `kind`, `area` igual ao kind (trilha de área usa um slug de `areasTI`), `codeLanguages` se houver código, `title` ("X do Zero"), `level`, `description`, `summary` e `sections`.
3. `summary` é uma linha só e vira a descrição do card. Sem ele, o card mostra a description.
4. Índice: import e entrada no fim do array `roadmapsV2` em `shared/roadmapV2/content/index.ts`.
5. Linha lazy do slug em `client/src/lib/roadmapV2/loaders.ts`, no formato das outras.
6. `pnpm gen:roadmap-meta`: reescreve `shared/roadmapV2/meta.generated.ts` e `shared/roadmapV2/projectLinks.generated.ts`.
7. Linguagem, framework e ferramenta: atualize os testes que afirmam o total, `client/src/pages/RoadmapsV2Index.trails.test.tsx` e `shared/roadmapV2/vitrineGroups.test.ts`.

Commit 2, vitrine e certificado (ex.: `feat(roadmaps): add css logo, purple palette and english title`):
8. Linguagem, framework e ferramenta: cor própria em `TRAIL_PALETTE` (`client/src/lib/tagPalette.ts`), par literal `bg-<cor>-200` e `text-<cor>-900` de família que nenhuma trilha usa, e logo em `TRAIL_LOGOS` (`client/src/components/roadmapV2/TrailLogo.tsx`) com o path de `icons/<nome>.svg` do simple-icons 16.31.0 (`npm pack simple-icons@16.31.0` fora do repo). Testes em `tagPalette.test.ts` e `TrailLogo.test.tsx`. Sem ícone no pacote, fica o do grupo e o PR avisa.
9. Carreira: ícone e cor em `CAREER_CARD_STYLE` (`client/src/pages/RoadmapsV2Index.tsx`). Área: nada, o card usa o ícone e a cor da área em `areasTI`.
10. Título em inglês, obrigatório, em `shared/certificates/roadmapTitlesEn.ts`: "do Zero" vira "from Scratch".
- Precisou de arquivo fora desta lista (ex.: base de SQL em `shared/roadmapV2/sqlBancos.ts`, seção 11 do guia)? Diga qual e por quê no PR.

Antes de cada commit:
- Trilha com `codeLanguages`: `pnpm verify:lesson-blocks <slug>`. Trecho sem runner (bash, html, css, dockerfile) pede revisão humana de todos. Sem `codeLanguages` (área e carreira), o verificador não roda.
- Varredura de U+2013 e U+2014 com Python nos arquivos tocados e na descrição do PR (grep não é confiável nesse shell).
- `pnpm check:all` com exit 0.
- Testes da vitrine: `pnpm exec vitest run client/src/pages/RoadmapsV2Index client/src/lib/tagPalette.test.ts client/src/components/roadmapV2/TrailLogo.test.tsx shared/roadmapV2/vitrineGroups.test.ts`. A suíte inteira roda no hook de pre-commit e no CI: não rode à mão.
- `git add` arquivo por arquivo. Commit de uma linha, em inglês, sem trailer. Nunca `--no-verify`.
- Algo falhou? Corrija e rode tudo de novo. Só commite com tudo verde.

PR da prova, só depois do texto aprovado (seções 8 e 12 do guia): `pnpm gen:quiz-pool <slug> --dry-run`, a geração real (gasta OpenAI), `pnpm verify:quiz-pool <slug> --tabela-revisao` e o registro em `server/data/roadmapQuizzes/index.ts`.

## Checklist da vitrine

O Construtor confere na prévia pela extensão do Chrome conectada ao Claude Code, na sessão do Murilo (logada na Vercel e no Bora). O Aprovador confere de novo.
- [ ] Grupo certo: `linguagem` e `framework` em "Linguagens de programação" (`/roadmaps?grupo=linguagens`); `ferramenta` em "Ferramentas" (`?grupo=ferramentas`); `carreira` em "Trilhas de carreira"; área no grid de áreas.
- [ ] Posição no grupo igual à ordem do array `roadmapsV2`.
- [ ] Card com título, resumo de uma linha, "N etapas" e "N passos" iguais ao meta.
- [ ] Ícone visível e cor certa, par pastel em linguagem, framework e ferramenta (item fixo de toda publicação).
- [ ] Claro e escuro, no computador e no celular.
- [ ] O card abre `/roadmaps/<slug>` e a trilha carrega inteira.
- [ ] Selo "Com prova" só depois do PR da prova. No PR da trilha, a falta dele é esperada.

## PR e prévia

1. Empurre só a sua branch: `git push -u origin feat/<slug>-trail`. Nunca a main.
2. Abra o PR contra a main: `gh pr create --base main --title "<assunto do commit 1>" --body-file <arquivo>`.
3. Espere o CI: `gh pr checks --watch`. Se ficar vermelho, corrija antes de chamar alguém.
4. A Vercel publica a prévia no PR. A Ana abre logada na conta dela da Vercel.
5. A vitrine é pública. A página `/roadmaps/<slug>` exige login no Bora, e a prévia fala com a API de produção: só para olhar.
6. Na primeira trilha, teste o login na prévia e conte no PR se deu certo. O Prompteiro registra o resultado em Lições.
7. Voltou com correção? Commit novo na mesma branch (`fix(roadmaps): ...`) e push normal, sem `--force`. Nunca reescreva o que já subiu, nem se a revisão pedir.
8. O merge é da Ana ou do Murilo. O Construtor nunca faz merge.

Descrição do PR, nesta ordem:
- Para quem é e o que a pessoa sai sabendo.
- Links da prévia: `<prévia>/roadmaps?grupo=<grupo>` e `<prévia>/roadmaps/<slug>`.
- Números: etapas, passos, blocos de código, fontes, cursos e plataformas do catálogo.
- O que a Ana revisa: cada `TODO(Ana)`, os canais do YouTube e o projeto escolhido.
- Checklist da vitrine marcado.
- Comandos rodados, cada um com o EXIT.
- Tudo que ficou "a confirmar".

## Exemplo

Pedido do Prompteiro: "Nova trilha: GitHub do Zero. Tipo ferramenta. Começa do zero e ensina no caminho o Git básico que precisar. Referência: TypeScript do Zero."

O que o Construtor entrega:
- `shared/roadmapV2/content/github.ts` com `slug: "github"`, `kind: "ferramenta"`, `area: "ferramenta"`, `codeLanguages: ["bash"]` e `title: "GitHub do Zero"`.
- Tamanho pelo assunto. Onde o Git aparecer, ensina o básico e cita a Git do Zero pelo nome para quem quiser ir fundo.
- Blocos bash sem runner: revisão humana de todos, avisada no PR.
- Card no grupo Ferramentas, logo depois da Git. Cor própria, `icons/github.svg` do simple-icons e "GitHub from Scratch".
- Summary e projeto: o Construtor propõe, marca `TODO(Ana)` e lista no PR.
- Branch `feat/github-trail`, dois commits e o PR com a descrição acima.
- Com o texto aprovado, o PR da prova.

## Lições
