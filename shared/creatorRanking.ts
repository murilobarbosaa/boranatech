// RANKING MENSAL DOS CREATORS (lote 11): a regra de pontos, num lugar so.
//
// A regra e deliberadamente SIMPLES e PUBLICA: os creators veem esta tabela na
// propria tela ("Como pontuar"), lida daqui, nunca escrita duas vezes. Cada
// acao vale um numero inteiro, e o total do mes e a soma. Mudar um peso e
// trocar um numero aqui, sem migration: o banco so CONTA (a funcao
// `creator_ranking_counts` devolve as contagens brutas), e os pontos sao
// calculados no servidor por `calcularPontos`.
//
// O TETO DE CLIQUES POR DIA existe porque clique e o unico numero que uma
// pessoa infla sozinha (abrir o proprio link em loop), enquanto publicacao
// passa pela confirmacao do admin e venda passa pelo checkout. Hoje ainda ha a
// inflacao do `useAffiliate` montado tres vezes (hotfix pendente), e o teto
// segura essa tambem. O teto e aplicado no banco, por dia civil de Brasilia,
// porque o servidor so recebe o total do mes.
//
// So publicacao CONFIRMADA vale. Story nasce confirmado (nao tem link
// conferivel), entao conta no ato; o resto so depois que o admin confere.

import type { AvatarDeCreator } from "./creatorAvatar";
import type { TipoDePublicacao } from "./creatorPost";
import { TIPOS_POR_REDE } from "./creatorPost";
import type { RedeDeCreator } from "./creatorProfile";
import { ROTULO_DA_REDE } from "./creatorProfile";
import { ROTULO_DO_TIPO } from "./creatorPost";

/**
 * Pontos por publicacao confirmada, por rede e tipo. `Partial` porque cada
 * rede so tem os tipos de `TIPOS_POR_REDE`; o teste afirma que os dois mapas
 * cobrem EXATAMENTE os mesmos pares, para um tipo novo nao entrar valendo zero
 * em silencio.
 */
// Valores definidos pela Ana (set/2026), aplicados GENERICO por tipo sobre a
// estrutura por-rede do Murilo: Story = 1, Post = 3, Reel = 10 (video do TikTok
// pontua como reel; post do LinkedIn como post). Sem Live.
// TODO(Ana): decidir se mantem a distincao POR REDE (pesos diferentes por rede)
// ou fica generico como agora; por ora fica generico, como ela pediu.
export const PONTOS_POR_PUBLICACAO: Record<
  RedeDeCreator,
  Partial<Record<TipoDePublicacao, number>>
> = {
  instagram: { post: 3, reel: 10, story: 1 },
  tiktok: { video: 10 },
  linkedin: { post: 3 },
};

export const PONTOS_POR_VENDA = 25;
// Clique deixou de pontuar (decisao da Ana): continua REGISTRADO como metrica
// bruta (a coluna `cliques` segue vindo da funcao SQL e aparece no painel), mas
// nao entra no total. Peso zero em vez de remover a coluna pra nao mexer no banco.
export const PONTOS_POR_CLIQUE = 0;
/**
 * Cadastro pelo link (lote 11i): a conta nova que se cadastrou com o codigo
 * guardado no navegador. Entre o clique e a venda: e mais que curiosidade e
 * menos que dinheiro. Um por conta, para sempre (indice unico no banco).
 */
export const PONTOS_POR_CADASTRO = 8;
export const TETO_DE_CLIQUES_POR_DIA = 30;

/**
 * Teto diario de Story que pontua (Ana): so as 3 primeiras do dia valem.
 * ATENCAO: o teto de fato precisa ser aplicado na funcao SQL `creator_ranking_counts`
 * (como o teto de clique), o que exige migration. Esta constante e a fonte do
 * numero; a aplicacao no banco fica pendente.
 * TODO(Ana): aplicar o teto de story na funcao SQL (migration).
 */
