import { useEffect, useState } from "react";
import { Instagram, Trash2, Video } from "lucide-react";
import { toast } from "sonner";

import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import {
  BOTAO_PRIMARIO,
  BOTAO_SECUNDARIO,
  erroClass,
  inputClass,
} from "@/components/creator/creatorFormEstilos";
import { contentFetch } from "@/lib/adminApi";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";
import {
  normalizarLinkDePublicacao,
  type RedeDePublicacao,
  type TipoDePublicacao,
} from "@shared/creatorPost";

// PUBLICACOES REGISTRADAS (lote 09): o creator cola o link do post, reel ou
// video sobre a Bora na Tech, e a lista dele aparece aqui.
//
// AS REGRAS SAO AS DE shared/creatorPost.ts, as mesmas do servidor: o link
// invalido e recusado ANTES do envio, com a mesma mensagem. O 409 (repetida) e
// o 429 (teto do dia) so o servidor sabe, e a mensagem deles vem dele.
//
// BUSCA E GRAVA SOZINHO, como os formularios do perfil: a aba Comunidade nao
// tem estado proprio, e este cartao e o unico dono da lista.

type Publicacao = {
  id: string;
  network: RedeDePublicacao;
  kind: TipoDePublicacao;
  url: string;
  created_at: string;
};

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; posts: Publicacao[]; no_mes: number };

// TODO(Ana)
const ROTULO_DO_TIPO: Record<TipoDePublicacao, string> = {
  post: "post",
  reel: "reel",
  video: "vídeo",
};

/**
 * Rotulo do tipo vindo do servidor. Resolver com fallback neutro: um tipo novo
 * que este bundle ainda nao conhece mostra "publicação" em vez de derrubar a
 * lista inteira.
 */
function rotuloDoTipo(tipo: string): string {
  // TODO(Ana)
  return (
    (ROTULO_DO_TIPO as Record<string, string | undefined>)[tipo] ?? "publicação"
  );
}

/** O `https://www.` some: o que identifica a publicacao e o resto. */
function urlCurta(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/** dd/mm do dia civil de Brasilia. O ano nao cabe e nao ajuda numa lista do mes. */
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

export function CreatorPublicacoes() {
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [link, setLink] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: "carregando" });
    contentFetch("/creator/posts")
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
  }, [tentativa]);

  async function registrar() {
    // A mesma regra do servidor, antes do envio: link que nem forma de
    // publicacao tem nao vira requisicao.
    const conferido = normalizarLinkDePublicacao(link);
    if (!conferido.ok) {
      setErro(
        conferido.code === "short_link_unsupported"
          ? // TODO(Ana)
            "Link curto não dá para registrar. Abra o link e cole o endereço completo da publicação."
          : // TODO(Ana)
            "Link inválido. Cole o link de um post ou reel do Instagram, ou de um vídeo do TikTok.",
      );
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const json: unknown = await contentFetch("/creator/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const post = (json as { data?: { post?: Publicacao } }).data?.post;
      if (post) {
        setEstado((atual) =>
          atual.tipo === "ok"
            ? {
                tipo: "ok",
                posts: [post, ...atual.posts],
                no_mes: atual.no_mes + 1,
              }
            : atual,
        );
      }
      setLink("");
      // TODO(Ana)
      toast.success("Publicação registrada.");
    } catch (err) {
      // 409 e 429 tem mensagem propria do servidor, e ela e mais precisa do
      // que qualquer texto generico daqui.
      const mensagem =
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível registrar a publicação.";
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string) {
    setRemovendo(true);
    try {
      await contentFetch(`/creator/posts/${id}`, { method: "DELETE" });
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
    return <LoadingBlock label="Carregando suas publicações..." />;
  }

  if (estado.tipo === "erro") {
    return (
      <div data-testid="creator-publicacoes-erro" className="space-y-3">
        {/* TODO(Ana) */}
        <ErrorBlock message="Não foi possível carregar as suas publicações agora." />
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
    <div data-testid="creator-publicacoes" className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">
              {/* TODO(Ana) */}
              Link da publicação
            </span>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className={inputClass}
              // TODO(Ana)
              placeholder="https://www.instagram.com/reel/..."
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            data-testid="creator-publicacoes-registrar"
            onClick={() => void registrar()}
            disabled={salvando}
            className={BOTAO_PRIMARIO}
          >
            {/* TODO(Ana) */}
            {salvando ? "Registrando..." : "Registrar"}
          </button>
        </div>
        {erro ? (
          <span
            data-testid="creator-publicacoes-erro-campo"
            className={erroClass}
          >
            {erro}
          </span>
        ) : null}
      </div>

      <p
        data-testid="creator-publicacoes-no-mes"
        className="inline-flex items-center rounded-full border-2 border-slate-900 bg-violet-100 px-3 py-1 text-xs font-black text-violet-900"
      >
        {/* TODO(Ana) */}
        {`${estado.no_mes} este mês`}
      </p>

      {estado.posts.length === 0 ? (
        <p
          data-testid="creator-publicacoes-vazio"
          className="text-sm font-semibold text-slate-600"
        >
          {/* TODO(Ana) */}
          Você ainda não registrou nenhuma publicação. Cole o link da primeira
          aqui em cima.
        </p>
      ) : (
        <ul className="space-y-2">
          {estado.posts.map((post) => (
            <li
              key={post.id}
              data-testid={`creator-publicacao-${post.id}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-2 border-slate-300 bg-slate-50 px-3 py-2"
            >
              {post.network === "instagram" ? (
                <Instagram aria-hidden="true" className="h-4 w-4 shrink-0" />
              ) : (
                // O lucide nao tem marca do TikTok; `Video` e o mais proximo
                // sem inventar um icone de marca.
                <Video aria-hidden="true" className="h-4 w-4 shrink-0" />
              )}
              <span className="rounded-full border-2 border-slate-400 px-2 py-0.5 text-[11px] font-black uppercase text-slate-700">
                {rotuloDoTipo(post.kind)}
              </span>
              <a
                href={post.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-sm font-bold text-violet-800 underline underline-offset-2"
              >
                {urlCurta(post.url)}
              </a>
              <span className="text-xs font-bold text-slate-500 tabular-nums">
                {diaCurto(post.created_at)}
              </span>
              {confirmando === post.id ? (
                <span className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid={`creator-publicacao-confirmar-${post.id}`}
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
                  data-testid={`creator-publicacao-remover-${post.id}`}
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
