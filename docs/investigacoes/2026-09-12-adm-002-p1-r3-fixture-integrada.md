# ADM-002-P1-R3 - fixture da regressão integrada

Data: 12/09/2026.

## Estado validado

- Checkout: `/tmp/boranatech-adm002`.
- Branch: `feat/adm-002-atencao-v1`.
- Base e HEAD inicial/final: `1ac2ce35c398009805cfad1780f7aa185080a9e2`.
- O working tree inicial continha os 28 arquivos aprovados de P1, R1 e R2, sem commit.
- O pacote R2 manteve SHA-256 `2fd4351bcc7ca6649eab2cf04c44ca8e03b10561c00d3792d57dc829617c41e8`.
- Os 40 hashes do manifesto e os 28 arquivos de `fontes/` conferiram byte a byte antes da edição.

## Diagnóstico e correção

Os dois testes de `regressão integrada de custo medido na Visão` herdavam de `base()` uma linha de `profiles` sem `user_id` e `count: 40`. O coletor real de `/overview-series` exige identidade estável e correspondência entre o total exato e as linhas materializadas. A rota falhava corretamente com `identidade_de_linha_ausente` antes das asserções de custo.

A fixture padrão permaneceu intacta porque o total 40 atende aos testes antigos dos cards. Somente o bloco integrado ganhou `prepararCustoIntegrado`, que configura:

- uma linha de perfil;
- `user_id: "u1"`;
- `created_at` dentro da janela;
- `count: 1`;
- o mesmo log de IA usado pelos três endpoints.

Cada cenário agora verifica `status === 200` de `/overview`, `/overview-series` e `/attention` antes de ler `body.data`. Todas as asserções de reconciliação da R2 foram preservadas.

Nenhum arquivo de produção foi alterado. `classificarCustoDeIa`, em `server/lib/aiUsageStats.ts`, continua sendo a regra única. A busca final não encontrou parser direto de `cost_estimate` em produção.

## Validação efetiva

### Testes aprovados

- Dezoito arquivos focais sem `adminOverviewCards.test.ts`: 363 testes aprovados. O mesmo comando encontrou quatro testes adicionais de `adminOverviewCache.test.ts` bloqueados por socket, descritos abaixo. Resultados sobrepostos não são somados.
- Guardas administrativas em `adminUsersGuards.test.ts`: 10/10.

### Testes bloqueados pelo ambiente

- `server/routes/adminOverviewCards.test.ts` completo foi tentado uma vez. A abertura de `127.0.0.1` falhou com `listen EPERM`; os testes seguintes expiraram aguardando o servidor. A execução foi interrompida e nenhum caso dessa tentativa é declarado aprovado.
- Na execução dos outros 18 arquivos focais, os quatro casos HTTP de `adminOverviewCache.test.ts` também expiraram com `listen EPERM`. Os outros 363 testes foram aprovados. Assim, a suíte focal local terminou com 17 arquivos aprovados, um bloqueado, 363 testes aprovados e quatro bloqueados.
- Os dois casos corrigidos permanecem presentes e não foram pulados. A confirmação HTTP de 61/61 e da suíte ampla de 428/428 fica para o ambiente externo com socket funcional.

### Gates

- TypeScript principal: aprovado.
- TypeScript de scripts com `tsconfig.scripts.json`: aprovado.
- Prettier no teste e no suplemento: aprovado.
- `git diff --check`: aprovado.
- Geradores de roadmap, projetos v2, sitemap, CSP, contagens e home: aprovados com `node --import tsx`.
- Paleta e auditoria de limiares: aprovadas.
- `pnpm check:all` concluiu o TypeScript principal e falhou na primeira CLI `tsx` com `listen EPERM` em `/tmp/tsx-1000/45.pipe`. O agregado não é declarado aprovado; todos os equivalentes sem IPC foram aprovados.
- Uma tentativa inicial do TypeScript de scripts usou por engano o caminho inexistente `scripts/tsconfig.json`. Ela falhou com TS5058 e foi substituída pelo comando correto do repositório, `tsconfig.scripts.json`, que passou.

## Escopo e restrições

O incremental R3 toca apenas `server/routes/adminOverviewCards.test.ts` e este suplemento. Não houve mudança em código de produção, relaxamento do coletor, remoção de `rowKey` ou conversão de erro em lista vazia.

Não houve commit, push, PR, merge, deploy, migration, backfill, sync, replay, consulta a dados reais ou chamada operacional a provedores.
