import { useEffect, useState } from "react";
import { Instagram, Trash2, Video } from "lucide-react";
import { toast } from "sonner";

import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { BOTAO_SECUNDARIO } from "@/components/creator/creatorFormEstilos";
import { adminFetch } from "@/lib/adminApi";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";

// PUBLICACOES DE UM CREATOR, NA VISAO ADMIN (lote 09).
//
// A mesma lista que o creator ve na aba Comunidade, SEM o formulario: aqui
// ninguem registra pelo outro. O que existe e a remocao, que e como sai do
// ranking o que nao e sobre a Bora na Tech, e ela e auditada no servidor ANTES
// de apagar.
//
// Componente proprio, e nao um bloco dentro do CreatorDashboardView: a view
// desenha o payload que recebe e nao busca nada, e esta lista tem busca,
// estado e confirmacao proprios.

type Publicacao = {
  id: string;
  network: string;
  kind: string;
  url: string;
  created_at: string;
};

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; posts: Publicacao[]; no_mes: number };

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
} | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) return null;
  const d = data as { posts?: unknown; no_mes?: unknown };
  if (!Array.isArray(d.posts) || typeof d.no_mes !== "number") return null;
  return { posts: d.posts as Publicacao[], no_mes: d.no_mes };
}

export function CreatorPublicacoesAdmin({ userId }: { userId: string }) {
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: "carregando" });
    adminFetch(`/creators/${userId}/posts`)
      .then((json: unknown) => {
        if (cancelado) return;
        const lista = listaDaResposta(json);
        setEstado(
          lista
            ? { tipo: "ok", posts: lista.posts, no_mes: lista.no_mes }
            : { tipo: "erro" },
        );
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
      setEstado((atual) =>
        atual.tipo === "ok"
          ? {
              tipo: "ok",
              posts: atual.posts.filter((p) => p.id !== id),
              no_mes: Math.max(0, atual.no_mes - 1),
            }
          : atual,
      );
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
      <p
        data-testid="creator-publicacoes-admin-no-mes"
        className="inline-flex items-center rounded-full border-2 border-slate-900 bg-violet-100 px-3 py-1 text-xs font-black text-violet-900"
      >
        {/* TODO(Ana) */}
        {`${estado.no_mes} este mês`}
      </p>

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
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-2 border-slate-300 bg-slate-50 px-3 py-2"
            >
              {post.network === "instagram" ? (
                <Instagram aria-hidden="true" className="h-4 w-4 shrink-0" />
              ) : (
                <Video aria-hidden="true" className="h-4 w-4 shrink-0" />
              )}
              <a
                href={post.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-sm font-bold text-violet-800 underline underline-offset-2"
              >
                {urlCurta(post.url)}
              </a>
              <span className="text-xs font-bold tabular-nums text-slate-500">
                {diaCurto(post.created_at)}
              </span>
              {confirmando === post.id ? (
                <span className="flex flex-wrap items-center gap-2">
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
                <button
                  type="button"
                  data-testid={`creator-publicacao-admin-remover-${post.id}`}
                  onClick={() => setConfirmando(post.id)}
                  className="bnt-pressable rounded-full border-2 border-slate-900 bg-white p-1.5 text-slate-900"
                  // TODO(Ana)
                  aria-label="Remover publicação"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
