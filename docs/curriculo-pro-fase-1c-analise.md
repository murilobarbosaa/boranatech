# Fase 1C: Análise e Veredito: Tool `resume-builder`

> **Diagnóstico, não correção.** Nenhum prompt foi alterado nesta fase.
> **Modelos testados:** `gpt-4o-mini` (configurado) e `gpt-4o` (re-teste de cenários falhos).
> **Data:** 2026-05-20

## Como esta fase foi executada

- Script: `scripts/test-resume-builder.ts`. Importa o `systemPrompt` canônico de `server/lib/aiTools.ts` e chama OpenAI direto (bypassa Express, auth, Supabase, rate-limit). Mesmo modelo (`gpt-4o-mini`) e mesma `temperature: 0.7` do servidor de produção.
- 8 cenários × multi-turno = 32 turnos com gpt-4o-mini + 6 turnos C2/C7/C8 com gpt-4o.
- Transcrições brutas em `docs/curriculo-pro-fase-1c-relatorio.md` (mini) e `docs/curriculo-pro-fase-1c-relatorio-gpt-4o.md` (4o).
- Custo total: ~$0.05.

## TL;DR

**Veredito: PROMPT PRECISA AJUSTES PONTUAIS antes da UI.**

Bons sinais:

- ZERO travessão (—) ou quase-hífen (–) em 32 turnos. Regra absoluta sustentou.
- Tom masculino consistente. Linguagem jovem BR no ponto.
- Guard rail (fuga de assunto) funcionou no primeiro try.
- Marcador exato emitido (sem variantes).

Problemas críticos a corrigir:

1. **C8: marcador `[[CURRICULO_READY]]` disparado ANTES da confirmação explícita**, bug no PROMPT, reproduz nos dois modelos. Quebraria o fluxo da UI (geração dispara cedo).
2. **C7: inconsistência iniciante-vs-3-anos não é apontada**, risco de gerar currículo com persona errada. Falha pesada no mini, parcial no 4o.
3. **C2: formato Cronológico recomendado pra Big Tech**, viola lógica do próprio prompt. Falha só no mini. 4o recomenda Harvard corretamente.
4. **Coleta inteligente vaza:** o Natechinho pede 2-3x o mesmo dado em turnos consecutivos quando o user responde algo lateral (C8/T3-T4: pediu nome+contato 3 vezes seguidas).

## Verificações transversais

Calculadas automaticamente nas 32 respostas do Natechinho (gpt-4o-mini, run principal).

| Verificação                                                                     | Resultado                         |
| ------------------------------------------------------------------------------- | --------------------------------- |
| Travessão (—) ou quase-hífen (–)                                                | **0 turnos ✅**                   |
| Tom masculino consistente                                                       | **0 problemas ✅**                |
| Marcador `[[CURRICULO_READY]]` em turno intermediário                           | **1 turno ❌** (C8/T10)           |
| Variantes inválidas do marcador (`[CURRICULO_READY]`, "CURRICULO PRONTO", etc.) | **0 ✅**                          |
| Saudação aprovada na primeira mensagem                                          | n/a, a UI emite isso, não a tool |

## Por cenário

### C1: Estudante zerado · ✅ PASS

| Critério                                              | Resultado  | Evidência                                                                                                              |
| ----------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Detecta persona Estudante/Iniciante                   | ✅         | T2: "Vamos montar um currículo que destaque as tuas habilidades e projetos, mesmo sem experiência profissional ainda." |
| Recomenda formato Híbrido                             | ✅         | T3: "Vou te recomendar um formato Híbrido, que é ótimo pra quem tá começando."                                         |
| Reenquadra "experiência" como "Projetos e Atividades" | ⚠️ Parcial | Não usa o termo exato, mas comportamento certo.                                                                        |
| Não pede experiência formal                           | ✅         | T2/T3 só pedem habilidades, projetos, contato.                                                                         |

