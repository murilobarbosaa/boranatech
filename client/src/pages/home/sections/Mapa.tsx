import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";

// =========================================
// TIPAGEM
// =========================================

type NodeKey = "descobrir" | "estudar" | "praticar" | "conseguir";
type PanelState = "collapsed" | "preview" | "open";

interface Tool {
  name: string;
  href: string;
}

interface MapNode {
  key: NodeKey;
  number: string;
  title: string;
  subtitle: string;
  tools: Tool[];
  otherCount: number;
  colors: {
    bgOpen: string;
    bgPreview: string;
    bgCollapsed: string;
    accent: string;
    dot: string;
    linkHover: string;
  };
}

// =========================================
// DADOS DOS 4 NÓS
// =========================================

const NODES: MapNode[] = [
  {
    key: "descobrir",
    number: "01",
    title: "Descobrir",
    subtitle: "Entenda o terreno antes de escolher um caminho.",
    tools: [
      { name: "Áreas", href: "/areas" },
      { name: "Quiz de Carreira", href: "/quiz-carreira" },
      { name: "Comparador", href: "/comparador" },
      { name: "Faculdades", href: "/faculdades" },
      { name: "Mulheres em TI", href: "/mulheres" },
      { name: "Comunidades", href: "/comunidades" },
    ],
    otherCount: 2,
    colors: {
      bgOpen: "bg-violet-50",
      bgPreview: "bg-violet-100",
      bgCollapsed: "bg-violet-50",
      accent: "text-violet-700",
      dot: "bg-violet-500",
      linkHover: "group-hover/link:text-violet-700",
    },
  },
  {
    key: "estudar",
    number: "02",
    title: "Estudar",
    subtitle: "Aprenda na ordem certa, com os melhores recursos.",
    tools: [
      { name: "Roadmaps", href: "/roadmaps" },
      { name: "Cursos", href: "/cursos" },
      { name: "Plataformas", href: "/plataformas" },
      { name: "Tecnologias", href: "/tecnologias" },
      { name: "Inglês", href: "/ingles" },
      { name: "Dicionário", href: "/dicionario" },
    ],
    otherCount: 7,
    colors: {
      bgOpen: "bg-emerald-50",
      bgPreview: "bg-emerald-100",
      bgCollapsed: "bg-emerald-50",
      accent: "text-emerald-700",
      dot: "bg-emerald-500",
      linkHover: "group-hover/link:text-emerald-700",
    },
  },
  {
    key: "praticar",
    number: "03",
    title: "Praticar",
    subtitle: "Aplique conhecimento e construa sua vitrine.",
    tools: [
      { name: "Projetos", href: "/projetos" },
      { name: "Portfólio", href: "/portfolio" },
      { name: "Freelance", href: "/freelance" },
      { name: "Diário de Estudos", href: "/estudos/diario" },
      { name: "Evolução", href: "/evolucao" },
    ],
    otherCount: 0,
    colors: {
      bgOpen: "bg-orange-50",
      bgPreview: "bg-orange-100",
      bgCollapsed: "bg-orange-50",
      accent: "text-orange-700",
      dot: "bg-orange-500",
      linkHover: "group-hover/link:text-orange-700",
    },
  },
  {
    key: "conseguir",
    number: "04",
    title: "Conseguir",
    subtitle: "Entre no mercado e dê o primeiro passo na carreira.",
    tools: [
      { name: "Empresas", href: "/empresas" },
      { name: "Vagas Estágio", href: "/estagio" },
      { name: "Salários", href: "/salarios" },
      { name: "Currículo", href: "/curriculo" },
      { name: "Entrevistas", href: "/entrevistas" },
      { name: "Simulador de Carreira", href: "/simulador" },
    ],
    otherCount: 1,
    colors: {
      bgOpen: "bg-blue-50",
      bgPreview: "bg-blue-100",
      bgCollapsed: "bg-blue-50",
      accent: "text-blue-700",
      dot: "bg-blue-500",
      linkHover: "group-hover/link:text-blue-700",
    },
  },
];

