import UserAvatar from "@/components/UserAvatar";
import { rotuloDoKind } from "@/lib/creatorKindLabel";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";
import type { CreatorDashboard } from "@shared/creatorDashboard";

// QUEM E O CREATOR: avatar, nome, @handle, kind e desde quando. Um componente
// so para os dois donos: o admin o recebe dentro do CreatorDashboardView
// (`identidade="embutida"`), e a pagina /creator o desenha na faixa de topo, ao
// lado do titulo (`identidade="externa"`). Os test ids `creator-kind`,
// `creator-email` e `creator-revogado` moram aqui.
//
// E-mail e revogacao so na visao admin: o servidor nem os envia na visao
// creator, e a guarda aqui cobre o payload que vier com eles mesmo assim.

/** Instante ISO em dd/mm/aaaa, pelo dia civil de Brasilia. */
function dataCurta(iso: string | null | undefined): string {
  const dia = diaBrasilia(iso);
  return dia ? formatarDiaCivil(dia) : "";
}

export function CreatorIdentidade({
  perfil,
  creator,
  visao,
}: {
  perfil: CreatorDashboard["perfil"];
  creator: CreatorDashboard["creator"];
  visao: "creator" | "admin";
}) {
  // TODO(Ana)
  const nome = perfil.name ?? perfil.handle ?? "Creator";

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
    </section>
  );
}
