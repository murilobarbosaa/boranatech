import { somarDiaCivil } from "./brasiliaDay";
import type { RedeDeCreator, Resultado } from "./creatorProfile";

// REGRAS DO CALENDARIO COMPARTILHADO (lote 10): a marcacao de um dia, o pedido
// de collab e a grade do mes que o client desenha.
//
// Fonte UNICA para o server, que grava, e para o client, que mostra o mesmo
// erro antes de enviar. Mesmo motivo de shared/creatorPost.ts.
//
// A REDE VEM DE `creatorProfile` (`RedeDeCreator`), e nao de uma lista nova: o
// conjunto e o mesmo (instagram e tiktok), e uma terceira copia divergiria na
// primeira vez que alguem acrescentasse uma rede.
//
// A GRADE E ARITMETICA DE DIA CIVIL, sem biblioteca e sem fuso: um mes vira
// semanas de domingo a sabado, e os dias de fora do mes vem marcados para o
// client desenha-los apagados. Nada aqui converte para instante, porque dia de
// publicacao e dia, nao hora.

export type { RedeDeCreator };

/** Tamanho maximo da nota de uma marcacao, depois do trim. */
export const NOTA_MAX = 140;

/** Tamanho maximo da mensagem de um pedido de collab, depois do trim. */
export const MENSAGEM_MAX = 300;

/**
 * Ate onde da para marcar, contando de hoje.
 *
 * Noventa dias e o horizonte em que um calendario editorial ainda diz algo:
 * alem disso a marcacao vira intencao vaga e o calendario enche de dia que
 * ninguem vai cumprir.
 */
export const JANELA_DE_DIAS = 90;

/**
 * Teto de pedidos de collab por dia, por creator.
 *
 * Mesmo motivo do teto de publicacoes do lote 09: sem ele, pedir collab em
 * todas as marcacoes do mes custa um clique por vez e vira spam para quem
 * recebe. Nao e antifraude, e o limite que torna o exagero trabalhoso.
 */
export const LIMITE_DE_PEDIDOS_POR_DIA = 5;

const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;

export type CodigoDaNota = "invalid_note";
export type CodigoDaMensagem = "invalid_message";
export type CodigoDaData = "invalid_date" | "date_out_of_window";

/**
 * Nota da marcacao: texto curto do assunto. Vazio (ou so espaco) vira `null`,
 * que e "sem assunto", e nao erro: marcar o dia ja vale sem dizer o tema.
 */
export function normalizarNota(
  valor: unknown,
): Resultado<string | null, CodigoDaNota> {
  if (valor === null || valor === undefined) return { ok: true, valor: null };
  if (typeof valor !== "string") return { ok: false, code: "invalid_note" };
  const texto = valor.trim();
  if (texto === "") return { ok: true, valor: null };
  if (texto.length > NOTA_MAX) return { ok: false, code: "invalid_note" };
  return { ok: true, valor: texto };
}

/** Mensagem do pedido de collab. Mesma regra da nota, com outro teto. */
export function normalizarMensagemDeCollab(
  valor: unknown,
): Resultado<string | null, CodigoDaMensagem> {
  if (valor === null || valor === undefined) return { ok: true, valor: null };
  if (typeof valor !== "string") return { ok: false, code: "invalid_message" };
  const texto = valor.trim();
  if (texto === "") return { ok: true, valor: null };
  if (texto.length > MENSAGEM_MAX) {
    return { ok: false, code: "invalid_message" };
  }
  return { ok: true, valor: texto };
}

/**
 * Data de uma marcacao: de HOJE ate hoje mais `JANELA_DE_DIAS`, em dia civil de
 * Brasilia (quem chama passa o `hoje` ja resolvido por `diaBrasilia`).
 *
 * Passado e recusado com codigo PROPRIO (`date_out_of_window`), separado do
 * formato invalido: a tela diz "esse dia ja passou", que e outra conversa de
 * "essa data nao existe".
 */
export function validarDataDeMarcacao(
  valor: unknown,
  hoje: string,
): Resultado<string, CodigoDaData> {
  if (typeof valor !== "string" || !DIA_RE.test(valor)) {
    return { ok: false, code: "invalid_date" };
  }
  if (!DIA_RE.test(hoje)) {
    throw new Error(`validarDataDeMarcacao: hoje invalido ("${hoje}")`);
  }
  // Comparacao de string funciona em AAAA-MM-DD, e e a unica que nao passa por
  // fuso nenhum.
  if (valor < hoje) return { ok: false, code: "date_out_of_window" };
  const limite = somarDiaCivil(hoje, JANELA_DE_DIAS);
  if (valor > limite) return { ok: false, code: "date_out_of_window" };
  return { ok: true, valor };
}

