/**
 * Normalização do texto extraído do PDF, executada UMA vez no topo de
 * `parseLinkedinText`, antes de qualquer parser específico.
 *
 * Por que existe: o "Salvar como PDF" do LinkedIn quebra conteúdo no meio, e o
 * parser lia cada linha como unidade independente. Dois sintomas medidos num
 * export real:
 *
 *   Software Developer | Full-Stack Engineer | AI Agent Expert | React |
 *   Node
 *
 *   Retrieval-Augmented Generation
 *   (RAG)
 *
 * No primeiro, "Node" tem 4 caracteres e era descartado por `isHeadlineCandidate`
 * (mínimo 6), então a headline entregue terminava em barra órfã, o check
 * `headline-stack` reprovava dizendo "menos de 2 tecnologias", e a IA recebia
 * isso como FATO e recomendava adicionar Next.js e Tailwind. No segundo, uma
 * competência virava duas, e o fragmento "(RAG)" era contado no total.
 *
 * O mesmo módulo remove o rodapé de paginação, que antes só era limpo na
 * exibição: `Page 2 of 5` ficava dentro de títulos e descrições, contava no
 * limiar de 100 caracteres de `exp-descricoes` (check essencial) e, a partir de
 * 10 páginas, o número de dois dígitos fazia `exp-resultados` aprovar sozinho.
 *
 * A normalização é deliberadamente CONSERVADORA: na dúvida, não junta. Juntar
 * demais estraga o parse de experiências (título colado em data, bullets
 * fundidos), que é pior que a quebra original.
 */

/**
 * Rodapé de paginação, em PT e EN, tolerando o espaçamento múltiplo que o
 * pdfjs produz (`Page   1   of   5`).
 *
 * FONTE ÚNICA deste padrão no projeto. Antes existiam dois: o `PAGE_RE` do
 * parser (que só evitava escolher rodapé como headline) e o
 * `stripPdfPageNoise` do client (que limpava na exibição). Os dois foram
 * substituídos por este, porque o rodapé agora some antes do parse: quem
 * limpava depois não tem mais o que limpar.
 */
export const PAGE_FOOTER_RE = /^(?:page|p[aá]gina)\s+\d+\s+(?:of|de)\s+\d+$/i;

/** Cabeçalho de seção não é continuação de nada. Espelha SECTION_HEADERS. */
const SECTION_HEADER_LIKE =
  /^(?:contact|contato|summary|resumo|sobre|about|experience|experi[eê]ncia|experi[eê]ncia profissional|education|forma[cç][aã]o acad[eê]mica|forma[cç][aã]o|educa[cç][aã]o|top skills|principais compet[eê]ncias|skills|compet[eê]ncias|aptid[oõ]es|languages|idiomas|licenses & certifications|licen[cç]as e certificados|certifications|certifica[cç][oõ]es|certificados)$/i;

/** Linha que é só um intervalo de datas, tolerante o bastante para o guard. */
const DATE_LINE_LIKE =
  /(?:\b(?:19|20)\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b)/i;

/** Bullet: marcador no início. Dois bullets nunca se fundem. */
const BULLET_START = /^\s*(?:[•·▪◦*-]|\d+[.)])\s+/;

/** Pontuação que fecha uma ideia: linha assim não continua na seguinte. */
const ENDS_CLOSED = /[.!?;:]$/;

/**
 * Separador ESTRUTURAL órfão no fim da linha: barra vertical ou barra, que só
 * existem como divisor de itens (headline no formato `cargo | stack | tag`).
 * Ficar no fim da linha significa que o item seguinte foi quebrado.
 *
 * VÍRGULA NÃO ENTRA AQUI, de propósito. Vírgula é pontuação normal de prosa e
 * cai naturalmente no fim da linha quando o PDF quebra no meio de uma frase
 * ("...I am also adept in developing," + "customizing, and deploying"). Tratá-la
 * como separador estrutural fazia duas coisas erradas ao mesmo tempo: recusava
 * a junção quando a continuação era longa, e depois APAGAVA a vírgula, que é
 * pontuação legítima da frase. Continuação de prosa é coberta pela regra 4
 * (linha seguinte começa em minúscula).
 */
