// LOTE MENSAL de emissao (regras R2 e R3 do contador).
//
// A nota nasce no pagamento em 'awaiting_batch' e so e enfileirada AQUI, no
// ultimo dia civil do mes em Brasilia. O lote:
//
//   - pega toda linha 'awaiting_batch' com competencia ate o ultimo dia do mes
//     do lote. Venda registrada depois que o lote rodou fica para o lote
//     seguinte, com a competencia da propria venda (a coluna nao muda);
//   - estorno integral antes do lote vira 'skipped', com motivo proprio, e nao
//     emite (R5). O valor liquido de estorno parcial e calculado pelo worker no
//     instante da emissao, que e logo depois;
//   - devolve o resto para 'pending' e enfileira.
//
// IDEMPOTENTE POR CONSTRUCAO, e nao por marcador: a transicao sai de
// 'awaiting_batch' de forma CONDICIONAL, entao rodar o lote duas vezes encontra
// na segunda um conjunto vazio. O jobId deterministico da fila dedupa o resto.
// Se o processo cair entre a transicao e o `add`, a linha fica 'pending' sem
// job, e a varredura C da reconciliacao (pending parada ha 6 horas) a recolhe.

import { enqueueFiscalInvoice } from "./fiscalQueue";
import {
  MOTIVO_ESTORNO_INTEGRAL,
  ultimoDiaDoMes,
  valorLiquidoCents,
} from "./fiscalRegras";
import { supabaseAdmin } from "./supabaseAdmin";

const PAGE = 500;

/**
 * Teto de paginas por execucao. Cada pagina tira as proprias linhas do filtro
 * (a transicao muda o status), entao o laco relê sempre do inicio; o teto
 * existe para que uma transicao que casasse zero linhas em loop nao virasse um
 * processo infinito. 200 paginas de 500 sao 100 mil notas num mes.
 */
const MAX_PAGINAS = 200;

export type ResultadoDoLote = {
  mes: string;
  /** Devolvidas para a fila. */
  enfileiradas: number;
  /** Estorno integral antes do lote: nenhuma nota. */
  dispensadas_estorno_integral: number;
};

type LinhaDoLote = {
  id: string;
  charge_key: string;
  amount_cents: number;
  refunded_cents: number;
};

/** Transicao condicional a partir de 'awaiting_batch'. true = esta execucao mudou. */
async function transicionar(
  id: string,
  patch: Record<string, unknown>,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("fiscal_invoices")
    .update(patch)
    .eq("id", id)
    .eq("status", "awaiting_batch")
    .select("id");
  if (error) {
    throw new Error(`Falha ao mover a nota ${id} no lote: ${error.message}`);
  }
  return Array.isArray(data) && data.length > 0;
}

/**
 * Roda o lote do mes `AAAA-MM`. Quem decide SE e quando roda e o chamador (a
 * rota do cron, com `decidirLoteAutomatico` ou `validarLoteManual`); esta
 * funcao so executa.
 */
export async function executarLoteMensal(
  mes: string,
): Promise<ResultadoDoLote> {
  const ateDia = ultimoDiaDoMes(mes);
  const resultado: ResultadoDoLote = {
    mes,
    enfileiradas: 0,
    dispensadas_estorno_integral: 0,
  };

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
    const { data, error } = await supabaseAdmin
      .from("fiscal_invoices")
      .select("id, charge_key, amount_cents, refunded_cents")
      .eq("status", "awaiting_batch")
      .lte("competencia", ateDia)
      .order("competencia", { ascending: true })
      .limit(PAGE);
    if (error) {
      throw new Error(`Falha ao ler as notas do lote: ${error.message}`);
    }
    const linhas = (data ?? []) as LinhaDoLote[];
    if (linhas.length === 0) return resultado;

    let mexidas = 0;
    for (const linha of linhas) {
      const liquido = valorLiquidoCents(
        linha.amount_cents,
        linha.refunded_cents,
      );
      if (liquido <= 0) {
        const mudou = await transicionar(linha.id, {
          status: "skipped",
          error_code: MOTIVO_ESTORNO_INTEGRAL,
          error_message:
            "Cobranca estornada integralmente antes do lote; nenhuma nota emitida.",
        });
        if (mudou) {
          resultado.dispensadas_estorno_integral += 1;
          mexidas += 1;
        }
        continue;
      }
      const mudou = await transicionar(linha.id, { status: "pending" });
      if (!mudou) continue; // corrida: outra execucao ja levou esta linha.
      mexidas += 1;
      await enqueueFiscalInvoice(linha.charge_key);
      resultado.enfileiradas += 1;
    }

    // Nenhuma transicao nesta pagina: as linhas lidas sairam do estado por
    // outro caminho entre a leitura e a escrita. Reler daria as mesmas.
    if (mexidas === 0) return resultado;
  }

  throw new Error(
    `Lote ${mes} excedeu ${MAX_PAGINAS} paginas; interrompido para investigacao.`,
  );
}
