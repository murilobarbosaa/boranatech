import { fetchSuppressedEmailSet } from "../emailCampaignQueue";
import { validateEmailForSending } from "../emailValidation";
import { supabaseAdmin } from "../supabaseAdmin";
import type { ImportSource, ParsedRow } from "./parse";

// Classificacao de cada email encontrado, com motivo NOMEADO. Toda linha do
// arquivo aparece no relatorio (nunca descarta em silencio).

export type MemberStatus = "valid" | "invalid" | "duplicate" | "suppressed";

export type MemberReport = {
  email: string;
  name: string | null;
  status: MemberStatus;
  invalidReason: string | null; // "syntax" | "reserved" | "disposable" | null
  userId: string | null; // preenchido quando o email JA e usuario
  rawLine: string;
};

export type ImportReport = {
  source: ImportSource;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  suppressedCount: number;
  existingUserCount: number;
  members: MemberReport[];
};

// Sintaxe e dominio reservado: validados pela fonte unica compartilhada
// (validateEmailForSending). Aqui fica so a politica PROPRIA do import:
// dominios descartaveis (lista pequena, hardcoded).
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwaway.email",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mailnesia.com",
  "mohmal.com",
]);

function domainOf(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

// PURA e testavel: recebe os conjuntos de supressao e usuarios existentes ja
// resolvidos. Precedencia: syntax invalido > duplicado no arquivo > reservado >
// descartavel > suprimido > usuario existente (valid + user_id) > valid.
export function classifyContacts(
  source: ImportSource,
  parsed: ParsedRow[],
  sets: { suppressedLower: Set<string>; existingUsersLower: Map<string, string> },
): ImportReport {
  const members: MemberReport[] = [];
  const seen = new Set<string>();
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;
  let suppressedCount = 0;
  let existingUserCount = 0;

  for (const row of parsed) {
    const emailLower = row.email.toLowerCase();
    let status: MemberStatus;
    let invalidReason: string | null = null;
    let userId: string | null = null;

    const check = validateEmailForSending(row.email);
    if (!check.ok && check.reason === "syntax") {
      status = "invalid";
      invalidReason = "syntax";
      invalidCount += 1;
    } else if (seen.has(emailLower)) {
      status = "duplicate";
      duplicateCount += 1;
    } else {
      seen.add(emailLower);
      if (!check.ok && check.reason === "reserved") {
        status = "invalid";
        invalidReason = "reserved";
        invalidCount += 1;
      } else if (DISPOSABLE_DOMAINS.has(domainOf(row.email))) {
        status = "invalid";
        invalidReason = "disposable";
        invalidCount += 1;
      } else if (sets.suppressedLower.has(emailLower)) {
        status = "suppressed";
        suppressedCount += 1;
      } else {
        userId = sets.existingUsersLower.get(emailLower) ?? null;
        status = "valid";
        validCount += 1;
        if (userId) existingUserCount += 1;
      }
    }

    members.push({
      email: row.email,
      name: row.name,
      status,
      invalidReason,
      userId,
      rawLine: row.rawLine,
    });
  }

  return {
    source,
    totalRows: parsed.length,
    validCount,
    invalidCount,
    duplicateCount,
    suppressedCount,
    existingUserCount,
    members,
  };
}

type ProfileRow = { user_id: string | null; email: string | null };

// Mapeia email (lower) -> user_id para os emails que interessam. Pagina profiles
// (a coluna email pode ter caixa mista) e para quando encontra todos.
async function fetchExistingUsers(
  wantedLower: Set<string>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (wantedLower.size === 0) return map;

  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .range(from, from + PAGE - 1);
    if (error) {
      throw new Error(`lookup de usuarios existentes falhou: ${error.message}`);
    }
    const rows = (data ?? []) as ProfileRow[];
    for (const row of rows) {
      if (!row.email || !row.user_id) continue;
      const lower = row.email.toLowerCase();
      if (wantedLower.has(lower)) map.set(lower, row.user_id);
    }
    if (rows.length < PAGE || map.size >= wantedLower.size) break;
  }
  return map;
}

// Validacao completa: resolve supressao (autoridade compartilhada) e usuarios
// existentes, e classifica. Erro de banco propaga.
export async function validateContacts(
  source: ImportSource,
  parsed: ParsedRow[],
): Promise<ImportReport> {
  const suppressedLower = await fetchSuppressedEmailSet();
  const wantedLower = new Set(
    parsed
      .filter((r) => validateEmailForSending(r.email).ok)
      .map((r) => r.email.toLowerCase()),
  );
  const existingUsersLower = await fetchExistingUsers(wantedLower);
  return classifyContacts(source, parsed, {
    suppressedLower,
    existingUsersLower,
  });
}
