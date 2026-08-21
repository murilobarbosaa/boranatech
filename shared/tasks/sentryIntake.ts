// Constantes do feed do Sentry para o quadro BUG.
//
// Compartilhado porque os dois lados precisam: o job (poda e ressurreicao) e a
// tela (o selo "sem eventos ha Xd" tem que dizer quanto falta para arquivar, e
// dois numeros diferentes para a mesma regra seriam mentira em um dos lados).
//
// Fase 2 de docs/plano-unificar-bugs-tarefas.md.

/**
 * Janela da listagem de issues do Sentry.
 *
 * NAO e escolha nossa: `GET /organizations/{org}/issues/` aceita exatamente
 * '', '24h' e '14d'. Qualquer outro valor responde 400 "Invalid stats_period".
 * Esta constante existe para o numero abaixo poder se comparar com ela.
 */
export const JANELA_LISTAGEM_DIAS = 14;

/**
 * Dias sem evento novo antes de a poda arquivar um card NUNCA TRIADO.
 *
 * Fixo em codigo, e nao coluna de configuracao: e um numero que muda raramente,
 * e mudar custa uma linha e um deploy. Coluna de config custaria migration,
 * interface, validacao e um estado a mais para o job conferir, tudo para
 * economizar um deploy por ano.
 *
 * POR QUE 21 E NAO 14. Precisa ser ESTRITAMENTE MAIOR que a janela da listagem:
 * a poda nao pode alcancar nada que ainda esteja aparecendo no feed normal. Com
 * 14 os dois se encostam, e um card sairia da fila no mesmo dia em que a issue
 * ainda podia estar visivel para quem abrisse a aba. A folga de uma semana e o
 * que separa "sumiu porque ficou quieto" de "sumiu enquanto eu olhava".
 *
 * A relacao esta travada por teste (sentryIntake.test.ts), nao so por este
 * comentario: baixar este numero para 14 ou menos derruba a suite com o motivo
 * escrito.
 */
export const DIAS_SEM_EVENTO_PARA_ARQUIVAR = 21;

/**
 * Valor de `intake_source` da etapa fixada que recebe o feed.
 *
 * Existe para o job procurar a ETAPA por este marcador em vez de procurar o
 * quadro pela sigla (invariante 5). Lista de um elemento hoje; se um segundo
 * feed aparecer, ele entra aqui e no CHECK da migration 20260731050100, que sao
 * as duas copias e elas andam juntas.
 */
export const INTAKE_SENTRY = "sentry" as const;

/** Proveniencia do arquivamento. Espelha o CHECK de admin_tasks.archived_source. */
export const ARQUIVADO_PELO_SYNC = "sentry_sync" as const;
export const ARQUIVADO_POR_HUMANO = "human" as const;

/**
 * Runs nao-sadias CONSECUTIVAS antes de o cron avisar.
 *
 * 3 runs de 15 minutos = 45 minutos de silencio antes do aviso. Mora aqui, junto
 * do outro numero da familia, para os dois serem definidos uma vez so.
 *
 * POR QUE ESTE ALERTA EXISTE. O reconcile-sentry-bugs gravou `partial` com o
 * motivo certo no payload 78 vezes seguidas e ninguem abriu. Foi a segunda vez
 * neste projeto que um instrumento reportou corretamente para o vazio (a
 * primeira foi o check:migrations acusando ai_usage_excluded_tools). Um cron que
 * morre em silencio e pior que um cron que nao existe: uma fila que para de
 * receber parece uma fila calma.
 *
 * POR QUE 3 E NAO 1. Medido em 2026-07-31 sobre o historico real de
 * cron_run_logs: com N=1 o sync-news sozinho teria disparado 71 avisos (o
 * `partial` dele e rotina, alguns artigos falham no enriquecimento). Com N=3,
 * cai para 10. A sequencia consecutiva e o que separa falha transitoria de job
 * morto.
 */
export const RUNS_NAO_SADIAS_PARA_AVISAR = 3;
