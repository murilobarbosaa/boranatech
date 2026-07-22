import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Cloud,
  Compass,
  GitBranch,
  Layout,
  Palette,
  Server,
  Shield,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { featuredAreas } from "@/lib/homeData.generated";
import { apiUrl } from "@/lib/api";

// =========================================
// DADOS
// =========================================

const FEATURED_SLUGS = [
  "frontend",
  "backend",
  "mobile",
  "dados",
  "uxui",
  "cloud",
  "devops",
  "ciberseguranca",
] as const;

const FEATURED_OVERRIDES: Record<
  (typeof FEATURED_SLUGS)[number],
  { bg: string; color: string; exemplos: string }
> = {
  frontend: { bg: "bg-violet-50", color: "#8b5cf6", exemplos: "React, Vue" },
  backend: { bg: "bg-emerald-50", color: "#10b981", exemplos: "Node, Python" },
  mobile: { bg: "bg-orange-50", color: "#f97316", exemplos: "iOS, Android" },
  dados: { bg: "bg-sky-50", color: "#0ea5e9", exemplos: "SQL, Python" },
  uxui: { bg: "bg-fuchsia-50", color: "#d946ef", exemplos: "Figma, Design" },
  cloud: { bg: "bg-cyan-50", color: "#06b6d4", exemplos: "AWS, GCP" },
  devops: { bg: "bg-amber-50", color: "#f59e0b", exemplos: "Docker, K8s" },
  ciberseguranca: {
    bg: "bg-rose-50",
    color: "#f43f5e",
    exemplos: "Pentest, Hash",
  },
};

// O icone (componente Lucide) nao e serializavel pelo gerador, entao vive
// aqui; slug e nome vem da fatia gerada (homeData.generated).
const FEATURED_ICONS: Record<(typeof FEATURED_SLUGS)[number], LucideIcon> = {
  frontend: Layout,
  backend: Server,
  mobile: Smartphone,
  dados: BarChart3,
  uxui: Palette,
  cloud: Cloud,
  devops: GitBranch,
  ciberseguranca: Shield,
};

const FEATURED_AREAS = featuredAreas.flatMap((area) => {
  const slug = area.slug as (typeof FEATURED_SLUGS)[number];
  const override = FEATURED_OVERRIDES[slug];
  return override ? [{ ...area, ...override, icon: FEATURED_ICONS[slug] }] : [];
});

// Verbo dentro de cada badge pra toda rotacao ficar gramatical
// ("...precisa pra entrar na TI de verdade" etc.).
const HIGHLIGHTS = [
  "entrar na TI de verdade",
  "construir sua carreira em tech",
  "conquistar o primeiro emprego",
];

type CardinalNode = {
  label: string;
  color: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
};

// Posicionamento horizontal ancorado nas margens externas do grid central
// (max-w-5xl = 1024px). Garante que os labels nunca sobreponham o conteúdo
// em viewports estreitos como 1536px, onde % do viewport caía dentro do grid.
// 175px = largura aproximada do label + respiro. Piso de 16px pra borda.
const SIDE_OFFSET = "max(16px, calc((100vw - 1024px) / 2 - 175px))";

const CARDINAL_NODES: CardinalNode[] = [
  { label: "N · Descobrir", color: "#7c3aed", top: "8%", left: SIDE_OFFSET },
  { label: "L · Estudar", color: "#059669", top: "35%", right: SIDE_OFFSET },
  { label: "S · Praticar", color: "#ea580c", bottom: "8%", right: SIDE_OFFSET },
  {
    label: "O · Conseguir",
    color: "#2563eb",
    bottom: "35%",
    left: SIDE_OFFSET,
  },
];

// =========================================
// TIPOS E HELPER GEOMÉTRICO PARA AS CURVAS DA JORNADA
// =========================================

type NodeKey = "N" | "L" | "S" | "O";
type NodePoint = { x: number; y: number };
type NodePositions = Record<NodeKey, NodePoint | null>;

type MapBackgroundProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

