# O harness de fidelidade contorna o app

Registro de um buraco conhecido do instrumento, para ele não ser redescoberto daqui a três meses no meio
de outra investigação.

## 1. O que acontece hoje

O harness de fidelidade (fora do repositório, ver `docs/rubrica-fidelidade.md`, seção 5) monta o prompt
importando as funções reais de `server/lib/linkedinAnalyze.ts` e chama a OpenAI com `fetch` direto. Ele
**não passa pela rota** `/api/linkedin/analyze` nem por `analyzeLinkedin`. Consequências, todas medidas:

- **Nada é persistido.** `linkedin_analyses` ficou em 107 linhas ao longo de 107 execuções de medição
  (30 + 8 + 8 + 30 + 31), exatamente o número do fechamento da Fase 0.
- **`pnpm report:ai-usage` não vê nenhuma delas.** O relatório lê `ai_usage_logs`, que só é escrito por
  `logAiUsage`, chamado dentro da rota. O custo das medições é invisível para o instrumento que existe
  justamente para medir custo.
- **O custo real teve que ser derivado.** As únicas 3 linhas de `linkedin-analyzer` com tokens exatos no
  banco (produzidas por uso real da UI) dão US$ 0,001294 por análise; as 31 execuções da Fase 1B custaram
  no máximo US$ 0,0401 por extrapolação, não por medição.

Isso não é um bug do harness: contornar o app é o que permite variar o prompt sem deployar e sem sujar o
histórico de ninguém. É um buraco de **observabilidade de custo**, e o preço dele é que o número de gasto
da plataforma sempre subestima o gasto real por uma quantidade que ninguém sabe.

## 2. Caminhos para fechar

### A. Chamar a rota real com flag de teste

O harness autentica como um usuário de teste e faz `POST /api/linkedin/analyze` com um cabeçalho ou campo
que marca a execução como medição.

- **A favor:** mede o caminho de produção inteiro, incluindo persistência, limite diário e tratamento de
  erro. Zero divergência entre o que se mede e o que o usuário recebe.
- **Contra:** é o caminho mais caro dos três. Exige uma flag nova atravessando rota, middleware de limite
  e escrita, e flag de teste em rota de produção é superfície de abuso: se ela pular o rate limit ou a
  cota, vira um jeito de rodar IA de graça. Também suja `linkedin_analyses` com análises sintéticas, o
  que quebra a contagem que hoje é limpa (107) e contamina qualquer estatística de produto.

### B. Logar em tabela separada

O harness escreve o próprio uso numa tabela `ai_usage_logs_medicao`, com o mesmo formato, e
`report:ai-usage` ganha uma flag para somar ou separar as duas.

- **A favor:** o custo de medição vira visível sem contaminar o dado de produção, e o relatório passa a
  responder "quanto custou a plataforma" e "quanto custou a auditoria" separadamente, que são duas
  perguntas diferentes e as duas úteis. Não toca em rota nem em middleware.
- **Contra:** uma migration, uma tabela e um caminho de escrita que só a ferramenta de medição usa. E
  duplica o formato: se `ai_usage_logs` mudar, a irmã fica para trás.

### C. Arquivo de custo por execução, junto dos artefatos

O harness já grava um diretório por execução com carimbo de tempo (`report.json`, prompts, um JSON por
run). Ele passa a somar o `usage` que a OpenAI devolve em cada chamada e grava o custo no mesmo
`report.json`, usando `estimateCostFromTokens` do próprio projeto.

- **A favor:** é o mais barato de longe. Nenhuma migration, nenhuma rota, nenhum dado de produção tocado.
  Usa a mesma função de preço que o relatório, então os dois números são comparáveis por construção. E o
  custo fica ao lado da medição que o gerou, que é onde ele importa para decidir "vale rodar 30 ou 60?".
- **Contra:** não aparece em `report:ai-usage`. Quem quiser o total gasto no mês precisa somar duas
  fontes na mão.

## 2-bis. `env -i` NÃO isola o `dotenv`: prova errada dada como boa

Registro de um erro de verificação, porque ele é a classe da Fase 3 aplicada a ambiente.

Antes do primeiro push, afirmei que a suíte roda sem ambiente, com esta prova:

```
$ env -i PATH=... CI=true npx vitest run
Test Files 62 passed | Tests 549 passed
```

**A prova estava errada.** `env -i` limpa as variáveis do shell, mas `server/lib/env.ts:5` chama
`config({ quiet: true })` do `dotenv`, que **lê o arquivo `.env` do disco** e não depende do shell. O teste
continuou recebendo `OPENAI_API_KEY` o tempo todo. No CI, onde o `.env` não existe (é gitignored),
`linkedinLastroNaRota.test.ts` quebrou nos 4 testes com `Serviço de IA não configurado`.

**A verificação válida é remover o arquivo:**

```
$ mv .env .env.probe-bak; npx vitest run; mv .env.probe-bak .env
```

O padrão do erro é o de sempre: eu testei a coisa que era fácil de testar em vez da coisa que a afirmação
dizia, e o resultado verde escondeu que o escopo era menor. A diferença aqui é que o "parser cego" era o meu
raciocínio sobre o que `env -i` cobre.

## 3. Recomendação

**Caminho C, e nada além disso por enquanto.**

O motivo é o tamanho do problema. O gasto de medição de toda a auditoria, somando as 107 execuções, fica
na casa de **US$ 0,14**. Construir tabela (B) ou flag de rota (A) para instrumentar catorze centavos é
gastar mais engenharia do que o dado vale, e A ainda abre superfície de abuso numa rota autenticada.

O que realmente faltava não era o total no painel, era **saber quanto custou cada medição na hora de
decidir o tamanho da próxima**. O `report.json` por execução responde isso, custa uma soma de campos que
a OpenAI já devolve, e reusa `estimateCostFromTokens`.

Se algum dia o custo de medição chegar a ordem de grandeza do custo de produto, o caminho B passa a valer,
e a decisão vira dado em vez de palpite: os `report.json` acumulados já terão a série histórica para
justificar. Enquanto isso, `report:ai-usage` continua respondendo com honestidade a pergunta que ele
sempre respondeu, que é quanto os usuários custaram, e este documento existe para ninguém confundir esse
número com o total.

**Não implementado.** Levantamento, como pedido.
