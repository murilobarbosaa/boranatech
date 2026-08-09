# Onboarding: rotas pendentes e pendências abertas

Estado em 2026-08-09, no fechamento da `feat/onboarding`.

Os 33 HTMLs de `design/onboardings/` estão todos portados: 34 entradas do
registry marcadas como `onboarding` (33 chaves de persistência distintas, porque
`/projetos/:id` compartilha a de `/projetos`). Sobram **26 rotas** classificadas
como `pendente`, ou seja, sem decisão tomada.

Este documento registra a classificação **proposta** para elas. Nada aqui está
implementado: no `registry.ts` as 26 continuam `pendente`, e é o `pendente` que
vale. O objetivo é que a próxima pessoa não precise refazer a análise do zero.

`client/src/lib/onboarding/rotasPendentes.test.ts` compara esta lista com o
registry nos dois sentidos e quebra se elas divergirem. Ao classificar uma rota
de verdade, tire-a daqui no mesmo commit.

<!-- ROTAS-PENDENTES:INICIO -->

## Provável `sem-onboarding`: página de detalhe

A listagem-mãe já tem onboarding e já explica o que a pessoa vai encontrar ao
abrir um item. Um segundo overlay logo depois do clique interrompe exatamente a
ação que o primeiro pediu.

- `/areas/:slug`
- `/areas/:parent/:subarea`
- `/tecnologias/:slug`
- `/empresas/:slug`
- `/faculdades/:slug`
- `/roadmaps/:slug`
- `/roadmaps/ia/:slug`

## Provável `sem-onboarding`: meio de fluxo

A pessoa está no meio de uma tarefa com estado próprio (sessão, prova,
resultado). Mesma razão que tirou `/checkout` e `/planos` da lista: interromper
aqui atrapalha a tarefa em curso.

- `/entrevistas/sessao/:id`
- `/roadmaps/:slug/prova`
- `/quiz-carreira/resultado`

## Aguardando decisão de produto

Não há HTML de referência para nenhuma delas. Se o material for desenhado, viram
`onboarding`; se a decisão for que não precisam, viram `sem-onboarding` com o
motivo escrito. Ficar em `pendente` é o estado honesto enquanto ninguém decidiu.

- `/perfil`
- `/perfil/conquistas`
- `/perfil/favoritos`
- `/comparador`
- `/creators`
- `/estudos/diario`
- `/tecnologias/comparar`
- `/tecnologias/jogos`
- `/empresas/ranking-junior`
- `/ingles/onde-estudar`
- `/ingles/no-trabalho`
- `/ingles/entrevista`
- `/ingles/vocabulario`
- `/certificados`
- `/certificados/:code`
- `/perguntas-frequentes`

<!-- ROTAS-PENDENTES:FIM -->

---

# Outras pendências abertas

## 1. O pre-commit deixa passar `pnpm check` vermelho

**A mais grave, e é do harness, não do onboarding.**

Reproduzido de propósito em 2026-08-08: introduzi um erro de tipo, rodei
`git commit`, e o commit **entrou** com status 0, com o hook imprimindo
`[pre-commit] ok`. O `pre-commit.log` da rodada mostra o `pnpm check` falhando e
o log terminando ali; nenhum `pre-commit-falha-*.log` foi preservado, ou seja, o
`trap` de saída viu status 0.

O que **não** foi determinado: a causa. Rodando a mesma cauda do hook
(`rodar pnpm check` + trap, sem as duas passadas de suíte) via `sh`, ela **aborta
corretamente** com status 1 e preserva o log. A diferença está em algo da
execução completa sob o git.

Consequência prática: enquanto isso não for consertado, **`pnpm check` e a suíte
precisam ser rodados à mão antes de qualquer merge**. O hook não é o gate que
todo mundo acha que é.

Não foi mexido de propósito: é o gate principal do repositório e estava fora do
escopo das tarefas em que apareceu.

## 2. FAB do Natechinho conspícuo atrás do backdrop

Medido: o FAB é `z-40` e o overlay é `z-1003`, então ele **está** atrás do
backdrop (`document.elementFromPoint` sobre ele devolve o `.stage` do overlay).
O que acontece é que um círculo violeta saturado atravessa
`rgba(11,16,32,.45)` + `blur(6px)` e continua chamando atenção.

Não é problema de empilhamento. Se incomodar, o ajuste é a força do backdrop
(opacidade ou raio do blur) em `onboarding.css`, e altera o visual já aprovado.

## 3. `/entrevistas` não é detectável pela regra de guarda do tour

O tour pula rota bloqueada comparando a location que chegou com a que ele pediu.
Funciona para `RequireAuth`, que faz `<Redirect>` de verdade (`/roadmaps/ia` vira
`/cadastro`).

`/entrevistas` é `component={Entrevistas}` **sem** `RequireAuth`: o paywall Pro
mora dentro da página e a location não muda. Pelo critério de location isso não é
"guarda", então o onboarding abre por cima do paywall. Como o conteúdo do 20
justamente explica a área, parece aceitável, mas não é o que a expressão "rotas
com guarda" sugere.

## 4. "Rever onboarding" manual

Decidido desde o piloto que ficaria para depois. Hoje só há abertura automática
na primeira visita. A persistência já suporta: bastaria apagar o registro da rota
(`preferences.onboardings[routeKey]` ou `bnt_onb:<routeKey>`) e recarregar.

## 5. Analytics do `CustomEvent`

O motor emite `bnt:onboarding` com `step`, `choice` e `finish` (este último com
`{ completed, perfil, tour }`), e **ninguém escuta**. Ligar no PostHog é o passo
que transforma o onboarding em dado: taxa de conclusão por rota, distribuição dos
perfis, quantos escolhem o tour guiado e onde ele é abandonado.

`data.perfil` e `data.tour` já são persistidos por rota, mas nenhuma tela os
consome para personalizar nada. Só o tour usa `data.tour`.
