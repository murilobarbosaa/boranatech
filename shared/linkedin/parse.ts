/**
 * Parser do texto extraído do PDF de perfil do LinkedIn.
 *
 * Função pura, sem IO. Tolera ausência de qualquer seção. Detecta cabeçalhos
 * em português e inglês. Nunca inventa conteúdo: campo não detectado vira
 * null ou array vazio. Quando nada de útil é extraído, usable fica false e a
 * rota transforma isso num 422 pedindo pra colar o texto manualmente.
 *
 * O layout do "Salvar como PDF" do LinkedIn costuma trazer a coluna lateral
 * (Contato, Principais competências, Idiomas, Certificações) antes do nome e
 * da headline, que aparecem logo antes da seção Resumo. A detecção de headline
 * é best-effort: prefere null a devolver lixo (o nome da pessoa, um e-mail).
 */

import { normalizeProfileLinesComSinal } from "./normalizeProfileText";
import {
  isLinkedinSectionHeading,
  linkedinSectionHeading,
  normalizeLinkedinSectionLabel,
  type LinkedinSectionId,
} from "./sectionHeadings";
import { normalizarHeadlineManual } from "./schema";

export interface LinkedinExperiencia {
  /** Só o cargo. A empresa nunca vem colada aqui. */
  titulo: string;
  /**
   * Empresa do cargo. No formato agrupado o export escreve a empresa uma vez
   * só, no topo do grupo, e ela é propagada para todos os cargos aninhados.
   * Só fica null quando o próprio PDF não traz empresa nenhuma antes da
   * primeira data.
   */
  empresa: string | null;
  descricao: string;
}

export type HeadlineRegion =
  | {
      status: "confirmed";
      /** Offsets no texto bruto; `end` é exclusivo. */
      start: number;
      end: number;
      text: string;
    }
  | { status: "ambiguous" }
  | { status: "not_found" };

export interface LinkedinParsed {
  headline: string | null;
  /** Segurança estrutural da região que poderia ser substituída manualmente. */
  headlineRegion?: HeadlineRegion;
  sobre: string | null;
  experiencias: LinkedinExperiencia[];
  /** Competências lidas da seção do PDF (sinal extra, não é o form). */
  skillsPdf: string[];
  /**
   * O parser conseguiu provar a fronteira da seção de competências?
   * `false` impede prefill automático e pede revisão; ausente em objetos
   * históricos/manuais equivale ao comportamento anterior.
   */
  skillsPdfConfiaveis?: boolean;
  /**
   * Linhas das seções Formação e Certificações, cruas.
   *
   * Não entram em check nenhum e não tocam a nota: existem para a recomendação
   * de cursos poder deduplicar contra o que a pessoa já tem. Recomendar CS50 de
   * Harvard para quem tem Harvard na formação é o caso que motivou.
   */
  formacao: string[];
  certificacoes: string[];
  /**
   * Contexto da headline, para diagnosticar truncamento depois do fato.
   *
   * `null` quando não houve nem candidata. Campo NOVO: leitor precisa tolerar
   * ausência, porque as linhas já gravadas não o têm.
   */
  headlineContexto?: LinkedinHeadlineContexto | null;
  /** Falso quando o texto não tem nada de aproveitável. Vira 422 na rota. */
  usable: boolean;
}

type ParsedSectionKey =
  | "contato"
  | "sobre"
  | "experiencia"
  | "formacao"
  | "skills"
  | "idiomas"
  | "certificacoes";

interface SectionHeaderHit {
  index: number;
  key: LinkedinSectionId;
  principal: boolean;
}

function stripAccentsLower(value: string): string {
  return normalizeLinkedinSectionLabel(value);
}

function matchSectionHeader(line: string): LinkedinSectionId | null {
  return linkedinSectionHeading(line)?.id ?? null;
}

// Dashes (hífen ASCII e variantes Unicode) sem usar o caractere literal,
// que é proibido em strings do projeto.
const DASH = "[\\u2010-\\u2015-]";

const MONTHS_RE =
  "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)";

const YEAR_RE = /\b(?:19|20)\d{2}\b/;
const SEP_RE = new RegExp(`(?:${DASH}|\\bto\\b|\\bate\\b)`);
const END_RE = /(?:present|presente|atual|momento|\b(?:19|20)\d{2}\b)/;
const MONTH_PRESENT_RE = new RegExp(`${MONTHS_RE}`, "i");

/** A linha é um intervalo de datas (delimita uma experiência)? */
function isDateRangeLine(line: string): boolean {
  const l = stripAccentsLower(line);
  if (l.length > 80) return false;
  const hasStart = YEAR_RE.test(l) || MONTH_PRESENT_RE.test(l);
  if (!hasStart) return false;
  if (!SEP_RE.test(l)) return false;
  return END_RE.test(l);
}

/**
 * Marcador de bullet. Escrito com escape unicode pelo mesmo motivo de DASH:
 * caractere de travessão literal é proibido no projeto.
 */
const BULLET_RE = new RegExp(
  `^(?:[\\u2022\\u00b7\\u25aa\\u25e6\\u25cf*+]|${DASH})\\s+`,
);

const UNIDADE_DURACAO = "(?:anos?|meses|mes|years?|yrs?|months?|mos?)";
const DURACAO_RE = new RegExp(
  `^\\d+\\s+${UNIDADE_DURACAO}(?:\\s+\\d+\\s+${UNIDADE_DURACAO})*$`,
);

/**
 * A linha é só uma duração ("3 anos", "1 year 1 month", "(4 months)")?
 *
 * É o que distingue o bloco AGRUPADO do simples: quando uma empresa tem vários
 * cargos, o export coloca a duração total do grupo entre a empresa e o primeiro
 * cargo, e ela não é um intervalo de datas (não tem ano nem nome de mês), então
 * `isDateRangeLine` não a enxerga. Sem reconhecê-la aqui, ela fica órfã e cai na
 * descrição da experiência anterior, levando a empresa junto.
 */
