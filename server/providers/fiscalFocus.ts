// Adapter de NFS-e MUNICIPAL da Focus NFe (/v2/nfse). E o caminho de HOJE.
//
// Contrato conferido na doc oficial em 2026-08-04:
//   https://doc.focusnfe.com.br/reference/emitir_nfse
//   https://doc.focusnfe.com.br/reference/ambiente
//
// TRES propriedades que este arquivo precisa garantir, em ordem de gravidade:
//
// 1. NUNCA emitir duas notas para a mesma cobranca. A Focus trata a `ref` da
//    query string como chave de idempotencia, e a nossa `ref` e o
//    fiscal_invoices.id. Alem de confiar nisso, o issue() CONSULTA antes de
//    postar e trata "ref ja utilizada" como sinal de consulta. Isso fecha o
//    buraco documentado na Fase 1 (POST que cria a nota e cuja resposta se
//    perde no timeout).
// 2. Emissao e ASSINCRONA. Um 201 significa "aceito para processamento", nao
//    "autorizado". Quem descobre o desfecho e o fetchStatus, e por isso ele
//    devolve os documentos, nao so o status.
// 3. Classificar falha em retentavel e definitiva. Prefeitura fora do ar volta;
//    CPF rejeitado nao volta nunca.

import {
  focusDownload,
  focusRequest,
  FocusTransportError,
  resolveFocusUrl,
} from "./focusClient";
import { env } from "../lib/env";
import type {
  FetchStatusResult,
  FiscalProvider,
  IssueInvoiceInput,
  IssueInvoiceResult,
} from "./fiscalTypes";

/**
 * `data_emissao` no fuso de Brasilia, com o offset explicito.
 *
 * O offset e DERIVADO de America/Sao_Paulo, nunca escrito como "-03:00" fixo.
 * Hoje o Brasil nao tem horario de verao, e por isso os dois coincidem; se ele
 * voltar, a constante ficaria uma hora errada durante meses e a data da nota
 * sairia trocada perto da meia-noite, que e o tipo de erro que ninguem liga a
 * uma constante escrita anos antes.
 */
