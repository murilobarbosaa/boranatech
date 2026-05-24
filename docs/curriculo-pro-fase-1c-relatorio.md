# Fase 1C — Relatório de Diagnóstico: resume-builder

> **Modelo:** `gpt-4o-mini` · **Temperature:** 0.7 · **Gerado em:** 2026-05-21T20:17:13.771Z

Este relatório foi produzido executando 8 conversas simuladas contra o systemPrompt canônico de `server/lib/aiTools.ts` (sem passar pelo Express, auth, Supabase). Nenhum prompt foi alterado nesta fase.

## Verificações transversais

| Verificação | Resultado |
|---|---|
| Turnos do Natechinho totais | 36 |
| Turnos com travessão (—) ou quase-hífen (–) | 0 ✅ |
| Turnos com problema de tom masculino | 0 ✅ |
| Marcador [[CURRICULO_READY]] emitido prematuramente | 0 ✅ |
| Variantes inválidas do marcador detectadas | 0 ✅ |
| Turnos com mais de 1 interrogação (regra S6) | 10 ❌ |
| Total de "?" em respostas do Natechinho | 45 (média 1.25 por turno) |

---

## C1 · Estudante zerado

**Tempo total:** 5.4s · **Turnos:** 3

### Transcrição

**T1 · user (2.3s):** oi, tô no 2º ano de ciência da computação e nunca trabalhei, quero meu primeiro estágio

**T1 · Natechinho:**

```
Oi! Massa, é legal ver que tu tá buscando o primeiro estágio. Ciência da computação é uma área cheia de oportunidades. Tem algum tipo de estágio ou área específica que tu gostaria de atuar, tipo desenvolvimento, dados ou algo relacionado?
```

**T2 · user (1.5s):** queria área de desenvolvimento web

**T2 · Natechinho:**

```
Show! Desenvolvimento web é uma ótima escolha e tá super em alta. Bora montar teu currículo pra isso. 

Qual é o idioma que tu preferiria usar no currículo? Português ou inglês?
```

**T3 · user (1.7s):** português mesmo, vaga aqui no Brasil

**T3 · Natechinho:**

```
Beleza, português então! Agora, vou te recomendar um formato. O Híbrido é o mais indicado pra ti. Ele destaca tuas habilidades e projetos logo no topo, o que é massa pra quem tá começando. 

Tu quer montar o currículo do zero aqui ou já tem um que gostaria de reescrever?
```

### Critérios do cenário

- [ ] Detecta persona Estudante/Iniciante
- [ ] Recomenda formato Híbrido
- [ ] Reenquadra 'experiência' como 'Projetos e Atividades' ou não exige experiência formal
- [ ] Não pede experiência formal de quem nunca trabalhou

### Sinais automáticos

- Travessão/quase-hífen em turnos: nenhum ✅
- Tom masculino: ok ✅
- Marcador prematuro: nenhum ✅
- Variantes inválidas do marcador: nenhuma ✅
- Interrogações por turno (S6): T1=1, T2=2❌, T3=1 (1 turno(s) com >1 ❌)

---

## C2 · Sênior pra Big Tech

**Tempo total:** 5.4s · **Turnos:** 3

### Transcrição

**T1 · user (1.7s):** preciso refazer meu CV pra aplicar pra Google em Mountain View, sou dev há 8 anos

**T1 · Natechinho:**

```
Massa, Google Mountain View é um alvo de peso. Vou montar em inglês, já que é pra fora. Pra ficar bom, preciso entender qual posição tu tá buscando lá. Tu pode me contar?
```

**T2 · user (2.5s):** Senior Software Engineer no time de infra

**T2 · Natechinho:**

```
Show, então vamos montar um currículo focado pra essa vaga de Senior Software Engineer na área de infraestrutura. Vou usar o formato Harvard, que é mais enxuto e direto ao ponto, ideal pra vagas concorridas como essa. 

Pra começar, me diz se tu tem algum contato extra que queira incluir, tipo telefone, LinkedIn ou GitHub.
```

**T3 · user (1.2s):** monta do zero mesmo, melhor refazer tudo

**T3 · Natechinho:**

```
Beleza, montar do zero é uma ótima escolha! Vamos fazer isso. 

Começando com os contatos. Tu tem algum telefone, LinkedIn ou GitHub que gostaria de adicionar ao currículo?
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
- Interrogações por turno (S6): T1=1, T2=0, T3=1 ✅

---

## C3 · Transição de carreira

**Tempo total:** 5.3s · **Turnos:** 3

### Transcrição

**T1 · user (1.9s):** trabalhei 10 anos como contador, tô migrando pra área de dados

**T1 · Natechinho:**

```
Show, legal saber que tu tá fazendo essa transição! A experiência como contador pode trazer várias habilidades boas, como análise de dados e atenção a detalhes. 