**Observação:** Em T2 perguntou idioma sem inferir BR pelo contexto (2º ano de CC + estágio = obviamente BR). Não é falha grave porque eventualmente coletou; mas o roteiro pede inferir.

### C2: Sênior pra Big Tech · ⚠️ FAIL parcial (mini) / PASS (4o)

| Critério                                     | gpt-4o-mini                  | gpt-4o               |
| -------------------------------------------- | ---------------------------- | -------------------- |
| Infere inglês                                | ✅                           | ✅                   |
| Infere persona Experiente                    | ✅                           | ✅                   |
| Recomenda Harvard ou Híbrido (alvo Big Tech) | **❌ recomenda Cronológico** | ✅ recomenda Harvard |
| Anuncia inferências                          | ✅ T1                        | ✅ T1                |

**Diagnóstico:** o mini interpreta "8 anos → Cronológico" e ignora "Big Tech → Harvard/Híbrido". O 4o reconcilia os dois sinais e prioriza o alvo, alinhado com a tabela "Lógica de recomendação" do roteiro. A regra existe no prompt mas a ordem de prioridade entre sinais não é explícita o bastante pro modelo mais barato.

Citação do mini (T2): _"Como tu já tem 8 anos de carreira, o formato cronológico vai funcionar bem"._
Citação do 4o (T1): _"Com tua experiência de 8 anos, acho que o formato Harvard vai ser ideal"._

### C3: Transição de carreira · ⚠️ PASS fraco

| Critério                           | Resultado    | Evidência                                                                                                                        |
| ---------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Detecta persona Transição          | ⚠️ Implícito | Em T2 menciona "destaque tuas habilidades e a transição de contador pra analista de dados". Não anuncia a persona como rotulada. |
| Valoriza habilidades transferíveis | ⚠️ Pouco     | T1 pergunta se tem experiência prática em dados (risco de tratar como zerado). Não chama nada de transferível.                   |
| Não trata como estudante zerado    | ✅           | Não usa enquadramento "Projetos e Atividades", mas perguntou nível (júnior efetivo).                                             |
| Recomenda Híbrido                  | ❌           | Em 3 turnos não recomendou formato algum.                                                                                        |

**Diagnóstico:** o prompt menciona "valoriza habilidades transferíveis" pra Transição, mas o modelo NÃO está pegando os 10 anos de contabilidade como ativo transferível. Vê só como "carreira anterior" descartável. Precisa de exemplo no prompt: _"se a pessoa tem N anos em outra área, mencione algo concreto que essas skills agregam (planilhas avançadas, raciocínio analítico, lidar com prazos fiscais, etc.)"_.

### C4: User dá tudo na 1ª mensagem · ⚠️ PASS médio

| Critério                                       | Resultado | Evidência                                                                                                                                      |
| ---------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Reconhece todos os dados de uma vez            | ✅        | T1: chama por "Maria", não repete pergunta sobre nome/contato/área/nível/idioma/formato.                                                       |
| Não repete perguntas sobre o que já foi dito   | ✅        | Pulou pra formação.                                                                                                                            |
| Anuncia inferências (idioma, formato, persona) | ❌        | T1 NÃO ecoa as decisões. Só diz "vamos coletar os dados". Roteiro pede: _"Show, peguei tudo: PT, híbrido, jr 1 ano. Vou seguir pra formação."_ |

**Diagnóstico:** comportamento correto na ação (não repete), mas falha em anunciar. Isso quebra a confiança do user de que o sistema "entendeu". O prompt diz "anuncie a inferência" pro caso de inferência fora-do-óbvio (Mountain View → inglês). Não cobre explicitamente o caso "user mandou pacote completo, ecoe de volta". Precisa de exemplo.

### C5: Fuga de assunto · ✅ PASS

| Critério                                | Resultado | Evidência                                                                      |
| --------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| Dispara guard rail no turno 2 (salário) | ✅        | T2: "Boa pergunta! Mas meu foco aqui é montar teu currículo."                  |
| Redireciona pro Comparador de Carreiras | ✅        | Citado explicitamente.                                                         |
| Retoma o currículo                      | ✅        | Mesmo turno: "Voltando pro teu currículo: em que momento da carreira você tá?" |

