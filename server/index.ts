// PRIMEIRO import de proposito: o sentry.ts se auto-inicializa na avaliacao
// do modulo, antes do Express e do resto do app carregarem. Nao reordenar.
import "./lib/sentry";

import * as Sentry from "@sentry/node";
import { createServer } from "http";

import app from "./app";
import { deveSubirWorkers, env } from "./lib/env";
import {
  createEmailCampaignWorker,
  reconcileEmailCampaignBatches,
} from "./lib/emailCampaignQueue";
import { createFiscalInvoiceWorker } from "./lib/fiscalQueue";
import { checkFiscalBucket } from "./lib/fiscalStorage";
import { createEmailWorker } from "./lib/queue";
import { cacheConnection, queueConnection } from "./lib/redis";

// Marca erros ja capturados no unhandledRejection pra nao duplicar o evento
// quando o rethrow cair no uncaughtException.
const SENTRY_CAPTURED = Symbol("sentryCaptured");

// Escopo de MODULO, e nao local de startServer, porque os dois caminhos de
// falha abaixo (o 'error' do server e o .catch do startServer) precisam fechar
// os workers, e o segundo roda depois de startServer ter saido por excecao.
let emailWorker: ReturnType<typeof createEmailWorker> = null;
let emailCampaignWorker: ReturnType<typeof createEmailCampaignWorker> = null;

/**
 * Saida por FALHA: fecha os workers, solta as conexoes e encerra com 1.
 *
 * Existe separada do `shutdown()` (que sai com 0 no SIGTERM/SIGINT) porque o
 * codigo de saida importa: quem supervisiona o processo precisa distinguir
 * "pedi para parar" de "quebrou". O timer NAO e unref: se algum `close()`
 * pendurar, ele e quem garante que o processo morre em vez de virar exatamente
 * o zumbi que este arquivo passou a documentar.
 */
async function encerrarComFalha(): Promise<never> {
  setTimeout(() => process.exit(1), 10_000);
  await Promise.allSettled([
    emailWorker?.close(),
    emailCampaignWorker?.close(),
  ]);
  await Promise.allSettled([
    queueConnection?.quit().catch(() => {}),
    cacheConnection?.quit().catch(() => {}),
    Sentry.close(2000).catch(() => {}),
  ]);
  process.exit(1);
}

process.on("unhandledRejection", (reason) => {
  Sentry.captureException(reason);
  const err =
    reason instanceof Error ? reason : new Error(`unhandledRejection: ${String(reason)}`);
  (err as Error & { [SENTRY_CAPTURED]?: boolean })[SENTRY_CAPTURED] = true;
  // Rethrow preserva o comportamento padrao do Node (crash), que sai pelo
  // handler de uncaughtException abaixo (flush + exit).
  throw err;
});

process.on("uncaughtException", (err) => {
  console.error("[fatal] uncaughtException:", err);
  if (!(err as Error & { [SENTRY_CAPTURED]?: boolean })[SENTRY_CAPTURED]) {
    Sentry.captureException(err);
  }
  // Teto de 2s pro flush; o crash acontece de qualquer jeito.
  void Sentry.close(2000).finally(() => process.exit(1));
});