export const TETO_DE_STORIES_POR_DIA = 3;

/**
 * Quantas horas depois de criada uma conta ainda conta como "cadastro pelo
 * link" (lote 11i). Existe para o link nao "adotar" contas antigas que so
 * passaram por ele depois: a atribuicao e do primeiro acesso autenticado da
 * conta nova, e uma conta de meses nao e um cadastro.
 */
export const JANELA_DE_CADASTRO_HORAS = 48;

/**
 * Primeiro mes com ranking: o mes do primeiro `creators.granted_at` em
 * producao (2026-07-16, conferido em 2026-09-20). Mes anterior a este nao tem
 * o que mostrar, e a rota recusa com o mesmo 400 do mes futuro.
 */
export const PRIMEIRO_MES_DO_RANKING = "2026-07";

/**
 * Data de FECHAMENTO exibida na contagem regressiva ("Fecha em X dias"), em dia
 * civil de Brasilia (AAAA-MM-DD, o ultimo dia que ainda conta). A Ana definiu
 * 22/10/2026. Antes disso o `fecha_em` usava o fim do mes corrente, o que dava
 * "Fecha em 10 dias" no fim de setembro.
 *
 * ATENCAO (decisao pendente): o ranking e MENSAL (cada mes tem o seu), e uma data
 * fixa unica nao se encaixa nesse modelo depois que ela passa. Isto corrige o
 * numero mostrado agora, mas so faz sentido se o ranking for uma COMPETICAO unica
 * que termina nessa data.
 * TODO(Ana): confirmar se e competicao unica (fecha 22/10 e acabou) ou por mes.
 */
export const DIA_DE_FECHAMENTO_DO_RANKING = "2026-10-22";

/** Segundos que o servidor guarda um mes calculado. Atrasar um minuto e aceitavel. */
export const CACHE_DO_RANKING_SEGUNDOS = 60;

/**
 * Contagens brutas de um creator no mes, na forma em que a funcao SQL
 * `creator_ranking_counts` devolve. Os cliques ja chegam com o teto diario
 * aplicado.
 */
export type ContagensDoRanking = {
  ig_posts: number;
  reels: number;
  stories: number;
  videos: number;
  li_posts: number;
  vendas: number;
  cliques: number;
  /** Cadastros pelo link no mes (lote 11i). */
  cadastros: number;
};

export const CONTAGENS_ZERADAS: ContagensDoRanking = {
  ig_posts: 0,
  reels: 0,
  stories: 0,
  videos: 0,
  li_posts: 0,
  vendas: 0,
  cliques: 0,
  cadastros: 0,
};

/** Peso de um par (rede, tipo); zero para um par que a regra nao conhece. */
function pesoDaPublicacao(rede: RedeDeCreator, tipo: TipoDePublicacao): number {
  return PONTOS_POR_PUBLICACAO[rede][tipo] ?? 0;
}

/** Total de publicacoes confirmadas, sem peso (para o desempate e a tela). */
export function totalDePublicacoes(c: ContagensDoRanking): number {
  return c.ig_posts + c.reels + c.stories + c.videos + c.li_posts;
}

/**
 * Pontos do mes a partir das contagens. Cada coluna da funcao SQL e um par
 * (rede, tipo) fixo, e e ESTE mapeamento que liga a coluna ao peso: mudar uma
 * coluna la sem mudar aqui e o que o teste de `calcularPontos` pega.
 */
export function calcularPontos(c: ContagensDoRanking): number {
  return (
    c.ig_posts * pesoDaPublicacao("instagram", "post") +
    c.reels * pesoDaPublicacao("instagram", "reel") +
    c.stories * pesoDaPublicacao("instagram", "story") +
    c.videos * pesoDaPublicacao("tiktok", "video") +
    c.li_posts * pesoDaPublicacao("linkedin", "post") +
    c.vendas * PONTOS_POR_VENDA +
    c.cadastros * PONTOS_POR_CADASTRO +
    c.cliques * PONTOS_POR_CLIQUE
  );
}

