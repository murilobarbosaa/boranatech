import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { BOTAO_SECUNDARIO } from "@/components/creator/creatorFormEstilos";
import { IconeDaRede } from "@/components/creator/IconeDaRede";
import {
  ChipDeAguardando,
  ChipDeStatusDaPublicacao,
  classeDaLinhaPorStatus,
} from "@/components/creator/StatusDaPublicacao";
import { adminFetch } from "@/lib/adminApi";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";

// PUBLICACOES DE UM CREATOR, NA VISAO ADMIN (lote 09).
//
// A mesma lista que o creator ve na aba Comunidade, SEM o formulario: aqui
// ninguem registra pelo outro. O que existe e a remocao, que e como sai do
// ranking o que nao e sobre a Bora na Tech, e a CONFIRMACAO das pendentes
// (lote 10b), que e o que as faz valer ponto. As duas sao auditadas no
// servidor ANTES de escrever.
//
// Componente proprio, e nao um bloco dentro do CreatorDashboardView: a view
// desenha o payload que recebe e nao busca nada, e esta lista tem busca,
// estado e confirmacao proprios.

type Publicacao = {
  id: string;
  network: string;
  kind: string;
  url: string;
  /** Opcionais por causa da janela de deploy: o backend anterior nao manda. */
  status?: string;
  confirmed_at?: string | null;
  created_at: string;
};

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; posts: Publicacao[]; no_mes: number; aguardando: number };

// Verde: e a acao que faz a publicacao passar a contar, o oposto do lixo ao
// lado. Nao e o amarelo do botao primario de proposito: numa lista de
// pendentes o amarelo em toda linha viraria ruido.
//
// `min-h-10` no celular (lote 11m): 40 px de alvo de toque; o `sm:` volta ao
// tamanho de antes.
export const BOTAO_CONFIRMAR =
  "bnt-pressable inline-flex min-h-10 items-center rounded-full border-2 border-slate-900 bg-emerald-300 px-4 py-1.5 text-xs font-black uppercase text-slate-950 shadow-[2px_2px_0_var(--bnt-shadow)] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0";

/** O `https://www.` some: o que identifica a publicacao e o resto. */
function urlCurta(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/** dd/mm do dia civil de Brasilia. */
function diaCurto(iso: string): string {
  const completo = formatarDiaCivil(diaBrasilia(iso));
  return completo ? completo.slice(0, 5) : "";
}

function listaDaResposta(json: unknown): {
  posts: Publicacao[];
  no_mes: number;
  aguardando: number;
} | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) return null;
  const d = data as { posts?: unknown; no_mes?: unknown; aguardando?: unknown };
  if (!Array.isArray(d.posts) || typeof d.no_mes !== "number") return null;
  return {
    posts: d.posts as Publicacao[],
    no_mes: d.no_mes,
    aguardando: typeof d.aguardando === "number" ? d.aguardando : 0,
  };
}

