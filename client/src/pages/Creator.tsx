import { useEffect, useState } from "react";
import { KeyRound, Share2, Sparkles } from "lucide-react";
import { Link } from "wouter";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { BlocoBoundary } from "@/components/admin/BlocoBoundary";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { CabecalhoDeSecao } from "@/components/creator/CabecalhoDeSecao";
import { CreatorDashboardView } from "@/components/creator/CreatorDashboardView";
import { CreatorPixForm } from "@/components/creator/CreatorPixForm";
import { CreatorRedesForm } from "@/components/creator/CreatorRedesForm";
import { useCreatorPerfil } from "@/components/creator/useCreatorPerfil";
import { AdminApiError, contentFetch } from "@/lib/adminApi";
import {
  CREATOR_DASHBOARD_JANELA_PADRAO,
  type CreatorDashboard,
  type CreatorDashboardJanela,
} from "@shared/creatorDashboard";

// PAINEL DO PROPRIO CREATOR. Esta pagina BUSCA; quem desenha e o
// CreatorDashboardView, que o admin reaproveita no lote 04 com outra fonte.
//
// O 403 `not_creator` tem tela propria e NAO redireciona: sumir com a pessoa em
// silencio para a home esconderia que ela chegou num lugar que nao e dela, e um
// link compartilhado para /creator sem explicacao nenhuma e pior que uma frase.
// O 403 `creator_check_failed` (o servidor nao conseguiu conferir) NAO e "voce
// nao e creator": cai no erro generico, com "tentar de novo".
//
// ESTRUTURA DO ADMIN: faixa `hero-pattern` no topo com o titulo, e corpo
// `section-alt` com o painel. SEM cartao de identidade: o avatar da pessoa ja
// esta no header do site, e repeti-lo aqui era redundante. Por isso a view
// recebe `identidade="nenhuma"`. No admin a identidade continua, porque la quem
// olha e outra pessoa.
//
// PERFIL DE CREATOR: a PAGINA busca o perfil (useCreatorPerfil, lote 08b) e
// entrega aos dois formularios, que so gravam. A busca subiu para ca porque o
// que falta preencher precisa ser sabido fora da secao de perfil. Ela tambem
// fica FORA do condicional do painel: trocar a janela do grafico poe o painel
// em "carregando", e um formulario que desmontasse ali perderia o que a pessoa
// estivesse digitando. Enquanto o perfil nao respondeu, `temPix` e null e o
// aviso nao aparece: "nao sei" nao e "sem chave".

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "nao_creator" }
  | { tipo: "ok"; painel: CreatorDashboard };

function painelDaResposta(json: unknown): CreatorDashboard | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: unknown }).data;
  if (
    typeof data !== "object" ||
    data === null ||
    !("creator" in data) ||
    !("totais" in data) ||
    !("codigos" in data) ||
    !("eventos" in data)
  ) {
    return null;
  }
  return data as CreatorDashboard;
}

export default function Creator() {
  const [janela, setJanela] = useState<CreatorDashboardJanela>(
    CREATOR_DASHBOARD_JANELA_PADRAO,
  );
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const perfil = useCreatorPerfil();
  const temPix =
    perfil.estado.tipo === "ok" ? perfil.estado.perfil.pix !== null : null;

  useEffect(() => {
    let cancelado = false;
    // Zera ao trocar de janela: o painel anterior sob o rotulo novo diria
    // "7 dias" mostrando trinta.
    setEstado({ tipo: "carregando" });
    contentFetch(`/creator/me?janela=${janela}`)
      .then((json: unknown) => {
        if (cancelado) return;
        const painel = painelDaResposta(json);
        setEstado(painel ? { tipo: "ok", painel } : { tipo: "erro" });
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        const naoCreator =
          err instanceof AdminApiError &&
          err.status === 403 &&
          err.code === "not_creator";
        setEstado(naoCreator ? { tipo: "nao_creator" } : { tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [janela, tentativa]);

  return (
    <Layout>
      {/* TODO(Ana) */}
      <SEO title="Painel de Creator" url="/creator" noindex />
      <section className="hero-pattern border-b-2 border-slate-900 py-8 md:py-10">
        <div className="container">
          <div>
            <p className="social-badge mb-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wide">
              <Sparkles className="h-4 w-4" />
              {/* TODO(Ana) */}
              painel de creator
            </p>
            <h1 className="font-display text-4xl font-black text-slate-950 lg:text-5xl">
              {/* TODO(Ana) */}
              Painel de Creator
            </h1>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-relaxed text-slate-700">
              {/* TODO(Ana) */}
              Seu link, seus números e o que você já gerou para a Bora na Tech.
            </p>
          </div>
        </div>
      </section>

      <section className="section-alt py-8 md:py-10">
        <div className="container space-y-10">
          {estado.tipo === "carregando" ? (
            // TODO(Ana)
            <LoadingBlock label="Carregando seu painel..." />
          ) : estado.tipo === "erro" ? (
            <div data-testid="creator-erro" className="space-y-3">
              {/* TODO(Ana) */}
              <ErrorBlock message="Não foi possível carregar o seu painel agora." />
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
          ) : estado.tipo === "nao_creator" ? (
            <section
              data-testid="creator-nao-creator"
              className="card-brutal rounded-3xl bg-white p-6 text-center"
            >
              <p className="font-display text-lg font-black text-slate-950">
                {/* TODO(Ana) */}
                Este painel é para creators da Bora na Tech.
              </p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm font-black text-slate-900 underline underline-offset-2"
              >
                {/* TODO(Ana) */}
                Voltar para a página inicial
              </Link>
            </section>
          ) : (
            <CreatorDashboardView
              painel={estado.painel}
              janela={janela}
              onJanelaChange={setJanela}
              visao="creator"
              identidade="nenhuma"
              semChavePix={temPix === false}
            />
          )}

          {estado.tipo !== "nao_creator" ? (
            <BlocoBoundary
              // TODO(Ana)
              nome="Seu perfil de creator"
            >
              <SecaoDoPerfil perfil={perfil} />
            </BlocoBoundary>
          ) : null}
        </div>
      </section>
    </Layout>
  );
}

/**
 * Secao de perfil: o cabecalho, e dentro dele os dois formularios. Eles nao
 * buscam nada; quem leu o perfil foi a pagina.
 */
function SecaoDoPerfil({
  perfil,
}: {
  perfil: ReturnType<typeof useCreatorPerfil>;
}) {
  const { estado, recarregar, definirPerfil, definirPix } = perfil;

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
              onClick={recarregar}
              className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
            >
              {/* TODO(Ana) */}
              Tentar de novo
            </button>
          </div>
        </div>
      ) : (
        <div className="card-brutal space-y-8 rounded-3xl bg-white p-5 sm:p-6">
          <div className="space-y-4">
            <h3 className="font-display text-lg font-black text-slate-950">
              {/* TODO(Ana) */}
              Redes
            </h3>
            <CreatorRedesForm perfil={estado.perfil} onSalvo={definirPerfil} />
          </div>

          <div className="space-y-4 border-t-2 border-dashed border-slate-300 pt-6">
            <h3 className="flex items-center gap-2 font-display text-lg font-black text-slate-950">
              <KeyRound aria-hidden="true" className="h-5 w-5" />
              {/* TODO(Ana) */}
              Chave Pix
            </h3>
            <p className="max-w-2xl text-sm font-semibold text-slate-600">
              {/* TODO(Ana) */}É por esta chave que a sua comissão será paga.
            </p>
            <CreatorPixForm pix={estado.perfil.pix} onSalvo={definirPix} />
          </div>
        </div>
      )}
    </section>
  );
}
