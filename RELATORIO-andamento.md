HEAD_FINAL: eb851f218ce8221360b926f92b6cd9bc77001229

# Eventos em andamento, e limpeza dos TODO(Ana) aprovados

Sessao de 2026-09-02. Branch `feat/eventos-em-andamento`, worktree
`/home/s0ft/bnt-andamento`. Nada publicado, nada aplicado no banco.

ORIGIN_MAIN: `dc84adc229a9448f4bd30453749b642c7b8754bd`

## A condicao de PARE disparou, e foi resolvida por decisao explicita

O prompt mandava PARAR se algum commit novo da main tocasse os arquivos-alvo. A
main saiu de `9fc258c8` (a publicacao de 29/08) para `dc84adc2`, **169 commits**,
e tres dos cinco alvos foram tocados: `client/src/pages/Admin.tsx` (21 commits,
dark mode e a frente de finance/pix), `client/src/pages/Eventos.tsx` (3, dark
mode) e `server/routes/content.ts` (1, `erroEncadeavel`).

O PARE foi relatado com o Passo 0 ja feito, para a decisao ser informada, e a
orientacao foi seguir com os quatro itens. **Nenhuma premissa do prompt tinha
mudado**, e a worktree nasceu da main atual, entao nao havia colisao possivel.

## Passo 0 (read-only)

**1. Predicado atual da rota** GET /api/content/eventos, antes desta sessao:

```
.eq("is_published", true)
.is("deleted_at", null)
.or(`starts_on.gte.${hoje},starts_on.is.null`)
.order("starts_on", { ascending: true, nullsFirst: false })
.order("title", { ascending: true })
.limit(500)
```

`hoje` vem de
`new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date())`,
o helper que o corretivo `f961587a` introduziu. A unica mudanca que a main tinha
feito no arquivo era `cause: erroEncadeavel(error)` no `createError`, sem relacao
com o predicado.

**2. `ends_on` no client: JA MAPEADO.** `eventosService.ts` declara
`ends_on: string \| null` na linha crua e mapeia `fim: row.ends_on`. O Item 2 nao
precisou mexer no service, ao contrario do que o prompt previa como possibilidade.

**3. Eventos.tsx.** `chaveMes()` devolve `"AAAA-MM"` de `evento.inicio`, ou
`null` quando nao ha data. O `useMemo` de `grupos` percorre a fatia visivel e
manda para `semData` tudo que nao tem chave OU e `recorrente`; o resto vai para
um `Map` por mes, ordenado por chave. O render sai como os meses em sequencia e,
depois deles, a secao "Recorrentes e a confirmar" alimentada por `semData`. **A
pagina NAO tinha nocao nenhuma de "hoje"**: o unico `new Date` era o `maisUmDia`
da URL de calendario.

**4. Os dois TODO(Ana) do lote anterior**, localizados no meio de muitos outros:

```
client/src/pages/Eventos.tsx:512    // TODO(Ana)   (antes de { value: FILTRO_INTERNACIONAL, label: "Internacional" })
client/src/pages/Admin.tsx:6142     {/* TODO(Ana) */}   (antes de "Mostrando {items.length} registros. O total no banco nao foi informado...")
```

**Cuidado que valeu a pena:** ha um SEGUNDO TODO(Ana) a dezesseis linhas do
segundo, em `Admin.tsx:6126`, na faixa "Mostrando N de M registros". Esse e
ANTERIOR ao lote de agosto e **nao** foi removido. `Admin.tsx` tem mais de cem
marcadores TODO(Ana); remover "os do admin" por busca ampla teria varrido copy
que ninguem aprovou.

**5. Testes existentes da rota: NAO HA.** `server/routes/content.test.ts` (207
linhas) cobre `courses`, `platforms` e `projects`, e nao toca em `/eventos`. O
mock de supabaseAdmin de la nao registra `.or()` e nem conhece `.is()` e
`.limit()`. O teste do Item 1 e o primeiro dessa rota, em arquivo proprio.

## Commits

| SHA | Mensagem | Item |
|---|---|---|
| `9847b5ad` | `feat(eventos): include in progress events in content route` | 1 |
| `95d92475` | `feat(eventos): add happening now section to events page` | 2 |
| `0926c1ad` | `chore(eventos): drop approved todo markers` | 3 |
| `eb851f21` | `docs(sql): note route predicate evolution in window artifact` | 4 |

## Decisoes

**Item 1, um so calculo de `hoje` para os tres ramos.** O ramo novo usa a mesma
variavel dos outros dois. Datas diferentes entre ramos criariam uma faixa de
eventos que nenhum ramo pega, e ela apareceria na virada do dia, que e o pior
horario possivel para um bug de dado sumido, e e exatamente a classe que o
corretivo de fuso desta rota ja consertou uma vez.

**Item 1, ordenacao inalterada.** Continua `starts_on` ascendente com nulos por
ultimo. Como os em andamento comecaram no passado, eles vem primeiro no payload,
o que o prompt ja registrava como aceitavel e desejado.

**Item 2, `inicio < hoje` e nao `<=`.** Evento que COMECA hoje nao entra na secao:
ele e estreia do dia e segue no grupo do mes, onde sempre esteve. Conferido no
dado real: nenhum evento com `starts_on` igual a hoje caiu na secao.

**Item 2, fuso do navegador.** A rota ja fez o recorte grosso em America/Sao_Paulo,
entao evento terminado antes de hoje nem chega ao cliente. O calculo local so
decide, dentro do que sobrou, quem vai para a secao; para isso o relogio de quem
le e o certo. Usa `Intl.DateTimeFormat("en-CA")` de proposito, o mesmo formato
ISO da rota, para as duas pontas compararem string na mesma ordem.

