/**
 * Régua de medição: uma tecnologia sem lastro está dentro de moldura de
 * aprendizado, ou é afirmação de experiência?
 *
 * DESDE O LOTE 5 DA FASE 2 ISTO É CÓDIGO DE PRODUTO. Até então nada em
 * `server/` ou `client/` importava este arquivo e quem usava era só o harness
 * de fidelidade, que vive fora do repositório; agora
 * `server/lib/linkedinLastroProsa.ts` chama `enquadramentoDeTermo` para separar
 * afirmação de aspiração antes de acusar violação em prosa. Consequência
 * prática: mudar um marcador daqui muda o que chega ao usuário, não só o
 * placar de uma medição. Continua morando em `shared/` e com teste próprio,
 * porque a régua é o que decide se uma medição reprova, e régua sem teste foi
 * exatamente o problema que originou esta auditoria.
 *
 * Por que existe (docs/tecnologia-aspiracional-sobre.md): em duas medições de
 * 30 execuções, todas as 5 ocorrências de "tecnologia sem lastro no
 * sobreReescrito" estavam dentro de moldura explícita ("estou estudando
 * Python", "tenho interesse em aprender React"). Isso é honesto, é o conselho
 * que a plataforma dá a quem está em transição, e a régua antiga contava como
 * violação. O placar não convergia porque media a coisa errada.
 *
 * A régua nova não desliga a detecção: ela SEPARA. Afirmação de experiência sem
 * lastro ("domino Kubernetes e Terraform" num perfil que não os comprova)
 * continua sendo violação, e é o caso que o teste positivo cobre.
 */

/**
 * Marcadores de moldura de aprendizado ou interesse, PT e EN.
 *
 * A lista é deliberadamente conservadora: marcador ausente classifica como
 * afirmação, que é o lado seguro. Um falso positivo aqui INFLA o placar, não o
 * esconde, e é preferível a uma régua que absolve por engano.
 */
const MARCADORES = [
  // português
  "estou estudando",
  "venho estudando",
  "estudando",
  "quero aprender",
  "pretendo aprender",
  "busco aprender",
  "buscando aprender",
  "aprendendo",
  "em aprendizado",
  "tenho interesse em",
  "interesse em aprender",
  "me aprofundando",
  "comecando a estudar",
  "comecei a estudar",
  "em transicao para",
  "proximos passos",
  // inglês
  "currently learning",
  "learning",
  "studying",
  "want to learn",
  "interested in learning",
  "interested in",
  "looking to learn",
  "next step",
];

function semAcento(valor: string): string {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Frase que contém o termo, ou string vazia se ele não aparecer. */
export function fraseComTermo(texto: string, termo: string): string {
  const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${escapado}\\b`, "i");
  return (texto.split(/(?<=[.!?])\s+/).find((f) => re.test(f)) ?? "").trim();
}

export type Enquadramento = "moldura" | "afirmacao" | "ausente";

/**
 * Classifica uma tecnologia dentro de um texto.
 *
 * - `ausente`: o termo não aparece no texto.
 * - `moldura`: o termo aparece DEPOIS de um marcador de aprendizado, na mesma
 *   frase.
 * - `afirmacao`: qualquer outro caso, inclusive termo antes do marcador na
 *   mesma frase ("domino Kubernetes e estou estudando Terraform" classifica
 *   Kubernetes como afirmação e Terraform como moldura).
 *
 * Limites conhecidos, não resolvidos e não escondidos:
 *   - negação ("não estou estudando Python") lê como moldura;
 *   - marcador na frase anterior ("Estou em transição. Python é o próximo.")
 *     lê como afirmação;
 *   - moldura invertida ("React, que estou estudando") lê como afirmação.
 * Os três erram para o lado de contar violação a mais, nunca a menos.
 */
export function enquadramentoDeTermo(
  texto: string,
  termo: string,
): Enquadramento {
  const frase = fraseComTermo(texto, termo);
  if (frase.length === 0) return "ausente";
  const f = semAcento(frase);
  const escapado = semAcento(termo).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const posTermo = f.search(new RegExp(`\\b${escapado}\\b`));
  if (posTermo < 0) return "afirmacao";
  for (const marcador of MARCADORES) {
    const posMarcador = f.indexOf(semAcento(marcador));
    if (posMarcador >= 0 && posMarcador < posTermo) return "moldura";
  }
  return "afirmacao";
}
