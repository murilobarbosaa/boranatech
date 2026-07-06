// PRIMEIRO import de proposito: o sentry.ts se auto-inicializa na avaliacao
// do modulo, antes do Express e do resto do app carregarem. Nao reordenar.
import "./lib/sentry";

import * as Sentry from "@sentry/node";
import { createServer } from "http";

import app from "./app";
import { env } from "./lib/env";
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

  async function shutdown() {
    await emailWorker?.close();
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
