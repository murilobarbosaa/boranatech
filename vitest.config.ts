import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

// Config dedicada de testes — NÃO herda o `root: client/` do vite.config.ts.
// Replica exatamente os aliases do vite.config.ts (@, @shared, @assets).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  test: {
    environment: "jsdom",
    // TETO DE WORKERS. Sem isto o vitest abre um worker por CPU (16 nesta
    // maquina) e a suite pica em 3,65 GB. Duas suites concorrentes ja passam de
    // 7 GB, e em 2026-07-28 um `kill -9` do OOM matou o pre-commit no meio
    // (registrado no proprio hook); em 2026-07-30 o oom-killer derrubou a
    // sessao grafica com dois worktrees ativos. Com varias frentes em paralelo
    // o numero de CPUs deixa de ser o limite certo, porque cada sessao acha que
    // a maquina e so dela.
    //
    // Medido nesta maquina (16 CPUs, 15 GB), pool `forks`, suite inteira:
    //   default(16) 13,3s / 3,65 GB      8 workers 16,4s / 2,30 GB
    //   6 workers   20,6s / 1,94 GB      4 workers 26,2s / 1,36 GB
    //   2 workers   37,6s / 0,80 GB
    // `pool: "threads"` foi medido e descartado: nao ganha em nenhum ponto
    // (4 workers deram 27,4s / 1,52 GB, pior nos dois eixos que `forks`).
    //
    // 4 porque o pior caso real e 3 a 4 sessoes: 4 x 1,36 GB = 5,4 GB deixa
    // folga para navegador e editor; 4 x 3,65 GB = 14,6 GB nao cabe em 15.
    //
    // Mora AQUI, e nao como `--maxWorkers` no hook, pela regra do CLAUDE.md:
    // protecao dentro da funcao, nunca no call site. O hook roda a suite DUAS
    // vezes (a segunda sobre o indice materializado, que inclui este arquivo),
    // e a flag teria que ser repetida nas duas; o CI e as execucoes manuais
    // ficariam de fora de qualquer jeito.
    maxWorkers: 4,
    include: [
      "client/src/**/*.test.{ts,tsx}",
      "server/**/*.test.ts",
      "shared/**/*.test.ts",
      // `scripts/` entrou porque o guard de migrations tem logica de verdade
      // (a classificacao de RLS) e ela precisava de teste. Teste em pasta fora
      // do include nao roda, que e pior que teste nenhum: da a impressao de
      // cobertura sem ter nenhuma.
      "scripts/**/*.test.ts",
    ],
    environmentMatchGlobs: [
      ["server/**", "node"],
      ["shared/**", "node"],
      ["scripts/**", "node"],
    ],
  },
});
