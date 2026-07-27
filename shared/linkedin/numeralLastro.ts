/**
 * Verificação determinística de numeral em bullet reescrito.
 *
 * Mesma lógica que levou a série 58 -> 22 -> 3 -> 0: numeral é verificável, e o
 * que é verificável não se pede ao modelo, se confere em código. O prompt já
 * manda "número não muda de dono", mas instrução não é garantia: numa medição
 * de 10 execuções o modelo fabricou `30%`, `40%` e `25%` numa única resposta,
 * em experiências onde esses valores não existem.
 *
 * ESCOPO: só `bulletsReescritos`. O lastro de um bullet é o texto da
 * experiência DAQUELE bloco, nunca o perfil inteiro, porque um número que
 * existe em outra experiência colado aqui já é reatribuição.
 *
 * O QUE ESTA VERIFICAÇÃO PEGA: numeral presente no bullet e ausente na origem
 * (fabricação).
 *
 * O QUE ELA NÃO PEGA, e é preciso saber: numeral presente na origem e colado no
 * sujeito errado (reatribuição). "O agente reduziu o tempo em 86%" passa se a
 * origem disser "os pre-routers cortaram latência em ~86%", porque o 86 está
 * lá. Reatribuição continua dependendo de leitura humana e da instrução no
 * prompt.
 */

/** Um numeral encontrado num texto, já em forma canônica para comparação. */
export interface NumeralEncontrado {
  /** Como apareceu no texto original. */
  bruto: string;
  /** Forma canônica: dígitos, sem separador de milhar, sem sinal de %. */
  canonico: string;
  /** O numeral vinha acompanhado de %? */
  percentual: boolean;
  /**
   * O numeral estava colado a uma letra (`v4`, `ES6`, `ITIL v4`, `Vue3`)?
   * Nesse caso e numero de VERSAO ou identificador, nao metrica de resultado.
   */
  versao: boolean;
}

/**
 * Numerais por extenso cobertos, PT e EN, de zero a doze mais as dezenas
 * redondas comuns em texto de currículo. Acima disso, texto de perfil usa
 * dígito na prática.
 */
// ARTIGOS FORA DE PROPOSITO: "um", "uma", "one" e "a" sao artigo muito mais
// vezes que numeral em texto de curriculo ("um mecanismo de busca"), e contar
// como numeral produz falso positivo em quase todo bullet. Perde-se o caso
// raro de "um" querendo dizer 1; o custo do inverso e maior.
const POR_EXTENSO: Record<string, string> = {
  zero: "0", dois: "2", duas: "2", tres: "3", quatro: "4",
  cinco: "5", seis: "6", sete: "7", oito: "8", nove: "9", dez: "10",
  onze: "11", doze: "12", vinte: "20", trinta: "30", quarenta: "40",
  cinquenta: "50", sessenta: "60", setenta: "70", oitenta: "80", noventa: "90",
  cem: "100", cento: "100", mil: "1000",
  two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7",
  eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", twenty: "20",
  thirty: "30", forty: "40", fifty: "50", sixty: "60", seventy: "70",
  eighty: "80", ninety: "90", hundred: "100", thousand: "1000",
};