function ehLinhaDeDuracao(linha: string): boolean {
  const limpo = linha.trim().replace(/^\(/, "").replace(/\)$/, "").trim();
  return DURACAO_RE.test(stripAccentsLower(limpo));
}

const MODALIDADE_RE = /^(?:remote|remoto|hibrido|hybrid|on-?site|presencial)\b/;

// Caixa da primeira letra sem `\p{Lu}`: o target do tsconfig não aceita a flag
// `u`, e comparar com toLocaleUpperCase cobre acentuada do mesmo jeito. Dígito
// e pontuação não são nem uma coisa nem outra.
function comecaMaiuscula(valor: string): boolean {
  const c = valor.charAt(0);
  return c !== "" && c === c.toLocaleUpperCase() && c !== c.toLocaleLowerCase();
}

function comecaMinuscula(valor: string): boolean {
  const c = valor.charAt(0);
  return c !== "" && c === c.toLocaleLowerCase() && c !== c.toLocaleUpperCase();
}

/**
 * A linha é uma localização de trabalho?
 *
 * Substitui a heurística de comprimento (`< 18`), que era uma regra de tamanho
 * fazendo trabalho de regra de forma: pulava "Brazil" e "São Paulo, Brazil" mas
 * deixava "Campinas, São Paulo, Brazil" (27 caracteres) entrar na descrição.
 *
 * A forma de uma localização é: poucas palavras, no máximo quatro partes
 * separadas por vírgula, cada parte começando em maiúscula, sem pontuação de
 * fim de frase e sem marcador de bullet. Uma frase de descrição que comece com
 * nome de cidade não passa, porque tem mais de sete palavras ou termina em
 * ponto. Só é consultada na posição logo após a data, onde o export põe a
 * localização, nunca no meio do texto.
 */
function ehLinhaDeLocalizacao(linha: string): boolean {
  const t = linha.trim();
  if (t.length === 0 || t.length > 60) return false;
  if (BULLET_RE.test(t)) return false;
  if (/[.;:]$/.test(t)) return false;
  if (isDateRangeLine(t)) return false;
  if (ehLinhaDeDuracao(t)) return false;
  if (matchSectionHeader(t)) return false;
  if (t.split(/\s+/).length > 7) return false;
  if (MODALIDADE_RE.test(stripAccentsLower(t))) return true;
  const partes = t
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (partes.length === 0 || partes.length > 4) return false;
  return partes.every((p) => comecaMaiuscula(p) && p.split(/\s+/).length <= 4);
}

/**
 * A linha pode ser empresa ou cargo (cabeçalho de bloco de experiência)?
 *
 * O que ela precisa REJEITAR é o que produziu dois dos bugs: bullet de
 * descrição (o último bullet de um cargo virava parte do título do cargo
 * seguinte) e linha de duração órfã (a duração do grupo virava parte do
 * título). Frase de descrição também não passa: termina em pontuação, ou é
 * longa, ou começa em minúscula.
 */
function ehLinhaDeCabecalho(linha: string): boolean {
  const t = linha.trim();
  if (t.length === 0 || t.length > 80) return false;
  if (BULLET_RE.test(t)) return false;
  if (/[.;:,]$/.test(t)) return false;
  if (isDateRangeLine(t)) return false;
  if (ehLinhaDeDuracao(t)) return false;
  if (matchSectionHeader(t)) return false;
  if (t.split(/\s+/).length > 12) return false;
  if (comecaMinuscula(t)) return false;
  return true;
}

const EMAIL_RE = /\S+@\S+\.\S+/;
const URL_RE = /(https?:\/\/|www\.|linkedin\.com|github\.com)/i;
const PHONE_RE = /^[\s()+\d.-]{7,}$/;

const HEADLINE_SIGNAL_RE = new RegExp(
  [
    "developer",
    "desenvolvedor",
    "engineer",
    "engenheiro",
    "analyst",
    "analista",
    "designer",
    "student",
    "estudante",
    "programador",
    "programmer",
    "scientist",
    "cientista",
    "fullstack",
    "full-stack",
    "frontend",
    "front-end",
    "backend",
    "back-end",
    "devops",
    "data",
    "dados",
    "product",
    "produto",
    "mobile",
    "cloud",
    "security",
    "seguranca",
    "qa",
    "sre",
    "dba",
    "buscando",
    "oportunidade",
    "apaixonad",
    "aprendiz",
    "transicao",
    "aspirante",
    "recolocacao",
    "open to",
    "em busca",
  ].join("|"),
  "i",
);

function isHeadlineCandidate(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 6 || trimmed.length > 250) return false;
  if (matchSectionHeader(trimmed)) return false;
  if (EMAIL_RE.test(trimmed)) return false;
  if (URL_RE.test(trimmed)) return false;
  if (PHONE_RE.test(trimmed)) return false;
  if (isDateRangeLine(trimmed)) return false;
  return true;
}

/**
 * Sinal real de headline: barra de cargo, palavra de papel ou clichê de
 * perfil. Comprimento sozinho NÃO conta: uma linha longa qualquer (nome
 * composto, texto de corpo, lixo de PDF) não vira headline. Assim a headline
 * escolhida é sempre uma linha com cara de headline, não a última linha longa.
 */
function hasHeadlineSignal(line: string): boolean {
  if (line.includes("|")) return true;
  return HEADLINE_SIGNAL_RE.test(stripAccentsLower(line));
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max).trim();
}

