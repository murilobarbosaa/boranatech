import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";
import { useReducedMotion } from "framer-motion";

import DecryptedText from "@/components/decorative/DecryptedText";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { greet } from "@shared/greeting";
import type { Profile } from "@/services/contracts";
import { skillsAreaNames } from "@/lib/homeData.generated";
import { areasCount } from "@/lib/countsGenerated";

const HEADLINE_TEXT = "Sua carreira em TI começa aqui.";
const EYEBROW_TEXT = "BORA NA TECH?";
const SUBHEAD_TEXT = "Digite ou clique em um comando pra começar.";

type SidebarVariant = "explorer" | "primary" | "muted";

type SidebarCommand = {
  label: string;
  variant: SidebarVariant;
};

type CommandSection = {
  title: string;
  commands: SidebarCommand[];
};

// =========================================
// Tabela de comandos parametrizavel (free vs pro)
// =========================================

type CommandContext = {
  user: ReturnType<typeof useAuth>["user"];
  profile: Profile | null;
  subscription: unknown;
  isPro: boolean;
};

type CommandResult =
  | { kind: "output"; content: ReactNode }
  | { kind: "navigate"; system: string; to: string }
  | { kind: "clear" };

type CommandMap = Record<string, (ctx: CommandContext) => CommandResult>;

type CommandSet = {
  commands: CommandMap;
  sidebar: CommandSection[];
  renderWelcome: (ctx: CommandContext, reduce: boolean) => ReactNode;
  placeholder?: string;
};

// ---- FREE: reproduz 1:1 o comportamento atual ----

const FREE_SIDEBAR_SECTIONS: CommandSection[] = [
  {
    title: "EXPLORAR",
    commands: [
      { label: "help", variant: "explorer" },
      { label: "skills", variant: "explorer" },
      { label: "roadmap", variant: "explorer" },
    ],
  },
  {
    title: "AÇÕES",
    commands: [
      { label: "start", variant: "primary" },
      { label: "pro", variant: "primary" },
    ],
  },
  {
    title: "UTIL",
    commands: [{ label: "clear", variant: "muted" }],
  },
];

const FREE_COMMANDS: CommandMap = {
  help: (ctx) => ({
    kind: "output",
    content: (
      <div className="space-y-1">
        <div>
          <span className="text-amber-400">help</span> mostra esta ajuda
        </div>
        <div>
          <span className="text-amber-400">start</span>{" "}
          {ctx.user ? "abre seu perfil" : "inicia sua jornada (cadastro)"}
        </div>
        <div>
          <span className="text-amber-400">pro</span> ver planos Pro
        </div>
        <div>
          <span className="text-amber-400">skills</span> áreas de TI disponíveis
        </div>
        <div>
          <span className="text-amber-400">roadmap</span> exemplo de roadmap
        </div>
        <div>
          <span className="text-amber-400">clear</span> limpa o terminal
        </div>
      </div>
    ),
  }),
  start: (ctx) => ({
    kind: "navigate",
    system: "Iniciando sua jornada em TI...",
    to: ctx.user ? "/perfil" : "/cadastro",
  }),
  pro: () => ({
    kind: "navigate",
    system: "Carregando planos Pro...",
    to: "/planos",
  }),
  skills: () => ({
    kind: "output",
    content: (
      <div>
        <div className="mb-1 text-slate-400">
          {areasCount} áreas de TI disponíveis:
        </div>
        <div className="text-slate-300">
          {skillsAreaNames.join(" · ")}
        </div>
      </div>
    ),
  }),
  roadmap: () => ({
    kind: "output",
    content: (
      <div>
        <div className="mb-2 text-slate-400">
          Exemplo: roadmap Frontend Iniciante
        </div>
        <div className="space-y-1 text-slate-300">
          <div>
            <span className="text-emerald-400">[01]</span> HTML + CSS
            fundamentos
          </div>
          <div>
            <span className="text-emerald-400">[02]</span> JavaScript moderno
            (ES6+)
          </div>
          <div>
            <span className="text-emerald-400">[03]</span> Git + GitHub básico
          </div>
          <div className="mt-2 text-slate-500">
            ... e mais 8 etapas. Digite 'start' pra ver completo.
          </div>
        </div>
      </div>
    ),
  }),
  clear: () => ({ kind: "clear" }),
};

