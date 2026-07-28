// Guarda de ambiente: impede o APP de subir fora de producao apontando para
// credenciais de producao.
//
// O PROBLEMA MEDIDO (2026-07-28): o `.env` de desenvolvimento usa o MESMO projeto
// Supabase de producao (vlcvaanlkqyxemrxsxzn) e uma chave `sk_live`. Nao existe
// projeto de dev. Consequencia: `pnpm dev` e clicar em "assinar" COBRA CARTAO DE
// VERDADE e grava linha real em producao. Nada no codigo impedia isso.
//
// POR QUE ESTA VERIFICACAO NAO VIVE EM env.ts
// ---------------------------------------------------------------------------
// env.ts e avaliado por 7 scripts de `scripts/` (2 importam `lib/env` direto,
// 5 chegam por `lib/supabaseAdmin` -> `./env` e afins). Se o abort morasse na
// avaliacao do modulo, esta guarda mataria `cleanNonTechVagas`,
// `ingestFaculdadesCenso`, `stripe-backfill-transactions`, `generateQuizPool`,
// `aiUsageReport` e `runVagasSyncDev`, que rodam fora de producao COM chave live
// de proposito. E a "correcao" seria ligar a escotilha global em toda maquina de
// dev, o que transforma o guard em enfeite.
//
// Entao a guarda pertence ao BOOT DO APP e e chamada explicitamente por
// server/index.ts. Os scripts tem o caminho deles, tambem explicito: portao
// `--apply` (banco) ou `--confirm` (Stripe), dry-run por default. Duas defesas
// distintas para dois riscos distintos, nenhuma dependendo da outra.
//
// POR QUE A LOGICA E "EVIDENCIA POSITIVA DE DEV", E NAO "TUDO QUE NAO E PROD"
// ---------------------------------------------------------------------------
// A primeira versao abortava sempre que NODE_ENV !== "production". Isso apostava
// que producao declara NODE_ENV, e a aposta NAO se sustentou na medicao:
//
//   - `/api/health` do processo de producao devolve `"env": "production"`, entao
//     o VALOR esta certo hoje (medido em 2026-07-28, uptime de 13h);
//   - MAS `railway.json` declara `"startCommand": "node dist/index.js"`, SEM
//     NODE_ENV. O unico lugar do repositorio que declara e o `"start"` do
//     package.json (`NODE_ENV=production node dist/index.js`), e o railway.json
//     o SUBSTITUI. Ou seja, o valor vem de variavel de servico no painel (que eu
//     nao consigo ler) ou de default de plataforma.
//
// Default de plataforma pode mudar numa atualizacao do Railway. E o pior caso
// desta guarda com a logica antiga era A API INTEIRA FORA DO AR, porque ela roda
// no boot do unico processo web. Trocar por evidencia positiva de dev inverte a
// assimetria: o pior caso passa a ser "a guarda nao dispara num setup local
// exotico", e nesse caso as outras defesas seguem de pe (os portoes --apply e
// --confirm dos scripts).
//
// FALHA ABERTA de proposito, e esta e a decisao consciente: NODE_ENV com valor
// desconhecido, ou ausente sem `.env` no disco, NAO aborta.
//
// O marcador de fallback e a EXISTENCIA DO ARQUIVO `.env`, nao uma variavel:
// `.env` esta no .gitignore, portanto nunca entra na imagem do Railway, enquanto
// toda maquina de desenvolvimento tem um. E o mesmo principio do CI, que nao
// simula a ausencia do arquivo, simplesmente nao o tem.
//
// QUANDO A ESCOTILHA E LEGITIMA (PERMITIR_CHAVES_LIVE_EM_DEV=1)
//   - reproduzir localmente um bug que so aparece com dado de producao, em
//     LEITURA (abrir uma pagina, inspecionar um estado);
//   - depurar webhook com `stripe listen` apontando para o backend local.
// QUANDO NAO E
//   - "so para o dev subir". Se o objetivo e desenvolver, o certo e um projeto
//     Supabase de dev e uma chave sk_test_. Ver a secao de opcoes em
//     docs/ambiente-dev-aponta-para-producao.md.
// Com ela ligada, o boot loga um aviso ALTO toda vez, de proposito: escotilha
// silenciosa vira o default em duas semanas.

/**
 * Ref do projeto Supabase de PRODUCAO.
 *
 * Nao e segredo: vai no bundle do cliente em toda pagina. Esta escrito aqui como
 * constante, e nao inferido de "url remota == producao", para que criar um projeto
 * de dev de verdade passe nesta guarda sem ninguem ter que mexer nela.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

export const REF_SUPABASE_PRODUCAO = "vlcvaanlkqyxemrxsxzn";

export const ESCOTILHA = "PERMITIR_CHAVES_LIVE_EM_DEV";

export type EntradaAmbiente = {
  /** Valor CRU de process.env.NODE_ENV: `undefined` e diferente de "production". */
  nodeEnv: string | undefined;
  stripeSecretKey: string;
  supabaseUrl: string;
  escotilhaLigada: boolean;
  /** Existe arquivo `.env` no diretorio de trabalho (marcador de maquina de dev). */
  temArquivoEnvLocal: boolean;
};

