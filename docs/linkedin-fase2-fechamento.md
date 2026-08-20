# Fase 2 do Analisador de LinkedIn: fechamento

Escrito em 2026-08-19, no fim do lote 7. Registra o que a fase mudou, que políticas
ficam vigentes, o que ficou de fora sabendo que ficou, e o que vai para a Fase 3.

A Fase 1 tratou do determinístico (parser, checks, nota). Esta fase tratou do
**qualitativo**: o que a IA escreve, o que a plataforma aceita publicar em nome do
usuário, e quanto isso custa.

## 1. Os lotes

| Lote | Commit                              | O que mudou                                                                                                                                                                                          |
| ---- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `c88389dd`                          | Bullets passam a ser atribuídos à experiência pelo `experienciaNumero` que o prompt numerou, e não por sobreposição de tokens; número fora do intervalo descarta o bloco inteiro.                    |
| 2    | `9f3d4299`                          | Toda tentativa que alcança a OpenAI gera evento de custo com desfecho nomeado; a linha de uso soma todas as tentativas, inclusive no ramo de erro.                                                   |
| 3    | `2352f8db`                          | Todo conteúdo do usuário viaja dentro de blocos `<dados_do_usuario campo="...">`, sanitizados, na seção final da mensagem, com regra no `SYSTEM_PROMPT` dizendo que ali é dado e nunca instrução.    |
| 4    | `5faed59e` e `553f8f44`             | Remoção de termo sem lastro passa a costurar o texto (separador e conectivo órfãos); `skillsParaEstudar` passa a aceitar só o que estava na lista de faltantes, na grafia canônica.                  |
| 5    | `788587b7`, `ae4b1c68` e `33b89c79` | Catálogo de violações unificado em `shared/linkedin/lastro.ts`; prosa ganha lastro de tecnologia e de numeral, com política de sinalizar (conversa) e de substituir por fallback (texto para colar). |
| 6    | `13e98530` e `42c776a7`             | Retry passa a levar diagnóstico do que reprovou; gates de idioma por mercado e de vazamento de delimitador, com um retry contextual e fallback depois do orçamento.                                  |
| 7    | `85e130d9`                          | Golden qualitativo: 15 cenários congelam o pipeline inteiro em arquivos JSON revisáveis. Nenhuma mudança de comportamento.                                                                           |

## 2. Políticas vigentes

| Assunto                                                                                   | Política                                                                                                                                                                                                                                                                                                            | Onde                                             |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Prosa de conversa (`resumo`, `pontosFortes`, `pontosFracos`, `melhorias`, `proximoPasso`) | Detecta e SINALIZA. O texto chega íntegro ao usuário; a violação vira evento. Editar prosa corrida quebraria a frase e poderia inverter o sentido.                                                                                                                                                                  | `lastro.ts`, política 2                          |
| Texto para colar (`sobreReescrito`, `modeloMensagemRecrutador`)                           | Invento SUBSTITUI o campo inteiro por um texto determinístico montado só com o que o perfil comprova. Nunca edição palavra a palavra.                                                                                                                                                                               | `linkedinAnalyze.ts`, `textoParaColarSemInvento` |
| Recorte do lastro de tecnologia                                                           | Roda em `resumo`, `pontosFortes`, `sobreReescrito` e `modeloMensagemRecrutador`, que AFIRMAM sobre o perfil. Fica fora de `pontosFracos`, `melhorias` e `proximoPasso`, que existem para RECOMENDAR o que falta: "estude Kubernetes" é o acerto, e a moldura aspiracional não cobre recomendação em segunda pessoa. | `linkedinAnalyze.ts`, passo 5                    |
| Lastro de numeral                                                                         | Roda em TODA prosa. Recomendação não inventa resultado medido, e "reduziu custos em 40%" é claim em qualquer campo.                                                                                                                                                                                                 | `linkedinLastroProsa.ts`                         |
| Aspiração                                                                                 | "Estou estudando X" sobre tecnologia faltante é legítimo e não gera violação.                                                                                                                                                                                                                                       | `molduraAspiracional.ts`                         |
| Gates de saída                                                                            | Idioma por campo e por mercado, espelhando o prompt, mais vazamento de delimitador. `indeterminado` NUNCA reprova.                                                                                                                                                                                                  | `avaliarGates`, `linkedinIdioma.ts`              |
| Falha de gate                                                                             | Havendo tentativa no orçamento, um retry com diagnóstico. Gasto o orçamento: texto para colar cai no fallback, headline reprovada sai da lista (que pode ficar vazia), demais campos registram violação e seguem íntegros. O fallback nunca é re-gateado.                                                           | `linkedinAnalyze.ts`, passo 6                    |
| Orçamento                                                                                 | DUAS chamadas por análise, no máximo, e a Fase 2 não mexeu nesse teto. O caminho de gate reprovado usa a segunda chamada que já era orçada.                                                                                                                                                                         | `AI_MAX_ATTEMPTS`                                |
| Custo                                                                                     | Uma linha de contabilização por tentativa, com desfecho classificado. `usage` indisponível é estado NOMEADO (`sem_resposta`, `corpo_de_erro`, `ausente_no_corpo`), nunca zero medido.                                                                                                                               | `linkedinAnalyze.ts`, `camposDeUsoDaAnalise`     |
| Diagnóstico de retry                                                                      | Só nome de campo, tipo esperado e regra violada. NUNCA o conteúdo reprovado: ele pode carregar material injetado que veio do usuário, e devolvê-lo em posição de instrução desfaria o lote 3.                                                                                                                       | `linkedinDiagnostico.ts`                         |

