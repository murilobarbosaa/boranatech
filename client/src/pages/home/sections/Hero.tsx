import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
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
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
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
  frontend: { bg: "bg-violet-50", color: "var(--color-violet-500)", exemplos: "React, Vue" },
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
  { label: "N · Descobrir", color: "var(--color-violet-600)", top: "8%", left: SIDE_OFFSET },
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

// Tempo até o fallback assumir quando o observer não dispara. Curto porque o
// badge fica acima da dobra: se em 1.2s o gatilho não veio, ele não vem mais.
const COUNTER_FALLBACK_MS = 1200;

function AnimatedCounter({
  value,
  targetRef,
}: {
  value: number;
  targetRef: React.RefObject<HTMLElement | null>;
}) {
  const prefersReduced = useReducedMotion();
  // Sem IntersectionObserver o framer-motion lança dentro de um efeito passivo
  // e derruba a árvore inteira (pior que exibir 0). Passando um ref vazio o
  // useInView não observa nada, `isInView` fica false e o fallback resolve.
  const unobservedRef = useRef<HTMLElement>(null);
  const observedRef =
    typeof IntersectionObserver !== "undefined" ? targetRef : unobservedRef;
  // O alvo do observer é o BADGE, não o span de dígitos. O span tem largura
  // dependente do conteúdo que ainda vai animar: no primeiro paint ele contém
  // só o "0" (~10px) e, em viewport estreita, cabia inteiro dentro da faixa
  // morta lateral criada pela margem negativa, então nunca intersectava e o
  // contador ficava travado em 0 (medido quebrando em 320/344/375/390/402).
  // Margem negativa só no eixo VERTICAL: nos lados ela encolhe a root e volta
  // a excluir alvos estreitos.
  const isInView = useInView(observedRef, {
    once: true,
    margin: "0px 0px -80px 0px",
  });
  // Rede de segurança: se o observer não disparar por qualquer motivo (alvo
  // fora da root, IntersectionObserver indisponível, layout inesperado), o
  // contador vai pro valor final assim mesmo. 0 nunca é estado final visível.
  const [fallbackFired, setFallbackFired] = useState(false);
  const count = useMotionValue(prefersReduced ? value : 0);
  const rounded = useTransform(count, (latest) =>
    Math.round(latest).toLocaleString("pt-BR"),
  );

  useEffect(() => {
    // Movimento reduzido: valor final direto, sem animação.
    if (prefersReduced) {
      count.set(value);
      return;
    }
    if (!isInView && !fallbackFired) return;
    const controls = animate(count, value, {
      duration: 1.2,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [isInView, fallbackFired, prefersReduced, value, count]);

  useEffect(() => {
    if (prefersReduced || isInView || fallbackFired) return;
    const timeoutId = window.setTimeout(
      () => setFallbackFired(true),
      COUNTER_FALLBACK_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [prefersReduced, isInView, fallbackFired]);

  // Largura RESERVADA pelo valor FINAL, e nao pelo valor atual.
  //
  // Sem isto o span cresce junto com os digitos (0 -> 12 -> 917 -> 2.921), o
  // badge inteiro cresce com ele, e em viewport estreita o texto do badge
  // QUEBRA PARA A SEGUNDA LINHA e volta, varias vezes, durante a animacao.
  // Medido em 390px: altura do badge alternando entre 20px e 40px, o `ul.grid`
  // logo abaixo pulando entre y=768 e y=788, 27 mudancas de geometria em 1.2s, e
  // CLS de 0.103 (acima do limiar de 0.1). Medido tambem no codigo anterior a
  // este contador, quando ele ficava travado em 0: CLS 0.00000. Ou seja, o
  // deslocamento nasceu junto com a animacao, e some reservando o espaco.
  //
  // A reserva e uma COPIA INVISIVEL do valor final, e nao um calculo de largura.
  //
  // A primeira versao usava `minWidth: ${n}ch`, contando caracteres. Media errado:
  // `ch` e a largura do glifo "0" PADRAO, e com `tabular-nums` o digito e cerca de
  // 18% mais estreito. Medido em 390px: caixa reservada de 49,5px para um numero
  // que ocupa 38,9px, ou seja **10,6px de espaco morto** entre o numero e a
  // palavra seguinte, visivel em TODAS as larguras, inclusive no desktop, onde
  // nao ha quebra nenhuma.
  //
  // Aqui quem define a largura e o proprio texto final, renderizado e medido pelo
  // browser. Nao ha unidade a estimar e nao ha o que corrigir quando a fonte
  // mudar. Mesmo principio dos skeletons da Novidades: derivar do que existe, em
  // vez de calcular por fora.
  //
  // A copia e `aria-hidden` e o numero vivo fica sobreposto em `absolute`, entao
  // leitor de tela le so uma vez. `tabular-nums` no pai continua necessario: sem
  // ele "111" e "999" teriam larguras diferentes e o numero animado poderia
  // estourar a caixa dimensionada pelo valor final.
  const valorFinal = value.toLocaleString("pt-BR");

  return (
    <span className="relative inline-block tabular-nums">
      <span aria-hidden className="invisible">
        {valorFinal}
      </span>
      <motion.span className="absolute inset-0 text-left">{rounded}</motion.span>
    </span>
  );
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
            linear-gradient(to right, var(--bnt-grid-major) 1px, transparent 1px),
            linear-gradient(to bottom, var(--bnt-grid-major) 1px, transparent 1px),
            linear-gradient(to right, var(--bnt-grid-minor) 1px, transparent 1px),
            linear-gradient(to bottom, var(--bnt-grid-minor) 1px, transparent 1px)
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
                <stop offset="0%" stopColor="var(--color-violet-600)" />
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

// Contexto estruturado de cada falha do contador, mandado pro Sentry. Todos os
// caminhos que antes ficavam mudos (.catch vazio, !r.ok -> null, HTML da Vercel,
// count degradado) passam por aqui, pra a gente enxergar a distribuição real por
// dispositivo (429 de rate limit vs CORS/ad-block vs HTML por VITE_API_URL
// ausente vs count nulo). NÃO muda nada visível: a UI segue no cache/placeholder.
// Tipo do desfecho, CAMPO e nao texto. A alternativa seria derivar de `message`
// com um casamento de padrao, que e a classe de instrumento que este projeto ja
// viu falhar PASSANDO. Uniao fechada: um ramo novo sem tipo nao compila.
type StatsCounterTipo = "http" | "non_json" | "degraded_payload" | "network";

type StatsCounterContext = {
  tipo: StatsCounterTipo;
  resolvedUrl: string;
  hadCache: boolean;
  status: number | null;
  contentType: string | null;
};

/**
 * DOIS destinos, escolhidos por `hadCache`, e nao por gravidade do erro.
 *
 * BUG-29/39/57 sao a MESMA causa em tres issues: cada engine escreve o mesmo
 * TypeError de rede com outra frase ("Load failed" no Safari, "Failed to fetch"
 * no Chrome, "NetworkError when attempting to fetch resource." no Firefox). Os
 * eventos vieram todos com `hadCache: true`, ou seja, o contador seguiu na tela
 * com o valor em cache e o usuario nao viu absolutamente nada.
 *
 * Com cache, a falha vale em AGREGADO ("que fracao das cargas nao consegue
 * falar com a API?"), e agregacao e o PostHog. Mandar isso para o Sentry e o
 * que lib/sentry.ts manda NAO fazer: la e stream de erro, com cota. Sem cache o
 * contador some da tela, e ai e evento de erro mesmo.
 *
 * `fingerprint` fixo no ramo do Sentry: e ele que faz as tres frases de engine
 * colapsarem numa issue so. Sem ele, o default agrupa pela mensagem e cada
 * navegador continua abrindo a sua.
 */
function captureStatsCounterIssue(
  message: string,
  ctx: StatsCounterContext,
  error?: unknown,
): void {
  if (ctx.hadCache) {
    try {
      posthog.capture("stats_users_count_fetch_failed", {
        tipo: ctx.tipo,
        status: ctx.status,
        contentType: ctx.contentType,
        resolvedUrl: ctx.resolvedUrl,
      });
    } catch {
      // Telemetria nunca quebra o render da home.
    }
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("route", "stats/users-count");
    scope.setLevel("warning");
    scope.setFingerprint(["stats-users-count-fetch"]);
    scope.setContext("stats_users_count", {
      tipo: ctx.tipo,
      resolvedUrl: ctx.resolvedUrl,
      hadCache: ctx.hadCache,
      status: ctx.status,
      contentType: ctx.contentType,
      origin: typeof window !== "undefined" ? window.location.origin : null,
    });
    if (error !== undefined) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(message);
    }
  });
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
  // Alvo estável do observer do contador: largura do badge não depende do
  // número que ainda vai animar.
  const badgeRef = useRef<HTMLDivElement>(null);

  // Alterna o highlight do headline a cada 3s.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentHighlight((prev) => (prev + 1) % HIGHLIGHTS.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const resolvedUrl = apiUrl("/api/stats/users-count");
    const hadCache = readCachedUsersCount() !== null;

    fetch(resolvedUrl)
      .then(async (r) => {
        const contentType = r.headers.get("content-type");

        if (!r.ok) {
          // Não-2xx (ex.: 429 do rate limit em IP compartilhado, 5xx): antes
          // virava null em silêncio.
          captureStatsCounterIssue(`[stats] users-count HTTP ${r.status}`, {
            tipo: "http",
            resolvedUrl,
            hadCache,
            status: r.status,
            contentType,
          });
          return;
        }

        // content-type não-JSON (cenário Vercel sem VITE_API_URL: o rewrite
        // devolve o HTML do app.html com 200): parsear lançaria e sumiria no
        // catch. Capturamos explícito ANTES do r.json().
        if (!contentType || !contentType.includes("application/json")) {
          captureStatsCounterIssue("[stats] users-count non-JSON response", {
            tipo: "non_json",
            resolvedUrl,
            hadCache,
            status: r.status,
            contentType,
          });
          return;
        }

        const data = await r.json();
        if (cancelled) return;

        if (!data || typeof data.count !== "number" || data.count <= 0) {
          // Resposta degradada (count nulo/0/negativo): não é estado real, não
          // exibe nem grava no cache (evitaria envenenar o localStorage
          // compartilhado). Mesmo guard do Checkout, agora instrumentado.
          captureStatsCounterIssue("[stats] users-count degraded payload", {
            tipo: "degraded_payload",
            resolvedUrl,
            hadCache,
            status: r.status,
            contentType,
          });
          return;
        }

        setUsersCount(data.count);
        writeCachedUsersCount(data.count);
      })
      .catch((err) => {
        // Rede/CORS/ad-block/JSON malformado: antes engolido pelo catch vazio.
        captureStatsCounterIssue(
          "[stats] users-count fetch failed",
          {
            tipo: "network",
            resolvedUrl,
            hadCache,
            status: null,
            contentType: null,
          },
          err,
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="inicio"
      ref={sectionRef}
      className="bnt-ancora relative min-h-screen overflow-hidden bg-[var(--brand-cream)] py-16 md:py-24"
      aria-labelledby="hero-headline"
    >
      <MapBackground sectionRef={sectionRef} />

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        {/* 1) Badge social com triângulo de tooltip de mapa abaixo. */}
        <motion.div
          ref={badgeRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-4 py-2 shadow-[3px_3px_0_var(--bnt-shadow)]"
        >
          <Compass size={18} className="text-violet-600" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-950">
            {usersCount !== null ? (
              <>
                +<AnimatedCounter value={usersCount} targetRef={badgeRef} />{" "}
                pessoas{" "}
                {/* Quebra DELIBERADA, e o limite e MEDIDO, nao um breakpoint do
                    tema. Varrendo de 380 a 420 pixel a pixel, com o <br>
                    desligado: em 394px a frase ocupa 2 linhas e em 395px cabe em
                    1. Usar `sm:` (640px) faria o <br> aparecer em 430, 480 e 600,
                    forcando duas linhas onde uma serve.

                    O valor na classe e 395 e nao 394 porque foi conferido nas
                    duas bordas com o <br> LIGADO: com `max-[394px]` o <br>
                    passava a valer so a partir de 393 e sobrava exatamente uma
                    largura (394) com a quebra acidental. Com `max-[395px]` o
                    comportamento medido e o desejado -- 392, 393 e 394 com a
                    quebra deliberada, 395 em diante numa linha so. O limite veio
                    da medicao nas bordas, nao de aritmetica sobre o numero.

                    Sem isto a quebra caia no meio da frase e mudava de lugar
                    conforme a largura ("...encontraram / seu caminho" em 320 e
                    390, "...seu / caminho" em 402), o que le como acidente. Aqui
                    ela e sempre no mesmo ponto: o numero e a palavra que carrega
                    a prova social ficam juntos na primeira linha.

                    Se a copy encurtar a ponto de caber em 320px, este <br> sai e
                    nada mais precisa mudar. */}
                <br className="hidden max-[395px]:inline" />
                já encontraram seu caminho
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
              className="absolute inset-0 -z-10 -rotate-1 rounded-md border-2 border-slate-950 bg-amber-300 shadow-[3px_3px_0_var(--bnt-shadow)]"
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={currentHighlight}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative inline-block text-ink-on-accent"
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
            className="font-display inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[var(--brand-yellow)] px-8 py-4 font-black text-ink-on-accent shadow-[4px_4px_0_var(--bnt-shadow)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--bnt-shadow)] active:translate-y-0 active:shadow-[2px_2px_0_var(--bnt-shadow)]"
          >
            Explorar a plataforma
            <ArrowRight size={18} aria-hidden="true" />
          </Link>

          <Link
            href="/areas"
            className="font-display inline-flex items-center rounded-full border-2 border-slate-950 bg-white px-8 py-4 font-black text-slate-950 shadow-[4px_4px_0_var(--bnt-shadow)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--bnt-shadow)] active:translate-y-0 active:shadow-[2px_2px_0_var(--bnt-shadow)]"
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
