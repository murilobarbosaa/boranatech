import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Sparkles,
  Star,
  FileText,
  Linkedin,
  Github,
} from "lucide-react";
import { ProStarIcon } from "@/components/pro/ProStarIcon";

type Message = {
  id: number;
  sender: "ai" | "user";
  text: string;
};

const CONVERSATION: Message[] = [
  {
    id: 1,
    sender: "ai",
    text: "Vamos simular uma entrevista pra estágio em desenvolvimento. Pronto?",
  },
  {
    id: 2,
    sender: "user",
    text: "Pronto.",
  },
  {
    id: 3,
    sender: "ai",
    text: "Beleza. Me conta sobre um projeto seu, algo que você construiu, mesmo simples.",
  },
  {
    id: 4,
    sender: "user",
    text: "Eu fiz um TODO list em React seguindo um tutorial...",
  },
  {
    id: 5,
    sender: "ai",
    text: 'Boa, mas posso te dar uma dica? "Seguindo um tutorial" diminui seu mérito. Tenta assim:\n\n"Construí um app de gerenciamento de tarefas em React. Implementei CRUD, persistência local e componentização. Foi minha primeira experiência aplicando hooks na prática."\n\nVê a diferença? Mesma coisa, mas você assume autoria.',
  },
];

const OTHER_TOOLS = [
  {
    name: "Analisar Currículo",
    href: "/curriculo/analisar",
    description: "nota + feedback do seu CV",
    icon: FileText,
  },
  {
    name: "Otimizar LinkedIn",
    href: "/curriculo/linkedin",
    description: "headline e about reescritos pela IA",
    icon: Linkedin,
  },
  {
    name: "Avaliar Portfólio",
    href: "/portfolio/analisar",
    description: "seu GitHub pronto pra estágio?",
    icon: Github,
  },
];

