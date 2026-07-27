# TTS (ElevenLabs) e o painel de custo

Levantamento. **Nada implementado.**

## Quanto gasta hoje: zero, por dois motivos independentes

**1. A integração nunca rodou.** `interview-tts` não tem **uma única linha** em `ai_usage_logs` em todo o
histórico (892 linhas, 17 ferramentas distintas, nenhuma é `interview-tts`). A causa é simples: as variáveis
`ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID` **não estão definidas no `.env`**. Sem elas,
`server/lib/elevenLabsTts.ts:39-41` lança `tts_unavailable` antes de qualquer chamada de rede. A feature está
desligada, não subutilizada.

**2. Mesmo ligada, não há fatura.** O comentário em `server/routes/interview.ts:1801-1803` registra a decisão:
"Custo 0 com consumo AUDITAVEL: parceria de embaixador (sem fatura)". Enquanto a parceria valer, o gasto em
dólar é literalmente zero, e qualquer número que o painel mostrasse seria ficção.

## O que já está instrumentado (e está certo)

Quando ligar, o TTS já grava consumo auditável, sem custo inventado:

- `tool: "interview-tts"`, `model: env.elevenLabsModelId` (default `eleven_multilingual_v2`)
- `inputChars: spokenText.length` — a unidade de cobrança da ElevenLabs é **caractere**, então o dado certo já
  é o que está sendo gravado
- `TTS_MAX_CHARS = 600` como teto defensivo por chamada, com 422 em vez de truncar
  (`server/routes/interview.ts:114`)
- quota diária própria via `checkInterviewTtsDailyLimit`

Ou seja: **a parte difícil já foi feita**. Falta só decidir se e quando converter caractere em dólar.

## Caminho mais barato para aparecer no painel

Já existe `NON_TEXT_MODELS` em `server/lib/aiTools.ts`, que hoje devolve `null` para modelo não-texto e zera o
custo de propósito. O caminho de menor esforço é acrescentar uma tabela de preço **por caractere** ao lado da
tabela por token:

```
CHAR_PRICING: Record<string, { perMillionChars: number }>
estimateCostFromChars(chars, model)   // usada só pelas tools de audio
```

São umas 15 linhas, sem migration: `inputChars` e `model` já estão gravados em todas as linhas futuras, então o
painel passaria a somar o TTS junto com o resto, e o histórico (vazio) não precisa de backfill.

## Recomendação: **não fazer isso agora**

Três razões, em ordem de peso:

1. **Mostraria custo onde não há custo.** Com a parceria de embaixador, o painel exibiria um valor que ninguém
   paga. Isso é o mesmo defeito da régua inflada que a Fase 0 acabou de remover, só que na direção oposta: um
   número plausível e falso é pior que um zero honesto.
2. **O preço por caractere depende do plano**, e o plano hoje é uma parceria, não uma tabela pública aplicável.
   Cadastrar um preço agora é cadastrar um chute.
3. **O consumo já é auditável** por `inputChars`, que é o que realmente importa enquanto a cobrança é zero:
   permite responder "estamos perto do limite da parceria?" sem inventar dólar.

### O que fazer em vez disso, quando o TTS for ligado

Um painel de **consumo**, não de custo: total de caracteres falados por período e por usuário, ao lado da quota
diária que já existe. É a métrica que responde a pergunta real ("cabe na parceria?") e não depende de preço.

### O gatilho para revisitar

Converter caractere em dólar passa a valer a pena quando **a parceria terminar ou virar plano pago**. Nesse dia:
adicione a tabela por caractere, o preço do plano contratado, e o TTS entra no painel junto com o resto. Até lá,
`NON_TEXT_MODELS` devolvendo zero explícito é o comportamento correto.