## 3. Limitações conhecidas

1. **Negação lida como afirmação.** "Seu perfil não menciona Kubernetes" em `resumo`
   conta violação de tecnologia. Limite documentado em `shared/linkedin/molduraAspiracional.ts`,
   na seção de limites conhecidos do `enquadramentoDeTermo`. O custo é um evento a mais
   no painel, nunca texto perdido: a classe 1 não edita. Congelado no golden
   `prosa-tech-inventada`.

2. **Campos com exigência de idioma NÃO gateados nesta rodada:**
   - `bulletsReescritos`: só o mercado exterior teria idioma único, os bullets são curtos
     e cairiam quase sempre em `indeterminado`, e o conteúdo já passa pelo lastro por
     experiência;
   - `sobreReescrito` no mercado `ambos`: misto por desenho (português com parágrafo final
     em inglês), gatear reprovaria o acerto;
   - `headlines` no Brasil e em `ambos`: o prompt abre exceção para o cargo em inglês, então
     a exigência não é de idioma único. Ligar isso exige antes uma régua de "cargo em inglês".

3. **Limites do detector heurístico** (`server/lib/linkedinIdioma.ts`): decide por palavras
   funcionais e diacríticos, com quatro limiares. Texto curto, técnico ou misto equilibrado
   sai `indeterminado` de propósito, e `indeterminado` nunca reprova. A consequência aceita
   é o falso negativo: um Sobre curto no idioma errado passa. Errar para o lado de deixar
   passar é deliberado, porque reprovar por engano custa uma chamada paga e troca texto bom
   por genérico.

4. **Parser.** As limitações de extração continuam as da Fase 1 e não foram tocadas aqui.
   Ver `docs/linkedin-limitacoes-parser.md`, que segue sendo a referência única do assunto.

5. **Rubrica de fidelidade.** `docs/rubrica-fidelidade.md` é régua de julgamento por pessoa,
   não instrumento executável: o harness que a aplica vive fora do repositório e depende de
   leitura humana ou de IA para dar veredito por afirmação. Por isso o lote 7 NÃO construiu
   placar automático sobre os goldens. O que os goldens congelam é o comportamento da
   plataforma, não a qualidade do texto do modelo.

## 4. Backlog para a Fase 3 e para produto

1. **Avisar na interface quando a versão conservadora é servida.** Hoje o usuário recebe o
   fallback determinístico sem saber por quê. Decisão de produto (copy e desenho), não de
   engenharia.
2. **Gatear os campos restantes** da lista da seção 3.2, o que exige a régua de recomendação
   e a de "cargo em inglês".
3. **Promover o detalhe por tentativa para coluna estruturada.** Hoje a trilha
   (`tentativas: 2 | 1 gate_reprovado 3120/640; ...`) vai como texto em
   `ai_usage_logs.error_message`, porque não existe coluna `jsonb` e o lote não podia criar
   migration. Quando migrations voltarem a rodar, esse é o primeiro candidato.
4. **Dois comportamentos congelados com nota nos goldens**, que pedem decisão antes de virar
   correção:
   - descartar TODOS os blocos de bullets não injeta a melhoria de "experiência sem bullets",
     porque a injeção depende de existir experiência sem descrição, e não de a lista ter
     ficado vazia (`bullet-orfao-descartado.json`);
   - as violações de prosa saem no log com `acao: "termo_removido"` embora a classe 1 não
     remova nada (`prosa-tech-inventada.json`).

## 5. Inventário TODO(Ana)

46 marcações de copy à espera da sessão de aprovação visual, nos caminhos do analisador.
Por arquivo:

| Arquivo                                                    | Marcações |
| ---------------------------------------------------------- | --------- |
| `client/src/pages/LinkedinAnalisar.tsx`                    | 19        |
| `client/src/components/linkedin/LinkedinAnalyzerIntro.tsx` | 11        |
| `server/routes/linkedin.ts`                                | 3         |
| `server/lib/linkedinAnalyze.ts`                            | 3         |
| `client/src/components/linkedin/LinkedinStates.tsx`        | 3         |
| `client/src/components/linkedin/SectionReport.test.ts`     | 2         |
| `client/src/components/linkedin/LinkedinScoreHero.tsx`     | 2         |
| `shared/linkedin/schema.ts`                                | 1         |
| `server/lib/linkedinChecks.ts`                             | 1         |
| `client/src/components/linkedin/LinkedinScanCard.tsx`      | 1         |

As três da Fase 2 que entram nessa sessão com prioridade, porque são texto que o usuário
copia e cola no perfil dele:

- `server/lib/linkedinAnalyze.ts`, Sobre conservador (entra quando a sugestão da IA cita algo
  que o perfil não comprova);
- `server/lib/linkedinAnalyze.ts`, mensagem conservadora para recrutador;
- `server/lib/linkedinAnalyze.ts`, bloco de quantidades e `proximoPasso` do prompt.

Para regerar a lista completa com arquivo e linha:

```bash
grep -rn "TODO(Ana)" shared/linkedin server/lib/linkedin* server/routes/linkedin.ts \
  client/src/pages/LinkedinAnalisar.tsx client/src/components/linkedin
```
