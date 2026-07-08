import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Calendar,
  GraduationCap,
  MapPin,
  Clock,
  Tag,
} from "lucide-react";
import { areasTI, noticias, eventos, cursosGratuitos } from "@/lib/data";

const CURSO_AREA_SPECIAL_LABELS: Record<string, string> = {
  carreira: "Carreira",
  fullstack: "Full Stack",
};

function labelForCursoArea(slug: string | null | undefined): string {
  if (!slug) return "Geral";
  return (
    areasTI.find((a) => a.slug === slug)?.nome ??
    CURSO_AREA_SPECIAL_LABELS[slug] ??
    slug
  );
}

// =========================================
// CONFIGURAÇÕES
// =========================================

// Info evergreen por evento, alguns eventos podem ter ocorrido, então não exibimos
// data e usamos uma descrição atemporal no lugar.
// TODO: mover esses textos pra data.ts como campo `evergreenInfo` em cada evento.
const EVENTO_EVERGREEN: Record<string, string> = {
  "campus-party": "Anual · Maior evento de tech do Brasil",
  "python-brasil": "Comunidade Python · Edições anuais",
};

// 7 nuvens espalhadas pelo background. Mix de tamanhos, opacidades, durações e
// delays pra desincronizar a animação e criar profundidade.
const NUVENS = [
  {
    top: "3%",
    left: "5%",
    width: 120,
    opacity: 0.78,
    duration: "7s",
    delay: "0s",
  },
  {
    top: "7%",
    left: "84%",
    width: 92,
    opacity: 0.62,
    duration: "9s",
    delay: "1.5s",
    hideOnMobile: true,
  },
  {
    top: "18%",
    left: "44%",
    width: 80,
    opacity: 0.55,
    duration: "8.5s",
    delay: "3.2s",
  },
  {
    top: "38%",
    left: "-2%",
    width: 110,
    opacity: 0.72,
    duration: "8s",
    delay: "2s",
    hideOnMobile: true,
  },
  {
    top: "52%",
    left: "92%",
    width: 100,
    opacity: 0.6,
    duration: "10s",
    delay: "0.5s",
    hideOnMobile: true,
  },
  {
    top: "78%",
    left: "3%",
    width: 132,
    opacity: 0.82,
    duration: "7.5s",
    delay: "2.7s",
  },
  {
    top: "84%",
    left: "80%",
    width: 96,
    opacity: 0.7,
    duration: "8.5s",
    delay: "1s",
    hideOnMobile: true,
  },
];

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function PraVoce() {
  // Notícia escolhida: tom encorajador pra iniciante (déficit de vagas = oportunidade).
  // Fallback pro primeiro item caso o id mude no data.ts.
  const noticiaDestaque =
    noticias.find((n) => n.id === "vagas-ti-brasil") ?? noticias[0];
  const evento1 = eventos[0];
  const evento2 = eventos[1];
  const curso1 = cursosGratuitos[0];
  const curso2 = cursosGratuitos[1];

  return (
    <section className="relative overflow-hidden py-20 md:py-28 bg-[#f0f9ff]">
      <BackgroundDecoration />

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-sky-700"
          >
            Pra você ler e aprender
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 font-display font-black text-slate-950 leading-[1.05]"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            {/* TODO(Ana): confirmar a palavra final (selecionado, pronto, ou
                outra). "curado" soava estranho pra parte dos usuarios. */}
            Conteúdo selecionado pra{" "}
            {/* Text-stroke transparente em "começar.", palavra curta isolada
                lê melhor com outline 2px do que duas palavras com stroke. */}
            <span className="text-[#0369a1] sm:text-transparent sm:[-webkit-text-stroke:2.5px_#0369a1]">
              começar.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-base md:text-lg font-medium text-slate-700"
          >
            Notícias, eventos e cursos pra dar o primeiro passo em TI.
          </motion.p>
        </div>

        {/* GRID PRINCIPAL: Notícia destaque + 2 eventos */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Coluna 1-2: Notícia destaque ocupa 2 colunas em desktop */}
          <div className="md:col-span-2 lg:col-span-2">
            <NoticiaDestaque noticia={noticiaDestaque} />
          </div>

          {/* Coluna 3: 2 eventos empilhados */}
          <div className="flex flex-col gap-6 md:gap-8">
            <EventoCard evento={evento1} delay={0.3} />
            <EventoCard evento={evento2} delay={0.4} />
          </div>
        </div>

        {/* 2 cursos lado a lado abaixo */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <CursoCard curso={curso1} delay={0.5} />
          <CursoCard curso={curso2} delay={0.6} />
        </div>
      </div>
    </section>
  );
}

// =========================================
// COMPONENTE NoticiaDestaque (card grande)
// =========================================