Me conta uma coisa, qual a posição que tu tá mirando na área de dados? Tipo, analista de dados, cientista de dados, ou algo mais específico?
```

**T2 · user (1.4s):** quero vaga júnior de analista de dados no Brasil

**T2 · Natechinho:**

```
Massa, então vamos focar em uma vaga júnior de analista de dados. Agora, me diz uma coisa: tu tem um currículo já ou quer montar um do zero?
```

**T3 · user (1.9s):** tenho SQL básico e tô estudando Python há 6 meses

**T3 · Natechinho:**

```
Beleza, peguei que tu tem SQL básico e tá estudando Python. Isso é ótimo pra área de dados! Agora, me conta: tu tem algum contato extra que gostaria de incluir no currículo, como telefone, LinkedIn ou GitHub?
```

### Critérios do cenário

- [ ] Detecta persona Transição
- [ ] Valoriza habilidades transferíveis da carreira anterior
- [ ] Não trata como estudante zerado
- [ ] Recomenda Híbrido com razão alinhada (skills transferíveis)

### Sinais automáticos

- Travessão/quase-hífen em turnos: nenhum ✅
- Tom masculino: ok ✅
- Marcador prematuro: nenhum ✅
- Variantes inválidas do marcador: nenhuma ✅
- Interrogações por turno (S6): T1=2❌, T2=1, T3=1 (1 turno(s) com >1 ❌)

---

## C4 · User dá tudo na 1ª mensagem

**Tempo total:** 5.5s · **Turnos:** 3

### Transcrição

**T1 · user (1.5s):** sou a Maria, maria@email.com, (11) 99999-9999, dev frontend júnior há 1 ano em São Paulo, quero vaga efetiva, currículo em português, formato híbrido

**T1 · Natechinho:**

```
Oi, Maria! Massa que tu já trouxe essas informações. Então, tu tá buscando uma vaga efetiva como dev frontend júnior, currículo em português e no formato híbrido. 

Agora, me conta um pouco sobre a tua formação. Que curso ou grau tu fez e onde?
```

**T2 · user (2.2s):** minha formação é técnico em informática 2022 e curso superior em ADS na FATEC, em andamento desde 2023

**T2 · Natechinho:**

```
Show, peguei tudo! Tu tem formação técnica em informática concluída em 2022 e tá fazendo um curso superior em Análise e Desenvolvimento de Sistemas na FATEC, que começou em 2023. 

Agora, vamos falar sobre as tuas experiências. Como dev frontend júnior, onde tu trabalhou? Qual foi a empresa ou projeto?
```

**T3 · user (1.8s):** experiência: dev frontend na empresa X de jan/2024 até hoje, mexo com React e TypeScript no produto principal

**T3 · Natechinho:**

```
Beleza, Maria! Anotei que tu tá trabalhando como dev frontend na empresa X desde janeiro de 2024, usando React e TypeScript no produto principal. 

