import { createError } from "../middleware/error";
import {
  coletarTudoProvandoTotal,
  type PaginatedPageComContagem,
} from "./paginate";

export const PAYMENT_METHOD_SCAN_LIMIT = 20_000;

export async function verifiedMethodScan<T extends { id: string }>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<PaginatedPageComContagem<T>>,
  kind: "rows" | "evidence",
  pageSize?: number,
): Promise<T[]> {
  return coletarTudoProvandoTotal(
    async (from, to) => {
      const page = await fetchPage(from, to);
      if (page.count !== null && page.count > PAYMENT_METHOD_SCAN_LIMIT) {
        throw createError(
          503,
          kind === "rows"
            ? "finance_method_scan_limit"
            : "finance_method_evidence_limit",
          kind === "rows"
            ? "O filtro por meio excede o limite seguro de leitura local."
            : "A evidência de meios excede o limite seguro de leitura local.",
        );
      }
      return page;
    },
    {
      op:
        kind === "rows"
          ? "finance_payment_methods_rows"
          : "finance_payment_methods_evidence",
      rowKey: (row) => row.id,
      pageSize,
    },
  );
}
