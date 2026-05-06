import { createServer } from "http";

import app from "./app";
import { env } from "./lib/env";
import { createEmailWorker } from "./lib/queue";

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