const FREE_COMMAND_SET: CommandSet = {
  commands: FREE_COMMANDS,
  sidebar: FREE_SIDEBAR_SECTIONS,
  renderWelcome: (_ctx, reduce) => <InitialWelcome reduce={reduce} />,
  placeholder: "digite um comando...",
};

// ---- PRO: novo conjunto ----

type ProTool = { label: string; title: string; route: string; desc: string };

const PRO_TOOLS: ProTool[] = [
  {
    label: "curriculo",
    title: "Currículo",
    route: "/curriculo/analisar",
    desc: "Analisa seu currículo com IA",
  },
  {
    label: "roadmap",
    title: "Roadmaps",
    route: "/roadmaps",
    desc: "Roadmaps completos de carreira",
  },
  {
    label: "entrevista",
    title: "Entrevistas",
    route: "/entrevistas",
    // TODO(Ana): copy do card de entrevistas
    desc: "Treino de entrevistas com IA",
  },
  {
    // TODO(Ana): copy do card de plano de carreira
    label: "carreira",
    title: "Plano de carreira",
    route: "/plano-carreira",
    desc: "A rota da sua carreira com IA",
  },
  {
    // TODO(Ana): validar desc do card do Analisador de LinkedIn
    label: "linkedin",
    title: "LinkedIn",
    route: "/linkedin/analisar",
    desc: "Analise seu LinkedIn",
  },
  {
    label: "portfolio",
    title: "Portfólio",
    route: "/portfolio/analisar",
    desc: "Analisa seu portfólio do GitHub",
  },
];

const PRO_SIDEBAR_SECTIONS: CommandSection[] = [
  {
    title: "FERRAMENTAS",
    commands: PRO_TOOLS.map((t) => ({
      label: t.label,
      variant: "primary" as SidebarVariant,
    })),
  },
  {
    title: "CONTA",
    commands: [{ label: "status", variant: "explorer" }],
  },
  {
    title: "UTIL",
    commands: [
      { label: "tools", variant: "muted" },
      { label: "help", variant: "muted" },
      { label: "clear", variant: "muted" },
    ],
  },
];

function formatValidUntil(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR"); // dd/mm/aaaa
}