/**
 * Detalhamento de ONDE vem a pontuacao, para explicar o total na tela sem
 * duplicar a regra. `conteudo` sai como o RESTO (total menos vendas e cadastros),
 * entao a soma dos tres fecha EXATAMENTE o total, e o clique aparece so como
 * contagem bruta (peso zero: nao entra no total). Reusa o mesmo total
 * autoritativo (`pontos`) e as mesmas constantes, sem recalcular a formula.
 */
export interface DetalheDaPontuacao {
  conteudo: number;
  vendas: number;
  cadastros: number;
  total: number;
  /** Contagem BRUTA de cliques: exibida como metrica, NAO soma ponto. */
  cliques: number;
}

export function detalharPontuacao(entrada: {
  pontos: number;
  vendas: number;
  cadastros: number;
  cliques: number;
}): DetalheDaPontuacao {
  const vendas = entrada.vendas * PONTOS_POR_VENDA;
  const cadastros = entrada.cadastros * PONTOS_POR_CADASTRO;
  // O que sobra do total depois de vendas e cadastros e o conteudo (o clique
  // vale zero, entao nao aparece no total). Deriva do total autoritativo.
  const conteudo = entrada.pontos - vendas - cadastros;
  return {
    conteudo,
    vendas,
    cadastros,
    total: entrada.pontos,
    cliques: entrada.cliques,
  };
}

/** Uma linha da tabela "Como pontuar", gerada da regra (nunca escrita a mao). */
export type LinhaDaTabelaDePontos = {
  chave: string;
  acao: string;
  pontos: number;
};

/**
 * A tabela publica da regra, na ordem em que a tela mostra: publicacoes por
 * rede e tipo (na ordem de `TIPOS_POR_REDE`), depois venda, depois clique.
 * Os rotulos vem dos mesmos mapas do resto do painel.
 */
export function tabelaDePontos(): LinhaDaTabelaDePontos[] {
  const linhas: LinhaDaTabelaDePontos[] = [];
  (Object.keys(TIPOS_POR_REDE) as RedeDeCreator[]).forEach((rede) => {
    TIPOS_POR_REDE[rede].forEach((tipo) => {
      linhas.push({
        chave: `${rede}:${tipo}`,
        // TODO(Ana)
        acao: `${ROTULO_DO_TIPO[tipo]} no ${ROTULO_DA_REDE[rede]} confirmado`,
        pontos: pesoDaPublicacao(rede, tipo),
      });
    });
  });
  // TODO(Ana)
  linhas.push({
    chave: "venda",
    acao: "Venda pelo cupom",
    pontos: PONTOS_POR_VENDA,
  });
  // TODO(Ana)
  linhas.push({
    chave: "cadastro",
    acao: "Cadastro pelo seu link",
    pontos: PONTOS_POR_CADASTRO,
  });
  // Clique NAO entra na tabela "Como pontuar": deixou de valer ponto (decisao da
  // Ana). Continua contado como metrica bruta e aparece nas contagens, mas nao e
  // uma forma de GANHAR ponto.
  return linhas;
}

// ---------------------------------------------------------------------------
// A RESPOSTA DO RANKING, compartilhada entre a rota e a tela.

/** Uma posicao do ranking. O que sai de OUTRA pessoa e o mesmo que o calendario
 * ja expoe (nome, @, avatar e cor), nada alem. */