/**
 * A linha ficou ABERTA em vírgula, ou seja, o item seguinte foi quebrado.
 *
 * É o irmão do separador órfão da Fase 1A, na direção oposta: lá a linha
 * terminava em `|` e a cauda vinha curta na linha de baixo; aqui a headline
 * termina em `,` no meio da enumeração de stack e a continuação começa em
 * MAIÚSCULA (`... NestJS, TypeScript ,` + `PostgreSQL | SaaS B2B & B2C`), então
 * a regra 4 de `normalizeProfileText` (que só junta quando a seguinte começa em
 * minúscula) não junta, e as duas linhas viram candidatas independentes.
 *
 * A vírgula continua FORA de `ENDS_ORPHAN_SEPARATOR` no normalizador, e isso é
 * deliberado: lá a regra vale para o texto inteiro, e vírgula é pontuação
 * normal de prosa (o comentário do módulo documenta o estrago de tratá-la como
 * separador estrutural). Aqui o escopo é só o preâmbulo e só entre candidatas
 * fortes, onde vírgula no fim da linha não é prosa, é enumeração cortada.
 */
const HEADLINE_ABERTA_EM_VIRGULA = /,$/;

interface HeadlineLineRegion {
  inicio: number;
  fim: number;
  partes: string[];
  aberta: boolean;
}

interface DetectedHeadline {
  valor: string | null;
  indice: number;
  intervalo: { inicio: number; fim: number } | null;
  status: HeadlineRegion["status"];
  contexto: LinkedinHeadlineContexto | null;
}

/**
 * Bloco inicial de nome/headline/localização do perfil.
 *
 * Os índices são das linhas normalizadas e `end` é exclusivo. Uma candidata
 * só autoriza `confirmed` e substituição no texto bruto quando estiver dentro
 * de uma região cuja identidade foi provada por estrutura, não por semântica
 * de cargo nem pela mera existência de uma seção posterior.
 */
interface IdentityRegion {
  start: number;
  end: number;
  confidence: "confirmed" | "ambiguous";
}

/**
 * Headline detectada e ONDE ela começa.
 *
 * O índice existe por causa do bloco de identidade: no export real, o nome, a
 * headline e a localização ficam entre a última seção da coluna lateral e a
 * primeira seção principal, sem cabeçalho nenhum separando. Sem saber onde a
 * headline começa, a seção lateral anterior engole os três.
 *
 * A headline pode OCUPAR MAIS DE UMA LINHA. Escolher uma só era o bug medido em
 * produção: com a headline quebrada em duas, a última candidata vencia e o
 * cargo-alvo mais metade da stack ficavam de fora (`PostgreSQL | SaaS B2B &
 * B2C` no lugar de `Desenvolvedor Full Stack | React, ... | SaaS B2B & B2C`).
 * O dano era duplo, porque `indice` alimenta `inicioDaIdentidade`: apontando
 * para a segunda linha, o corte da seção lateral caía tarde demais e o NOME da
 * pessoa mais o primeiro pedaço da headline vazavam para `skillsPdf`.
 *
 * A extensão exige abertura explícita por vírgula/pipe e continuação curta
 * coerente; localização, empresa, cabeçalho e outra candidata independente não
 * são absorvidos. Se a fronteira não puder ser provada, a região fica ambígua
 * e deixa de autorizar splice.
 */
/**
 * Como a linha ACIMA da headline terminou. Só a classe, nunca o conteúdo.
 *
 * O preâmbulo do export tem o NOME da pessoa logo antes da headline, e guardar
 * a linha de cima crua passaria a persistir nome onde hoje não se persiste. A
 * classe responde a pergunta do diagnóstico (houve quebra? em quê?) sem o dado.
 */
export type HeadlineTerminacaoAcima = "virgula" | "pipe" | "palavra" | "outro";

/**
 * Contexto da headline lida, para diagnosticar truncamento DEPOIS do fato.
 *
 * Por que existe: as três famílias de quebra medidas em produção (vírgula, pipe
 * órfão, termo composto partido) são indistinguíveis, no que fica persistido, de
 * uma headline que a pessoa escreveu daquele jeito. `headline` sozinha não
 * separa "o parser cortou" de "a pessoa digitou assim", e sem `profileText` (que
 * não é guardado, de propósito) não havia como saber. `juntou` responde
 * diretamente; `acima` diz em que a linha anterior terminou, sem guardá-la.
 *
 * `linhasAbaixo` começa DEPOIS da headline exatamente pelo motivo acima: para
 * cima só vai classificação, para baixo vai conteúdo.
 *
 * Campo NOVO e opcional: as 163 linhas já gravadas não o têm, e a leitura
 * precisa tolerar a ausência (travado em `parse.headlineContexto.test.ts`).
 */
export interface LinkedinHeadlineContexto {
  /** Índice da primeira linha da headline no preâmbulo. */
  indiceEscolhido: number;
  /** A junção para trás disparou? Separa "o parser cortou" de "foi digitado". */
  juntou: boolean;
  /** Até duas linhas cruas DEPOIS da headline. Vazio se não houver. */
  linhasAbaixo: string[];
  /** Classificação da linha acima, sem conteúdo. `null` se a headline abre o texto. */
  acima: { terminaEm: HeadlineTerminacaoAcima; forte: boolean } | null;
}

function classificarTerminacao(
  linha: string,
  separadorRemovido: boolean,
): HeadlineTerminacaoAcima {
  if (separadorRemovido) return "pipe";
  const s = linha.trim();
  if (s.endsWith(",")) return "virgula";
  if (s.endsWith("|")) return "pipe";
  // Sem `\p{L}`: o target do tsconfig nao aceita a flag `u` (mesmo motivo
  // de `comecaMaiuscula`). A faixa acentuada cobre o que aparece aqui.
  if (/[A-Za-z0-9\u00c0-\u024f]$/.test(s)) return "palavra";
  return "outro";
}

function pareceNomeEstrutural(linha: string): boolean {
  const anterior = linha.trim();
  return (
    anterior.length > 0 &&
    anterior.length <= 60 &&
    !anterior.includes("|") &&
    anterior.split(/\s+/).length <= 6 &&
    !matchSectionHeader(anterior) &&
    !hasHeadlineSignal(anterior) &&
    comecaMaiuscula(anterior)
  );
}

