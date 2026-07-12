/*
  BORA NA TECH? (Vagas Page)
  Style: Neo-Brutalism Suavizado, padrao visual Pro (molde: LinkedinAnalisar)
*/

import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  FileText,
  Layers,
  Linkedin,
  Map,
  MessagesSquare,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import SectionLabel from "@/components/shared/SectionLabel";
import BrutalActionButton from "@/components/shared/BrutalActionButton";
import VagasBackdrop from "@/components/vagas/VagasBackdrop";
import VagasJobCard, { type VagasJob } from "@/components/vagas/VagasJobCard";
import VagasLegacySections from "@/components/vagas/VagasLegacySections";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { apiFetch } from "@/services/contentApi";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("cyan");

const SAMPLE_LIMIT = 6;

// A amostra fala direto com apiFetch (e nao com o getJobs de contentApi)
// porque o getJobs engole erro de rede devolvendo lista vazia, e aqui erro e
// vazio sao estados distintos por contrato da pagina.
function mapJob(row: Record<string, unknown>): VagasJob {
  return {
    id: String(row.id ?? ""),
    title: typeof row.title === "string" ? row.title : "",
    company:
      typeof row.company === "string" && row.company
        ? row.company
        : "Empresa não informada",
    location:
      row.remote === true
        ? "Remoto"
        : typeof row.location === "string" && row.location
          ? row.location
          : "Brasil",
    remote: row.remote === true,
    seniority:
      typeof row.seniority === "string" && row.seniority
        ? row.seniority
        : "junior",
    url: typeof row.url === "string" ? row.url : "",
    areaSlug: typeof row.area_slug === "string" ? row.area_slug : "",
    publishedAt:
      typeof row.published_at === "string" ? row.published_at : null,
  };
}

type SampleStatus = "loading" | "error" | "ready";

// TODO(Ana): copy dos cards do que vem no Pro.
const PRO_PREVIEW_CARDS = [
  {
    Icon: Search,
    title: "Busca por cargo e tecnologia",
    desc: "Encontre vagas pelo nome do cargo, tecnologia ou empresa, sem depender da sorte do feed.",
  },
  {
    Icon: SlidersHorizontal,
    title: "Filtros avançados",
    desc: "Filtre por nível, tipo de contrato, modalidade, cidade e faixa salarial quando informada.",
  },
  {
    Icon: Layers,
    title: "Vagas de várias fontes",
    desc: "Um feed único agregando vagas reais de múltiplas plataformas, sem abrir dez abas.",
  },
  {
    Icon: Wand2,
    title: "Preparação por vaga",
    desc: "De cada vaga, siga direto para treinar a entrevista, ajustar o currículo e o LinkedIn.",
  },
];

// TODO(Ana): copy dos cards de ponte para as outras ferramentas.
const BRIDGE_LINKS = [
  {
    Icon: MessagesSquare,
    title: "Treine a entrevista",
    desc: "Simule a entrevista com IA e receba feedback antes da conversa real.",
    href: "/entrevistas",
  },
  {
    Icon: FileText,
    title: "Gere seu currículo",
    desc: "Monte um currículo no padrão da área para anexar na candidatura.",
    href: "/curriculo/gerar",
  },
  {
    Icon: Linkedin,
    title: "Avalie seu LinkedIn",
    desc: "Veja como recrutadores encontram (ou não) seu perfil.",
    href: "/linkedin/analisar",
  },
  {
    Icon: Map,
    title: "Plano de carreira",
    desc: "Uma rota com degraus e cronograma até a vaga que você quer.",
    href: "/plano-carreira",
  },
];

function SampleSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: SAMPLE_LIMIT }, (_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-2xl border-2 border-slate-200 bg-white p-5"
        >
          <div className="h-4 w-16 rounded-full bg-slate-200" />
          <div className="mt-4 h-5 w-3/4 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function Vagas() {
  const { isPro } = useSubscription();
  const reduce = useReducedMotion() ?? false;

  const [sampleStatus, setSampleStatus] = useState<SampleStatus>("loading");
  const [jobs, setJobs] = useState<VagasJob[]>([]);

  const loadSample = useCallback(async () => {
    setSampleStatus("loading");
    try {
      const json = (await apiFetch(`/jobs?limit=${SAMPLE_LIMIT}`)) as {
        data?: unknown;
      };
      const rows = Array.isArray(json.data) ? json.data : [];
      setJobs(rows.map((row) => mapJob(row as Record<string, unknown>)));
      setSampleStatus("ready");
    } catch {
      setSampleStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadSample();
  }, [loadSample]);

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Vagas de estágio, trainee e júnior em tecnologia"
        description="Feed de vagas reais de estágio, trainee e júnior em tecnologia, com busca, filtros e preparação para a candidatura."
        keywords={[
          "vagas tecnologia",
          "vagas estágio ti",
          "vagas trainee tecnologia",
          "vagas júnior programação",
          "primeiro emprego tecnologia",
        ]}
        url="/vagas"
        schemaType="CollectionPage"
      />
      {/* Cenario da pagina inteira no molde das paginas Pro: sem PageHero, o
          cabecalho vive DENTRO do cenario, que nasce no topo. */}
      <section className="relative overflow-hidden bg-[#faf8f4] pb-16 pt-8 [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <VagasBackdrop reduce={reduce} />
        <div className="container relative z-10">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-10"
          >
            <p>
              {/* TODO(Ana): validar o eyebrow do cabecalho. */}
              <span className="inline-flex rounded-full border-2 border-slate-900 bg-cyan-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
                Vagas Pro
              </span>
            </p>
            <div className="mt-3.5 flex items-center gap-4">
              <span
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 shadow-[3px_3px_0_currentColor]",
                  ac.panelBorder,
                  ac.panelSoft,
                  ac.iconMuted,
                )}
                aria-hidden
              >
                <Briefcase className="h-8 w-8" />
              </span>
              {/* TODO(Ana): validar o titulo da pagina. */}
              <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 md:text-[clamp(2rem,5vw,2.6rem)]">
                Vagas para começar em tech
              </h1>
            </div>
            {/* TODO(Ana): validar o subtitulo da pagina. */}
            <p className="mt-3 max-w-2xl text-base font-medium text-slate-600">
              Vagas reais de estágio, trainee e júnior agregadas em um só
              lugar, com busca, filtros e preparação para a candidatura.
            </p>
          </motion.div>

          {/* AMOSTRA gratis: feed basico visivel para todo mundo. Estados
              loading, error e empty sao distintos por contrato; erro nunca
              vira lista vazia. */}
          <div className="mb-12">
            {/* TODO(Ana): validar titulo e copy da secao de amostra. */}
            <SectionLabel icon={Sparkles} ac={ac}>
              Amostra grátis
            </SectionLabel>
            <h2 className="mt-2 font-display text-2xl font-black text-slate-950">
              Últimas vagas sincronizadas
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Uma amostra do feed. A busca completa, com filtros e todas as
              fontes, é Pro.
            </p>
            <div className="mt-6">
              {sampleStatus === "loading" ? (
                <SampleSkeleton />
              ) : sampleStatus === "error" ? (
                <div className="card-brutal rounded-2xl border-2 border-slate-950 bg-white p-6">
                  {/* TODO(Ana): validar a copy do estado de erro. */}
                  <p className="font-display text-lg font-black text-slate-950">
                    Não conseguimos carregar as vagas agora
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Pode ser uma instabilidade momentânea. Tente de novo em
                    alguns segundos.
                  </p>
                  <BrutalActionButton
                    className="mt-4"
                    icon={<RefreshCw className="h-4 w-4" aria-hidden />}
                    onClick={() => void loadSample()}
                  >
                    Tentar de novo
                  </BrutalActionButton>
                </div>
              ) : jobs.length === 0 ? (
                <div className="card-brutal rounded-2xl border-2 border-slate-950 bg-white p-6">
                  {/* TODO(Ana): validar a copy do estado vazio. */}
                  <p className="font-display text-lg font-black text-slate-950">
                    Nenhuma vaga sincronizada no momento
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    O feed é atualizado ao longo do dia. Volte mais tarde para
                    ver novas oportunidades.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {jobs.slice(0, SAMPLE_LIMIT).map((job) => (
                    <VagasJobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Area PRO: gate para free (corpo Pro fora do DOM); para Pro, um
              placeholder estruturado do que chega nas proximas fases, sem
              chamadas de API novas. */}
          <div className="mb-14">
            {/* TODO(Ana): validar titulo da secao Pro. */}
            <SectionLabel icon={Search} ac={ac}>
              Busca completa
            </SectionLabel>
            <h2 className="mb-6 mt-2 font-display text-2xl font-black text-slate-950">
              O feed completo, do jeito que você precisa
            </h2>
            {!isPro ? (
              <ProGate description="O feed completo agrega vagas reais de estágio, trainee e júnior de várias fontes, com busca, filtros por nível, contrato, modalidade e cidade, e pontes de preparação para cada vaga." />
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {PRO_PREVIEW_CARDS.map(({ Icon, title, desc }) => (
                  <div
                    key={title}
                    className="card-brutal rounded-2xl border-2 border-slate-950 bg-white p-6"
                  >
                    <span
                      className={cn(
                        "inline-flex h-11 w-11 items-center justify-center rounded-xl border-2",
                        ac.panelBorder,
                        ac.panelSoft,
                        ac.iconMuted,
                      )}
                      aria-hidden
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-3 font-display text-lg font-black text-slate-950">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{desc}</p>
                    <p
                      className={cn(
                        "mt-3 text-xs font-black uppercase tracking-wide",
                        ac.tbodyAccent,
                      )}
                    >
                      Em construção
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-14">
            <VagasLegacySections />
          </div>

          {/* Ponte estatica para as outras ferramentas Pro. */}
          <div>
            {/* TODO(Ana): validar titulo e copy da secao de ponte. */}
            <SectionLabel icon={Wand2} ac={ac}>
              Prepare a candidatura
            </SectionLabel>
            <h2 className="mt-2 font-display text-2xl font-black text-slate-950">
              Achou uma vaga? Chegue pronto
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {BRIDGE_LINKS.map(({ Icon, title, desc, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="card-brutal block rounded-2xl border-2 border-slate-950 bg-white p-5"
                >
                  <Icon className={cn("h-6 w-6", ac.iconMuted)} aria-hidden />
                  <h3 className="mt-3 font-display text-lg font-black text-slate-950">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