// =========================================
// CONTEÚDOS DOS 3 ESTADOS (Desktop)
// =========================================

function CollapsedContent({ node }: { node: MapNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex h-full flex-col items-center justify-between p-4"
    >
      <span
        className={`font-display text-3xl font-black ${node.colors.accent}`}
      >
        {node.number}
      </span>

      {/* Título em letras verticalmente empilhadas (D / E / S / C / O / B / R / I / R) */}
      <div className="flex flex-col items-center gap-1">
        {node.title
          .toUpperCase()
          .split("")
          .map((letter, idx) => (
            <span
              key={idx}
              className={`font-display text-sm font-black leading-none ${node.colors.accent}`}
            >
              {letter}
            </span>
          ))}
      </div>

      <motion.div
        className={`h-3 w-3 rounded-full ${node.colors.dot}`}
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
    </motion.div>
  );
}

function PreviewContent({ node }: { node: MapNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // pequeno delay deixa a largura crescer antes do texto aparecer,
      // evitando overflow visual durante a transição
      transition={{ duration: 0.2, delay: 0.05 }}
      className="flex h-full flex-col p-6"
    >
      <span
        className={`font-display text-4xl font-black ${node.colors.accent}`}
      >
        {node.number}
      </span>

      <h3
        className={`mt-4 font-display text-2xl font-black ${node.colors.accent}`}
      >
        {node.title}
      </h3>

      <p className="mt-2 line-clamp-3 text-sm font-medium text-slate-700">
        {node.subtitle}
      </p>

      <p
        className={`mt-auto text-xs font-bold uppercase tracking-wider ${node.colors.accent} opacity-80`}
      >
        Clique para abrir →
      </p>
    </motion.div>
  );
}