function semAcento(v: string): string {
  return v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Canoniza um numeral em dígitos.
 *
 * COBRE: separador de milhar (`3.000`, `3,000`, `3 000`), sufixo de escala
 * (`3M`, `20k`, `3M+`), aproximação (`~86%`, `cerca de 86%`, `about 86%`),
 * `over 20` / `20+` / `mais de 20`, e decimal (`4.5` vira `4.5`).
 *
 * NÃO COBRE, de propósito: intervalo (`10 a 20` vira dois numerais separados,
 * cada um conferido por si), fração escrita (`metade`, `um terço`), e ordinal
 * por extenso (`primeiro`), que não são métrica de resultado em bullet.
 */
function canonizar(bruto: string): string {
  let v = bruto.trim().toLowerCase();
  v = v.replace(/[%+~]/g, "").replace(/\s/g, "");
  // Sufixo de escala.
  const escala = v.match(/^([\d.,]+)(m|mm|k|mil|bi|b)$/);
  if (escala) {
    const base = Number(escala[1].replace(/[.,](?=\d{3}\b)/g, "").replace(",", "."));
    const mult = escala[2] === "k" || escala[2] === "mil" ? 1e3 : escala[2] === "bi" || escala[2] === "b" ? 1e9 : 1e6;
    if (Number.isFinite(base)) return String(Math.round(base * mult));
  }
  // Separador de milhar: ponto ou virgula seguidos de exatamente 3 digitos.
  v = v.replace(/[.,](?=\d{3}(\D|$))/g, "");
  // Decimal com virgula vira ponto.
  v = v.replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : v;
}

// Palavra de escala DEPOIS do digito: "3 milhoes" tem de casar com "3M+".
const ESCALA_PALAVRA: Record<string, number> = {
  mil: 1e3, milhar: 1e3, milhares: 1e3,
  milhao: 1e6, milhoes: 1e6, million: 1e6, millions: 1e6,
  bilhao: 1e9, bilhoes: 1e9, billion: 1e9, billions: 1e9,
};

const NUMERAL_RE =
  /(?:~\s*)?\d[\d.,\s]*\d(?:\s*%|\s*(?:m|mm|k|mil|bi|b)\b)?|\d(?:\s*%|\s*(?:m|mm|k|mil|bi|b)\b)?/gi;

/** Extrai todos os numerais de um texto, em dígito e por extenso. */
export function extrairNumerais(texto: string): NumeralEncontrado[] {
  const out: NumeralEncontrado[] = [];
  for (const m of Array.from(texto.matchAll(NUMERAL_RE))) {
    const bruto = m[0].trim();
    if (!/\d/.test(bruto)) continue;
    const inicio = m.index ?? 0;
    // Letra colada antes: "v4", "ES6", "Vue3". Versao, nao metrica.
    const versao = /[a-zà-ÿ]/i.test(texto.slice(Math.max(0, inicio - 1), inicio));
    const fim = inicio + m[0].length;
    const seguinte = texto.slice(fim, fim + 2);
    // "40%", "40 %", "40 percent", "40 por cento" e "40 pct" sao percentual.
    const depois = semAcento(texto.slice(fim, fim + 12));
    const percentual =
      /%/.test(bruto) ||
      /^\s*%/.test(seguinte) ||
      /^\s*(?:percent|per cento|por cento|pct)\b/.test(depois);
    // "3 milhoes" vira 3000000, para casar com "3M+" na origem.
    const palavraSeguinte = semAcento(texto.slice(fim, fim + 12)).match(/^\s*([a-z]+)/);
    const escala = palavraSeguinte ? ESCALA_PALAVRA[palavraSeguinte[1]] : undefined;
    const canonico = canonizar(bruto);
    if (escala && /^\d+(\.\d+)?$/.test(canonico)) {
      out.push({ bruto: `${bruto} ${palavraSeguinte![1]}`, canonico: String(Math.round(Number(canonico) * escala)), percentual, versao });
      continue;
    }
    out.push({ bruto, canonico, percentual, versao });
  }
  const semAc = semAcento(texto);
  for (const [palavra, digito] of Object.entries(POR_EXTENSO)) {
    if (new RegExp(`\\b${palavra}\\b`).test(semAc)) {
      out.push({ bruto: palavra, canonico: digito, percentual: false, versao: false });
    }
  }
  return out;
}

/**
 * Datas e durações não são métrica de resultado: `2024`, `(1 month)`,
 * `4 months`, `2 anos`. Conferi-las contra a descrição geraria falso positivo
 * porque elas vivem na linha de data, que o parser separa do texto.
 */
function ehDataOuDuracao(bruto: string, contexto: string): boolean {
  const n = Number(bruto.replace(/\D/g, ""));
  if (n >= 1900 && n <= 2100) return true;
  const idx = contexto.indexOf(bruto);
  if (idx < 0) return false;
  const depois = semAcento(contexto.slice(idx + bruto.length, idx + bruto.length + 14));
  return /^\s*(anos?|meses|mes|months?|years?|yrs?|mos?|semanas?|weeks?|dias?|days?)\b/.test(depois);
}

export interface NumeralSemLastro {
  bullet: string;
  numeral: string;
  /** `ausente` = o valor nao existe na origem. `tipo_trocado` = existe como
   *  contagem e foi usado como percentual. */
  motivo: "ausente" | "tipo_trocado";
}

/**
 * Numerais de `bullets` que NÃO têm lastro em `origem`.
 *
 * `origem` deve ser o título mais a descrição da experiência correspondente.
 */
export function numeraisSemLastro(
  bullets: string[],
  origem: string,
): NumeralSemLastro[] {
  const daOrigem = extrairNumerais(origem);
  const valores = new Set(daOrigem.map((n) => n.canonico));
  // Um valor pode aparecer na origem como contagem E como percentual em
  // lugares diferentes; guardamos os dois conjuntos separados.
  const comoPercentual = new Set(
    daOrigem.filter((n) => n.percentual).map((n) => n.canonico),
  );

  const fora: NumeralSemLastro[] = [];
  for (const bullet of bullets) {
    for (const n of extrairNumerais(bullet)) {
      if (n.versao) continue;
      if (ehDataOuDuracao(n.bruto, bullet)) continue;
      if (!valores.has(n.canonico)) {
        fora.push({ bullet, numeral: n.bruto, motivo: "ausente" });
        continue;
      }
      // TIPO TROCADO: o valor existe na origem, mas como CONTAGEM, e o bullet
      // o usa como PERCENTUAL. Caso real medido: a origem diz "25+ IT
      // professionals" e a saida escreveu "satisfacao do usuario em 25%". O
      // numero esta la, o significado nao.
      if (n.percentual && !comoPercentual.has(n.canonico)) {
        fora.push({ bullet, numeral: n.bruto, motivo: "tipo_trocado" });
      }
    }
  }
  return fora;
}

/**
 * Remove de um bullet os numerais sem lastro, preservando a frase.
 *
 * Por que remover em vez de retentar: retry custa uma chamada inteira (dobra
 * latência e preço) para corrigir um erro localizado, e não há garantia de que
 * a segunda resposta não fabrique em outro lugar. A remoção é determinística,
 * instantânea e preserva o conteúdo verdadeiro do bullet: "melhorando a
 * eficiência em 30%" vira "melhorando a eficiência", que continua sendo uma
 * afirmação sustentada pelo perfil. O bullet sem número é pior de ler e
 * honesto; com número inventado é melhor de ler e falso.
 */
export function removerNumeralSemLastro(bullet: string, numeral: string): string {
  const escapado = numeral.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    bullet
      // "em 30%", "de 30%", "by 30%", "in 30%" e o numeral solto. Troca por UM
      // espaco, nunca por vazio: apagar tambem o separador colaria as palavras
      // vizinhas ("do cliente" + "com" viravam "clientecom").
      .replace(
        new RegExp(`\\s*\\b(?:em|de|por|by|in|of|to)?\\s*${escapado}%?`, "i"),
        " ",
      )
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([.,;:])/g, "$1")
      .replace(/\s*,\s*\./g, ".")
      .trim()
  );
}
