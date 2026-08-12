// Composicao do identificador da DPS (Sistema Nacional NFS-e).
//
// FONTE: XSD oficial `tiposSimples_v1.01.xsd`, tipo `TSIdDPS`, do pacote
// NFSe-ESQUEMAS_XSD-v1.01-20260209 publicado em
// gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual.
//
// Regra, verbatim do schema:
//   "DPS" + Cod.Mun (7) + Tipo de Inscricao Federal (1)
//         + Inscricao Federal (14 - CPF completar com 000 a esquerda)
//         + Serie DPS (5) + Num. DPS (15)
// com `maxLength 45` e `pattern DPS[0-9]{42}`.
//
// POR QUE ISTO E UM MODULO PROPRIO, PURO E TESTADO. O Id e a chave de
// idempotencia do provedor (GET/HEAD /dps/{id} responde se aquela DPS ja virou
// NFS-e) e entra assinado dentro do XML. Um digito de padding errado nao
// produz erro visivel: produz um Id que NAO casa com o que ja foi emitido,
// entao a consulta de idempotencia responde "nao existe" e o sistema emite uma
// SEGUNDA nota para a mesma cobranca. E o pior desfecho possivel deste
// projeto, e ele nasce de um `padStart` errado.

/** Prefixo literal exigido pelo schema. */
const PREFIXO = "DPS";

/** Tamanhos fixos de cada campo, na ordem da concatenacao. */
const TAM_MUNICIPIO = 7;
const TAM_TIPO_INSCRICAO = 1;
const TAM_INSCRICAO = 14;
const TAM_SERIE = 5;
const TAM_NUMERO = 15;

/** 3 (literal) + 42 digitos. */
export const TAMANHO_ID_DPS =
  PREFIXO.length +
  TAM_MUNICIPIO +
  TAM_TIPO_INSCRICAO +
  TAM_INSCRICAO +
  TAM_SERIE +
  TAM_NUMERO;

export const ID_DPS_RE = /^DPS[0-9]{42}$/;

/**
 * Tipo de inscricao federal do emitente, o campo de 1 digito do Id.
 *
 * TODO(homologacao): o DOMINIO deste campo nao aparece nos XSDs nem nas abas do
 * ANEXO I que consultei (procurei por `tpInscFed` e pelas descricoes de
 * dominio). A convencao do projeto NFS-e e 1=CNPJ e 2=CPF, mas convencao nao e
 * documentacao: confirmar na producao restrita antes de emitir com CPF. Por
 * isso o valor e PARAMETRO, nunca constante embutida aqui.
 */
export type TipoInscricaoFederal = "1" | "2";

export type ComposicaoIdDps = {
  /** Codigo IBGE do municipio emissor (cLocEmi), 7 digitos. */
  codigoMunicipio: string;
  tipoInscricaoFederal: TipoInscricaoFederal;
  /** CNPJ (14) ou CPF (11). CPF e completado com 000 a ESQUERDA pelo schema. */
  inscricaoFederal: string;
  /** Serie da DPS, ate 5 digitos. */
  serie: string;
  /** Numero da DPS (nextval da sequence), ate 15 digitos. */
  numero: number | bigint | string;
};

function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/**
 * Preenche a esquerda com zeros ate o tamanho exato, e LANCA se nao couber.
 *
 * Truncar seria a alternativa "que nao quebra", e e justamente a errada:
 * cortaria digitos de um documento fiscal e produziria um Id sintaticamente
 * valido apontando para outro emitente.
 *
 * VAZIO TAMBEM LANCA, e este caso foi encontrado por teste: uma entrada sem
 * digito nenhum ("abcdefg", "", undefined que virou string) sobrevivia ao
 * `apenasDigitos` como "" e o `padStart` a transformava num campo de zeros. O
 * Id resultante casava com o pattern do schema e apontava para o municipio
 * 0000000, ou seja, exatamente a familia de falha que este modulo existe para
 * evitar: sintaticamente valido, semanticamente falso.
 */
function alinhar(valor: string, tamanho: number, campo: string): string {
  if (valor.length === 0) {
    throw new Error(
      `Campo ${campo} do Id da DPS ficou sem digito nenhum; zero-fill silencioso nao e aceitavel num identificador fiscal.`,
    );
  }
  if (valor.length > tamanho) {
    throw new Error(
      `Campo ${campo} do Id da DPS tem ${valor.length} digitos e o maximo e ${tamanho} ("${valor}").`,
    );
  }
  return valor.padStart(tamanho, "0");
}

/**
 * Monta o Id de 45 posicoes.
 *
 * Valida a saida contra o proprio pattern do schema antes de devolver: se
 * alguma entrada trouxer algo que nao e digito, o erro aparece AQUI e nao como
 * rejeicao do provedor depois de a nota ja ter sido assinada e enviada.
 */
export function composeIdDps(dados: ComposicaoIdDps): string {
  const municipio = alinhar(
    apenasDigitos(dados.codigoMunicipio),
    TAM_MUNICIPIO,
    "codigoMunicipio",
  );
  const inscricao = alinhar(
    apenasDigitos(dados.inscricaoFederal),
    TAM_INSCRICAO,
    "inscricaoFederal",
  );
  const serie = alinhar(apenasDigitos(dados.serie), TAM_SERIE, "serie");
  const numero = alinhar(
    apenasDigitos(String(dados.numero)),
    TAM_NUMERO,
    "numero",
  );

  const id = `${PREFIXO}${municipio}${dados.tipoInscricaoFederal}${inscricao}${serie}${numero}`;

  if (!ID_DPS_RE.test(id)) {
    throw new Error(
      `Id da DPS gerado nao casa com o pattern do schema (DPS[0-9]{42}): "${id}".`,
    );
  }
  return id;
}

/**
 * Valor do ELEMENTO `infDPS/nDPS`, que NAO e o mesmo do Id.
 *
 * ARMADILHA REAL DO LEIAUTE, e o motivo desta funcao existir ao lado da outra:
 * dentro do Id o numero vai preenchido com zeros a esquerda ate 15 posicoes,
 * mas o elemento `nDPS` tem pattern `[1-9]{1}[0-9]{0,14}`, que PROIBE zero a
 * esquerda. Reaproveitar a string do Id no elemento produz um XML que falha na
 * validacao do schema, e a mensagem do provedor aponta para o campo, nao para a
 * causa.
 *
 * Mesma armadilha em `serie`: no Id vai com 5 posicoes; o elemento aceita
 * `^0{0,4}\d{1,5}$`, entao ali o zero a esquerda e permitido mas nao exigido.
 */
export function valorElementoNumeroDps(
  numero: number | bigint | string,
): string {
  const digitos = apenasDigitos(String(numero)).replace(/^0+/, "");
  if (!digitos) {
    throw new Error("Numero da DPS nao pode ser zero nem vazio.");
  }
  if (digitos.length > TAM_NUMERO) {
    throw new Error(
      `Numero da DPS tem ${digitos.length} digitos e o maximo e ${TAM_NUMERO}.`,
    );
  }
  return digitos;
}
