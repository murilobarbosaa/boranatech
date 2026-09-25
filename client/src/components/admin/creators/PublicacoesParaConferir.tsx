import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AvatarDeCreator } from "@shared/creatorAvatar";

import { AvatarDoCreator } from "@/components/creator/AvatarDoCreator";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { BOTAO_SECUNDARIO } from "@/components/creator/creatorFormEstilos";
import { BOTAO_CONFIRMAR } from "@/components/creator/CreatorPublicacoesAdmin";
import { IconeDaRede } from "@/components/creator/IconeDaRede";
import { adminFetch } from "@/lib/adminApi";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";
import { rotuloDaRede } from "@shared/creatorProfile";
import { ROTULO_DO_TIPO } from "@shared/creatorPost";

// PUBLICACOES PARA CONFERIR (lote 10b): as pendentes de TODOS os creators,
// mais antigas primeiro, no topo da aba Creators. Confirmar e o que faz a
// publicacao valer ponto no ranking; remover e o que tira o que nao e sobre a
// Bora na Tech. As duas sao auditadas no servidor ANTES de escrever.
//
// Componente proprio, com busca, pagina e estado proprios: o quadro de
// creators e uma lista de PESSOAS, esta e uma lista de PUBLICACOES, e os dois
// paginam por contas diferentes.
//
// O dono vem resolvido pelo servidor (nome, avatar, @ do Instagram), em lote:
// a tela nao faz uma busca por linha.

const PAGE_SIZE = 50;

type Dono = {
  name: string | null;
  avatar_url: string | null;
  /** Ausente no backend anterior ao lote 11b. */
  avatar?: AvatarDeCreator;
  instagram_handle: string | null;
};

type Pendente = {
  id: string;
  user_id: string;
  network: string;
  kind: string;
  url: string;
  created_at: string;
  creator: Dono;
};

type Pagina = { rows: Pendente[]; total: number; page: number };

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; pagina: Pagina };

/** Rotulo do tipo pelo shared; tipo desconhecido vira "publicação". */
function rotuloDoTipo(tipo: string): string {
  // TODO(Ana)
  return (
    (ROTULO_DO_TIPO as Record<string, string | undefined>)[tipo] ?? "publicação"
  );
}

/** Nome do dono; sem nome, o @; sem os dois, um rotulo neutro. */
function nomeDoDono(dono: Dono): string {
  const nome = dono.name?.trim();
  if (nome) return nome;
  const handle = dono.instagram_handle?.trim();
  // TODO(Ana)
  return handle ? `@${handle}` : "Creator sem nome";
}

