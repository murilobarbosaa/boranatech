import { createServer } from "http";

import app from "./app";
import { env } from "./lib/env";
import { createEmailWorker } from "./lib/queue";
import { cacheConnection, queueConnection } from "./lib/redis";

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