const ENDS_ORPHAN_SEPARATOR = /[|/]$/;

/** Hifenização de quebra de página: "natural-" seguido de "language". */
const ENDS_HYPHEN = /[a-zà-ÿ]-$/i;

/** Continuação entre parênteses numa linha só: "(RAG)", "(Mobile)". */
const PARENTHETICAL_ONLY = /^\([^()]*\)$/;

/** Comprimento acima do qual uma linha é conteúdo próprio, não continuação. */
const MAX_CONTINUATION_LEN = 40;

/**
 * Linha de LOCALIZAÇÃO do export do LinkedIn. Formatos observados no arquivo
 * real: `Greater São Paulo Area`, `São Paulo, Brazil`, `Brasília, DF`,
 * `Cidade Exemplo - Estado`. É um CAMPO PRÓPRIO que aparece logo depois da
 * headline e logo depois da linha de data, então é exatamente o vizinho que
 * uma junção agressiva absorveria por engano.
 */
const LOCATION_LIKE =
  /(\b(?:area|region|regi[aã]o|greater)\b|,\s*[A-Z]{2}$|,\s*(?:brazil|brasil|portugal|spain|espanha|united states|usa|uk|canada|canad[aá])$)/i;

/** Fragmento curto o bastante para ser a cauda de uma linha quebrada. */
const MAX_FRAGMENTO_LEN = 30;
const MAX_FRAGMENTO_TOKENS = 3;

/**
 * A linha pode ser a CAUDA de um campo quebrado?
 *
 * Usado só depois de separador órfão. A barra órfã diz "a linha anterior ficou
 * aberta", mas NÃO diz que a próxima é a continuação dela: no export, a linha
 * logo abaixo da headline é a localização. Sem este teste, uma headline que
 * termina em `|` sem continuação real absorvia
 * `Greater São Paulo Area` (regressão introduzida na Fase 1A).
 *
 * Assimetria deliberada: recusar uma cauda legítima devolve o comportamento
 * antigo (headline truncada, barra limpa), que é feio mas honesto. Absorver a
 * localização inventa conteúdo na headline. Na dúvida, recusa.
 */
function ehFragmentoDeCauda(linha: string): boolean {
  const t = linha.trim();
  if (t.length === 0 || t.length > MAX_FRAGMENTO_LEN) return false;
  if (LOCATION_LIKE.test(t)) return false;
  return t.split(/\s+/).length <= MAX_FRAGMENTO_TOKENS;
}

/**
 * A linha `atual` é continuação da `anterior`?
 *
 * SÃO consideradas continuação:
 *   1. anterior termina em separador estrutural órfão (`|` ou `/`) E a linha seguinte
 *      parece a cauda dela (curta, poucos tokens, não é localização): o caso
 *      da headline quebrada em "... | React |" + "Node";
 *   2. anterior termina em hífen de quebra ("natural-" + "language");
 *   3. atual é só um parêntese fechado e curto, o caso do "(RAG)";
 *   4. atual começa em minúscula, é curta e a anterior não fechou pontuação.
 *
 * NÃO são consideradas continuação, e o motivo de cada uma:
 *   - qualquer linha vazia: já foi filtrada antes;
 *   - cabeçalho de seção: é fronteira estrutural, juntar destrói a seção;
 *   - linha de data: juntar cola o título da experiência na data e o
 *     `parseExperiencias` perde a delimitação, que é pior que a quebra;
 *   - bullet: dois bullets curtos consecutivos são conteúdo independente;
 *   - anterior terminando em pontuação de fechamento: a ideia acabou;
 *   - atual começando com maiúscula sem nenhum dos sinais 1 a 3: é o caso de
 *     duas competências curtas legítimas em linhas separadas ("React" e "Vue"),
 *     onde juntar inventaria uma competência que não existe;
 *   - atual longa (acima de 40 caracteres): conteúdo próprio;
 *   - depois de separador órfão, linha que não passa em `ehFragmentoDeCauda`:
 *     é o caso da localização (`Greater São Paulo Area`) logo abaixo de uma
 *     headline que termina em barra.
 */
