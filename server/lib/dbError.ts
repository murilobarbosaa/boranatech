import { createError } from "../middleware/error";
import { erroEncadeavel } from "./supabaseError";

/**
 * `db_error` COM a causa real encadeada, em um lugar so.
 *
 * O DEFEITO, medido em 02/09/2026: 85 sitios de `createError(500, "db_error")`
 * saiam sem `cause`. Quando um desses 500 chega ao Sentry, chega so com a
 * mensagem generica: sem codigo do Postgres, sem operacao, sem nada que diga o
 * que quebrou. Foi assim que "Erro ao atualizar perfil" (BUG-78) e "Erro ao
 * buscar notas fiscais" (BUG-63) viraram cards indiagnosticaveis.
 *
 * POR QUE O ENVELOPE. O postgrest-js, no modo `{ data, error }` que este projeto
 * usa, devolve um objeto PLANO, sem prototipo de `Error`; o
 * `linkedErrorsIntegration` do Sentry so percorre `cause` que passe em
 * `instanceof Error`. `erroEncadeavel` faz esse envelope, e sem ele o `cause`
 * viaja e e ignorado, que foi o defeito que `server/lib/supabaseError.ts`
 * documenta.
 *
 * POR QUE AQUI E NAO COPIADO EM CADA ROTA. Os helpers locais que este lote
 * criou eram byte a byte iguais em oito arquivos. Regra duplicada em oito
 * lugares diverge no primeiro que alguem esquecer de atualizar, e nenhum deles
 * seria testavel sem exportar oito funcoes privadas. Cada rota mantem o seu
 * `dbError(op, error, message)` local, com o prefixo dela, e delega para ca.
 *
 * `pgCode` entra SO quando existe e e string. Num `catch` o que chega e um
 * `Error`, que nao tem `code`, e um campo vazio no contexto seria ruido para
 * alguem interpretar depois como se fosse dado.
 *
 * `extra` existe porque este helper SUBSTITUI o `console.error` que havia em
 * cada sitio, e alguns daqueles logs carregavam um identificador que o log
 * generico daqui nao tem (o `row.id` do asaas, o `session.id` do stripe).
 * Trocar um log rico por um pobre seria perder diagnostico em nome de nao
 * duplicar. O `extra` vai para o `context`, que e onde o dado e mais util:
 * o log morre no Railway, o contexto viaja para o Sentry.
 *
 * `op` e `pgCode` sao aplicados DEPOIS do `extra`, entao um `extra` com essas
 * chaves nao consegue sobrescrever nenhuma das duas.
 */
export function montarDbError(
  prefix: string,
  op: string,
  error: unknown,
  message: string,
  extra?: Record<string, unknown>,
) {
  if (extra) console.error(`[${prefix}] ${op} falhou:`, error, extra);
  else console.error(`[${prefix}] ${op} falhou:`, error);
  const pgCode = (error as { code?: unknown } | null | undefined)?.code;
  return createError(500, "db_error", message, {
    cause: erroEncadeavel(error),
    context: {
      ...extra,
      op,
      ...(typeof pgCode === "string" ? { pgCode } : {}),
    },
  });
}
