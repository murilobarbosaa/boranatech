# Débito: o ledger de migrations do Supabase está parado desde maio

Levantado em 2026-07-27, durante a Fase 1 do módulo de Tarefas. **Nada foi
alterado**: este documento é o registro do achado e das opções, para virar um PR
próprio de quem cuida do deploy. Remediar infra dentro de uma branch de feature
faria o diff contar duas histórias.

## O que foi medido

Consulta ao `supabase_migrations.schema_migrations` do projeto de produção, via
Management API, comparada com os arquivos de `supabase/migrations/*.sql` (fora do
`_archive`):

| Medida | Valor |
| --- | --- |
| Arquivos de migration no repositório | 114 |
| Versões registradas no ledger | 16 |
| No repositório e **não** no ledger | 98 |
| No ledger e **não** no repositório | 0 |
| Última versão registrada | `20260526143000_add_eight_new_areas` |

Reproduzir:

```bash
set -a && . ./.env && set +a
curl -s -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"select version from supabase_migrations.schema_migrations order by version;"}' \
  | tr ',' '\n' | grep -oE '[0-9]{14}' | sort > /tmp/ledger.txt
ls supabase/migrations/*.sql | sed 's|.*/||; s|_.*||' | sort > /tmp/repo.txt
comm -23 /tmp/repo.txt /tmp/ledger.txt | wc -l   # no repo e nao no ledger
```

## Por que aconteceu

Desde o fim de maio as migrations vêm sendo aplicadas pelo **SQL editor** do
Supabase, não por `db:push`. O SQL editor executa o SQL e não escreve no ledger,
que só é alimentado pelo CLI. O fluxo funciona (o schema está correto, ver
abaixo), mas o registro de "o que já foi aplicado" parou de acompanhar.

Observação prática: o CLI `supabase` **não está instalado** na máquina de
desenvolvimento, então `pnpm db:push`, `db:diff`, `db:pull` e `db:types` já não
são executáveis hoje sem instalá-lo primeiro.

## O que NÃO está quebrado

`pnpm check:migrations` está **verde** contra produção. Ele verifica o banco de
verdade, nos dois sentidos:

- as 81 tabelas declaradas nas migrations existem;
- nenhuma tabela ou view exposta pelo PostgREST deixa de estar declarada;
- as funções declaradas existem, e nenhuma função existe sem declaração;
- as asserções de tamanho de conjunto (`EXPECTED_TABLE_COUNT`,
  `EXPECTED_FUNCTION_COUNT`, `EXPECTED_TRIGGER_FUNCTION_COUNT`,
  `EXPECTED_RLS_COUNT`) batem.

Ou seja: **o schema está aplicado. O que está desatualizado é o registro.**

## O risco de simplesmente preencher o ledger

Um `migration repair --status applied` nas 98 versões **afirma mais do que o
`check:migrations` prova**. O guard compara conjuntos de tabelas, de funções e de
tabelas com RLS. Ele NÃO compara, e o próprio script diz isso na saída:

- coluna por coluna;
- índice por índice (137 declarados, não verificados);
- policy por policy (72 declaradas, não verificadas);
- constraints, defaults, triggers.

Se alguma das 98 subiu **pela metade** pelo SQL editor (o editor executa o que
está selecionado, e um `commit` esquecido ou um statement a menos passa sem
alarde), declará-la aplicada sela o buraco: a partir daí nenhuma ferramenta vai
tentar reaplicá-la, e a divergência vira permanente e invisível. É a mesma classe
das outras instâncias do `CLAUDE.md` — um instrumento reportando sucesso sobre
uma superfície menor que a que ele parece cobrir.

## Opções

1. **Não fazer nada** (adotada na branch `feat/admin-tarefas`). O `db:push` já não
   é o fluxo real, e a verificação que importa (`check:migrations`, no CI) não
   depende do ledger. Custo: o ledger segue mentindo, e o dia em que alguém
   instalar o CLI e rodar `db push` vai ser desagradável.
2. **Preencher as 98**, depois de verificar (ver abaixo). Custo: o trabalho de
   verificação, que é real.
3. **Preencher só a versão mais recente.** Descartada: não resolve nada, porque o
   `db push` continuaria tentando reaplicar as outras 97, e ainda dá a impressão
   de que o problema foi tratado.

## O que verificar antes de um backfill

O backfill só é seguro depois de comprovar que as 98 subiram **inteiras**. O
caminho que não depende de memória de ninguém:

1. Restaurar um backup de produção num projeto Supabase descartável (procedimento
   em `docs/ambiente-backup-restauracao.md`).
2. Num segundo projeto descartável e **vazio**, aplicar as 114 migrations do
   repositório na ordem, do zero.
3. `supabase db diff` entre os dois. Diferença vazia = as migrations descrevem o
   banco de produção por completo, e o backfill é seguro.
4. Diferença não vazia = achamos exatamente o que subiu pela metade, e cada item
   vira uma migration corretiva **antes** do backfill.

Este é o "verificar nos dois sentidos" do `CLAUDE.md` aplicado ao schema: não
basta perguntar "o que declarei existe?", é preciso perguntar "o que existe está
declarado, com a mesma forma?". O passo 3 é a única coisa nesta lista que
responde a segunda pergunta.

## Enquanto isso

- Manter `pnpm check:migrations` no CI (já está, job `migrations`).
- Ao aplicar migration pelo SQL editor, rodar o guard logo depois, contra o banco
  alvo. É o que a seção de deploy do `CLAUDE.md` já manda fazer no passo (4).