const SINAL_SECAO_DESCONHECIDA_RE =
  /\b(?:section|secao|contributions?|contribuicoes?|activities|atividades|accomplishments?|realizacoes|portfolio|portifolio)\b/i;

/**
 * Sinal conservador de um heading ainda fora do catálogo compartilhado.
 *
 * TitleCase sozinho é insuficiente (`React`, `Docker` e `Machine Learning`
 * podem ser skills). Exigimos mais de uma palavra, forma curta de rótulo e um
 * substantivo que expresse bloco/seção. O resultado nunca vira conteúdo: ele
 * apenas torna a fronteira inconclusiva e impede prefill/splice.
 */
function pareceInicioDeSecaoDesconhecida(linha: string): boolean {
  const t = linha.trim();
  if (t.length < 6 || t.length > 60) return false;
  if (isLinkedinSectionHeading(t)) return false;
  if (/[|,;:.!?]/.test(t)) return false;
  const palavras = t.split(/\s+/);
  if (palavras.length < 2 || palavras.length > 6) return false;
  if (!comecaMaiuscula(t)) return false;
  return SINAL_SECAO_DESCONHECIDA_RE.test(stripAccentsLower(t));
}

const LOCALIZACAO_UNITARIA = /^(?:brasil|brazil|portugal|canada|usa|uk)$/i;
const SINAL_LOCALIZACAO =
  /(?:,|\b(?:area|region|regiao|greater|remoto|remote|hibrido|hybrid|presencial|on-site)\b)/i;

function ehLocalizacaoEstrutural(linha: string): boolean {
  return (
    SINAL_LOCALIZACAO.test(stripAccentsLower(linha)) &&
    ehLinhaDeLocalizacao(linha)
  );
}

