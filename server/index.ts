// PRIMEIRO import de proposito: o sentry.ts se auto-inicializa na avaliacao
// do modulo, antes do Express e do resto do app carregarem. Nao reordenar.
import "./lib/sentry";

import * as Sentry from "@sentry/node";
import { createServer } from "http";

import app from "./app";
import { env } from "./lib/env";
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
  const emailWorker = env.redisUrl
    ? (() => {
        try {
          return createEmailWorker();
        } catch (err) {
          console.error("[queue] Erro ao iniciar worker de e-mail:", err);
          return null;
        }
      })()
    : null;
  const emailCampaignWorker = env.redisUrl
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
    env.redisUrl && env.nfseEnabled
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

  server.listen(env.port, () => {
    console.log(`[server] rodando na porta ${env.port} (${env.nodeEnv})`);
  });
}

startServer().catch(console.error);
