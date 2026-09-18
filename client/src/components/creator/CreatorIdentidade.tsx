import { useState } from "react";
import { toast } from "sonner";

import UserAvatar from "@/components/UserAvatar";
import { rotuloDoTipoDePix } from "@/components/creator/CreatorPixForm";
import { adminFetch } from "@/lib/adminApi";
import { rotuloDoKind } from "@/lib/creatorKindLabel";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";
import type { CreatorDashboard } from "@shared/creatorDashboard";
import { ROTULO_DA_COR, type CreatorPerfilDados } from "@shared/creatorProfile";
import { MarcadorDeCor } from "@/components/creator/MarcadorDeCor";

// QUEM E O CREATOR: avatar, nome, @handle, kind e desde quando. Hoje so o admin
// o desenha, dentro do CreatorDashboardView (`identidade="embutida"`), porque la
// quem olha e outra pessoa. A pagina /creator passa `identidade="nenhuma"`: o
// avatar da propria pessoa ja esta no header do site. Os test ids
// `creator-kind`, `creator-email` e `creator-revogado` moram aqui.
//
// E-mail e revogacao so na visao admin: o servidor nem os envia na visao
// creator, e a guarda aqui cobre o payload que vier com eles mesmo assim.
//
// PERFIL DE CREATOR (lote 08), so na visao admin: as redes com link, os
// seguidores declarados com a data, o consentimento, e a linha de Pix com a
// chave MASCARADA e o Revelar. O Revelar copia o CPF do modal de usuario: chama
// a rota auditada e mostra a chave inteira ate o painel fechar (a aba monta o
// painel com `key` do creator, entao fechar desmonta este estado). Sem
// `perfilCreator` (backend anterior ao lote 08, na janela de deploy), as duas
// linhas simplesmente nao aparecem.

/** Instante ISO em dd/mm/aaaa, pelo dia civil de Brasilia. */
function dataCurta(iso: string | null | undefined): string {
  const dia = diaBrasilia(iso);
  return dia ? formatarDiaCivil(dia) : "";
}

