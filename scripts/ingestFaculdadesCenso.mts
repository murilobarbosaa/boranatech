// Ingestao do Censo da Educacao Superior 2024 (INEP/MEC) para as tabelas
// faculdades_ies e faculdades_cursos. SOMENTE cursos de tecnologia
// (CO_CINE_AREA_GERAL='06'), uma linha por curso (TP_DIMENSAO IN 1,3).
//
// Camada de COBERTURA: NAO toca a curadoria editorial estatica
// (client/src/lib/faculdadesInstituicoes.ts). duracao, url e reputacao NAO
// existem no Censo e ficam de fora (proibido inventar).
//
// Estilo espelha scripts/cleanNonTechVagas.mts: dry-run por default, --apply
// para escrever, supabaseAdmin, contagens antes/depois, NUNCA deleta (upsert
// por PK). Ordem de escrita: IES primeiro, cursos depois (FK).
//
// Uso:
//   pnpm tsx --tsconfig tsconfig.node.json scripts/ingestFaculdadesCenso.mts            (dry run)
//   pnpm tsx --tsconfig tsconfig.node.json scripts/ingestFaculdadesCenso.mts --apply
//   pnpm tsx --tsconfig tsconfig.node.json scripts/ingestFaculdadesCenso.mts --dir=/tmp/inep

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { supabaseAdmin } from "../server/lib/supabaseAdmin";
import {
  subareaDoCurso,
  type Subarea,
} from "../client/src/lib/faculdadesSubareas";

const APPLY = process.argv.includes("--apply");
const DIR_ARG = process.argv.find((a) => a.startsWith("--dir="));
const DATA_DIR = DIR_ARG
  ? DIR_ARG.slice("--dir=".length)
  : join(process.cwd(), "data", "censo-superior-2024");

const ANO_CENSO = 2024;
const CINE_AREA_GERAL_TECH = "06";
const DIMENSOES_CURSO = new Set(["1", "3"]);

// Decodificacao dos TP_* conforme o dicionario do Censo 2024.
const GRAU: Record<string, string> = {
  "1": "Bacharelado",
  "2": "Licenciatura",
  "3": "Tecnologico",
  "4": "Bacharelado e Licenciatura",
};
const MODALIDADE: Record<string, string> = {
  "1": "Presencial",
  "2": "EAD",
};
const REDE: Record<string, string> = {
  "1": "Publica",
  "2": "Privada",
};
const ORGANIZACAO: Record<string, string> = {
  "1": "Universidade",
  "2": "Centro Universitario",
  "3": "Faculdade",
  "4": "IF",
  "5": "CEFET",
};
const CATEGORIA_ADMIN: Record<string, string> = {
  "1": "Publica Federal",
  "2": "Publica Estadual",
  "3": "Publica Municipal",
  "4": "Privada com fins lucrativos",
  "5": "Privada sem fins lucrativos",
  "6": "Privada particular em sentido estrito",
  "7": "Especial",
  "8": "Privada comunitaria",
  "9": "Privada confessional",
};

// Fallback deterministico por codigo CINE detalhado, usado quando o nome do
// curso nao aciona nenhuma regra de faculdadesSubareas.ts. A derivacao final
// da prioridade ao sinal por nome (Seguranca, Jogos, Ciencia de Dados etc.),
// reusando a taxonomia existente.
const CINE_DETALHADA_SUBAREA: Record<string, Subarea> = {
  "0613": "Desenvolvimento",
  "0612": "Infra e Redes",
  "0681": "Dados e IA",
  "0619": "Desenvolvimento",
  "0688": "Outros",
};

const PREPOSICOES = new Set(["de", "da", "do", "das", "dos", "e", "em"]);

interface IesRecord {
  co_ies: number;
  no_ies: string;
  sg_ies: string | null;
  no_mantenedora: string | null;
  sg_uf: string;
  no_municipio: string | null;
  co_municipio: number | null;
  tp_organizacao_academica: number | null;
  no_organizacao_academica: string | null;
  tp_categoria_administrativa: number | null;
  no_categoria_administrativa: string | null;
  tp_rede: number | null;
  no_rede: string | null;
  ano_censo: number;
}

interface CursoRecord {
  co_curso: number;
  co_ies: number;
  no_curso: string;
  no_curso_raw: string;
  co_cine_rotulo: string | null;
  no_cine_rotulo: string | null;
  co_cine_area_detalhada: string | null;
  subarea: Subarea;
  tp_grau_academico: number | null;
  no_grau_academico: string | null;
  tp_modalidade_ensino: number | null;
  no_modalidade_ensino: string | null;
  sg_uf: string | null;
  no_municipio: string | null;
  qt_vg_total: number | null;
  ano_censo: number;
}

// Parser CSV minimo: delimitador ";", aspas duplas com escape "".
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ";") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function readCsv(path: string): { header: string[]; rows: string[][] } {
  const buffer = readFileSync(path);
  const text = new TextDecoder("latin1").decode(buffer);
  const all = parseCsv(text);
  if (all.length === 0) {
    throw new Error(`CSV vazio: ${path}`);
  }
  const header = all[0].map((h, i) =>
    i === 0 ? h.replace(/^﻿/, "").trim() : h.trim(),
  );
  return { header, rows: all.slice(1) };
}