Agora, me conta um pouco sobre as tuas responsabilidades e se teve alguma conquista ou resultado legal que tu lembra desse trabalho.
```

### Critérios do cenário

- [ ] Reconhece nome, contato, área, nível, idioma, formato de uma vez
- [ ] Não repete perguntas sobre o que já foi dito
- [ ] Pula direto pra coleta de formação/experiências

### Sinais automáticos

- Travessão/quase-hífen em turnos: nenhum ✅
- Tom masculino: ok ✅
- Marcador prematuro: nenhum ✅
- Variantes inválidas do marcador: nenhuma ✅
- Interrogações por turno (S6): T1=1, T2=2❌, T3=0 (1 turno(s) com >1 ❌)

---

## C5 · Fuga de assunto

**Tempo total:** 4.3s · **Turnos:** 3

### Transcrição

**T1 · user (1.2s):** oi

**T1 · Natechinho:**

```
Oi! Tudo certo por aí? Tô aqui pra te ajudar a montar teu currículo. Como tá teu momento de carreira? O que você tá buscando?
```

**T2 · user (1.8s):** quanto ganha um dev pleno?

**T2 · Natechinho:**

```
Boa pergunta! Mas meu foco aqui é montar teu currículo. Pra ver faixas salariais, dá uma olhada no Comparador de Carreiras aqui no BoraNaTech. Voltando pro teu currículo: me conta um pouco sobre o que você tá buscando, tipo estágio, primeiro emprego ou já vai pra uma vaga júnior?
```

**T3 · user (1.3s):** tá, depois eu vejo. vamos voltar pro currículo. sou estudante de TI

**T3 · Natechinho:**

```
Show, beleza! Então, você tá na vibe de montar um currículo pra um estágio ou um primeiro emprego, certo? Me conta: qual área ou objetivo profissional você tem em mente?
```

### Critérios do cenário

- [ ] Dispara guard rail no turno 2 (salário)
- [ ] Redireciona pro Comparador de Carreiras
- [ ] Retoma o currículo no mesmo turno ou no seguinte

### Sinais automáticos

- Travessão/quase-hífen em turnos: nenhum ✅
- Tom masculino: ok ✅
- Marcador prematuro: nenhum ✅
- Variantes inválidas do marcador: nenhuma ✅
- Interrogações por turno (S6): T1=3❌, T2=1, T3=2❌ (2 turno(s) com >1 ❌)

---

## C6 · User vago / respostas fracas

**Tempo total:** 3.8s · **Turnos:** 3

### Transcrição

**T1 · user (1.3s):** quero um currículo

**T1 · Natechinho:**

```
Beleza! Tô aqui pra te ajudar com isso. Me conta um pouco sobre o teu momento de carreira. Tu tá buscando estágio, trainee ou já vai direto pra uma vaga júnior efetiva?
```

**T2 · user (1.0s):** fiz um projeto

**T2 · Natechinho:**

```
Massa, projetos são super importantes! Me conta mais sobre esse projeto. Qual era o nome dele e o que ele fazia?
```

**T3 · user (1.4s):** ah é, um site

**T3 · Natechinho:**

```
Show! E em uma frase, o que esse site faz?
```

### Critérios do cenário

- [ ] No turno 2 cava com UMA pergunta de aprofundamento (não 3 simultâneas)
- [ ] Tom acolhedor, não cobra como manual
- [ ] No turno 3 continua coleta sem repetir as 3 perguntas anteriores

### Sinais automáticos

- Travessão/quase-hífen em turnos: nenhum ✅
- Tom masculino: ok ✅
- Marcador prematuro: nenhum ✅
- Variantes inválidas do marcador: nenhuma ✅
- Interrogações por turno (S6): T1=1, T2=1, T3=1 ✅

---

## C7 · Inconsistência

**Tempo total:** 5.9s · **Turnos:** 3

### Transcrição

**T1 · user (2.0s):** sou iniciante, nunca trabalhei na área

**T1 · Natechinho:**

```
Show, é bem comum estar começando agora! Tô aqui pra te ajudar. Me diz uma coisa: tu tá buscando estágio, trainee, ou já quer ir direto pra uma vaga júnior efetiva?
```

**T2 · user (1.8s):** tô fazendo faculdade de Sistemas de Informação

**T2 · Natechinho:**

```
Massa, Systems de Informação é uma ótima área! Agora, me conta: quais matérias ou tópicos tu tem curtido mais até agora? Isso pode ajudar a definir melhor o teu objetivo profissional.
```

**T3 · user (2.0s):** ah, esqueci, trabalhei 3 anos na empresa X como desenvolvedor Java

**T3 · Natechinho:**

```
Opa, deixa eu alinhar uma coisa. Tu falou que era iniciante e nunca trabalhou na área no começo, agora apareceu que trabalhou 3 anos como desenvolvedor Java. Qual desses dois reflete melhor tua situação hoje?
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
- Interrogações por turno (S6): T1=1, T2=1, T3=1 ✅

---

## C8 · Fluxo completo até [[CURRICULO_READY]]

**Tempo total:** 24.8s · **Turnos:** 11

### Transcrição

**T1 · user (1.6s):** tô buscando minha primeira vaga, terminei bootcamp de programação ano passado

**T1 · Natechinho:**

```
Massa, parabéns por ter concluído o bootcamp! Isso é um ótimo passo. Agora, me conta, tu tá buscando estágio, trainee ou já quer partir pra uma vaga júnior efetiva?
```

**T2 · user (2.1s):** quero ser dev backend, alvo empresas BR, currículo em português

**T2 · Natechinho:**

```
Beleza, então vamos montar um currículo em português focado em dev backend. O formato mais recomendado pra ti é o híbrido, porque ele destaca as tuas habilidades logo de cara, o que é ótimo pra quem tá começando. Bora seguir pra coleta de dados?

Primeiro, tem algum contato extra além do email do cadastro que tu gostaria de adicionar? Tipo telefone, LinkedIn ou GitHub?
```

