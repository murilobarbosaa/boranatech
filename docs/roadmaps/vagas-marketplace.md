# Roadmap — Vagas Marketplace BoraNaTech

Sistema de vagas multi-source com tier free/Pro, suporte BR e Exterior,
e canal pra parcerias B2B (acordadas offline, postadas via admin).

## Decisões tomadas

| Dimensão            | Decisão                                            |
| ------------------- | -------------------------------------------------- |
| **Tier BR**         | Free — todos veem                                  |
| **Tier Exterior**   | Pro (premium)                                      |
| **UI**              | Tabs separadas: "Vagas BR" / "Vagas Exterior Pro"  |
| **Fontes BR**       | A definir (scraping ou parcerias)                  |
| **Fontes Exterior** | Jooble (curto) + RemoteOK/We Work Remotely (médio) |
| **B2B Marketplace** | Não exposto. Acordos offline, postados via admin   |
| **Cadastro manual** | Sim, via admin (parcerias B2B + curadoria)         |

## Arquitetura

### Schema enriquecido (`external_jobs`)

```sql
ALTER TABLE public.external_jobs ADD COLUMN:
  country         TEXT NOT NULL DEFAULT 'BR'
  is_international BOOLEAN NOT NULL DEFAULT false
  is_pro          BOOLEAN NOT NULL DEFAULT false
  source          TEXT NOT NULL
  source_url      TEXT
  is_partner      BOOLEAN NOT NULL DEFAULT false
  partner_name    TEXT
  partner_logo_url TEXT
  expires_at      TIMESTAMPTZ
  salary_min      INTEGER
  salary_max      INTEGER
  salary_currency TEXT
  benefits        TEXT[]
  apply_url       TEXT
```

### Fontes (módulos independentes em server/jobs/sources/)

- jooble.ts (API oficial, USA)
- remoteok.ts (RSS)
- weworkremotely.ts (RSS)
- programathor.ts (RSS, BR — investigar)
- trampos.ts (RSS, BR — investigar)
- manual.ts (sem ingestion, só admin)

### UI (/estagio aba Vagas)

- Sub-tab "Brasil" (free, sempre visível)
- Sub-tab "Exterior" (badge Pro, gate)
- Vagas com is_partner=true ganham badge "Parceria oficial"

## Fases de execução

### Fase 1 — Foundation (~3-4h)

- Migration colunas em external_jobs
- Refactor syncJobs.ts (country, source, is_international)
- Refactor contentService.ts (remover bug `|| "Brasil"`)
- Endpoint /api/content/jobs?country=BR|exterior
- UI 2 sub-tabs em /estagio
- Gate Pro na sub-tab Exterior
- Copy adaptada

### Fase 2 — Jooble exterior (~1h)

- Migration reabilitar cron sync-jobs
- Refactor syncJobs.ts: query sem location, marcar is_international/is_pro/country='US'
- Trigger manual + validar
- QA

### Fase 3 — Admin + parcerias (~2-3h)

- Admin UI: form com is_partner, partner_name, expires_at
- Validação editorial (parceira precisa logo)
- Badge "Parceria oficial" UI pública
- Cron expire-partner-jobs diário

### Fase 4 — RemoteOK + WeWorkRemotely (~2-3h)

- Source remoteok.ts (RSS)
- Source weworkremotely.ts (RSS)
- Cron unificado + dedupe global
- QA

### Fase 5 — Fontes BR (~3-5h, exploratório)

- Investigação legal de fontes (Programathor, Trampos, governo)
- Implementar 1-2 fontes aprovadas
- Cron BR independente

### Fase 6 — Polimento (sob demanda)

- Filtros avançados
- Recomendação personalizada
- Notificações
- Analytics

## Esforço total realista

- Código: 11-16h
- Investigação legal: 1-2h
- Decisões editoriais: variável (com Ana)
- **Total: ~15-20h em 4-6 sessões**

## Riscos

| Risco                                    | Mitigação                                        |
| ---------------------------------------- | ------------------------------------------------ |
| Scraping ilegal compromete parcerias B2B | APIs/RSS oficiais; scraping só com consentimento |
| Jooble = só USA                          | RemoteOK + WWR diversificam                      |
| Vagas expiradas poluem UI                | Cron expire-jobs diário                          |
| Parceiros pedem alteração pós-post       | Admin UI com edit completo                       |
| Volume BR baixo                          | Cadastro manual como fallback                    |
| Gate Pro frustra sem volume              | Lançar Exterior só com 20+ vagas                 |

## Decisões pendentes

1. Mínimo de vagas pra lançar Exterior Pro? (20? 50? 100?)
2. Salário exterior em BRL ou moeda original?
3. Aplicar diretamente ou redirecionar pra fonte?
4. Logo de parceiro — como obter?
5. Prazo padrão de parceria? (90 dias?)
6. Categorização reusa schema atual ou expande?

## Próximo passo

Começar pela Fase 1 (foundation) — desbloqueia todas as outras.
