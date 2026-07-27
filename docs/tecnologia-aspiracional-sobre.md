# Tecnologia aspiracional no `sobreReescrito`

Levantamento da Fase 1B, item 6. **Análise, sem implementação.** Nada aqui foi codificado.

## 1. O que foi medido

Medição de 30 execuções da Fase 1B (12 perfil real, 9 perfil raso, 9 perfil em transição), mesmo harness e
mesma distribuição do baseline da Fase 1A-ter. Critério mecânico: tecnologia nomeada em `sobreReescrito` que
não aparece em nenhum lugar do perfil nem nas competências coladas.

| Perfil | Execuções | Execuções com ocorrência | Ocorrências |
|---|---|---|---|
| real (fullstack, pleno) | 12 | 0 | 0 |
| raso (frontend, estágio) | 9 | 0 | 0 |
| transição (análise de dados) | 9 | **1** | **1** |
| **total** | **30** | **1** | **1** |

A ocorrência, íntegra:

> `transicao` run 8, tecnologia `Python`:
> "Estou estudando Python e outras ferramentas de análise de dados para aprimorar minhas competências."

Baseline da Fase 1A-ter, para comparação (mesmos 30, mesma distribuição):

| Perfil | Execuções com ocorrência | Ocorrências |
|---|---|---|
| raso | 1 (run 5) | 2 (`React`, `TypeScript`) |
| transição | 1 (run 4) | 2 (`Python`, `R`) |
| **total** | **2 de 30** | **4** |

**As 5 ocorrências das duas medições, sem exceção, estão dentro de uma moldura explícita de aprendizado**
("tenho interesse em aprender sobre frameworks como...", "aplicar novas tecnologias como...", "Estou
estudando..."). Nenhuma afirma experiência que a pessoa não tem. Ou seja: a população inteira desta classe,
até aqui, é comportamento correto do produto contado como violação pela régua mecânica. É a cegueira 3 da
seção 8 de `docs/rubrica-fidelidade.md`.

## 2. Três caminhos

### A. Estender a camada de lastro ao `sobreReescrito`

Aplicar `removerTermoSemLastro` ao Sobre, como já se faz em `headlines` e `bulletsReescritos`.

- **A favor:** fecha a classe mecanicamente, sem depender do modelo. É a única opção com garantia.
- **Contra:** é exatamente o que `shared/linkedin/lastro.ts` documenta como recusado, e a ocorrência medida
  mostra por quê. Removendo `Python` da frase real, sobra "Estou estudando e outras ferramentas de análise de
  dados para aprimorar minhas competências." O produto passa a produzir frase quebrada para consertar uma
  frase que estava certa. Além disso o lastro legítimo do Sobre é o perfil inteiro, critério frouxo demais
  para virar remoção automática.

### B. Proibir no prompt: nenhuma tecnologia sem evidência no `sobreReescrito`

- **A favor:** custo zero, sem código, sem risco de quebrar frase.
- **Contra:** é instrução, não garantia. A série inteira desta auditoria (58 -> 22 -> 3 -> 0) veio de **tirar
  trabalho do modelo**, não de instruir melhor; instrução reduz, nunca zera. E o custo colateral é real: dizer
  o que se está estudando é legítimo e é precisamente o conselho que a plataforma dá a quem está em
  transição. A proibição piora o Sobre justamente do público que mais precisa dele, para consertar uma
  métrica que estava contando errado.

### C. Legitimar a moldura e detectar só o caso sem moldura

Duas metades:

1. **Prompt:** tecnologia sem evidência pode aparecer em `sobreReescrito` **apenas** dentro de moldura
   explícita de aprendizado ou interesse ("estou estudando X", "quero aprender X"), nunca como afirmação de
   experiência.
2. **Harness:** tecnologia sem lastro dentro de moldura não é violação; fora de moldura é. A detecção é sobre
   a frase que contém o termo, que o harness já isola.

- **A favor:** é o único caminho que preserva o comportamento correto e transforma a cegueira 3 de falso
  positivo em distinção mensurável. Hoje o placar não sabe diferenciar "estou estudando Python" de "domino
  Python"; as duas contam igual, e é por isso que esta classe não converge.
- **Contra:** mais maquinário. O detector de moldura tem falsos positivos e negativos próprios (moldura em
  inglês, moldura a duas frases de distância, negação). E, sozinho, não impede o caso sem moldura: ele o
  torna visível, o que é um passo antes de fechar, não o fechamento.

## 3. Recomendação

**Caminho C, e só a metade 2 primeiro: a do harness.**

Motivo. A população observada desta classe é 5 ocorrências em 60 execuções, e as 5 são comportamento correto.
Construir remoção automática (A) ou proibição (B) contra uma classe cujas instâncias observadas estão todas
certas troca qualidade de produto por um número de placar. A régua é que está errada, não o produto.

Corrigir a régua primeiro custa quase nada, não toca em produção, e responde a pergunta que hoje não tem
resposta: **existe caso sem moldura?** Enquanto a resposta for não, não há classe para fechar. Se aparecer
caso sem moldura, aí sim a metade 1 (regra no prompt) entra, e o caminho A fica de reserva para o caso de a
instrução não segurar, medido e não suposto.

Ordem sugerida, se e quando esta fase for aberta:

1. Harness distingue com moldura de sem moldura, e o placar decomposto ganha as duas linhas.
2. Uma medição de 30 com a distinção no lugar, para saber o tamanho real do caso sem moldura.
3. Só então decidir entre prompt (B/C.1) e remoção (A), com o número na mão.
