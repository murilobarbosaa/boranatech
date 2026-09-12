/**
 * VENCIMENTO DA COBRANCA PIX, por extenso, para o corpo de e-mail.
 *
 * O `dueDate` do Asaas e so a data (`YYYY-MM-DD`), e `new Date("2026-09-10")`
 * e meia-noite UTC: formatado num processo em Brasilia vira dia 9, e a virada
 * de ano vira 31 de dezembro do ano anterior. O dia exibido passaria a depender
 * do fuso de quem roda, que e a classe de defeito que o `vitest.config.ts` fixa
 * o fuso para pegar.
 *
 * Por isso a data e lida com o offset fixo do Asaas, o mesmo `-03:00` de
 * `client/src/lib/pixExpiration.ts`, e formatada no fuso de Brasilia, nunca no
 * do processo. O Brasil aboliu o horario de verao em 2019, entao `-03:00` e
 * `America/Sao_Paulo` sao a mesma coisa o ano inteiro.
 *
 * ENTRADA INVALIDA DEVOLVE `null`, e o chamador decide o que escrever. Nunca
 * sai "Invalid Date": esse texto no corpo de um e-mail de cobranca e pior que
 * nenhuma data.
 */

const OFFSET_ASAAS = "-03:00";
const SO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatarVencimentoPix(dueDate: string): string | null {
  // O tipo diz string, mas o valor chega de um job da fila, desserializado.
  if (typeof dueDate !== "string") return null;
  const partes = SO_DATA.exec(dueDate.trim());
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

  // Meio-dia em Brasilia: tres horas de folga para cada lado antes de o dia
  // mudar, se algum dia o fuso de formatacao divergir do offset.
  const instante = new Date(
    `${partes[1]}-${partes[2]}-${partes[3]}T12:00:00${OFFSET_ASAAS}`,
  );
  if (Number.isNaN(instante.getTime())) return null;

  return instante.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
