import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

const PROJECT_ROOT = import.meta.dirname;

/**
 * Release do Sentry, derivada e nao cadastrada.
 *
 * A Vercel expoe `VERCEL_GIT_COMMIT_SHA` sozinha no build. Cadastrar
 * `VITE_SENTRY_RELEASE` a mao no dashboard seria PIOR: a Vercel nao interpola
 * `$VAR` no valor, entao o bundle receberia a string literal
 * "$VERCEL_GIT_COMMIT_SHA" como nome de release.
 *
 * Fallback vazio de proposito: sem release o Sentry agrupa sem versao, o que
 * degrada a leitura mas nao quebra build nenhum (local, CI, ou Vercel sem git).
 */
const SENTRY_RELEASE = process.env.VERCEL_GIT_COMMIT_SHA || "";
if (SENTRY_RELEASE) process.env.VITE_SENTRY_RELEASE = SENTRY_RELEASE;

/**
 * Upload de source map, LIGADO PELA PRESENCA DO TOKEN.
 *
 * O guard e aqui, no config, e nao na confianca de que o plugin degrada bem
 * sozinho. A documentacao dele diz que avisa e segue sem token; isso pode ser
 * verdade e pode mudar de versao. Ausencia como no-op ESTRUTURAL nao depende do
 * comportamento de terceiro, e build local e CI nunca terao esse token.
 *
 * `sourcemap: "hidden"` (em `build`, abaixo) NAO basta sozinho para o mapa nao
 * vazar: ele so omite o comentario `sourceMappingURL`, e o arquivo `.map`
 * continua no outDir, que a Vercel serve inteiro. Quem adivinhar a URL baixa o
 * codigo-fonte. Quem resolve e o `filesToDeleteAfterUpload` abaixo.
 */
const SENTRY_UPLOAD_ATIVO = Boolean(process.env.SENTRY_AUTH_TOKEN);

/**
 * Valvula de emergencia. Setada, o upload falho vira AVISO em vez de erro.
 *
 * Existe por um motivo unico e nomeado: indisponibilidade do Sentry nao pode
 * impedir um hotfix. Sem ela, "quebrar o build" acopla a capacidade de
 * DEPLOYAR a saude de um terceiro, e o momento em que o Sentry cair e
 * exatamente o momento em que voce pode precisar subir alguma coisa correndo.
 *
 * Deliberada e visivel de proposito: quem a usa esta escolhendo subir sem
 * telemetria, uma vez, sabendo. Diferente do estado anterior, em que subir sem
 * telemetria era o comportamento padrao e silencioso.
 */
const SENTRY_SOURCEMAPS_OPCIONAL = Boolean(
  process.env.SENTRY_SOURCEMAPS_OPCIONAL,
);

/**
 * Upload falho QUEBRA o build. Decisao, com o contra-argumento respondido.
 *
 * O estado que isto corrige: token invalido produzia `exit 0`, mapas apagados,
 * e nenhum sinal. Deploy verde, telemetria cega, e a descoberta acontecendo
 * semanas depois, dentro de um incidente, que e o pior momento possivel. Foi
 * um defeito da MESMA classe da auditoria inteira, criado dentro da correcao
 * dela: instrumento que reporta sucesso sobre uma superficie menor.
 *
 * POR QUE NAO "AVISAR ALTO". O aviso iria para o log de build da Vercel, e o
 * argumento contra e o que esta base ja mediu em outra camada: `console.warn`
 * do servidor morre no log do Railway porque ninguem abre log sem ja estar
 * procurando alguma coisa. Log de build tem exatamente a mesma propriedade, com
 * o agravante de que build verde e o sinal que a pessoa realmente le. Um aviso
 * dentro de um build verde e indistinguivel de silencio.
 *
 * POR QUE NAO CLASSIFICAR O ERRO (401 quebra, rede avisa). Foi a primeira
 * versao desta funcao e eu a descartei: classificar exigiria casar a mensagem
 * do `sentry-cli` ("Invalid org token (http status: 401)") por texto, e um
 * casamento de padrao que pode sub-casar em silencio e a classe de defeito que
 * este repositorio persegue. Se o Sentry mudasse a frase, o 401 cairia no ramo
 * "transitorio" e voltaria a subir verde, que e o bug original de volta.
 *
 * Entao: falha nao classificada ABORTA, e a excecao e explicita
 * (SENTRY_SOURCEMAPS_OPCIONAL), no lugar de implicita. Mesmo desenho do
 * `scripts/mutateLinkedinThresholds.mjs`, onde item nao classificado derruba a
 * execucao em vez de passar batido.
 */
