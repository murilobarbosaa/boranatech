// Teste de carga do backend Bora na Tech (leitura publica, SEM IA/billing/
// escrita). Alvo SEMPRE via env BASE_URL e SEMPRE staging, nunca producao:
//   k6 run -e BASE_URL=https://<staging>.up.railway.app k6/load-test.js
// Smoke local (5 VUs, 30s, so pra validar o script):
//   k6 run -e BASE_URL=http://localhost:3100 -e SMOKE=1 k6/load-test.js
// Pre-requisito no staging: RATE_LIMIT_MAX_REQUESTS alto (ver README).

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL;
if (!BASE_URL) {
  throw new Error(
    "Defina BASE_URL apontando pro STAGING. Ex.: k6 run -e BASE_URL=https://<staging>.up.railway.app k6/load-test.js",
  );
}

// Se este contador subir, a env RATE_LIMIT_MAX_REQUESTS nao foi aplicada no
// staging: o teste esta medindo o rate limit (180/min/IP), nao o backend.
const rateLimited429 = new Counter("http_429");

// Slugs reais de producao pro cenario de detalhe. Editar aqui se o catalogo
// mudar.
const AREA_SLUGS = ["frontend", "backend", "dados"];
const ROADMAP_SLUGS = ["frontend", "backend", "dados"];
const TECH_SLUGS = ["html", "css", "javascript"];

const SMOKE = __ENV.SMOKE === "1";

// Pesos: descoberta ~70%, detalhe ~20%, health ~10% dos VUs em cada estagio.
// Estagios (executor ramping-vus): 2min ate 100 VUs totais, 3min ate 300,
// 3min ate 600, 2min de plato em 600, 1min de rampdown (~11min).
const SCALE = (() => {
  const raw = parseFloat(__ENV.SCALE || "1");
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
})();

function stages(share) {
  const of = (total) => Math.max(1, Math.round(total * share * SCALE));
  return [
    { duration: "2m", target: of(100) },
    { duration: "3m", target: of(300) },
    { duration: "3m", target: of(600) },
    { duration: "2m", target: of(600) },
    { duration: "1m", target: 0 },
  ];
}

const scenarios = SMOKE
  ? {
      descoberta: {
        executor: "constant-vus",
        exec: "descoberta",
        vus: 3,
        duration: "30s",
      },
      detalhe: {
        executor: "constant-vus",
        exec: "detalhe",
        vus: 1,
        duration: "30s",
      },
      health: {
        executor: "constant-vus",
        exec: "health",
        vus: 1,
        duration: "30s",
      },
    }
  : {
      descoberta: {
        executor: "ramping-vus",
        exec: "descoberta",
        startVUs: 0,
        stages: stages(0.7),
      },
      detalhe: {
        executor: "ramping-vus",
        exec: "detalhe",
        startVUs: 0,
        stages: stages(0.2),
      },
      health: {
        executor: "ramping-vus",
        exec: "health",
        startVUs: 0,
        stages: stages(0.1),
      },
    };

export const options = {
  scenarios,
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function get(path, label) {
  const res = http.get(`${BASE_URL}${path}`, { tags: { name: label } });
  if (res.status === 429) {
    rateLimited429.add(1);
  }
  check(res, { [`${label} 200`]: (r) => r.status === 200 });
  return res;
}

// ~70%: navegacao de descoberta (listas publicas), pausa 1-3s entre paginas
// simulando leitura real.
export function descoberta() {
  const paginas = [
    ["/api/content/areas", "areas"],
    ["/api/content/roadmaps", "roadmaps"],
    ["/api/content/technologies", "technologies"],
    ["/api/content/courses", "courses"],
    ["/api/content/news?page=1", "news"],
  ];
  for (const [path, label] of paginas) {
    get(path, label);
    sleep(1 + Math.random() * 2);
  }
}

// ~20%: paginas de detalhe por slug.
export function detalhe() {
  get(`/api/content/areas/${pick(AREA_SLUGS)}`, "area-item");
  sleep(1 + Math.random() * 2);
  get(`/api/content/roadmaps/${pick(ROADMAP_SLUGS)}`, "roadmap-item");
  sleep(1 + Math.random() * 2);
  get(`/api/content/technologies/${pick(TECH_SLUGS)}`, "tech-item");
  sleep(1 + Math.random() * 2);
}

// ~10%: liveness (mesmo endpoint do healthcheck do Railway).
export function health() {
  get("/api/health/live", "health-live");
  sleep(1);
}
