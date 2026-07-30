import { useState } from "react";

import type { UserDetail } from "./types";
import { avatarModeLabelOf } from "./userFormat";

// Copy revisada e aprovada em 2026-07-29. "Foto atual" ficou como estava, e
// NAO virou "Aprovada": avatar_moderation_status tem DEFAULT 'clean' na coluna
// (migration 20260618120000) e o upload grava 'clean' direto, sem revisao. Em
// producao sao 3198 perfis, todos 'clean', e ZERO com
// avatar_moderation_reviewed_by preenchido. "Aprovada" afirmaria um veredito
// que nunca houve, para 1777 fotos.
export function AvatarBlock({ avatar }: { avatar: UserDetail["avatar"] }) {
  const [broken, setBroken] = useState(false);
  const url = avatar?.url ?? null;
  const status = avatar?.moderation_status ?? null;
  const showImage = Boolean(url) && !broken;

  const statusBadge =
    status === "pending_review"
      ? {
          label: "Aguardando aprovação",
          className: "border-amber-500 bg-amber-100 text-amber-900",
        }
      : status === "removed"
        ? {
            label: "Rejeitada",
            className: "border-rose-500 bg-rose-100 text-rose-900",
          }
        : url
          ? {
              label: "Foto atual",
              className: "border-emerald-600 bg-emerald-100 text-emerald-900",
            }
          : null;

  return (
    <div className="flex items-start gap-4 rounded-2xl border-2 border-slate-900 bg-violet-50 p-4 sm:col-span-2">
      {showImage ? (
        <img
          src={url as string}
          alt="Foto do usuário"
          onError={() => setBroken(true)}
          className="h-24 w-24 shrink-0 rounded-2xl border-2 border-slate-900 object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-400 bg-white text-xs font-black uppercase text-slate-400">
          Sem foto
        </div>
      )}
      <div className="space-y-2">
        {statusBadge ? (
          <span
            className={`inline-block rounded-full border-2 px-3 py-1 text-xs font-black uppercase ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        ) : null}
        {status === "removed" ? (
          <p className="text-sm font-semibold text-slate-600">
            Rejeitada e removida pela moderação.
          </p>
        ) : status === "pending_review" ? (
          <p className="text-sm font-semibold text-slate-600">
            Ainda não está pública: aguarda aprovação.
          </p>
        ) : !url ? (
          <p className="text-sm font-semibold text-slate-600">
            Sem foto enviada.
          </p>
        ) : null}
        <p className="text-xs font-black uppercase tracking-wide text-violet-700">
          Modo do avatar: {avatarModeLabelOf(avatar?.mode)}
        </p>
      </div>
    </div>
  );
}