**T3 · user (1.4s):** monta do zero, não tenho currículo antigo

**T3 · Natechinho:**

```
Show, então vamos montar do zero. 

Me diz, tu quer adicionar algum contato extra? Telefone, LinkedIn ou GitHub?
```

**T4 · user (1.3s):** pode ser híbrido, parece que faz sentido pra mim

**T4 · Natechinho:**

```
Beleza, então vamos com o formato híbrido. Agora, sobre os contatos, tu tem algum telefone, LinkedIn ou GitHub que quer adicionar?
```

**T5 · user (2.2s):** Lucas Silva, lucas.silva@email.com, (11) 98765-4321, github.com/lucassilva, São Paulo SP, sem LinkedIn ainda

**T5 · Natechinho:**

```
Peguei tudo, Lucas! Aqui vai o que eu anotei: 

- Nome: Lucas Silva
- Email: lucas.silva@email.com
- Telefone: (11) 98765-4321
- GitHub: github.com/lucassilva
- Cidade: São Paulo SP

Agora, me conta um pouco sobre o teu objetivo profissional. Além de dev backend, tem algo mais que tu gostaria de destacar?
```

**T6 · user (2.6s):** Bootcamp Full Stack na Rocketseat 2024-2025 e ensino médio completo em 2020 na ETEC Itaquera

**T6 · Natechinho:**

```
Legal, Lucas! Então vamos lá. 

Aqui estão as informações que eu anotei sobre a tua formação:

1. Bootcamp Full Stack na Rocketseat, período 2024-2025.
2. Ensino médio completo na ETEC Itaquera, concluído em 2020.

Agora, vamos pra próxima etapa. Tu já teve alguma experiência ou projeto que gostaria de adicionar? Pode ser algo do bootcamp, projetos pessoais, ou qualquer atividade que mostre suas habilidades. Me conta um pouco!
```

**T7 · user (1.9s):** Não tenho experiência formal ainda, só projetos

**T7 · Natechinho:**

```
Sem problema, Lucas! Projetos são super importantes e mostram bem o que tu sabe fazer. Me conta então sobre um ou dois projetos que tu realizou. 

Começando pelo primeiro, qual o nome do projeto e uma breve descrição do que ele faz?
```

**T8 · user (2.8s):** Projeto 1: API REST em Node.js com PostgreSQL pra controle de gastos pessoais, deploy na Railway. Projeto 2: clone simples do Twitter feito durante o bootcamp com React no front e Express no back

**T8 · Natechinho:**

```
Show, Lucas! Aqui estão os detalhes dos projetos que tu compartilhou:

**Projeto 1**
- Nome: API REST em Node.js
- Descrição: Controle de gastos pessoais
- Tecnologias: Node.js, PostgreSQL
- Deploy: Railway

**Projeto 2**
- Nome: Clone simples do Twitter
- Descrição: Feito durante o bootcamp
- Tecnologias: React no front, Express no back

Agora, só pra finalizar essa parte, quais habilidades tu gostaria de destacar no currículo? Pode ser linguagens de programação, frameworks, ferramentas, ou qualquer coisa que tu se sinta confortável.
```

**T9 · user (2.1s):** Habilidades: JavaScript, TypeScript, Node.js, React, PostgreSQL, Git, Docker básico

**T9 · Natechinho:**

```
Beleza, Lucas! Aqui estão as habilidades que tu quer destacar:

- JavaScript
- TypeScript
- Node.js
- React
- PostgreSQL
- Git
- Docker básico

Agora, pra fechar, tu fala algum idioma além do português? Se sim, qual é o nível?
```

**T10 · user (5.7s):** Inglês intermediário, leio bem mas falo travado

**T10 · Natechinho:**

```
Show, Lucas! Então vamos adicionar isso:

- Idioma: Inglês
- Nível: Intermediário (leitura boa, fala travada)

Agora, vou fazer um resumão do que coletamos até agora pra te mostrar como vai ficar o currículo. Aqui vai:

- Nome: Lucas Silva
- Email: lucas.silva@email.com
- Telefone: (11) 98765-4321
- GitHub: github.com/lucassilva
- Cidade: São Paulo SP
- Área/Objetivo: Dev Backend
- Formato: Híbrido
- Idioma: Português
- Habilidades: JavaScript, TypeScript, Node.js, React, PostgreSQL, Git, Docker básico
- Formação:
  - Bootcamp Full Stack na Rocketseat (2024-2025)
  - Ensino médio completo na ETEC Itaquera (2020)
- Projetos:
  - API REST em Node.js para controle de gastos pessoais (Node.js, PostgreSQL, deploy na Railway)
  - Clone simples do Twitter (React no front, Express no back)

Tá tudo certo? Posso gerar o currículo?
```

