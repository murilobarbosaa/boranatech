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
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {titulo}
      </p>
      {indisponivel(bloco) ? (
        <p
          data-testid={`${testid}-indisponivel`}
          className="mt-1 rounded-xl border-2 border-amber-400 bg-amber-50 p-2 text-xs font-bold text-amber-900"
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
      className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500"
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
      <p
        data-testid="vida-vazio"
        className="text-sm font-medium text-slate-400"
      >
        {/* TODO(Ana) */}
        Ainda não há atividade registrada no site.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Bloco
        titulo="Certificados"
        testid="vida-certificados"
        bloco={vida.certificados}
      >
        {certificados.itens.length === 0 ? (
          <p className="mt-1 text-sm font-medium text-slate-400">
            {/* TODO(Ana) */}
            Nenhum certificado emitido.
          </p>
        ) : (
          <ul className="mt-1 space-y-1">
            {certificados.itens.map((c) => (
              <li
                key={c.codigo}
                data-testid="vida-certificado"
                className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold text-slate-800"
              >
                <span>{c.titulo}</span>
                <span className="text-xs font-bold text-slate-500">
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
          <p className="mt-1 text-sm font-medium text-slate-400">
            {/* TODO(Ana) */}
            Nenhuma conquista desbloqueada.
          </p>
        ) : (
          <ul className="mt-1 flex flex-wrap gap-1">
            {badges.itens.map((b) => (
              <li
                key={b.badgeId}
                data-testid="vida-badge"
                className="rounded-full border-2 border-violet-700 bg-violet-50 px-2 py-0.5 text-xs font-black text-violet-900"
              >
                {rotuloDeBadge(b.badgeId)}
              </li>
            ))}
          </ul>
        )}
        <Resto mais={badges.mais} />
      </Bloco>

      <Bloco titulo="Roadmaps" testid="vida-roadmaps" bloco={vida.roadmaps}>
        {roadmaps.itens.length === 0 ? (
          <p className="mt-1 text-sm font-medium text-slate-400">
            {/* TODO(Ana) */}
            Nenhum roadmap iniciado.
          </p>
        ) : (
          <ul className="mt-1 space-y-1">
            {roadmaps.itens.map((r) => (
              <li
                key={r.roadmapId}
                data-testid="vida-roadmap"
                className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold text-slate-800"
              >
                {/* TODO(Ana) */}
                <span>{r.titulo ?? "Roadmap sem título"}</span>
                <span className="text-xs font-bold text-slate-500">
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
          <p className="mt-1 text-sm font-medium text-slate-400">
            {/* TODO(Ana) */}
            Nenhuma trilha iniciada.
          </p>
        ) : (
          <ul className="mt-1 space-y-1">
            {trilhas.itens.map((t) => (
              <li
                key={t.slug}
                data-testid="vida-trilha"
                className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold text-slate-800"
              >
                {/* O slug cru quando não há título: trilha estática guarda o
                    nome no conteúdo estático, então ausência aqui é normal. */}
                <span>{t.titulo ?? t.slug}</span>
                <span className="text-xs font-bold text-slate-500">
                  {/* TODO(Ana) */}
                  {t.itensConcluidos} itens concluídos
                </span>
              </li>
            ))}
          </ul>
        )}
        <Resto mais={trilhas.mais} />
      </Bloco>
    </div>
  );
}
