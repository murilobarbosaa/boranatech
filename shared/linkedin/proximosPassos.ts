import type { LinkedinLevel } from "./schema";

/**
 * Recomendação de projetos e cursos depois da análise de LinkedIn.
 *
 * O QUE ELA SUBSTITUI: `filter(areaSlug === area).slice(0, 3)`. Só a área. O
 * resultado, medido no perfil real: CS50x de Harvard para quem tem Harvard na
 * formação lida pela própria ferramenta, três cursos "Iniciante" para um perfil
 * Pleno, três projetos "Avançado" ao mesmo tempo, e nada ligado às tecnologias
 * que a análise acabou de apontar como faltando.
 *
 * NÃO TOCA A NOTA. Nenhum check lê nada daqui, e nada daqui entra em
 * `computeLinkedinScore`. É camada de recomendação, sobre o determinístico já
 * calculado.
 *
 * Função pura, sem IO: recebe a pool como argumento. Isso mantém `shared/` sem
 * dependência de `client/src/lib/data.ts` e deixa o algoritmo testável com pool
 * sintética.
 */

export type NivelPool = "Iniciante" | "Intermediário" | "Avançado";

export interface CursoPool {
  id: string;
  titulo: string;
  canal: string;
  link: string;
  areaSlug: string;
  nivel: string;
  descricao?: string;
  oQueAprende?: string[];
}

export interface ProjetoPool {
  id: string;
  nome: string;
  areaSlug: string;
  nivel: string;
  objetivo: string;
  ferramentas: string[];
  pro?: boolean;
}

export interface ContextoRecomendacao {
  area: string;
  nivelUsuario: LinkedinLevel;
  /**
   * Tecnologias-chave da área SEM evidência no perfil, de
   * `deterministic.keywordsCampos`. São as lacunas reais, já calculadas.
   */
  lacunas: string[];
  /**
   * Texto contra o qual deduplicar: formação, certificações, headline e
   * competências do perfil. Vem de `deterministic.perfilDedup`, persistido, e
   * por isso a mesma análise reaberta deduplica igual.
   */
  textoPerfil: string;
  /**
   * Tecnologias-chave da área, TODAS (de `keywordsCampos`), provadas ou não.
   *
   * Não é para pontuar: é para EXCLUIR do dedup. Canal de curso às vezes tem
   * nome de tecnologia dentro ("javascript.info", "Django Software
   * Foundation"), e sem esta lista o curso era barrado só porque o perfil
   * escreve a stack. Medido: era a causa dos 2 únicos falsos positivos em 160
   * pares.
   */
  tecnologiasDaArea: string[];
  /** Semente estável da análise. Mesma análise, mesma ordem. */
  seed: string;
  isPro: boolean;
}

export interface Recomendado<T> {
  item: T;
  /** Uma linha dizendo por que este item, e não outro. */
  motivo: string;
  /** Lacunas da análise que este item cobre. Vazio = recomendado só por nível. */
  cobre: string[];
}

export const MAX_ITENS = 3;

const ESCADA: NivelPool[] = ["Iniciante", "Intermediário", "Avançado"];

/**
 * Nível da pool alvo por nível declarado no formulário.
 *
 * `transicao` vai para Iniciante de propósito: quem troca de área é iniciante
 * NA ÁREA NOVA, por mais sênior que seja na antiga.
 */
const NIVEL_ALVO: Record<LinkedinLevel, NivelPool> = {
  estagio: "Iniciante",
  trainee: "Iniciante",
  junior: "Iniciante",
  transicao: "Iniciante",
  pleno: "Intermediário",
  freelancer: "Intermediário",
};