function ehContinuacao(anterior: string, atual: string): boolean {
  if (!anterior || !atual) return false;
  if (SECTION_HEADER_LIKE.test(atual.trim())) return false;
  if (SECTION_HEADER_LIKE.test(anterior.trim())) return false;
  if (BULLET_START.test(atual)) return false;
  if (DATE_LINE_LIKE.test(atual) && atual.length <= 80) return false;

  // 3. parêntese solto: "(RAG)" continua "Retrieval-Augmented Generation".
  if (PARENTHETICAL_ONLY.test(atual.trim()) && atual.trim().length <= MAX_CONTINUATION_LEN) {
    return true;
  }
  // 1. separador órfão: a anterior ficou aberta, mas só junta se a seguinte
  // parecer mesmo a cauda dela. Sem cauda válida, não junta e a barra é
  // limpa depois por limparSeparadorOrfao.
  if (ENDS_ORPHAN_SEPARATOR.test(anterior.trim())) {
    return ehFragmentoDeCauda(atual);
  }
  // 2. hífen de quebra.
  if (ENDS_HYPHEN.test(anterior.trim())) return true;

  if (ENDS_CLOSED.test(anterior.trim())) return false;
  // 4. minúscula e curta: continuação de frase quebrada.
  if (atual.length <= MAX_CONTINUATION_LEN && /^[a-zà-ÿ]/.test(atual)) return true;

  return false;
}

/**
 * Junta duas linhas. No caso do hífen, o hífen é PRESERVADO e não entra espaço.
 *
 * SUPOSIÇÃO, não fato verificado. A base é pequena: no único PDF real que
 * temos, existem exatamente DUAS quebras em hífen, e as duas são a mesma
 * palavra composta (`natural-` + `language`), contra 19 hífens no meio de
 * linha em compostos normais (`Full-Stack`, `pre-routers`, `end-to-end`).
 * Isso é consistente com "o LinkedIn quebra em hífen que já existe e não
 * insere hífen de silabação", mas n=2 num só documento não prova a regra.
 *
 * Se a suposição estiver errada num perfil em português com palavra longa
 * (`desenvolvi-` + `mento`), o resultado é `desenvolvi-mento`: palavra
 * quebrada com hífen espúrio. O dano é de exibição e, no pior caso, de
 * matching (uma tecnologia hifenizada por engano deixa de ser contada e a nota
 * cai). Vale registrar que o comportamento ANTERIOR era pior no mesmo caso:
 * produzia `desenvolvi- mento`, com hífen E espaço, que também não casa com
 * nada. Nenhuma das duas escolhas acerta os dois casos; esta acerta o caso
 * observado.
 *
 * Como derrubar a suposição: um export em português com palavra longa cortada
 * no fim da linha. Se aparecer, a saída correta passa a depender de detectar
 * se a junção forma palavra de dicionário, o que é outro projeto.
 */
function juntar(anterior: string, atual: string): string {
  const a = anterior.trimEnd();
  const b = atual.trimStart();
  if (ENDS_HYPHEN.test(a)) return `${a}${b}`;
  return `${a} ${b}`;
}

/**
 * Separador estrutural sobrando no fim, quando não houve o que juntar.
 * Só barra vertical e barra: vírgula é pontuação da frase e fica.
 */
function limparSeparadorOrfao(linha: string): string {
  return linha.replace(/\s*[|/]\s*$/, "").trimEnd();
}

/**
 * Devolve as linhas já normalizadas: sem rodapé de paginação, sem linha vazia,
 * com continuações unidas e separadores órfãos limpos.
 */
export function normalizeProfileLines(text: string): string[] {
  const brutas = text
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0)
    // Rodapé some ANTES do parse: não entra em título, descrição, contagem de
    // caracteres nem no regex de métricas.
    .filter((linha) => !PAGE_FOOTER_RE.test(linha));

  const saida: string[] = [];
  for (const linha of brutas) {
    const anterior = saida[saida.length - 1];
    if (anterior !== undefined && ehContinuacao(anterior, linha)) {
      saida[saida.length - 1] = juntar(anterior, linha);
      continue;
    }
    saida.push(linha);
  }

  return saida.map(limparSeparadorOrfao).filter((linha) => linha.length > 0);
}
