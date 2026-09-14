import { useEffect, useState } from "react";
import { Link } from "wouter";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { CreatorDashboardView } from "@/components/creator/CreatorDashboardView";
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
      <div className="container space-y-6 py-8 md:py-12">
        <h1 className="font-display text-3xl font-black text-slate-950 md:text-4xl">
          {/* TODO(Ana) */}
          Painel de Creator
        </h1>

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
          />
        )}
      </div>
    </Layout>
  );
}