Funcionou exatamente como o exemplo do prompt. Sólido.

### C6: User vago / respostas fracas · ⚠️ PASS fraco

| Critério                                   | Resultado                        | Evidência                                                                                                                               |
| ------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| T2 cava com UMA pergunta de aprofundamento | ⚠️ Duas perguntas no mesmo turno | T2: "Que tipo de projeto foi esse? Me conta mais sobre o que tu fez e qual tecnologia tu usou."                                         |
| Tom acolhedor                              | ✅                               | "Massa!", sem cobrar.                                                                                                                   |
| T3 não repete as perguntas anteriores      | ❌                               | T3 faz 3 perguntas seguidas: _"Que tipo de site era? Tinha alguma funcionalidade legal? E que tecnologia tu usou pra criar esse site?"_ |

**Diagnóstico:** o prompt diz claramente _"Uma rodada de aprofundamento por item, não três perguntas seguidas no mesmo turno"_, e o modelo violou no T3. A regra existe mas o exemplo no prompt mostra justamente o caso de UMA pergunta extra ("Que tipo? Que tecnologia? Tinha funcionalidade legal?"), que o modelo está imitando como template, despachando 3 perguntas. **A própria formulação do exemplo está induzindo o erro.**

### C7: Inconsistência · ❌ FAIL (mini) / ⚠️ PASS fraco (4o)

| Critério                            | gpt-4o-mini                                 | gpt-4o                                                               |
| ----------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| Aponta inconsistência com tom suave | **❌ Ignora**                               | ⚠️ Reconhece mudança ("Isso muda um pouco o cenário")                |
| Pergunta o que prevalece            | ❌                                          | ⚠️ Pergunta cargo (júnior/pleno), não persona (iniciante/experiente) |
| Não ignora a contradição            | **❌ Simplesmente recategoriza pra Júnior** | ⚠️ Indireto                                                          |

**Diagnóstico:** comportamento perigoso. O user disse "nunca trabalhei", depois "trabalhei 3 anos como dev Java". O mini só comenta "Show! Então, tu já tem uma experiência legal" e segue. Em produção isso geraria currículo com persona errada ou com dados inconsistentes. O prompt tem o exemplo certo (_"Ó, tu mencionou que tá começando agora, mas listou 3 experiências bem legais..."_), mas o modelo não dispara o comportamento sem âncora mais forte.

Citação do mini (T3): _"Show! Então, tu já tem uma experiência legal na área. Vou considerar que tu se encaixa mais na persona Júnior, já que tem essa bagagem."_

### C8: Fluxo completo até `[[CURRICULO_READY]]` · ❌ FAIL crítico (ambos modelos)

| Critério                                            | gpt-4o-mini         | gpt-4o              |
| --------------------------------------------------- | ------------------- | ------------------- |
| Em TODOS turnos intermediários NÃO emite o marcador | **❌ Emite no T10** | **❌ Emite no T10** |
| Faz resumão antes do marcador no último turno       | ✅                  | ✅                  |
| Emite marcador exato na última linha                | ✅                  | ✅                  |
| Não inventa variações                               | ✅                  | ✅                  |

**Diagnóstico do bug do marcador:** No T10, o user disse "Inglês intermediário, leio bem mas falo travado". Em vez de fazer o resumão e PEDIR confirmação, o modelo já faz o resumão E dispara `[[CURRICULO_READY]]` na mesma mensagem. O T11 (confirmação do user) é desnecessário, o marcador já foi.

Trecho ofensivo do mini (T10):

> _"Se tudo isso estiver certo, vou montar o currículo agora. Leva uns segundinhos!_
>
> _[[CURRICULO_READY]]"_

Trecho ofensivo do 4o (T10):

> _"Vou montar agora, leva uns segundinhos. Resumindo o que coletamos: ..._
>
> _[[CURRICULO_READY]]"_

