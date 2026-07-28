# Varredura de erro engolido

Levantamento de 2026-07-28, feito depois que um `TypeError` de render derrubou o resultado do Analisador de
LinkedIn para um usuário real e **nada** registrou o fato. A única evidência de que alguém tinha visto tela
quebrada foi indireta: a análise ficou persistida no banco, sem ninguém para lê-la.

**Escopo declarado:** os três analisadores (LinkedIn, Currículo, Portfólio) e o caminho de cota de IA. **Não
é auditoria exaustiva de todo `catch` da base.** O que está fora deste recorte não foi olhado, e a ausência
de uma linha aqui não é atestado de que o lugar está limpo.

## O achado que muda a leitura da tabela inteira

**`server/lib/sentry.ts` não instala integração de console.** Confirmei olhando as `integrations` do `init`.

A consequência: **nenhum `console.warn` nem `console.error` do servidor vira issue no Sentry.** Eles morrem
no log do Railway, que ninguém abre sem já estar procurando alguma coisa.

Isso reclassifica metade da tabela abaixo. Toda linha que parecia "log degradado, dá para investigar depois"
é, na prática, **silêncio**. A diferença entre `console.warn` e não escrever nada é o tempo que alguém gasta
lendo o código e concluindo que havia um registro em algum lugar.

O caminho para mudar isso, se um dia valer: `Sentry.captureMessage` explícito nos pontos que importam (o
padrão de `avisarModoDegradado` e `avisarReservaOrfa`), **não** uma integração de console global, que
transformaria todo log de rotina em evento e estouraria a cota.

## A tabela

| arquivo | o que é engolido | quem deveria ver | ação |
|---|---|---|---|
| `server/lib/aiUsage.ts:387,389` | falha ao **confirmar a reserva**: a linha fica `reserved` para sempre, cota debitada sem entrega | Sentry | **CONSERTADO** (`avisarReservaOrfa`) |
| `client/src/components/ErrorBoundary.tsx` | todo erro de render do app | Sentry | **CONSERTADO** (`componentDidCatch`) |
| `client/src/contexts/FavoritesContext.tsx:168` | `Content-Type` em GET gerava 500 real | usuário | **CONSERTADO** |
| `CurriculoAnalisar.tsx`, `PortfolioAnalisar.tsx` | erro de render derruba a página inteira (sem boundary estreito) | usuário e Sentry | dívida |
| `server/lib/aiUsage.ts:408` | falha ao inserir o log de uso (caminho sem reserva) | Sentry | dívida: perde contabilidade, não cobra a mais |
| `aiUsage.ts:123,126,170,173,209,212,237,240,273,276,309,312` | 12 `console.warn` de RPC de rate limit | Sentry | dívida: o `ai-quota-degraded` já cobre o caso grave |
| `LinkedinAnalisar.tsx:246` | leitura do `localStorage` falha, form e resultado voltam a vazio | ninguém | dívida: recuperável pelo histórico |
| `LinkedinAnalisar.tsx:634` | escrita no `localStorage` falha (cota cheia) | ninguém | aceitável, já comentado no código |
| `PortfolioAnalisar.tsx:712,723,763,805`, `CurriculoAnalisar.tsx:177,233` | `.catch(() => setX([]))`: erro vira estado vazio | ninguém | dívida: "vazio" e "falhou" ficam indistinguíveis na tela |
| `server/routes/launchState.ts:75,78,136`, `careerPlan.ts:265,271` | `console.warn` em falha de log e de arquivamento | Sentry | dívida |

## O critério de ter consertado só um deles

**Dinheiro debitado com invisibilidade total.** A reserva órfã é a única linha da tabela que junta as duas
coisas: a cota já saiu da conta da pessoa, e não existia nenhum caminho pelo qual alguém descobrisse, a não
ser contando linhas `reserved` no banco à mão.

O passo 10 do `docs/smoke-linkedin.md` procura exatamente essa órfã, mas só quando alguém lembra de rodar o
smoke, e um guard que depende de memória humana é o desenho que já falhou várias vezes nesta base.

As demais ou não custam dinheiro (contabilidade, log de arquivamento), ou são recuperáveis pelo usuário sem
saber que houve falha (recarregar, reabrir o histórico), ou já têm um caminho de alerta que cobre o caso
grave (`ai-quota-degraded`). Consertar tudo de uma vez transformaria uma varredura em refatoração ampla, e
misturaria o conserto que urge com nove que não urgem.

## Dívida: source map do backend

Os eventos de servidor chegam ilegíveis hoje. **Evidência concreta**, do stack real da issue
`NODE-EXPRESS-B`:

```
/app/dist/index.js:19437 in router42.process_params
/app/dist/index.js:15557 in jsonParser
```

Número de linha num bundle de vinte mil linhas, com nomes de função mutilados pelo esbuild. Dá para
diagnosticar (foi o que fiz), mas só porque a mensagem era específica o bastante.

**Por que ficou de fora agora:** é outro pipeline. Exige `--sourcemap` no comando do esbuild e um passo de
`sentry-cli sourcemaps upload` no build do Railway, que é uma superfície de configuração diferente da
Vercel, com outro risco e outro redeploy. Misturar as duas coisas numa subida só multiplica o que pode dar
errado sem que se saiba qual metade falhou.

**O caminho, quando for a hora:** acrescentar `--sourcemap` ao `build` do `package.json`, subir com
`sentry-cli` no projeto `node-express` usando o mesmo release do commit, e apagar o `.map` do `dist/` depois
do upload. O `dist/` do backend não é servido publicamente (o Railway roda o processo, não serve o
diretório), então o risco de vazamento é menor que no frontend, mas apagar continua sendo o certo.

## Modo de falha conhecido do upload de source map do frontend

Medido em 2026-07-28, com token inválido de propósito: **o build passa (exit 0) e os `.map` são apagados
mesmo com o upload falhando.**

Isso é bom para vazamento (não sobra arquivo) e **ruim para diagnóstico**: um token expirado ou rotacionado
produz deploys verdes com stacks ilegíveis, sem ninguém notar até precisar depurar. É silêncio de novo, em
mais uma camada.

Não foi tratado. Se virar problema, o caminho é o `errorHandler` do plugin, decidindo explicitamente entre
derrubar o build e apenas avisar alto.