function ProToolsList() {
  return (
    <div>
      <div className="mb-1 text-slate-400">Ferramentas Pro disponíveis:</div>
      <div className="space-y-1 text-slate-300">
        {PRO_TOOLS.map((t) => (
          <div key={t.label} className="flex gap-3">
            <span className="w-40 shrink-0 text-amber-400">{t.label}</span>
            <span>{t.desc}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-slate-500">
        Digite o nome de uma ferramenta pra abrir.
      </div>
    </div>
  );
}

function ProStatus({ ctx }: { ctx: CommandContext }) {
  const planName =
    (ctx.subscription as { plans?: { name?: string | null } | null } | null)
      ?.plans?.name ?? "Pro";
  const validUntil = formatValidUntil(
    (ctx.subscription as { current_period_end?: string | null } | null)
      ?.current_period_end ?? null,
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 font-bold text-emerald-400">
        <span aria-hidden="true">{">"}</span>
        <span>STATUS: PRO ✓</span>
      </div>
      <div className="text-slate-300">Plano: {planName}</div>
      {validUntil && (
        <div className="text-slate-300">Válido até: {validUntil}</div>
      )}
    </div>
  );
}

function ProHelp() {
  return (
    <div className="space-y-1">
      <div>
        <span className="text-amber-400">tools</span> lista suas ferramentas Pro
      </div>
      <div>
        <span className="text-amber-400">status</span> detalhes da sua
        assinatura
      </div>
      <div>
        <span className="text-amber-400">clear</span> limpa o terminal
      </div>
      <div className="mt-2 text-slate-500">
        Ou digite o nome de uma ferramenta (ex. curriculo, roadmap).
      </div>
    </div>
  );
}

function buildProCommands(): CommandMap {
  const map: CommandMap = {};
  for (const tool of PRO_TOOLS) {
    map[tool.label] = () => ({
      kind: "navigate",
      system: `Abrindo ${tool.title}...`,
      to: tool.route,
    });
  }
  map.tools = () => ({ kind: "output", content: <ProToolsList /> });
  map.status = (ctx) => ({ kind: "output", content: <ProStatus ctx={ctx} /> });
  map.help = () => ({ kind: "output", content: <ProHelp /> });
  map.clear = () => ({ kind: "clear" });
  return map;
}

const PRO_COMMAND_SET: CommandSet = {
  commands: buildProCommands(),
  sidebar: PRO_SIDEBAR_SECTIONS,
  renderWelcome: (ctx) => <ProWelcome profile={ctx.profile} />,
  placeholder: "digite um comando...",
};

// =========================================
// CtaFinal: escolhe o set por estado
// =========================================

export default function CtaFinal() {
  const { user } = useAuth();
  const { isPro, loading } = useSubscription();

  if (loading) return null;
  const commandSet = !!user && isPro ? PRO_COMMAND_SET : FREE_COMMAND_SET;
  return <CtaFinalInteractive commandSet={commandSet} />;
}

function CtaFinalInteractive({ commandSet }: { commandSet: CommandSet }) {
  const terminalRef = useRef<TerminalCardHandle>(null);

  const handleCommandClick = useCallback((cmd: string) => {
    if (cmd === "clear") {
      terminalRef.current?.execute("clear");
    } else {
      terminalRef.current?.fillInput(cmd);
    }
  }, []);

  return (
    <section
      className="relative overflow-hidden bg-[#faf8f4] py-20 md:py-28"
      aria-labelledby="cta-final-title"
    >
      <MatrixBackground />

      <div className="container relative z-10">
        <div className="mx-auto max-w-5xl">
          <div className="md:hidden mb-4">
            <CommandChipsMobile
              sections={commandSet.sidebar}
              onCommand={handleCommandClick}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr] md:gap-6">
            <div className="hidden md:block">
              <CommandSidebar
                sections={commandSet.sidebar}
                onCommand={handleCommandClick}
              />
            </div>
            <TerminalCard
              ref={terminalRef}
              commands={commandSet.commands}
              renderWelcome={commandSet.renderWelcome}
              placeholder={commandSet.placeholder}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================
// Matrix background: chuva densa adaptativa de 0/1
// =========================================

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

type MatrixChar = {
  id: number;
  char: "0" | "1";
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
};

function MatrixBackground() {
  const isMobile = useIsMobile();
  const count = isMobile ? 40 : 80;

  const chars = useMemo<MatrixChar[]>(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        char: Math.random() > 0.5 ? "1" : "0",
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 6 + Math.random() * 12,
        size: 8 + Math.random() * 32,
        opacity: 0.08 + Math.random() * 0.3,
      })),
    [count],
  );

  return (
    <div
      className="pointer-events-none select-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {chars.map((c) => {
        const style: CSSProperties = {
          left: `${c.left}%`,
          top: "-40px",
          fontSize: `${c.size}px`,
          opacity: c.opacity,
          animationDelay: `${c.delay}s`,
          animationDuration: `${c.duration}s`,
        };

        return (
          <span
            key={c.id}
            className="animate-matrix-fall absolute font-mono text-slate-300"
            style={style}
          >
            {c.char}
          </span>
        );
      })}
    </div>
  );
}

// =========================================
// CommandSidebar: lista agrupada de comandos
// =========================================

const ITEM_STYLES: Record<SidebarVariant, string> = {
  primary: "text-amber-300 hover:bg-amber-400/10 hover:text-amber-200",
  explorer: "text-violet-300 hover:bg-violet-500/10 hover:text-violet-200",
  muted: "text-slate-400 hover:bg-slate-700/40 hover:text-slate-200",
};