**Item 2, ordenacao por `fim` ascendente.** Quem termina primeiro aparece
primeiro, porque e o que a pessoa esta prestes a perder. No dado real isso poe a
UX Conf BR (termina hoje) no topo e o InnovArt (vai ate 2027-01-02) no fim, que e
a leitura util.

**Item 2, sem estado vazio.** Sem eventos em andamento a secao simplesmente nao
renderiza, como o prompt pediu.

**Item 3, so o comentario sai.** O diff do commit tem duas linhas, ambas
remocoes de comentario. Nenhuma string mudou, conferido depois: `label:
"Internacional"` e "O total no banco nao foi informado" seguem identicas. O
TODO(Ana) novo do Item 2 (rotulo "Acontecendo agora") fica.

## Verificacao

```
pnpm check:all  -> EXIT=0
pnpm test       -> Test Files 281 passed | 4 skipped (285)
                   Tests 3745 passed | 17 skipped (3762)   59,74s
```

**O teste do Item 1 foi exercitado contra a condicao que deve pegar.** Com o ramo
`ends_on.gte` removido da rota, 4 dos 8 testes falham, e sao os 4 certos: a
string completa, a variante de fuso, "comecou ontem e termina amanha ENTRA" e
"termina hoje ainda entra". Os 4 de comportamento preservado (comeca amanha, sem
data, terminou ontem, total null) continuam passando. Restaurado o ramo, os 8
voltam a passar. Um teste que passasse nos dois estados nao estaria medindo nada.

**Sobre o interpretador dentro do teste.** O supabaseAdmin mockado devolve as
linhas do estado sem filtrar, entao um teste que so olhasse o payload passaria
com qualquer predicado, inclusive sem o ramo novo. Para poder afirmar "entra" ou
"nao entra" o arquivo tem um leitor de 8 linhas do subconjunto de sintaxe do
PostgREST usado aqui (`gte` e `is.null`). Ele **nao** deriva a expectativa da
implementacao: e uma segunda implementacao escrita a mao, que so sabe ler a
string ja pronta e nao importa nada de `content.ts`; os `true`/`false` de cada
caso estao escritos literalmente, e a string completa do `.or()` esta travada
literal em teste proprio.

**Validacao do Item 2 contra o dado real de producao** (consulta de leitura, com
o predicado de tres ramos):

| Medida | Valor |
|---|---|
| payload da rota nova | 302 |
| secao "Acontecendo agora" | **18** (igual a medicao do prompt) |
| resto (meses + sem data) | 284 |
| soma sem duplicata | sim, 18 + 284 = 302 |
| SBSeg (`sbseg-buzios-2026`, 01 a 04/09) | na secao |
| UX Conf BR (`legado-ux-conf-br-2026`, 01-02/09) | na secao, e primeira por terminar hoje |
| InnovArt 2027 (ate 2027-01-02) | na secao, por ultimo |
| algum evento que COMECA hoje na secao | nenhum |

Os 284 do resto sao exatamente o que a rota antiga devolvia, o que confirma que o
ganho e de 18 eventos e que nada saiu do conjunto anterior.

**Premissas do prompt conferidas em producao antes de comecar:** o trigger
`external_events_normaliza_travessao` existe e esta habilitado, e ha **zero**
linhas vivas com travessao, ou seja, o SQL de janela de fato rodou em 02/09.

**Dash-scan byte a byte, em Python**, sobre os 5 arquivos e as 274 linhas
adicionadas: **zero** U+2013/U+2014. Nenhum dos 5 arquivos tinha travessao na
base tambem (a main ja passou pelo `224a79ee`, que limpou o client).

**Diff:** `~/Downloads/andamento.diff`, md5 `40ccd2af3c6292e176e976c082e1bd73`,
368 linhas.

## Achados fora de escopo (reportados, nao corrigidos)

1. **O Item 2 ficou sem teste automatizado.** O prompt pediu teste so para o Item
   1, e o escopo foi respeitado, mas a lacuna e real: a separacao dos grupos tem
   tres regras faceis de quebrar em silencio (sair dos meses, ordenar por `fim`,
   excluir quem comeca hoje) e nenhuma delas esta travada por teste. O projeto
   tem precedente para testar pagina (`Admin.header.test.tsx` e outros oito
   `Admin.*.test.tsx`), entao a infra existe; nao ha nenhum teste de
   `Eventos.tsx`. A validacao feita aqui foi contra o dado real de producao, que
   pega o comportamento de hoje mas nao protege contra regressao amanha.
2. **O comentario da rota dizia "TRES casos" para DOIS ramos.** Antes desta
   sessao ele enumerava "data futura, sem data (recorrente) e a confirmar", mas
   os dois ultimos colapsam em `starts_on is null` no SQL: eram tres categorias
   de produto e dois ramos de codigo. Reescrito para enumerar os ramos reais, que
   agora sao tres de verdade. Vale como aviso: comentario que conta itens de uma
   lista que nao esta no codigo ao lado envelhece sem ninguem notar.
3. **A home passa a poder mostrar evento em andamento.** Consequencia aceita e
   registrada no proprio prompt: "Proximos Eventos" e "Pra Voce" leem da mesma
   rota. Nenhuma mudanca foi feita na home nesta sessao.
4. **`vw_eventos_agenda` continua sem declaracao**, ainda coberta pela allowlist
   de drift de `scripts/lib/schemaDriftAllowlist.ts`. Fora de escopo por decisao
   explicita do prompt; segue na fila.
