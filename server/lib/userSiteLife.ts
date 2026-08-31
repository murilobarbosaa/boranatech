import { BADGE_CATALOG } from "../../shared/badges";
import { supabaseAdmin } from "./supabaseAdmin";
import { fetchUserLearningSources } from "./userContext/pool";

/**
 * A VIDA DE USO do usuario, para o modal do admin: o que a pessoa estudou,
 * conquistou e emitiu.
 *
 * O modal ja contava a vida COMERCIAL (assinatura, compras, influencer) e nada
 * do que a pessoa faz no produto. Este modulo responde a outra metade.
 *
 * TRES DECISOES QUE GOVERNAM O ARQUIVO:
 *
 * 1. ESTADO POR FONTE. Cada bloco do payload e `{...}` ou `{ indisponivel:
 *    true }`. Fonte caida NAO derruba as outras, e nao vira lista vazia: lista
 *    vazia significa "esta pessoa nao tem nada", que e o oposto de "nao
 *    consegui olhar". O pool ja separa os dois com `SourceResult`; aqui isso e
 *    preservado ate a tela.
 * 2. TETO COM RESTO NOMEADO. No maximo LIMITE_POR_LISTA itens, mais `mais: N`.
 *    Corte silencioso num painel de leitura ensina que a lista e completa.
 * 3. PRIVACIDADE DO CERTIFICADO. A tabela `certificates` carrega `holder_cpf`
 *    (not null) e `holder_name`, e a funcao vizinha `getCertificateByCode` LE
 *    os dois. Aqui o select e explicito e minimo (codigo, titulo, data), nunca
 *    `*`: um `select("*")` traria o CPF para dentro de um payload de admin sem
 *    ninguem pedir, e o teste anti-leak existe exatamente para travar isso.
 */

export const LIMITE_POR_LISTA = 10;

/** Fonte que nao respondeu. Estado NOMEADO, distinto de lista vazia. */
export type FonteIndisponivel = { indisponivel: true };

export type CertificadoDoUsuario = {
  codigo: string;
  titulo: string;
  emitidoEm: string | null;
};

export type BadgeDoUsuario = {
  /** Id CRU. O rotulo sai do catalogo compartilhado, resolvido no client. */
  badgeId: string;
  desbloqueadoEm: string | null;
};

export type RoadmapDoUsuario = {
  roadmapId: string;
  titulo: string | null;
  passosConcluidos: number;
  passosTotais: number | null;
  ultimaAtividadeEm: string | null;
};

export type TrilhaDoUsuario = {
  slug: string;
  titulo: string | null;
  itensConcluidos: number;
  ultimaAtividadeEm: string | null;
};

export type Lista<T> = { itens: T[]; mais: number };

export type VidaNoSite = {
  certificados: Lista<CertificadoDoUsuario> | FonteIndisponivel;
  badges: Lista<BadgeDoUsuario> | FonteIndisponivel;
  roadmaps: Lista<RoadmapDoUsuario> | FonteIndisponivel;
  trilhas: Lista<TrilhaDoUsuario> | FonteIndisponivel;
};

/** Aplica o teto e NOMEIA o resto. Nunca corta em silencio. */
function comTeto<T>(todos: T[]): Lista<T> {
  return {
    itens: todos.slice(0, LIMITE_POR_LISTA),
    mais: Math.max(0, todos.length - LIMITE_POR_LISTA),
  };
}

/**
 * Certificados VALIDOS do usuario.
 *
 * SELECT MINIMO E EXPLICITO. Os campos sao os tres que a tela mostra; o resto
 * da linha (holder_cpf, holder_name, syllabus, score, cert_score) nunca sai
 * daqui. Revogados ficam de fora: um certificado revogado listado como se
 * valesse seria pior que nao listar nada.
 */
async function certificadosDoUsuario(
  userId: string,
): Promise<Lista<CertificadoDoUsuario> | FonteIndisponivel> {
  try {
    const { data, error } = await supabaseAdmin
      .from("certificates")
      .select("code, roadmap_title, issued_at")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("issued_at", { ascending: false });
    if (error) throw error;
    const linhas = (data ?? []) as Array<{
      code: string;
      roadmap_title: string | null;
      issued_at: string | null;
    }>;
    return comTeto(
      linhas.map((l) => ({
        codigo: l.code,
        // TODO(Ana)
        titulo: l.roadmap_title ?? "Trilha sem título",
        emitidoEm: l.issued_at,
      })),
    );
  } catch (err) {
    console.warn(
      "[vida-no-site] falha ao ler certificados:",
      err instanceof Error ? err.message : String(err),
    );
    return { indisponivel: true };
  }
}

/** Ids do catalogo, para o server poder dizer o que NAO reconhece. */
export const BADGE_IDS_CONHECIDOS = new Set(BADGE_CATALOG.map((b) => b.id));

export async function montarVidaNoSite(userId: string): Promise<VidaNoSite> {
  // As tres fontes de aprendizado saem do pool (uma unica travessia); os
  // certificados tem lib propria e nao passam por la.
  const [aprendizado, certificados] = await Promise.all([
    fetchUserLearningSources(userId),
    certificadosDoUsuario(userId),
  ]);

  return {
    certificados,
    badges: aprendizado.badges.ok
      ? comTeto(
          aprendizado.badges.data.map((b) => ({
            badgeId: b.badgeId,
            desbloqueadoEm: b.unlockedAt,
          })),
        )
      : { indisponivel: true },
    roadmaps: aprendizado.roadmaps.ok
      ? comTeto(
          aprendizado.roadmaps.data.map((r) => ({
            roadmapId: r.roadmapId,
            titulo: r.title,
            passosConcluidos: r.completedSteps,
            passosTotais: r.totalSteps,
            ultimaAtividadeEm: r.lastActivityAt,
          })),
        )
      : { indisponivel: true },
    trilhas: aprendizado.courses.ok
      ? comTeto(
          aprendizado.courses.data.map((c) => ({
            slug: c.courseSlug,
            // Trilha estatica nao tem titulo no banco (ele vive no conteudo
            // estatico), entao ausencia aqui e normal, nao falha: o client cai
            // no slug, que e feio e verdadeiro.
            titulo: c.title ?? null,
            itensConcluidos: c.completedItems,
            ultimaAtividadeEm: c.lastActivityAt,
          })),
        )
      : { indisponivel: true },
  };
}
