# Teste de carga (k6)

Mede requests/segundo sustentaveis do backend com trafego de leitura publica
(descoberta 70%, detalhe 20%, health 10%). Nao toca IA, billing nem escrita.

**ALVO: SEMPRE STAGING.** Nunca rode contra producao: o teste sobe ate 600
VUs e vai consumir banda, Supabase e Redis do ambiente alvo. A URL vem
exclusivamente da env `BASE_URL`; nao existe default de proposito.

## Pre-requisito: staging no Railway

1. No Railway, duplique o servico do backend (New Service > Deploy from repo,
   mesma branch) ou crie um environment de staging do projeto.
2. Copie as variaveis do servico de producao. Use um Redis proprio de staging
   (ou o mesmo, sabendo que rate limit e cache serao compartilhados; o ideal
   e separado).
3. Defina no staging: `RATE_LIMIT_MAX_REQUESTS=100000`. Sem isso o rate limit
   de producao (180 req/min/IP) derruba o teste com 429 (as maquinas do k6
   saem de poucos IPs). Producao NAO leva essa variavel.
4. Anote a URL publica do staging (ex.: `https://<staging>.up.railway.app`).

## Instalar o k6

- Linux (pacote): https://grafana.com/docs/k6/latest/set-up/install-k6/
- Ou binario direto:
  `curl -L https://github.com/grafana/k6/releases/download/v0.57.0/k6-v0.57.0-linux-amd64.tar.gz | tar xz`
  e use o executavel `k6` extraido.

## Rodar

Teste completo (~11 minutos, rampa 100 -> 300 -> 600 VUs + plato):

    k6 run -e BASE_URL=https://<staging>.up.railway.app k6/load-test.js

Smoke (5 VUs por 30s, so valida que o script roda; nao e o teste real):

    k6 run -e BASE_URL=http://localhost:3100 -e SMOKE=1 k6/load-test.js

## Como ler o resultado

- `http_reqs`: total de requests e a taxa media (RPS). O RPS sustentado no
  plato de 600 VUs e o numero que queremos.
- `http_req_duration p(95)`: 95% dos requests abaixo disso. Threshold do
  script: **p(95) < 500ms**; estourou, o sumario marca a linha com um X e o
  k6 sai com codigo != 0.
- `http_req_failed`: fracao de respostas fora de 2xx/3xx. Threshold:
  **< 1%**.
- `checks`: percentual de status 200 por rota (areas, roadmaps, news, itens
  por slug, health).
- `http_429` (metrica custom): se aparecer QUALQUER valor aqui, a env
  `RATE_LIMIT_MAX_REQUESTS` nao foi aplicada no staging e o resultado mede o
  rate limit, nao o backend. Corrija a env e repita.

Os slugs do cenario de detalhe estao no topo do `load-test.js`; edite ali se
o catalogo mudar.
