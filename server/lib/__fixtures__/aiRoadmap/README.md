# Fixture de roadmap gerado por IA

`roadmap-ready-ia.json` é o objeto `RoadmapV2` como ele fica na coluna
`ai_roadmaps.roadmap` depois de uma geração completa (`status = 'ready'`).

Criada na Fase 2 porque as Fases 3 (enriquecimento do prompt) e 4 (certificado do
roadmap com IA) vão precisar de um roadmap de IA para exercitar `computeHours`,
`requiredLeaves` e a derivação de ementa **sem depender de dado de produção**.

## Fiel à forma real, não ao tamanho real

O conteúdo foi escrito para esta fixture; nada aqui é dado de usuário. A **forma**
foi conferida contra os 18 roadmaps `ready` que existiam em produção em
2026-07-30 (869 passos de primeiro nível medidos):

| característica                      | produção                               | fixture                            |
| ----------------------------------- | -------------------------------------- | ---------------------------------- |
| seções por roadmap                  | 9 em média (schema aceita 7 a 10)      | 7                                  |
| `content` preenchido                | 869 de 869 (100%)                      | 100%                               |
| `estimatedTime` preenchido          | 869 de 869 (100%)                      | 100%                               |
| sub-passos (`children` de 2º nível) | **0 de 869**                           | 0                                  |
| `resources` / `byLanguage`          | 0 (fora do schema na v1)               | ausentes                           |
| `optional`                          | 26 de 869 (3%)                         | 1 de 28                            |
| `project`                           | só na última seção, id do catálogo Pro | `pro-saas-dashboard`, último passo |

Os campos `project` e `optional` aparecem **apenas onde existem** (a conversão
`toRoadmapNode` remove os `null`), que é exatamente o que o banco mostra.

## Números que os testes podem afirmar

- 7 seções, 28 folhas, **27 folhas obrigatórias** (uma é `optional: true`).
- `slug` = `ia-a1b2c3d4`, que casa com `AI_ROADMAP_SLUG_RE`.

Se mudar a fixture, atualize esta tabela: ela é a única coisa que impede a
fixture de virar "um JSON qualquer" e deixar de representar o que se propõe.
