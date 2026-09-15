# ADM-002-P1-R2 - custo de IA unificado na Visão

Data: 12/09/2026.

## Base verificada

- Checkout: /tmp/boranatech-adm002.
- Branch: feat/adm-002-atencao-v1.
- Base e HEAD inicial/final: 1ac2ce35c398009805cfad1780f7aa185080a9e2.
- O working tree inicial tinha os 25 arquivos do P1 e R1, sem commit.
- Pacote R1: SHA-256 9104cbacad2100db50aebfa0bcddb00b709bf84310540196ef33f6209a5b721b.
- Os 36 hashes do manifesto conferiram. O incremental R1 tinha SHA-256 779aeaac08e0fa83ddd050bc1088473142fac256f6fef95ba7890b008d394c5e e o acumulado 23c725d56903f511c0a8cd6395c91e2ee78c4c35325ccf5eef74b00125b568a8.
- Os 25 arquivos do checkout coincidiram byte a byte com fontes/. Essa árvore foi preservada em diretório temporário para o patch incremental R2.

## Correção única

A regra permanece em server/lib/aiUsageStats.ts, na função pura classificarCustoDeIa. server/lib/overviewSeries.ts agora classifica cada log uma única vez e reutiliza o resultado nos três consumidores:

- série diária custoIaUsd usa custoMedido;
- série diária chamadasSemCustoMedido usa semCustoMedido;
- agrupamento por ferramenta usa os mesmos dois valores.

Foram removidos os três Number.parseFloat independentes. Uma busca final no código de produção não encontrou parsing direto de cost_estimate. As ocorrências restantes são escritores, tipos, seleção de coluna e chamadas a classificarCustoDeIa.

A semântica preservada é:

- decimal completo, finito, não negativo e positivo entra no custo medido;
- success com zero, nulo, inválido, negativo ou texto parcialmente parseável fica sem custo medido;
- linha não bem-sucedida com zero ou ausência não cria lacuna;
- custo positivo válido continua somado mesmo em status não bem-sucedido;
- moeda, séries e agrupamento permanecem em USD e no calendário de Brasília;
- paginação, corte superior e contratos v3 não mudaram.

## Regressão card, séries, ferramentas e atenção

Foram adicionadas duas integrações HTTP sobre as mesmas fixtures:

- success com 0.25lixo: card com custo zero e uma lacuna, série de custo zero, série de lacunas igual a um, ferramenta com custo zero e uma lacuna, atenção partial e sem spike;
- success com 0.25: card, série e ferramenta com 0,25 USD, nenhuma lacuna e atenção available.

O ambiente local não conseguiu executar essas duas integrações porque a suíte HTTP bloqueou antes de iniciar casos ao abrir socket. Elas compilam e permanecem no pacote para execução no ambiente externo que aprovou HTTP na revisão anterior.

A evidência local sem socket executou as funções e o handler de séries reais:

- 0.25lixo resulta em custo zero e uma lacuna no agregado que alimenta o card;
- mistura de 0,25 válido, zero, nulo, inválido, negativo, erros sem custo e erro com 0,10 resulta em custo 0,35 e quatro lacunas;
- as duas séries retornam 0,35 e quatro;
- as ferramentas retornam os mesmos valores por log;
- erro com zero/nulo não aumenta lacunas e erro com 0,10 permanece no custo;
- o painel de atenção continua partial e sem comparativo quando existe sucesso sem custo medido.

## Testes e gates

### Aprovados

- Regressão inicial de séries/IA/atenção: 77/77 em três arquivos.
- Suíte focal ampla final: 337/337 em 19 arquivos.
- Guardas administrativas: 10/10.
- Testes finais diretamente ligados a custo: 79/79 em três arquivos.
- TypeScript principal e TypeScript de scripts.
- Prettier nos arquivos tocados.
- git diff --check do diff rastreado.
- Equivalentes sem IPC para roadmap, projetos v2, sitemap, CSP, contagens, home data, paleta e auditoria de limiares.
- Busca estática: nenhum parser direto de cost_estimate permanece em produção.

Resultados de comandos diferentes não são somados como casos únicos.

### Bloqueados

- Uma nova tentativa de server/routes/adminOverviewCards.test.ts permaneceu bloqueada por 60 segundos ao abrir socket e foi interrompida sem concluir casos. Nenhum teste HTTP local foi contado.
- pnpm check:all passou pelo TypeScript principal e falhou na primeira CLI tsx com listen EPERM em /tmp/tsx-1000/45.pipe. O agregado não é declarado aprovado. Todos os equivalentes sem IPC passaram.

## Não regressões e limitações

As correções R1 de refresh write-through, cache preservado, inventário fechado, validação servidor/cliente e cobertura parcial foram mantidas. Também permanecem os fatos locais, ausência de chamadas a provedores, deep links, separação de fontes e regras financeiras da ADM-001.

Limitações aceitas continuam: sem snapshot transacional, sem cobertura histórica reconciliada e sem recuperação dos custos ausentes. Esta rodada não consultou banco, provedor ou dados reais.

Não houve commit, push, PR, merge, deploy, migration, backfill, sync, replay ou operação externa.
