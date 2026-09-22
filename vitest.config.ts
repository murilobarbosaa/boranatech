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
    // FUSO FIXADO EM BRASILIA, e nao herdado da maquina.
    //
    // O produto e brasileiro e a producao le datas nesse fuso; o CI do GitHub
    // roda em UTC. Sem fixar, o mesmo teste de data passa aqui (a maquina esta
    // em -03) e da outro resultado la, e a classe de defeito que mais aparece
    // nesta base — dia deslocado por fuso — fica INVISIVEL exatamente onde a
    // verificacao deveria ser mais dura. E o mesmo raciocinio do job `qualidade`
    // rodar sem `.env`: o instrumento tem de reproduzir a condicao real.
    //
    // Efeito colateral desejado: teste de data escrito daqui em diante falha se
    // trocar o dia, em vez de depender de quem roda.
    env: { TZ: "America/Sao_Paulo" },
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
    //
    // NO CI, 2. O runner `ubuntu-latest` tem 4 vCPU, e 4 workers `forks` mais
    // o processo principal do vitest (que recebe os relatorios de cada worker
    // por RPC) saturam os 4 nucleos: na run 35770625809 (2026-09-22) a suite
    // passou inteira (6955 testes) e o job caiu com
    // `Error: [vitest-worker]: Timeout calling "onTaskUpdate"`, um worker sem
    // tempo de CPU para reportar ao principal dentro do prazo do RPC. O
    // rerun passou, o que e a assinatura de saturacao, nao de teste quebrado.
    // Com 2 workers sobram 2 nucleos para o principal e para o jsdom, e o job
    // continua na mesma ordem de grandeza (a suite e limitada por I/O de
    // transform e collect, nao pelos workers). So `process.env.CI`, que o
    // GitHub Actions define e a maquina local e o hook nao: o teto de 4 acima
    // continua valendo aqui.
    maxWorkers: process.env.CI ? 2 : 4,
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
