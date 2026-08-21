---
paths:
  - ".github/workflows/**"
---

# Workflows do GitHub Actions

- Se PR voltar a ser usado neste repositório, filtrar um dos dois gatilhos: `on: push` sem filtro mais `pull_request` faz o workflow rodar duas vezes num PR do mesmo repositório (contexto e data em `docs/decisoes.md#gatilhos-do-ci`).
- O job `qualidade` não recebe secret nenhum, e é de propósito: ele não simula a ausência do `.env`, ele genuinamente não tem `.env` (detalhe em `docs/postmortems-instrumentos.md#nao-simular-a-condicao`).
- O job `migrations` precisa dos secrets `VITE_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`; sem eles falha com mensagem explícita, o que é o comportamento desejado (ver `.claude/rules/migrations.md`).