function OpenContent({ node }: { node: MapNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // delay maior que o preview pra esperar a largura crescer mais
      transition={{ duration: 0.25, delay: 0.1 }}
      className="flex h-full flex-col p-8"
    >
      <div className="flex items-start justify-between">
        <span
          className={`font-display text-5xl font-black ${node.colors.accent}`}
        >
          {node.number}
        </span>
        <motion.div
          className={`mt-2 h-3 w-3 rounded-full ${node.colors.dot}`}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      </div>

      <h3
        className={`mt-4 font-display text-3xl font-black ${node.colors.accent}`}
      >
        {node.title}
      </h3>

      <p className="mt-2 text-sm font-medium text-slate-700">{node.subtitle}</p>

      <div
        className={`mt-6 h-0.5 w-12 rounded-full ${node.colors.dot}`}
        aria-hidden="true"
      />

      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3.5">
        {node.tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              // stopPropagation evita que o click no link borbulhe
              // pro Panel e dispare onClick do painel
              onClick={(e) => e.stopPropagation()}
              className="group/link flex items-center gap-3 text-base font-bold text-slate-950 transition-colors"
            >
              <ArrowRight
                size={18}
                className={`shrink-0 transition-transform group-hover/link:translate-x-1 ${node.colors.accent}`}
              />
              <span
                className={`truncate transition-colors ${node.colors.linkHover}`}
              >
                {tool.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {node.otherCount > 0 && (
        <div className="mt-auto border-t-2 border-dashed border-slate-300 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            + {node.otherCount}{" "}
            {node.otherCount === 1 ? "outra ferramenta" : "outras ferramentas"}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// =========================================
// PANEL (Desktop): wrapper que muda largura conforme estado
// =========================================

function Panel({
  node,
  state,
  width,
  onMouseEnter,
  onMouseLeave,
  onClick,
  index,
}: {
  node: MapNode;
  state: PanelState;
  width: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  index: number;
}) {
  const bgClass =
    state === "open"
      ? node.colors.bgOpen
      : state === "preview"
        ? node.colors.bgPreview
        : node.colors.bgCollapsed;

  const shadowClass =
    state === "open"
      ? "shadow-[6px_6px_0_#0f172a]"
      : state === "preview"
        ? "shadow-[4px_4px_0_#0f172a]"
        : "shadow-[2px_2px_0_#0f172a]";

  return (
    <motion.div
      // entrada inicial em cascata
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-950 ${bgClass} ${shadowClass}`}
      // Width via style + transition CSS pra animar suavemente o
      // shrink/grow horizontal. Não usamos motion.animate pra width
      // porque o Tailwind aplica overflow-hidden e queremos transição
      // CSS pura, sem que o Framer Motion remova o overflow.
      style={{
        width,
        transition: "width 200ms ease-out",
      }}
    >
      <AnimatePresence mode="wait">
        {state === "collapsed" && (
          <CollapsedContent key="collapsed" node={node} />
        )}
        {state === "preview" && <PreviewContent key="preview" node={node} />}
        {state === "open" && <OpenContent key="open" node={node} />}
      </AnimatePresence>
    </motion.div>
  );
}

// =========================================
// PANEL MOBILE: acordeão vertical com expand/collapse de altura
// =========================================

function PanelMobile({
  node,
  isOpen,
  onClick,
  index,
}: {
  node: MapNode;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onClick}
      className={`cursor-pointer overflow-hidden rounded-2xl border-2 border-slate-950 ${node.colors.bgOpen} shadow-[4px_4px_0_#0f172a]`}
    >
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <span
            className={`font-display text-3xl font-black ${node.colors.accent}`}
          >
            {node.number}
          </span>
          <h3
            className={`font-display text-xl font-black ${node.colors.accent}`}
          >
            {node.title}
          </h3>
        </div>
        <motion.div
          className={`h-3 w-3 rounded-full ${node.colors.dot}`}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <p className="text-sm font-medium text-slate-700">
                {node.subtitle}
              </p>

              <div
                className={`mt-4 h-0.5 w-12 rounded-full ${node.colors.dot}`}
                aria-hidden="true"
              />

              <ul className="mt-4 grid grid-cols-1 gap-y-3.5">
                {node.tools.map((tool) => (
                  <li key={tool.href}>
                    <Link
                      href={tool.href}
                      onClick={(e) => e.stopPropagation()}
                      className="group/link flex items-center gap-3 text-base font-bold text-slate-950"
                    >
                      <ArrowRight
                        size={18}
                        className={`shrink-0 transition-transform group-hover/link:translate-x-1 ${node.colors.accent}`}
                      />
                      <span
                        className={`transition-colors ${node.colors.linkHover}`}
                      >
                        {tool.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {node.otherCount > 0 && (
                <div className="mt-4 border-t-2 border-dashed border-slate-300 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    + {node.otherCount}{" "}
                    {node.otherCount === 1
                      ? "outra ferramenta"
                      : "outras ferramentas"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =========================================
// BACKGROUND DECORATIVO: pontos + 4 shapes
// =========================================

function BackgroundDecoration() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)",
          backgroundSize: "32px 32px",
          opacity: 0.35,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute h-20 w-20 rounded-full border-2 border-violet-300"
        style={{ top: "8%", left: "5%", opacity: 0.5 }}
        aria-hidden="true"
      />
      <div
        className="absolute h-16 w-16 rotate-12 rounded-2xl border-2 border-emerald-300"
        style={{ top: "35%", right: "6%", opacity: 0.5 }}
        aria-hidden="true"
      />
      <svg
        className="absolute"
        style={{
          bottom: "20%",
          left: "4%",
          width: "70px",
          height: "70px",
          opacity: 0.5,
        }}
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <polygon
          points="50,15 90,85 10,85"
          fill="none"
          stroke="#fdba74"
          strokeWidth="3"
        />
      </svg>
      <div
        className="absolute h-14 w-14 rotate-45 border-2 border-blue-300"
        style={{ bottom: "10%", right: "8%", opacity: 0.5 }}
        aria-hidden="true"
      />
    </>
  );
}

// =========================================
// SEÇÃO PRINCIPAL
// =========================================

export default function Mapa() {
  // clickedKey: painel que está aberto por click (estado "âncora")
  // hoveredKey: painel que está em hover; quando ≠ null, TODOS entram
  // em estado preview (regra do design, 25% cada).
  const [clickedKey, setClickedKey] = useState<NodeKey>("descobrir");
  const [hoveredKey, setHoveredKey] = useState<NodeKey | null>(null);

  // Timer pra dar 200ms de "graça" antes de sair do modo preview.
  // ReturnType<typeof setTimeout> é portável entre Node/browser.
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (key: NodeKey) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredKey(key);
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setHoveredKey(null);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Estado de cada painel: nova lógica "hover localizado":
  // - hover no próprio aberto → ignora, estado padrão
  // - hover em outro painel → apenas esse vira preview, aberto continua
  //   aberto (encolhe um pouco), demais ficam colapsados
  // - sem hover → 1 aberto + 3 colapsados
  const getPanelState = (key: NodeKey): PanelState => {
    if (hoveredKey === clickedKey) {
      return key === clickedKey ? "open" : "collapsed";
    }
    if (hoveredKey !== null && hoveredKey !== clickedKey) {
      if (key === hoveredKey) return "preview";
      if (key === clickedKey) return "open";
      return "collapsed";
    }
    return key === clickedKey ? "open" : "collapsed";
  };

  // Larguras correspondentes:
  // - Padrão:    67 + 11 + 11 + 11 = 100
  // - Com hover: 52 + 26 + 11 + 11 = 100  (aberto cede 15% pro preview)
  const getPanelWidth = (state: PanelState): string => {
    if (hoveredKey !== null && hoveredKey !== clickedKey) {
      if (state === "open") return "52%";
      if (state === "preview") return "26%";
      return "11%";
    }
    return state === "open" ? "67%" : "11%";
  };

  return (
    <section className="relative overflow-hidden bg-[#fafaf9] py-20 md:py-28">
      <BackgroundDecoration />

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="font-display text-xs font-black uppercase tracking-[0.2em] text-violet-700 md:text-sm"
          >
            Tudo organizado
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 font-display font-black leading-[1.05] text-slate-950"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            Do zero ao{" "}
            <span className="relative inline-block">
              <span className="relative">primeiro emprego</span>
              <span
                className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-violet-500"
                aria-hidden="true"
              />
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-base font-medium text-slate-700 md:text-lg"
          >
            4 etapas, todas as ferramentas que você precisa em cada uma.
          </motion.p>
        </div>

        {/* Acordeão Desktop: 4 painéis horizontais com altura fixa */}
        <div className="mt-16 hidden h-[480px] gap-2 md:flex">
          {NODES.map((node, index) => {
            const state = getPanelState(node.key);
            return (
              <Panel
                key={node.key}
                node={node}
                state={state}
                width={getPanelWidth(state)}
                onMouseEnter={() => handleMouseEnter(node.key)}
                onMouseLeave={handleMouseLeave}
                onClick={() => setClickedKey(node.key)}
                index={index}
              />
            );
          })}
        </div>

        {/* Acordeão Mobile: vertical, sem estado preview */}
        <div className="mt-16 space-y-3 md:hidden">
          {NODES.map((node, index) => (
            <PanelMobile
              key={node.key}
              node={node}
              isOpen={clickedKey === node.key}
              onClick={() => setClickedKey(node.key)}
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex items-center justify-center gap-2 text-sm font-medium text-slate-600"
        >
          <Sparkles size={16} className="text-violet-600" />
          <span>+30 ferramentas, todas conectadas pela sua jornada</span>
        </motion.div>
      </div>
    </section>
  );
}
