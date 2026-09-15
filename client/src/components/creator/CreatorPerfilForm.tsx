import { useEffect, useState } from "react";
import { KeyRound, Share2 } from "lucide-react";
import { toast } from "sonner";

import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { CabecalhoDeSecao } from "@/components/creator/CreatorDashboardView";
import { BntSelect } from "@/components/shared/BntSelect";
import { AdminApiError, contentFetch } from "@/lib/adminApi";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";
import {
  normalizarChavePix,
  normalizarHandle,
  normalizarSeguidores,
  TIPOS_DE_CHAVE_PIX,
  type CodigoDeChavePix,
  type CreatorPerfilDados,
  type CreatorPixMascarada,
  type TipoDeChavePix,
} from "@shared/creatorProfile";

// PERFIL DE CREATOR NO /creator (lote 08): as redes com os seguidores
// declarados, o consentimento de aparecer para outros creators e a chave Pix
// por onde a comissao sera paga.
//
// BUSCA E GRAVA SOZINHO, e mora na pagina FORA do painel de numeros: trocar a
// janela do grafico recarrega o painel, e se este formulario vivesse dentro
// dele, o que a pessoa estivesse digitando sumiria a cada troca. Tambem por
// isso o painel nao espera por ele. A pagina so fica sabendo se ha chave
// (`onPixChange`), para o aviso do topo.
//
// A CHAVE INTEIRA NUNCA FICA AQUI: o servidor devolve a mascarada, e o que foi
// digitado para salvar e apagado do estado assim que a gravacao responde. As
// regras sao as de shared/creatorProfile.ts, as mesmas do servidor, entao o
// erro aparece antes do envio e o 400 do servidor so aparece se as duas
// divergirem.

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; perfil: CreatorPerfilDados };

type CampoDasRedes =
  | "instagram_handle"
  | "tiktok_handle"
  | "instagram_followers"
  | "tiktok_followers";

type ErrosDasRedes = Partial<Record<CampoDasRedes, string>>;

const inputClass =
  "w-full rounded-[11px] border-[2.5px] border-slate-900 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-950 shadow-[3px_3px_0_var(--bnt-shadow)] outline-none focus:-translate-y-px focus:shadow-[4px_4px_0_var(--bnt-shadow)]";

const labelClass =
  "mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-700";

const erroClass = "mt-1 block text-xs font-bold text-red-600";

const BOTAO_PRIMARIO =
  "inline-flex items-center justify-center rounded-[11px] border-[2.5px] border-slate-900 bg-[var(--brand-yellow)] px-4 py-2.5 text-sm font-black text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_var(--bnt-shadow)] disabled:cursor-not-allowed disabled:opacity-50";

const BOTAO_SECUNDARIO =
  "inline-flex items-center justify-center rounded-[11px] border-[2.5px] border-slate-900 bg-white px-4 py-2.5 text-sm font-black text-slate-900 shadow-[3px_3px_0_var(--bnt-shadow)] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_var(--bnt-shadow)] disabled:cursor-not-allowed disabled:opacity-50";

// TODO(Ana)
const MENSAGEM_DAS_REDES: Record<CampoDasRedes, string> = {
  instagram_handle:
    "@ do Instagram inválido. Use até 30 letras, números, ponto ou sublinhado.",
  tiktok_handle:
    "@ do TikTok inválido. Use de 2 a 24 letras, números, ponto ou sublinhado.",
  instagram_followers: "Use um número inteiro de 0 a 100 milhões.",
  tiktok_followers: "Use um número inteiro de 0 a 100 milhões.",
};

// TODO(Ana)
const MENSAGEM_DA_CHAVE: Record<CodigoDeChavePix, string> = {
  invalid_pix_type: "Escolha o tipo da chave.",
  invalid_pix_cpf: "CPF inválido.",
  invalid_pix_cnpj: "CNPJ inválido.",
  invalid_pix_email: "E-mail inválido.",
  invalid_pix_telefone: "Telefone inválido. Informe o DDD e o número.",
  invalid_pix_aleatoria: "Chave aleatória inválida.",
};

// TODO(Ana)
const ROTULO_DO_TIPO: Record<TipoDeChavePix, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Chave aleatória",
};

/**
 * Rotulo do tipo de chave vindo do servidor. Resolver com fallback neutro: um
 * tipo novo que este bundle ainda nao conhece mostra "Chave Pix" em vez de
 * derrubar a secao.
 */
export function rotuloDoTipoDePix(tipo: string): string {
  return (
    (ROTULO_DO_TIPO as Record<string, string | undefined>)[tipo] ?? "Chave Pix"
  );
}

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
      "boolean" ||
    !("pix" in data)
  ) {
    return null;
  }
  return data as CreatorPerfilDados;
}

