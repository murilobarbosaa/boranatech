import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

import { ErrorBlock } from "@/components/admin/StateBlocks";
import { AvatarDoCreator } from "@/components/creator/AvatarDoCreator";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/adminApi";
import { diaBrasilia } from "@shared/brasiliaDay";
import {
  mesDoDia,
  type PosicaoDoRanking,
  type RankingDoMes,
} from "@shared/creatorRanking";

// RANKING DO MES NO PAINEL DO CREATOR DO ADMIN (lote 11c): a posicao deste
// creator no mes corrente, os pontos e as contagens, e o podio do mes em
// forma compacta. Le o ranking NEUTRO da rota do admin (o mesmo cache por mes
// da aba Ranking) e acha a linha pelo `user_id`: nao existe `eu` no admin.
// Influencer nao tem ranking (lote 11b), e o bloco diz isso em vez de
// procurar uma linha que nao existe.

type Estado =
  | { tipo: "carregando" }
  | { tipo: "ok"; ranking: RankingDoMes }
  | { tipo: "erro" };

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const CHIP =
  "rounded-full border-2 border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-black text-slate-700";

function rankingDaResposta(json: unknown): RankingDoMes | null {
  const data = (json as { data?: unknown } | null)?.data;
  if (typeof data !== "object" || data === null) return null;
  const r = data as Partial<RankingDoMes>;
  if (typeof r.mes !== "string" || !Array.isArray(r.posicoes)) return null;
  return {
    mes: r.mes,
    fechado: r.fechado === true,
    fecha_em: typeof r.fecha_em === "string" ? r.fecha_em : null,
    posicoes: r.posicoes,
    minha_posicao: null,
  };
}

// TODO(Ana)
function nomeDeExibicao(p: PosicaoDoRanking): string {
  return p.handle ? `@${p.handle}` : (p.name ?? "Creator");
}

function Casca({
  children,
  busy = false,
}: {
  children: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <section
      data-testid="creators-ranking-do-creator"
      aria-labelledby="creators-ranking-do-creator-titulo"
      aria-busy={busy}
      className="card-brutal space-y-4 rounded-3xl bg-white p-5"
    >
      <h3
        id="creators-ranking-do-creator-titulo"
        className="inline-flex items-center gap-2 font-display text-lg font-black text-slate-950"
      >
        <Trophy aria-hidden="true" className="h-4 w-4" />
        {/* TODO(Ana) */}
        Ranking do mês
      </h3>
      {children}
    </section>
  );
}

export function RankingDoCreator({
  userId,
  kind,
  agora = () => new Date(),
}: {
  userId: string;
  kind: "influencer" | "afiliado";
  agora?: () => Date;
}) {
  const afiliado = kind === "afiliado";
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const mes = mesDoDia(diaBrasilia(agora().toISOString()) ?? "");

  useEffect(() => {
    if (!afiliado) return;
    let cancelado = false;
    setEstado({ tipo: "carregando" });
    adminFetch(`/creators/ranking?mes=${mes}`)
      .then((json: unknown) => {
        if (cancelado) return;
        const ranking = rankingDaResposta(json);
        setEstado(ranking ? { tipo: "ok", ranking } : { tipo: "erro" });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [afiliado, mes]);

  if (!afiliado) {
    return (
      <Casca>
        <p
          data-testid="creators-ranking-fora"
          className="text-sm font-bold text-slate-600"
        >
          {/* TODO(Ana) */}
          Fora do ranking (influencer)
        </p>
      </Casca>
    );
  }

  if (estado.tipo === "carregando") {
    return (
      <Casca busy>
        <div
          data-testid="creators-ranking-do-creator-esqueleto"
          className="space-y-3"
        >
          <Skeleton className="h-9 w-48 bg-slate-200" />
          <Skeleton className="h-4 w-64 bg-slate-200" />
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              className="h-10 w-full rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      </Casca>
    );
  }

  if (estado.tipo === "erro") {
    return (
      <Casca>
        {/* TODO(Ana) */}
        <ErrorBlock message="Não foi possível carregar o ranking deste mês." />
      </Casca>
    );
  }

  const { ranking } = estado;
  const linha = ranking.posicoes.find((p) => p.user_id === userId) ?? null;
  const podio = ranking.posicoes.filter((p) => p.pontos > 0).slice(0, 3);
  const nomeDoMes = MESES[Number(ranking.mes.slice(5, 7)) - 1] ?? ranking.mes;

  return (
    <Casca>
      {linha ? (
        <div data-testid="creators-ranking-posicao" className="space-y-2">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-3xl font-black text-slate-950">
              {`${linha.posicao}º`}
            </span>
            <span className="text-sm font-bold text-slate-600">
              {/* TODO(Ana) */}
              {`de ${ranking.posicoes.length} em ${nomeDoMes}`}
            </span>
            <span className="text-sm font-black text-[var(--bnt-collab-ink)]">
              {`${linha.pontos} ${linha.pontos === 1 ? "ponto" : "pontos"}`}
            </span>
          </p>
          {linha.pontos === 0 ? (
            <p
              data-testid="creators-ranking-sem-pontos"
              className="text-xs font-semibold text-slate-600"
            >
              {/* TODO(Ana) */}
              Sem pontos ainda neste mês.
            </p>
          ) : (
            <p className="flex flex-wrap gap-1.5">
              {/* TODO(Ana) */}
              <span
                className={CHIP}
              >{`${linha.contagens.publicacoes} publicações`}</span>
              <span className={CHIP}>{`${linha.contagens.vendas} vendas`}</span>
              <span
                className={CHIP}
              >{`${linha.contagens.cliques} cliques`}</span>
            </p>
          )}
        </div>
      ) : (
        <p
          data-testid="creators-ranking-fora"
          className="text-sm font-bold text-slate-600"
        >
          {/* TODO(Ana) */}
          Fora do ranking deste mês.
        </p>
      )}

      <ol
        data-testid="creators-ranking-podio"
        // TODO(Ana)
        aria-label="Pódio do mês"
        className="space-y-1.5"
      >
        {podio.length === 0 ? (
          <li className="text-xs font-semibold text-slate-600">
            {/* TODO(Ana) */}
            Ninguém pontuou ainda.
          </li>
        ) : null}
        {podio.map((p) => (
          <li
            key={p.user_id}
            data-testid={`creators-ranking-podio-${p.posicao}`}
            className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-1.5 ${
              p.user_id === userId
                ? "border-[var(--bnt-accent-solid)] bg-amber-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="w-6 font-display text-lg font-black text-slate-900">
              {p.posicao}
            </span>
            <AvatarDoCreator
              name={p.name ?? p.handle ?? "Creator"}
              avatar={p.avatar}
              avatarUrl={p.avatar_url}
              size="sm"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-black text-slate-950">
              {nomeDeExibicao(p)}
            </span>
            <span className="font-display text-base font-black text-slate-950">
              {p.pontos}
              <span className="ml-1 text-[10px] font-black uppercase text-slate-500">
                pts
              </span>
            </span>
          </li>
        ))}
      </ol>
    </Casca>
  );
}
