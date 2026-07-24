// Deteccao de "coluna inexistente" nos dois formatos possiveis: PGRST204 (o
// PostgREST valida o payload de escrita contra o schema cache e recusa antes de
// tocar no banco) e 42703 (o Postgres rejeita o SQL de um SELECT com coluna que
// nao existe). O includes(column) evita mascarar erro de outra coluna. Base da
// degradacao graciosa enquanto a migration nao rodou (deploy do codigo vem
// ANTES do db:push): o codigo novo tolera o schema antigo.
const PGRST_COLUMN_NOT_FOUND = "PGRST204";
const PG_UNDEFINED_COLUMN = "42703";

export function isMissingColumnError(
  error: { code?: string; message?: string },
  column: string,
): boolean {
  if (
    error.code !== PGRST_COLUMN_NOT_FOUND &&
    error.code !== PG_UNDEFINED_COLUMN
  ) {
    return false;
  }
  return (
    typeof error.message === "string" &&
    error.message.toLowerCase().includes(column.toLowerCase())
  );
}