async function startServer() {
  const server = createServer(app);

  // ATE 2026-09-02 ISTO ERA FALSO, e custou caro: um `pnpm dev` com o `.env` de
  // producao NAO era um servidor local, era um WORKER DE PRODUCAO. Bastava
  // `REDIS_URL` preenchido para este processo comecar a consumir a fila de
  // e-mail do Railway, e 32 das 34 worktrees da maquina tem o REDIS_URL de
  // producao no `.env`. Um processo assim ficou vivo de 29/08 21:07 a 02/09 sem
  // nem escutar HTTP.
  //
  // Agora o consumo e fail-closed fora de producao, com escape explicito
  // (QUEUE_WORKERS_NON_PROD=true). ENFILEIRAR continua livre em dev de
  // proposito: o teste ponta a ponta local enfileira no Redis compartilhado e
  // quem consome e o worker do Railway.
  const subirWorkers = deveSubirWorkers({
    nodeEnv: env.nodeEnv,
    escapeLigado: env.queueWorkersNonProd,
  });
  if (env.redisUrl && !subirWorkers) {
    console.log(
      `[queue] ambiente '${env.nodeEnv}' nao e producao. Workers de e-mail NAO iniciados (enfileirar continua funcionando). Para consumir a fila daqui, use QUEUE_WORKERS_NON_PROD=true.`,
    );
  }

  emailWorker =
    env.redisUrl && subirWorkers
      ? (() => {
          try {
            return createEmailWorker();
          } catch (err) {
            console.error("[queue] Erro ao iniciar worker de e-mail:", err);
            return null;
          }
        })()
      : null;
  emailCampaignWorker =
    env.redisUrl && subirWorkers
      ? (() => {
          try {
            return createEmailCampaignWorker();
          } catch (err) {
            console.error(
              "[email-campaign] Erro ao iniciar worker de campanha:",
              err,
            );
            return null;
          }
        })()
      : null;

  // Bucket dos documentos fiscais: conferido no boot, nao na primeira emissao.
  //
  // Nao aborta o processo (ao contrario das credenciais em env.ts): o Storage e
  // uma dependencia de rede e um blip dele no deploy derrubaria a aplicacao
  // inteira, incluindo o que nao tem nada a ver com nota fiscal. O que ele faz
  // e GRITAR, com a instrucao exata de correcao, e deixar o pipeline seguir: a
  // nota continua sendo emitida na prefeitura e o arquivamento e o passo que
  // degrada (ver arquivarDocumentos em lib/fiscalQueue.ts).
  if (env.nfseEnabled) {
    void checkFiscalBucket()
      .then((problema) => {
        if (problema) {
          console.error(`[fiscal] ATENCAO: ${problema}`);
          Sentry.captureException(new Error(`[fiscal] ${problema}`));
          return;
        }
        console.log("[fiscal] bucket privado verificado.");
      })
      .catch((err) => {
        console.error("[fiscal] falha ao verificar o bucket:", err);
      });
  }

  // Worker fiscal: so sobe com a emissao LIGADA. Com o kill-switch desligado
  // nao existe produtor enfileirando, entao um worker aqui seria processo
  // ocioso segurando conexao de Redis a toa.
  const fiscalWorker =
    // `subirWorkers` tambem aqui: o worker fiscal e CONSUMIDOR de fila, e
    // deixa-lo de fora reabriria, para a fila fiscal, exatamente o buraco que
    // a main acabou de fechar para a de e-mail.
    env.redisUrl && env.nfseEnabled && subirWorkers
      ? (() => {
          try {
            return createFiscalInvoiceWorker();
          } catch (err) {
            console.error("[fiscal] Erro ao iniciar worker fiscal:", err);
            return null;
          }
        })()
      : null;
  // Reconciliacao dos lotes agendados: Postgres e a fonte de verdade, o Redis
  // so guarda o gatilho. Roda em background pra nao atrasar o listen; jobIds
  // deterministicos tornam a recriacao idempotente.
  if (emailCampaignWorker) {
    void reconcileEmailCampaignBatches().catch((err) => {
      console.error(
        "[email-campaign] Erro na reconciliacao de lotes no boot:",
        err,
      );
    });
  }

  async function shutdown() {
    await Promise.allSettled([
      emailWorker?.close(),
      emailCampaignWorker?.close(),
      fiscalWorker?.close(),
    ]);
    server.close(() => {
      process.exit(0);
    });
    // Sockets keep-alive ociosos nao contam como request em andamento e
    // segurariam o close ate o SIGKILL da plataforma.
    server.closeIdleConnections();
    // Rede de seguranca: um request pendurado (ex.: chamada externa sem
    // timeout) nao pode segurar o deploy pra sempre. unref pra nao impedir a
    // saida limpa pelo caminho feliz.
    const forceExitTimer = setTimeout(() => {
      process.exit(1);
    }, 15_000);
    forceExitTimer.unref();
    await Promise.allSettled([
      queueConnection?.quit().catch(() => {}),
      cacheConnection?.quit().catch(() => {}),
      Sentry.close(2000).catch(() => {}),
    ]);
  }

  process.on("SIGTERM", () => {
    void shutdown();
  });
  process.on("SIGINT", () => {
    void shutdown();
  });

  // Falha do listen (EADDRINUSE e companhia) chega como evento 'error' do
  // server. INTERACAO COM O uncaughtException LA DE CIMA, conferida antes de
  // escrever: sem ouvinte, o EventEmitter relanca o erro e ele sai pelo
  // `uncaughtException`, que encerra o processo mas NAO fecha os workers. Com
  // ouvinte, o evento e CONSUMIDO aqui e o `uncaughtException` nao dispara para
  // este caso, entao existe um caminho de saida so, sem exit duplo.
  //
  // Medido nesta base em 2026-09-02, com a porta ocupada de proposito: pelo
  // caminho antigo o processo JA saia com codigo 1. O que muda aqui e o
  // fechamento limpo dos workers antes de sair, nao a saida em si.
  server.on("error", (err) => {
    console.error("[fatal] erro no servidor HTTP:", err);
    Sentry.captureException(err);
    void encerrarComFalha();
  });

  server.listen(env.port, () => {
    console.log(`[server] rodando na porta ${env.port} (${env.nodeEnv})`);
  });
}

startServer().catch((err) => {
  // Antes isto era so `console.error`: uma falha no boot deixava o processo
  // vivo, sem servidor e com os workers de pe, que e a forma exata do processo
  // achado em 02/09. Agora fecha e sai com 1.
  console.error("[fatal] falha ao iniciar o servidor:", err);
  Sentry.captureException(err);
  void encerrarComFalha();
});
