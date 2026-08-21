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
 * Aqui as parcelas ficam JUNTAS e o teto do client passa a ser DERIVADO delas,
 * nao escolhido. A invariante que sustenta tudo (`TETO_CLIENT_MS` estritamente
 * maior que `PIOR_CASO_SERVIDOR_MS`) e testada em `prazos.test.ts`, e cada
 * parcela tem mutante proprio em `scripts/mutateLinkedinThresholds.mjs`: desligar
 * uma parcela da derivacao, ou inverter a desigualdade, quebra a suite.
 */

/**
 * TIMEOUT DE UMA TENTATIVA DE IA.
 *
 * Era o literal `45_000` no sitio da chamada em `linkedinAnalyze.ts`, sem nome.
 * Sem nome ele nao entrava em conta nenhuma, e a auditoria de limiares nem o
 * enxergava, porque o separador numerico escondia o sitio do proprio descobridor.
 */
export const PRAZO_IA_POR_TENTATIVA_MS = 45_000;

/**
 * TETO DE TENTATIVAS DE IA.
 *
 * Duas tentativas de 45s (pior caso cerca de 90s mais backoff), nao tres de 60s:
 * fazer a pessoa esperar quase tres minutos para receber o mesmo erro so castiga.
 * Melhor falhar rapido e deixar ela tentar de novo.
 */
export const IA_MAX_TENTATIVAS = 2;

/**
 * BACKOFF ENTRE TENTATIVAS, por indice de tentativa concluida.
 *
 * O SEGUNDO ELEMENTO E INALCANCAVEL HOJE, e fica documentado em vez de removido.
 * O laco so dorme com `tentativa < IA_MAX_TENTATIVAS` e le `[tentativa - 1]`,
 * ou seja, so o indice 0 com o teto em 2. Remover o `800` nao mudaria
 * comportamento nenhum (o `?? IA_BACKOFF_PADRAO_MS` devolveria o mesmo valor
 * numa terceira tentativa), mas mudaria onde a informacao mora: passaria a
 * depender de um `??` no fim de uma linha em vez de um array que se le de uma
 * vez. O risco real do elemento morto era outro, e esta fechado: ele INFLAVA a
 * conta do pior caso quando alguem somava o array inteiro. A derivacao abaixo
 * nao soma o array, soma os backoffs EFETIVAMENTE aplicados.
 */
export const IA_BACKOFF_MS = [400, 800];

/** Backoff de uma tentativa que o array nao declara. Espelha o `??` do laco. */
export const IA_BACKOFF_PADRAO_MS = 800;

/**
 * Soma dos backoffs REALMENTE aplicados, derivada do teto de tentativas.
 *
 * Espelha o laco de `linkedinAnalyze.ts`: ele dorme entre tentativas, logo
 * `IA_MAX_TENTATIVAS - 1` vezes, lendo `IA_BACKOFF_MS[tentativa - 1]`. Derivar
 * em vez de escrever `400` a mao e o que faz a conta acompanhar sozinha quem um
 * dia subir o teto de tentativas.
 */
export const IA_BACKOFF_TOTAL_MS = Array.from(
  { length: Math.max(0, IA_MAX_TENTATIVAS - 1) },
  (_valor, indice) => IA_BACKOFF_MS[indice] ?? IA_BACKOFF_PADRAO_MS,
).reduce((soma, ms) => soma + ms, 0);

/** Pior caso da parte de IA: todas as tentativas estourando, mais os backoffs. */
export const PIOR_CASO_IA_MS =
  PRAZO_IA_POR_TENTATIVA_MS * IA_MAX_TENTATIVAS + IA_BACKOFF_TOTAL_MS;

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
 * Round-trips de banco no PIOR caminho: o degradado, em que a RPC atomica falha
 * e a de contagem entra no lugar. E o numero que a conta do pior caso usa.
 *
 * Derivado da lista, nao escrito: e a lista que o TypeScript obriga a crescer
 * quando nasce um round-trip novo, entao a conta cresce junto sem ninguem ter de
 * lembrar. Contagem escrita a mao aqui seria a mesma classe de defeito que este
 * lote inteiro existe para fechar.
 */
export const ROUND_TRIPS_BANCO_DEGRADADO = CALL_SITES_BANCO_ANALISE.length;

/**
 * Round-trips no caminho NORMAL: um a menos, porque `reserva_atomica` e
 * `reserva_degradada` sao exclusivos (a segunda so roda quando a primeira
 * falha). Nao entra na conta do pior caso; existe para a conta poder ser lida.
 */
export const ROUND_TRIPS_BANCO_NORMAL = ROUND_TRIPS_BANCO_DEGRADADO - 1;

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
/** Pior caso da parte de banco: todo round-trip do caminho degradado estourando. */
export const PIOR_CASO_BANCO_MS =
  PRAZO_BANCO_ANALISE_MS * ROUND_TRIPS_BANCO_DEGRADADO;

/**
 * PIOR CASO DO SERVIDOR, com o caminho degradado incluido.
 *
 * O degradado entra de proposito: ele nao e hipotese, e o que acontece sempre
 * que a migration da reserva atomica nao esta aplicada, e foi medido em
 * producao. Dimensionar o teto do client pelo caminho feliz e o erro que
 * produziu o defeito original.
 */
export const PIOR_CASO_SERVIDOR_MS = PIOR_CASO_IA_MS + PIOR_CASO_BANCO_MS;

/**
 * FOLGA NOMEADA entre o pior caso do servidor e o aborto do client.
 *
 * Ela cobre o que a conta acima nao mede e nao tem como medir: latencia de rede
 * nas duas pontas, fila do proxy da Railway, o proprio tempo de serializar uma
 * resposta grande. Sem folga, o teto do client encostaria no pior caso e a
 * primeira variacao de rede reproduziria exatamente o defeito que este lote
 * fecha, so que mais raro e portanto mais dificil de achar.
 *
 * MINIMO CONTRATADO: 15s, afirmado em `prazos.test.ts`. Reduzir e ato
 * deliberado, no commit que explica por que.
 */
export const FOLGA_CLIENT_MS = 15_000;

/**
 * TETO DE ABORTO DO CLIENT, derivado.
 *
 * Era o literal `120_000` em `client/src/lib/linkedinClient.ts`, com um
 * comentario que dizia "folga sobre o pior caso do server (cerca de 90s)". O
 * comentario estava certo sobre a IA e nao contava o banco, entao a folga era
 * negativa em 30,4s: o client abortava ANTES do servidor terminar, e a pessoa
 * lia "tente de novo" para uma analise que estava a caminho e seria cobrada.
 *
 * Agora nao ha numero para acertar: se qualquer parcela mudar, este valor muda
 * junto, e a invariante testada garante que ele nunca fica abaixo do pior caso.
 */
export const TETO_CLIENT_MS = PIOR_CASO_SERVIDOR_MS + FOLGA_CLIENT_MS;

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
