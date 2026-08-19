/**
 * Costura do texto depois de remover uma tecnologia sem lastro.
 *
 * O lastro acerta o VEREDITO (o que sai e o que fica) e errava o TEXTO. Os tres
 * casos medidos na investigacao da Fase 2, todos visiveis ao usuario:
 *
 *   1. "Desenvolvi telas em React com Kubernetes no pipeline de deploy."
 *      virava "... em React com no pipeline ...", com o conectivo orfao;
 *   2. "Front-end | Kubernetes, React | foco em produto"
 *      virava "Front-end |, React | ...", com separador colado em pontuacao;
 *   3. "Dev | Angular | foco" virava "Dev| foco", com o separador engolido.
 *
 * Duas camadas, as duas DENTRO do removedor, para que nenhum call site precise
 * lembrar de limpar depois (a regra de "protecao dentro da funcao" do
 * CLAUDE.md: guarda no chamador some no primeiro chamador que alguem esquece):
 *
 *   CAMADA 1, remocao consciente: tira junto o separador de lista adjacente e,
 *   quando o termo e objeto de um conectivo simples que ficaria orfao, tira o
 *   conectivo tambem;
 *   CAMADA 2, `normalizarPontuacao`: funcao pura que arruma o que sobrou.
 *
 * O que este modulo NAO tenta ser: gramatica. Ele trata os padroes que o lastro
 * de fato produz (lista separada por virgula ou pipe, e conectivo simples antes
 * do termo). Qualquer coisa alem disso e um parser de portugues, que e
 * exatamente a classe de instrumento que falha em silencio.
 */

/** Espaco horizontal. NAO casa \r nem \n: CRLF do conteudo e preservado. */
const H = "[^\\S\\r\\n]";

/**
 * Conectivos simples que o texto do lastro produz antes de uma tecnologia.
 * Lista curta de proposito: sao os que aparecem em "feito COM X", "escrito EM
 * X", "uso DE X" e "A E X".
 */
const CONECTIVOS = ["com", "em", "de", "e"];

/**
 * Palavras que, vindo logo depois do termo removido, deixam o conectivo orfao.
 * Sao preposicoes e conjuncoes: "com <termo> no pipeline" sem o termo vira
 * "com no pipeline", que e a frase quebrada do caso 1.
 */
const DEIXAM_ORFAO = [
  "no",
  "na",
  "nos",
  "nas",
  "em",
  "do",
  "da",
  "dos",
  "das",
  "de",
  "para",
  "por",
  "pelo",
  "pela",
  "com",
  "e",
  "ou",
];

function escapar(termo: string): string {
  return termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * CAMADA 2. Arruma a pontuacao de um texto ja editado.
 *
 * Regras, todas observaveis:
 *   - nunca dois separadores seguidos (",,", "| |", "|,", ", |"); quando um
 *     pipe encontra uma virgula sobra o PIPE, porque ele separa secoes e a
 *     virgula so separa itens dentro de uma;
 *   - pipe sempre com um espaco de cada lado;
 *   - nunca separador no comeco nem no fim;
 *   - nunca espaco antes de ".", ",", ";" ou ":";
 *   - nunca espaco horizontal duplo.
 *
 * O resto passa byte a byte, inclusive quebras de linha e CRLF: todos os
 * regexes deste arquivo usam espaco HORIZONTAL, nunca `\s`, justamente porque
 * `\s` come `\r` e `\n` e transformaria um texto de varias linhas em uma so.
 */
export function normalizarPontuacao(texto: string): string {
  return (
    texto
      // Corrida de separadores vira um so. Pipe manda na virgula.
      .replace(new RegExp(`([|,])(?:${H}*[|,])+`, "g"), (corrida) =>
        corrida.includes("|") ? "|" : ",",
      )
      // Pipe com exatamente um espaco de cada lado.
      .replace(new RegExp(`${H}*\\|${H}*`, "g"), " | ")
      // Separador solto no comeco e no fim.
      .replace(new RegExp(`^${H}*[|,]${H}*`), "")
      .replace(new RegExp(`${H}*[|,]${H}*$`), "")
      .replace(new RegExp(`${H}+([.,;:])`, "g"), "$1")
      .replace(new RegExp(`${H}{2,}`, "g"), " ")
      .replace(new RegExp(`^${H}+`), "")
      .replace(new RegExp(`${H}+$`), "")
  );
}

/**
 * CAMADA 1 mais CAMADA 2. Substitui `removerTermoSemLastro` nos call sites do
 * lastro: mesmo veredito, texto costurado.
 *
 * ORDEM das regras, e o porque de cada uma:
 *   1. conectivo orfao primeiro, porque ele precisa enxergar o termo ainda no
 *      lugar para saber o que vem depois;
 *   2. virgula DEPOIS do termo antes de qualquer outra: e o que separa itens
 *      dentro de uma secao, e comer o pipe da esquerda no lugar dela juntaria
 *      duas secoes ("Front-end | Kubernetes, React" viraria "Front-end,
 *      React", que muda o sentido da headline);
 *   3. virgula ANTES, depois pipe antes, depois pipe depois;
 *   4. termo solto, quando nao ha separador nenhum em volta.
 */
export function removerTermoComCostura(texto: string, termo: string): string {
  const T = `\\b${escapar(termo)}\\b`;
  const orfao = new RegExp(
    `\\b(?:${CONECTIVOS.join("|")})${H}+${T}(?=${H}+(?:${DEIXAM_ORFAO.join("|")})\\b|${H}*[.,;:|]|${H}*$)`,
    "gi",
  );

  const regras = [
    orfao,
    new RegExp(`${T}${H}*,${H}*`, "gi"),
    new RegExp(`${H}*,${H}*${T}`, "gi"),
    new RegExp(`${H}*\\|${H}*${T}`, "gi"),
    new RegExp(`${T}${H}*\\|${H}*`, "gi"),
    new RegExp(`${H}*${T}${H}*`, "gi"),
  ];

  let saida = texto;
  for (const regra of regras) {
    // Cada regra tenta so onde a anterior nao alcancou. A ultima varre o que
    // sobrou, entao nenhuma ocorrencia do termo escapa da remocao: o veredito
    // do lastro continua sendo o mesmo de antes desta mudanca.
    saida = saida.replace(regra, " ");
  }
  return normalizarPontuacao(saida);
}
