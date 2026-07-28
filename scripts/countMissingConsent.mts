/**
 * Contagem SOMENTE LEITURA de usuarios sem consentimento na versao atual.
 *
 * Existe para responder ao item B com um numero, sem escrever nada. O backfill foi
 * CANCELADO de proposito: carimbar accepted_at para quem talvez nunca tenha
 * consentido fabrica prova de consentimento, o que piora a posicao de LGPD em vez
 * de melhorar. Este script mede a exposicao, nao a corrige.
 *
 * Uso:
 *   set -a && . ./.env && set +a
 *   npx tsx scripts/countMissingConsent.mts
 *
 * GARANTIA DE LEITURA PURA: as unicas requisicoes emitidas sao GET e HEAD, e o
 * unico helper de rede do arquivo (`get`) fixa o metodo. Nao ha caminho neste
 * script que emita POST/PATCH/PUT/DELETE.
 *
 * SOBRE A CONTAGEM: o script afirma o TOTAL e confere as somas, em vez de so
 * reportar "achei N". Um scan paginado que para cedo devolve um numero menor e
 * plausivel, e a versao anterior desse tipo de erro nesta base (`contarLinhas`
 * devolvendo -1, o regex que enxergava 38 de 72 tabelas) sempre reportou sucesso
 * sobre uma superficie menor. Aqui, divergencia entre o total declarado pelo
 * PostgREST e o total efetivamente lido ABORTA.
 */

import {
  CONSENT_DOCUMENTS,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from "../shared/consent.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "[countMissingConsent] faltam VITE_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no ambiente.",
  );
  process.exit(1);
}

const PAGE = 1000;

function abortar(mensagem: string): never {
  console.error(`[countMissingConsent] ${mensagem}`);
  process.exit(1);
}

/**
 * Unico helper de rede. Metodo fixo em GET: nao ha como este script escrever.
 * `path` e relativo a raiz do projeto Supabase (ex.: "rest/v1/...", "auth/v1/...").
 *
 * fetch cru em vez de supabase-js pelo mesmo motivo dos outros scripts da pasta:
 * nenhum deles usa o SDK, e o build CJS do supabase-js nao tem named export sob
 * ESM (.mts), entao importar ali quebra no carregamento.
 */
async function get(
  path: string,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  return fetch(`${supabaseUrl}/${path}`, {
    method: "GET",
    headers: {
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...extraHeaders,
    },
  });
}

/** Total exato declarado pelo PostgREST no header Content-Range. */
function totalDoContentRange(res: Response, contexto: string): number {
  const range = res.headers.get("content-range");
  const total = range?.split("/")[1];
  if (!total || total === "*") {
    abortar(
      `${contexto}: PostgREST nao devolveu total no content-range ("${range}"). Sem o total nao da para afirmar a contagem.`,
    );
  }
  const n = Number(total);
  if (!Number.isFinite(n) || n < 0) {
    abortar(`${contexto}: total nao numerico no content-range ("${range}").`);
  }
  return n;
}

/**
 * Le TODAS as linhas de user_consents nas versoes atuais, paginando por Range e
 * conferindo o total no fim. Filtra por versao no servidor: linha de versao antiga
 * nao conta como consentimento atual, que e a mesma regra do `hasCurrentConsent`
 * em server/routes/consent.ts (fonte unica da decisao do gate).
 */
async function lerConsentimentosAtuais(): Promise<{
  porUsuario: Map<string, Set<string>>;
  totalLinhas: number;
}> {
  const documentos = CONSENT_DOCUMENTS.join(",");
  // Cada documento tem a sua versao, entao o filtro e um OR de dois pares
  // (documento, versao). Nao filtrar por `version=in.(...)` solto: isso aceitaria
  // terms na versao de privacy, e passaria a contar como valido um par que o gate
  // recusa.
  const filtro =
    `or=(and(document.eq.terms,version.eq.${TERMS_VERSION}),` +
    `and(document.eq.privacy,version.eq.${PRIVACY_VERSION}))`;
  const base = `rest/v1/user_consents?select=user_id,document&${filtro}`;

  const porUsuario = new Map<string, Set<string>>();
  let lidas = 0;
  let totalDeclarado: number | null = null;

  for (let from = 0; ; from += PAGE) {
    const res = await get(base, {
      Range: `${from}-${from + PAGE - 1}`,
      "Range-Unit": "items",
      Prefer: "count=exact",
    });
    if (!res.ok && res.status !== 206) {
      abortar(
        `falha ao ler user_consents (HTTP ${res.status}): ${await res.text()}`,
      );
    }
    const total = totalDoContentRange(res, "user_consents");
    if (totalDeclarado === null) totalDeclarado = total;
    else if (total !== totalDeclarado) {
      abortar(
        `total de user_consents mudou durante o scan (${totalDeclarado} -> ${total}). Rode de novo: uma contagem sobre alvo em movimento nao vale.`,
      );
    }

    const rows = (await res.json()) as Array<{
      user_id: string;
      document: string;
    }>;
    for (const row of rows) {
      const set = porUsuario.get(row.user_id) ?? new Set<string>();
      set.add(row.document);
      porUsuario.set(row.user_id, set);
    }
    lidas += rows.length;

    if (rows.length < PAGE) break;
  }

  if (totalDeclarado === null) abortar("nenhuma pagina lida de user_consents.");
  // A assercao que impede o "sucesso sobre superficie menor": se a paginacao parou
  // antes do fim, o numero final seria menor e plausivel, e ninguem notaria.
  if (lidas !== totalDeclarado) {
    abortar(
      `scan incompleto de user_consents: PostgREST declara ${totalDeclarado} linhas, li ${lidas}. Abortando em vez de reportar contagem parcial.`,
    );
  }
  console.log(
    `[countMissingConsent] user_consents nas versoes atuais: ${lidas} linha(s), conferido contra o total declarado.`,
  );
  return { porUsuario, totalLinhas: lidas };
}

