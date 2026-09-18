import { useEffect, useState } from "react";
import { Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { CabecalhoDeSecao } from "@/components/creator/CabecalhoDeSecao";
import {
  BOTAO_PRIMARIO,
  BOTAO_SECUNDARIO,
  erroClass,
  inputClass,
} from "@/components/creator/creatorFormEstilos";
import { IconeDaRede } from "@/components/creator/IconeDaRede";
import {
  ChipDeAguardando,
  ChipDeStatusDaPublicacao,
  classeDaLinhaPorStatus,
} from "@/components/creator/StatusDaPublicacao";
import { BntSelect } from "@/components/shared/BntSelect";
import { contentFetch } from "@/lib/adminApi";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";
import {
  ehTipoDePublicacao,
  normalizarLinkDePublicacao,
  TIPO_DE_PUBLICACAO_META,
  TIPOS_DE_PUBLICACAO,
  type RedeDePublicacao,
  type TipoDePublicacao,
} from "@shared/creatorPost";

// PUBLICACOES REGISTRADAS (lote 09, tipo no lote 10b): o creator escolhe o
// tipo (post, reel, story ou video), cola o link sobre a Bora na Tech, e a
// lista dele aparece aqui.
//
// AS REGRAS SAO AS DE shared/creatorPost.ts, as mesmas do servidor: o link
// invalido, e o link que nao e do tipo escolhido, sao recusados ANTES do
// envio, com a mesma mensagem (o tipo detectado vem da mesma regra, entao a
// tela nao depende de le-lo da resposta). O 409 (repetida) e o 429 (teto do
// dia) so o servidor sabe, e a mensagem deles vem dele.
//
// BUSCA E GRAVA SOZINHO, como os formularios do perfil: a aba Comunidade nao
// tem estado proprio, e este cartao e o unico dono da lista.

type Publicacao = {
  id: string;
  network: RedeDePublicacao;
  kind: TipoDePublicacao;
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

// Rotulo CURTO do chip da lista; o do select e o do shared ("Vídeo do
// TikTok"), que nao cabe num chip ao lado do glifo da rede.
// TODO(Ana)
const ROTULO_DO_TIPO: Record<TipoDePublicacao, string> = {
  post: "post",
  reel: "reel",
  story: "story",
  video: "vídeo",
};

const OPCOES_DE_TIPO = TIPOS_DE_PUBLICACAO.map((t) => ({
  value: t,
  label: TIPO_DE_PUBLICACAO_META[t].rotulo,
}));

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
    // Ausente no backend anterior: zero, e o chip de aguardando nao aparece.
    aguardando: typeof d.aguardando === "number" ? d.aguardando : 0,
  };
}

