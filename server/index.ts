import { createServer } from "http";

import app from "./app";
import { env } from "./lib/env";

async function startServer() {
  const server = createServer(app);
  server.listen(env.port, () => {
    console.log(`[server] rodando na porta ${env.port} (${env.nodeEnv})`);
  });
}

startServer().catch(console.error);
