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
