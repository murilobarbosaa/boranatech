// Adapter de NFS-e FALSO. Emite nada em lugar nenhum: existe para exercitar o
// pipeline (fila, retry, transicao de status, snapshot do tomador) sem depender
// de prefeitura e sem credencial de provedor.
//
// O boot ABORTA se este adapter for selecionado com NODE_ENV=production (ver
// server/lib/env.ts): uma linha 'issued' com numero inventado e pior que
// nenhuma linha, porque a reconciliacao da Fase 4 leria o conjunto como
// saudavel.

import { env } from "../lib/env";
import type {
  FetchStatusResult,
  FiscalProvider,
  IssueInvoiceInput,
  IssueInvoiceResult,
} from "./fiscalTypes";

/**
 * Sufixo DETERMINISTICO derivado do referenceId, nunca aleatorio.
 *
 * Aleatorio quebraria a propriedade que o mock existe para testar: reprocessar
 * o mesmo job tem que produzir o mesmo resultado. Com hash do id, duas
 * tentativas da mesma nota devolvem o mesmo numero, e uma divergencia no banco
 * vira sinal de bug em vez de ruido esperado.
 */
function deterministicSuffix(referenceId: string): string {
  let hash = 0;
  for (let i = 0; i < referenceId.length; i += 1) {
    hash = (hash * 31 + referenceId.charCodeAt(i)) >>> 0;
  }
  return String(hash % 1_000_000).padStart(6, "0");
}

async function issue(input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
  // Gatilho de teste manual (NFSE_MOCK_FAIL=true): falha RETENTAVEL, para
  // exercitar o backoff da fila. Retentavel de proposito: e o caso que o
  // desenho do retry precisa provar, e o nao-retentavel ja e alcancavel por
  // dado de tomador ausente, que nem chega ao provider.
  if (env.nfseMockFail) {
    return {
      status: "failed",
      errorCode: "mock_forced_failure",
      errorMessage:
        "Falha simulada pelo adapter mock (NFSE_MOCK_FAIL=true). Nenhuma nota foi emitida.",
      retryable: true,
    };
  }

  const suffix = deterministicSuffix(input.referenceId);
  return {
    status: "issued",
    providerInvoiceId: `mock_${input.referenceId}`,
    numero: suffix,
    serie: "MOCK",
    codigoVerificacao: `MOCK-${suffix}`,
    // Sem pdfUrl/xmlUrl: nao existe documento nenhum para baixar, e devolver uma
    // URL falsa faria a Fase 3 gravar um caminho de storage que nunca resolve.
  };
}

async function cancel(
  providerInvoiceId: string,
  reason: string,
): Promise<void> {
  console.log(
    `[fiscal/mock] cancelamento simulado da nota ${providerInvoiceId} (motivo: ${reason}).`,
  );
}

async function fetchStatus(
  providerInvoiceId: string,
): Promise<FetchStatusResult> {
  // O mock emite de forma sincrona, entao qualquer nota que exista aqui ja
  // esta emitida. Nao ha estado intermediario para consultar.
  //
  // Devolve os MESMOS campos de identificacao que o issue devolveria, e nao so
  // o status: desde a Fase 3 e a consulta que carrega numero, codigo e
  // documentos, e um mock que devolvesse menos que o adapter real esconderia
  // justamente o caminho que a emissao assincrona sempre percorre.
  console.log(`[fiscal/mock] consulta de status da nota ${providerInvoiceId}.`);
  const suffix = deterministicSuffix(providerInvoiceId);
  return {
    status: "issued",
    numero: suffix,
    serie: "MOCK",
    codigoVerificacao: `MOCK-${suffix}`,
    // Sem pdfUrl/xmlUrl: nao existe documento para baixar, e uma URL falsa
    // faria o passo de storage gravar um caminho que nunca resolve.
  };
}

async function downloadDocument(url: string): Promise<Buffer> {
  // Inalcancavel por construcao: o mock nunca devolve pdfUrl nem xmlUrl, entao
  // o passo de storage nunca tem o que baixar. Lanca em vez de devolver um
  // Buffer vazio, que viraria um "PDF" de 0 byte no bucket.
  throw new Error(
    `[fiscal/mock] downloadDocument nao deveria ser chamado (url: ${url}).`,
  );
}

export const fiscalMockProvider: FiscalProvider = {
  name: "mock",
  issue,
  cancel,
  fetchStatus,
  downloadDocument,
};
