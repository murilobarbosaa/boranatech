import { BADGE_CATALOG } from "@shared/badges";

/**
 * "Vida no site": o que a pessoa estudou, conquistou e emitiu.
 *
 * O modal contava a vida COMERCIAL (assinatura, compras, influencer) e nada da
 * vida de uso. Esta seção responde a outra metade.
 *
 * DUAS REGRAS QUE ELA HERDA DO PAYLOAD:
 *
 * 1. Fonte indisponível é VISÍVEL, nunca omitida. Sumir com o bloco faria a
 *    tela dizer "esta pessoa não tem certificados" sobre uma consulta que não
 *    respondeu, que é afirmar o que não se sabe.
 * 2. Resto NOMEADO. A lista tem teto no servidor, e o "e mais N" é o que
 *    impede a tela de parecer completa quando não é.
 *
 * VOCABULÁRIO VISUAL: emprestado inteiro do ActivityBlock, duas dobras acima no
 * mesmo modal. Título de bloco, pill de item, chip de contagem e caixa de vazio
 * saem de lá sem variação própria: duas seções vizinhas com duas gramáticas
 * seria a inconsistência que esta rodada veio corrigir.
 */

const ROTULO_DE_BADGE: Record<string, string> = Object.fromEntries(
  BADGE_CATALOG.map((b) => [b.id, b.name]),
);

/**
 * Resolver COM FALLBACK, no contrato da casa: badge nova no banco que o bundle
 * ainda não conhece aparece pelo id CRU, feio de propósito. Some-la esconderia
 * uma conquista real; inventar um nome seria pior.
 */
export function rotuloDeBadge(id: string): string {
  return ROTULO_DE_BADGE[id] ?? id;
}

type FonteIndisponivel = { indisponivel: true };
type Lista<T> = { itens: T[]; mais: number };

export type VidaNoSite = {
  certificados:
    | Lista<{ codigo: string; titulo: string; emitidoEm: string | null }>
    | FonteIndisponivel;
  badges:
    | Lista<{ badgeId: string; desbloqueadoEm: string | null }>
    | FonteIndisponivel;
  roadmaps:
    | Lista<{
        roadmapId: string;
        titulo: string | null;
        passosConcluidos: number;
        passosTotais: number | null;
        ultimaAtividadeEm: string | null;
      }>
    | FonteIndisponivel;
  trilhas:
    | Lista<{
        slug: string;
        titulo: string | null;
        itensConcluidos: number;
        ultimaAtividadeEm: string | null;
      }>
    | FonteIndisponivel;
};

function indisponivel(bloco: unknown): bloco is FonteIndisponivel {
  return Boolean(bloco && typeof bloco === "object" && "indisponivel" in bloco);
}

function lista<T>(bloco: Lista<T> | FonteIndisponivel | undefined): Lista<T> {
  return indisponivel(bloco) || !bloco ? { itens: [], mais: 0 } : bloco;
}

