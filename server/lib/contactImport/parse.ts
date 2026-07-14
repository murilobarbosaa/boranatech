import * as XLSX from "xlsx";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// Parsers de lista de contatos. Rodam SEMPRE no server. Cada parser extrai
// linhas cruas { email, name } sem validar (a validacao/classificacao vive em
// validate.ts). Nunca descarta em silencio: cada linha do arquivo vira uma
// entrada no resultado (blank puro e a unica excecao).

export type ImportSource = "paste" | "csv" | "xlsx" | "pdf";

export type ParsedRow = {
  email: string;
  name: string | null;
  rawLine: string;
};

export const MAX_ROWS = 10000;
const PARSE_TIMEOUT_MS = 15_000;

// Erro nomeado do import. O endpoint traduz para { error: { code, message } }.
export class ContactImportError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ContactImportError";
  }
}

const NAME_EMAIL_RE = /^(.*?)\s*<([^>]+)>$/;

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Texto colado: um email por linha ou separado por virgula/ponto-e-virgula.
// Aceita tambem "Nome <email@dominio.com>".
export function parseText(text: string): ParsedRow[] {
  const out: ParsedRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const full = NAME_EMAIL_RE.exec(trimmed);
    if (full) {
      out.push({
        email: full[2].trim(),
        name: full[1].trim() || null,
        rawLine: trimmed,
      });
      continue;
    }

    for (const part of trimmed
      .split(/[,;]/)
      .map((p) => p.trim())
      .filter(Boolean)) {
      const m = NAME_EMAIL_RE.exec(part);
      if (m) {
        out.push({ email: m[2].trim(), name: m[1].trim() || null, rawLine: part });
      } else {
        out.push({ email: part, name: null, rawLine: part });
      }
    }
  }
  return out;
}

// Parser CSV minimo, com aspas e escape de aspas duplas. Delimitador detectado
// (virgula ou ponto-e-virgula, comum em export pt-BR do Excel).
function detectDelimiter(text: string): "," | ";" {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  return semis > commas ? ";" : ",";
}

export function parseCsvRows(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
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
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function findColumn(header: string[], re: RegExp): number {
  return header.findIndex((h) => re.test(h.trim()));
}

// Converte linhas de celulas (CSV/XLSX) em contatos, detectando a coluna de
// email por header; sem header, tenta a primeira coluna que pareca email; se
// ainda assim nao der, ERRO (nunca adivinha em silencio).
export function rowsToContacts(rows: string[][]): ParsedRow[] {
  if (rows.length === 0) return [];
  const header = rows[0];

  let emailCol = findColumn(header, /e-?mail|mail|endere[cç]o/i);
  let nameCol = findColumn(header, /nome|name|contato/i);
  let dataStart = 1;

  if (emailCol < 0) {
    // Sem header reconhecivel: a primeira linha ja pode ser dado.
    emailCol = header.findIndex((cell) => looksLikeEmail(cell));
    if (emailCol < 0) {
      throw new ContactImportError(
        "email_column_not_found",
        "Não encontrei a coluna de e-mail. Indique qual coluna contém os e-mails.",
      );
    }
    nameCol = -1;
    dataStart = 0;
  }

  const out: ParsedRow[] = [];
  for (let i = dataStart; i < rows.length; i += 1) {
    const cells = rows[i];
    const email = (cells[emailCol] ?? "").trim();
    const name =
      nameCol >= 0 ? (cells[nameCol] ?? "").trim() || null : null;
    out.push({ email, name, rawLine: cells.join(", ") });
  }
  return out;
}

export function parseCsvBuffer(buffer: Buffer): ParsedRow[] {
  return rowsToContacts(parseCsvRows(buffer.toString("utf8")));
}

// XLSX via SheetJS, primeira planilha. Le so VALORES (nao avalia formulas) e
// converte em matriz de celulas string, reusando a mesma heuristica do CSV.
export function parseXlsxBuffer(buffer: Buffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellFormula: false,
    cellHTML: false,
    cellText: false,
  });
  const first = workbook.SheetNames[0];
  if (!first) {
    throw new ContactImportError("empty_workbook", "Planilha sem abas.");
  }
  const sheet = workbook.Sheets[first];
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  });
  const rows = matrix.map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? "")) : []));
  return rowsToContacts(rows.filter((r) => r.some((cell) => cell.trim() !== "")));
}

const EMAIL_EXTRACT_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// PDF: extracao BEST-EFFORT. So extrai texto (isEvalSupported=false) e captura
// emails por regex. A UI avisa que o preview PRECISA ser conferido linha a linha.
export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedRow[]> {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;

  let text = "";
  for (let p = 1; p <= pdf.numPages; p += 1) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if ("str" in item) text += `${item.str} `;
    }
    text += "\n";
  }

  const out: ParsedRow[] = [];
  const matches = text.match(EMAIL_EXTRACT_RE) ?? [];
  for (const email of matches) {
    out.push({ email: email.trim(), name: null, rawLine: email.trim() });
  }
  return out;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new ContactImportError(
              "parse_timeout",
              "O arquivo demorou demais para ser lido. Tente um arquivo menor ou em outro formato.",
            ),
          ),
        ms,
      ),
    ),
  ]);
}

export type ParseInput =
  | { source: "paste"; text: string }
  | { source: "csv"; buffer: Buffer }
  | { source: "xlsx"; buffer: Buffer }
  | { source: "pdf"; buffer: Buffer };

// Dispatcher. Erros de parse propagam como ContactImportError (nunca lista
// parcial fingindo sucesso).
export async function parseContacts(input: ParseInput): Promise<ParsedRow[]> {
  if (input.source === "paste") return parseText(input.text);
  if (input.source === "csv") return parseCsvBuffer(input.buffer);
  if (input.source === "xlsx")
    return withTimeout(Promise.resolve().then(() => parseXlsxBuffer(input.buffer)), PARSE_TIMEOUT_MS);
  return withTimeout(parsePdfBuffer(input.buffer), PARSE_TIMEOUT_MS);
}