/**
 * Total de usuarios em auth.users, via Admin API do GoTrue (paginado).
 *
 * PostgREST nao alcanca o schema `auth`, entao nao da para contar por lá. Pagina
 * ate a pagina vir incompleta e confere contra o X-Total-Count quando o GoTrue o
 * envia, pelo mesmo motivo da assercao de total do outro scan.
 */
async function contarUsuariosAuth(): Promise<number> {
  let total = 0;
  let declarado: number | null = null;

  for (let page = 1; ; page++) {
    const res = await get(`auth/v1/admin/users?page=${page}&per_page=${PAGE}`);
    if (!res.ok) {
      abortar(
        `falha ao listar auth.users (HTTP ${res.status}): ${await res.text()}`,
      );
    }
    const header = res.headers.get("x-total-count");
    if (header !== null && declarado === null) {
      const n = Number(header);
      if (Number.isFinite(n)) declarado = n;
    }
    const body = (await res.json()) as { users?: unknown[] };
    const n = Array.isArray(body.users) ? body.users.length : 0;
    total += n;
    if (n < PAGE) break;
  }

  if (declarado !== null && declarado !== total) {
    abortar(
      `scan incompleto de auth.users: GoTrue declara ${declarado} usuarios, li ${total}. Abortando em vez de reportar contagem parcial.`,
    );
  }
  return total;
}

/** Total de profiles, para conferir em DOIS SENTIDOS contra auth.users. */
async function contarProfiles(): Promise<number> {
  const res = await get("rest/v1/profiles?select=user_id", {
    Range: "0-0",
    "Range-Unit": "items",
    Prefer: "count=exact",
  });
  if (!res.ok && res.status !== 206) {
    abortar(`falha ao contar profiles (HTTP ${res.status}).`);
  }
  return totalDoContentRange(res, "profiles");
}

async function main() {
  console.log(
    `[countMissingConsent] versoes vigentes: terms=${TERMS_VERSION} privacy=${PRIVACY_VERSION}`,
  );

  const [{ porUsuario }, usuariosAuth, profiles] = await Promise.all([
    lerConsentimentosAtuais(),
    contarUsuariosAuth(),
    contarProfiles(),
  ]);

  // "Consentiu" = tem linha para terms E para privacy nas versoes atuais. Mesma
  // conjuncao do gate: um dos dois nao basta.
  let comAmbos = 0;
  let comApenasUm = 0;
  for (const documentos of porUsuario.values()) {
    if (documentos.has("terms") && documentos.has("privacy")) comAmbos += 1;
    else comApenasUm += 1;
  }

  const semConsentimento = usuariosAuth - comAmbos;

  console.log("");
  console.log("── Contagem (somente leitura, nada foi escrito) ──");
  console.log(`usuarios em auth.users .................... ${usuariosAuth}`);
  console.log(`profiles (conferencia cruzada) ........... ${profiles}`);
  console.log(`com consentimento atual COMPLETO ......... ${comAmbos}`);
  console.log(`com apenas um dos dois documentos ........ ${comApenasUm}`);
  console.log(`SEM consentimento na versao atual ........ ${semConsentimento}`);
  console.log("");

  if (usuariosAuth !== profiles) {
    console.warn(
      `[countMissingConsent] AVISO: auth.users (${usuariosAuth}) != profiles (${profiles}). Diferenca de ${Math.abs(usuariosAuth - profiles)}. Nao invalida a contagem de consentimento (que e por user_id de auth.users), mas indica profile faltando ou orfao.`,
    );
  }
  if (semConsentimento < 0) {
    abortar(
      `contagem inconsistente: mais usuarios com consentimento (${comAmbos}) do que usuarios (${usuariosAuth}). Ha linha de consentimento para user_id que nao existe mais em auth.users.`,
    );
  }
}

await main();