function NoticiaDestaque({ noticia }: { noticia: (typeof noticias)[0] }) {
  // Tempo de leitura simulado, data.ts só tem resumo curto, então hardcoded.
  // TODO: calcular dinamicamente quando notícias tiverem corpo completo.
  const tempoLeitura = "3 min de leitura";

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="h-full"
    >
      <Link href="/noticias">
        <div className="group h-full cursor-pointer rounded-3xl border-2 border-slate-950 bg-white p-6 md:p-8 lg:p-10 shadow-[4px_4px_0_#0f172a] md:shadow-[6px_6px_0_#0f172a] transition-all duration-300 hover:-translate-y-1 hover:shadow-[10px_10px_0_#0f172a] flex flex-col">
          {/* Badge da categoria (no topo agora, label "Notícia em destaque" removida) */}
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-slate-950 bg-amber-100 px-3 py-1 shadow-[2px_2px_0_#0f172a]">
            <Tag size={12} className="text-amber-700" strokeWidth={2.5} />
            <span className="font-display text-xs font-black uppercase tracking-wider text-amber-700">
              {noticia.categoria}
            </span>
          </div>

          {/* Título grande */}
          <h3
            className="mt-5 font-display font-black text-slate-950 leading-tight"
            style={{ fontSize: "clamp(20px, 3vw, 36px)" }}
          >
            {noticia.titulo}
          </h3>

          {/* Resumo */}
          <p className="mt-4 text-base md:text-lg font-medium text-slate-700 leading-relaxed line-clamp-3">
            {noticia.resumo}
          </p>

          {/* Pull-quote / takeaway: preenche whitespace e dá ângulo encorajador */}
          <blockquote className="mt-5 border-l-4 border-sky-300 pl-4 italic text-slate-700 leading-relaxed">
            {noticia.porQueImporta}
          </blockquote>

          {/* Meta-info: tempo de leitura · área */}
          <div className="mt-5 text-sm text-slate-500">
            {tempoLeitura} · {noticia.area}
          </div>

          {/* Footer: fonte + CTA */}
          <div className="mt-auto pt-6 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              <span className="font-bold">Fonte:</span> {noticia.fonte}
            </p>
            <div className="inline-flex items-center gap-2 font-display font-black text-sky-700">
              <span className="underline-offset-4 group-hover:underline">
                Ler mais
              </span>
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// =========================================
// COMPONENTE EventoCard (card lateral menor)
// =========================================

function EventoCard({
  evento,
  delay,
}: {
  evento: (typeof eventos)[0];
  delay: number;
}) {
  // Info evergreen substitui a data (alguns eventos podem ter passado).
  const evergreen = EVENTO_EVERGREEN[evento.id] ?? evento.formato;

  return (
    <motion.article
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay }}
      className="flex-1"
    >
      <Link href="/eventos">
        <div className="group h-full cursor-pointer rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[4px_4px_0_#0f172a] transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_#0f172a] flex flex-col">
          {/* Topo: logo do evento (label "EVENTO" removida, ícone já sugere) */}
          <EventoLogo logoUrl={evento.logoUrl} nome={evento.nome} />

          {/* Nome do evento */}
          <h3 className="mt-4 font-display text-xl font-black text-slate-950 leading-tight line-clamp-2">
            {evento.nome}
          </h3>

          {/* Local + Info evergreen (substitui o formato cru) */}
          <div className="mt-3 space-y-1.5">
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <MapPin
                size={14}
                className="text-fuchsia-700 shrink-0"
                strokeWidth={2.5}
              />
              <span className="truncate">
                {evento.formato === "Online"
                  ? "Online"
                  : `${evento.cidade}, ${evento.estado}`}
              </span>
            </p>
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Calendar
                size={14}
                className="text-fuchsia-700 shrink-0"
                strokeWidth={2.5}
              />
              <span className="truncate">{evergreen}</span>
            </p>
          </div>

          {/* CTA */}
          <div className="mt-auto pt-4 inline-flex items-center gap-2 font-display text-sm font-black text-fuchsia-700">
            <span className="underline-offset-4 group-hover:underline">
              Ver evento
            </span>
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// =========================================
// COMPONENTE EventoLogo (com fallback)
// =========================================

function EventoLogo({ logoUrl, nome }: { logoUrl?: string; nome: string }) {
  const initials = nome
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-fuchsia-100 shadow-[2px_2px_0_#0f172a] overflow-hidden">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={nome}
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          onError={(e) => {
            // Fallback pra iniciais se favicon externo falhar
            const target = e.currentTarget;
            target.style.display = "none";
            target.parentElement!.innerHTML = `<span class="font-display text-sm font-black text-fuchsia-700">${initials}</span>`;
          }}
        />
      ) : (
        <span className="font-display text-sm font-black text-fuchsia-700">
          {initials}
        </span>
      )}
    </div>
  );
}

// =========================================
// COMPONENTE CursoCard
// =========================================

