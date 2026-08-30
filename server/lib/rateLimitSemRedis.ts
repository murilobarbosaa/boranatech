import * as Sentry from "@sentry/node";

/**
 * Aviso de que o rate limiter esta contando SEM Redis.
 *
 * O QUE ISTO CONSERTA. A guarda em `server/app.ts` era
 * `if (cacheConnection && !rateLimitUsingFallback)`, e o `cacheConnection &&`
 * fazia o aviso nunca sair quando NAO havia Redis configurado. Isso e correto
 * em dev (nao faz sentido avisar "o Redis caiu" onde ele nunca existiu) e e o
 * pior caso possivel em producao: "esqueceram a REDIS_URL" e "esta tudo bem"
 * produziam exatamente o mesmo silencio no log. Instrumento que reporta sucesso
 * sobre uma superficie menor, a classe que o CLAUDE.md cataloga.
 *
 * SAO DOIS ESTADOS DIFERENTES, e agora tem mensagens diferentes:
 *
 *   Redis configurado e caiu -> transicao, avisada em `server/app.ts`, e volta a
 *   ser avisada quando o Redis retorna. Estado temporario.
 *
 *   Redis NUNCA configurado -> nao ha transicao para observar, porque nunca vai
 *   voltar. Estado permanente ate alguem mexer na configuracao, e por isso o
 *   aviso e uma vez so, aqui.
 *
 * POR QUE O NUMERO DE REPLICAS ENTRA NA MENSAGEM. Sem Redis a contagem vive num
 * `Map` do processo, entao cada replica tem o proprio balde: com duas replicas,
 * o teto efetivo por usuario e o dobro do configurado, e o teto por IP tambem.
 * Quem le "180/min" na configuracao e ve 360 passarem nao tem como descobrir o
 * porque sem esta linha.
 *
 * VAI PARA O SENTRY, e nao so para o console: `server/lib/sentry.ts` nao declara
 * `integrations`, entao `captureConsoleIntegration` nao esta ligado e um
 * `console.warn` morre no log do Railway (docs/erro-engolido.md). Um defeito de
 * configuracao que ninguem le e o mesmo que nenhum defeito detectado.
 */

/**
 * Uma vez por processo. Nao e por janela nem por requisicao: o estado nao muda
 * sozinho, entao repetir seria ruido puro numa rota que roda a cada request.
 */
let jaAvisou = false;

/** Zera o estado por processo. SO para teste, no molde de linkedinAnalyze.ts. */
export function __resetAvisoSemRedisParaTeste(): void {
  jaAvisou = false;
}

/**
 * Avisa UMA vez que nao ha Redis para o rate limiter.
 *
 * `ehProducao` entra por parametro em vez de ler `env.isProd` aqui dentro para
 * o teste poder exercitar os dois ambientes sem mockar o modulo de env, que e o
 * mesmo motivo pelo qual `rateLimitExempt` e `rateLimitKey` recebem o que
 * precisam em vez de importar o request.
 *
 * @returns true se ESTA chamada emitiu o aviso. So o teste usa o retorno; o
 * chamador de producao ignora, porque nao ha o que fazer com a resposta.
 */
export function avisarRateLimitSemRedis(ehProducao: boolean): boolean {
  if (jaAvisou) return false;
  // Dev e CI ficam quietos, como antes: la a ausencia de Redis e o normal, e um
  // aviso a cada `pnpm dev` ensina a ignorar a linha.
  if (!ehProducao) return false;

  jaAvisou = true;
  console.warn(
    "[ratelimit] REDIS_URL ausente em producao: a contagem e por processo, " +
      "nao compartilhada. Com N replicas o teto efetivo e N vezes o configurado.",
  );
  try {
    Sentry.captureMessage("ratelimit_sem_redis", {
      // `warning` e nao `error`: nada esta quebrado e ninguem levou 500. O que
      // existe e um teto valendo o multiplo do que a configuracao diz, que
      // alguem precisa ver e corrigir, sem plantao.
      level: "warning",
      // Fingerprint fixo por TIPO: o estado e permanente ate alguem mexer, e uma
      // issue por processo daria uma issue nova a cada deploy.
      fingerprint: ["ratelimit-sem-redis"],
      tags: { area: "ratelimit", redis: "ausente" },
    });
  } catch {
    // Sentry sem DSN e no-op por desenho, e telemetria nunca decide o desfecho
    // de um caminho de request. Mesmo padrao de server/lib/aiUsage.ts.
  }
  return true;
}
