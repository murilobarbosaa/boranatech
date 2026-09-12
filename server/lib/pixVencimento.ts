/**
 * VENCIMENTO DA COBRANCA PIX, em Brasilia: leitura da data, relogio e texto.
 *
 * O `dueDate` do Asaas e so a data (`YYYY-MM-DD`), e `new Date("2026-09-10")`
 * e meia-noite UTC: formatado num processo em Brasilia vira dia 9, e a virada
 * de ano vira 31 de dezembro do ano anterior. O dia exibido passaria a depender
 * do fuso de quem roda, que e a classe de defeito que o `vitest.config.ts` fixa
 * o fuso para pegar.
 *
 * Por isso tudo aqui usa o offset fixo do Asaas, o mesmo `-03:00` de
 * `client/src/lib/pixExpiration.ts`, e nunca o fuso do processo. O Brasil
 * aboliu o horario de verao em 2019, entao `-03:00` e `America/Sao_Paulo` sao a
 * mesma coisa o ano inteiro.
 *
 * UM MODULO SO para as tres perguntas (a data e valida, que dia e agora em
 * Brasilia, como escrever a data) porque as tres dependem do mesmo offset, e
 * duas copias dele divergiriam na primeira correcao aplicada so numa.
 */

const OFFSET_ASAAS = "-03:00";
const OFFSET_ASAAS_MS = 3 * 60 * 60 * 1000;
const SO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

function doisDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * A data do Pix na forma canonica `YYYY-MM-DD`, ou `null` quando nao e uma data
 * de calendario real. Aceita `unknown` porque o valor chega de fora: coluna do
 * banco, resposta do Asaas, job desserializado da fila.
 */
export function normalizarDataPix(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const partes = SO_DATA.exec(valor.trim());
  if (!partes) return null;
  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);

  // Data de calendario real: `Date.UTC` rola 30 de fevereiro para marco sem
  // reclamar, entao a checagem compara o que voltou com o que entrou.
  const calendario = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    calendario.getUTCFullYear() !== ano ||
    calendario.getUTCMonth() !== mes - 1 ||
    calendario.getUTCDate() !== dia
  ) {
    return null;
  }
  return `${partes[1]}-${partes[2]}-${partes[3]}`;
}

/**
 * Que dia e (`YYYY-MM-DD`) e quantos minutos se passaram desde a meia-noite,
 * em Brasilia, para um instante. Aritmetica pura sobre o offset fixo: nao
 * consulta o fuso do processo nem o ICU.
 */
export function relogioDeBrasilia(instanteMs: number): {
  dia: string;
  minutos: number;
} {
  const deslocado = new Date(instanteMs - OFFSET_ASAAS_MS);
  return {
    dia: `${deslocado.getUTCFullYear()}-${doisDigitos(deslocado.getUTCMonth() + 1)}-${doisDigitos(deslocado.getUTCDate())}`,
    minutos: deslocado.getUTCHours() * 60 + deslocado.getUTCMinutes(),
  };
}

/**
 * O vencimento por extenso, para o corpo de e-mail.
 *
 * ENTRADA INVALIDA DEVOLVE `null`, e o chamador decide o que escrever. Nunca
 * sai "Invalid Date": esse texto no corpo de um e-mail de cobranca e pior que
 * nenhuma data.
 */
export function formatarVencimentoPix(dueDate: string): string | null {
  const data = normalizarDataPix(dueDate);
  if (!data) return null;

  // Meio-dia em Brasilia: tres horas de folga para cada lado antes de o dia
  // mudar, se algum dia o fuso de formatacao divergir do offset.
  const instante = new Date(`${data}T12:00:00${OFFSET_ASAAS}`);
  if (Number.isNaN(instante.getTime())) return null;

  return instante.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