// Gera um path SVG de curva em S entre dois pontos. Os pontos de
// controle são deslocados perpendicularmente à reta start→end com sinais
// opostos, é o que produz a inflexão característica do S. Trabalha em
// coordenadas de pixel reais (viewBox = dimensões da seção), por isso
// `curvatureRatio` é fração do comprimento do segmento, mantém a curva
// proporcional e SEM distorção em qualquer proporção de tela. `offsetPx`
// recua start e end ao longo da reta (gap respiratório dos dots).
function generateSCurvePath(
  start: NodePoint,
  end: NodePoint,
  curvatureRatio = 0.12,
  offsetPx = 16,
): string {
  // Vetor unitário da direção start → end.
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const dirX = dx / length;
  const dirY = dy / length;

  // Desloca cada extremidade `offsetPx` pixels ao longo da reta para
  // criar um gap visual entre o dot pulsante e a linha tracejada.
  const adjustedStart: NodePoint = {
    x: start.x + dirX * offsetPx,
    y: start.y + dirY * offsetPx,
  };
  const adjustedEnd: NodePoint = {
    x: end.x - dirX * offsetPx,
    y: end.y - dirY * offsetPx,
  };

  // Recalcula direção e perpendicular já com os pontos ajustados.
  const adjDx = adjustedEnd.x - adjustedStart.x;
  const adjDy = adjustedEnd.y - adjustedStart.y;
  const adjLength = Math.sqrt(adjDx * adjDx + adjDy * adjDy) || 1;
  const perpX = -adjDy / adjLength;
  const perpY = adjDx / adjLength;

  // Amplitude do desvio = fração do comprimento real do segmento.
  const curvature = adjLength * curvatureRatio;

  // Pontos de controle para a curva em S (sinais opostos no desvio).
  const cp1x = adjustedStart.x + adjDx * 0.33 + perpX * curvature;
  const cp1y = adjustedStart.y + adjDy * 0.33 + perpY * curvature;
  const cp2x = adjustedStart.x + adjDx * 0.67 - perpX * curvature;
  const cp2y = adjustedStart.y + adjDy * 0.67 - perpY * curvature;

  return `M ${adjustedStart.x} ${adjustedStart.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${adjustedEnd.x} ${adjustedEnd.y}`;
}

// =========================================
// CONTADOR ANIMADO (dispara ao entrar no viewport, uma vez)
// =========================================