/** Continuação curta que ainda pode pertencer ao campo de headline. */
function ehContinuacaoDeHeadline(linha: string): boolean {
  const t = linha.trim();
  if (t.length < 2 || t.length > 60) return false;
  if (isLinkedinSectionHeading(t)) return false;
  if (EMAIL_RE.test(t) || URL_RE.test(t) || PHONE_RE.test(t)) return false;
  if (isDateRangeLine(t) || BULLET_RE.test(t) || /[.!?;:]$/.test(t)) {
    return false;
  }
  const palavras = t.split(/\s+/);
  if (LOCALIZACAO_UNITARIA.test(stripAccentsLower(t))) return false;
  if (ehLocalizacaoEstrutural(t)) return false;
  // Uma tecnologia isolada (React) é a forma mais comum. Com mais palavras,
  // exigimos um separador/sinal próprio de stack para não absorver empresa.
  return palavras.length === 1 || /[|/&+#.,]/.test(t) || hasHeadlineSignal(t);
}

function grupoDeHeadline(
  preamble: string[],
  seed: number,
  ehForte: (linha: string) => boolean,
  separadorRemovidoEm: Set<number>,
): HeadlineLineRegion {
  let inicio = seed;
  while (inicio > 0) {
    const anteriorIdx = inicio - 1;
    const anterior = preamble[anteriorIdx].trim();
    const abertoEmPipe = separadorRemovidoEm.has(anteriorIdx);
    if (!abertoEmPipe && !HEADLINE_ABERTA_EM_VIRGULA.test(anterior)) break;
    if (!ehForte(anterior) || !ehContinuacaoDeHeadline(preamble[inicio])) {
      break;
    }
    inicio = anteriorIdx;
  }

  const partes: string[] = [];
  let fim = inicio;
  let aberta = false;
  while (fim < preamble.length) {
    const atual = preamble[fim].trim();
    partes.push(atual);
    const abertoEmVirgula = HEADLINE_ABERTA_EM_VIRGULA.test(atual);
    const abertoEmPipe = separadorRemovidoEm.has(fim);
    if (!abertoEmVirgula && !abertoEmPipe) break;
    const proximo = fim + 1;
    if (proximo >= preamble.length) {
      aberta = true;
      break;
    }
    if (!ehContinuacaoDeHeadline(preamble[proximo])) {
      // Localização/cabeçalho prova a fronteira da região mesmo que a headline
      // extraída tenha terminado aberta. Empresa ou texto livre não prova.
      aberta = !(
        ehLocalizacaoEstrutural(preamble[proximo]) ||
        isLinkedinSectionHeading(preamble[proximo])
      );
      break;
    }
    fim = proximo;
  }
  return { inicio, fim, partes, aberta };
}

/**
 * O bloco de identidade pode ser DESTACADO da cauda de uma seção conhecida?
 *
 * O conteúdo de uma seção vai do heading até a linha anterior ao próximo
 * heading, medido sobre as linhas INTEIRAS. Medir isso sobre o preâmbulo é o
 * que cegava `dentroDeSecaoLateralFechada`: o preâmbulo termina ANTES da
 * primeira seção principal, então o heading que fecha a coluna lateral
 * (`Summary`) fica justamente de fora, e `Top Skills / React / Frontend
 * Developer / Summary` produzia identidade `confirmed` com duas linhas que são
 * conteúdo de Top Skills, esvaziando a seção e autorizando splice.
 *
 * O destaque NÃO pode ser proibido em bloco, porque o export real põe nome,
 * headline e localização exatamente aí, entre a última seção lateral e
 * `Summary` (é o layout das fixtures de `parse.headlineMultilinha` e
 * `parse.skillsEstruturais`). Então ele é ancorado em três condições
 * estruturais, nenhuma delas lexical:
 *
 *   (a) o destaque deixa a seção com pelo menos uma linha de conteúdo. Seção
 *       esvaziada é evidência de que o bloco era o conteúdo, não identidade;
 *   (b) a âncora de nome tem mais de uma palavra. Dentro de uma seção, uma
 *       âncora de UMA palavra é indistinguível de um item da lista, e é o que
 *       promovia `React` a nome e `TypeScript` a nome. A contagem já é o
 *       critério estrutural usado por `skillsTemPossivelIdentidade` para a
 *       pergunta espelhada ("esta linha de skills parece identidade?");
 *   (c) o bloco contém uma linha de LOCALIZAÇÃO estrutural. Sem ela, (a) e (b)
 *       sozinhas ainda aceitavam `Top Skills / Python / Machine Learning /
 *       Vector Databases / Summary`, que é o caso original com uma linha a
 *       mais: `Machine Learning` tem duas palavras e sobra `Python` na seção.
 *       Uma lista de competências não tem cidade no meio dela; o preâmbulo de
 *       perfil tem. É o único sinal que separa os dois sem saber o que as
 *       linhas SIGNIFICAM, e reusa `ehLocalizacaoEstrutural` sem afrouxar nada.
 *
 * A "cauda contígua encostada no próximo heading" foi AVALIADA como condição
 * e descartada: `parse.headlineMultilinha.test.ts` tem perfis legítimos em que
 * sobra uma linha de conteúdo entre o bloco e `Summary` (o cargo de
 * experiência logo abaixo da headline), e exigir contiguidade os derrubaria.
 *
 * A quarta condição (cada linha passa no validador estrutural do seu papel)
 * já vale por construção: o intervalo é exatamente {nome?} + linhas do grupo +
 * {localização?}, validadas por `pareceNomeEstrutural`, `grupoDeHeadline` e
 * `ehLocalizacaoEstrutural`. Nenhuma linha entra aqui sem ter passado por uma
 * das três.
 *
 * CUSTO ACEITO como decisão de produto: perfil cujo bloco de identidade fica
 * dentro de uma seção e NÃO traz linha de localização deixa de ser `confirmed`
 * e passa a `ambiguous`, o que só remove o splice automático e marca a nota
 * como incompleta. Fora de seção (`dono < 0`) nada muda.
 */
function identidadeDestacavelDaSecao(
  lines: string[],
  start: number,
  end: number,
  nomeAncora: string | null,
): boolean {
  const hits = findSectionHeaders(lines);
  let dono = -1;
  for (let i = 0; i < hits.length; i += 1) {
    if (hits[i].index >= start) break;
    dono = i;
  }
  // Sem heading antes do bloco, ele não é conteúdo de seção nenhuma.
  if (dono < 0) return true;
  const proximo = hits[dono + 1];
  const inicio = hits[dono].index + 1;
  const fim = (proximo ? proximo.index : lines.length) - 1;
  const dentro = Math.min(end, fim + 1) - start;
  if (fim - inicio + 1 - dentro < 1) return false;
  if (nomeAncora === null || nomeAncora.trim().split(/\s+/).length < 2) {
    return false;
  }
  return lines.slice(start, end).some(ehLocalizacaoEstrutural);
}

function regiaoDeIdentidade(
  lines: string[],
  grupo: HeadlineLineRegion,
  firstMainIndex: number,
): IdentityRegion {
  const anterior = lines[grupo.inicio - 1];
  const abaixo = lines[grupo.fim + 1];
  const ancoraNoTopo = grupo.inicio === 0;
  const ancoraDeNome =
    anterior !== undefined &&
    pareceNomeEstrutural(anterior) &&
    !pareceInicioDeSecaoDesconhecida(anterior);
  const localizacaoAbaixo =
    abaixo !== undefined && ehLocalizacaoEstrutural(abaixo);
  const fronteiraPrincipalProxima =
    firstMainIndex > grupo.fim && firstMainIndex - grupo.fim <= 4;
  const janela = lines.slice(
    Math.max(0, grupo.inicio - 1),
    Math.min(
      lines.length,
      firstMainIndex > grupo.fim ? firstMainIndex : grupo.fim + 3,
    ),
  );
  const pareceExperiencia = janela.some(
    (linha) => isDateRangeLine(linha) || ehLinhaDeDuracao(linha),
  );
  const start = ancoraDeNome ? grupo.inicio - 1 : grupo.inicio;
  const end = localizacaoAbaixo ? grupo.fim + 2 : grupo.fim + 1;
  const confirmada =
    !pareceExperiencia &&
    identidadeDestacavelDaSecao(
      lines,
      start,
      end,
      ancoraDeNome ? anterior : null,
    ) &&
    (ancoraNoTopo ||
      (ancoraDeNome && (localizacaoAbaixo || fronteiraPrincipalProxima)));

  return {
    start,
    end,
    confidence: confirmada ? "confirmed" : "ambiguous",
  };
}

/** Conteúdo seguramente fechado entre dois headings da coluna lateral. */
function dentroDeSecaoLateralFechada(
  preamble: string[],
  grupo: HeadlineLineRegion,
): boolean {
  let headingAnterior = -1;
  let headingPosterior = -1;
  for (let index = 0; index < preamble.length; index += 1) {
    if (!isLinkedinSectionHeading(preamble[index])) continue;
    if (index < grupo.inicio) headingAnterior = index;
    if (index > grupo.fim) {
      headingPosterior = index;
      break;
    }
  }
  return headingAnterior >= 0 && headingPosterior >= 0;
}

function detectHeadline(
  lines: string[],
  firstMainIndex: number,
  separadorRemovidoEm: Set<number>,
): DetectedHeadline {
  const limite =
    firstMainIndex >= 0 ? firstMainIndex : Math.min(20, lines.length);
  const preamble = lines.slice(0, limite);
  const ehForte = (linha: string) =>
    isHeadlineCandidate(linha) && hasHeadlineSignal(linha);
  const strong = preamble
    .map((linha, indice) => ({ linha, indice }))
    .filter(({ linha }) => ehForte(linha));
  if (strong.length === 0) {
    return {
      valor: null,
      indice: -1,
      intervalo: null,
      status: "not_found",
      contexto: null,
    };
  }

  const grupos = Array.from(
    new Map(
      strong.map(({ indice }) => {
        const grupo = grupoDeHeadline(
          preamble,
          indice,
          ehForte,
          separadorRemovidoEm,
        );
        return [`${grupo.inicio}:${grupo.fim}`, grupo] as const;
      }),
    ).values(),
  );
  // Uma linha com "data" dentro de Top Skills, por exemplo, pode passar no
  // sinal lexical de headline. Se ainda há outro heading lateral depois dela,
  // porém, a estrutura prova que é conteúdo daquela seção, não identidade.
  const gruposPossiveis = grupos.filter(
    (grupo) => !dentroDeSecaoLateralFechada(preamble, grupo),
  );
  if (gruposPossiveis.length === 0) {
    return {
      valor: null,
      indice: -1,
      intervalo: null,
      status: "not_found",
      contexto: null,
    };
  }
  const temAncoraDeIdentidade = (grupo: HeadlineLineRegion) =>
    grupo.inicio === 0 ||
    (grupo.inicio > 0 &&
      pareceNomeEstrutural(preamble[grupo.inicio - 1]) &&
      !pareceInicioDeSecaoDesconhecida(preamble[grupo.inicio - 1]));
  const ancorados = gruposPossiveis.filter(temAncoraDeIdentidade);
  const confirmadosPorIdentidade = gruposPossiveis.filter(
    (grupo) =>
      regiaoDeIdentidade(lines, grupo, firstMainIndex).confidence ===
      "confirmed",
  );
  const doisBlocosDePerfilAdjacentes = ancorados.some((grupo, index) =>
    ancorados
      .slice(index + 1)
      .some(
        (seguinte) =>
          seguinte.inicio === grupo.fim + 2 &&
          pareceNomeEstrutural(preamble[grupo.fim + 1]),
      ),
  );
  const candidatos = doisBlocosDePerfilAdjacentes
    ? ancorados
    : confirmadosPorIdentidade.length > 0
      ? confirmadosPorIdentidade
      : ancorados.length > 0
        ? ancorados
        : gruposPossiveis;
  const regiaoUnica = candidatos.length === 1;
  const escolhido = candidatos[0];
  const { inicio, fim, partes } = escolhido;
  const identityRegion = regiaoDeIdentidade(lines, escolhido, firstMainIndex);
  const confirmado =
    !escolhido.aberta &&
    regiaoUnica &&
    identityRegion.confidence === "confirmed" &&
    inicio >= identityRegion.start &&
    fim < identityRegion.end;
  const acimaIdx = inicio - 1;
  const valorComposto = partes.reduce((acc, parte, offset) => {
    if (offset === 0) return parte;
    const anteriorIdx = inicio + offset - 1;
    const separador = separadorRemovidoEm.has(anteriorIdx) ? " | " : " ";
    return `${acc}${separador}${parte}`;
  }, "");
  return {
    // Com mais de uma região empatada, nem o valor deve fingir que sabemos
    // qual é a headline. Uma única região aberta ainda é mostrada para revisão.
    valor: !regiaoUnica ? null : clip(valorComposto.replace(/\s+/g, " "), 250),
    indice: confirmado ? inicio : -1,
    intervalo: confirmado ? { inicio, fim } : null,
    status: confirmado ? "confirmed" : "ambiguous",
    contexto: {
      indiceEscolhido: inicio,
      juntou: partes.length > 1,
      linhasAbaixo: preamble
        .slice(fim + 1, fim + 3)
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
      acima:
        acimaIdx >= 0
          ? {
              terminaEm: classificarTerminacao(
                preamble[acimaIdx],
                separadorRemovidoEm.has(acimaIdx),
              ),
              forte: ehForte(preamble[acimaIdx]),
            }
          : null,
    },
  };
}

/**
 * Onde começa o bloco de identidade (nome, headline, localização).
 *
 * É o corte que a seção lateral anterior tem que respeitar. Devolve -1 quando
 * não há bloco identificável, e aí nada é cortado: preferir seção com ruído a
 * seção truncada por chute.
 */
function inicioDaIdentidade(lines: string[], headlineIdx: number): number {
  if (headlineIdx <= 0) return headlineIdx;
  const anterior = lines[headlineIdx - 1].trim();
  // O nome próprio: curto, sem separador de headline, sem ser cabeçalho de
  // seção e sem sinal de cargo. Se a linha anterior não parecer nome, o bloco
  // começa na própria headline.
  //
  // Deliberadamente SEM testar localização. Nome de pessoa e nome de cidade têm
  // a mesma forma ("Joana Teste" e "Belo Horizonte" são indistinguíveis por
  // shape), e a primeira versão deste guard usava `ehLinhaDeLocalizacao` para
  // recusar, o que deixava o nome passar para dentro das certificações. Quem
  // desempata é a POSIÇÃO: no export, localização vem DEPOIS da headline e o
  // nome vem antes. Custo assumido: num export sem linha de nome, uma linha
  // real da seção lateral é cortada.
  const pareceNome = pareceNomeEstrutural(anterior);
  return pareceNome ? headlineIdx - 1 : headlineIdx;
}

/** Índices de todos os cabeçalhos de seção encontrados, em ordem. */
function findSectionHeaders(lines: string[]): SectionHeaderHit[] {
  const hits: SectionHeaderHit[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const heading = linkedinSectionHeading(lines[i]);
    if (heading) {
      hits.push({
        index: i,
        key: heading.id,
        principal: heading.principal,
      });
    }
  }
  return hits;
}

/** Linhas de conteúdo de uma seção: do cabeçalho até o próximo cabeçalho. */
function sectionLines(
  lines: string[],
  hits: SectionHeaderHit[],
  key: ParsedSectionKey,
  /**
   * Corte do bloco de identidade. A última seção da coluna lateral termina no
   * próximo cabeçalho reconhecido, que é `Summary`, e no meio do caminho estão
   * o nome, a headline e a localização. Sem este corte, `certificacoes` do
   * perfil real vinha com "Joana Teste", a headline inteira e
   * "Greater São Paulo Area" dentro.
   */
  identidadeStart = -1,
): string[] {
  const start = hits.find((hit) => hit.key === key);
  if (!start) return [];
  const next = hits.find((hit) => hit.index > start.index);
  let end = next ? next.index : lines.length;
  if (identidadeStart > start.index && identidadeStart < end) {
    end = identidadeStart;
  }
  return lines.slice(start.index + 1, end);
}

function parseSkills(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    if (isLinkedinSectionHeading(line)) continue;
    for (const part of line.split(/[,;|]/)) {
      const skill = part.trim();
      if (skill.length >= 2 && skill.length <= 60) out.push(skill);
    }
  }
  return Array.from(new Set(out)).slice(0, 50);
}

