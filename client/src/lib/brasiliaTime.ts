// Conversão entre o wall-clock de Brasília (o que o admin digita/lê num
// <input type="datetime-local">) e o instante UTC gravado no banco. O input
// nativo trabalha no fuso do NAVEGADOR; sem esta conversão, um admin fora do
// horário de Brasília gravaria/leria o agendamento deslocado, apesar do rótulo
// "horário de Brasília". Usa a IANA America/Sao_Paulo via Intl (sem lib nova),
// então continua correto se o Brasil reinstituir horário de verão: não é um
// offset fixo de -03:00 embutido no código.

const BRASILIA_TZ = "America/Sao_Paulo";

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: BRASILIA_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// Offset (ms) do fuso de Brasília no instante `date`, tal que
// utc + offset = wall-clock local. Brasília hoje é -3h (offset -10_800_000).
function brasiliaOffsetMs(date: Date): number {
  const map: Record<string, number> = {};
  for (const part of partsFmt.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour,
    map.minute,
    map.second,
  );
  return asUtc - date.getTime();
}

// "YYYY-MM-DDTHH:mm" (wall-clock de Brasília) -> ISO UTC. Retorna null para
// entrada vazia/inválida (o chamador decide a mensagem de erro). Não usa
// `new Date(local)`, que interpretaria a string no fuso da MÁQUINA: os campos
// são parseados à mão e ancorados em Brasília, então o resultado independe do
// fuso do navegador.
export function brasiliaLocalToIso(local: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  // Chute: trata o wall-clock como se fosse UTC, mede o offset de Brasília
  // nesse instante e corrige. Reamostrar no instante corrigido acerta a borda
  // num eventual horário de verão (hoje o offset é constante, uma passada basta).
  const guessUtc = Date.UTC(y, mo - 1, d, h, mi);
  let utc = guessUtc - brasiliaOffsetMs(new Date(guessUtc));
  utc = guessUtc - brasiliaOffsetMs(new Date(utc));
  const result = new Date(utc);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

// ISO UTC -> "YYYY-MM-DDTHH:mm" no wall-clock de Brasília (pro `value` do
// datetime-local). Retorna "" para entrada inválida.
export function isoToBrasiliaLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const map: Record<string, string> = {};
  for (const part of partsFmt.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

const humanFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BRASILIA_TZ,
  dateStyle: "short",
  timeStyle: "short",
});

// Instante ISO formatado no horário de Brasília, pro preview "Sai em ..." (não
// depende do fuso do navegador, ao contrário do dateTimeFmt local do manager).
export function formatBrasiliaDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return humanFmt.format(date);
}