function tratarFalhaDeUpload(err: Error): void {
  const aviso = [
    "",
    "════════════════════════════════════════════════════════════════",
    "  UPLOAD DE SOURCE MAP FALHOU",
    "",
    `  ${err.message.split("\n")[0]}`,
    "",
    "  O bundle sobe sem source map: todo stack no Sentry vira",
    "  index-XXXX.js:1:48213, ilegivel.",
    "",
    "  Causa provavel: SENTRY_AUTH_TOKEN expirado, rotacionado, ou sem",
    "  escopo project:releases. Confira tambem SENTRY_ORG e SENTRY_PROJECT.",
    "",
    "  Se o Sentry estiver fora do ar e voce PRECISA subir agora:",
    "    SENTRY_SOURCEMAPS_OPCIONAL=1",
    "  Isso faz esta falha virar aviso. Use e desfaca.",
    "════════════════════════════════════════════════════════════════",
    "",
  ].join("\n");

  if (SENTRY_SOURCEMAPS_OPCIONAL) {
    console.warn(aviso);
    return;
  }
  console.error(aviso);
  throw err;
}

const plugins = [react(), tailwindcss()];

if (SENTRY_UPLOAD_ATIVO) {
  plugins.push(
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      release: SENTRY_RELEASE ? { name: SENTRY_RELEASE } : undefined,
      errorHandler: tratarFalhaDeUpload,
      sourcemaps: {
        // Apaga o .map do outDir depois de enviar. Sem isto o mapa fica publico.
        filesToDeleteAfterUpload: ["dist/public/**/*.js.map"],
      },
    }),
  );
}

// Analise de bundle sob demanda: ANALYZE=1 pnpm build gera bundle-stats.html.
if (process.env.ANALYZE) {
  plugins.push(
    visualizer({
      filename: "bundle-stats.html",
      gzipSize: true,
      template: "treemap",
    }),
  );
}

export default defineConfig(({ command, mode }) => {
  const envDir = path.resolve(PROJECT_ROOT);

  return {
    plugins: command === "serve" ? [...plugins, jsxLocPlugin()] : plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir,
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      // Source map SO existe quando ha quem o envie E o apague.
      //
      // "hidden" omite o comentario `sourceMappingURL`, entao nenhum navegador
      // pede o arquivo; mas o `.map` continua no outDir, e a Vercel serve o
      // outDir inteiro. Quem apaga e o `filesToDeleteAfterUpload` do plugin.
      //
      // Por que amarrado ao token, e nao ligado sempre: com `sourcemap:
      // "hidden"` fixo, um build SEM token gera os mapas e nao tem quem os
      // apague, publicando 529 arquivos de codigo-fonte. Medido, nao suposto: e
      // exatamente o que aconteceu na primeira versao deste config. Isso faria
      // uma propriedade de seguranca depender de uma variavel de ambiente estar
      // setada, que e a forma de falha que esta base persegue. Amarrado assim,
      // a ausencia do token nao gera nada, entao nao ha o que vazar.
      sourcemap: SENTRY_UPLOAD_ATIVO ? "hidden" : false,
      rollupOptions: {
        output: {
          // Chunks manuais por ciclo de vida de mudanca: vendors so mudam em
          // bump de dependencia e dados so mudam em edicao de conteudo, entao
          // seus hashes sobrevivem aos deploys de feature. O resto segue o
          // split default do Rollup.
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (/node_modules\/(react|react-dom|scheduler|wouter)\//.test(id)) {
                return "react-vendor";
              }
              if (id.includes("node_modules/@supabase/")) {
                return "supabase";
              }
              if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) {
                return "motion";
              }
              if (id.includes("node_modules/posthog-js/")) {
                return "analytics";
              }
              // Sem este pin o Rollup funde os icones compartilhados dentro do
              // app-data (chunk manual rouba dependencia comum), e o boot passa
              // a importar o app-data inteiro so pra pegar icone.
              if (id.includes("node_modules/lucide-react/")) {
                return "icons";
              }
              return undefined;
            }
            // dicasData e eventosData ficam FORA do app-data de proposito:
            // a home os carrega sob demanda e nao pode arrastar o chunk todo.
            // eventosData e pinado em chunk proprio porque data.ts o reexporta;
            // sem o pin, o Rollup o fundiria de volta no app-data.
            if (id.includes("client/src/lib/eventosData.ts")) {
              return "eventos-data";
            }
            // slugify e quizMeta sao usados pelo boot da home E por modulos do
            // app-data; pinados num chunk minimo para o Rollup nao os fundir no
            // app-data (o que arrastaria o app-data inteiro pro boot).
            if (
              id.includes("client/src/lib/slugify.ts") ||
              id.includes("client/src/lib/quizMeta.ts")
            ) {
              return "boot-utils";
            }
            if (
              id.includes("client/src/lib/data.ts") ||
              id.includes("client/src/lib/platformData.ts") ||
              id.includes("client/src/lib/technologyData.ts") ||
              id.includes("shared/glossaryData.ts")
            ) {
              return "app-data";
            }
            return undefined;
          },
        },
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: "http://localhost:3100",
          changeOrigin: true,
        },
      },
      strictPort: false, // Will find next available port if 3000 is busy
      host: true,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        // Túneis (ngrok, etc.): cobre *.ngrok-free.app e variantes
        ".ngrok-free.app",
        ".ngrok-free.dev",
        ".ngrok.io",
        ".ngrok.app",
        ".ngrok.dev",
      ],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
