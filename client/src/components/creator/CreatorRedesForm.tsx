import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  BOTAO_PRIMARIO,
  erroClass,
  inputClass,
  labelClass,
} from "@/components/creator/creatorFormEstilos";
import { AdminApiError, contentFetch } from "@/lib/adminApi";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";
import {
  normalizarHandle,
  normalizarSeguidores,
  type CreatorPerfilDados,
} from "@shared/creatorProfile";

// REDES DO CREATOR (lote 08b): o @ do Instagram e do TikTok, os seguidores
// declarados e o consentimento de aparecer para outros creators.
//
// Metade do antigo CreatorPerfilForm, separada do Pix porque sao dois assuntos
// com dois destinos diferentes (as redes aparecem para outros creators; a chave
// e por onde o dinheiro sai) e porque uma falha ao salvar um nao pode levar o
// outro junto.
//
// NAO BUSCA: recebe o perfil ja lido pela pagina (useCreatorPerfil) e devolve
// por `onSalvo` o perfil que o servidor releu. As regras sao as de
// shared/creatorProfile.ts, as mesmas do servidor, entao o erro aparece antes
// do envio e o 400 do servidor so aparece se as duas divergirem.

type CampoDasRedes =
  | "instagram_handle"
  | "tiktok_handle"
  | "instagram_followers"
  | "tiktok_followers";

type ErrosDasRedes = Partial<Record<CampoDasRedes, string>>;

// TODO(Ana)
const MENSAGEM_DAS_REDES: Record<CampoDasRedes, string> = {
  instagram_handle:
    "@ do Instagram inválido. Use até 30 letras, números, ponto ou sublinhado.",
  tiktok_handle:
    "@ do TikTok inválido. Use de 2 a 24 letras, números, ponto ou sublinhado.",
  instagram_followers: "Use um número inteiro de 0 a 100 milhões.",
  tiktok_followers: "Use um número inteiro de 0 a 100 milhões.",
};

/** Codigo de erro do servidor para o campo das redes que ele aponta. */
const CAMPO_DO_CODIGO: Record<string, CampoDasRedes | undefined> = {
  invalid_instagram_handle: "instagram_handle",
  invalid_tiktok_handle: "tiktok_handle",
  invalid_instagram_followers: "instagram_followers",
  invalid_tiktok_followers: "tiktok_followers",
};

function dataCurta(iso: string | null): string {
  const dia = diaBrasilia(iso);
  return dia ? formatarDiaCivil(dia) : "";
}

/** "" vira null; so digitos vira numero; qualquer outra coisa e invalido. */
function seguidoresDoTexto(texto: string): number | null | "invalido" {
  const limpo = texto.trim();
  if (limpo === "") return null;
  if (!/^\d+$/.test(limpo)) return "invalido";
  return Number(limpo);
}

function perfilDaResposta(json: unknown): CreatorPerfilDados | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: unknown }).data;
  if (
    typeof data !== "object" ||
    data === null ||
    typeof (data as { visible_to_creators?: unknown }).visible_to_creators !==
      "boolean"
  ) {
    return null;
  }
  return data as CreatorPerfilDados;
}