function data(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// Citação literal das classes do ActivityBlock. Ficam nomeadas para que uma
// mudança lá tenha um lugar só para acompanhar aqui.
const PILL =
  "flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-900 bg-white px-3 py-2";
const NOME = "break-words font-semibold text-slate-800";
const CHIP =
  "whitespace-nowrap rounded-full border-2 border-slate-900 bg-yellow-300 px-2 py-0.5 text-xs font-black";
const CARIMBO = "whitespace-nowrap text-xs font-black text-slate-500";
const VAZIO =
  "rounded-2xl border-2 border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-500";

function Bloco({
  titulo,
  testid,
  bloco,
  children,
}: {
  titulo: string;
  testid: string;
  bloco: unknown;
  children: React.ReactNode;
}) {
  return (
    <div data-testid={testid}>
      <p className="mb-2 font-display text-lg font-black text-slate-950">
        {titulo}
      </p>
      {indisponivel(bloco) ? (
        <p
          data-testid={`${testid}-indisponivel`}
          className="rounded-xl border-2 border-amber-400 bg-amber-50 p-2 text-xs font-bold text-amber-900"
        >
          {/* TODO(Ana) */}
          Não foi possível consultar agora.
        </p>
      ) : (
        children
      )}
    </div>
  );
}

function Resto({ mais }: { mais: number }) {
  if (mais <= 0) return null;
  return (
    <p
      data-testid="vida-resto"
      className="mt-2 text-xs font-bold text-slate-500"
    >
      {/* TODO(Ana) */}e mais {mais}
    </p>
  );
}

export function UserSiteLife({
  vida,
  loading,
  error,
}: {
  vida: VidaNoSite | null;
  loading?: boolean;
  error?: string | null;
}) {
  if (loading) {
    return (
      <p
        data-testid="vida-loading"
        className="text-sm font-bold text-slate-500"
      >
        {/* TODO(Ana) */}
        Carregando dados...
      </p>
    );
  }
  if (error) {
    return (
      <p
        data-testid="vida-erro"
        className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-black text-rose-800"
      >
        {error}
      </p>
    );
  }
  if (!vida) return null;

  const certificados = lista(vida.certificados);
  const badges = lista(vida.badges);
  const roadmaps = lista(vida.roadmaps);
  const trilhas = lista(vida.trilhas);

  // VAZIO DE VERDADE. Só quando as quatro responderam E não trouxeram nada: com
  // uma fonte fora do ar, "ainda não há atividade" seria mentira sobre o que
  // não se olhou.
  const algumaCaiu =
    indisponivel(vida.certificados) ||
    indisponivel(vida.badges) ||
    indisponivel(vida.roadmaps) ||
    indisponivel(vida.trilhas);
  const vazio =
    !algumaCaiu &&
    certificados.itens.length === 0 &&
    badges.itens.length === 0 &&
    roadmaps.itens.length === 0 &&
    trilhas.itens.length === 0;

  if (vazio) {
    return (
      <div
        data-testid="vida-vazio"
        className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500"
      >
        {/* TODO(Ana) */}
        Ainda não há atividade registrada no site.
      </div>
    );
  }

  // Roadmaps e Trilhas em cima: é a vida de estudo, o miolo da seção. O que a
  // pessoa emitiu e ganhou é consequência, e desce.
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Bloco titulo="Roadmaps" testid="vida-roadmaps" bloco={vida.roadmaps}>
        {roadmaps.itens.length === 0 ? (
          <div className={VAZIO}>
            {/* TODO(Ana) */}
            Nenhum roadmap iniciado.
          </div>
        ) : (
          <ul className="space-y-2">
            {roadmaps.itens.map((r) => (
              <li key={r.roadmapId} data-testid="vida-roadmap" className={PILL}>
                {/* TODO(Ana) */}
                <span className={NOME}>{r.titulo ?? "Roadmap sem título"}</span>
                <span className={CHIP}>
                  {/* TODO(Ana) */}
                  {r.passosConcluidos} de {r.passosTotais ?? "?"} passos
                </span>
              </li>
            ))}
          </ul>
        )}
        <Resto mais={roadmaps.mais} />
      </Bloco>

      <Bloco titulo="Trilhas" testid="vida-trilhas" bloco={vida.trilhas}>
        {trilhas.itens.length === 0 ? (
          <div className={VAZIO}>
            {/* TODO(Ana) */}
            Nenhuma trilha iniciada.
          </div>
        ) : (
          <ul className="space-y-2">
            {trilhas.itens.map((t) => (
              <li key={t.slug} data-testid="vida-trilha" className={PILL}>
                {/* O slug cru quando não há título: trilha estática guarda o
                    nome no conteúdo estático, então ausência aqui é normal. */}
                <span className={NOME}>{t.titulo ?? t.slug}</span>
                <span className={CHIP}>
                  {/* TODO(Ana) */}
                  {t.itensConcluidos} itens concluídos
                </span>
              </li>
            ))}
          </ul>
        )}
        <Resto mais={trilhas.mais} />
      </Bloco>

      <Bloco
        titulo="Certificados"
        testid="vida-certificados"
        bloco={vida.certificados}
      >
        {certificados.itens.length === 0 ? (
          <div className={VAZIO}>
            {/* TODO(Ana) */}
            Nenhum certificado emitido.
          </div>
        ) : (
          <ul className="space-y-2">
            {certificados.itens.map((c) => (
              <li
                key={c.codigo}
                data-testid="vida-certificado"
                className={PILL}
              >
                <span className={NOME}>{c.titulo}</span>
                <span className={CARIMBO}>
                  {c.codigo}
                  {data(c.emitidoEm) ? ` · ${data(c.emitidoEm)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Resto mais={certificados.mais} />
      </Bloco>

      <Bloco titulo="Conquistas" testid="vida-badges" bloco={vida.badges}>
        {badges.itens.length === 0 ? (
          <div className={VAZIO}>
            {/* TODO(Ana) */}
            Nenhuma conquista desbloqueada.
          </div>
        ) : (
          // Mesma anatomia do chip de contagem, fundo violeta: a diferença de
          // cor é o que separa "isto é um rótulo" de "isto é um número".
          <ul className="flex flex-wrap gap-1.5">
            {badges.itens.map((b) => (
              <li
                key={b.badgeId}
                data-testid="vida-badge"
                className="rounded-full border-2 border-slate-900 bg-violet-200 px-2 py-0.5 text-xs font-black"
              >
                {rotuloDeBadge(b.badgeId)}
              </li>
            ))}
          </ul>
        )}
        <Resto mais={badges.mais} />
      </Bloco>
    </div>
  );
}