export function CreatorPublicacoesAdmin({ userId }: { userId: string }) {
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [conferindo, setConferindo] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: "carregando" });
    adminFetch(`/creators/${userId}/posts`)
      .then((json: unknown) => {
        if (cancelado) return;
        const lista = listaDaResposta(json);
        setEstado(lista ? { tipo: "ok", ...lista } : { tipo: "erro" });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [userId, tentativa]);

  async function remover(id: string) {
    setRemovendo(true);
    try {
      await adminFetch(`/creators/${userId}/posts/${id}`, { method: "DELETE" });
      setEstado((atual) => {
        if (atual.tipo !== "ok") return atual;
        const pendente =
          atual.posts.find((p) => p.id === id)?.status === "pendente";
        return {
          tipo: "ok",
          posts: atual.posts.filter((p) => p.id !== id),
          no_mes: pendente ? atual.no_mes : Math.max(0, atual.no_mes - 1),
          aguardando: pendente
            ? Math.max(0, atual.aguardando - 1)
            : atual.aguardando,
        };
      });
      setConfirmando(null);
      // TODO(Ana)
      toast.success("Publicação removida.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível remover a publicação.",
      );
    } finally {
      setRemovendo(false);
    }
  }

  async function confirmar(id: string) {
    setConferindo(id);
    try {
      const json: unknown = await adminFetch(
        `/creators/${userId}/posts/${id}/confirmar`,
        { method: "POST" },
      );
      const post = (json as { data?: { post?: Publicacao } }).data?.post;
      setEstado((atual) =>
        atual.tipo === "ok"
          ? {
              tipo: "ok",
              posts: atual.posts.map((p) =>
                p.id === id ? { ...p, ...post, status: "confirmado" } : p,
              ),
              no_mes: atual.no_mes + 1,
              aguardando: Math.max(0, atual.aguardando - 1),
            }
          : atual,
      );
      // TODO(Ana)
      toast.success("Publicação confirmada.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível confirmar a publicação.",
      );
    } finally {
      setConferindo(null);
    }
  }

  if (estado.tipo === "carregando") {
    // TODO(Ana)
    return <LoadingBlock label="Carregando as publicações..." />;
  }

  if (estado.tipo === "erro") {
    return (
      <div data-testid="creator-publicacoes-admin-erro" className="space-y-3">
        {/* TODO(Ana) */}
        <ErrorBlock message="Não foi possível carregar as publicações deste creator." />
        <div className="text-center">
          <button
            type="button"
            onClick={() => setTentativa((n) => n + 1)}
            className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
          >
            {/* TODO(Ana) */}
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="creator-publicacoes-admin" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p
          data-testid="creator-publicacoes-admin-no-mes"
          className="inline-flex items-center rounded-full border-2 border-slate-900 bg-violet-100 px-3 py-1 text-xs font-black text-violet-900"
        >
          {/* TODO(Ana) */}
          {`${estado.no_mes} confirmadas este mês`}
        </p>
        <ChipDeAguardando
          quantas={estado.aguardando}
          testId="creator-publicacoes-admin-aguardando"
        />
      </div>

      {estado.posts.length === 0 ? (
        <p
          data-testid="creator-publicacoes-admin-vazio"
          className="text-sm font-semibold text-slate-600"
        >
          {/* TODO(Ana) */}
          Este creator ainda não registrou nenhuma publicação.
        </p>
      ) : (
        <ul className="space-y-2">
          {estado.posts.map((post) => (
            <li
              key={post.id}
              data-testid={`creator-publicacao-admin-${post.id}`}
              // TRES FAIXAS NO CELULAR (lote 11m): a rede e o status com a
              // data; o link numa linha propria; as acoes embaixo, a direita.
              // O `sm:` volta a linha unica de antes.
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 rounded-2xl border-2 border-slate-300 bg-slate-50 px-3 py-2 sm:flex sm:flex-wrap sm:gap-x-3 ${classeDaLinhaPorStatus(post.status)}`}
            >
              <span
                data-testid={`creator-publicacao-admin-chips-${post.id}`}
                className="flex flex-wrap items-center gap-2 sm:contents"
              >
                <IconeDaRede rede={post.network} />
                <ChipDeStatusDaPublicacao status={post.status} />
              </span>
              <a
                href={post.url}
                target="_blank"
                rel="noreferrer"
                data-testid={`creator-publicacao-admin-link-${post.id}`}
                className="col-span-2 min-w-0 flex-1 truncate py-2.5 text-sm font-bold text-violet-800 underline underline-offset-2 sm:py-0"
              >
                {urlCurta(post.url)}
              </a>
              <span
                data-testid={`creator-publicacao-admin-data-${post.id}`}
                className="col-start-2 row-start-1 justify-self-end text-xs font-bold tabular-nums text-slate-500"
              >
                {diaCurto(post.created_at)}
              </span>
              {confirmando === post.id ? (
                <span className="col-span-2 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    data-testid={`creator-publicacao-admin-confirmar-${post.id}`}
                    onClick={() => void remover(post.id)}
                    disabled={removendo}
                    className={BOTAO_SECUNDARIO}
                  >
                    {/* TODO(Ana) */}
                    {removendo ? "Removendo..." : "Confirmar remoção"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmando(null)}
                    disabled={removendo}
                    className={BOTAO_SECUNDARIO}
                  >
                    {/* TODO(Ana) */}
                    Manter
                  </button>
                </span>
              ) : (
                <span
                  data-testid={`creator-publicacao-admin-acoes-${post.id}`}
                  className="col-span-2 flex flex-wrap items-center justify-end gap-2 sm:contents"
                >
                  {post.status === "pendente" ? (
                    <button
                      type="button"
                      data-testid={`creator-publicacao-admin-conferir-${post.id}`}
                      onClick={() => void confirmar(post.id)}
                      disabled={conferindo === post.id}
                      className={BOTAO_CONFIRMAR}
                    >
                      {/* TODO(Ana) */}
                      {conferindo === post.id ? "Confirmando..." : "Confirmar"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    data-testid={`creator-publicacao-admin-remover-${post.id}`}
                    onClick={() => setConfirmando(post.id)}
                    className="bnt-pressable inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 bg-white p-1.5 text-slate-900 sm:inline-block sm:h-auto sm:w-auto"
                    // TODO(Ana)
                    aria-label="Remover publicação"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