interface SkillsRegion {
  lines: string[];
  suspectedBoundary: boolean;
}

function delimitarSkills(lines: string[]): SkillsRegion {
  const boundary = lines.findIndex(
    (line, index) =>
      index + 1 < lines.length && pareceInicioDeSecaoDesconhecida(line),
  );
  return boundary < 0
    ? { lines, suspectedBoundary: false }
    : { lines: lines.slice(0, boundary), suspectedBoundary: true };
}

/**
 * Um bloco de experiência já delimitado: onde o cabeçalho começa, onde está a
 * data que ancora o bloco, e o que o cabeçalho continha.
 */
interface BlocoExperiencia {
  headerStart: number;
  dateIdx: number;
  empresa: string | null;
  titulo: string;
}

/**
 * Lê o cabeçalho de um bloco andando PARA TRÁS a partir da linha de data.
 *
 * O export do LinkedIn tem dois formatos, e este é o único lugar do parser que
 * sabe disso:
 *
 *   SIMPLES                        AGRUPADO (uma empresa, vários cargos)
 *   Empresa                        Empresa
 *   Cargo                          1 year 1 month     <- duração do grupo
 *   janeiro de 2022 - Present      Cargo 1
 *   3 anos                         agosto de 2024 - novembro de 2024
 *   São Paulo, Brasil              São Paulo, Brasil
 *   descrição...                   descrição...
 *                                  Cargo 2            <- SEM empresa de novo
 *                                  novembro de 2023 - novembro de 2024
 *                                  descrição...
 *
 * Daí a ordem da leitura: cargo, depois duração opcional do grupo, depois
 * empresa opcional. `limite` é o índice da data anterior: o cabeçalho nunca a
 * atravessa.
 */
