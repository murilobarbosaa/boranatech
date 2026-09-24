import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Check, Lock } from "lucide-react";

import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import CopyButton from "@/components/shared/CopyButton";
import ProjetoAnel from "@/components/projects/ProjetoAnel";
import ProjetoConcluidoModal from "@/components/projects/ProjetoConcluidoModal";
import ProjetoDepois from "@/components/projects/ProjetoDepois";
import ProjetoEntrega from "@/components/projects/ProjetoEntrega";
import ProjetoEtapas from "@/components/projects/ProjetoEtapas";
import ProjetoPorQue from "@/components/projects/ProjetoPorQue";
import ProjetoRecursos from "@/components/projects/ProjetoRecursos";
import ProjetoRequisitos from "@/components/projects/ProjetoRequisitos";
import ProjetoValidacao from "@/components/projects/ProjetoValidacao";
import ProjetoHero, { type Fato } from "@/components/projects/ProjetoHero";
import ProjetoLateral, {
  type ProximoProjeto,
} from "@/components/projects/ProjetoLateral";
import { type EstadoChip } from "@/components/projects/ProjetoEstadoChip";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useProjectCompletion } from "@/hooks/useProjectCompletion";
import { useProjectSubmission } from "@/hooks/useProjectSubmission";
import type { ProjectSubmission } from "@/services/projectSubmissionService";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { projetos } from "@/lib/data";
import { labelForProjectArea } from "@/lib/projectAreaGroup";
import { labelTipoEntrega } from "@/lib/projectState";
import { resolveProjectId } from "@shared/projects/aliases";
import { isProjetoV2, loadProjetoV2 } from "@shared/projects/v2";
import type { ProjetoV2Detalhe } from "@shared/projects/v2/types";

