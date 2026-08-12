// Adapter da NFS-e NACIONAL da Focus NFe (/v2/nfsen). SCAFFOLD.
//
// E o caminho de setembro, nao o de hoje. O que existe aqui e a estrutura
// (mesma interface, mesmo cliente HTTP, mesmo mapeamento de status) com o
// SERIALIZER do payload deliberadamente incompleto: o padrao nacional tem um
// layout proprio (DPS) que so da para fechar contra a homologacao, e um
// serializer "quase certo" seria pior que um ausente, porque produziria
// rejeicao assincrona em vez de erro no boot.
//
// Por isso o `issue` LANCA em vez de tentar. E por isso o boot ja recusa subir
// com NFSE_PROVIDER=focus_nfsen (server/lib/env.ts): a falha precisa acontecer
// no deploy, onde alguem esta olhando, e nao na primeira cobranca do mes.

import { focusDownload, focusRequest, resolveFocusUrl } from "./focusClient";
import { extractFocusErro } from "./fiscalFocus";
import type {
  FetchStatusResult,
  FiscalProvider,
  IssueInvoiceInput,
  IssueInvoiceResult,
} from "./fiscalTypes";

/**
 * TODO(nfsen): serializar o payload da DPS nacional.
 *
 * Referencia inicial: https://doc.focusnfe.com.br/reference/emitir_dps_nacional
 *
 * O que precisa ser resolvido na homologacao, e que e exatamente o que impede
 * de escrever isto agora:
 *   - o layout da DPS difere do municipal (nao e "o mesmo payload noutro
 *     endpoint"): muda a arvore de prestador/tomador e a identificacao do
 *     servico;
 *   - o codigo de tributacao nacional substitui o item da lista municipal, e o
 *     de-para depende da atividade cadastrada;
 *   - o regime tributario do prestador entra no corpo e nao temos essa env.
 */
export function serializeNfsenPayload(_input: IssueInvoiceInput): never {
  throw new Error(
    "Serializer da NFS-e nacional (DPS) ainda nao implementado. Ver TODO(nfsen) em server/providers/fiscalFocusNacional.ts.",
  );
}

/**
 * Mapeia a consulta nacional.
 *
 * TODO(nfsen): confirmar o vocabulario de status do /v2/nfsen na homologacao.
 * Ate la assume o MESMO do municipal, que e a hipotese mais provavel (a Focus
 * padroniza status entre produtos) e a mais segura: se estiver errada, o
 * `default` cai em `processing`, que mantem o acompanhamento vivo em vez de
 * declarar um desfecho falso.
 */
export function mapNfsenStatus(
  body: Record<string, unknown> | null,
): FetchStatusResult {
  const status = String(body?.status ?? "").trim();
  switch (status) {
    case "autorizado":
      return {
        status: "issued",
        numero: body?.numero ? String(body.numero) : undefined,
        codigoVerificacao: body?.codigo_verificacao
          ? String(body.codigo_verificacao)
          : undefined,
        pdfUrl: resolveFocusUrl(body?.caminho_danfse as string | undefined),
        xmlUrl: resolveFocusUrl(
          body?.caminho_xml_nota_fiscal as string | undefined,
        ),
      };
    case "cancelado":
      return { status: "canceled" };
    case "erro_autorizacao": {
      const { codigo, mensagem } = extractFocusErro(body);
      return {
        status: "failed",
        errorCode: codigo,
        errorMessage: mensagem,
        retryable: false,
      };
    }
    default:
      return { status: "processing" };
  }
}

async function issue(_input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
  // Nao devolve `failed`: devolver falha faria a nota ser marcada como
  // definitivamente perdida por causa de uma feature que ainda nao existe.
  // Lancar deixa o job falhar alto, com Sentry, e o estado da nota intacto.
  return serializeNfsenPayload(_input);
}

async function fetchStatus(
  providerInvoiceId: string,
): Promise<FetchStatusResult> {
  const res = await focusRequest(
    "GET",
    `/v2/nfsen/${encodeURIComponent(providerInvoiceId)}`,
  );
  if (res.status === 404) return { status: "processing" };
  if (res.status >= 400) {
    const { codigo, mensagem } = extractFocusErro(res.body);
    return {
      status: "failed",
      errorCode: codigo,
      errorMessage: mensagem,
      retryable: false,
    };
  }
  return mapNfsenStatus(res.body);
}

async function cancel(
  providerInvoiceId: string,
  reason: string,
): Promise<void> {
  const res = await focusRequest(
    "DELETE",
    `/v2/nfsen/${encodeURIComponent(providerInvoiceId)}`,
    { justificativa: reason },
  );
  if (res.status >= 400) {
    const { codigo, mensagem } = extractFocusErro(res.body);
    throw new Error(
      `Cancelamento recusado pela Focus (${codigo}): ${mensagem}`,
    );
  }
}

export const fiscalFocusNacionalProvider: FiscalProvider = {
  name: "focus_nfsen",
  issue,
  cancel,
  fetchStatus,
  downloadDocument: focusDownload,
};
