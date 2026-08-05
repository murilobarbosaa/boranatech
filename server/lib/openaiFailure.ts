/**
 * Classificacao da falha da OpenAI por CODIGO, nunca por texto de mensagem.
 *
 * MOTIVO. O 429 da OpenAI tem duas causas com o mesmo status HTTP e
 * comportamentos opostos:
 *
 *   - rate limit: transitorio, a tentativa seguinte pode passar;
 *   - cota/saldo esgotado: permanente ate alguem por dinheiro, e a tentativa
 *     seguinte e GARANTIDAMENTE inutil.
 *
 * Ate 2026-08-05 o codigo tratava as duas igual e retentava nos dois casos. No
 * incidente daquele dia (saldo zerado, corpo com type `insufficient_quota` e
 * code `credit_balance_exhausted`) cada analise gastou uma chamada e um backoff
 * a mais para colher exatamente o mesmo erro.
 *
 * REGRA DE CASAMENTO. Le `error.type` e `error.code` do corpo. Casar por texto
 * da mensagem seria a classe de defeito que este projeto persegue: a mensagem
 * da OpenAI nao e contrato, muda sem aviso, e um parser que sub-casa em
 * silencio falha PASSANDO.
 *
 * AUSENCIA DE CAMPO NAO E CLASSIFICACAO. Corpo ilegivel, corpo sem `error`, ou
 * um codigo que nao esta em nenhuma das duas listas viram `nao_classificado`,
 * que se comporta como transitorio (retenta) e DIZ que nao classificou, no
 * rotulo que vai para o log e para `ai_usage_logs.error_message`. O ramo
 * permanente e o unico que interrompe o retry, entao ele so pode ser alcancado
 * por afirmacao positiva: falha nao classificada virando permanente por
 * omissao seria o fallback plausivel-e-errado que o CLAUDE.md proibe (mesma
 * familia do `contarLinhas` devolvendo -1).
 *
 * As listas sao curtas de proposito e so contem o que foi OBSERVADO ou e
 * documentado. Um codigo novo da OpenAI cai em `nao_classificado`, mantem o
 * comportamento de hoje (retenta) e aparece nomeado no log, que e o sinal de
 * que a lista precisa crescer.
 */

// Saldo/cota esgotados: permanente dentro da vida de uma requisicao.
// `insufficient_quota` chega como `type`, `credit_balance_exhausted` como
// `code`; os dois foram lidos do corpo real do incidente de 2026-08-05.
const CODIGOS_DE_COTA = new Set([
  "insufficient_quota",
  "credit_balance_exhausted",
]);

// Transitorio confirmado. Fica separado de `nao_classificado` de proposito: os
// dois retentam, mas so este e uma AFIRMACAO sobre a causa.
const CODIGOS_TRANSITORIOS = new Set(["rate_limit_exceeded"]);

/**
 * CREDENCIAL: chave revogada, escopo insuficiente, conta desativada ou regiao
 * bloqueada. Classificado pelo STATUS HTTP (401 e 403), nao por codigo.
 *
 * Por que status aqui e codigo no resto: status HTTP e campo estrutural e
 * contratual, tao verificavel quanto `error.code`, e para estes dois casos ele
 * e MAIS confiavel que o corpo, porque um 401 pode vir sem corpo nenhum (e ai
 * o corpo nao classificaria nada). A regra que este arquivo persegue e "nao
 * casar por TEXTO LIVRE"; status nao e texto livre.
 *
 * Por que estado proprio e nao `cota` estendido: a reacao humana e outra. Cota
 * se resolve com dinheiro e o auto-recharge cobre sozinho; credencial exige
 * alguem entrar na conta. Colapsar os dois faria o alerta dizer "poe saldo"
 * num caso em que saldo nao e o problema.
 *
 * PRECEDENCIA: credencial e avaliada ANTES de cota, entao um 401 vence
 * qualquer `code` do corpo. Se a OpenAI algum dia mandar 401 com
 * `insufficient_quota` no corpo, a acao correta continua sendo olhar a
 * credencial: sem credencial valida, saldo nao resolve nada.
 *
 * RISCO ACEITO: um 403 de intermediario (proxy, WAF) por causa transitoria
 * seria classificado como permanente e perderia o retry. As chamadas vao
 * diretas para api.openai.com, sem intermediario nosso, entao o caso e remoto;
 * e o rotulo carrega o codigo, quando houver, para o diagnostico nao comecar
 * do zero se acontecer.
 */
const STATUS_DE_CREDENCIAL = new Set([401, 403]);

export type ClassificacaoOpenAi =
  | "cota"
  | "credencial"
  | "transitorio"
  | "nao_classificado";

export interface FalhaOpenAiClassificada {
  classificacao: ClassificacaoOpenAi;
  // Unico campo que decide retry. `cota` e `credencial` sao permanentes;
  // `transitorio` e `nao_classificado` retentam.
  permanente: boolean;
  type: string | null;
  code: string | null;
  // Forma curta para log e para ai_usage_logs.error_message, ex.:
  // "cota:credit_balance_exhausted", "credencial:invalid_api_key",
  // "transitorio:rate_limit_exceeded", "nao_classificado".
  rotulo: string;
}

