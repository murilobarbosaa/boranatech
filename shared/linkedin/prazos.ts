/**
 * PRAZOS DO CAMINHO DA ANALISE DE LINKEDIN.
 *
 * Este modulo existe porque o pior caso do servidor era maior que o teto do
 * client e ninguem tinha como perceber: as parcelas moravam em tres arquivos
 * diferentes (`server/lib/linkedinAnalyze.ts`, `server/lib/supabaseAdmin.ts` e
 * `client/src/lib/linkedinClient.ts`), e a soma so existia na cabeca de quem
 * escreveu o comentario do teto. Medida na Fase 4, a soma dava 150,4s contra um
 * teto de client de 120s, ou seja, o aborto do client acontecia ANTES do pior
 * caso legitimo do servidor, e a pessoa levava "tente de novo" para uma analise
 * que estava a caminho.
 *
 * O que este arquivo cobre HOJE e a parcela de BANCO. A soma das parcelas e a
 * derivacao do teto do client entram no lote seguinte.
 */

/**
 * PRAZO POR ROUND-TRIP DE BANCO NO CAMINHO DA ANALISE.
 *
 * Por que um prazo proprio, e nao o teto global de 15s do `supabaseAdmin`: os
 * 15s foram pensados para uma chamada ISOLADA (uma rota que faz um select e
 * responde), e o caminho da analise encadeia CINCO. Herdar o teto global fazia
 * o banco sozinho valer 75s, mais da metade do pior caso, para operacoes que na
 * pratica levam dezenas de milissegundos.
 *
 * Por que 5000 e nao um numero menor: as cinco operacoes sao de linha unica
 * (uma RPC que insere uma linha sob advisory lock, um select por
 * `(user_id, tool, status)`, um update por chave primaria e dois inserts).
 * Nenhuma delas varre tabela. 5000ms e cerca de duas ordens de grandeza acima
 * do tempo normal, entao o prazo so dispara em indisponibilidade de verdade,
 * nunca num pico de carga; um prazo apertado transformaria lentidao passageira
 * em erro para a pessoa, que e trocar um problema raro por um frequente.
 *
 * Por que nao mexer no teto global: ele protege TODAS as outras rotas, que nao
 * foram medidas nesta fase. Baixar 15s para 5s la dentro seria mudar oito
 * ferramentas de IA e o resto da plataforma de carona numa medicao que so olhou
 * para uma. O mecanismo aqui e LOCAL e OPT-IN: quem nao passa prazo continua
 * exatamente como estava.
 */
export const PRAZO_BANCO_ANALISE_MS = 5_000;

/**
 * OS ROUND-TRIPS DE BANCO DO CAMINHO DA ANALISE, enumerados.
 *
 * Nao e documentacao: e o tipo do parametro de `comPrazoDeBanco`. Um round-trip
 * novo no caminho da analise NAO COMPILA sem entrar nesta lista, e e dessa lista
 * que sai a contagem usada na conta do pior caso. E a diferenca entre um total
 * que o TypeScript mantem e um total escrito a mao que desatualiza no primeiro
 * esquecimento, que e a classe de defeito que o CLAUDE.md deste projeto
 * documenta em varias instancias.
 *
 *   reserva_atomica    RPC `reserve_ai_usage_slot`, o caminho normal da cota.
 *   reserva_degradada  RPC `get_ai_usage_today`, SO quando a primeira falha.
 *   log_busca_reserva  select da reserva em voo, em `logAiUsage`.
 *   log_grava_uso      update da reserva OU insert da linha de uso. Os dois
 *                      ramos sao exclusivos, entao contam como UM round-trip.
 *   persistencia       insert em `linkedin_analyses`.
 */
export const CALL_SITES_BANCO_ANALISE = [
  "reserva_atomica",
  "reserva_degradada",
  "log_busca_reserva",
  "log_grava_uso",
  "persistencia",
] as const;

export type CallSiteBancoAnalise = (typeof CALL_SITES_BANCO_ANALISE)[number];

/**
 * Prazo estourado do NOSSO lado. Nomeia o round-trip, porque a consequencia de
 * estourar e diferente em cada um (ver a tabela de semantica no relatorio da
 * Fase 4 e os comentarios de cada call site).
 *
 * ATENCAO ao que este erro NAO significa: ele nao diz que a escrita falhou, e
 * nao a cancela. Diz apenas que paramos de esperar por ela.
 */
export class PrazoDeBancoEstourado extends Error {
  readonly callSite: CallSiteBancoAnalise;
  readonly prazoMs: number;

  constructor(callSite: CallSiteBancoAnalise, prazoMs: number) {
    super(
      `Prazo de ${prazoMs}ms estourado no round-trip de banco "${callSite}" do caminho da analise. A escrita pode ainda aterrissar.`,
    );
    this.name = "PrazoDeBancoEstourado";
    this.callSite = callSite;
    this.prazoMs = prazoMs;
  }
}

/**
 * Para de esperar por um round-trip de banco depois de `prazoMs`.
 *
 * MECANISMO: corrida (`Promise.race`), nao cancelamento. A diferenca importa e
 * e deliberada. Abortar o `fetch` do supabase-js cancelaria a escrita no meio, e
 * no caminho da analise isso e PIOR que esperar: um update de confirmacao
 * cancelado deixa a reserva de cota presa em `reserved`, cobrada e sem entrega.
 * Com a corrida, o trabalho segue em voo e aterrissa sozinho; o unico efeito e
 * que a rota deixa de depender dele para responder. Nada fica pendurado para
 * sempre porque o teto global de 15s do `supabaseAdmin` continua valendo por
 * baixo: este prazo aperta o de cima, nunca solta o de baixo.
 *
 * OPT-IN por desenho: `prazoMs` ausente devolve o trabalho sem prazo nenhum. As
 * funcoes de cota servem nove ferramentas, e so o caminho da analise foi medido
 * nesta fase. Guarda que vale para todo mundo por engano e mudanca de
 * comportamento disfarcada de refactor.
 */
export function comPrazoDeBanco<T>(
  trabalho: PromiseLike<T>,
  callSite: CallSiteBancoAnalise,
  prazoMs: number | undefined,
): Promise<T> {
  const emVoo = Promise.resolve(trabalho);
  if (prazoMs === undefined) return emVoo;

  // O PERDEDOR DA CORRIDA PRECISA DE DONO. Sem este `catch`, um trabalho que
  // falha DEPOIS do prazo vira `unhandledRejection` e derruba o processo em
  // Node, que e um jeito espetacular de piorar um timeout de banco.
  emVoo.catch(() => undefined);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const prazo = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new PrazoDeBancoEstourado(callSite, prazoMs)),
      prazoMs,
    );
  });

  return Promise.race([emVoo, prazo]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}
