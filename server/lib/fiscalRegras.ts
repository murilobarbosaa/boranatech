// Regras de emissao decididas pelo CONTADOR (lote FISCAL-REGRAS 01), como
// funcoes PURAS.
//
// Mesmo desenho de fiscalInvoice.ts: este arquivo NAO importa `./env`, o banco
// nem a fila. As decisoes que mais custam se sairem erradas (qual dia e o
// ultimo do mes, qual meio emite, quanto vai na nota) sao exercitaveis sem
// Redis, sem Postgres e sem mock de ambiente.
//
// As regras, na numeracao do lote:
//   R1  so emite para os meios listados em NFSE_MEIOS_EMISSAO;
//   R3  lote no ultimo dia CIVIL do mes, no fuso de Brasilia;
//   R5  valor = bruto menos estornos da propria cobranca;
//   R6  competencia = dia civil de Brasilia da VENDA.

import { diaBrasilia, somarDiaCivil } from "../../shared/brasiliaDay";

export const MEIOS_PAGAMENTO = ["cartao", "pix", "boleto"] as const;
export type MeioPagamento = (typeof MEIOS_PAGAMENTO)[number];

function isMeioPagamento(valor: string): valor is MeioPagamento {
  return (MEIOS_PAGAMENTO as readonly string[]).includes(valor);
}

export type MeiosEmissaoParse =
  | { ok: true; meios: MeioPagamento[] }
  | { ok: false; erro: string };

/**
 * Le NFSE_MEIOS_EMISSAO: lista separada por virgula de cartao, pix e boleto.
 *
 * SEM DEFAULT e sem tolerancia a valor desconhecido, no padrao das demais envs
 * fiscais: quais meios geram nota e decisao do contador, e qualquer lista que o
 * codigo escolhesse sozinho estaria errada em algum sentido. "cartão" com til,
 * "credito" ou "card" NAO viram cartao: um token que nao casa derruba o parse,
 * porque ignora-lo em silencio tiraria um meio inteiro da emissao.
 */
export function parseMeiosEmissao(
  raw: string | undefined | null,
): MeiosEmissaoParse {
  if (!raw || raw.trim() === "") {
    return { ok: false, erro: "vazia" };
  }
  const meios: MeioPagamento[] = [];
  for (const parte of raw.split(",")) {
    const token = parte.trim();
    if (!isMeioPagamento(token)) {
      return { ok: false, erro: `valor desconhecido "${token}"` };
    }
    if (!meios.includes(token)) meios.push(token);
  }
  return { ok: true, meios };
}

/**
 * Meio de uma cobranca da Stripe, pelo `payment_method_details.type` da charge.
 *
 * 'card' cobre credito, debito e pre-pago: a Stripe distingue os tres em
 * `card.funding`, nao no `type`, e a regra do contador trata os tres como
 * cartao. Qualquer outro tipo devolve `null` ("nao sei"), nunca um palpite.
 */
export function meioDaStripe(
  paymentMethodType: string | null | undefined,
): MeioPagamento | null {
  if (paymentMethodType === "card") return "cartao";
  if (paymentMethodType === "boleto") return "boleto";
  return null;
}

/**
 * Meio de uma linha de finance_transactions (a reconciliacao).
 *
 * Asaas e Pix por decisao do contador: e a unica forma de cobranca que o
 * produto cria no Asaas. Na Stripe o meio vem de
 * `raw_payload.source.payment_method_details.type`: o `raw_payload` e a
 * balance transaction com a `source` expandida (server/lib/stripeSync.ts), uma
 * charge. A reconciliacao le SO esse caminho do json, e nao o payload inteiro.
 * Ausente devolve `null`.
 */
export function meioDaLinhaDoLedger(
  provider: string,
  stripePaymentMethodType: string | null | undefined,
): MeioPagamento | null {
  if (provider === "asaas") return "pix";
  if (provider !== "stripe") return null;
  return meioDaStripe(stripePaymentMethodType);
}

/** Competencia (R6): o dia civil de Brasilia do instante da VENDA. */
export function competenciaDaVenda(occurredAtIso: string): string | null {
  return diaBrasilia(occurredAtIso);
}

/** `AAAA-MM-DD` do ultimo dia do mes `AAAA-MM`. Aritmetica de dia civil. */
export function ultimoDiaDoMes(mes: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    throw new Error(`ultimoDiaDoMes: mes invalido ("${mes}")`);
  }
  const [ano, m] = mes.split("-").map(Number);
  const primeiroDoSeguinte =
    m === 12
      ? `${ano + 1}-01-01`
      : `${ano}-${String(m + 1).padStart(2, "0")}-01`;
  return somarDiaCivil(primeiroDoSeguinte, -1);
}

export type DecisaoDoLote =
  | { disparar: true; mes: string; dia: string }
  | { disparar: false; dia: string };

/**
 * O lote automatico dispara AGORA? (R3)
 *
 * So no ultimo dia CIVIL do mes em Brasilia, sem calendario de feriados. O dia
 * e o de BRASILIA do instante, e nao o dia UTC: as 23:00 de 31/10 em Brasilia
 * ja sao 02:00Z de 01/11, e o recorte UTC diria "dia 1, nao dispara", perdendo
 * o lote de outubro inteiro sem erro nenhum.
 *
 * "Ultimo dia" = o dia seguinte cai em outro mes. Aritmetica de dia civil
 * (somarDiaCivil), sem tabela de dias por mes nem regra de bissexto escrita a
 * mao.
 */