export function CreatorRedesForm({
  perfil,
  onSalvo,
}: {
  perfil: CreatorPerfilDados;
  onSalvo: (perfil: CreatorPerfilDados) => void;
}) {
  const [instagram, setInstagram] = useState(perfil.instagram_handle ?? "");
  const [tiktok, setTiktok] = useState(perfil.tiktok_handle ?? "");
  const [seguidoresInstagram, setSeguidoresInstagram] = useState(
    perfil.instagram_followers === null
      ? ""
      : String(perfil.instagram_followers),
  );
  const [seguidoresTiktok, setSeguidoresTiktok] = useState(
    perfil.tiktok_followers === null ? "" : String(perfil.tiktok_followers),
  );
  const [visivel, setVisivel] = useState(perfil.visible_to_creators);
  const [erros, setErros] = useState<ErrosDasRedes>({});
  const [salvando, setSalvando] = useState(false);

  // O perfil so muda de identidade quando a pagina rele ou quando este
  // formulario salva. Nao e a cada render do pai, entao isto NAO apaga o que a
  // pessoa esta digitando.
  useEffect(() => {
    setInstagram(perfil.instagram_handle ?? "");
    setTiktok(perfil.tiktok_handle ?? "");
    setSeguidoresInstagram(
      perfil.instagram_followers === null
        ? ""
        : String(perfil.instagram_followers),
    );
    setSeguidoresTiktok(
      perfil.tiktok_followers === null ? "" : String(perfil.tiktok_followers),
    );
    setVisivel(perfil.visible_to_creators);
  }, [perfil]);

  async function salvar() {
    const ig = normalizarHandle("instagram", instagram);
    const tt = normalizarHandle("tiktok", tiktok);
    const segIgTexto = seguidoresDoTexto(seguidoresInstagram);
    const segTtTexto = seguidoresDoTexto(seguidoresTiktok);
    const segIg =
      segIgTexto === "invalido"
        ? null
        : normalizarSeguidores("instagram", segIgTexto);
    const segTt =
      segTtTexto === "invalido"
        ? null
        : normalizarSeguidores("tiktok", segTtTexto);

    const novos: ErrosDasRedes = {};
    if (!ig.ok) novos.instagram_handle = MENSAGEM_DAS_REDES.instagram_handle;
    if (!tt.ok) novos.tiktok_handle = MENSAGEM_DAS_REDES.tiktok_handle;
    if (!segIg || !segIg.ok) {
      novos.instagram_followers = MENSAGEM_DAS_REDES.instagram_followers;
    }
    if (!segTt || !segTt.ok) {
      novos.tiktok_followers = MENSAGEM_DAS_REDES.tiktok_followers;
    }
    setErros(novos);
    if (!ig.ok || !tt.ok || !segIg || !segIg.ok || !segTt || !segTt.ok) return;

    setSalvando(true);
    try {
      const json: unknown = await contentFetch("/creator/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagram_handle: ig.valor,
          tiktok_handle: tt.valor,
          instagram_followers: segIg.valor,
          tiktok_followers: segTt.valor,
          visible_to_creators: visivel,
        }),
      });
      const salvo = perfilDaResposta(json);
      if (salvo) onSalvo(salvo);
      // TODO(Ana)
      toast.success("Perfil salvo.");
    } catch (err) {
      const campo =
        err instanceof AdminApiError && err.code
          ? CAMPO_DO_CODIGO[err.code]
          : undefined;
      if (campo) setErros({ [campo]: MENSAGEM_DAS_REDES[campo] });
      toast.error(
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível salvar o seu perfil.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div data-testid="creator-perfil-redes" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          {/* TODO(Ana) */}
          <span className={labelClass}>Instagram @</span>
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className={inputClass}
            // TODO(Ana)
            placeholder="seu.perfil"
            autoComplete="off"
          />
          {erros.instagram_handle ? (
            <span className={erroClass}>{erros.instagram_handle}</span>
          ) : null}
        </label>
        <label className="block">
          {/* TODO(Ana) */}
          <span className={labelClass}>Seguidores no Instagram</span>
          <input
            value={seguidoresInstagram}
            onChange={(e) => setSeguidoresInstagram(e.target.value)}
            className={inputClass}
            inputMode="numeric"
            // TODO(Ana)
            placeholder="12500"
          />
          {erros.instagram_followers ? (
            <span className={erroClass}>{erros.instagram_followers}</span>
          ) : null}
        </label>
        <label className="block">
          {/* TODO(Ana) */}
          <span className={labelClass}>TikTok @</span>
          <input
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            className={inputClass}
            // TODO(Ana)
            placeholder="seu.perfil"
            autoComplete="off"
          />
          {erros.tiktok_handle ? (
            <span className={erroClass}>{erros.tiktok_handle}</span>
          ) : null}
        </label>
        <label className="block">
          {/* TODO(Ana) */}
          <span className={labelClass}>Seguidores no TikTok</span>
          <input
            value={seguidoresTiktok}
            onChange={(e) => setSeguidoresTiktok(e.target.value)}
            className={inputClass}
            inputMode="numeric"
            // TODO(Ana)
            placeholder="800"
          />
          {erros.tiktok_followers ? (
            <span className={erroClass}>{erros.tiktok_followers}</span>
          ) : null}
        </label>
      </div>
      {perfil.followers_updated_at ? (
        <p
          data-testid="creator-perfil-seguidores-data"
          className="text-xs font-bold text-slate-500"
        >
          {/* TODO(Ana) */}
          {`Seguidores informados em ${dataCurta(perfil.followers_updated_at)}`}
        </p>
      ) : null}
      <label
        htmlFor="creator-perfil-visivel"
        className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-slate-900 bg-slate-50 p-3"
      >
        <input
          id="creator-perfil-visivel"
          type="checkbox"
          checked={visivel}
          onChange={(e) => setVisivel(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-violet-700"
        />
        <span className="text-sm font-bold text-slate-900">
          {/* TODO(Ana) */}
          Mostrar meu @ e meus seguidores para outros creators
          <span className="mt-0.5 block text-xs font-semibold text-slate-600">
            {/* TODO(Ana) */}
            Eles aparecem no calendário de creators, que chega em breve.
            Desligado, só o time da Bora na Tech vê.
          </span>
        </span>
      </label>
      <button
        type="button"
        data-testid="creator-perfil-salvar"
        onClick={() => void salvar()}
        disabled={salvando}
        className={BOTAO_PRIMARIO}
      >
        {/* TODO(Ana) */}
        {salvando ? "Salvando..." : "Salvar redes"}
      </button>
    </div>
  );
}