/** Um quadrado da grade: o dia e se ele pertence ao mes desenhado. */
export type DiaDaGrade = {
  /** `AAAA-MM-DD`. */
  dia: string;
  doMes: boolean;
};

/** Uma semana da grade, sempre de domingo a sabado, sempre com sete dias. */
export type SemanaDaGrade = DiaDaGrade[];

function diaDaSemana(dia: string): number {
  return new Date(`${dia}T00:00:00Z`).getUTCDay();
}

const MES_RE = /^(\d{4})-(\d{2})$/;

/**
 * Primeiro e ultimo dia civil de um mes, em `AAAA-MM-DD`.
 *
 * E UMA FUNCAO SO porque o server filtra o mes por intervalo de data e o client
 * desenha a grade: as duas pontas precisam do mesmo par, e uma segunda copia da
 * aritmetica de fim de mes divergiria na primeira correcao (fevereiro,
 * bissexto, virada de ano).
 *
 * Mes invalido LANCA: quem chama passa numero, nao entrada de usuario. Entrada
 * de usuario passa antes por `parseMesDoCalendario`, que devolve `null`.
 */
export function limitesDoMes(
  ano: number,
  mes: number,
): { primeiro: string; ultimo: string } {
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
    throw new Error(`limitesDoMes: ano invalido (${ano})`);
  }
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new Error(`limitesDoMes: mes invalido (${mes})`);
  }
  const primeiro = `${ano}-${String(mes).padStart(2, "0")}-01`;
  // Ultimo dia do mes: o dia anterior ao dia 1 do mes seguinte. Assim nao ha
  // tabela de tamanhos de mes nem caso especial de bissexto.
  const primeiroDoSeguinte =
    mes === 12
      ? `${ano + 1}-01-01`
      : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  return { primeiro, ultimo: somarDiaCivil(primeiroDoSeguinte, -1) };
}

/**
 * O `?mes=AAAA-MM` que chega na rota, ou `null`.
 *
 * Devolve `null` tanto para o formato errado quanto para o mes fora da faixa:
 * as duas coisas viram o MESMO 400 (`month_out_of_range`) porque, para quem
 * chamou, as duas sao "esse mes eu nao desenho".
 */
export function parseMesDoCalendario(
  valor: unknown,
): { ano: number; mes: number } | null {
  if (typeof valor !== "string") return null;
  const casou = MES_RE.exec(valor);
  if (!casou) return null;
  const ano = Number(casou[1]);
  const mes = Number(casou[2]);
  if (ano < 2000 || ano > 2100 || mes < 1 || mes > 12) return null;
  return { ano, mes };
}

/**
 * A grade de um mes, em semanas de domingo a sabado.
 *
 * A primeira semana comeca no domingo ANTERIOR ao dia 1 (ou nele, se o dia 1
 * for domingo), e a ultima termina no sabado seguinte ao ultimo dia. Os dias
 * de fora vem com `doMes: false`, para o client desenhar apagados em vez de
 * deixar buraco: buraco na grade desalinha a coluna do dia da semana.
 *
 * Mes invalido LANCA em vez de devolver grade vazia: uma grade errada desenha
 * um calendario plausivel e errado, e ninguem percebe olhando.
 */
export function gerarGradeDoMes(ano: number, mes: number): SemanaDaGrade[] {
  const { primeiro, ultimo } = limitesDoMes(ano, mes);

  const inicio = somarDiaCivil(primeiro, -diaDaSemana(primeiro));
  const fim = somarDiaCivil(ultimo, 6 - diaDaSemana(ultimo));

  const semanas: SemanaDaGrade[] = [];
  let atual = inicio;
  while (atual <= fim) {
    const semana: SemanaDaGrade = [];
    for (let i = 0; i < 7; i += 1) {
      semana.push({ dia: atual, doMes: atual >= primeiro && atual <= ultimo });
      atual = somarDiaCivil(atual, 1);
    }
    semanas.push(semana);
  }
  return semanas;
}
