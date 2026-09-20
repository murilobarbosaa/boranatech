import { useEffect, useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { Link } from "wouter";

import { contentFetch } from "@/lib/adminApi";
import type { RankingDoMes } from "@shared/creatorRanking";

// CARTAO "RANKING DO MES" DA ABA NUMEROS (lote 11): a posicao, o total e os
// pontos do mes corrente, com o caminho para a aba Ranking.
//
// Busca por conta propria, no MESMO endpoint da aba Ranking, em vez de pendurar
// o ranking no `/creator/me`: o painel de numeros e recomputado a cada troca de
// janela (7d, 30d, 90d, tudo) e o ranking nao depende de janela, entao ali a
// conta rodaria quatro vezes por sessao sem motivo. O endpoint ja sai cacheado
// por mes no servidor.
//
// SEM RESPOSTA, SEM CARTAO. Enquanto carrega, com erro, ou no backend anterior
// (404), o cartao nao aparece: "Voce ainda nao pontuou" e informacao, e
// mostra-la sobre uma requisicao que falhou seria mentir com cara de zero. O
// cartao nao e o painel, entao sumir nao esconde nada que a pessoa veio ver.

type Resumo = { posicao: number; total: number; pontos: number } | "sem_pontos";

function resumoDaResposta(json: unknown): Resumo | null {
  const data = (json as { data?: unknown } | null)?.data;
  if (typeof data !== "object" || data === null) return null;
  const r = data as Partial<RankingDoMes>;
  if (!Array.isArray(r.posicoes)) return null;
  const minha = r.minha_posicao;
  if (!minha || typeof minha.posicao !== "number") return "sem_pontos";
  if (minha.pontos === 0) return "sem_pontos";
  return {
    posicao: minha.posicao,
    total: r.posicoes.length,
    pontos: typeof minha.pontos === "number" ? minha.pontos : 0,
  };
}

export function CartaoDoRanking() {
  const [resumo, setResumo] = useState<Resumo | null>(null);

  useEffect(() => {
    let cancelado = false;
    contentFetch("/creator/ranking")
      .then((json: unknown) => {
        if (!cancelado) setResumo(resumoDaResposta(json));
      })
      .catch(() => {
        if (!cancelado) setResumo(null);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (resumo === null) return null;

  return (
    <section
      data-testid="creator-card-ranking"
      aria-labelledby="creator-card-ranking-titulo"
      className="card-brutal flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-5"
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-[var(--bnt-accent-solid)] text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)]"
        >
          <Trophy className="h-6 w-6" />
        </span>
        <div>
          <h2
            id="creator-card-ranking-titulo"
            className="text-xs font-black uppercase tracking-wider text-slate-600"
          >
            {/* TODO(Ana) */}
            Ranking do mês
          </h2>
          {resumo === "sem_pontos" ? (
            <p
              data-testid="creator-card-ranking-vazio"
              className="mt-0.5 font-display text-lg font-black text-slate-950"
            >
              {/* TODO(Ana) */}
              Você ainda não pontuou este mês
            </p>
          ) : (
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <span
                data-testid="creator-card-ranking-posicao"
                className="font-display text-3xl font-black text-slate-950"
              >
                {`${resumo.posicao}º`}
              </span>
              <span className="text-sm font-bold text-slate-600">
                {/* TODO(Ana) */}
                {`de ${resumo.total}`}
              </span>
              <span
                data-testid="creator-card-ranking-pontos"
                className="text-sm font-black text-[var(--bnt-collab-ink)]"
              >
                {`${resumo.pontos} ${resumo.pontos === 1 ? "ponto" : "pontos"}`}
              </span>
            </p>
          )}
        </div>
      </div>
      <Link
        href="/creator?aba=ranking"
        data-testid="creator-card-ranking-link"
        className="bnt-pressable inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
      >
        {/* TODO(Ana) */}
        Ver ranking
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