function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    Math.round(latest).toLocaleString("pt-BR"),
  );

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 1.2,
        ease: "easeOut",
      });
      return () => controls.stop();
    }
  }, [isInView, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

// =========================================
// FUNDO DE MAPA: 4 camadas decorativas
// =========================================

function MapBackground({ sectionRef }: MapBackgroundProps) {
  const nodeRefs = useRef<Record<NodeKey, HTMLDivElement | null>>({
    N: null,
    L: null,
    S: null,
    O: null,
  });
  const [nodePositions, setNodePositions] = useState<NodePositions>({
    N: null,
    L: null,
    S: null,
    O: null,
  });
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Mede a posição central de cada dot pulsante (via data-dot) em
    // pixels relativos ao <section>, e guarda também as dimensões reais
    // da seção para o viewBox do SVG mapear 1:1 (sem distorção de
    // aspecto). Re-executa em qualquer resize via ResizeObserver.
    const calc = () => {
      const sectionRect = section.getBoundingClientRect();
      if (sectionRect.width === 0 || sectionRect.height === 0) return;

      const next: NodePositions = { N: null, L: null, S: null, O: null };
      (Object.keys(nodeRefs.current) as NodeKey[]).forEach((key) => {
        const node = nodeRefs.current[key];
        if (!node) return;
        const dot = node.querySelector("[data-dot]") as HTMLElement | null;
        if (!dot) return;
        const dotRect = dot.getBoundingClientRect();
        const cx = dotRect.left + dotRect.width / 2;
        const cy = dotRect.top + dotRect.height / 2;
        next[key] = {
          x: cx - sectionRect.left,
          y: cy - sectionRect.top,
        };
      });
      setNodePositions(next);
      setDims({ w: sectionRect.width, h: sectionRect.height });
    };

    calc();
    const observer = new ResizeObserver(calc);
    observer.observe(section);

    // Recalcula após a sequência de stagger de entrada (~1.5s) terminar,
    // caso transforms do framer-motion tenham alterado a posição final.
    const timer = window.setTimeout(calc, 2000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [sectionRef]);

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* CAMADA 1: Grid de coordenadas: latitudes principais (320px) + grid fino (80px) sobrepostos. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(196, 184, 150, 0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(196, 184, 150, 0.8) 1px, transparent 1px),
            linear-gradient(to right, rgba(214, 205, 184, 0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(214, 205, 184, 0.6) 1px, transparent 1px)
          `,
          backgroundSize: "320px 320px, 320px 320px, 80px 80px, 80px 80px",
        }}
      />

      {/* CAMADA 4: Jornada do usuário em 3 curvas em S independentes.
          Coordenadas calculadas dinamicamente a partir da posição real
          dos dots cardinais (via ResizeObserver + getBoundingClientRect).
          Renderiza só quando todas as 4 posições estão medidas. */}
      {dims &&
        nodePositions.N &&
        nodePositions.L &&
        nodePositions.S &&
        nodePositions.O && (
          <svg
            className="absolute inset-0 hidden h-full w-full xl:block pointer-events-none"
            viewBox={`0 0 ${dims.w} ${dims.h}`}
            preserveAspectRatio="none"
          >
            <defs>
              {/* Gradient 1: violet-600 → emerald-600 (N→L) */}
              <linearGradient
                id="journey-gradient-1"
                gradientUnits="userSpaceOnUse"
                x1={nodePositions.N.x}
                y1={nodePositions.N.y}
                x2={nodePositions.L.x}
                y2={nodePositions.L.y}
              >
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              {/* Gradient 2: emerald-600 → orange-600 (L→S) */}
              <linearGradient
                id="journey-gradient-2"
                gradientUnits="userSpaceOnUse"
                x1={nodePositions.L.x}
                y1={nodePositions.L.y}
                x2={nodePositions.S.x}
                y2={nodePositions.S.y}
              >
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>

              {/* Gradient 3: orange-600 → blue-600 (S→O) */}
              <linearGradient
                id="journey-gradient-3"
                gradientUnits="userSpaceOnUse"
                x1={nodePositions.S.x}
                y1={nodePositions.S.y}
                x2={nodePositions.O.x}
                y2={nodePositions.O.y}
              >
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>

            {/* Linha 1: dot N → dot L */}
            <path
              d={generateSCurvePath(nodePositions.N, nodePositions.L)}
              fill="none"
              stroke="url(#journey-gradient-1)"
              strokeWidth="0.7"
              strokeDasharray="2 2.5"
              strokeLinecap="round"
              opacity="0.85"
              vectorEffect="non-scaling-stroke"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-40"
                dur="60s"
                repeatCount="indefinite"
              />
            </path>

            {/* Linha 2: dot L → dot S */}
            <path
              d={generateSCurvePath(nodePositions.L, nodePositions.S)}
              fill="none"
              stroke="url(#journey-gradient-2)"
              strokeWidth="0.7"
              strokeDasharray="2 2.5"
              strokeLinecap="round"
              opacity="0.85"
              vectorEffect="non-scaling-stroke"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-40"
                dur="60s"
                repeatCount="indefinite"
              />
            </path>

            {/* Linha 3: dot S → dot O */}
            <path
              d={generateSCurvePath(nodePositions.S, nodePositions.O)}
              fill="none"
              stroke="url(#journey-gradient-3)"
              strokeWidth="0.7"
              strokeDasharray="2 2.5"
              strokeLinecap="round"
              opacity="0.85"
              vectorEffect="non-scaling-stroke"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-40"
                dur="60s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        )}

      {/* CAMADA 3: 4 nós cardeais com pulse defasado entre si.
          Cada wrapper recebe ref via callback (chave N/L/S/O extraída do label)
          para que o useEffect acima meça a posição real do dot pulsante. */}
      {CARDINAL_NODES.map(
        ({ label, color, top, left, right, bottom }, index) => {
          const key = label.split(" · ")[0] as NodeKey;
          return (
            <div
              key={label}
              ref={(el) => {
                nodeRefs.current[key] = el;
              }}
              className="absolute hidden items-center gap-2 xl:flex"
              style={{ top, left, right, bottom }}
            >
              <motion.div
                data-dot
                className="rounded-full"
                style={{ width: 12, height: 12, backgroundColor: color }}
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.7, 0.2, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.4,
                }}
              />
              <span
                className="font-mono text-base font-semibold uppercase tracking-wider"
                style={{ color, opacity: 0.7 }}
              >
                {label}
              </span>
            </div>
          );
        },
      )}
    </div>
  );
}

// =========================================
// HERO
// =========================================

const USERS_COUNT_LS_KEY = "bnt_users_count";

function readCachedUsersCount(): number | null {
  try {
    const raw = window.localStorage.getItem(USERS_COUNT_LS_KEY);
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    // Só > 0 é número confiável: um "0" (cache envenenado por build/servidor
    // antigo, ou resposta degradada) é tratado como ausente e cai no placeholder,
    // nunca renderizado como "+0". Mesmo critério do Checkout (cache compartilhado).
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function writeCachedUsersCount(n: number): void {
  try {
    window.localStorage.setItem(USERS_COUNT_LS_KEY, String(n));
  } catch {
    // localStorage indisponível (modo privado, quota cheia). Próximo load usará placeholder.
  }
}

export default function Hero() {
  const [currentHighlight, setCurrentHighlight] = useState(0);
  // null = sem número confiável (primeira visita sem cache, backend sem lkg, ou
  // valor degradado <= 0). Nunca usamos default hardcoded nem exibimos 0; o
  // placeholder do badge cobre o estado vazio. Estado só é null ou > 0.
  const [usersCount, setUsersCount] = useState<number | null>(() =>
    readCachedUsersCount(),
  );
  const sectionRef = useRef<HTMLElement>(null);

  // Alterna o highlight do headline a cada 3s.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentHighlight((prev) => (prev + 1) % HIGHLIGHTS.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/stats/users-count"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || typeof data.count !== "number") return;
        // 0/negativo é degradação, não estado real: não exibe nem grava no cache
        // (evitaria envenenar o localStorage compartilhado). Mesmo guard do Checkout.
        if (data.count <= 0) return;
        setUsersCount(data.count);
        writeCachedUsersCount(data.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-[#faf8f4] py-16 md:py-24"
      aria-labelledby="hero-headline"
    >
      <MapBackground sectionRef={sectionRef} />

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        {/* 1) Badge social com triângulo de tooltip de mapa abaixo. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-4 py-2 shadow-[3px_3px_0_#0f172a]"
        >
          <Compass size={18} className="text-violet-600" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-950">
            {usersCount !== null ? (
              <>
                +<AnimatedCounter value={usersCount} /> pessoas já encontraram
                seu caminho
              </>
            ) : (
              "Já estão encontrando o caminho em tech"
            )}
          </span>
          <div
            className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-slate-950 bg-white"
            aria-hidden="true"
          />
        </motion.div>

        {/* 2) Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="font-display mt-6 text-xs font-black uppercase tracking-[0.2em] text-violet-700 md:text-sm"
        >
          Sua bússola para começar em tecnologia
        </motion.p>

        {/* 3) Headline com selo amarelo neobrutalist rotativo.
            isolate cria stacking context local para que -z-10 do selo
            não vaze atrás do MapBackground ou de outras camadas. */}
        <motion.h1
          id="hero-headline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="font-display mx-auto mt-4 max-w-4xl font-black leading-tight text-slate-950 md:text-balance"
          style={{ fontSize: "clamp(30px, 6vw, 76px)" }}
        >
          Cada ferramenta que você precisa pra{" "}
          <span className="relative isolate inline-block px-3 py-1">
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 -rotate-1 rounded-md border-2 border-slate-950 bg-amber-300 shadow-[3px_3px_0_#0f172a]"
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={currentHighlight}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative inline-block"
              >
                {HIGHLIGHTS[currentHighlight]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.h1>

        {/* 4) Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg"
        >
          Áreas, roadmaps, cursos, projetos, IA, eventos e carreira organizados
          em uma jornada clara, acessível e prática para quem está começando.
        </motion.p>

        {/* 5) CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4"
        >
          <Link
            href="/areas"
            aria-label="Explorar a plataforma, ir para áreas da TI"
            className="font-display inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-8 py-4 font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a] active:translate-y-0 active:shadow-[2px_2px_0_#0f172a]"
          >
            Explorar a plataforma
            <ArrowRight size={18} aria-hidden="true" />
          </Link>

          <Link
            href="/areas"
            className="font-display inline-flex items-center rounded-full border-2 border-slate-950 bg-white px-8 py-4 font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a] active:translate-y-0 active:shadow-[2px_2px_0_#0f172a]"
          >
            Ver áreas da TI
          </Link>
        </motion.div>

        {/* 6) Grid de áreas: stagger interno + pulse no ponto colorido. */}
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.08, delayChildren: 1.4 },
            },
          }}
          className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4"
          aria-label="Áreas da tecnologia"
        >
          {FEATURED_AREAS.map(
            ({ nome, slug, icon: Icon, bg, color, exemplos }) => (
              <motion.li
                key={slug}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                className={`relative ${bg} rounded-2xl border-2 border-slate-950 text-left transition hover:-translate-y-1`}
                style={{ boxShadow: `4px 4px 0 ${color}` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `6px 6px 0 ${color}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `4px 4px 0 ${color}`;
                }}
              >
                <Link
                  href={`/areas/${slug}`}
                  aria-label={`Explorar área de ${nome}`}
                  className="block rounded-2xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-950"
                >
                  <motion.div
                    className="absolute right-3 top-3 rounded-full"
                    style={{ width: 8, height: 8, backgroundColor: color }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 0.3, 0.7],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    aria-hidden="true"
                  />
                  <Icon
                    size={32}
                    className="text-slate-950"
                    aria-hidden="true"
                  />
                  <h3 className="font-display mt-3 text-base font-black text-slate-950">
                    {nome}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <span>▶</span>
                    <span>{exemplos}</span>
                  </p>
                </Link>
              </motion.li>
            ),
          )}
        </motion.ul>
      </div>
    </section>
  );
}