function inteiro(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

const LINK_DA_REDE =
  "font-black text-violet-800 underline underline-offset-2 hover:text-violet-900";

function RedesDoCreator({ perfil }: { perfil: CreatorPerfilDados }) {
  const seguidores: string[] = [];
  if (perfil.instagram_followers !== null) {
    // TODO(Ana)
    seguidores.push(`${inteiro(perfil.instagram_followers)} no Instagram`);
  }
  if (perfil.tiktok_followers !== null) {
    // TODO(Ana)
    seguidores.push(`${inteiro(perfil.tiktok_followers)} no TikTok`);
  }
  const semRede = !perfil.instagram_handle && !perfil.tiktok_handle;

  return (
    <div
      data-testid="creator-redes"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
    >
      {perfil.instagram_handle ? (
        <a
          data-testid="creator-instagram"
          href={`https://www.instagram.com/${perfil.instagram_handle}/`}
          target="_blank"
          rel="noreferrer"
          className={LINK_DA_REDE}
        >
          @{perfil.instagram_handle}
        </a>
      ) : null}
      {perfil.tiktok_handle ? (
        <a
          data-testid="creator-tiktok"
          href={`https://www.tiktok.com/@${perfil.tiktok_handle}`}
          target="_blank"
          rel="noreferrer"
          className={LINK_DA_REDE}
        >
          @{perfil.tiktok_handle}
        </a>
      ) : null}
      {semRede ? (
        <span className="text-xs font-bold text-slate-500">
          {/* TODO(Ana) */}
          Sem redes informadas
        </span>
      ) : null}
      {seguidores.length > 0 ? (
        <span
          data-testid="creator-seguidores"
          className="text-xs font-bold text-slate-500"
        >
          {/* TODO(Ana) */}
          {`${seguidores.join(", ")}, informados em ${dataCurta(perfil.followers_updated_at)}`}
        </span>
      ) : null}
      {perfil.visible_to_creators ? (
        <span
          data-testid="creator-visivel"
          className="rounded-full border-2 border-emerald-700 bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-800"
        >
          {/* TODO(Ana) */}
          visível aos creators
        </span>
      ) : null}
      {/* Cor no calendario (lote 10c). Sem o campo (backend anterior), o chip
          nao aparece: ausente e "nao sei", nao "violeta". */}
      {perfil.calendar_color ? (
        <span
          data-testid="creator-cor"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-400 bg-white px-2.5 py-0.5 text-xs font-black text-slate-700"
        >
          <MarcadorDeCor cor={perfil.calendar_color} />
          {/* TODO(Ana) */}
          {`${rotuloDaCor(perfil.calendar_color)} no calendário`}
        </span>
      ) : null}
    </div>
  );
}

/** Rotulo da cor vindo do servidor; cor que o bundle nao conhece vira o nome
 * cru, em vez de derrubar o cartao. */
function rotuloDaCor(cor: string): string {
  return (ROTULO_DA_COR as Record<string, string | undefined>)[cor] ?? cor;
}

function PixDoCreator({
  perfil,
  userId,
}: {
  perfil: CreatorPerfilDados;
  userId: string | undefined;
}) {
  const [revelada, setRevelada] = useState<string | null>(null);
  const [revelando, setRevelando] = useState(false);

  async function revelar() {
    if (!userId) return;
    setRevelando(true);
    try {
      const json = await adminFetch(`/creators/${userId}/reveal-pix`, {
        method: "POST",
      });
      setRevelada(json.data?.valor ?? null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Erro ao revelar a chave Pix.",
      );
    } finally {
      setRevelando(false);
    }
  }

  if (!perfil.pix) {
    return (
      <span
        data-testid="creator-sem-pix-admin"
        className="rounded-full border-2 border-amber-600 bg-amber-50 px-2 py-0.5 text-[11px] font-black uppercase text-amber-900"
      >
        {/* TODO(Ana) */}
        sem chave Pix
      </span>
    );
  }

  return (
    <div
      data-testid="creator-pix-admin"
      className="rounded-2xl border-2 border-slate-900 bg-violet-50 p-4"
    >
      <p className="text-[11px] font-black uppercase tracking-wide text-violet-700">
        {/* TODO(Ana) */}
        {`Pix (${rotuloDoTipoDePix(perfil.pix.tipo)})`}
      </p>
      <p
        data-testid="creator-pix-valor"
        className="mt-1 break-words font-display text-base font-black text-slate-950"
      >
        {revelada ?? perfil.pix.mascarada}
      </p>
      {!revelada && userId ? (
        <button
          type="button"
          data-testid="creator-pix-revelar"
          onClick={() => void revelar()}
          disabled={revelando}
          className="mt-3 rounded-full border-2 border-slate-900 bg-yellow-300 px-4 py-1.5 text-xs font-black uppercase disabled:opacity-60"
        >
          {/* TODO(Ana) */}
          {revelando ? "Revelando..." : "Revelar chave Pix"}
        </button>
      ) : null}
      <p className="mt-2 text-xs font-semibold text-slate-500">
        {/* TODO(Ana) */}
        Revelar fica registrado: quem revelou, de quem e quando.
      </p>
    </div>
  );
}

export function CreatorIdentidade({
  perfil,
  creator,
  visao,
  perfilCreator,
  userId,
}: {
  perfil: CreatorDashboard["perfil"];
  creator: CreatorDashboard["creator"];
  visao: "creator" | "admin";
  /** Perfil de creator do lote 08. So a visao admin o recebe. */
  perfilCreator?: CreatorPerfilDados;
  /** Quem e o creator, para o Revelar. So a aba Creators do admin passa. */
  userId?: string;
}) {
  // TODO(Ana)
  const nome = perfil.name ?? perfil.handle ?? "Creator";
  const mostrarPerfil = visao === "admin" && perfilCreator !== undefined;

  return (
    <section
      data-testid="creator-identidade"
      className="card-brutal rounded-3xl bg-white p-5"
    >
      <div className="flex items-center gap-4">
        <UserAvatar
          name={nome}
          avatarUrl={perfil.avatar_url}
          mode={perfil.avatar_url ? "photo" : "icon"}
          size="lg"
        />
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-black text-slate-950">
            {nome}
          </h2>
          {perfil.handle ? (
            <p className="text-sm font-bold text-slate-600">@{perfil.handle}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              data-testid="creator-kind"
              className="rounded-full border-2 border-ink-on-accent bg-sky-300 px-2.5 py-0.5 text-xs font-black text-ink-on-accent"
            >
              {rotuloDoKind(creator.kind)}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {/* TODO(Ana) */}
              {`Creator desde ${dataCurta(creator.granted_at)}`}
            </span>
            {visao === "admin" && creator.revoked_at ? (
              <span
                data-testid="creator-revogado"
                className="rounded-full border-2 border-rose-700 bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-800"
              >
                {/* TODO(Ana) */}
                {`Revogado em ${dataCurta(creator.revoked_at)}`}
              </span>
            ) : null}
            {visao === "admin" && perfil.email ? (
              <p
                data-testid="creator-email"
                className="break-all text-sm font-bold text-slate-700"
              >
                {perfil.email}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {mostrarPerfil && perfilCreator ? (
        <div className="mt-4 space-y-3 border-t-2 border-dashed border-slate-300 pt-4">
          <RedesDoCreator perfil={perfilCreator} />
          <PixDoCreator perfil={perfilCreator} userId={userId} />
        </div>
      ) : null}
    </section>
  );
}
