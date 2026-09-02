/**
 * PRAZO DA COBRANCA PIX: leitura da data do provedor e formatacao do restante.
 *
 * Duas funcoes puras, separadas do componente pelo mesmo motivo do
 * `pixPolling.ts`: as duas maneiras de errar aqui sao invisiveis na tela. Um
 * fuso lido errado mostra um prazo plausivel e falso, e um contador que nao
 * zera deixa a pessoa esperando por uma cobranca que ja morreu.
 */

import { instanteAsaas } from "@shared/asaasDatetime";

/** Fuso do Asaas, fixo. Ver `parseAsaasDate`. */
const OFFSET_ASAAS = "-03:00";

const SO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const TEM_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Data do Asaas para `Date`, ou `null` quando nao da para saber.
 *
 * O FORMATO FOI MEDIDO, nao suposto: em 2026-09-01,
 * `GET /payments/{id}/pixQrCode` devolveu `expirationDate` como
 * `"2027-09-03 23:59:59"`, com 19 caracteres, espaco no lugar do `T` e SEM
 * offset nenhum.
 *
 * String sem offset NUNCA pode entrar crua em `new Date()`. Os dois motores
 * discordam e os dois estao errados para nos: o Chrome interpreta como hora
 * local do NAVEGADOR (que sera Lisboa ou Nova York para parte dos usuarios) e o
 * Safari devolve `Invalid Date`. O mesmo codigo mostraria prazos diferentes na
 * mesma cobranca dependendo de onde a pessoa esta.
 *
 * Por isso o parse e manual e o offset entra explicito: o Asaas opera em
 * Brasilia, e o Brasil aboliu o horario de verao em 2019, entao `-03:00` vale o
 * ano inteiro e nao precisa de tabela de fuso.
 *
 * String COM offset (`Z`, `+00:00`, `-0300`) e sem ambiguidade e passa direto.
 * String SO COM A DATA (`YYYY-MM-DD`, a forma do `dueDate`) vira o fim daquele
 * dia em Brasilia; o porque esta no corpo.
 *
 * O CASO SEM OFFSET DELEGA para `instanteAsaas` (shared/asaasDatetime.ts), que
 * e a mesma leitura usada pelo servidor para gravar `occurred_at` das cobrancas
 * Asaas. Duas montagens da mesma conversao de fuso divergiriam na primeira
 * correcao aplicada so numa delas, e o erro nao apareceria em nenhuma tela. A
 * regra de dia-sem-hora fica AQUI, e nao la, porque ela responde a outra
 * pergunta: "ate quando isto vale" admite o fim do dia, "que instante foi este"
 * nao admite chute nenhum.
 */
export function parseAsaasDate(bruto: string | null | undefined): Date | null {
  if (!bruto) return null;
  const texto = bruto.trim();
  if (!texto) return null;

  if (TEM_OFFSET.test(texto)) {
    const d = new Date(texto);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const instante = instanteAsaas(texto);
  if (instante) return new Date(instante);

  // SO A DATA, sem hora: e a forma do `dueDate` das cobrancas (`YYYY-MM-DD`).
  // Vira o FIM daquele dia em Brasilia, e a escolha e conservadora de proposito:
  // o Asaas so vira a cobranca para OVERDUE na madrugada seguinte, entao tratar
  // o dia como valido ate 23:59:59 nunca declara vencido algo que ainda pode ser
  // pago. O oposto (assumir 00:00) tiraria um dia inteiro de prazo de quem pagou
  // no dia certo, que e o erro caro.
  const d0 = SO_DATA.exec(texto);
  if (d0) {
    const [, ano, mes, dia] = d0;
    const d = new Date(`${ano}-${mes}-${dia}T23:59:59${OFFSET_ASAAS}`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * O prazo que vale, entre varios candidatos: o MENOR dos que existem.
 *
 * A cobranca Pix tem dois prazos e eles nao coincidem. Medido em 2026-09-01:
 * `dueDate` 2026-09-03 e `expirationDate` do QR 2027-09-03, um ano de diferenca.
 * Quem governa e o vencimento da cobranca, porque passado ele o Asaas emite
 * PAYMENT_OVERDUE e a linha pendente fecha; o QR continuar tecnicamente valido
 * nao ajuda ninguem, porque o pagamento ja nao ativa nada.
 *
 * Pegar o menor em vez de escolher um resolve os dois lados: se algum dia o
 * prazo do QR for o mais curto, ele passa a mandar sem precisar de mudanca. Nulo
 * e ignorado, nao tratado como zero, senao um campo ausente venceria tudo.
 */
export function earliestDeadline(candidatos: Array<Date | null>): Date | null {
  const validos = candidatos.filter((d): d is Date => d !== null);
  if (validos.length === 0) return null;
  return validos.reduce((menor, d) => (d < menor ? d : menor));
}

export type PixRemaining =
  | { kind: "unknown" }
  | { kind: "expired" }
  /** Falta mais de uma hora: prazo absoluto, sem contador de segundos. */
  | { kind: "far"; hours: number; absolute: string }
  /** Falta menos de uma hora: contagem regressiva. */
  | { kind: "near"; clock: string };

const UMA_HORA_MS = 60 * 60 * 1000;

function doisDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * O que mostrar sobre o tempo que resta.
 *
 * A FRONTEIRA DE UMA HORA existe porque as duas metades respondem a perguntas
 * diferentes. Faltando dias, "23:59:59" nao ajuda ninguem e o que importa e o
 * dia; faltando minutos, o dia nao ajuda e o que importa e o relogio. Trocar as
 * duas de lugar produz uma tela tecnicamente correta e inutil.
 *
 * `unknown` NAO e o mesmo que `expired`, e a diferenca e o ponto: sem data, a
 * tela omite o prazo em vez de afirmar que a cobranca morreu. Dizer "expirou"
 * sobre uma cobranca viva e a pior mentira que este componente pode contar.
 *
 * `hours` arredonda para CIMA porque o texto e "vence em X horas": faltando 90
 * minutos, "vence em 1 hora" ja passou do prazo quando a pessoa terminar de ler.
 */
export function formatPixRemaining(
  expiraEm: Date | null,
  agora: Date,
): PixRemaining {
  if (!expiraEm) return { kind: "unknown" };

  const restanteMs = expiraEm.getTime() - agora.getTime();
  if (restanteMs <= 0) return { kind: "expired" };

  if (restanteMs > UMA_HORA_MS) {
    return {
      kind: "far",
      hours: Math.ceil(restanteMs / UMA_HORA_MS),
      absolute: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      }).format(expiraEm),
    };
  }

  const totalSeg = Math.floor(restanteMs / 1000);
  return {
    kind: "near",
    clock: `${doisDigitos(Math.floor(totalSeg / 60))}:${doisDigitos(totalSeg % 60)}`,
  };
}