export function dataEmissaoBrasilia(date: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  });
  const partes: Record<string, string> = {};
  for (const parte of fmt.formatToParts(date)) partes[parte.type] = parte.value;
  // timeZoneName sai como "GMT-03:00"; o formato ISO quer so o "-03:00".
  const offset = (partes.timeZoneName ?? "GMT-03:00").replace("GMT", "");
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}:${partes.second}${offset}`;
}

type FocusEndereco = {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigo_municipio: string;
  uf: string;
  cep: string;
};

/**
 * Endereco do tomador no formato da Focus, ou `undefined`.
 *
 * A Focus exige logradouro, numero, bairro, codigo_municipio, uf e cep juntos.
 * O `codigo_municipio` e o que mais falta na pratica: ele so aparece quando a
 * consulta de CEP responde (Fase 2), entao um endereco digitado inteiramente a
 * mao chega aqui sem ele. Endereco incompleto e OMITIDO, nunca enviado pela
 * metade: metade seria rejeitada pela prefeitura como erro de validacao, e o
 * contrato da Fase 1 diz que endereco ausente nao pode impedir a emissao.
 */
export function serializeEndereco(
  endereco: IssueInvoiceInput["tomador"]["endereco"],
): FocusEndereco | undefined {
  if (!endereco) return undefined;
  const { logradouro, numero, bairro, codigoMunicipio, uf, cep } = endereco;
  if (!logradouro || !numero || !bairro || !codigoMunicipio || !uf || !cep) {
    return undefined;
  }
  return {
    logradouro,
    numero,
    ...(endereco.complemento ? { complemento: endereco.complemento } : {}),
    bairro,
    codigo_municipio: codigoMunicipio,
    uf,
    cep,
  };
}

export type FocusNfsePayload = Record<string, unknown>;

/**
 * Payload de emissao municipal.
 *
 * Funcao PURA e exportada para teste: e o unico ponto onde o nosso vocabulario
 * vira o vocabulario da prefeitura, e um campo trocado aqui so apareceria como
 * rejeicao assincrona horas depois.
 */
export function serializeNfsePayload(
  input: IssueInvoiceInput,
  agora: Date,
): FocusNfsePayload {
  const pj = input.tomador.tipoDocumento === "cnpj";
  const endereco = serializeEndereco(input.tomador.endereco);

  // ENQUADRAMENTO TRIBUTARIO. Lanca em vez de omitir, porque este e um valor
  // que E a informacao, nao apresentacao dela: emitir como nao-optante uma
  // empresa optante do Simples produz uma nota VALIDA com tributacao errada,
  // que nao acusa nada e so aparece no fechamento contabil. O boot ja aborta
  // sem a env; esta guarda cobre quem chegar aqui por outro caminho (script de
  // homologacao, teste, chamada direta).
  if (env.nfseOptanteSimples === null) {
    throw new Error(
      'NFSE_OPTANTE_SIMPLES ausente ou invalido (use exatamente "true" ou "false"). O enquadramento nao pode ser presumido.',
    );
  }

  return {
    data_emissao: dataEmissaoBrasilia(agora),
    optante_simples_nacional: env.nfseOptanteSimples,
    // Os dois abaixo sao OPCIONAIS e vao verbatim quando configurados. Chave
    // ausente e diferente de chave vazia: mandar `natureza_operacao: ""` faria
    // a Focus recusar por validacao, enquanto omitir deixa o default dela valer.
    //
    // TODO(homologacao): confirmar os valores contra o municipio. O padrao
    // ABRASF usa "1" para tributacao no municipio e "6" para ME/EPP optante do
    // Simples, mas cada implementacao municipal aceita um subconjunto proprio.
    ...(env.nfseNaturezaOperacao
      ? { natureza_operacao: env.nfseNaturezaOperacao }
      : {}),
    ...(env.nfseRegimeEspecialTributacao
      ? { regime_especial_tributacao: env.nfseRegimeEspecialTributacao }
      : {}),
    prestador: {
      cnpj: env.nfsePrestadorCnpj,
      inscricao_municipal: env.nfsePrestadorInscricaoMunicipal,
      codigo_municipio: env.nfsePrestadorCodigoMunicipio,
    },
    tomador: {
      // A chave do documento e ESCOLHIDA pelo tipo declarado, e a outra nem
      // aparece: mandar `cpf: null` junto de `cnpj` faria a Focus decidir por
      // nos qual dos dois vale.
      ...(pj
        ? { cnpj: input.tomador.documento }
        : { cpf: input.tomador.documento }),
      razao_social: input.tomador.nome,
      email: input.tomador.email,
      ...(endereco ? { endereco } : {}),
    },
    servico: {
      // TODO(homologacao): confirmar se a prefeitura espera a aliquota como
      // fracao (0.02) ou percentual (2). A env carrega o numero exatamente como
      // o contador informou; nao ha conversao aqui de proposito, porque
      // converter errado produz um imposto plausivel e errado.
      aliquota: env.nfseServicoAliquota,
      discriminacao: input.servico.descricao,
      iss_retido: false,
      item_lista_servico: env.nfseServicoItemLista,
      ...(env.nfseServicoCodigoTributarioMunicipio
        ? {
            codigo_tributario_municipio:
              env.nfseServicoCodigoTributarioMunicipio,
          }
        : {}),
      // Municipio da PRESTACAO do servico, que e o nosso, nao o do tomador.
      codigo_municipio: env.nfsePrestadorCodigoMunicipio,
      // TODO(homologacao): confirmar o formato aceito para o valor. Enviamos
      // numero com 2 casas (29.9), derivado dos centavos, que e o que os
      // exemplos da doc mostram.
      valor_servicos: Number((input.servico.valorCents / 100).toFixed(2)),
    },
  };
}

/** Mensagem legivel a partir do array `erros` da Focus. */
export function extractFocusErro(body: Record<string, unknown> | null): {
  codigo: string;
  mensagem: string;
} {
  const erros = body?.erros;
  if (Array.isArray(erros) && erros.length > 0) {
    const primeiro = erros[0] as Record<string, unknown>;
    const codigo = String(primeiro.codigo ?? body?.codigo ?? "focus_erro");
    const mensagem = String(
      primeiro.mensagem ?? primeiro.mensagem_completa ?? "Erro na emissao.",
    );
    // Mais de um erro: a mensagem carrega a contagem, para ninguem corrigir o
    // primeiro e achar que acabou.
    const extra = erros.length > 1 ? ` (+${erros.length - 1} erro(s))` : "";
    return { codigo, mensagem: `${mensagem}${extra}` };
  }
  return {
    codigo: String(body?.codigo ?? "focus_erro"),
    mensagem: String(body?.mensagem ?? "Erro na emissao junto ao provedor."),
  };
}

/**
 * Traduz a consulta da Focus para o nosso vocabulario.
 *
 * Funcao PURA e exportada: e o mapeamento que decide se uma nota vira 'issued'
 * no nosso banco, e ele precisa de teste sem rede.
 *
 * Status DESCONHECIDO cai em 'processing', nao em 'failed' nem em 'issued'.
 * Motivo: um status novo da Focus (ou um municipio com vocabulario proprio) nao
 * pode nem dar a nota como emitida (mentira grave) nem como falhada
 * (encerraria o acompanhamento). 'processing' mantem o job vivo, o backoff
 * segue, e o Sentry recebe o aviso.
 */
export function mapFocusStatus(
  body: Record<string, unknown> | null,
): FetchStatusResult {
  const status = String(body?.status ?? "").trim();

  switch (status) {
    case "autorizado": {
      // TODO(homologacao): confirmar os nomes exatos dos campos de documento
      // por municipio. A doc lista `caminho_xml_nota_fiscal` e `url`; alguns
      // municipios devolvem tambem `caminho_danfse`. A ordem abaixo prefere o
      // caminho dedicado do PDF e cai para `url` (pagina da prefeitura) quando
      // ele nao vier. Campo ausente fica ausente: nada de string vazia.
      const pdf =
        resolveFocusUrl(body?.caminho_danfse as string | undefined) ??
        resolveFocusUrl(body?.url_danfse as string | undefined) ??
        resolveFocusUrl(body?.url as string | undefined);
      return {
        status: "issued",
        numero: body?.numero ? String(body.numero) : undefined,
        serie: body?.serie ? String(body.serie) : undefined,
        codigoVerificacao: body?.codigo_verificacao
          ? String(body.codigo_verificacao)
          : undefined,
        pdfUrl: pdf,
        xmlUrl: resolveFocusUrl(
          body?.caminho_xml_nota_fiscal as string | undefined,
        ),
      };
    }
    case "cancelado":
      return { status: "canceled" };
    case "erro_autorizacao": {
      const { codigo, mensagem } = extractFocusErro(body);
      // Rejeicao da prefeitura NAO e retentavel: reenviar o mesmo payload
      // produz a mesma rejeicao. Alguem precisa corrigir o cadastro ou a
      // configuracao do servico.
      return {
        status: "failed",
        errorCode: codigo,
        errorMessage: mensagem,
        retryable: false,
      };
    }
    case "processando_autorizacao":
      return { status: "processing" };
    default:
      console.warn(
        `[fiscal/focus] status desconhecido da Focus: "${status}". Tratando como processando.`,
      );
      return { status: "processing" };
  }
}

const REF_JA_UTILIZADA = new Set([
  "ref_ja_utilizada",
  "nota_fiscal_ja_enviada",
  "documento_ja_autorizado",
]);

/** A Focus recusou o POST porque a `ref` ja existe la. */
function refJaExiste(body: Record<string, unknown> | null): boolean {
  const codigo = String(body?.codigo ?? "");
  if (REF_JA_UTILIZADA.has(codigo)) return true;
  // TODO(homologacao): confirmar o `codigo` exato devolvido no 422 de ref
  // repetida. Ate la, o texto tambem e inspecionado, e o custo de um falso
  // positivo aqui e apenas uma consulta a mais (nunca uma nota a menos).
  const texto = `${body?.mensagem ?? ""}`.toLowerCase();
  return texto.includes("ja") && texto.includes("ref");
}

async function consultar(ref: string): Promise<FetchStatusResult | null> {
  const res = await focusRequest("GET", `/v2/nfse/${encodeURIComponent(ref)}`);
  // 404 = a Focus nao conhece esta ref. E a resposta esperada ANTES da primeira
  // emissao, entao nao e erro: devolve null e o chamador segue para o POST.
  if (res.status === 404) return null;
  if (res.status >= 400) {
    const { codigo, mensagem } = extractFocusErro(res.body);
    return {
      status: "failed",
      errorCode: codigo,
      errorMessage: mensagem,
      retryable: false,
    };
  }
  return mapFocusStatus(res.body);
}

function falhaDeTransporte(err: unknown): IssueInvoiceResult {
  const transporte = err instanceof FocusTransportError;
  return {
    status: "failed",
    errorCode: transporte ? (err as FocusTransportError).code : "focus_erro",
    errorMessage: err instanceof Error ? err.message : String(err),
    // Transporte volta a funcionar; qualquer outra excecao aqui e defeito
    // nosso, e repetir defeito nosso 12 vezes so esconde o defeito.
    retryable: transporte,
  };
}

async function issue(input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
  const ref = input.referenceId;

  try {
    // PASSO 1, o que fecha o buraco de duplicidade: a nota pode ja existir la
    // por causa de um POST anterior cuja resposta se perdeu.
    const existente = await consultar(ref);
    if (existente) {
      if (existente.status === "issued") {
        return { ...existente, providerInvoiceId: ref };
      }
      if (existente.status === "processing") {
        return { status: "processing", providerInvoiceId: ref };
      }
      // canceled e failed voltam como falha definitiva: nao ha o que reemitir
      // com a mesma ref.
      if (existente.status === "canceled") {
        return {
          status: "failed",
          errorCode: "nota_cancelada",
          errorMessage: "A nota desta cobranca ja foi cancelada no provedor.",
          retryable: false,
        };
      }
      return existente;
    }

    // PASSO 2: emitir de fato.
    const res = await focusRequest(
      "POST",
      `/v2/nfse?ref=${encodeURIComponent(ref)}`,
      serializeNfsePayload(input, new Date()),
    );

    if (res.status === 422 && refJaExiste(res.body)) {
      // Corrida com outra tentativa: alguem postou entre a consulta e este
      // POST. Nao e erro, e a idempotencia funcionando.
      return { status: "processing", providerInvoiceId: ref };
    }

    if (res.status >= 400) {
      const { codigo, mensagem } = extractFocusErro(res.body);
      // 4xx e validacao: o mesmo payload sera recusado de novo.
      return {
        status: "failed",
        errorCode: codigo,
        errorMessage: mensagem,
        retryable: false,
      };
    }

    // Aceito. A doc devolve `processando_autorizacao` no 201; qualquer outro
    // status vindo aqui passa pelo mesmo mapeamento, para nao existir um
    // segundo lugar decidindo o que cada status significa.
    const mapeado = mapFocusStatus(res.body);
    if (mapeado.status === "issued") {
      return { ...mapeado, providerInvoiceId: ref };
    }
    if (mapeado.status === "failed") return mapeado;
    return { status: "processing", providerInvoiceId: ref };
  } catch (err) {
    return falhaDeTransporte(err);
  }
}

async function fetchStatus(
  providerInvoiceId: string,
): Promise<FetchStatusResult> {
  try {
    const resultado = await consultar(providerInvoiceId);
    if (!resultado) {
      // Sumiu do provedor. Nao inventamos desfecho: segue em processing e o
      // backoff continua, com o aviso no log.
      console.warn(
        `[fiscal/focus] ref ${providerInvoiceId} nao encontrada na consulta.`,
      );
      return { status: "processing" };
    }
    return resultado;
  } catch (err) {
    const transporte = err instanceof FocusTransportError;
    return {
      status: "failed",
      errorCode: transporte ? (err as FocusTransportError).code : "focus_erro",
      errorMessage: err instanceof Error ? err.message : String(err),
      retryable: transporte,
    };
  }
}

/**
 * Cancela a nota no provedor.
 *
 * TODO(homologacao): confirmar o contrato do cancelamento de NFS-e. A doc que
 * consultei descreve a emissao e a consulta; o cancelamento e DELETE em
 * /v2/nfse/{ref} com uma justificativa no corpo, e o nome exato do campo
 * (`justificativa`) precisa ser conferido na homologacao. Errar o nome faz a
 * Focus recusar, e a recusa e tratada como "nao cancelou" (a nota segue
 * emitida, com precisa_revisao), que e o lado seguro: nunca fingimos cancelado.
 *
 * TODO(homologacao): confirmar tambem o PRAZO municipal de cancelamento. Fora
 * do prazo, a recusa e definitiva e a substituicao vira processo manual.
 */
async function cancel(
  providerInvoiceId: string,
  reason: string,
): Promise<void> {
  const res = await focusRequest(
    "DELETE",
    `/v2/nfse/${encodeURIComponent(providerInvoiceId)}`,
    { justificativa: reason },
  );
  if (res.status >= 400) {
    const { codigo, mensagem } = extractFocusErro(res.body);
    throw new Error(
      `Cancelamento recusado pela Focus (${codigo}): ${mensagem}`,
    );
  }
}

export const fiscalFocusProvider: FiscalProvider = {
  name: "focus_nfse",
  issue,
  cancel,
  fetchStatus,
  downloadDocument: focusDownload,
};
