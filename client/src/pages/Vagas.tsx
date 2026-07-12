/*
  BORA NA TECH? (Vagas Page)
  Style: Neo-Brutalism Suavizado, padrao visual Pro (molde: LinkedinAnalisar)
  Fase 3: pagina 100% Pro. Free/deslogado ve showcase ilustrativo + ProGate;
  assinante ve destaques, feed com busca/filtros e detalhe. Nenhuma chamada a
  /api/vagas acontece sem isPro: os componentes Pro so montam para assinante.
*/

import { useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  FileText,
  Linkedin,
  Map,
  MessagesSquare,
  Sparkles,
  Wand2,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import SectionLabel from "@/components/shared/SectionLabel";
import VagasBackdrop from "@/components/vagas/VagasBackdrop";
import VagasDestaques from "@/components/vagas/VagasDestaques";
import VagasDetailDialog from "@/components/vagas/VagasDetailDialog";
import VagasFeed from "@/components/vagas/VagasFeed";
import VagasLegacySections from "@/components/vagas/VagasLegacySections";
import VagasShowcase from "@/components/vagas/VagasShowcase";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const ac = getPageAccentUi("cyan");

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

export default function Vagas() {
  const { isPro } = useSubscription();
  const reduce = useReducedMotion() ?? false;
  const [openId, setOpenId] = useState<string | null>(null);

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

          {!isPro ? (
            <div className="mb-14 space-y-10">
              {/* Vitrine ilustrativa para free/deslogado: nenhum dado real,
                  nenhuma chamada de API. */}
              <div>
                {/* TODO(Ana): validar titulo e copy da vitrine. */}
                <SectionLabel icon={Sparkles} ac={ac}>
                  Como funciona
                </SectionLabel>
                <h2 className="mb-6 mt-2 font-display text-2xl font-black text-slate-950">
                  Um feed só com o que importa pra quem está começando
                </h2>
                <VagasShowcase />
              </div>
              <ProGate description="O feed reúne vagas reais de estágio, trainee e júnior de várias fontes (Brasil e internacional), com busca, filtros por nível, modalidade e contrato, e vagas em destaque." />
            </div>
          ) : (
            <div className="mb-2">
              <VagasDestaques onOpen={setOpenId} />
              <VagasFeed onOpen={setOpenId} />
            </div>
          )}

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
      {isPro ? <VagasDetailDialog id={openId} onClose={() => setOpenId(null)} /> : null}
    </Layout>
  );
}
