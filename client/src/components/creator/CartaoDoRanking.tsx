import { useEffect, useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { Link } from "wouter";

import { AvatarDoCreator } from "@/components/creator/AvatarDoCreator";
import { EsqueletoDoCartaoDoRanking } from "@/components/creator/Esqueletos";
import { contentFetch } from "@/lib/adminApi";
import type { PosicaoDoRanking, RankingDoMes } from "@shared/creatorRanking";

// MINI RANKING DA ABA NUMEROS (lote 11d, no lugar do cartao de posicao do
// lote 11): as tres primeiras posicoes do mes em linhas compactas (posicao,
// avatar com a borda da pessoa, @, pontos) e, se quem olha nao esta entre
// elas, a linha dele com o chip "Voce"; sem pontos, a frase de sempre. Mesma
// fonte da aba Ranking (`/creator/ranking`, o mes atual), mesmo esqueleto de
// tres linhas. So afiliados chegam aqui: a pagina nao monta o cartao para o
// influencer.
//
// ENQUANTO CARREGA, ESQUELETO; SEM RESPOSTA, SEM CARTAO. Com erro ou no
// backend anterior (404), o cartao nao aparece: "Voce ainda nao pontuou" e
// informacao, e mostra-la sobre uma requisicao que falhou seria mentir com
// cara de zero.

type Estado =
  | { tipo: "carregando" }
  | { tipo: "ok"; ranking: RankingDoMes }
  | { tipo: "nada" };

const CHIP_VOCE =
  "rounded-full border-2 border-ink-on-accent bg-[var(--bnt-accent-solid)] px-2 py-0.5 text-[10px] font-black uppercase text-ink-on-accent";

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
    minha_posicao: r.minha_posicao ?? null,
  };
}

// TODO(Ana)
function nomeDeExibicao(p: PosicaoDoRanking): string {
  return p.handle ? `@${p.handle}` : (p.name ?? "Creator");
}

function Linha({ p, eu }: { p: PosicaoDoRanking; eu: boolean }) {
  return (
    <li
      data-testid={`creator-card-ranking-linha-${p.user_id}`}
      className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-1.5 ${
        eu
          ? "border-[var(--bnt-accent-solid)] bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <span className="w-6 shrink-0 font-display text-lg font-black text-slate-900">
        {p.posicao}
      </span>
      <AvatarDoCreator
        name={p.name ?? p.handle ?? "Creator"}
        avatar={p.avatar}
        avatarUrl={p.avatar_url}
        size="sm"
      />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-black text-slate-950">
          {eu ? "Você" : nomeDeExibicao(p)}
        </span>
        {eu ? (
          <span
            data-testid={`creator-card-ranking-voce-${p.user_id}`}
            className={CHIP_VOCE}
          >
            Você
          </span>
        ) : null}
      </span>
      <span className="shrink-0 font-display text-base font-black text-slate-950">
        {p.pontos}
        <span className="ml-1 text-[10px] font-black uppercase text-slate-500">
          pts
        </span>
      </span>
    </li>
  );
}

export function CartaoDoRanking() {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  useEffect(() => {
    let cancelado = false;
    contentFetch("/creator/ranking")
      .then((json: unknown) => {
        if (cancelado) return;
        const ranking = rankingDaResposta(json);
        setEstado(ranking ? { tipo: "ok", ranking } : { tipo: "nada" });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "nada" });
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (estado.tipo === "carregando") return <EsqueletoDoCartaoDoRanking />;
  if (estado.tipo === "nada") return null;

  const { ranking } = estado;
  // O podio e so de quem pontuou, como na aba Ranking.
  const topo = ranking.posicoes.filter((p) => p.pontos > 0).slice(0, 3);
  const minha = ranking.minha_posicao;
  const euNoTopo =
    minha !== null && topo.some((p) => p.user_id === minha.user_id);
  const semPontos = minha === null || minha.pontos === 0;

  return (
    <section
      data-testid="creator-card-ranking"
      aria-labelledby="creator-card-ranking-titulo"
      className="card-brutal space-y-3 rounded-3xl bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="creator-card-ranking-titulo"
          className="inline-flex items-center gap-2 font-display text-lg font-black text-slate-950"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-[var(--bnt-accent-solid)] text-ink-on-accent shadow-[2px_2px_0_var(--bnt-shadow)]"
          >
            <Trophy className="h-4 w-4" />
          </span>
          {/* TODO(Ana) */}
          Ranking do mês
        </h2>
        <Link
          href="/creator?aba=ranking"
          data-testid="creator-card-ranking-link"
          className="bnt-pressable inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
        >
          {/* TODO(Ana) */}
          Ver ranking completo
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ol
        data-testid="creator-card-ranking-topo"
        // TODO(Ana)
        aria-label="Três primeiros do mês"
        className="space-y-1.5"
      >
        {topo.length === 0 ? (
          <li
            data-testid="creator-card-ranking-ninguem"
            className="text-xs font-semibold text-slate-600"
          >
            {/* TODO(Ana) */}
            Ninguém pontuou ainda este mês.
          </li>
        ) : null}
        {topo.map((p) => (
          <Linha key={p.user_id} p={p} eu={minha?.user_id === p.user_id} />
        ))}
      </ol>

      {semPontos ? (
        <p
          data-testid="creator-card-ranking-vazio"
          className="text-sm font-bold text-slate-600"
        >
          {/* TODO(Ana) */}
          Você ainda não pontuou este mês
        </p>
      ) : minha && !euNoTopo ? (
        <ol
          data-testid="creator-card-ranking-minha"
          // TODO(Ana)
          aria-label="Sua posição"
          className="border-t-2 border-dashed border-slate-300 pt-3"
        >
          <Linha p={minha} eu />
        </ol>
      ) : null}
    </section>
  );
}