const H2 = "font-display text-xl font-bold text-foreground";
const ACAO_PRINCIPAL =
  "inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-[var(--brand-yellow)] px-5 py-2.5 font-display text-sm font-bold text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)]";
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
    updatedAt: projectUpdatedAt,
    ready: completionReady,
    toggle: toggleCompletion,
    toggleStage,
  } = useProjectCompletion();
  const reduzirMovimento = usePrefersReducedMotion();
  // Validado nao vem de uma lista carregada aqui: quem hidrata e o
  // ProjetoValidacao, por projeto. A pagina so precisa saber que passou a
  // valer, para o chip de estado.
  const [validado, setValidado] = useState(false);
  // A comemoracao e disparada pelo CLIQUE, nao pelo valor de `done`: abrir por
  // efeito faria o modal aparecer toda vez que alguem abrisse um projeto ja
  // concluido.
  const [celebrando, setCelebrando] = useState(false);
  // Muda a copy do modal: "entregou" quando veio do formulario, "fechou"
  // quando veio do botao de autodeclaracao.
  const [entregou, setEntregou] = useState(false);
  // Quantas conferencias passaram, quando a comemoracao veio de uma verificacao
  // que fechou. `null` = a comemoracao nao veio dai.
  const [verificacoesOk, setVerificacoesOk] = useState<number | null>(null);
  const [notaValidacao, setNotaValidacao] = useState<{
    atendidos: number;
    total: number;
    perfeito: boolean;
  } | null>(null);
  const [detalhe, setDetalhe] = useState<ProjetoV2Detalhe | "erro" | null>(
    null,
  );
  const entregaAtiva = Boolean(projeto) && !(projeto?.pro === true && !isPro);
  const {
    submission,
    status: statusEntrega,
    entregar,
    verificar,
  } = useProjectSubmission(projeto?.id ?? "", entregaAtiva);

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
    : validado
      ? { tipo: "validado", perfeito: notaValidacao?.perfeito === true }
      : submission?.status === "verificado"
        ? { tipo: "verificado" }
        : submission?.status === "entregue"
          ? { tipo: "entregue" }
          : concluido
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

  const fatoValidacao: Fato[] = notaValidacao
    ? [
        {
          valor: `${notaValidacao.atendidos} de ${notaValidacao.total}`,
          legenda: "validado com IA",
        },
      ]
    : [];
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
  const fatosComValidacao = [...fatos, ...fatoValidacao];

  // ENTREGAR NAO E CONCLUIR. A entrega grava links e dispara a conferencia; quem
  // conclui e o RESULTADO dela. Antes o fluxo marcava `done` e comemorava no ato
  // de entregar, entao uma URL que nao era o projeto pedido abria "Projeto
  // concluido!" com duas conferencias falhando.
  //
  // `toggleCompletion` continua sendo chamado, e precisa continuar: e dele que
  // vivem os contadores, os badges e o espelho de trilha. O que muda e QUANDO.
  // Arrow e nao `function`: declaracao de funcao e hasteada, entao o TypeScript
  // nao carrega para dentro dela o estreitamento do early return de `projeto`.
  const concluirSeVerificou = (sub: ProjectSubmission | null | undefined) => {
    const resultados = sub?.autoCheck ?? [];
    if (resultados.length === 0) return;
    if (!resultados.every((r) => r.status === "ok")) return;
    if (!concluido) toggleCompletion(projeto.id);
    setVerificacoesOk(resultados.length);
    setCelebrando(true);
  };

  const acaoPrincipal = submission
    ? { rotulo: "Ver entrega", ancora: "entrega" }
    : v2
      ? indiceAtual === -1
        ? { rotulo: "Ir para a entrega", ancora: "entrega" }
        : feitas === 0
          ? { rotulo: "Começar", ancora: `etapa-${v2.etapas[0].id}` }
          : {
              rotulo: `Continuar da etapa ${indiceAtual + 1}`,
              ancora: `etapa-${v2.etapas[indiceAtual].id}`,
            }
      : { rotulo: "Começar", ancora: "passos" };

  // "Concluido em" so existe para quem esta logado: o localStorage do anonimo
  // guarda ids, nao datas, e inventar uma seria pior que omitir.
  const concluidoEm = concluido ? projectUpdatedAt.get(projeto.id) : undefined;
  const concluidoEmCurto = concluidoEm
    ? new Date(concluidoEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    : undefined;

  // Pagina de projeto v1 fica FORA do indice: e objetivo, ferramentas e passos,
  // conteudo raso que competiria com o proprio catalogo. A v2 tem os sete
  // blocos e ja entrou no sitemap.
  const seo = (
    <SEO
      title={`${projeto.nome} · Projetos · Bora na Tech`}
      description={projeto.objetivo}
      url={`/projetos/${projeto.id}`}
      noindex={!isProjetoV2(projeto.id)}
    />
  );

  if (travado) {
    return (
      <Layout>
        {seo}
        <section className="hero-pattern border-b-2 border-ink">
          <div className="container max-w-[1180px]">
            <ProjetoHero projeto={projeto} estado={estado} fatos={[]} />
          </div>
        </section>
        <section className="container max-w-[1180px] pb-16">
          <div className="card-brutal mt-8 rounded-xl bg-accent/10 p-6">
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
      <section className="hero-pattern border-b-2 border-ink">
        <div className="container max-w-[1180px]">
          <ProjetoHero
            projeto={projeto}
            estado={estado}
            concluidoEm={concluidoEmCurto}
            fatos={fatosComValidacao}
            acoes={
              <>
                {concluido || validado ? (
                  proximo ? (
                    <Link
                      href={`/projetos/${proximo.id}`}
                      className={ACAO_PRINCIPAL}
                    >
                      Próximo projeto
                    </Link>
                  ) : (
                    <CopyButton
                      text={urlDaPagina(projeto.id)}
                      label="Compartilhar"
                      copiedLabel="Link copiado!"
                      className={ACAO_PRINCIPAL}
                    />
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => rolarPara(acaoPrincipal.ancora)}
                    className={ACAO_PRINCIPAL}
                  >
                    {acaoPrincipal.rotulo}
                  </button>
                )}
                <FavoriteButton
                  item={{
                    id: projeto.id,
                    type: "projeto",
                    title: projeto.nome,
                    subtitle: labelForProjectArea(projeto.areaSlug),
                  }}
                  className="px-4 py-2.5 text-sm"
                />
                {!concluido && (
                  <CopyButton
                    text={urlDaPagina(projeto.id)}
                    label="Compartilhar"
                    copiedLabel="Link copiado!"
                    className="border-border shadow-none"
                  />
                )}
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
        </div>
      </section>

      <section className="container max-w-[1180px] pb-16">
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
                    Terminou? Cole os links. A gente confere o que dá para
                    conferir sozinho e o seu projeto vira parte do seu perfil.
                  </p>
                  <div className="mt-3">
                    <ProjetoEntrega
                      projectId={projeto.id}
                      isPro={isPro}
                      onNota={(nota) => {
                        if (!nota) return;
                        setValidado(true);
                        setNotaValidacao(nota);
                      }}
                      onValidated={() => {
                        // Aprovada pela IA conclui mesmo com checagem
                        // falhando: a IA julga o que as checagens nao julgam.
                        if (!concluido) toggleCompletion(projeto.id);
                        setCelebrando(true);
                      }}
                      tipoEntrega={v2.tipoEntrega}
                      checks={v2.verificacaoAutomatica ?? []}
                      submission={submission}
                      status={statusEntrega}
                      onEntregar={async (input) => {
                        await entregar(input);
                        setEntregou(true);
                        const temChecks =
                          (v2.verificacaoAutomatica ?? []).length > 0;
                        if (!temChecks) {
                          if (!concluido) toggleCompletion(projeto.id);
                          setCelebrando(true);
                          return;
                        }
                        try {
                          concluirSeVerificou(await verificar());
                        } catch {
                          // Falha aqui nao desfaz a entrega; o botao
                          // "Verificar de novo" continua disponivel.
                        }
                      }}
                      onVerificar={async () => {
                        concluirSeVerificou(await verificar());
                      }}
                    />
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
                    {completionReady && (
                      <button
                        type="button"
                        aria-pressed={concluido}
                        onClick={() => {
                          const vaiConcluir = !concluido;
                          toggleCompletion(projeto.id);
                          if (vaiConcluir) setCelebrando(true);
                        }}
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
                    {projeto.pro === true && (
                      <div className="mt-5 border-t border-border pt-5">
                        <p className="mb-3 font-display text-sm font-bold text-foreground">
                          Validação com IA
                        </p>
                        <ProjetoValidacao
                          projectId={projeto.id}
                          isPro={isPro}
                          repoUrlDaEntrega={null}
                          exigeEntrega={false}
                          onNota={(nota) => {
                            if (!nota) return;
                            setValidado(true);
                            setNotaValidacao(nota);
                          }}
                          onValidated={() => setCelebrando(true)}
                        />
                      </div>
                    )}
                  </div>
                </section>

                <section className={BLOCO}>
                  <h2 className={H2}>Depois</h2>
                  <div className="mt-3 rounded-xl border-2 border-accent/60 bg-accent/10 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-display text-sm font-bold text-foreground">
                        Post pronto para o LinkedIn
                      </span>
                      <CopyButton
                        text={`${projeto.sugestaoLinkedIn}\n\n${urlDaPagina(projeto.id)}`}
                        className="border-border shadow-none"
                      />
                    </div>
                    <p className="whitespace-pre-line text-sm italic text-foreground">
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

      <ProjetoConcluidoModal
        aberto={celebrando}
        onOpenChange={(aberto) => {
          setCelebrando(aberto);
          if (!aberto) {
            setEntregou(false);
            setNotaValidacao(null);
            setVerificacoesOk(null);
          }
        }}
        nome={projeto.nome}
        entregue={entregou}
        verificacoes={verificacoesOk}
        nota={notaValidacao}
        totalEtapas={v2 ? v2.etapas.length : null}
        post={projeto.sugestaoLinkedIn}
        url={urlDaPagina(projeto.id)}
        proximo={proximo}
        onValidar={
          projeto.pro === true && isPro ? () => rolarPara("entrega") : undefined
        }
      />
    </Layout>
  );
}
