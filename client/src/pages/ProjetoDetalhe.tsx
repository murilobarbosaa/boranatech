import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Check, Lock } from "lucide-react";

import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import CopyButton from "@/components/shared/CopyButton";
import ProjectValidationBlock from "@/components/projects/ProjectValidationBlock";
import ProjetoAnel from "@/components/projects/ProjetoAnel";
import ProjetoDepois from "@/components/projects/ProjetoDepois";
import ProjetoEtapas from "@/components/projects/ProjetoEtapas";
import ProjetoPorQue from "@/components/projects/ProjetoPorQue";
import ProjetoRecursos from "@/components/projects/ProjetoRecursos";
import ProjetoRequisitos from "@/components/projects/ProjetoRequisitos";
import ProjetoHero, { type Fato } from "@/components/projects/ProjetoHero";
import ProjetoLateral, {
  type ProximoProjeto,
} from "@/components/projects/ProjetoLateral";
import { type EstadoChip } from "@/components/projects/ProjetoEstadoChip";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useProjectCompletion } from "@/hooks/useProjectCompletion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { projetos } from "@/lib/data";
import { labelForProjectArea } from "@/lib/projectAreaGroup";
import { labelTipoEntrega } from "@/lib/projectState";
import { resolveProjectId } from "@shared/projects/aliases";
import { isProjetoV2, loadProjetoV2 } from "@shared/projects/v2";
import type { ProjetoV2Detalhe } from "@shared/projects/v2/types";

const H2 = "font-display text-xl font-bold text-foreground";
const BLOCO = "border-b border-border pb-8 mb-8 last:mb-0 last:border-b-0";

function urlDaPagina(id: string): string {
  const origem =
    typeof window === "undefined"
      ? "https://boranatech.com.br"
      : window.location.origin;
  return `${origem}/projetos/${id}`;
}

