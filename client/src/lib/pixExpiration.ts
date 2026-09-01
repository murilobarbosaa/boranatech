/**
 * PRAZO DA COBRANCA PIX: leitura da data do provedor e formatacao do restante.
 *
 * Duas funcoes puras, separadas do componente pelo mesmo motivo do
 * `pixPolling.ts`: as duas maneiras de errar aqui sao invisiveis na tela. Um
 * fuso lido errado mostra um prazo plausivel e falso, e um contador que nao
 * zera deixa a pessoa esperando por uma cobranca que ja morreu.
 */

/** Fuso do Asaas, fixo. Ver `parseAsaasDate`. */
const OFFSET_ASAAS = "-03:00";

const SEM_OFFSET = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/;
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
 */
export function parseAsaasDate(bruto: string | null | undefined): Date | null {
  if (!bruto) return null;
  const texto = bruto.trim();
  if (!texto) return null;

  if (TEM_OFFSET.test(texto)) {
    const d = new Date(texto);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const m = SEM_OFFSET.exec(texto);
  if (!m) return null;

  const [, ano, mes, dia, hora, min, seg] = m;
  const d = new Date(
    `${ano}-${mes}-${dia}T${hora}:${min}:${seg}${OFFSET_ASAAS}`,
  );
  return Number.isNaN(d.getTime()) ? null : d;
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
