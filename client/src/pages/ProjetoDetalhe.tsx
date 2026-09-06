import { useState } from "react";
import { Link, useParams } from "wouter";
import { Check, Lock } from "lucide-react";

import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import CopyButton from "@/components/shared/CopyButton";
import ProjectValidationBlock from "@/components/projects/ProjectValidationBlock";
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
import { resolveProjectId } from "@shared/projects/aliases";

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
    ready: completionReady,
    toggle: toggleCompletion,
  } = useProjectCompletion();
  const reduzirMovimento = usePrefersReducedMotion();
  // Validado nao vem de uma lista carregada aqui: quem hidrata e o
  // ProjectValidationBlock, por projeto. A pagina so precisa saber que passou
  // a valer, para o chip de estado.
  const [validado, setValidado] = useState(false);

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

  const travado = projeto.pro === true && !isPro;
  const concluido = projectsDone.has(projeto.id);
  const estado: EstadoChip = travado
    ? { tipo: "pro_travado" }
    : concluido || validado
      ? { tipo: "concluido" }
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

  const fatos: Fato[] = [
    {
      valor: projeto.ferramentas.slice(0, 3).join(", "),
      legenda: "ferramentas",
    },
    { valor: projeto.entregavel, legenda: "o que você entrega" },
  ];

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
                onClick={() => rolarPara("passos")}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-[var(--brand-yellow)] px-5 py-2.5 font-display text-sm font-bold text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)]"
              >
                Começar
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
        />

        <div className="grid grid-cols-1 gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 max-w-[72ch]">
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
                    {concluido && <Check className="h-4 w-4" strokeWidth={4} />}
                    {concluido ? "Projeto concluído" : "Marcar como concluído"}
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
          </div>

          <ProjetoLateral estado={estado} proximo={proximo} />
        </div>
      </section>
    </Layout>
  );
}