function lerCabecalho(
  content: string[],
  dateIdx: number,
  limite: number,
): BlocoExperiencia {
  let i = dateIdx - 1;
  let titulo = "";
  let empresa: string | null = null;
  if (i > limite && ehLinhaDeCabecalho(content[i])) {
    titulo = content[i];
    i -= 1;
  }
  if (i > limite && ehLinhaDeDuracao(content[i])) i -= 1;
  if (titulo && i > limite && ehLinhaDeCabecalho(content[i])) {
    empresa = content[i];
    i -= 1;
  }
  return { headerStart: i + 1, dateIdx, empresa, titulo };
}

function parseExperiencias(lines: string[]): LinkedinExperiencia[] {
  const content = lines.map((l) => l.trim()).filter((l) => l.length > 0);
  if (content.length === 0) return [];

  const dateIdx: number[] = [];
  for (let i = 0; i < content.length; i += 1) {
    if (isDateRangeLine(content[i])) dateIdx.push(i);
  }

  // Sem nenhuma linha de data: trata a seção inteira como uma experiência.
  if (dateIdx.length === 0) {
    const titulo = content[0] ?? "";
    const descricao = content.slice(1).join(" ").trim();
    if (!titulo && !descricao) return [];
    return [{ titulo, empresa: null, descricao }];
  }

  const blocos = dateIdx.map((di, e) =>
    lerCabecalho(content, di, e > 0 ? dateIdx[e - 1] : -1),
  );

  // Propagação da empresa do grupo. No formato agrupado o export escreve a
  // empresa UMA vez, no topo, e os cargos seguintes vêm sem ela. Ler isso como
  // "cargo sem empresa" é herdar o bug: a empresa existe no PDF e vale para
  // todos os cargos do grupo, não só para o primeiro. Um cargo sem linha de
  // empresa própria é, por construção do export, continuação do grupo anterior.
  // A primeira experiência não tem de quem herdar e continua null.
  for (let e = 1; e < blocos.length; e += 1) {
    if (blocos[e].empresa === null) blocos[e].empresa = blocos[e - 1].empresa;
  }

  return blocos.flatMap((bloco, e) => {
    // A descrição termina onde começa o CABEÇALHO do bloco seguinte, não na
    // data seguinte. É a correção de fundo: entre uma data e a próxima existe o
    // cabeçalho do vizinho, e a janela antiga o engolia. Com o fim no lugar
    // certo, "descrição vazia" passa a existir como resultado possível, em vez
    // de virar o nome da empresa seguinte.
    const fim =
      e + 1 < blocos.length ? blocos[e + 1].headerStart : content.length;
    // Depois da data vêm até duas linhas de metadado (duração e localização),
    // em qualquer ordem. Metadado não é descrição.
    let inicio = bloco.dateIdx + 1;
    for (let n = 0; n < 2 && inicio < fim; n += 1) {
      const linha = content[inicio];
      if (!ehLinhaDeDuracao(linha) && !ehLinhaDeLocalizacao(linha)) break;
      inicio += 1;
    }
    const descricao = content.slice(inicio, fim).join(" ").trim();
    if (!bloco.titulo && !bloco.empresa && !descricao) return [];
    return [{ titulo: bloco.titulo, empresa: bloco.empresa, descricao }];
  });
}

