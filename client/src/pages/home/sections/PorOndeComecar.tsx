import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Sparkles,
  Map,
  Code2,
  Clock,
  ListChecks,
  Target,
} from "lucide-react";
import {
  LEVEL_QUESTION_COUNT,
  QUIZ_ESTIMATED_MINUTES,
} from "@/lib/platformData";

// =========================================
// SEÇÃO PRINCIPAL
// =========================================

export default function PorOndeComecar() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 bg-[#f5f3ff]">
      {/* Decoração leve do fundo */}
      <BackgroundDecoration />

      <div className="relative z-10 mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-violet-700"
          >
            Seu primeiro passo
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 font-display font-black text-slate-950 leading-[1.05]"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            Não sabe por onde começar?{" "}
            <span className="text-violet-700">A gente sabe.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-base md:text-lg font-medium text-slate-700"
          >
            Quase todo mundo trava no início. A boa notícia: tem caminho.
          </motion.p>
        </div>

        {/* CARD GIGANTE DE DESTAQUE: Quiz */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          <Link href="/quiz-carreira">
            <article className="group cursor-pointer rounded-3xl border-2 border-slate-950 bg-white p-8 md:p-12 shadow-[6px_6px_0_#0f172a] transition-all duration-300 hover:-translate-y-1 hover:shadow-[10px_10px_0_#0f172a]">
              <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-10">
                {/* Ícone gigante */}
                <div className="shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-slate-950 bg-violet-100 shadow-[4px_4px_0_#0f172a]">
                    <Sparkles
                      size={40}
                      className="text-violet-700"
                      strokeWidth={2.5}
                    />
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1">
                  <p className="font-display text-xs font-black uppercase tracking-[0.2em] text-violet-700">
                    Recomendado pra você
                  </p>
                  <h3 className="mt-2 font-display text-3xl md:text-4xl font-black text-slate-950 leading-tight">
                    Faça o Quiz de Carreira
                  </h3>
                  <p className="mt-3 text-base md:text-lg font-medium text-slate-700 leading-relaxed">
                    Em {QUIZ_ESTIMATED_MINUTES} minutos, a gente descobre seu
                    perfil e te diz exatamente qual área da TI combina com você.
                  </p>

                  {/* CTA + Microinfos */}
                  <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-950 bg-violet-700 px-6 py-3 font-display font-black text-white shadow-[4px_4px_0_#0f172a] transition-all group-hover:bg-violet-800 group-hover:shadow-[6px_6px_0_#0f172a]">
                      <span>Descobrir meu perfil</span>
                      <ArrowRight
                        size={20}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} className="text-violet-600" />
                        {QUIZ_ESTIMATED_MINUTES} minutos
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="inline-flex items-center gap-1.5">
                        <ListChecks size={14} className="text-violet-600" />
                        {LEVEL_QUESTION_COUNT} perguntas do seu nível
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Target size={14} className="text-violet-600" />
                        Resultado personalizado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        </motion.div>

        {/* Divisor "OU SE VOCÊ JÁ SABE..." */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 mb-8 flex items-center justify-center gap-4"
        >
          <div className="h-px flex-1 bg-slate-300" aria-hidden="true" />
          <p className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            Ou se você já sabe...
          </p>
          <div className="h-px flex-1 bg-slate-300" aria-hidden="true" />
        </motion.div>

        {/* 2 cards secundários lado a lado */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <SecondaryCard
            href="/roadmaps"
            icon={
              <Map size={32} className="text-violet-700" strokeWidth={2.5} />
            }
            title="Já sei minha área"
            description="Vai direto pro roadmap certo pra você."
            linkText="Ver Roadmaps"
            delay={0.7}
          />
          <SecondaryCard
            href="/projetos"
            icon={
              <Code2 size={32} className="text-violet-700" strokeWidth={2.5} />
            }
            title="Já tô estudando"
            description="Bora aplicar conhecimento em projetos práticos."
            linkText="Ver Projetos"
            delay={0.8}
          />
        </div>
      </div>
    </section>
  );
}

// =========================================
// COMPONENTE SecondaryCard
// =========================================

function SecondaryCard({
  href,
  icon,
  title,
  description,
  linkText,
  delay,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  linkText: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay }}
    >
      <Link href={href}>
        <article className="group h-full cursor-pointer rounded-2xl border-2 border-slate-950 bg-white p-6 md:p-8 shadow-[4px_4px_0_#0f172a] transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_#0f172a]">
          {/* Ícone */}
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-slate-950 bg-violet-100 shadow-[2px_2px_0_#0f172a]">
            {icon}
          </div>

          {/* Conteúdo */}
          <h4 className="mt-5 font-display text-xl md:text-2xl font-black text-slate-950 leading-tight">
            {title}
          </h4>
          <p className="mt-2 text-sm md:text-base font-medium text-slate-700">
            {description}
          </p>

          {/* Link */}
          <div className="mt-5 inline-flex items-center gap-2 font-display text-sm font-black text-violet-700">
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
            <span className="underline-offset-4 group-hover:underline">
              {linkText}
            </span>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

// =========================================
// DECORAÇÃO DE FUNDO
// =========================================

function BackgroundDecoration() {
  return (
    <>
      {/* Pattern de linhas diagonais tracejadas */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 28px,
            #c4b5fd 28px,
            #c4b5fd 29px,
            transparent 29px,
            transparent 32px,
            #c4b5fd 32px,
            #c4b5fd 33px
          )`,
          opacity: 0.35,
        }}
        aria-hidden="true"
      />

      {/* Shape decorativo: círculo violet topo direito */}
      <div
        className="absolute h-24 w-24 rounded-full border-2 border-violet-300"
        style={{ top: "10%", right: "8%", opacity: 0.5 }}
        aria-hidden="true"
      />

      {/* Shape decorativo: losango violet inferior esquerdo */}
      <div
        className="absolute h-16 w-16 border-2 border-violet-300 rotate-45"
        style={{ bottom: "15%", left: "5%", opacity: 0.5 }}
        aria-hidden="true"
      />
    </>
  );
}