function CommandSidebar({
  sections,
  onCommand,
}: {
  sections: CommandSection[];
  onCommand: (cmd: string) => void;
}) {
  return (
    <aside
      aria-label="Lista de comandos disponíveis"
      className="self-start overflow-hidden rounded-2xl border-2 border-slate-950 bg-slate-900 shadow-[5px_5px_0_#0f172a] md:shadow-[8px_8px_0_#0f172a]"
    >
      <div className="flex items-center border-b-2 border-slate-950 bg-slate-800 px-4 py-2.5">
        <span className="font-mono text-xs font-bold tracking-wider text-slate-400">
          COMANDOS
        </span>
      </div>

      <div className="space-y-4 p-4">
        {sections.map((section, idx) => (
          <div key={section.title}>
            <div className="mb-2 font-mono text-[10px] font-bold tracking-widest text-slate-500">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.commands.map((cmd) => (
                <CommandItem
                  key={cmd.label}
                  command={cmd.label}
                  variant={cmd.variant}
                  onClick={onCommand}
                />
              ))}
            </div>
            {idx < sections.length - 1 && (
              <div
                className="mt-3 border-t border-slate-800"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

function CommandItem({
  command,
  variant,
  onClick,
}: {
  command: string;
  variant: SidebarVariant;
  onClick: (cmd: string) => void;
}) {
  const ariaLabel =
    command === "clear"
      ? "Executar comando clear"
      : `Inserir comando ${command} no terminal`;

  return (
    <button
      type="button"
      onClick={() => onClick(command)}
      aria-label={ariaLabel}
      className={`group flex w-full items-center gap-2 rounded px-2 py-1.5 font-mono text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${ITEM_STYLES[variant]}`}
    >
      <span
        aria-hidden="true"
        className="text-slate-500 transition-colors group-hover:text-current"
      >
        {">"}
      </span>
      <span>{command}</span>
    </button>
  );
}

// =========================================
// CommandChipsMobile: variante condensada (chips horizontais)
// =========================================

const CHIP_STYLES: Record<SidebarVariant, string> = {
  primary: "text-amber-300 border-amber-700",
  explorer: "text-violet-300 border-violet-700",
  muted: "text-slate-400 border-slate-700",
};

function CommandChipsMobile({
  sections,
  onCommand,
}: {
  sections: CommandSection[];
  onCommand: (cmd: string) => void;
}) {
  const allCommands = sections.flatMap((section) => section.commands);

  return (
    <aside
      aria-label="Comandos disponíveis"
      className="rounded-2xl border-2 border-slate-950 bg-slate-900 p-3 shadow-[5px_5px_0_#0f172a]"
    >
      <div className="mb-2 px-1">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Comandos
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {allCommands.map((cmd) => {
          const ariaLabel =
            cmd.label === "clear"
              ? "Executar comando clear"
              : `Inserir comando ${cmd.label} no terminal`;

          return (
            <button
              key={cmd.label}
              type="button"
              onClick={() => onCommand(cmd.label)}
              aria-label={ariaLabel}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 bg-slate-950 px-3 py-2 font-mono text-xs font-bold transition-colors hover:bg-slate-800 ${CHIP_STYLES[cmd.variant]}`}
            >
              <span aria-hidden="true" className="opacity-50">
                {">"}
              </span>
              <span>{cmd.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// =========================================
// Terminal interativo: input controlado + histórico
// =========================================

type TerminalLine = {
  id: string;
  type: "input" | "output" | "error" | "system";
  content: ReactNode;
};

type TerminalCardHandle = {
  execute: (cmd: string) => void;
  fillInput: (cmd: string) => void;
};

type TerminalCardProps = {
  commands?: CommandMap;
  renderWelcome?: (ctx: CommandContext, reduce: boolean) => ReactNode;
  placeholder?: string;
};

let lineIdCounter = 0;
const nextLineId = (prefix: string) => `${prefix}-${++lineIdCounter}`;

const TerminalCard = forwardRef<TerminalCardHandle, TerminalCardProps>(
  function TerminalCard(
    {
      commands = FREE_COMMANDS,
      renderWelcome = (_ctx, reduce) => <InitialWelcome reduce={reduce} />,
      placeholder = "digite um comando...",
    },
    ref,
  ) {
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<TerminalLine[]>([]);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [, setLocation] = useLocation();
    const { user, profile } = useAuth();
    const { subscription, isPro } = useSubscription();
    const reduce = useReducedMotion();

    const isInitialMode = history.length === 0;

    const executeCommand = useCallback(
      (raw: string) => {
        const trimmed = raw.trim().toLowerCase();
        if (!trimmed || isLoadingNav) {
          inputRef.current?.focus({ preventScroll: true });
          return;
        }

        setInput("");

        const inputLine: TerminalLine = {
          id: nextLineId("in"),
          type: "input",
          content: trimmed,
        };

        const command = commands[trimmed];

        if (!command) {
          const errLine: TerminalLine = {
            id: nextLineId("err"),
            type: "error",
            content: `comando não encontrado: "${trimmed}". digite 'help' pra ver os comandos.`,
          };
          setHistory((h) => [...h, inputLine, errLine]);
          inputRef.current?.focus({ preventScroll: true });
          return;
        }

        const ctx: CommandContext = { user, profile, subscription, isPro };
        const result = command(ctx);

        switch (result.kind) {
          case "clear": {
            setHistory([]);
            break;
          }
          case "output": {
            const outLine: TerminalLine = {
              id: nextLineId("out"),
              type: "output",
              content: result.content,
            };
            setHistory((h) => [...h, inputLine, outLine]);
            break;
          }
          case "navigate": {
            const sysLine: TerminalLine = {
              id: nextLineId("sys"),
              type: "system",
              content: result.system,
            };
            setHistory((h) => [...h, inputLine, sysLine]);
            setIsLoadingNav(true);
            navTimeoutRef.current = setTimeout(
              () => setLocation(result.to),
              800,
            );
            break;
          }
        }

        inputRef.current?.focus({ preventScroll: true });
      },
      [commands, isLoadingNav, setLocation, user, profile, subscription, isPro],
    );

    useImperativeHandle(
      ref,
      () => ({
        execute: executeCommand,
        fillInput: (cmd: string) => {
          setInput(cmd);
          inputRef.current?.focus({ preventScroll: true });
          setTimeout(() => {
            inputRef.current?.setSelectionRange(cmd.length, cmd.length);
          }, 0);
        },
      }),
      [executeCommand],
    );

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({
        top: el.scrollHeight,
        behavior: reduce ? "auto" : "smooth",
      });
    }, [history, reduce]);

    useEffect(() => {
      const isTouchDevice =
        typeof window !== "undefined" &&
        window.matchMedia("(pointer: coarse)").matches;

      if (!isTouchDevice) {
        inputRef.current?.focus({ preventScroll: true });
      }
    }, []);

    useEffect(() => {
      return () => {
        if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
      };
    }, []);

    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      executeCommand(input);
    };

    const handleBodyClick = () => {
      const isTouchDevice =
        typeof window !== "undefined" &&
        window.matchMedia("(pointer: coarse)").matches;
      if (isTouchDevice) return;
      if (!isLoadingNav) inputRef.current?.focus({ preventScroll: true });
    };

    const welcomeCtx: CommandContext = { user, profile, subscription, isPro };

    return (
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-950 bg-slate-950 shadow-[5px_5px_0_#0f172a] md:shadow-[8px_8px_0_#0f172a]">
        <div className="relative flex items-center border-b-2 border-slate-950 bg-slate-800 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border border-red-700 bg-red-500"
              aria-hidden="true"
            />
            <span
              className="h-3 w-3 rounded-full border border-yellow-700 bg-yellow-500"
              aria-hidden="true"
            />
            <span
              className="h-3 w-3 rounded-full border border-green-700 bg-green-500"
              aria-hidden="true"
            />
          </div>
          <div className="absolute left-1/2 hidden -translate-x-1/2 font-mono text-xs text-slate-400 md:block">
            {isPro ? "boranatech ~ pro" : "boranatech ~ terminal"}
          </div>
        </div>

        <div
          ref={scrollRef}
          onClick={handleBodyClick}
          className="max-h-[600px] min-h-[320px] flex-1 overflow-y-auto bg-slate-950 p-4 md:min-h-[500px] md:p-8"
        >
          {isInitialMode && renderWelcome(welcomeCtx, !!reduce)}

          {history.map((line) => (
            <HistoryLine key={line.id} line={line} />
          ))}

          {!isLoadingNav && (
            <form
              onSubmit={handleSubmit}
              className="mt-3 flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                className="font-mono text-sm text-amber-400 md:text-base"
              >
                $
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
                aria-label="Terminal de comando"
                className="flex-1 border-none bg-transparent font-mono text-sm text-white caret-amber-400 outline-none placeholder:text-slate-600 md:text-base"
              />
            </form>
          )}

          {isLoadingNav && (
            <div className="mt-3 flex animate-pulse items-center gap-2 font-mono text-amber-400">
              <span aria-hidden="true">$</span>
              <span>loading...</span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

function InitialWelcome({ reduce }: { reduce: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-mono text-sm font-bold text-violet-400 md:text-base">
        <span aria-hidden="true">{">"}</span>
        {reduce ? (
          <span className="tracking-widest">{EYEBROW_TEXT}</span>
        ) : (
          <DecryptedText
            text={EYEBROW_TEXT}
            animateOn="view"
            sequential
            revealDirection="start"
            speed={50}
            maxIterations={10}
            parentClassName="tracking-widest"
          />
        )}
      </div>

      <h2
        id="cta-final-title"
        aria-label={HEADLINE_TEXT}
        className="font-display font-black text-white"
        style={{ fontSize: "clamp(1.5rem, 4.5vw, 3.5rem)", lineHeight: 1.1 }}
      >
        {reduce ? (
          HEADLINE_TEXT
        ) : (
          <DecryptedText
            text={HEADLINE_TEXT}
            animateOn="view"
            sequential
            revealDirection="start"
            speed={40}
            maxIterations={15}
            parentClassName="font-display"
          />
        )}
      </h2>

      <div className="flex items-start gap-2 font-mono text-sm text-slate-300 md:text-base">
        <span aria-hidden="true" className="mt-0.5 text-slate-500">
          {">"}
        </span>
        {reduce ? (
          <span>{SUBHEAD_TEXT}</span>
        ) : (
          <DecryptedText
            text={SUBHEAD_TEXT}
            animateOn="view"
            sequential
            revealDirection="start"
            speed={30}
            maxIterations={8}
            className="text-slate-300"
          />
        )}
      </div>
    </div>
  );
}

function ProWelcome({ profile }: { profile: Profile | null }) {
  const firstName = profile?.name?.trim().split(/\s+/)[0] || "";
  const greeting = greet(profile?.gender);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-400 md:text-base">
        <span aria-hidden="true">{">"}</span>
        <span>STATUS: PRO ✓</span>
      </div>

      <h2
        id="cta-final-title"
        className="font-display font-black text-white"
        style={{ fontSize: "clamp(1.5rem, 4.5vw, 3.5rem)", lineHeight: 1.1 }}
      >
        {firstName
          ? `${greeting} de volta, ${firstName}.`
          : `${greeting} de volta.`}
      </h2>

      <div className="flex items-start gap-2 font-mono text-sm text-slate-300 md:text-base">
        <span aria-hidden="true" className="mt-0.5 text-slate-500">
          {">"}
        </span>
        <span>
          Suas ferramentas Pro estão prontas. Digite 'tools' pra ver tudo ou
          'help' pros comandos.
        </span>
      </div>
    </div>
  );
}

function HistoryLine({ line }: { line: TerminalLine }) {
  if (line.type === "input") {
    return (
      <div className="mt-3 flex items-center gap-2 font-mono text-sm text-amber-400 md:text-base">
        <span aria-hidden="true">$</span>
        <span>{line.content}</span>
      </div>
    );
  }
  if (line.type === "output") {
    return (
      <div className="ml-4 mt-3 font-mono text-sm text-slate-300 md:text-base">
        {line.content}
      </div>
    );
  }
  if (line.type === "error") {
    return (
      <div className="ml-4 mt-3 font-mono text-sm text-red-400 md:text-base">
        {line.content}
      </div>
    );
  }
  return (
    <div className="ml-4 mt-3 font-mono text-sm italic text-violet-400 md:text-base">
      {line.content}
    </div>
  );
}
