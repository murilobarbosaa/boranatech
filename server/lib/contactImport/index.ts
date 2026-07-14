import { ContactImportError, MAX_ROWS, parseContacts } from "./parse";
import type { ParseInput } from "./parse";
import { validateContacts } from "./validate";
import type { ImportReport } from "./validate";

export { ContactImportError, MAX_ROWS } from "./parse";
export type { ImportSource, ParsedRow, ParseInput } from "./parse";
export type { ImportReport, MemberReport, MemberStatus } from "./validate";

// Parseia + valida + monta o relatorio. NAO grava nada, NAO envia nada. E so o
// retrato para o preview. Erro de parse propaga como ContactImportError.
export async function importPreview(input: ParseInput): Promise<ImportReport> {
  const parsed = await parseContacts(input);
  if (parsed.length > MAX_ROWS) {
    throw new ContactImportError(
      "too_many_rows",
      // TODO(Ana)
      `Máximo de ${MAX_ROWS} linhas por import. O arquivo tem ${parsed.length}.`,
    );
  }
  return validateContacts(input.source, parsed);
}
