# Ambiente, backup e ensaio de restauração

Levantamento e recomendação. **Nada foi aplicado.** Dimensionado para o estágio atual (menos de 50 assinantes,
sem staging, um único banco).

---

## 1. Backup automático: o que existe hoje

Consultado na Management API do Supabase em 2026-07-26 (`GET /v1/projects/{ref}/database/backups`):

| Item | Estado real |
|---|---|
| Backups físicos diários | **sim**, WAL-G habilitado |
| Retenção observada | **7 backups**, o mais antigo de 2026-07-20T07:14Z |
| Horário | por volta de 07:15 UTC (04:15 em Brasília) |
| Status dos 7 | todos `COMPLETED` |
| **PITR (point-in-time recovery)** | **DESABILITADO** (`pitr_enabled: false`) |
| Região | `us-east-1` |

### O que isso significa na prática

- **Ponto de restauração mais antigo: 2026-07-20**, ou seja, 7 dias. Nada antes disso existe.
- **Granularidade: diária.** Sem PITR, não dá para voltar para "ontem às 14h32". Só para o instante do backup.
- **RPO real: até 24 horas.** Um incidente às 04:00 de Brasília perde quase um dia inteiro de escrita: análises,
  progresso de melhorias, entradas de estudo, favoritos.
- **O backup é do banco, não da conta.** Storage (avatares, PDFs de certificado) e usuários do Auth seguem
  regras próprias; não presuma que um restore de banco devolve tudo.

Para o estágio atual isso é defensável. Vale saber que PITR é o item que transforma RPO de 24h em minutos, e
que ele é pago; a decisão de ligar deveria vir junto com a primeira dezena de assinantes pagantes, não antes.

---

## 2. Ensaio de restauração (procedimento para executar uma vez)

Objetivo: descobrir **agora**, com calma, o que você não sabe sobre restaurar. Um backup nunca testado é uma
hipótese, não uma garantia. O ensaio abaixo **não toca no projeto de produção**.

### Antes de começar
- Reserve 1 hora ininterrupta.
- Tenha à mão: acesso ao dashboard do Supabase e o `.env` de produção (só para comparar valores, não para
  apontar nada novo para ele).
- **Não** faça isto em dia de deploy.

### Passo a passo

1. **Anote o estado de referência da produção.** Rode e guarde a saída:
   ```bash
   set -a && . ./.env && set +a
   pnpm check:migrations                 # espera exit 0 depois da migration da Fase 0
   pnpm report:ai-usage -- --days=30     # guarde o total de linhas e o custo
   ```
   Anote também a contagem de `linkedin_analyses` (hoje: 107).

2. **Crie um projeto Supabase novo**, free, nome `boranatech-ensaio`, mesma região (`us-east-1`).

3. **Restaure o backup mais recente nele.** No dashboard do projeto de produção, Database > Backups, baixe o
   backup mais recente; no projeto de ensaio, restaure esse dump. Cronometre.

4. **Meça o que interessa** e anote:
   - quanto tempo levou do início do download até o banco respondendo;
   - se o restore trouxe as tabelas do schema `auth` (usuários) ou só `public`;
   - se as RLS policies vieram junto;
   - se as funções/RPC (`is_user_pro`, `get_ai_usage_today`, etc.) vieram junto.

5. **Aponte a aplicação para o ensaio, em ambiente local.** Copie o `.env` para `.env.ensaio`, troque
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` pelos do projeto de ensaio, e
   suba o servidor com esse env. **Não** troque nada em produção.

6. **Rode a verificação objetiva** contra o ensaio:
   ```bash
   set -a && . ./.env.ensaio && set +a
   pnpm check:migrations
   pnpm report:ai-usage -- --days=30
   ```

### Como saber que funcionou

O ensaio passou se, no projeto restaurado:

- `pnpm check:migrations` sai com **exit 0** (todas as 72 tabelas presentes);
- a contagem de `linkedin_analyses` bate com a de produção no momento do backup;
- `pnpm report:ai-usage` devolve um total de linhas coerente com o que você anotou no passo 1;
- você consegue **fazer login** na aplicação local apontada para o ensaio (isto testa o schema `auth`, que é o
  que mais costuma faltar num restore só de `public`);
- uma análise antiga do histórico do LinkedIn **abre** na interface.

Anote no fim: **quanto tempo levou** e **o que faltou**. Esses dois números são o resultado do ensaio; o resto é
processo. Se qualquer item acima falhar, o achado é valioso e barato agora.

### Depois
Apague o projeto de ensaio e o `.env.ensaio`. Não deixe um segundo projeto com dado real de usuário parado.

---

## 3. Segundo projeto Supabase só para ensaiar migration: **não recomendo**

Avaliei e a resposta é não, por três motivos concretos.

**O custo não é o dinheiro, é a sincronia.** Um projeto "só schema" só tem valor se o schema dele for igual ao
de produção. Manter isso exige aplicar toda migration nos dois, na mesma ordem, para sempre. No dia em que
alguém aplicar em um e esquecer o outro, o ambiente de ensaio passa a mentir — e um ambiente de ensaio que mente
é pior que nenhum, porque dá confiança falsa. É exatamente o mesmo modo de falha que criou o bug desta
auditoria: um passo manual que depende de memória.

**O problema real já tem solução mais barata.** O risco que um banco de ensaio cobriria é "a migration quebra
em produção". Nesta rodada isso passou a ser coberto por: migration idempotente (roda duas vezes sem erro),
`pnpm check:migrations` (verifica que aplicou), e o job de CI que roda o guard sozinho. Isso ataca a causa
observada com custo de manutenção zero.

**Projetos free pausam.** O Supabase pausa projeto free inativo, e o ensaio é, por definição, inativo. Você
descobre a pausa justamente no dia em que precisa dele.

### O que eu recomendo em vez disso

- **Toda migration idempotente**, como a da Fase 0 (`drop policy if exists` antes do `create policy`). Isso já
  dá o essencial do ensaio: poder rodar de novo sem medo.
- **`supabase db diff --linked`** antes de aplicar, que já existe como `pnpm db:diff`. Mostra o que vai mudar
  sem precisar de um segundo banco.
- **Uma instância local efêmera quando a migration for grande**: `supabase start` sobe Postgres em Docker,
  `pnpm db:reset` aplica todas as migrations do zero. Vale para migration com risco real (mudança de tipo,
  backfill), é descartável e não precisa de sincronia. É o "ensaio" na hora em que ele é necessário, em vez de
  um ambiente permanente para manter.
- **Revisitar quando houver receita**: com dezenas de assinantes pagantes, o par PITR + staging deixa de ser
  desproporcional. Hoje é.