**Reproduz nos DOIS modelos** → 100% problema de prompt. O prompt diz "Nunca emita o marcador antes da confirmação explícita", mas o modelo trata o próprio resumão como suficiente e antecipa. Falta uma regra mecânica: _"O marcador SÓ pode aparecer numa mensagem que vem IMEDIATAMENTE depois de uma mensagem do user que CONFIRMA explicitamente (palavras como 'pode gerar', 'tá certo', 'manda ver', 'bora', 'confirmado'). Nunca na mesma mensagem em que você apresenta o resumão."_

**Bug secundário do C8:** turnos T3 e T4 repetem o pedido "me passa teu nome completo e um contato" sem avançar, porque o user respondeu sobre "monta do zero" (T3) e "pode ser híbrido" (T4) em vez de dar nome+contato. O Natechinho fica preso esperando o dado faltante em vez de continuar conversando com graça. O 4o-mini repete o mesmo bloco 3 vezes seguidas (T2, T3, T4). O 4o melhora um pouco (varia a frase) mas também fica esperando o mesmo dado. **Falta no prompt:** _"se a resposta do user não trouxe o dado que tu pediu, prossiga com o próximo dado em vez de repetir o pedido."_

## Comparação mini vs 4o: onde modelo importa, onde não

| Falha                                 | Mini | 4o          | Fonte                                 |
| ------------------------------------- | ---- | ----------- | ------------------------------------- |
| Marcador prematuro (C8/T10)           | ❌   | ❌          | **Prompt**                            |
| Inconsistência ignorada (C7)          | ❌   | ⚠️ Parcial  | Prompt + capacidade                   |
| Big Tech → Cronológico (C2)           | ❌   | ✅          | Capacidade (mini não prioriza sinais) |
| Repetição de pedido (C8/T3-T4)        | ❌   | ❌ atenuado | Prompt                                |
| Travessão, tom, variantes do marcador | ✅   | ✅          | Prompt sólido                         |

**Custo dos modelos:**

- gpt-4o-mini: ~$0.0001 por turno (input+output).
- gpt-4o: ~$0.01 por turno (≈ 100x).

Trocar pra 4o resolveria C2 mas não C7 nem C8 (e C8 é o pior). **Conclusão:** mantém gpt-4o-mini, mas o prompt precisa absorver o trabalho extra. Mexer no prompt é mais barato e mais sustentável.

## Sugestões de ajuste no prompt (a serem aprovadas)

Listadas em ordem de gravidade. Cada uma é uma proposta de texto novo pra Fase 1D (correção). **Não aplicadas nesta fase.**

### S1 (crítico): Reformular regra do marcador

Substituir a seção `# Sinal de fim (CRÍTICO)` por algo mais mecânico:

> _O marcador `[[CURRICULO_READY]]` só pode aparecer numa mensagem que vem IMEDIATAMENTE depois de uma mensagem do user CONFIRMANDO explicitamente que pode gerar (sinais: "pode gerar", "tá certo", "tá tudo certo", "manda ver", "bora", "confirmado", "ok pode")._
>
> _NUNCA emita o marcador na MESMA mensagem em que tu mostra o resumão pela primeira vez. O fluxo é sempre: (turno N) tu mostra resumão + pede confirmação → (turno N+1 do user) user confirma → (turno N+1 do assistente) tu emite o marcador._
>
> _Se na tua mensagem aparece o resumão pela primeira vez, ela TERMINA com uma pergunta de confirmação. O marcador fica pro próximo turno._

### S2 (crítico): Apontar inconsistência

Reforçar a seção `## Inconsistências` com gatilho explícito:

> _Sempre que o user disser algo que contradiz uma afirmação anterior dele mesmo (ex: disse "nunca trabalhei" e depois mencionou anos de experiência; disse "iniciante" e depois listou cargos sêniores), pare a coleta no MESMO turno, aponte com tom suave usando a fórmula "tu mencionou X antes, agora apareceu Y, qual prevalece?", e SÓ siga depois que o user esclarecer. Não recategorize a persona em silêncio._