function semAcento(valor: string): string {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Hash estável e barato. Mesma entrada, mesma saída, sempre. */
function hashEstavel(valor: string): number {
  let h = 2166136261;
  for (let i = 0; i < valor.length; i += 1) {
    h ^= valor.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function contemTermo(texto: string, termo: string): boolean {
  const t = semAcento(termo).trim();
  if (t.length === 0) return false;
  const escapado = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#])${escapado}([^a-z0-9+#]|$)`).test(
    semAcento(texto),
  );
}

/**
 * Tokens que identificam um curso como CREDENCIAL, para deduplicar contra o
 * perfil.
 *
 * Deliberadamente NÃO usa nome de tecnologia. "React" no perfil não quer dizer
 * que a pessoa fez um curso de React, e recusar todo curso de React a quem
 * escreveu React seria recusar exatamente quem quer se aprofundar. O que
 * identifica uma credencial é a INSTITUIÇÃO (canal) e a sigla do programa
 * (CS50, ITIL), não a stack.
 *
 * Token mínimo de 4 caracteres: siglas de 3 ("AWS", "DIO") aparecem em perfil
 * por uso da ferramenta, não por ter feito o curso.
 */
// Sem `\p{L}` porque o target do tsconfig nao aceita a flag `u`. A classe
// negada cobre o que interessa: qualquer coisa que nao seja letra sem acento,
// letra acentuada comum em PT, ou digito, e separador.
const SEPARADOR = /[^A-Za-zÀ-ÿ0-9]+/;

/**
 * Palavra de canal que aparece em perfil de tecnologia por mil outros motivos.
 * "Django Software Foundation" não pode barrar quem escreveu "Software
 * Developer" na headline.
 */
const GENERICO = new Set([
  "software", "foundation", "academy", "school", "escola", "curso", "cursos",
  "online", "digital", "tech", "learning", "education", "project", "projeto",
  "developer", "development", "code", "coding", "program", "cloud", "data",
  "dados", "brasil", "brazil", "university", "universidade", "institute",
  "instituto", "centro", "center", "training", "video", "canal", "channel",
]);

export function tokensDeCredencial(
  curso: CursoPool,
  tecnologiasDaArea: string[] = [],
): string[] {
  const techs = new Set(tecnologiasDaArea.map(semAcento));
  const out = new Set<string>();
  for (const bruto of curso.canal.split(SEPARADOR)) {
    const t = semAcento(bruto);
    if (t.length >= 4 && !GENERICO.has(t) && !techs.has(t)) out.add(t);
  }
  // Do título, só CÓDIGO DE PROGRAMA: token com dígito, como CS50 ou CS50x.
  //
  // A primeira versão também aceitava token em caixa alta, para pegar ITIL e
  // LGPD. Medido: isso barrava "Crie um Site Simples Usando HTML, CSS e
  // JavaScript" porque "HTML" é caixa alta e o perfil escreve HTML. HTML é
  // stack, não credencial, e a regra estava contradizendo o próprio princípio
  // acima. Sigla em caixa alta sem dígito volta a ser dedupada só pelo canal.
  for (const bruto of curso.titulo.split(SEPARADOR)) {
    if (bruto.length >= 4 && /\d/.test(bruto)) out.add(semAcento(bruto));
  }
  return Array.from(out);
}

/** Token que casou, ou null. Null = a pessoa não tem esta credencial. */
export function credencialJaNoPerfil(
  curso: CursoPool,
  textoPerfil: string,
  tecnologiasDaArea: string[] = [],
): string | null {
  for (const token of tokensDeCredencial(curso, tecnologiasDaArea)) {
    if (contemTermo(textoPerfil, token)) return token;
  }
  return null;
}

interface Pontuado<T> {
  item: T;
  cobre: string[];
  nivel: NivelPool;
  pontos: number;
  desempate: number;
}

function nivelDe(valor: string): NivelPool | null {
  return (ESCADA as string[]).includes(valor) ? (valor as NivelPool) : null;
}

/**
 * Escolhe até `MAX_ITENS`, com coerência de nível declarada.
 *
 * NÍVEL É PARTIÇÃO, RELEVÂNCIA É ORDEM DENTRO DELA. Primeiro tudo do nível
 * alvo, ordenado por lacuna coberta. Se faltar, e só se faltar, completa com UM
 * degrau vizinho: o de cima quando existe material lá, senão o de baixo. Um
 * degrau só, nunca os dois, então Iniciante jamais divide bloco com Avançado.
 * O item completado carrega isso no motivo, em vez de a mistura aparecer sem
 * explicação.
 *
 * Por que cima antes de baixo: material acima do nível é desafio, material
 * abaixo é revisão. Para quem está montando perfil, desafio rende mais. Descer
 * existe porque bloco vazio é pior que bloco fácil: área cuja pool só tem
 * Iniciante não pode simplesmente não recomendar nada a um Pleno.
 */
function escolher<T>(
  candidatos: Pontuado<T>[],
  alvo: NivelPool,
): { escolhido: Pontuado<T>; completado: boolean }[] {
  const ordenar = (a: Pontuado<T>, b: Pontuado<T>) =>
    b.pontos - a.pontos || a.desempate - b.desempate;
  const doNivel = (n: NivelPool | undefined) =>
    n ? candidatos.filter((c) => c.nivel === n).sort(ordenar) : [];
  const saida = doNivel(alvo)
    .slice(0, MAX_ITENS)
    .map((escolhido) => ({ escolhido, completado: false }));
  if (saida.length >= MAX_ITENS) return saida;
  const i = ESCADA.indexOf(alvo);
  const acima = doNivel(ESCADA[i + 1]);
  const vizinhos = acima.length > 0 ? acima : doNivel(ESCADA[i - 1]);
  for (const escolhido of vizinhos.slice(0, MAX_ITENS - saida.length)) {
    saida.push({ escolhido, completado: true });
  }
  return saida;
}

function motivoDe(
  cobre: string[],
  nivel: NivelPool,
  alvo: NivelPool,
  completado: boolean,
): string {
  if (cobre.length > 0) {
    const lista =
      cobre.length === 1
        ? cobre[0]
        : `${cobre.slice(0, -1).join(", ")} e ${cobre[cobre.length - 1]}`;
    const nota = completado
      ? ` Nível ${nivel}, um degrau ao lado do seu, porque faltou material de ${alvo} nesta área.`
      : "";
    return `Cobre ${lista}, que a análise apontou como ausente no seu perfil.${nota}`;
  }
  return completado
    ? `Nível ${nivel}: faltou material de ${alvo} nesta área, então completamos com o degrau vizinho.`
    : `Nível ${nivel}, alinhado ao momento de carreira que você informou.`;
}

function pontuar<T>(
  item: T,
  texto: string,
  nivelBruto: string,
  lacunas: string[],
  alvo: NivelPool,
  chave: string,
  seed: string,
): Pontuado<T> | null {
  const nivel = nivelDe(nivelBruto);
  if (!nivel) return null;
  const cobre = lacunas.filter((tech) => contemTermo(texto, tech));
  return {
    item,
    cobre,
    nivel,
    // 3 por lacuna coberta domina o desempate por nível: relevância primeiro,
    // adequação de nível depois. O sorteio estável só decide empate real.
    pontos: cobre.length * 3 + (nivel === alvo ? 1 : 0),
    // Semente ANTES da chave. Medido: com a chave na frente, sementes que
    // diferem so no ultimo caractere ("analise-1", "analise-2") produziam a
    // MESMA ordem, porque a avalanche do FNV-1a mal alcancava o prefixo. Com a
    // semente na frente, ela perturba o estado inicial de todos os itens.
    desempate: hashEstavel(`${seed}:${chave}`),
  };
}

export function recomendarCursos(
  pool: CursoPool[],
  ctx: ContextoRecomendacao,
): Recomendado<CursoPool>[] {
  const alvo = NIVEL_ALVO[ctx.nivelUsuario];
  const candidatos = pool
    .filter((c) => c.areaSlug === ctx.area)
    .filter(
      (c) =>
        credencialJaNoPerfil(c, ctx.textoPerfil, ctx.tecnologiasDaArea) === null,
    )
    .map((c) =>
      pontuar(
        c,
        `${c.titulo} ${c.descricao ?? ""} ${(c.oQueAprende ?? []).join(" ")}`,
        c.nivel,
        ctx.lacunas,
        alvo,
        c.id,
        ctx.seed,
      ),
    )
    .filter((c): c is Pontuado<CursoPool> => c !== null);
  return escolher(candidatos, alvo).map(({ escolhido, completado }) => ({
    item: escolhido.item,
    cobre: escolhido.cobre,
    motivo: motivoDe(escolhido.cobre, escolhido.nivel, alvo, completado),
  }));
}

export function recomendarProjetos(
  pool: ProjetoPool[],
  ctx: ContextoRecomendacao,
): Recomendado<ProjetoPool>[] {
  const alvo = NIVEL_ALVO[ctx.nivelUsuario];
  // Projeto NÃO é deduplicado contra o perfil, e é decisão, não esquecimento:
  // projeto de prática não é credencial, ninguém "já tem" um exercício. O que
  // o perfil informa sobre projeto é a stack, e a stack já entra pela pontuação
  // de lacuna.
  const candidatos = pool
    .filter((p) => p.areaSlug === ctx.area && (p.pro !== true || ctx.isPro))
    .map((p) =>
      pontuar(
        p,
        `${p.nome} ${p.objetivo} ${p.ferramentas.join(" ")}`,
        p.nivel,
        ctx.lacunas,
        alvo,
        p.id,
        ctx.seed,
      ),
    )
    .filter((p): p is Pontuado<ProjetoPool> => p !== null);
  return escolher(candidatos, alvo).map(({ escolhido, completado }) => ({
    item: escolhido.item,
    cobre: escolhido.cobre,
    motivo: motivoDe(escolhido.cobre, escolhido.nivel, alvo, completado),
  }));
}