export default function ProjetoDetalhe() {
  const params = useParams<{ id?: string }>();
  const id = resolveProjectId(params.id ?? "");
  const projeto = projetos.find((p) => p.id === id);
  const { isPro } = useSubscription();
  const {
    done: projectsDone,
    stages: projectStages,
    ready: completionReady,
    toggle: toggleCompletion,
    toggleStage,
  } = useProjectCompletion();
  const reduzirMovimento = usePrefersReducedMotion();
  // Validado nao vem de uma lista carregada aqui: quem hidrata e o
  // ProjectValidationBlock, por projeto. A pagina so precisa saber que passou
  // a valer, para o chip de estado.
  const [validado, setValidado] = useState(false);
  const [detalhe, setDetalhe] = useState<ProjetoV2Detalhe | "erro" | null>(
    null,
  );

  const proTravado = projeto?.pro === true && !isPro;
  // O modulo v2 E o conteudo pago: projeto travado nao baixa nada. O efeito
  // fica ACIMA do early return de id inexistente porque hook condicional
  // muda a contagem entre renders.
  useEffect(() => {
    if (!projeto || proTravado || !isProjetoV2(projeto.id)) return;
    let cancelado = false;
    void loadProjetoV2(projeto.id)
      .then((d) => {
        if (!cancelado) setDetalhe(d ?? "erro");
      })
      .catch(() => {
        if (!cancelado) setDetalhe("erro");
      });
    return () => {
      cancelado = true;
    };
  }, [projeto, proTravado]);

  if (!projeto) {
    return (
      <Layout>
        <SEO
          title="Projeto não encontrado · Projetos · Bora na Tech"
          description="Esse projeto pode ter mudado de nome."
          url="/projetos"
          noindex
        />
        <section className="container py-16">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Não encontramos esse projeto
          </h1>
          <p className="mt-3 text-muted-foreground">
            Ele pode ter mudado de nome.
          </p>
          <Link
            href="/projetos"
            className="mt-6 inline-flex rounded-full border-2 border-ink bg-[var(--brand-yellow)] px-5 py-2.5 font-display text-sm font-bold text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)]"
          >
            Ver todos os projetos
          </Link>
        </section>
      </Layout>
    );
  }

  const travado = proTravado;
  const concluido = projectsDone.has(projeto.id);
  const v2 = detalhe !== null && detalhe !== "erro" ? detalhe : null;
  const marcadas = projectStages.get(projeto.id) ?? {};
  const feitas = v2
    ? v2.etapas.filter((e) => e.id in marcadas).length
    : Object.keys(marcadas).length;
  // Primeira etapa nao marcada: e a "atual" da linha do tempo e o alvo do
  // botao principal. -1 quando todas estao feitas.
  const indiceAtual = v2 ? v2.etapas.findIndex((e) => !(e.id in marcadas)) : -1;
  // "Em andamento desde": a marcacao mais antiga entre as etapas feitas. ISO
  // 8601 ordena igual lexicograficamente, entao `sort()` basta.
  const primeiraMarcacao = Object.values(marcadas)
    .sort()
    .map((iso) =>
      new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
    )[0];

  const estado: EstadoChip = travado
    ? { tipo: "pro_travado" }
    : concluido || validado
      ? { tipo: "concluido" }
      : feitas > 0
        ? v2
          ? { tipo: "em_andamento", feitas, total: v2.etapas.length }
          : { tipo: "em_andamento" }
        : { tipo: "nao_iniciado" };

  const proximoNoCatalogo = projeto.proximoProjetoId
    ? projetos.find((p) => p.id === projeto.proximoProjetoId)
    : undefined;
  const proximo: ProximoProjeto | null = proximoNoCatalogo
    ? {
        id: proximoNoCatalogo.id,
        nome: proximoNoCatalogo.nome,
        area: labelForProjectArea(proximoNoCatalogo.areaSlug),
        nivel: proximoNoCatalogo.nivel,
      }
    : null;

  const rolarPara = (ancora: string) => {
    document.getElementById(ancora)?.scrollIntoView({
      behavior: reduzirMovimento ? "auto" : "smooth",
      block: "start",
    });
  };

  const tempo = v2?.briefing.tempoEstimado;
  const fatos: Fato[] = v2
    ? [
        {
          valor: `${tempo!.horas[0]} a ${tempo!.horas[1]} h`,
          legenda: tempo!.semanas
            ? `em ${tempo!.semanas[0]} a ${tempo!.semanas[1]} semanas`
            : "de trabalho",
        },
        {
          valor: labelTipoEntrega(v2.tipoEntrega),
          legenda: "o que você entrega",
        },
        { valor: `${v2.etapas.length} etapas`, legenda: "com checkpoint" },
        {
          valor: `${v2.requisitos.length} requisitos`,
          legenda: "de aceite",
        },
      ]
    : [
        {
          valor: projeto.ferramentas.slice(0, 3).join(", "),
          legenda: "ferramentas",
        },
        { valor: projeto.entregavel, legenda: "o que você entrega" },
      ];

  const acaoPrincipal = v2
    ? indiceAtual === -1
      ? { rotulo: "Ir para a entrega", ancora: "entrega" }
      : feitas === 0
        ? { rotulo: "Começar", ancora: `etapa-${v2.etapas[0].id}` }
        : {
            rotulo: `Continuar da etapa ${indiceAtual + 1}`,
            ancora: `etapa-${v2.etapas[indiceAtual].id}`,
          }
    : { rotulo: "Começar", ancora: "passos" };

  const seo = (
    <SEO
      title={`${projeto.nome} · Projetos · Bora na Tech`}
      description={projeto.objetivo}
      url={`/projetos/${projeto.id}`}
    />
  );

  if (travado) {
    return (
      <Layout>
        {seo}
        <section className="container max-w-[1180px] pb-16">
          <ProjetoHero projeto={projeto} estado={estado} fatos={[]} />
          <div className="card-brutal mt-8 rounded-xl border-amber-400 bg-amber-50 p-6 dark:bg-amber-950/30">
            <p className="flex items-start gap-3 text-sm font-semibold text-foreground">
              <Lock
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                aria-hidden
              />
              <span>
                Este é um desafio Pro. A assinatura abre o briefing completo, os
                requisitos de aceite, as etapas com checkpoint e a validação da
                entrega.
              </span>
            </p>
            <Link
              href="/planos"
              className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-[var(--brand-yellow)] px-5 py-2.5 font-display text-sm font-bold text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)]"
            >
              Assinar o Pro
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {seo}
      <section className="container max-w-[1180px] pb-16">
        <ProjetoHero
          projeto={projeto}
          estado={estado}
          fatos={fatos}
          acoes={
            <>
              <button
                type="button"
                onClick={() => rolarPara(acaoPrincipal.ancora)}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-[var(--brand-yellow)] px-5 py-2.5 font-display text-sm font-bold text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)]"
              >
                {acaoPrincipal.rotulo}
              </button>
              <FavoriteButton
                item={{
                  id: projeto.id,
                  type: "projeto",
                  title: projeto.nome,
                  subtitle: labelForProjectArea(projeto.areaSlug),
                }}
                className="px-4 py-2.5 text-sm"
              />
              <CopyButton
                text={urlDaPagina(projeto.id)}
                className="border-border shadow-none"
              />
            </>
          }
          faixaMobile={
            v2 ? (
              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border-2 border-ink bg-card p-3 text-sm lg:hidden">
                <span className="text-muted-foreground">
                  <span className="font-display font-bold text-foreground">
                    {feitas} de {v2.etapas.length} etapas
                  </span>
                  {feitas > 0 && " · em andamento"}
                </span>
                <button
                  type="button"
                  onClick={() => rolarPara("etapas")}
                  className="shrink-0 rounded font-bold text-orange-700 underline-offset-2 hover:underline dark:text-orange-400"
                >
                  Ir para as etapas
                </button>
              </div>
            ) : undefined
          }
        />

        <div className="grid grid-cols-1 gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 max-w-[72ch]">
            {v2 ? (
              <>
                <section className={BLOCO}>
                  <h2 className={H2}>Por que este projeto</h2>
                  <ProjetoPorQue briefing={v2.briefing} />
                </section>

                <section className={BLOCO}>
                  <h2 className={H2}>O que precisa estar lá no fim</h2>
                  <ProjetoRequisitos requisitos={v2.requisitos} />
                </section>

                <section className={BLOCO} id="etapas">
                  <h2 className={H2}>Etapas</h2>
                  <ProjetoEtapas
                    etapas={v2.etapas}
                    marcadas={marcadas}
                    indiceAtual={indiceAtual}
                    onToggleEtapa={(etapaId) =>
                      toggleStage(projeto.id, etapaId)
                    }
                  />
                </section>

                <section className={BLOCO} id="entrega">
                  <h2 className={H2}>Entrega</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Terminou? Marque a conclusão e o projeto vira parte do seu
                    perfil.
                  </p>
                  <div className="card-brutal mt-3 rounded-xl bg-card p-5">
                    {projeto.pro === true && (
                      <ProjectValidationBlock
                        projeto={projeto}
                        onApproved={() => setValidado(true)}
                      />
                    )}
                    {completionReady && (
                      <button
                        type="button"
                        aria-pressed={concluido}
                        onClick={() => toggleCompletion(projeto.id)}
                        className={`inline-flex items-center gap-2 rounded-xl border-2 border-ink px-4 py-2.5 font-display text-sm font-bold shadow-[3px_3px_0_var(--bnt-shadow)] ${
                          concluido
                            ? "bg-emerald-500 text-white"
                            : "bg-card text-foreground"
                        }`}
                      >
                        {concluido && (
                          <Check className="h-4 w-4" strokeWidth={4} />
                        )}
                        {concluido
                          ? "Projeto concluído"
                          : "Marcar como concluído"}
                      </button>
                    )}
                  </div>
                </section>

                <section className={BLOCO}>
                  <h2 className={H2}>Depois</h2>
                  <ProjetoDepois
                    sugestaoLinkedIn={projeto.sugestaoLinkedIn}
                    url={urlDaPagina(projeto.id)}
                    proximo={proximo}
                    textoLivre={projeto.proximoProjeto}
                  />
                </section>
              </>
            ) : detalhe === null && isProjetoV2(projeto.id) ? (
              <div className="space-y-4" aria-busy="true" aria-live="polite">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-24 w-full animate-pulse rounded bg-muted" />
                <div className="h-40 w-full animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <>
                <section className={BLOCO}>
                  <h2 className={H2}>Ferramentas</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {projeto.ferramentas.map((f) => (
                      <span
                        key={f}
                        className="rounded-[10px] bg-muted px-3 py-1.5 text-sm font-semibold text-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </section>

                <section className={BLOCO} id="passos">
                  <h2 className={H2}>Passo a passo</h2>
                  <ol className="mt-3 space-y-2">
                    {projeto.passosSimplificados.map((passo, i) => (
                      <li
                        key={passo}
                        className="flex items-start gap-3 text-sm text-foreground"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 font-display text-xs font-bold text-orange-700">
                          {i + 1}
                        </span>
                        {passo}
                      </li>
                    ))}
                  </ol>
                </section>

                <section className={BLOCO}>
                  <h2 className={H2}>Entregável</h2>
                  <p className="mt-3 text-sm text-foreground">
                    {projeto.entregavel}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Publicar em: {projeto.comoPublicar}
                  </p>
                </section>

                <section className={BLOCO} id="entrega">
                  <h2 className={H2}>Entrega</h2>
                  <div className="card-brutal mt-3 rounded-xl bg-card p-5">
                    {projeto.pro === true && (
                      <ProjectValidationBlock
                        projeto={projeto}
                        onApproved={() => setValidado(true)}
                      />
                    )}
                    {completionReady && (
                      <button
                        type="button"
                        aria-pressed={concluido}
                        onClick={() => toggleCompletion(projeto.id)}
                        className={`inline-flex items-center gap-2 rounded-xl border-2 border-ink px-4 py-2.5 font-display text-sm font-bold shadow-[3px_3px_0_var(--bnt-shadow)] ${
                          concluido
                            ? "bg-emerald-500 text-white"
                            : "bg-card text-foreground"
                        }`}
                      >
                        {concluido && (
                          <Check className="h-4 w-4" strokeWidth={4} />
                        )}
                        {concluido
                          ? "Projeto concluído"
                          : "Marcar como concluído"}
                      </button>
                    )}
                  </div>
                </section>

                <section className={BLOCO}>
                  <h2 className={H2}>Depois</h2>
                  <div className="mt-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 dark:bg-amber-950/30">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-display text-sm font-bold text-foreground">
                        Post pronto para o LinkedIn
                      </span>
                      <CopyButton
                        text={`${projeto.sugestaoLinkedIn}\n\n${urlDaPagina(projeto.id)}`}
                        className="border-border shadow-none"
                      />
                    </div>
                    <p className="text-sm italic text-foreground">
                      {projeto.sugestaoLinkedIn}
                    </p>
                  </div>
                  {!proximo && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      {projeto.proximoProjeto}
                    </p>
                  )}
                </section>
              </>
            )}
          </div>

          <ProjetoLateral
            estado={estado}
            proximo={proximo}
            topo={
              v2 ? (
                <ProjetoAnel
                  feitas={feitas}
                  total={v2.etapas.length}
                  desde={primeiraMarcacao}
                />
              ) : undefined
            }
          >
            {v2 && (
              <ProjetoRecursos
                briefing={v2.briefing}
                kit={v2.kit}
                ajuda={v2.ajuda}
              />
            )}
          </ProjetoLateral>
        </div>
      </section>
    </Layout>
  );
}