export default function TurbineComIA() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 bg-[#fafaf9]">
      <BackgroundDecoration />

      <div className="relative z-10 mx-auto max-w-5xl px-4">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-amber-700"
          >
            Turbine com IA
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 font-display font-black text-slate-950 leading-[1.05]"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            A <span className="text-amber-600">IA</span> que te prepara pra
            entrevista, entrega análise e te ajuda a{" "}
            <span className="relative inline-block">
              <span className="relative">chegar pronto</span>
              <span
                className="absolute -bottom-2 left-0 right-0 h-3 bg-amber-400 rounded-md -z-10"
                aria-hidden="true"
              />
            </span>
            .
          </motion.h2>
        </div>

        <ConversationMockup />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16"
        >
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px flex-1 bg-slate-300" aria-hidden="true" />
            <p className="font-display text-xs md:text-sm font-black uppercase tracking-[0.2em] text-slate-500">
              E também tem...
            </p>
            <div className="h-px flex-1 bg-slate-300" aria-hidden="true" />
          </div>

          <ul className="space-y-3 max-w-3xl mx-auto">
            {OTHER_TOOLS.map((tool, index) => (
              <ToolListItem key={tool.href} tool={tool} index={index} />
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <Link href="/planos">
            <article
              className="group cursor-pointer rounded-3xl border-2 border-slate-950 p-8 md:p-10 shadow-[6px_6px_0_#0f172a] transition-all duration-300 hover:-translate-y-1 hover:shadow-[10px_10px_0_#0f172a]"
              style={{
                background: "linear-gradient(135deg, #FFF8E7 0%, #FFE89A 100%)",
              }}
            >
              <div className="flex flex-col items-center gap-6 text-center md:flex-row md:gap-8 md:text-left">
                <div className="shrink-0">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-slate-950 bg-amber-300 shadow-[4px_4px_0_#0f172a]">
                    <Star
                      size={36}
                      className="text-slate-950"
                      fill="#F59E0B"
                      strokeWidth={2.5}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-display text-2xl md:text-3xl font-black text-slate-950 leading-tight">
                    Quer usar tudo isso?
                  </h3>
                  <p className="mt-2 text-base md:text-lg font-medium text-slate-800">
                    Conheça o Plano Pro e destrave todas as ferramentas IA.
                  </p>
                </div>

                <div className="pro-glare relative overflow-hidden inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-slate-900 bg-[#FFB800] px-6 py-3 font-display font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition-all group-hover:shadow-[6px_6px_0_#0f172a]">
                  <span>Conhecer o Pro</span>
                  <ArrowRight
                    size={20}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </div>
            </article>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function ConversationMockup() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let cancelled = false;

    const sequence = async () => {
      for (let i = 0; i < CONVERSATION.length; i++) {
        if (cancelled) return;
        const msg = CONVERSATION[i];

        if (msg.sender === "ai") {
          setIsTyping(true);
          await new Promise((r) => setTimeout(r, 1200));
          if (cancelled) return;
          setIsTyping(false);
          await new Promise((r) => setTimeout(r, 100));
        } else {
          await new Promise((r) => setTimeout(r, 800));
        }

        if (cancelled) return;
        setVisibleMessages((prev) => [...prev, msg.id]);
      }
    };

    sequence();

    return () => {
      cancelled = true;
    };
  }, [hasStarted]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mt-16"
    >
      <article className="relative rounded-3xl border-2 border-slate-950 bg-white p-6 md:p-8 shadow-[8px_8px_0_#0f172a]">
        <div className="absolute -top-4 left-6 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-amber-300 px-3 py-1 shadow-[2px_2px_0_#0f172a]">
          <ProStarIcon />
          <span className="font-display text-xs font-black uppercase tracking-wider text-slate-950">
            Exemplo real
          </span>
        </div>

        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 bg-violet-100">
              <Sparkles
                size={20}
                className="text-violet-700"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <p className="font-display text-sm font-black text-slate-950">
                Simulador de Entrevista
              </p>
              <p className="text-xs font-medium text-slate-500">
                IA · Entrevista técnica
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-display text-xs font-black uppercase tracking-wider text-emerald-700">
              Online
            </span>
          </span>
        </div>

        <div className="mt-6 space-y-4 min-h-[400px]">
          <AnimatePresence>
            {CONVERSATION.map((msg) =>
              visibleMessages.includes(msg.id) ? (
                <ChatMessage key={msg.id} message={msg} />
              ) : null,
            )}
          </AnimatePresence>

          <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
        </div>

        <div className="mt-6 pt-6 border-t-2 border-slate-200 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-600">
            Esta é uma simulação real do Simulador de Entrevista.
          </p>
          <Link href="/entrevistas/simulador">
            <button className="pro-glare relative overflow-hidden group inline-flex items-center gap-2 rounded-xl border-2 border-slate-950 bg-amber-300 px-5 py-2.5 font-display font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:shadow-[5px_5px_0_#0f172a] hover:-translate-y-0.5">
              <ProStarIcon />
              <span>Simular minha entrevista (PRO)</span>
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </Link>
        </div>
      </article>
    </motion.div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isAI = message.sender === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 ${
          isAI ? "bg-violet-100" : "bg-slate-100"
        }`}
      >
        {isAI ? (
          <Sparkles size={16} className="text-violet-700" strokeWidth={2.5} />
        ) : (
          <span className="text-sm font-black text-slate-700">VC</span>
        )}
      </div>

      <div
        className={`max-w-[80%] rounded-2xl border-2 border-slate-950 px-4 py-3 shadow-[2px_2px_0_#0f172a] ${
          isAI ? "bg-violet-50" : "bg-amber-50"
        }`}
      >
        <p className="text-sm md:text-base font-medium text-slate-800 leading-relaxed whitespace-pre-line">
          {message.text}
        </p>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-violet-100">
        <Sparkles size={16} className="text-violet-700" strokeWidth={2.5} />
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-slate-950 bg-violet-50 px-4 py-3 shadow-[2px_2px_0_#0f172a]">
        <motion.span
          className="h-2 w-2 rounded-full bg-violet-600"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="h-2 w-2 rounded-full bg-violet-600"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
        />
        <motion.span
          className="h-2 w-2 rounded-full bg-violet-600"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
        />
      </div>
    </motion.div>
  );
}

function ToolListItem({
  tool,
  index,
}: {
  tool: {
    name: string;
    href: string;
    description: string;
    icon: typeof Sparkles;
  };
  index: number;
}) {
  const Icon = tool.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
    >
      <Link href={tool.href}>
        <article className="group flex items-center gap-4 rounded-xl border-2 border-slate-950 bg-white p-4 md:p-5 shadow-[3px_3px_0_#0f172a] transition-all duration-300 hover:-translate-x-1 hover:shadow-[5px_5px_0_#0f172a]">
          <div className="shrink-0 inline-flex items-center gap-1 rounded-lg border-2 border-slate-950 bg-amber-300 px-2 py-1 shadow-[2px_2px_0_#0f172a]">
            <ProStarIcon />
            <span className="font-display text-[10px] font-black uppercase tracking-wider text-slate-950">
              Pro
            </span>
          </div>

          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-950 bg-violet-100">
            <Icon size={20} className="text-violet-700" strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display text-base md:text-lg font-black text-slate-950 truncate">
              {tool.name}
            </p>
            <p className="text-xs md:text-sm font-medium text-slate-600 truncate">
              {tool.description}
            </p>
          </div>

          <ArrowRight
            size={20}
            className="shrink-0 text-slate-400 transition-all group-hover:text-violet-700 group-hover:translate-x-1"
          />
        </article>
      </Link>
    </motion.li>
  );
}

function BackgroundDecoration() {
  return (
    <>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="stars-pattern"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 10 L 22 16 L 28 16 L 23 20 L 25 26 L 20 22 L 15 26 L 17 20 L 12 16 L 18 16 Z"
              fill="#fbbf24"
              opacity="0.15"
            />
            <path
              d="M 60 50 L 61 53 L 64 53 L 61.5 55 L 62.5 58 L 60 56 L 57.5 58 L 58.5 55 L 56 53 L 59 53 Z"
              fill="#fbbf24"
              opacity="0.2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#stars-pattern)" />
      </svg>

      <WhiteSparkles />
    </>
  );
}

function WhiteSparkles() {
  const sparkles = [
    { top: "12%", left: "18%", size: 6, delay: 0 },
    { top: "8%", left: "65%", size: 5, delay: 1.2 },
    { top: "25%", left: "42%", size: 8, delay: 2.8 },
    { top: "18%", left: "88%", size: 5, delay: 4.5 },
    { top: "38%", left: "8%", size: 6, delay: 1.8 },
    { top: "45%", left: "75%", size: 7, delay: 3.5 },
    { top: "55%", left: "30%", size: 5, delay: 5.2 },
    { top: "62%", left: "92%", size: 8, delay: 2.2 },
    { top: "72%", left: "55%", size: 6, delay: 0.8 },
    { top: "82%", left: "15%", size: 5, delay: 4 },
    { top: "88%", left: "70%", size: 7, delay: 1.5 },
    { top: "30%", left: "60%", size: 5, delay: 3.8 },
  ];

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[1]"
      aria-hidden="true"
    >
      {sparkles.map((s, idx) => (
        <motion.div
          key={idx}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            boxShadow: `0 0 ${s.size * 3}px ${s.size * 1.5}px rgba(255, 184, 0, 0.7), 0 0 ${s.size}px ${s.size * 0.5}px rgba(255, 255, 255, 0.9)`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.4, 1.3, 0.4],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s.delay,
            repeatDelay: 1.5,
          }}
        />
      ))}
    </div>
  );
}