export type VereditoAmbiente =
  | { tipo: "ok" }
  | { tipo: "escotilha"; achados: string[] }
  | { tipo: "abortar"; achados: string[] };

/**
 * Decisao PURA, para o teste exercitar a regra sem subir servidor nem mexer em
 * process.env.
 *
 * Em producao NAO ha veredito: `NODE_ENV=production` com credencial de producao e
 * exatamente o esperado, e uma guarda que reclamasse ali seria um alarme que se
 * aprende a ignorar.
 */
export function avaliarAmbiente(e: EntradaAmbiente): VereditoAmbiente {
  // Producao declarada: nunca ha veredito. Primeira porta, e a mais importante.
  if (e.nodeEnv === "production") return { tipo: "ok" };

  // EVIDENCIA POSITIVA de desenvolvimento. Sem ela, nao aborta.
  const declaradoDev = e.nodeEnv === "development" || e.nodeEnv === "test";
  const semNodeEnvComArquivo = !e.nodeEnv && e.temArquivoEnvLocal;
  if (!declaradoDev && !semNodeEnvComArquivo) return { tipo: "ok" };

  const achados: string[] = [];
  if (e.stripeSecretKey.startsWith("sk_live_")) {
    achados.push(
      "STRIPE_SECRET_KEY e sk_live_: um checkout aqui cobra cartao de verdade.",
    );
  }
  if (e.supabaseUrl.includes(REF_SUPABASE_PRODUCAO)) {
    achados.push(
      `VITE_SUPABASE_URL aponta para o projeto de PRODUCAO (${REF_SUPABASE_PRODUCAO}): toda escrita daqui e escrita real.`,
    );
  }

  if (achados.length === 0) return { tipo: "ok" };
  return e.escotilhaLigada
    ? { tipo: "escotilha", achados }
    : { tipo: "abortar", achados };
}

/** Mensagem de abort. Diz O QUE FAZER, nao so o que esta errado. */
export function mensagemDeAbort(
  achados: string[],
  nodeEnvLido: string | undefined,
): string {
  return [
    "",
    "==============================================================",
    "[ambiente] BOOT ABORTADO: credenciais de PRODUCAO fora de producao.",
    `[ambiente] NODE_ENV lido: ${nodeEnvLido === undefined ? "(ausente)" : `"${nodeEnvLido}"`}`,
    "==============================================================",
    ...achados.map((a) => `  - ${a}`),
    "",
    "  O que fazer, em ordem de preferencia:",
    "    1. usar um projeto Supabase de dev e STRIPE_SECRET_KEY=sk_test_...",
    "       (cartao de teste 4242 4242 4242 4242 funciona so em test mode);",
    `    2. rodar em producao de verdade (NODE_ENV=production), se e isso que`,
    "       voce quer;",
    `    3. se voce PRECISA de producao localmente e sabe o risco:`,
    `       ${ESCOTILHA}=1 pnpm dev`,
    "       Isso NAO e para desenvolver. Ver server/lib/ambienteSeguro.ts.",
    "",
    "  Script que precisa de producao NAO passa por aqui: use o portao do",
    "  proprio script (--apply para banco, --confirm para Stripe).",
    "==============================================================",
    "",
  ].join("\n");
}

/** Aviso da escotilha. ALTO de proposito, e em TODO boot. */
export function mensagemDaEscotilha(
  achados: string[],
  nodeEnvLido: string | undefined,
): string {
  return [
    "",
    "**************************************************************",
    `[ambiente] NODE_ENV lido: ${nodeEnvLido === undefined ? "(ausente)" : `"${nodeEnvLido}"`}`,
    `[ambiente] ${ESCOTILHA}=1 -- rodando contra PRODUCAO fora de producao.`,
    ...achados.map((a) => `  ! ${a}`),
    "  Toda escrita daqui atinge cliente real. Desligue quando terminar.",
    "**************************************************************",
    "",
  ].join("\n");
}

/**
 * Chamada pelo BOOT DO APP (server/index.ts). Aborta o processo, nao lanca: o
 * ponto e nao subir, e um throw poderia ser engolido por algum wrapper.
 */
export function assertAmbienteSeguro(): void {
  // Valor CRU, sem `|| "development"`: a ausencia de NODE_ENV e informacao, e
  // colapsa-la em "development" era o que fazia a guarda abortar em producao caso
  // a plataforma parasse de definir a variavel.
  const nodeEnvLido = process.env.NODE_ENV;
  const veredito = avaliarAmbiente({
    nodeEnv: nodeEnvLido,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    supabaseUrl:
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
    escotilhaLigada: process.env[ESCOTILHA] === "1",
    temArquivoEnvLocal: existsSync(join(process.cwd(), ".env")),
  });

  if (veredito.tipo === "ok") return;
  if (veredito.tipo === "escotilha") {
    console.warn(mensagemDaEscotilha(veredito.achados, nodeEnvLido));
    return;
  }
  console.error(mensagemDeAbort(veredito.achados, nodeEnvLido));
  process.exit(1);
}