/** O `https://www.` some: o que identifica a publicacao e o resto. */
function urlCurta(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function dataCurta(iso: string): string {
  return formatarDiaCivil(diaBrasilia(iso)) ?? "";
}

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function paginaDaResposta(json: unknown): Pagina | null {
  if (!objeto(json) || !objeto(json.data)) return null;
  const d = json.data;
  if (!Array.isArray(d.rows) || typeof d.total !== "number") return null;
  if (typeof d.page !== "number") return null;
  return { rows: d.rows as Pendente[], total: d.total, page: d.page };
}

export function PublicacoesParaConferir() {
  const [page, setPage] = useState(1);
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [agindo, setAgindo] = useState<string | null>(null);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: "carregando" });
    const params = new URLSearchParams({
      status: "pendente",
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    adminFetch(`/creators/posts?${params.toString()}`)
      .then((json: unknown) => {
        if (cancelado) return;
        const pagina = paginaDaResposta(json);
        setEstado(pagina ? { tipo: "ok", pagina } : { tipo: "erro" });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [page, tentativa]);

  /** Tira a linha da lista e desconta do total; a proxima pagina nao e
   * rebuscada aqui, de proposito: quem confere varias em sequencia nao quer a
   * lista pulando a cada clique. Trocar de pagina recarrega. */
  function tirarDaLista(id: string) {
    setEstado((atual) =>
      atual.tipo === "ok"
        ? {
            tipo: "ok",
            pagina: {
              ...atual.pagina,
              rows: atual.pagina.rows.filter((r) => r.id !== id),
              total: Math.max(0, atual.pagina.total - 1),
            },
          }
        : atual,
    );
  }

  async function confirmar(linha: Pendente) {
    setAgindo(linha.id);
    try {
      await adminFetch(
        `/creators/${linha.user_id}/posts/${linha.id}/confirmar`,
        { method: "POST" },
      );
      tirarDaLista(linha.id);
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
      setAgindo(null);
    }
  }

  async function remover(linha: Pendente) {
    setAgindo(linha.id);
    try {
      await adminFetch(`/creators/${linha.user_id}/posts/${linha.id}`, {
        method: "DELETE",
      });
      tirarDaLista(linha.id);
      setConfirmandoRemocao(null);
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
      setAgindo(null);
    }
  }

  const total = estado.tipo === "ok" ? estado.pagina.total : null;
  const totalDePaginas =
    total === null ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section
      data-testid="creators-para-conferir"
      aria-labelledby="creators-para-conferir-titulo"
      className="card-brutal space-y-4 rounded-3xl bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3
          id="creators-para-conferir-titulo"
          className="font-display text-lg font-black text-slate-950"
        >
          {/* TODO(Ana) */}
          Publicações para conferir
        </h3>
        {total !== null ? (
          <span
            data-testid="creators-para-conferir-total"
            className={`rounded-full border-2 px-3 py-1 text-xs font-black ${
              total > 0
                ? "border-amber-600 bg-amber-50 text-amber-900"
                : "border-slate-300 bg-slate-100 text-slate-600"
            }`}
          >
            {/* TODO(Ana) */}
            {`${total} aguardando`}
          </span>
        ) : null}
      </div>

      {estado.tipo === "carregando" ? (
        // TODO(Ana)
        <LoadingBlock label="Carregando as publicações para conferir..." />
      ) : estado.tipo === "erro" ? (
        <div data-testid="creators-para-conferir-erro" className="space-y-3">
          {/* TODO(Ana) */}
          <ErrorBlock message="Não foi possível carregar as publicações para conferir." />
          <div className="text-center">
            <button
              type="button"
              onClick={() => setTentativa((n) => n + 1)}
              className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] min-h-10 sm:min-h-0"
            >
              {/* TODO(Ana) */}
              Tentar de novo
            </button>
          </div>
        </div>
      ) : estado.pagina.rows.length === 0 ? (
        <p
          data-testid="creators-para-conferir-vazio"
          className="text-sm font-semibold text-slate-600"
        >
          {/* TODO(Ana) */}
          Nada para conferir.
        </p>
      ) : (
        <ul className="space-y-2">
          {estado.pagina.rows.map((linha) => {
            const nome = nomeDoDono(linha.creator);
            return (
              <li
                key={linha.id}
                data-testid={`creators-pendente-${linha.id}`}
                // TRES FAIXAS NO CELULAR (lote 11m): quem e a data; os chips;
                // o link numa linha propria e as acoes embaixo, a direita. A
                // grade de duas colunas so existe abaixo do `sm:`, que volta
                // a linha unica de antes (os wrappers viram `contents`).
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 rounded-2xl border-2 border-slate-300 bg-slate-50 px-3 py-2 sm:flex sm:flex-wrap sm:gap-x-3"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <AvatarDoCreator
                    name={nome}
                    avatar={linha.creator.avatar}
                    avatarUrl={linha.creator.avatar_url}
                    size="sm"
                  />
                  <span
                    data-testid="creators-pendente-dono"
                    // No celular o nome quebra por palavra em vez de cortar.
                    className="min-w-0 text-sm font-black text-slate-950 sm:truncate"
                  >
                    {nome}
                  </span>
                </span>
                <span
                  data-testid={`creators-pendente-chips-${linha.id}`}
                  className="col-span-2 flex flex-wrap items-center gap-2 sm:contents"
                >
                  <span className="inline-flex items-center gap-1 rounded-full border-2 border-slate-400 px-2 py-0.5 text-[11px] font-black uppercase text-slate-700">
                    <IconeDaRede rede={linha.network} className="h-3 w-3" />
                    {rotuloDaRede(linha.network)}
                  </span>
                  <span className="rounded-full border-2 border-slate-400 px-2 py-0.5 text-[11px] font-black uppercase text-slate-700">
                    {rotuloDoTipo(linha.kind)}
                  </span>
                </span>
                <a
                  href={linha.url}
                  target="_blank"
                  rel="noreferrer"
                  data-testid={`creators-pendente-link-${linha.id}`}
                  className="col-span-2 min-w-0 flex-1 truncate py-2.5 text-sm font-bold text-violet-800 underline underline-offset-2 sm:py-0"
                >
                  {urlCurta(linha.url)}
                </a>
                <span
                  data-testid={`creators-pendente-data-${linha.id}`}
                  className="col-start-2 row-start-1 justify-self-end text-xs font-bold tabular-nums text-slate-500"
                >
                  {dataCurta(linha.created_at)}
                </span>
                {confirmandoRemocao === linha.id ? (
                  <span className="col-span-2 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      data-testid={`creators-pendente-confirmar-remocao-${linha.id}`}
                      onClick={() => void remover(linha)}
                      disabled={agindo === linha.id}
                      className={BOTAO_SECUNDARIO}
                    >
                      {/* TODO(Ana) */}
                      {agindo === linha.id
                        ? "Removendo..."
                        : "Confirmar remoção"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoRemocao(null)}
                      disabled={agindo === linha.id}
                      className={BOTAO_SECUNDARIO}
                    >
                      {/* TODO(Ana) */}
                      Manter
                    </button>
                  </span>
                ) : (
                  <span
                    data-testid={`creators-pendente-acoes-${linha.id}`}
                    className="col-span-2 flex flex-wrap items-center justify-end gap-2"
                  >
                    <button
                      type="button"
                      data-testid={`creators-pendente-confirmar-${linha.id}`}
                      onClick={() => void confirmar(linha)}
                      disabled={agindo === linha.id}
                      className={BOTAO_CONFIRMAR}
                    >
                      {/* TODO(Ana) */}
                      {agindo === linha.id ? "Confirmando..." : "Confirmar"}
                    </button>
                    <button
                      type="button"
                      data-testid={`creators-pendente-remover-${linha.id}`}
                      onClick={() => setConfirmandoRemocao(linha.id)}
                      disabled={agindo === linha.id}
                      className="bnt-pressable inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 bg-white p-1.5 text-slate-900 sm:inline-block sm:h-auto sm:w-auto"
                      // TODO(Ana)
                      aria-label="Remover publicação"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {totalDePaginas > 1 ? (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="min-h-10 rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_var(--bnt-shadow)] sm:min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-40 disabled:shadow-none"
          >
            {/* TODO(Ana) */}
            Anterior
          </button>
          <span className="text-sm font-black text-slate-950">
            {/* TODO(Ana) */}
            {`Página ${page} de ${totalDePaginas}`}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalDePaginas, p + 1))}
            disabled={page >= totalDePaginas}
            className="min-h-10 rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0_var(--bnt-shadow)] sm:min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-40 disabled:shadow-none"
          >
            {/* TODO(Ana) */}
            Próxima
          </button>
        </div>
      ) : null}
    </section>
  );
}
