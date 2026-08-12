// Interface do provider de NFS-e, no molde do PaymentProvider (./types.ts).
//
// Existe atras de uma interface pelo mesmo motivo que o pagamento: a qualidade
// da integracao com a prefeitura varia por municipio, e trocar de provedor e um
// cenario realista, nao hipotetico. O adapter real entra na Fase 3; a Fase 1 tem
// so o mock.

import type {
  FiscalDocumentType,
  FiscalEndereco,
} from "../../shared/fiscalIdentity";

/**
 * Adapters existentes. Fica AQUI, e nao em lib/env.ts, para que acrescentar um
 * provedor seja uma mudanca so: o `switch` de resolucao deixa de ser exaustivo e
 * o compilador cobra a entrada nova.
 */
export type FiscalProviderName = "mock" | "focus_nfse" | "focus_nfsen";

/**
 * CPF ou CNPJ. O tipo e DECLARADO, nunca inferido pelo tamanho da string.
 *
 * Alias do tipo compartilhado, nao uma segunda definicao: na Fase 1 este arquivo
 * declarava a uniao por conta propria, e a Fase 2 trouxe a mesma uniao para
 * shared/fiscalIdentity.ts (onde o cliente tambem precisa dela). Duas
 * declaracoes do mesmo conjunto divergem no dia em que alguem acrescentar um
 * terceiro documento em so uma delas.
 */
export type TomadorDocumentType = FiscalDocumentType;

/**
 * Endereco do tomador, no MESMO formato que shared/fiscalIdentity.ts monta a
 * partir de profiles. Era uma interface propria na Fase 1, com `municipio` onde
 * o outro lado dizia `cidade`: dois vocabularios para o mesmo campo, que e como
 * um mapeamento errado passa despercebido. Agora e um tipo so.
 *
 * Continua OPCIONAL no input: ausencia de endereco NAO bloqueia a emissao
 * (contrato herdado da Fase 1). Quando um municipio exigir, quem cobra e o
 * adapter dele.
 */
export type TomadorEndereco = FiscalEndereco;

export interface IssueInvoiceTomador {
  /**
   * Nome que vai na nota. Pessoa fisica: o nome CIVIL (profiles.full_name).
   * Pessoa juridica: a RAZAO SOCIAL. Um campo so, e nao `nome` mais
   * `razaoSocial` opcional, porque a nota tem uma linha de identificacao do
   * tomador, nao duas, e um par de campos opcionais deixaria representavel o
   * estado "PJ sem razao social", que nao existe.
   */
  nome: string;
  /** So digitos, sem pontuacao. */
  documento: string;
  tipoDocumento: TomadorDocumentType;
  email: string;
  endereco?: TomadorEndereco;
}

export interface IssueInvoiceServico {
  descricao: string;
  /** Valor BRUTO em centavos. A taxa da Stripe e despesa nossa, nao deduz. */
  valorCents: number;
}

export interface IssueInvoiceInput {
  /**
   * Nosso `fiscal_invoices.id`. Vai como referencia externa no provedor, que e
   * o que permite reconciliar os dois lados sem depender da ordem das chamadas.
   */
  referenceId: string;
  tomador: IssueInvoiceTomador;
  servico: IssueInvoiceServico;
}

/**
 * Resultado da emissao, uniao DISCRIMINADA de proposito.
 *
 * Um objeto unico com campos opcionais deixaria "emitiu mas sem numero" e
 * "falhou mas com providerInvoiceId" representaveis, e o codigo teria que
 * adivinhar qual campo confere. Com a uniao, cada desfecho carrega exatamente o
 * que aquele desfecho garante, e o compilador cobra o resto.
 */
/**
 * Identificacao da nota autorizada.
 *
 * Tudo opcional porque nem todo municipio devolve tudo: alguns nao tem serie,
 * outros nao emitem codigo de verificacao, e a URL do PDF as vezes so aparece
 * depois. O que NAO e opcional e a honestidade: campo ausente fica ausente, e
 * nunca vira string vazia disfarcada de valor.
 */
export type FiscalDocumentRefs = {
  numero?: string;
  serie?: string;
  codigoVerificacao?: string;
  /** URL ABSOLUTA do PDF (DANFSE). O adapter resolve caminhos relativos. */
  pdfUrl?: string;
  /** URL ABSOLUTA do XML. */
  xmlUrl?: string;
};

/**
 * Falha de emissao, com a classificacao que decide o retry.
 *
 * `retryable: true` = a mesma requisicao pode dar certo depois (prefeitura fora
 * do ar, timeout, 5xx do provedor): relanca e o BullMQ faz o backoff.
 * `retryable: false` = repetir nunca vai funcionar (validacao 4xx, rejeicao da
 * prefeitura): grava 'failed' e PARA, porque 12 tentativas contra um erro
 * permanente so gastam tempo e escondem o problema real atras de um job que
 * ainda "vai tentar".
 */
export type FiscalFailure = {
  status: "failed";
  errorCode: string;
  errorMessage: string;
  retryable: boolean;
};

export type IssueInvoiceResult =
  | ({ status: "issued"; providerInvoiceId: string } & FiscalDocumentRefs)
  | { status: "processing"; providerInvoiceId: string }
  | FiscalFailure;

/**
 * Resultado da CONSULTA de uma nota ja entregue ao provedor.
 *
 * Ate a Fase 2 isto era so uma string de status, e o comentario no chamador
 * dizia o preco disso: uma nota reconsultada ficava sem numero, sem codigo de
 * verificacao e sem documento no nosso lado, porque o unico caminho que trazia
 * esses campos era o retorno sincrono do issue(). Como a emissao real e
 * ASSINCRONA, esse caminho quase nunca acontece, e a consulta e que precisa
 * trazer a identificacao. Mesma uniao discriminada do issue, pelo mesmo motivo.
 */
export type FetchStatusResult =
  | ({ status: "issued" } & FiscalDocumentRefs)
  | { status: "processing" }
  | { status: "canceled" }
  | FiscalFailure;

/** Vocabulario de status do nosso banco. */
export type FiscalInvoiceStatus =
  | "processing"
  | "issued"
  | "failed"
  | "canceled";

export interface FiscalProvider {
  readonly name: FiscalProviderName;
  issue(input: IssueInvoiceInput): Promise<IssueInvoiceResult>;
  cancel(providerInvoiceId: string, reason: string): Promise<void>;
  fetchStatus(providerInvoiceId: string): Promise<FetchStatusResult>;
  /**
   * Baixa um documento a partir da URL que o proprio provedor devolveu.
   *
   * Esta no contrato, e nao num helper solto, porque BAIXAR EXIGE A
   * AUTENTICACAO DO PROVEDOR: os caminhos da Focus apontam para o host
   * autenticado dela, e um GET sem o header devolve HTML de login com HTTP 200.
   * Isso seria gravado no storage como se fosse a nota, e o defeito so
   * apareceria quando alguem abrisse o arquivo. Cada adapter sabe assinar as
   * proprias requisicoes; quem chama nao precisa saber.
   */
  downloadDocument(url: string): Promise<Buffer>;
}