export type PosicaoDoRanking = {
  posicao: number;
  user_id: string;
  name: string | null;
  handle: string | null;
  /** A rede do @ mostrado (a primeira cadastrada no perfil de creator), ou
   * null quando o @ e o da conta e nao de uma rede. */
  rede_do_handle: RedeDeCreator | null;
  /** Alias de `avatar.avatar_url` (lote 11b), para o client anterior. */
  avatar_url: string | null;
  /** O avatar como o site o desenha (lote 11b). Opcional pela janela de
   * deploy: o backend anterior nao manda. */
  avatar?: AvatarDeCreator;
  calendar_color: string;
  pontos: number;
  contagens: {
    publicacoes: number;
    vendas: number;
    cliques: number;
    /** Ausente no backend anterior ao lote 11i. */
    cadastros?: number;
  };
  /** Se esta linha e a de quem esta olhando. */
  eu: boolean;
  /**
   * Lote 11j: num mes FECHADO, quem saiu do programa depois de pontuar
   * continua na lista, marcado. Ausente no backend anterior ao lote e sempre
   * false no mes corrente (a lista do mes corrente e so de quem esta no
   * programa).
   */
  saiu_do_programa?: boolean;
};

export type RankingDoMes = {
  /** `AAAA-MM`. */
  mes: string;
  fechado: boolean;
  /** ISO da meia-noite de Brasilia do dia 1 do mes seguinte; null se fechado. */
  fecha_em: string | null;
  posicoes: PosicaoDoRanking[];
  /** A linha do viewer, ou null se ele nao e creator ativo. */
  minha_posicao: PosicaoDoRanking | null;
};

/** O que a ordenacao precisa saber de cada creator, antes de virar posicao. */
export type CandidatoDoRanking = {
  user_id: string;
  pontos: number;
  vendas: number;
  publicacoes: number;
  /** `creators.granted_at`, ISO. Quem entrou antes ganha o desempate final. */
  granted_at: string;
};

/**
 * Desempate, nesta ordem: pontos, vendas, publicacoes confirmadas, quem entrou
 * no programa antes. Nao ha posicao compartilhada: o `granted_at` e unico o
 * bastante (timestamp com microssegundos), e o `user_id` fecha o caso teorico
 * de dois iguais, para a ordem ser a mesma em toda chamada.
 */
export function compararCandidatos(
  a: CandidatoDoRanking,
  b: CandidatoDoRanking,
): number {
  if (a.pontos !== b.pontos) return b.pontos - a.pontos;
  if (a.vendas !== b.vendas) return b.vendas - a.vendas;
  if (a.publicacoes !== b.publicacoes) return b.publicacoes - a.publicacoes;
  if (a.granted_at !== b.granted_at)
    return a.granted_at < b.granted_at ? -1 : 1;
  return a.user_id < b.user_id ? -1 : a.user_id > b.user_id ? 1 : 0;
}

/**
 * O `AAAA-MM` de um dia civil `AAAA-MM-DD`. Recorte, sem `new Date()`: a
 * string ja e o dia.
 */
export function mesDoDia(dia: string): string {
  return dia.slice(0, 7);
}

/**
 * O mes anterior e o seguinte de um `AAAA-MM`, para o seletor da tela e para
 * o `fecha_em` da rota. Mes invalido LANCA: um seletor apontando para um mes
 * errado desenha uma tela plausivel e errada.
 */
export function mesVizinho(mes: string, passo: -1 | 1): string {
  const casou = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!casou) throw new Error(`mesVizinho: mes invalido ("${mes}")`);
  const ano = Number(casou[1]);
  const m = Number(casou[2]);
  if (m < 1 || m > 12) throw new Error(`mesVizinho: mes invalido ("${mes}")`);
  const total = ano * 12 + (m - 1) + passo;
  const anoNovo = Math.floor(total / 12);
  const mesNovo = (total % 12) + 1;
  return `${anoNovo}-${String(mesNovo).padStart(2, "0")}`;
}

/** Se `mes` (AAAA-MM) esta na faixa [PRIMEIRO_MES_DO_RANKING, mesAtual]. */
export function mesTemRanking(mes: string, mesAtual: string): boolean {
  return mes >= PRIMEIRO_MES_DO_RANKING && mes <= mesAtual;
}