### S3 (médio): Prioridade de sinais pra recomendação de formato

Acrescentar uma linha à seção `## Lógica de recomendação`:

> _Quando há conflito entre sinais (ex: Experiente + Big Tech), o alvo da vaga vence o tempo de carreira. Big Tech / consultoria → Harvard. Vaga regular → siga o tempo de carreira._

### S4 (médio): Eco de pacotes completos

Acrescentar à seção `# REGRA-MÃE`:

> _Quando o user fornecer múltiplos campos numa única mensagem (ex: nome + contato + área + nível + idioma + formato no mesmo turno), ECOE de volta o que tu capturou antes de pedir o próximo dado. Exemplo: "Show, Maria! Peguei tudo: dev frontend júnior, 1 ano, São Paulo, currículo em PT, formato híbrido. Bora seguir pra tua formação."_

### S5 (médio): Não repetir pedido quando user responde lateral

Acrescentar à seção `# REGRA-MÃE` ou `## Coleta: enriquecimento de respostas fracas`:

> _Se tu pediu um dado e o user respondeu OUTRA COISA (sem trazer o dado pedido), NÃO repita o pedido textualmente no próximo turno. Aceite a resposta lateral, integre, e siga com a próxima pergunta natural do fluxo. O dado faltante volta no resumão final pra ser preenchido._

### S6 (leve): Exemplo de aprofundamento com UMA pergunta

Trocar o exemplo da seção `## Coleta: enriquecimento de respostas fracas`. Hoje:

> _Pessoa: "fiz um site" / Você: "Massa! Que tipo de site? Que tecnologia usou? Tinha alguma funcionalidade legal que tu lembra?"_

O exemplo MOSTRA 3 perguntas seguidas, induzindo o modelo a fazer 3. Trocar por exemplo com UMA pergunta concreta:

> _Pessoa: "fiz um site" / Você: "Massa! Me conta uma coisa só, qual a tecnologia que tu usou nele?"_

### S7 (leve): Habilidades transferíveis pra Transição

Acrescentar à seção `# As 4 personas`, linha Transição:

> _Pra Transição, ALWAYS reconheça pelo menos uma habilidade concreta da carreira anterior que agrega (ex: contador → raciocínio analítico, lidar com dados/planilhas, organização. Professor → comunicação, didática. Vendedor → negociação, lidar com cliente). Use isso pra justificar por que a transição faz sentido._

## Próximos passos sugeridos

1. **Fase 1D, Correção do prompt:** aplicar S1, S2, S3 (críticos/médios), depois rodar `pnpm tsx scripts/test-resume-builder.ts` de novo e validar que C7 e C8 passam. Critério de saída: 0 marcadores prematuros, C7 aponta inconsistência, C2 recomenda Harvard/Híbrido pra Big Tech.
2. **Fase 1E** (opcional, se sobrar), aplicar S4-S7. Eles afetam UX mas não correção.
3. **Fase 2, UI:** o restante do prompt é sólido o suficiente pra UI consumir, desde que S1 e S2 estejam aplicados.

## Reprodutibilidade

```bash
# baseline (gpt-4o-mini, todos os cenários)
pnpm tsx scripts/test-resume-builder.ts

# re-teste de um cenário específico
pnpm tsx scripts/test-resume-builder.ts --only=C8

# trocar modelo (4o tem TPM 30k, exige delay)
pnpm tsx scripts/test-resume-builder.ts --model=gpt-4o --only=C7,C8 --delay=7000
```

Outputs:

- `docs/curriculo-pro-fase-1c-relatorio.md` (transcrições brutas, gpt-4o-mini)
- `docs/curriculo-pro-fase-1c-relatorio-gpt-4o.md` (transcrições brutas, gpt-4o)
- este arquivo (`docs/curriculo-pro-fase-1c-analise.md`).