export function parseLinkedinText(text: string): LinkedinParsed {
  // UMA passada de normalizacao antes de qualquer parser especifico: junta
  // continuacao de linha quebrada pelo PDF e remove rodape de paginacao. Client
  // e servidor chamam esta mesma funcao, entao veem exatamente o mesmo texto.
  const {
    linhas: lines,
    separadorRemovidoEm,
    origens,
  } = normalizeProfileLinesComSinal(text);

  if (lines.length === 0) {
    return {
      headline: null,
      headlineRegion: { status: "not_found" },
      headlineContexto: null,
      sobre: null,
      experiencias: [],
      skillsPdf: [],
      formacao: [],
      certificacoes: [],
      usable: false,
    };
  }

  const hits = findSectionHeaders(lines);
  const firstMain = hits.find((hit) => hit.principal);
  const firstMainIndex = firstMain ? firstMain.index : -1;

  const detectedHeadline = detectHeadline(
    lines,
    firstMainIndex,
    separadorRemovidoEm,
  );
  const {
    valor: headline,
    indice: headlineIdx,
    intervalo: headlineIntervalo,
    contexto: headlineContexto,
  } = detectedHeadline;
  const headlineRegion: HeadlineRegion = (() => {
    if (detectedHeadline.status !== "confirmed" || !headlineIntervalo) {
      return detectedHeadline.status === "not_found"
        ? { status: "not_found" }
        : { status: "ambiguous" };
    }
    const inicio = origens[headlineIntervalo.inicio]?.inicio;
    const fim = origens[headlineIntervalo.fim]?.fim;
    if (typeof inicio !== "number" || typeof fim !== "number") {
      return { status: "ambiguous" };
    }
    return {
      status: "confirmed",
      start: inicio,
      end: fim,
      text: headline ?? "",
    };
  })();
  const identidadeStart = inicioDaIdentidade(
    lines,
    headlineIntervalo?.inicio ?? headlineIdx,
  );

  const sobreRaw = sectionLines(lines, hits, "sobre").join(" ").trim();
  const sobre = sobreRaw.length > 0 ? sobreRaw : null;

  const experiencias = parseExperiencias(
    sectionLines(lines, hits, "experiencia"),
  );

  const skillsHit = hits.find((hit) => hit.key === "skills");
  const rawSkillsLines = sectionLines(lines, hits, "skills", identidadeStart);
  const skillsRegion = delimitarSkills(rawSkillsLines);
  const skillsLines = skillsRegion.lines;
  const skillsPdf = parseSkills(skillsLines);
  const nextSkillsBoundary = skillsHit
    ? hits.find((hit) => hit.index > skillsHit.index)
    : undefined;
  const identidadeEncerraSkills = Boolean(
    skillsHit && identidadeStart > skillsHit.index,
  );
  const skillsTemPossivelIdentidade = skillsLines.some((linha) => {
    const palavras = linha.trim().split(/\s+/);
    return (
      ehLocalizacaoEstrutural(linha) ||
      (palavras.length >= 2 && pareceNomeEstrutural(linha))
    );
  });
  const skillsPdfConfiaveis =
    !skillsRegion.suspectedBoundary &&
    (!skillsHit ||
      skillsLines.length === 0 ||
      identidadeEncerraSkills ||
      (nextSkillsBoundary !== undefined && !skillsTemPossivelIdentidade));
  const formacao = sectionLines(lines, hits, "formacao", identidadeStart).slice(
    0,
    20,
  );
  const certificacoes = sectionLines(
    lines,
    hits,
    "certificacoes",
    identidadeStart,
  ).slice(0, 20);

  // Sinal real de headline: barra de cargo, palavra de papel ou clichê de
  // perfil, nao so comprimento. Uma linha longa qualquer (lixo de PDF que nao
  // e um perfil) nao conta como aproveitavel, e a rota devolve 422.
  const headlineWordSignal =
    headline !== null &&
    (headline.includes("|") ||
      HEADLINE_SIGNAL_RE.test(stripAccentsLower(headline)));

  // Aproveitavel quando ha qualquer seção reconhecida ou um sinal real de
  // perfil. Pura repetição ou simbolos, sem nada disso, cai no 422.
  const usable =
    hits.length > 0 ||
    headlineWordSignal ||
    sobre !== null ||
    experiencias.length > 0 ||
    skillsPdf.length > 0;

  return {
    headline,
    headlineRegion,
    headlineContexto,
    sobre,
    experiencias,
    skillsPdf,
    skillsPdfConfiaveis,
    formacao,
    certificacoes,
    usable,
  };
}

/**
 * Visão efetiva do perfil quando a pessoa corrige a headline.
 *
 * A função trabalha sobre a mesma estrutura de linhas usada pelo parser e
 * troca somente o intervalo confirmado. Nenhuma enumeração parcial de seções é
 * feita aqui: Projects, idiomas, voluntariado e qualquer cabeçalho desconhecido
 * continuam no texto. Região ambígua ou ausente preserva o bruto byte a byte;
 * a régua analisa a manual sobre uma visão estruturada conservadora.
 */
export function textoComHeadlineManual(
  text: string,
  headlineManual: string | null | undefined,
): string {
  const manual = normalizarHeadlineManual(headlineManual);
  if (manual === null) return text;

  const { linhas, separadorRemovidoEm, origens } =
    normalizeProfileLinesComSinal(text);
  const hits = findSectionHeaders(linhas);
  const firstMain = hits.find((hit) => hit.principal);
  const detected = detectHeadline(
    linhas,
    firstMain?.index ?? -1,
    separadorRemovidoEm,
  );

  if (detected.status === "confirmed" && detected.intervalo) {
    const inicio = origens[detected.intervalo.inicio]?.inicio;
    const fim = origens[detected.intervalo.fim]?.fim;
    if (typeof inicio === "number" && typeof fim === "number") {
      return `${text.slice(0, inicio)}${manual}${text.slice(fim)}`;
    }
  }
  // Região ambígua/ausente nunca autoriza apagar nem mover conteúdo bruto.
  // O chamador da régua usa campos estruturados para evitar contaminação.
  return text;
}