function pixDaResposta(json: unknown): CreatorPixMascarada | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: { pix?: unknown } }).data;
  const pix = data?.pix;
  if (typeof pix !== "object" || pix === null) return null;
  return pix as CreatorPixMascarada;
}

export function CreatorPerfilForm({
  onPixChange,
}: {
  onPixChange?: (temPix: boolean) => void;
}) {
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [seguidoresInstagram, setSeguidoresInstagram] = useState("");
  const [seguidoresTiktok, setSeguidoresTiktok] = useState("");
  const [visivel, setVisivel] = useState(false);
  const [erros, setErros] = useState<ErrosDasRedes>({});
  const [salvando, setSalvando] = useState(false);

  const [editandoPix, setEditandoPix] = useState(false);
  const [tipoPix, setTipoPix] = useState<string>("");
  const [valorPix, setValorPix] = useState("");
  const [erroPix, setErroPix] = useState<string | null>(null);
  const [salvandoPix, setSalvandoPix] = useState(false);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  function preencher(perfil: CreatorPerfilDados) {
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
  }

  useEffect(() => {
    let cancelado = false;
    setEstado({ tipo: "carregando" });
    contentFetch("/creator/profile")
      .then((json: unknown) => {
        if (cancelado) return;
        const perfil = perfilDaResposta(json);
        if (!perfil) {
          setEstado({ tipo: "erro" });
          return;
        }
        preencher(perfil);
        setEstado({ tipo: "ok", perfil });
        onPixChange?.(perfil.pix !== null);
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
    // onPixChange fica de fora das dependencias de proposito: a pagina pode
    // passar uma funcao nova a cada render, e isso nao e motivo para buscar o
    // perfil de novo. So o "tentar de novo" busca outra vez.
  }, [tentativa]);

  async function salvarRedes() {
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
      const perfil = perfilDaResposta(json);
      if (perfil) {
        preencher(perfil);
        setEstado({ tipo: "ok", perfil });
      }
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

  async function salvarPix() {
    const chave = normalizarChavePix(tipoPix, valorPix);
    if (!chave.ok) {
      setErroPix(MENSAGEM_DA_CHAVE[chave.code]);
      return;
    }
    setErroPix(null);
    setSalvandoPix(true);
    try {
      const json: unknown = await contentFetch("/creator/pix", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: tipoPix, valor: valorPix }),
      });
      const pix = pixDaResposta(json);
      setEstado((atual) =>
        atual.tipo === "ok"
          ? { tipo: "ok", perfil: { ...atual.perfil, pix } }
          : atual,
      );
      setValorPix("");
      setTipoPix("");
      setEditandoPix(false);
      onPixChange?.(pix !== null);
      // TODO(Ana)
      toast.success("Chave Pix salva.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível salvar a sua chave Pix.",
      );
    } finally {
      setSalvandoPix(false);
    }
  }

  async function removerPix() {
    setRemovendo(true);
    try {
      await contentFetch("/creator/pix", { method: "DELETE" });
      setEstado((atual) =>
        atual.tipo === "ok"
          ? { tipo: "ok", perfil: { ...atual.perfil, pix: null } }
          : atual,
      );
      setConfirmandoRemocao(false);
      onPixChange?.(false);
      // TODO(Ana)
      toast.success("Chave Pix removida.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível remover a sua chave Pix.",
      );
    } finally {
      setRemovendo(false);
    }
  }

  function cancelarPix() {
    setValorPix("");
    setTipoPix("");
    setErroPix(null);
    setEditandoPix(false);
  }

  return (
    <section
      id="creator-perfil"
      data-testid="creator-perfil"
      aria-labelledby="creator-perfil-titulo"
      className="scroll-mt-28 space-y-5"
    >
      <CabecalhoDeSecao
        id="creator-perfil-titulo"
        icone={<Share2 className="h-4 w-4" />}
        // TODO(Ana)
        selo="redes e pagamento"
        // TODO(Ana)
        titulo="Seu perfil de creator"
        // TODO(Ana)
        frase="Suas redes, seus seguidores e a chave Pix por onde a sua comissão será paga."
      />

      {estado.tipo === "carregando" ? (
        // TODO(Ana)
        <LoadingBlock label="Carregando seu perfil..." />
      ) : estado.tipo === "erro" ? (
        <div data-testid="creator-perfil-erro" className="space-y-3">
          {/* TODO(Ana) */}
          <ErrorBlock message="Não foi possível carregar o seu perfil agora." />
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
      ) : (
        <div className="card-brutal space-y-8 rounded-3xl bg-white p-5 sm:p-6">
          <div data-testid="creator-perfil-redes" className="space-y-4">
            <h3 className="font-display text-lg font-black text-slate-950">
              {/* TODO(Ana) */}
              Redes
            </h3>
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
            {estado.perfil.followers_updated_at ? (
              <p
                data-testid="creator-perfil-seguidores-data"
                className="text-xs font-bold text-slate-500"
              >
                {/* TODO(Ana) */}
                {`Seguidores informados em ${dataCurta(estado.perfil.followers_updated_at)}`}
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
              onClick={() => void salvarRedes()}
              disabled={salvando}
              className={BOTAO_PRIMARIO}
            >
              {/* TODO(Ana) */}
              {salvando ? "Salvando..." : "Salvar redes"}
            </button>
          </div>

          <div
            data-testid="creator-perfil-pix"
            className="space-y-4 border-t-2 border-dashed border-slate-300 pt-6"
          >
            <h3 className="flex items-center gap-2 font-display text-lg font-black text-slate-950">
              <KeyRound aria-hidden="true" className="h-5 w-5" />
              {/* TODO(Ana) */}
              Chave Pix
            </h3>
            <p className="max-w-2xl text-sm font-semibold text-slate-600">
              {/* TODO(Ana) */}É por esta chave que a sua comissão será paga.
            </p>

            {estado.perfil.pix && !editandoPix ? (
              <div className="space-y-3">
                <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                    {rotuloDoTipoDePix(estado.perfil.pix.tipo)}
                  </p>
                  <p
                    data-testid="creator-pix-mascarada"
                    className="font-display mt-1 break-all text-xl font-black tabular-nums text-slate-950"
                  >
                    {estado.perfil.pix.mascarada}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {/* TODO(Ana) */}
                    {`Atualizada em ${dataCurta(estado.perfil.pix.updated_at)}`}
                  </p>
                </div>
                {confirmandoRemocao ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-rose-800">
                      {/* TODO(Ana) */}
                      Remover a chave? Sem ela a comissão não tem para onde ir.
                    </p>
                    <button
                      type="button"
                      data-testid="creator-pix-confirmar-remocao"
                      onClick={() => void removerPix()}
                      disabled={removendo}
                      className={BOTAO_SECUNDARIO}
                    >
                      {/* TODO(Ana) */}
                      {removendo ? "Removendo..." : "Confirmar remoção"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoRemocao(false)}
                      disabled={removendo}
                      className={BOTAO_SECUNDARIO}
                    >
                      {/* TODO(Ana) */}
                      Manter a chave
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-testid="creator-pix-alterar"
                      onClick={() => setEditandoPix(true)}
                      className={BOTAO_SECUNDARIO}
                    >
                      {/* TODO(Ana) */}
                      Alterar
                    </button>
                    <button
                      type="button"
                      data-testid="creator-pix-remover"
                      onClick={() => setConfirmandoRemocao(true)}
                      className={BOTAO_SECUNDARIO}
                    >
                      {/* TODO(Ana) */}
                      Remover
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div data-testid="creator-pix-form" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
                  <div>
                    {/* TODO(Ana) */}
                    <span className={labelClass}>Tipo da chave</span>
                    <BntSelect
                      accent="gold"
                      // TODO(Ana)
                      label="Tipo da chave Pix"
                      // TODO(Ana)
                      placeholder="Escolha o tipo..."
                      value={tipoPix}
                      onValueChange={setTipoPix}
                      options={TIPOS_DE_CHAVE_PIX.map((tipo) => ({
                        value: tipo,
                        label: ROTULO_DO_TIPO[tipo],
                      }))}
                    />
                  </div>
                  <label className="block">
                    {/* TODO(Ana) */}
                    <span className={labelClass}>Chave</span>
                    <input
                      value={valorPix}
                      onChange={(e) => setValorPix(e.target.value)}
                      className={inputClass}
                      autoComplete="off"
                    />
                    {erroPix ? (
                      <span className={erroClass}>{erroPix}</span>
                    ) : null}
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="creator-pix-salvar"
                    onClick={() => void salvarPix()}
                    disabled={salvandoPix}
                    className={BOTAO_PRIMARIO}
                  >
                    {/* TODO(Ana) */}
                    {salvandoPix ? "Salvando..." : "Salvar chave Pix"}
                  </button>
                  {estado.perfil.pix ? (
                    <button
                      type="button"
                      onClick={cancelarPix}
                      disabled={salvandoPix}
                      className={BOTAO_SECUNDARIO}
                    >
                      {/* TODO(Ana) */}
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