export function CreatorPublicacoes() {
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [link, setLink] = useState("");
  // Vazio ate a pessoa escolher: o botao fica desabilitado, porque o tipo
  // decide o status inicial e nao pode ser deduzido em silencio.
  const [tipo, setTipo] = useState("");
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
        setEstado(lista ? { tipo: "ok", ...lista } : { tipo: "erro" });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  async function registrar() {
    if (!ehTipoDePublicacao(tipo)) {
      // TODO(Ana)
      setErro("Escolha o tipo da publicação.");
      return;
    }
    // A mesma regra do servidor, antes do envio: link que nem forma de
    // publicacao tem, ou que e de outro tipo, nao vira requisicao.
    const conferido = normalizarLinkDePublicacao(link, tipo);
    // Link curto do TikTok com tipo video (lote 10c): o SERVIDOR resolve o
    // redirecionamento, entao aqui ele passa; o do Instagram continua barrado.
    const curtoDoTikTok =
      !conferido.ok &&
      conferido.code === "short_link_unsupported" &&
      tipo === "video" &&
      /(^|\/\/|\.)(vm\.tiktok\.com|vt\.tiktok\.com|tiktok\.com\/t\/)/i.test(
        link.trim(),
      );
    if (!conferido.ok && !curtoDoTikTok) {
      if (conferido.code === "post_type_mismatch") {
        const detectado =
          TIPO_DE_PUBLICACAO_META[
            conferido.tipo_detectado
          ].rotulo.toLowerCase();
        // TODO(Ana)
        setErro(`Esse link é de um ${detectado}. Troque o tipo ou o link.`);
        return;
      }
      setErro(
        conferido.code === "short_link_unsupported"
          ? // TODO(Ana)
            "Link curto não dá para registrar. Abra o link e cole o endereço completo da publicação."
          : // TODO(Ana)
            "Link inválido. Cole o link de um post, reel ou story do Instagram, ou de um vídeo do TikTok.",
      );
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const json: unknown = await contentFetch("/creator/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link, tipo }),
      });
      const post = (json as { data?: { post?: Publicacao } }).data?.post;
      if (post) {
        // Story nasce confirmado e ja conta; o resto entra em "aguardando".
        // Sem status (backend anterior) conta como antes, no mes.
        const pendente = post.status === "pendente";
        setEstado((atual) =>
          atual.tipo === "ok"
            ? {
                tipo: "ok",
                posts: [post, ...atual.posts],
                no_mes: pendente ? atual.no_mes : atual.no_mes + 1,
                aguardando: pendente ? atual.aguardando + 1 : atual.aguardando,
              }
            : atual,
        );
      }
      setLink("");
      // Link curto resolvido pelo servidor: a pessoa ve QUAL video ficou
      // registrado, porque o que ela colou nao dizia.
      // TODO(Ana)
      toast.success(
        curtoDoTikTok && post
          ? `Registramos como ${post.url}`
          : "Publicação registrada.",
      );
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
    // DOIS LADOS NO DESKTOP (lote 10): a lista crescia para baixo e empurrava o
    // calendario para fora da tela. Esquerda o que se faz (cabecalho, frase,
    // formulario e o chip do mes); direita o que ja foi feito, com rolagem
    // propria. No celular continua empilhado, o formulario antes da lista.
    <div
      data-testid="creator-publicacoes"
      className="space-y-5 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-8 lg:space-y-0"
    >
      <div className="space-y-5">
        <CabecalhoDeSecao
          id="creator-publicacoes-titulo"
          icone={<Link2 aria-hidden="true" className="h-4 w-4" />}
          // TODO(Ana)
          selo="instagram e tiktok"
          // TODO(Ana)
          titulo="Suas publicações"
          // TODO(Ana)
          frase="Escolha o tipo e cole o link da publicação sobre a Bora na Tech. Cada publicação confirmada conta no ranking do mês."
        />
        <div className="space-y-2">
          {/* Tipo em cima no celular, ao lado no desktop. O select vem ANTES
              do link: e a escolha que define o que o link precisa ser. */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="sm:w-44">
              <BntSelect
                accent="neutral"
                // TODO(Ana)
                label="Tipo da publicação"
                // TODO(Ana)
                placeholder="Tipo"
                value={tipo}
                onValueChange={setTipo}
                options={OPCOES_DE_TIPO}
                fullWidth
              />
            </div>
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
              disabled={salvando || !ehTipoDePublicacao(tipo)}
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

        <div className="flex flex-wrap items-center gap-2">
          <p
            data-testid="creator-publicacoes-no-mes"
            className="inline-flex items-center rounded-full border-2 border-slate-900 bg-violet-100 px-3 py-1 text-xs font-black text-violet-900"
          >
            {/* TODO(Ana) */}
            {`${estado.no_mes} confirmadas este mês`}
          </p>
          <ChipDeAguardando
            quantas={estado.aguardando}
            testId="creator-publicacoes-aguardando"
          />
        </div>
      </div>

      {/* A lista rola por dentro: com muitas publicacoes, a coluna da esquerda
          continua a vista em vez de ficar orfa no topo. Vazia, a coluna vira
          um flex que centraliza a frase nas duas direcoes (lote 10b): a grade
          estica a coluna ate a altura do formulario, e a frase encostada no
          canto de cima parecia sobra de layout. */}
      <div
        data-testid="creator-publicacoes-lista"
        className={
          estado.posts.length === 0
            ? "flex min-h-40 items-center justify-center text-center"
            : "max-h-80 overflow-y-auto"
        }
      >
        {estado.posts.length === 0 ? (
          <p
            data-testid="creator-publicacoes-vazio"
            className="text-sm font-semibold text-slate-600"
          >
            {/* TODO(Ana) */}
            Você ainda não registrou nenhuma publicação. Cole o link da primeira
            aqui ao lado.
          </p>
        ) : (
          <ul className="space-y-2">
            {estado.posts.map((post) => (
              <li
                key={post.id}
                data-testid={`creator-publicacao-${post.id}`}
                className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-2 border-slate-300 bg-slate-50 px-3 py-2 ${classeDaLinhaPorStatus(post.status)}`}
              >
                <IconeDaRede rede={post.network} />
                <span className="rounded-full border-2 border-slate-400 px-2 py-0.5 text-[11px] font-black uppercase text-slate-700">
                  {rotuloDoTipo(post.kind)}
                </span>
                <ChipDeStatusDaPublicacao status={post.status} />
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
    </div>
  );
}