function campoTexto(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

export function classificarFalhaOpenAi(
  httpStatus: number,
  corpo: string,
): FalhaOpenAiClassificada {
  let type: string | null = null;
  let code: string | null = null;

  try {
    const parsed = JSON.parse(corpo) as { error?: Record<string, unknown> };
    const erro = parsed?.error;
    if (erro && typeof erro === "object") {
      type = campoTexto(erro.type);
      code = campoTexto(erro.code);
    }
  } catch {
    // Corpo nao-JSON (HTML de proxy, texto cru, vazio). Nao classifica.
  }

  const naoClassificado: FalhaOpenAiClassificada = {
    classificacao: "nao_classificado",
    permanente: false,
    type,
    code,
    rotulo: "nao_classificado",
  };

  const marcado = (campo: string | null, lista: Set<string>) =>
    campo !== null && lista.has(campo);

  // ANTES de tudo, e independente do corpo: um 401/403 e afirmacao suficiente
  // por si so, e e o unico ramo que sobrevive a corpo vazio.
  if (STATUS_DE_CREDENCIAL.has(httpStatus)) {
    return {
      classificacao: "credencial",
      permanente: true,
      type,
      code,
      rotulo: code || type ? `credencial:${code ?? type}` : "credencial",
    };
  }

  if (!type && !code) return naoClassificado;

  if (marcado(type, CODIGOS_DE_COTA) || marcado(code, CODIGOS_DE_COTA)) {
    return {
      classificacao: "cota",
      permanente: true,
      type,
      code,
      rotulo: `cota:${code ?? type}`,
    };
  }

  if (
    marcado(type, CODIGOS_TRANSITORIOS) ||
    marcado(code, CODIGOS_TRANSITORIOS)
  ) {
    return {
      classificacao: "transitorio",
      permanente: false,
      type,
      code,
      rotulo: `transitorio:${code ?? type}`,
    };
  }

  // Campos presentes mas fora das duas listas: continua sem classificacao, e o
  // rotulo carrega o codigo para a lista poder crescer com base em evidencia.
  return { ...naoClassificado, rotulo: `nao_classificado:${code ?? type}` };
}

/**
 * Erro de resposta nao-ok da OpenAI, ja classificado. Substitui os
 * `new Error("OpenAI respondeu ...")` espalhados pelas ferramentas de IA: o
 * prefixo da mensagem e o mesmo de antes (o painel e as consultas historicas
 * continuam casando), com o rotulo da classificacao no meio.
 */
export class OpenAiFalhaError extends Error {
  readonly httpStatus: number;
  readonly classificacao: ClassificacaoOpenAi;
  readonly permanente: boolean;
  readonly openaiType: string | null;
  readonly openaiCode: string | null;

  constructor(
    httpStatus: number,
    corpo: string,
    falha: FalhaOpenAiClassificada,
  ) {
    super(
      `OpenAI respondeu ${httpStatus} [${falha.rotulo}]: ${corpo.slice(0, 300)}`,
    );
    this.name = "OpenAiFalhaError";
    this.httpStatus = httpStatus;
    this.classificacao = falha.classificacao;
    this.permanente = falha.permanente;
    this.openaiType = falha.type;
    this.openaiCode = falha.code;
  }
}

/**
 * Le o corpo da resposta nao-ok e devolve o erro classificado. Devolve em vez
 * de lancar para o chamador que tem classe de erro propria poder embrulhar
 * (passando este como `cause`) sem perder a classificacao.
 */
export async function erroDaRespostaOpenAi(response: {
  status: number;
  text: () => Promise<string>;
}): Promise<OpenAiFalhaError> {
  const corpo = await response.text().catch(() => "");
  return new OpenAiFalhaError(
    response.status,
    corpo,
    classificarFalhaOpenAi(response.status, corpo),
  );
}

// Profundidade do passeio pela cadeia de `cause`. Teto porque `cause` pode ser
// circular e um while(true) aqui derrubaria o processo no error path, que e o
// pior lugar possivel para um loop infinito.
const MAX_PROFUNDIDADE_CAUSE = 5;

/**
 * Acha o `OpenAiFalhaError` no erro ou na cadeia de `cause`. E o que permite
 * classificar sem exigir que cada rota saiba do assunto: quem embrulha so
 * precisa passar `cause`.
 */
export function falhaOpenAiNaCadeia(err: unknown): OpenAiFalhaError | null {
  let atual: unknown = err;
  for (let i = 0; i < MAX_PROFUNDIDADE_CAUSE; i += 1) {
    if (atual instanceof OpenAiFalhaError) return atual;
    if (!(atual instanceof Error)) return null;
    atual = atual.cause;
  }
  return null;
}

/**
 * Predicado do retry: a tentativa seguinte e garantidamente inutil?
 *
 * Verdadeiro SO para as duas classificacoes afirmadas como permanentes (`cota`
 * e `credencial`). `transitorio` e `nao_classificado` continuam retentando,
 * exatamente como antes de qualquer uma destas mudancas.
 *
 * O nome nao diz "cota" de proposito. A versao anterior se chamava
 * `isCotaEsgotada` e ja perguntava `permanente`, entao acrescentar um segundo
 * estado permanente teria feito o nome mentir sem nada quebrar, que e a forma
 * mais barata de um predicado passar a responder outra pergunta em silencio.
 */
export function isFalhaPermanente(err: unknown): boolean {
  return falhaOpenAiNaCadeia(err)?.permanente === true;
}
