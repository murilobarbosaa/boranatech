/**
 * DATAS DO ASAAS: leitura do carimbo do provedor para um instante UTC.
 *
 * O Asaas manda data em duas formas, e as duas foram MEDIDAS, nao supostas:
 *
 *   `dateCreated` do EVENTO   "2026-09-01 10:11:33"   19 chars, sem offset
 *   `paymentDate` e irmaos    "2026-09-01"            so a data
 *
 * As duas sem fuso nenhum. O Asaas opera em Brasilia, e o Brasil aboliu o
 * horario de verao em 2019, entao `-03:00` vale o ano inteiro e nao precisa de
 * tabela de fuso.
 *
 * O DEFEITO QUE ISTO EXISTE PARA NAO REPETIR, medido em producao em 2026-09-01:
 * o webhook gravou `event_created_at = 2026-09-01 10:11:33+00` para um evento
 * cujo `dateCreated` era `"2026-09-01 10:11:33"` em Brasilia. Tres horas de
 * erro, e a linha parece perfeitamente normal. String sem offset NUNCA pode
 * entrar crua em `new Date()`: no servidor ela vira o fuso do processo, e no
 * navegador o Chrome le como hora local e o Safari devolve `Invalid Date`.
 *
 * DUAS FUNCOES, E A SEPARACAO E O PONTO. `instanteAsaas` responde "que instante
 * foi este", e so aceita a forma que TEM hora. `diaAsaas` responde "que dia
 * civil foi este", e so aceita a forma que NAO tem hora. Uma data sem hora NAO
 * vira instante aqui, de proposito: `paymentDate` = "2026-09-01" nao diz se o
 * dinheiro entrou as 00:05 ou as 23:55, e escolher um dos dois produziria um
 * `occurred_at` plausivel e falso, que e a pior classe de erro nesta base.
 *
 * NAO CONFUNDIR com `parseAsaasDate` (client/src/lib/pixExpiration.ts), que
 * responde a uma terceira pergunta, "ate quando isto vale", e por isso trata
 * data-sem-hora como o FIM daquele dia. Aquela regra e correta para PRAZO e
 * errada para instante de caixa. Aquele modulo delega o caso sem offset para
 * `instanteAsaas` e mantem localmente a regra de dia-sem-hora.
 */

/** Fuso do Asaas, fixo. Sem horario de verao no Brasil desde 2019. */
const OFFSET_ASAAS = "-03:00";

/** `YYYY-MM-DD HH:MM:SS`, com espaco ou `T`, e SEM offset. */
const DATA_HORA_SEM_OFFSET =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/;

/** `YYYY-MM-DD`, so a data. */
const SO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * O dia existe no calendario?
 *
 * MEDIDO, e e o motivo de esta funcao existir: `new Date` REJEITA mes 13
 * (`Invalid Date`) e ACEITA dia 30 de fevereiro, rolando para 2 de marco. Ou
 * seja, confiar so no `Date` transforma um carimbo impossivel num instante
 * plausivel dois dias adiante, sem nenhum sinal. Aritmetica pura, sem fuso: o
 * `Date.UTC` normaliza, e a comparacao dos componentes pega a normalizacao.
 */
function diaExiste(ano: number, mes: number, dia: number): boolean {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    d.getUTCFullYear() === ano &&
    d.getUTCMonth() === mes - 1 &&
    d.getUTCDate() === dia
  );
}

function textoLimpo(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  return texto === "" ? null : texto;
}

/**
 * Instante ISO em UTC a partir de `YYYY-MM-DD HH:MM:SS` do Asaas.
 *
 * `null` para QUALQUER outra forma, inclusive data sem hora e string que ja
 * traga offset. Fail-closed: quem chama decide o fallback, e o fallback fica
 * visivel no call site em vez de escondido aqui.
 */
export function instanteAsaas(valor: unknown): string | null {
  const texto = textoLimpo(valor);
  if (!texto) return null;

  const m = DATA_HORA_SEM_OFFSET.exec(texto);
  if (!m) return null;

  const [, ano, mes, dia, hora, min, seg] = m;
  if (!diaExiste(Number(ano), Number(mes), Number(dia))) return null;
  // 24:00:00 e 23:59:60 sao legais em algumas normas e nao sao o que o Asaas
  // manda; aceita-los produziria um instante deslocado em silencio.
  if (Number(hora) > 23 || Number(min) > 59 || Number(seg) > 59) return null;

  const d = new Date(`${ano}-${mes}-${dia}T${hora}:${min}:${seg}${OFFSET_ASAAS}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Dia civil `YYYY-MM-DD` validado, devolvido como o MESMO texto.
 *
 * Nao devolve `Date` de proposito: um dia civil nao e um instante, e converter
 * aqui obrigaria esta funcao a escolher uma hora, que e exatamente a escolha
 * que ela existe para nao fazer.
 */
export function diaAsaas(valor: unknown): string | null {
  const texto = textoLimpo(valor);
  if (!texto) return null;

  const m = SO_DATA.exec(texto);
  if (!m) return null;

  const [, ano, mes, dia] = m;
  return diaExiste(Number(ano), Number(mes), Number(dia)) ? texto : null;
}