export function decidirLoteAutomatico(agora: Date): DecisaoDoLote {
  const dia = diaBrasilia(agora.toISOString());
  if (!dia) {
    throw new Error("decidirLoteAutomatico: instante invalido.");
  }
  const amanha = somarDiaCivil(dia, 1);
  if (amanha.slice(0, 7) === dia.slice(0, 7)) {
    return { disparar: false, dia };
  }
  return { disparar: true, mes: dia.slice(0, 7), dia };
}

export type ValidacaoLoteManual =
  | { ok: true; mes: string }
  | { ok: false; motivo: "mes_invalido" | "mes_ainda_aberto" };

/**
 * Acionamento MANUAL do lote de um mes, para recuperacao (cron que nao rodou no
 * ultimo dia, servidor fora do ar as 23:00).
 *
 * Aceita mes JA ENCERRADO, ou o mes corrente somente no seu ultimo dia. Aceitar
 * o mes corrente antes do fim seria emitir antes do lote, que e a regra R3
 * quebrada por um botao. Mes futuro cai no mesmo motivo.
 */
export function validarLoteManual(
  mes: string,
  agora: Date,
): ValidacaoLoteManual {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    return { ok: false, motivo: "mes_invalido" };
  }
  const automatico = decidirLoteAutomatico(agora);
  const mesCorrente = automatico.dia.slice(0, 7);
  if (mes < mesCorrente) return { ok: true, mes };
  if (mes === mesCorrente && automatico.disparar) return { ok: true, mes };
  return { ok: false, motivo: "mes_ainda_aberto" };
}

/**
 * Valor da nota (R5): bruto menos o estornado. Nunca negativo.
 *
 * Zero ou menos significa estorno integral: a nota NAO sai, e quem decide isso
 * e o chamador com um motivo proprio. Esta funcao so faz a conta, para que o
 * lote e o worker nao tenham cada um a sua.
 */
export function valorLiquidoCents(
  brutoCents: number,
  estornadoCents: number,
): number {
  const liquido = brutoCents - Math.max(estornadoCents, 0);
  return liquido > 0 ? liquido : 0;
}

/**
 * Fracao decimal de env tributaria (R7), no formato que a Focus documenta para
 * `servico.aliquota` (exemplo 0.05) e `servico.percentual_total_tributos`
 * (exemplo 0.34): numero entre 0 e 1, nunca percentual inteiro.
 *
 * O FORMATO E EXIGIDO LITERALMENTE ("0." e ate 4 casas), e nao so o intervalo:
 * "2" (dois por cento escrito como percentual) e o erro obvio de quem copia o
 * numero do contador, e sairia como aliquota de 200%. `null` cobre ausente,
 * formato errado e fora do dominio, e o boot aborta nos tres casos.
 */
export function parseFracaoTributaria(
  raw: string | undefined | null,
  dominio: { min: number; max: number },
): number | null {
  if (!raw) return null;
  if (!/^0\.\d{1,4}$/.test(raw)) return null;
  const valor = Number(raw);
  if (!Number.isFinite(valor)) return null;
  if (valor < dominio.min || valor > dominio.max) return null;
  return valor;
}

/**
 * Dominio da aliquota de ISS: 2% a 5%, os limites da LC 116/2003 (art. 8-A,
 * minimo, e art. 8, II, maximo). Fora disso a nota sairia com imposto que a
 * lei nao admite.
 */
export const DOMINIO_ALIQUOTA_ISS = { min: 0.02, max: 0.05 } as const;

/**
 * Dominio do percentual aproximado de tributos (Lei 12.741/2012): acima de
 * zero e abaixo de 100%.
 */
export const DOMINIO_PERCENTUAL_TRIBUTOS = {
  min: 0.0001,
  max: 0.9999,
} as const;

/** error_code gravado quando o estorno integral chega antes da emissao. */
export const MOTIVO_ESTORNO_INTEGRAL = "estorno_integral_antes_da_emissao";

export type DecisaoDeElegibilidade =
  | { elegivel: true; competencia: string; meio: MeioPagamento }
  | {
      elegivel: false;
      motivo: "before_cutoff" | "meio_fora_da_emissao" | "meio_desconhecido";
    };

/**
 * Uma cobranca pode virar nota? Fonte UNICA para os dois pontos que criam
 * linha (o registro no pagamento e a reconciliacao), para que nao exista um
 * caminho que emite o que o outro recusa.
 *
 * ORDEM: corte antes do meio. Uma venda anterior ao corte e passado fechado
 * (R8), e conta-la tambem como "meio fora" encheria esse contador de linhas
 * antigas que nao pedem acao nenhuma.
 *
 * Meio DESCONHECIDO e motivo separado de meio FORA DA LISTA: o primeiro e
 * "nao consegui classificar" e pede investigacao; o segundo e a regra do
 * contador funcionando. Juntar os dois esconderia o primeiro no segundo.
 */
export function decidirElegibilidade(params: {
  meio: MeioPagamento | null;
  occurredAtIso: string;
  meiosEmissao: readonly MeioPagamento[];
  cutoffISO: string;
}): DecisaoDeElegibilidade {
  const competencia = competenciaDaVenda(params.occurredAtIso);
  if (!competencia || competencia < params.cutoffISO) {
    return { elegivel: false, motivo: "before_cutoff" };
  }
  if (!params.meio) return { elegivel: false, motivo: "meio_desconhecido" };
  if (!params.meiosEmissao.includes(params.meio)) {
    return { elegivel: false, motivo: "meio_fora_da_emissao" };
  }
  return { elegivel: true, competencia, meio: params.meio };
}