function CursoCard({
  curso,
  delay,
}: {
  curso: (typeof cursosGratuitos)[0];
  delay: number;
}) {
  const areaColors: Record<string, { bg: string; text: string }> = {
    frontend: { bg: "bg-violet-100", text: "text-violet-700" },
    backend: { bg: "bg-emerald-100", text: "text-emerald-700" },
    mobile: { bg: "bg-orange-100", text: "text-orange-700" },
    dados: { bg: "bg-sky-100", text: "text-sky-700" },
    uxui: { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
    cloud: { bg: "bg-cyan-100", text: "text-cyan-700" },
    devops: { bg: "bg-amber-100", text: "text-amber-700" },
    ciberseguranca: { bg: "bg-rose-100", text: "text-rose-700" },
  };
  const colors = (curso.areaSlug && areaColors[curso.areaSlug]) || {
    bg: "bg-slate-100",
    text: "text-slate-700",
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
    >
      <Link href="/cursos">
        <div className="group h-full cursor-pointer rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[4px_4px_0_#0f172a] transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_#0f172a] flex flex-col">
          {/* Ícone capelo (label "Curso recomendado" removida) */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 bg-emerald-100 shadow-[2px_2px_0_#0f172a]">
            <GraduationCap
              size={20}
              className="text-emerald-700"
              strokeWidth={2.5}
            />
          </div>

          {/* Badge da área */}
          <div
            className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-slate-950 ${colors.bg} px-3 py-1 shadow-[2px_2px_0_#0f172a]`}
          >
            <Tag size={12} className={`${colors.text}`} strokeWidth={2.5} />
            <span
              className={`font-display text-xs font-black uppercase tracking-wider ${colors.text}`}
            >
              {labelForCursoArea(curso.areaSlug)}
            </span>
          </div>

          {/* Título do curso */}
          <h3 className="mt-3 font-display text-xl font-black text-slate-950 leading-tight">
            {curso.titulo}
          </h3>

          {/* Canal + Plataforma (linha de descrição removida, contexto suficiente) */}
          <p className="mt-1 text-sm font-medium text-slate-600">
            Por {curso.canal} · {curso.plataforma}
          </p>

          {/* Footer: nível + duração + CTA */}
          <div className="mt-auto pt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock size={12} className="text-emerald-700" strokeWidth={2.5} />
              <span>{curso.duracao}</span>
              <span className="text-slate-300">·</span>
              <span>{curso.nivel}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 font-display text-sm font-black text-emerald-700">
              <span className="underline-offset-4 group-hover:underline">
                Ver curso
              </span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// =========================================
// NuvemSvg: nuvem neobrutalist com 4 bumps
// =========================================

type NuvemProps = {
  top: string;
  left: string;
  width: number;
  opacity: number;
  duration: string;
  delay: string;
  hideOnMobile?: boolean;
};

function NuvemSvg({
  top,
  left,
  width,
  opacity,
  duration,
  delay,
  hideOnMobile,
}: NuvemProps) {
  // CSS custom properties tipadas pra duração e delay (lidas no keyframe via var()).
  const style = {
    top,
    left,
    width: `${width}px`,
    opacity,
    "--cloud-duration": duration,
    "--cloud-delay": delay,
  } as React.CSSProperties;

  return (
    <div
      className={`absolute pointer-events-none z-0 animate-float-cloud ${hideOnMobile ? "hidden md:block" : ""}`}
      style={style}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 60"
        fill="white"
        stroke="#0f172a"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="w-full h-auto"
      >
        <path d="M 25,52 C 10,52 5,38 18,32 C 14,20 30,12 40,22 C 44,8 64,8 68,22 C 80,18 92,30 82,42 C 92,50 78,56 25,52 Z" />
      </svg>
    </div>
  );
}

// =========================================
// BACKGROUND DECORATION
// =========================================

function BackgroundDecoration() {
  return (
    <>
      {/* Pattern de pontinhos sky sutis */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #7dd3fc 1.2px, transparent 1.2px)",
          backgroundSize: "32px 32px",
          opacity: 0.3,
        }}
        aria-hidden="true"
      />

      {/* Nuvens neobrutalist flutuantes (camada acima dos dots, abaixo dos cards) */}
      {NUVENS.map((nuvem, i) => (
        <NuvemSvg key={i} {...nuvem} />
      ))}

      {/* Blob sky topo direito */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "5%",
          right: "-5%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(125, 211, 252, 0.25) 0%, transparent 60%)",
          filter: "blur(50px)",
        }}
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 30, -20, 0],
          opacity: [0.4, 0.6, 0.4, 0.4],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        aria-hidden="true"
      />

      {/* Blob amber inferior esquerdo */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          bottom: "10%",
          left: "-5%",
          width: "350px",
          height: "350px",
          background:
            "radial-gradient(circle, rgba(252, 211, 77, 0.2) 0%, transparent 60%)",
          filter: "blur(50px)",
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
          opacity: [0.3, 0.5, 0.3, 0.3],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        aria-hidden="true"
      />
    </>
  );
}
