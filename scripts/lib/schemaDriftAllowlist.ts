// Allowlist do guard de DRIFT DE SCHEMA.
//
// O QUE E DRIFT AQUI. O resto do checkMigrationsApplied responde "o que eu
// declarei existe no banco?". Este arquivo serve a pergunta INVERSA, que e a
// que separa backup fisico de reconstrucao a partir das migrations: "o que
// existe no banco esta declarado?". Objeto que so existe em producao nao entra
// numa reconstrucao de ambiente, e ninguem descobre isso ate precisar da
// reconstrucao.
//
// POR QUE ALLOWLIST E NAO WARN. Ate 2026-08-28 as duas direcoes inversas
// (tabelas/views e funcoes) saiam por `console.warn` e o script terminava
// VERDE. Warn em gate de CI e a forma exata do problema que esta base cataloga:
// o instrumento roda, reporta, e ninguem e obrigado a fazer nada, entao o
// conjunto so cresce. Com allowlist o custo muda de lado: drift NOVO quebra o
// CI, e permitir um drift exige escrever aqui o nome, a origem e a data, no
// commit que o introduz.
//
// COMO USAR. Drift novo e legitimo (objeto criado fora do repositorio por uma
// rotina externa, migration numa branch que ainda nao subiu): acrescente a
// entrada com justificativa verificavel. Drift que era so uma migration
// esquecida: aplique ou declare a migration, NAO acrescente aqui.
//
// A VERIFICACAO E NOS DOIS SENTIDOS. Entrada que deixou de aparecer no banco
// tambem falha, e de proposito: quando a migration finalmente sobe, o objeto
// passa a ser declarado, sai do conjunto de drift, e a entrada aqui vira
// mentira. Allowlist que so cresce e allowlist que ninguem le.

export interface DriftPermitido {
  /** Nome do objeto em public, minusculo, como o PostgREST o expoe. */
  nome: string;
  tipo: "tabela" | "view" | "funcao";
  /** Desde quando se sabe do drift (data da constatacao, nao da criacao). */
  desde: string;
  /** Por que existe sem migration, e o que precisa acontecer para sair daqui. */
  justificativa: string;
}

export const DRIFT_PERMITIDO: DriftPermitido[] = [
  {
    nome: "billing_failed_payments",
    tipo: "tabela",
    desde: "2026-08-01",
    justificativa:
      "Existe em producao desde 2026-07-28. A migration que a declara " +
      "(20260728190000_create_billing_failed_payments.sql) vive na branch " +
      "fix/billing-customer-reuse, que ainda nao entrou na main. Sai daqui " +
      "quando aquela branch subir: o objeto passa a ser declarado.",
  },
  {
    nome: "stripe_customers",
    tipo: "tabela",
    desde: "2026-08-01",
    justificativa:
      "Mesma origem e mesma branch da billing_failed_payments; a migration e " +
      "20260728200000_create_stripe_customers.sql.",
  },
  {
    nome: "payment_recovery_emails",
    tipo: "tabela",
    desde: "2026-08-01",
    justificativa:
      "Mesma origem e mesma branch das duas acima; a migration e " +
      "20260728210000_create_payment_recovery_emails.sql.",
  },
  {
    nome: "fiscal_invoices",
    tipo: "tabela",
    desde: "2026-09-02",
    justificativa:
      "Aplicada em producao entre 16h41 e 22h56 de 02/09, sem carimbo em " +
      "schema_migrations e sem o codigo na main. As migrations que a declaram " +
      "vivem na branch feat/fiscal-fechamento: " +
      "20260804120000_create_fiscal_invoices.sql cria a tabela, " +
      "20260804140000_add_precisa_revisao_to_fiscal_invoices.sql e " +
      "20260810120000_add_dps_fields_to_fiscal_invoices.sql acrescentam " +
      "colunas. AS COLUNAS DO BANCO BATEM COM ESSA BRANCH, e a conferencia " +
      "distingue as duas frentes fiscais: o banco tem precisa_revisao, dps_id, " +
      "dps_numero, dps_serie e chave_acesso, e NAO tem `ambiente`, que so " +
      "existe em 20260829120000_add_ambiente_to_fiscal_invoices.sql, presente " +
      "apenas em feat/fiscal-nfsen. Ou seja, o estado aplicado e o de " +
      "feat/fiscal-fechamento, nao o da nfsen. Sai daqui quando aquela branch " +
      "subir: o objeto passa a ser declarado. O carimbo em schema_migrations " +
      "NAO foi gravado na aplicacao, e a Ana o insere quando os arquivos " +
      "entrarem na main.",
  },
  {
    nome: "linkedin_begin_progress_session",
    tipo: "funcao",
    desde: "2026-09-02",
    justificativa:
      "Aplicada em producao na mesma janela da fiscal_invoices, sem carimbo em " +
      "schema_migrations e sem o codigo na main. A migration que a declara e " +
      "20260815130000_linkedin_progress_revision.sql, na branch " +
      "feat/linkedin-fase-4 (tambem em origin). A ASSINATURA FOI CONFERIDA " +
      "contra o OpenAPI do PostgREST: o banco expoe /rpc/ com os argumentos " +
      "p_user_id e p_analysis_id, os mesmos dois da migration. Sai daqui " +
      "quando aquela branch subir: o objeto passa a ser declarado. O carimbo " +
      "em schema_migrations NAO foi gravado na aplicacao, e a Ana o insere " +
      "quando o arquivo entrar na main.",
  },
  {
    nome: "linkedin_set_improvement_progress",
    tipo: "funcao",
    desde: "2026-09-02",
    justificativa:
      "Mesma origem, mesma branch e mesmo arquivo da " +
      "linkedin_begin_progress_session. Assinatura conferida do mesmo jeito: o " +
      "banco expoe os cinco argumentos p_user_id, p_analysis_id, " +
      "p_improvement_index, p_done e p_revision, iguais aos da migration.",
  },
  {
    nome: "vw_eventos_agenda",
    tipo: "view",
    desde: "2026-08-28",
    justificativa:
      "View exposta pelo PostgREST sem rastro NENHUM no repositorio: nao " +
      "aparece em migration nem em codigo (conferido por grep em " +
      "supabase/migrations, server, client, shared e scripts). O nome sugere " +
      "projecao sobre eventos, e public.external_events tem precedente da " +
      "mesma forma, criada direto em producao pela rotina agendada de coleta " +
      "diaria (ver o cabecalho de 20260811171556_create_external_events.sql). " +
      "A origem NAO foi confirmada, e a entrada fica com essa ressalva " +
      "explicita em vez de uma causa plausivel escrita como se fosse achado. " +
      "Sai daqui quando o DDL real for lido de producao e declarado, como foi " +
      "feito com external_events.",
  },
];

/** Nomes permitidos por tipo, para o guard consultar sem repetir o filtro. */
export function nomesPermitidos(
  tipos: DriftPermitido["tipo"][],
): Set<string> {
  return new Set(
    DRIFT_PERMITIDO.filter((d) => tipos.includes(d.tipo)).map((d) =>
      d.nome.toLowerCase(),
    ),
  );
}