**T11 · user (1.1s):** Tá tudo certo, pode gerar o currículo agora

**T11 · Natechinho:**

```
Vou montar agora, leva uns segundinhos. 

[[CURRICULO_READY]]
```

### Critérios do cenário

- [ ] Em TODOS turnos intermediários NÃO emite [[CURRICULO_READY]]
- [ ] Faz resumão antes do marcador no último turno
- [ ] Emite [[CURRICULO_READY]] exatamente assim (colchetes duplos), sozinho, na última linha
- [ ] Não inventa variações do marcador

### Sinais automáticos

- Travessão/quase-hífen em turnos: nenhum ✅
- Tom masculino: ok ✅
- Marcador prematuro: nenhum ✅
- Variantes inválidas do marcador: nenhuma ✅
- Marcador exato na última linha do último turno: sim ✅
- Interrogações por turno (S6): T1=1, T2=3❌, T3=2❌, T4=1, T5=1, T6=1, T7=1, T8=1, T9=2❌, T10=2❌, T11=0 (4 turno(s) com >1 ❌)

---

## C9 · Experiência mencionada sem período (Fase 3.1: cava E aceita ausência)

**Tempo total:** 7.0s · **Turnos:** 4

### Transcrição

**T1 · user (1.9s):** tô buscando vaga de dev backend júnior, alvo BR

**T1 · Natechinho:**

```
Massa! Um dev backend júnior é uma ótima escolha. Vou montar teu currículo em português, que é o ideal pra vagas no Brasil. 

Agora, me fala: tu tem algum contato extra que quer adicionar, tipo telefone, LinkedIn ou GitHub?
```

**T2 · user (1.7s):** trabalhei na Acme Solutions como Desenvolvedora Backend Júnior

**T2 · Natechinho:**

```
Show, peguei que tu trabalhou na Acme Solutions como Desenvolvedora Backend Júnior. Agora, me conta um pouco mais sobre essa experiência. Qual foi o período que tu trabalhou lá e quais eram as tuas principais responsabilidades?
```

**T3 · user (1.6s):** não lembro, prefiro não cravar data

**T3 · Natechinho:**

```
Sem problema! Vamos deixar a data em aberto. E sobre as responsabilidades, o que tu fazia na Acme Solutions? Alguma conquista ou projeto que tu se orgulha de ter feito lá?
```

**T4 · user (1.8s):** trabalhei com Node.js e PostgreSQL no time de produto, mexi com API REST

**T4 · Natechinho:**

```
Legal, então tu trabalhou com Node.js e PostgreSQL, focando em API REST no time de produto. Isso é bem relevante! 

Vamos seguir pra próxima parte. Me conta sobre a tua formação. Qual curso ou grau tu fez, em qual instituição, e se tá concluído ou em andamento?
```

### Critérios do cenário

- [ ] T1: Natechinho reage e pede o próximo dado natural (não é o foco do cenário)
- [ ] T2: Natechinho registra empresa+cargo e CAVA o período com UMA pergunta (ex: 'quando foi isso?')
- [ ] T3: user resiste, Natechinho ACEITA e segue (NÃO repete pedido de período, NÃO trava)
- [ ] T4: Natechinho avança pra responsabilidades, sem voltar a pedir período
- [ ] Nenhum turno do Natechinho empilha 2+ perguntas sobre tópicos diferentes
- [ ] Anti-regressão: zero travessão, sem misturar você/tu

### Sinais automáticos

- Travessão/quase-hífen em turnos: nenhum ✅
- Tom masculino: ok ✅
- Marcador prematuro: nenhum ✅
- Variantes inválidas do marcador: nenhuma ✅
- Interrogações por turno (S6): T1=1, T2=1, T3=2❌, T4=1 (1 turno(s) com >1 ❌)

---

## Veredito geral

_Preenchido manualmente abaixo após inspeção das transcrições._

### Decisão
- [ ] Prompt está pronto pra UI (Fase 2)
- [ ] Prompt precisa ajustes pontuais (listar abaixo)
- [ ] Prompt tem problema estrutural (rever roteiro)

### Sugestões de ajuste (se houver)
- (nenhuma ainda)