function indexer(header: string[]): (row: string[], col: string) => string {
  const map = new Map<string, number>();
  header.forEach((name, i) => map.set(name, i));
  return (row, col) => {
    const idx = map.get(col);
    if (idx === undefined) {
      throw new Error(`Coluna ausente no CSV: ${col}`);
    }
    return (row[idx] ?? "").trim();
  };
}

function toInt(value: string): number | null {
  const t = value.trim();
  if (t === "" || !/^-?\d+$/.test(t)) return null;
  return Number.parseInt(t, 10);
}

function nullable(value: string): string | null {
  const t = value.trim();
  return t === "" ? null : t;
}

function stripQuotes(value: string): string {
  return value.replace(/^"+|"+$/g, "").trim();
}

function titleCasePt(raw: string): string {
  const words = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return words
    .map((w, i) => {
      if (i > 0 && PREPOSICOES.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

// Prioridade ao sinal por nome (taxonomia existente); senao fallback por
// codigo CINE detalhado; senao "Outros".
function deriveSubarea(noCursoRaw: string, coCineDetalhada: string): Subarea {
  const byName = subareaDoCurso(noCursoRaw, []);
  if (byName !== "Outros") return byName;
  return CINE_DETALHADA_SUBAREA[coCineDetalhada] ?? "Outros";
}

async function existingIds(table: string, pk: string): Promise<Set<number>> {
  const ids = new Set<number>();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(pk)
      .order(pk)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as Array<Record<string, number>>;
    for (const r of page) ids.add(r[pk]);
    if (page.length < PAGE) break;
  }
  return ids;
}

async function tryExistingIds(
  table: string,
  pk: string,
): Promise<Set<number> | null> {
  try {
    return await existingIds(table, pk);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(
      `  [aviso] nao foi possivel ler ${table} (${message}). ` +
        `Assumindo tabela vazia para o split insert/update.`,
    );
    return null;
  }
}

async function upsertAll<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  pk: string,
): Promise<void> {
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabaseAdmin
      .from(table)
      .upsert(batch, { onConflict: pk });
    if (error) throw new Error(`upsert ${table} lote ${i}: ${error.message}`);
  }
}

function loadIes(): IesRecord[] {
  const { header, rows } = readCsv(join(DATA_DIR, "tech_ies.csv"));
  const get = indexer(header);
  const records: IesRecord[] = [];
  let skipped = 0;
  for (const row of rows) {
    if (row.length === 1 && row[0].trim() === "") continue;
    const coIes = toInt(get(row, "CO_IES"));
    if (coIes === null) {
      skipped++;
      continue;
    }
    const tpOrg = get(row, "TP_ORGANIZACAO_ACADEMICA");
    const tpCat = get(row, "TP_CATEGORIA_ADMINISTRATIVA");
    const tpRede = get(row, "TP_REDE");
    records.push({
      co_ies: coIes,
      no_ies: get(row, "NO_IES"),
      sg_ies: nullable(get(row, "SG_IES")),
      no_mantenedora: nullable(get(row, "NO_MANTENEDORA")),
      sg_uf: get(row, "SG_UF_IES"),
      no_municipio: nullable(get(row, "NO_MUNICIPIO_IES")),
      co_municipio: toInt(get(row, "CO_MUNICIPIO_IES")),
      tp_organizacao_academica: toInt(tpOrg),
      no_organizacao_academica: ORGANIZACAO[tpOrg] ?? null,
      tp_categoria_administrativa: toInt(tpCat),
      no_categoria_administrativa: CATEGORIA_ADMIN[tpCat] ?? null,
      tp_rede: toInt(tpRede),
      no_rede: REDE[tpRede] ?? null,
      ano_censo: ANO_CENSO,
    });
  }
  if (skipped > 0) {
    console.log(`  [ies] ${skipped} linha(s) sem CO_IES descartada(s).`);
  }
  return records;
}

interface CursoLoad {
  records: CursoRecord[];
  read: number;
  filteredOut: number;
  skipped: number;
}

function loadCursos(): CursoLoad {
  const { header, rows } = readCsv(join(DATA_DIR, "tech_cursos.csv"));
  const get = indexer(header);
  const records: CursoRecord[] = [];
  let read = 0;
  let filteredOut = 0;
  let skipped = 0;
  for (const row of rows) {
    if (row.length === 1 && row[0].trim() === "") continue;
    read++;
    const areaGeral = stripQuotes(get(row, "CO_CINE_AREA_GERAL"));
    const dimensao = stripQuotes(get(row, "TP_DIMENSAO"));
    if (areaGeral !== CINE_AREA_GERAL_TECH || !DIMENSOES_CURSO.has(dimensao)) {
      filteredOut++;
      continue;
    }
    const coCurso = toInt(get(row, "CO_CURSO"));
    const coIes = toInt(get(row, "CO_IES"));
    if (coCurso === null || coIes === null) {
      skipped++;
      continue;
    }
    const rawName = get(row, "NO_CURSO");
    const cineDetalhada = stripQuotes(get(row, "CO_CINE_AREA_DETALHADA"));
    const tpGrau = get(row, "TP_GRAU_ACADEMICO");
    const tpMod = get(row, "TP_MODALIDADE_ENSINO");
    records.push({
      co_curso: coCurso,
      co_ies: coIes,
      no_curso: titleCasePt(rawName),
      no_curso_raw: rawName,
      co_cine_rotulo: nullable(stripQuotes(get(row, "CO_CINE_ROTULO"))),
      no_cine_rotulo: nullable(get(row, "NO_CINE_ROTULO")),
      co_cine_area_detalhada: nullable(cineDetalhada),
      subarea: deriveSubarea(rawName, cineDetalhada),
      tp_grau_academico: toInt(tpGrau),
      no_grau_academico: GRAU[tpGrau] ?? null,
      tp_modalidade_ensino: toInt(tpMod),
      no_modalidade_ensino: MODALIDADE[tpMod] ?? null,
      sg_uf: nullable(get(row, "SG_UF")),
      no_municipio: nullable(get(row, "NO_MUNICIPIO")),
      qt_vg_total: toInt(get(row, "QT_VG_TOTAL")),
      ano_censo: ANO_CENSO,
    });
  }
  return { records, read, filteredOut, skipped };
}

async function main(): Promise<void> {
  console.log(`[ingest-censo] modo: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`[ingest-censo] diretorio: ${DATA_DIR}\n`);

  const ies = loadIes();
  const cursos = loadCursos();

  console.log("=== IES ===");
  console.log(`  validas: ${ies.length}`);
  console.log("=== CURSOS ===");
  console.log(`  lidos: ${cursos.read}`);
  console.log(`  fora do filtro (area!=06 ou dim!=1,3): ${cursos.filteredOut}`);
  console.log(`  sem CO_CURSO/CO_IES: ${cursos.skipped}`);
  console.log(`  validos: ${cursos.records.length}`);

  // Integridade referencial: todo co_ies de curso existe no cadastro de IES.
  const iesIds = new Set(ies.map((r) => r.co_ies));
  const orfaos = new Map<number, number>();
  for (const c of cursos.records) {
    if (!iesIds.has(c.co_ies)) {
      orfaos.set(c.co_ies, (orfaos.get(c.co_ies) ?? 0) + 1);
    }
  }
  if (orfaos.size > 0) {
    console.error(
      `\n[ERRO] ${orfaos.size} CO_IES referenciados por cursos nao existem ` +
        `no cadastro de IES. Abortando sem escrever (nenhuma insercao parcial).`,
    );
    for (const [id, count] of orfaos) {
      console.error(`  co_ies=${id}: ${count} curso(s)`);
    }
    process.exit(1);
  }
  console.log("\n[ok] integridade referencial: nenhum curso orfao.");

  // Split insert/update (tabelas podem ainda nao existir em dry-run).
  const iesExisting = await tryExistingIds("faculdades_ies", "co_ies");
  const cursosExisting = await tryExistingIds("faculdades_cursos", "co_curso");
  const iesInsert = iesExisting
    ? ies.filter((r) => !iesExisting.has(r.co_ies)).length
    : ies.length;
  const iesUpdate = ies.length - iesInsert;
  const cursoInsert = cursosExisting
    ? cursos.records.filter((r) => !cursosExisting.has(r.co_curso)).length
    : cursos.records.length;
  const cursoUpdate = cursos.records.length - cursoInsert;

  console.log("\n=== PLANO DE ESCRITA ===");
  console.log(`  IES:    inserir ${iesInsert}, atualizar ${iesUpdate}`);
  console.log(`  CURSOS: inserir ${cursoInsert}, atualizar ${cursoUpdate}`);

  console.log("\n=== AMOSTRA (10 cursos transformados) ===");
  for (const c of cursos.records.slice(0, 10)) {
    console.log(JSON.stringify(c));
  }

  // Distribuicao de subarea, util para validar a derivacao.
  const subCounts = new Map<Subarea, number>();
  for (const c of cursos.records) {
    subCounts.set(c.subarea, (subCounts.get(c.subarea) ?? 0) + 1);
  }
  console.log("\n=== SUBAREA (derivada) ===");
  for (const [sub, count] of [...subCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${sub}: ${count}`);
  }

  if (!APPLY) {
    console.log("\n[ingest-censo] dry run: nada foi escrito. Use --apply.");
    return;
  }

  console.log("\n[ingest-censo] aplicando... IES primeiro, cursos depois.");
  await upsertAll("faculdades_ies", ies, "co_ies");
  await upsertAll("faculdades_cursos", cursos.records, "co_curso");

  const iesAfter = await existingIds("faculdades_ies", "co_ies");
  const cursosAfter = await existingIds("faculdades_cursos", "co_curso");
  console.log(
    `[ingest-censo] concluido. faculdades_ies=${iesAfter.size}, ` +
      `faculdades_cursos=${cursosAfter.size}.`,
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[ingest-censo] falha: ${message}`);
  process.exit(1);
});
