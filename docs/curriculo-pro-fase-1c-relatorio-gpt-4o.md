# Fase 1C: Relatório de Diagnóstico: resume-builder

> **Modelo:** `gpt-4o` · **Temperature:** 0.7 · **Gerado em:** 2026-05-20T19:24:28.105Z

Este relatório foi produzido executando 8 conversas simuladas contra o systemPrompt canônico de `server/lib/aiTools.ts` (sem passar pelo Express, auth, Supabase). Nenhum prompt foi alterado nesta fase.

## Verificações transversais

| Verificação                                         | Resultado |
| --------------------------------------------------- | --------- |
| Turnos do Natechinho totais                         | 6         |
| Turnos com travessão (—) ou quase-hífen (–)         | 0 ✅      |
| Turnos com problema de tom masculino                | 0 ✅      |
| Marcador [[CURRICULO_READY]] emitido prematuramente | 0 ✅      |
| Variantes inválidas do marcador detectadas          | 0 ✅      |

---

## C2 · Sênior pra Big Tech

**Tempo total:** 15.6s · **Turnos:** 3

### Transcrição

**T1 · user (2.7s):** preciso refazer meu CV pra aplicar pra Google em Mountain View, sou dev há 8 anos

**T1 · Natechinho:**

```
Massa, Google Mountain View é um alvo de peso. Pra ficar bom, vou montar em inglês e num formato que rola bem em Big Tech. Com tua experiência de 8 anos, acho que o formato Harvard vai ser ideal, já que dá pra destacar bem teus resultados. Antes de continuar, me conta: tu tá aplicando pra qual posição lá?
```

**T2 · user (1.6s):** Senior Software Engineer no time de infra

**T2 · Natechinho:**

```
Show, posição de Senior Software Engineer em infra é bem desafiadora. Vamos montar um currículo que destaque tuas conquistas e habilidades nessa área. Agora, me diz: tu quer começar do zero aqui comigo ou já tem um currículo pra reescrever?
```

**T3 · user (1.2s):** monta do zero mesmo, melhor refazer tudo

**T3 · Natechinho:**

```
Beleza, vamos montar do zero então. Bora começar pelo básico: teu nome completo e os contatos (email, telefone, LinkedIn, GitHub). Pode mandar!
```

### Critérios do cenário

- [ ] Infere inglês (Mountain View / Google)
- [ ] Infere persona Experiente
- [ ] Recomenda Harvard ou Híbrido (alvo Big Tech)
- [ ] Anuncia inferências em vez de perguntar de novo

### Sinais automáticos

- Travessão/quase-hífen em turnos: nenhum ✅
- Tom masculino: ok ✅
- Marcador prematuro: nenhum ✅
- Variantes inválidas do marcador: nenhuma ✅

---

## C7 · Inconsistência

**Tempo total:** 14.5s · **Turnos:** 3

### Transcrição

**T1 · user (1.0s):** sou iniciante, nunca trabalhei na área

**T1 · Natechinho:**

```
Massa, então a gente vai focar em destacar tuas habilidades e qualquer projeto ou atividade que tu já tenha feito. Vamos começar com o básico. Tu tá buscando estágio ou trainee, ou já vai direto pra júnior efetivo? E tem alguma área específica de TI que tu tá mais interessado?
```

**T2 · user (1.2s):** tô fazendo faculdade de Sistemas de Informação

**T2 · Natechinho:**

```
Perfeito! Isso já me dá uma boa ideia do teu foco. Agora, me conta: tu tá buscando estágio ou uma vaga de trainee? Ou já tá pensando em algo mais efetivo?
```

**T3 · user (2.2s):** ah, esqueci, trabalhei 3 anos na empresa X como desenvolvedor Java

**T3 · Natechinho:**

```
Legal, então tu já tem uma experiência massa como desenvolvedor Java! Isso muda um pouco o cenário. Tu te considera mais júnior ou já pensa em vagas de nível pleno?
```

### Critérios do cenário

- [ ] Aponta inconsistência com tom suave no turno 3 (sem acusar)
- [ ] Pergunta o que prevalece (iniciante vs 3 anos)
- [ ] Não simplesmente ignora a contradição

### Sinais automáticos

- Travessão/quase-hífen em turnos: nenhum ✅
- Tom masculino: ok ✅
- Marcador prematuro: nenhum ✅
- Variantes inválidas do marcador: nenhuma ✅

---

## Veredito geral

_Preenchido manualmente abaixo após inspeção das transcrições._

### Decisão

- [ ] Prompt está pronto pra UI (Fase 2)
- [ ] Prompt precisa ajustes pontuais (listar abaixo)
- [ ] Prompt tem problema estrutural (rever roteiro)

### Sugestões de ajuste (se houver)

- (nenhuma ainda)
