import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  IdCard,
  TriangleAlert,
} from "lucide-react";

import { CompletionCtaLinks } from "@/components/roadmapV2/RoadmapCompletionModal";
import { useAuth } from "@/contexts/AuthContext";
import { fireProCelebration } from "@/lib/proConfetti";
import type { CompletionCta } from "@/lib/roadmapV2/completionCtas";
import type { RoadmapV2 } from "@/lib/roadmapV2/types";
import {
  getEligibility,
  issueCertificate,
} from "@/services/certificateService";
import { getHistory, type QuizHistory } from "@/services/roadmapQuizService";
import type {
  Eligibility,
  MissingProfileField,
} from "@shared/certificates/types";
import {
  PASS_SCORE,
  QUESTIONS_PER_ATTEMPT,
  RETAKE_LIMIT,
} from "@shared/roadmapQuiz/types";

import CompleteProfileModal from "./CompleteProfileModal";

// Maquina de estados do bloco de conclusao (item 1), dirigida pelo GET de
// elegibilidade. UM estado por vez. O botao do LinkedIn SO existe em
// already_issued. Auto-contido: busca a elegibilidade, emite e reavalia sozinho
// (RoadmapsV2.tsx nao muda).
type CertificateBlockProps = {
  roadmap: RoadmapV2;
  completedDate: string;
  // next-trail + projects, herdadas do card; sem quiz nem share.
  secondaryCtas: CompletionCta[];
  // Contagem agregada de topicos (opcional): reforco de conquista no estado
  // already_issued. Vem pronta de RoadmapsV2; opcional pra nao quebrar outros
  // usos nem os demais estados.
  overall?: { done: number; total: number };
  // Persistencia da celebracao (Etapa 2). `undefined` = sem conclusao
  // registrada; `null` = concluida mas ainda nao celebrada (dispara o confete);
  // string = ja celebrada. onCelebrate marca celebrated_at apos disparar.
  celebratedAt?: string | null;
  onCelebrate?: () => void;
  // Conclusao local (allComplete no RoadmapsV2): usada pra recuperar o estado
  // inconsistente not_complete e pra liberar o caminho da prova.
  allComplete: boolean;
  // Re-registra a conclusao quando o server ainda nao a tem (beco not_complete).
  onEnsureCompletion?: () => Promise<boolean>;
};

const MISSING_LABEL: Record<MissingProfileField, string> = {
  full_name: "nome completo",
  cpf: "CPF",
};

// Botao primario por accent. Base compartilhada com o traco neo-brutalista +
// mobile-fix (w-full sm:w-auto); a cor muda por estado (violet=estudo/prova,
// gold=certificado, emerald=passo pendente, ink=acao neutra "tentar de novo").
// O #FFB800 fica reservado pro gesto que cria/leva ao certificado.
const PRIMARY_BASE =
  "inline-flex w-full items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 px-5 py-3 text-sm font-black shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto";
const violetPrimary = `${PRIMARY_BASE} bg-violet-800 text-white`;
const goldPrimary = `${PRIMARY_BASE} bg-[#FFB800] text-slate-950`;
const emeraldPrimary = `${PRIMARY_BASE} bg-emerald-600 text-white`;
const inkPrimary = `${PRIMARY_BASE} bg-slate-900 text-white`;

const SUBTITLE = "mx-auto mt-2 max-w-md text-sm font-semibold text-slate-600";
const STAT = "mx-auto mt-3 max-w-md text-xs font-bold text-slate-700";

function formatRetryAt(retryAt: string | undefined): string {
  if (!retryAt) return "mais tarde";
  const date = new Date(retryAt);
  if (Number.isNaN(date.getTime())) return "mais tarde";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Estado already_issued (redesign dourado): botao secundario mais leve que a
// acao principal (outline, sombra menor). w-full no mobile, largura intrinseca
// a partir de sm. Renderizados direto no card, sem o CompletionCtaLinks
// compartilhado, pra achatar o aninhamento e alinhar a pilha no mobile.
const celebrationSecondaryClass =
  "inline-flex w-full items-center justify-center gap-1.5 rounded-[11px] border-2 border-slate-900 bg-white/60 px-4 py-2.5 text-sm font-black text-slate-800 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-px hover:bg-white hover:shadow-[3px_3px_0_#0f172a] sm:w-auto";

// Entrada (padrao do projeto: framer-motion + gate em useReducedMotion). Selo
// entra com escala + leve rotacao; conteudo com fade/slide-up em stagger.
const CELEBRATION_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const CELEBRATION_SEAL: Variants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -12 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 220, damping: 15 },
  },
};
const CELEBRATION_ITEM: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// Cache em memoria da elegibilidade por usuario+trilha. Nao ha React Query no
// projeto e getEligibility e fetch puro: sem isto, toda volta a pagina refaz o
// fetch e pisca o skeleton. Com o cache, a volta ja monta o card final (sem
// loading, sem flash) e revalida em background. Chaveado por usuario pra nao
// vazar elegibilidade entre contas.
const eligibilityCache = new Map<string, Eligibility>();
const eligibilityKey = (userId: string, slug: string) => `${userId}:${slug}`;

function asSecondary(ctas: CompletionCta[]): CompletionCta[] {
  return ctas.map((cta) => ({ ...cta, variant: "secondary" as const }));
}

// Semantica de cor dos estados verdes: violet=estudo/prova, emerald=passou
// (falta 1 passo), neutral=informativo sem acao, danger=erro. O already_issued
// dourado tem shell proprio (inline, com framer-motion + confete) e NAO passa
// por aqui.
type Accent = "violet" | "emerald" | "neutral" | "danger";
const ACCENT: Record<Accent, { bg: string; shadow: string; seal: string }> = {
  violet: {
    bg: "bg-violet-50",
    shadow: "shadow-[5px_5px_0_#5b21b6]",
    seal: "bg-violet-700 text-white",
  },
  emerald: {
    bg: "bg-emerald-50",
    shadow: "shadow-[5px_5px_0_#10b981]",
    seal: "bg-emerald-300 text-slate-950",
  },
  neutral: {
    bg: "bg-[#faf8f4]",
    shadow: "shadow-[5px_5px_0_#cbd5e1]",
    seal: "bg-slate-200 text-slate-700",
  },
  danger: {
    bg: "bg-white",
    shadow: "shadow-[5px_5px_0_#ef4444]",
    seal: "bg-red-100 text-red-600",
  },
};

// Shell dos estados verdes: selo circular no topo (analogo ao dourado), titulo
// e corpo centralizados. Estatico (sem entrada animada) por ser bloco de status;
// a celebracao animada continua so no already_issued.
function StateShell({
  accent,
  icon,
  title,
  children,
}: {
  accent: Accent;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <div
      className={`mt-6 rounded-[14px] border-[2.5px] border-slate-900 p-5 text-center sm:p-6 ${a.bg} ${a.shadow}`}
    >
      <span
        aria-hidden
        className={`mx-auto grid h-14 w-14 place-items-center rounded-full border-[2.5px] border-slate-900 shadow-[3px_3px_0_#0f172a] ${a.seal}`}
      >
        {icon}
      </span>
      <h2 className="mt-4 font-display text-xl font-black leading-tight text-slate-950 sm:text-2xl">
        {title}
      </h2>
      {children}
    </div>
  );
}

// Fileira de acoes: mobile empilha em coluna (botoes w-full), sm vira linha
// centralizada. Primario e secundarios (CompletionCtaLinks, agora Fragment)
// ficam como irmaos aqui.
function CtaRow({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
      {children}
    </div>
  );
}

export default function CertificateBlock({
  roadmap,
  completedDate,
  secondaryCtas,
  overall,
  celebratedAt,
  onCelebrate,
  allComplete,
  onEnsureCompletion,
}: CertificateBlockProps) {
  const { user } = useAuth();
  const slug = roadmap.slug;
  const reduce = useReducedMotion();

  // Semente sincrona do cache: se ja avaliamos esta trilha nesta sessao, monta
  // direto no estado final, sem loading. seededRef marca "ja estava la" pra nao
  // reanimar a entrada numa volta a pagina.
  const initialCached = user
    ? eligibilityCache.get(eligibilityKey(user.id, slug))
    : undefined;
  const [eligibility, setEligibility] = useState<Eligibility | null>(
    initialCached ?? null,
  );
  const [loading, setLoading] = useState(initialCached == null);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  // Historico da prova (notas, restantes, cooldown). Suplementar: so em
  // quiz_required. null = ainda nao carregou OU falhou (degradacao graciosa).
  const [history, setHistory] = useState<QuizHistory | null>(null);

  const sealRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(initialCached != null);
  // Guard por mount pra o confete de conquista nao redisparar em re-render.
  const celebratedRef = useRef(false);
  // Guard por mount pra a recuperacao do not_complete rodar uma vez so.
  const recoverRef = useRef(false);
  // Guard de desmonte + contador de sequencia: descarta respostas que chegam
  // apos o desmonte ou que foram superadas por uma chamada mais nova (evita
  // clobber de estado novo e setState em componente morto).
  const mountedRef = useRef(true);
  const loadSeqRef = useRef(0);
  const historySeqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(
    async (opts?: { background?: boolean }) => {
      const seq = (loadSeqRef.current += 1);
      // Revalidacao em background nao mostra skeleton (o card ja esta na tela).
      if (!opts?.background) setLoading(true);
      const result = await getEligibility(slug);
      // Resposta superada (chamada mais nova) ou pos-desmonte: ignora.
      if (!mountedRef.current || seq !== loadSeqRef.current) return;
      if (result) {
        if (user) eligibilityCache.set(eligibilityKey(user.id, slug), result);
        setEligibility(result);
        setLoading(false);
      } else if (!opts?.background) {
        // Falha no carregamento inicial: sem dado, cai no skeleton. Numa
        // revalidacao em background preserva o card ja exibido (nao pisca
        // skeleton por um blip de rede nem apaga o cache com null).
        setEligibility(null);
        setLoading(false);
      }
    },
    [slug, user],
  );

  useEffect(() => {
    if (!user) return;
    const cached = eligibilityCache.get(eligibilityKey(user.id, slug));
    if (cached) {
      // Volta a pagina: monta o card final na hora e revalida em silencio.
      seededRef.current = true;
      setEligibility(cached);
      setLoading(false);
      void load({ background: true });
    } else {
      void load();
    }
  }, [user, slug, load]);

  // Confete de conquista, persistido cross-device por celebrated_at (Etapa 2).
  // Dispara UMA vez quando o card dourado already_issued aparece com a conclusao
  // ainda nao celebrada (celebratedAt === null; `undefined` = sem conclusao, nao
  // dispara). Logo apos disparar, onCelebrate marca celebrated_at (otimista +
  // POST). Tres camadas anti-duplo: celebratedRef (por mount), o update otimista
  // que vira celebratedAt != null (re-render/remount na sessao) e o UPDATE
  // idempotente no server. Sempre atras de prefers-reduced-motion.
  useEffect(() => {
    if (reduce) return;
    if (eligibility?.status !== "already_issued") return;
    if (celebratedAt !== null) return;
    if (celebratedRef.current) return;
    celebratedRef.current = true;
    const rect = sealRef.current?.getBoundingClientRect();
    const origin = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }
      : { x: 0.5, y: 0.3 };
    const stop = fireProCelebration(origin);
    onCelebrate?.();
    const timer = setTimeout(stop, 900);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [eligibility?.status, celebratedAt, reduce, onCelebrate]);

  // Recuperacao do beco not_complete: a trilha esta concluida localmente
  // (allComplete) mas o server ainda nao tem a conclusao — corrida entre o POST
  // de registro e este GET (que pode ter cacheado o not_complete), ou registro
  // ao vivo que falhou. Re-registra (idempotente) e, ao confirmar, invalida o
  // not_complete cacheado e revalida -> cai em quiz_required. Uma vez por mount;
  // se o re-registro nao resolver, o proprio card ja oferece a prova (o gate
  // completion_required do /prova informa o caso real).
  useEffect(() => {
    if (eligibility?.status !== "not_complete" || !allComplete) return;
    if (recoverRef.current || !onEnsureCompletion) return;
    recoverRef.current = true;
    let cancelled = false;
    void onEnsureCompletion().then((ok) => {
      if (cancelled || !ok || !mountedRef.current) return;
      if (user) eligibilityCache.delete(eligibilityKey(user.id, slug));
      void load();
    });
    return () => {
      cancelled = true;
    };
  }, [eligibility?.status, allComplete, onEnsureCompletion, user, slug, load]);

  // Histórico da prova SO no estado quiz_required, buscado sob demanda. Sem
  // cache (dado suplementar e barato), mas com os mesmos guards de race/desmonte
  // do load (seq + mountedRef). Falha e silenciosa: history fica null e o card
  // renderiza sem as estatisticas — o botao da prova segue funcionando.
  useEffect(() => {
    if (eligibility?.status !== "quiz_required") {
      setHistory(null);
      return;
    }
    const seq = (historySeqRef.current += 1);
    getHistory(slug)
      .then((result) => {
        if (!mountedRef.current || seq !== historySeqRef.current) return;
        setHistory(result);
      })
      .catch(() => {
        // Degradacao graciosa: sem historico, sem estatisticas.
      });
  }, [eligibility?.status, slug]);

  const handleIssue = useCallback(async () => {
    setIssuing(true);
    setIssueError(false);
    const result = await issueCertificate(slug);
    if (!mountedRef.current) return;
    if (result.ok) {
      // Nao monta o certificado com dado local otimista: reavalia do server e
      // cai em already_issued (o proprio load atualiza o cache).
      await load();
      if (!mountedRef.current) return;
    } else if ("reason" in result) {
      // Emissao recusada: o motivo E a elegibilidade atual. Espelha no cache
      // pra proxima visita nao semear o estado pre-emissao obsoleto.
      if (user) eligibilityCache.set(eligibilityKey(user.id, slug), result.reason);
      setEligibility(result.reason);
    } else {
      setIssueError(true);
    }
    setIssuing(false);
  }, [slug, load, user]);

  const completedTitle = `Você concluiu a trilha ${roadmap.title}!`;

  // Anima a entrada SO quando o card aparece de fato pela primeira vez (fetch
  // inicial). Numa volta a pagina (seeded do cache) o card ja "estava la":
  // nao reanima. Tambem respeita prefers-reduced-motion.
  const animateIn = !reduce && !seededRef.current;

  // Skeleton NEUTRO (creme/cinza), deliberadamente sem verde nem dourado: no
  // loading ainda nao sabemos o estado final, entao qualquer cor de estado
  // pisca ao trocar. Espelha o layout do card dourado (selo + titulo + botoes)
  // pra minimizar layout shift. Nao usa o StateShell compartilhado.
  if (loading || !eligibility) {
    return (
      <div className="mt-6 rounded-[14px] border-[2.5px] border-slate-900 bg-[#faf8f4] p-6 text-center shadow-[5px_5px_0_#cbd5e1] sm:p-7">
        <div className="mx-auto h-[68px] w-[68px] animate-pulse rounded-full bg-slate-200" />
        <div className="mx-auto mt-4 h-6 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="mx-auto mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <div className="h-11 w-full animate-pulse rounded-[11px] bg-slate-200 sm:w-44" />
          <div className="h-11 w-full animate-pulse rounded-[11px] bg-slate-200 sm:w-40" />
        </div>
      </div>
    );
  }

  switch (eligibility.status) {
    // Nada a fazer alem de continuar: trilha nao certificavel.
    case "not_certifiable":
      return (
        <StateShell
          accent="neutral"
          icon={<CheckCircle2 className="h-7 w-7" aria-hidden />}
          title="Trilha concluída!"
        >
          <p className={SUBTITLE}>Você concluiu todos os passos desta trilha.</p>
          <CtaRow>
            <CompletionCtaLinks ctas={secondaryCtas} />
          </CtaRow>
        </StateShell>
      );

    // Trilha sem prova/certificado: deixa explicito, sem botao de prova.
    case "no_quiz":
      return (
        <StateShell
          accent="neutral"
          icon={<CheckCircle2 className="h-7 w-7" aria-hidden />}
          title={completedTitle}
        >
          <p className={SUBTITLE}>
            Esta trilha não tem prova final nem certificado. Continue praticando
            pelos próximos passos.
          </p>
          <CtaRow>
            <CompletionCtaLinks ctas={secondaryCtas} />
          </CtaRow>
        </StateShell>
      );

    // Inconsistente: concluida localmente mas o server ainda nao registrou. O
    // efeito de recuperacao re-registra e revalida; enquanto isso oferecemos a
    // prova (o gate completion_required do /prova informa o caso real). Accent
    // violeta porque leva a prova; comportamento intocado.
    case "not_complete":
      return (
        <StateShell
          accent="violet"
          icon={<GraduationCap className="h-7 w-7" aria-hidden />}
          title={completedTitle}
        >
          <p className={SUBTITLE}>
            Todos os passos obrigatórios estão concluídos.
          </p>
          <CtaRow>
            {allComplete ? (
              <Link href={`/roadmaps/${slug}/prova`} className={violetPrimary}>
                Fazer a prova final
              </Link>
            ) : null}
            <CompletionCtaLinks ctas={asSecondary(secondaryCtas)} />
          </CtaRow>
        </StateShell>
      );

    case "quiz_required": {
      const gate = history?.retakeGate;
      const reprovadas =
        history?.attempts.filter((a) => a.status === "reprovada") ?? [];
      const notas = reprovadas
        .map((a) => a.score)
        .filter((s): s is number => s != null);
      const inCooldown = gate ? !gate.allowed : false;
      let stat: string | null = null;
      if (gate && !gate.allowed) {
        stat = `Você usou as ${RETAKE_LIMIT} tentativas deste ciclo. Novas tentativas a partir de ${formatRetryAt(gate.retryAt)}.`;
      } else if (gate && reprovadas.length > 0) {
        stat = `Você já tentou ${reprovadas.length} ${
          reprovadas.length === 1 ? "vez" : "vezes"
        }${
          notas.length > 0
            ? ` (${notas.join(", ")} de ${QUESTIONS_PER_ATTEMPT})`
            : ""
        }. Restam ${gate.remaining} de ${RETAKE_LIMIT} tentativas neste ciclo.`;
      }
      return (
        <StateShell
          accent="violet"
          icon={<GraduationCap className="h-7 w-7" aria-hidden />}
          title={completedTitle}
        >
          <p className={SUBTITLE}>
            Falta a prova final para conquistar seu certificado — {PASS_SCORE}{" "}
            acertos em {QUESTIONS_PER_ATTEMPT} questões.
          </p>
          {stat ? <p className={STAT}>{stat}</p> : null}
          <CtaRow>
            {inCooldown ? null : (
              <Link href={`/roadmaps/${slug}/prova`} className={violetPrimary}>
                Fazer a prova final
              </Link>
            )}
            <CompletionCtaLinks ctas={asSecondary(secondaryCtas)} />
          </CtaRow>
        </StateShell>
      );
    }

    // Codigo morto hoje (barra unica = aprovacao = certificado). Copy minima.
    case "score_below_cert":
      return (
        <StateShell
          accent="violet"
          icon={<GraduationCap className="h-7 w-7" aria-hidden />}
          title="Quase lá!"
        >
          <p className={SUBTITLE}>
            Você passou com {eligibility.score}/{QUESTIONS_PER_ATTEMPT}, mas o
            certificado exige {eligibility.certScore}. Refaça a prova para
            certificar.
          </p>
          <CtaRow>
            <Link href={`/roadmaps/${slug}/prova`} className={violetPrimary}>
              Refazer a prova
            </Link>
            <CompletionCtaLinks ctas={asSecondary(secondaryCtas)} />
          </CtaRow>
        </StateShell>
      );

    // Passou, falta so completar o perfil pra emitir.
    case "profile_incomplete":
      return (
        <>
          <StateShell
            accent="emerald"
            icon={<IdCard className="h-7 w-7" aria-hidden />}
            title="Falta um passo para o certificado"
          >
            <p className={SUBTITLE}>
              Para emitir seu certificado de {eligibility.hours}h, complete seu
              perfil:{" "}
              {eligibility.missing.map((f) => MISSING_LABEL[f]).join(" e ")}.
            </p>
            <CtaRow>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className={emeraldPrimary}
              >
                Completar perfil
              </button>
              <CompletionCtaLinks ctas={asSecondary(secondaryCtas)} />
            </CtaRow>
          </StateShell>
          <CompleteProfileModal
            open={modalOpen}
            missing={eligibility.missing}
            onClose={() => setModalOpen(false)}
            onSaved={() => {
              setModalOpen(false);
              void load();
            }}
          />
        </>
      );

    // Passou e perfil ok: emitir. Botao em #FFB800 (previa do certificado
    // dourado) sobre shell emerald.
    case "eligible":
      return (
        <StateShell
          accent="emerald"
          icon={<BadgeCheck className="h-7 w-7" aria-hidden />}
          title="Tudo pronto para o seu certificado!"
        >
          <p className={SUBTITLE}>
            Você passou na prova. Emita seu certificado de {eligibility.hours}h
            quando quiser.
          </p>
          <CtaRow>
            <button
              type="button"
              onClick={handleIssue}
              disabled={issuing}
              className={goldPrimary}
            >
              {issuing
                ? "Emitindo..."
                : `Emitir certificado (${eligibility.hours}h)`}
            </button>
            <CompletionCtaLinks ctas={asSecondary(secondaryCtas)} />
          </CtaRow>
          {issueError ? (
            <p className="mt-3 text-xs font-bold text-red-600">
              Não deu pra emitir agora. Tente de novo.
            </p>
          ) : null}
        </StateShell>
      );

    // Card de conquista (shell PROPRIO, dourado): nao usa o StateShell
    // compartilhado (tem framer-motion + confete proprios). Selo circular no
    // topo, hierarquia de acoes e pilha de botoes achatada pro mobile.
    case "already_issued": {
      const metadata = [
        completedDate ? `Concluído em ${completedDate}` : null,
        `${eligibility.hours}h de conteúdo`,
        overall
          ? `${overall.done} de ${overall.total} tópicos${
              overall.total > 0 && overall.done >= overall.total ? " · 100%" : ""
            }`
          : null,
      ].filter(Boolean);

      return (
        <motion.div
          {...(!animateIn
            ? {}
            : {
                variants: CELEBRATION_CONTAINER,
                initial: "hidden",
                animate: "show",
              })}
          className="mt-6 rounded-[14px] border-[2.5px] border-slate-900 bg-[linear-gradient(135deg,#fffdf5_0%,#fff3cf_55%,#ffe6a3_100%)] p-6 text-center shadow-[5px_5px_0_#FFB800] sm:p-7"
        >
          <motion.div
            ref={sealRef}
            aria-hidden
            {...(!animateIn ? {} : { variants: CELEBRATION_SEAL })}
            className="mx-auto grid h-[68px] w-[68px] place-items-center rounded-full border-[2.5px] border-slate-900 bg-[#FFB800] shadow-[3px_3px_0_#0f172a]"
          >
            <Award className="h-8 w-8 text-slate-950" strokeWidth={2.5} />
          </motion.div>

          <motion.h2
            {...(!animateIn ? {} : { variants: CELEBRATION_ITEM })}
            className="mt-4 font-display text-2xl font-black leading-tight text-slate-950 sm:text-3xl"
          >
            {completedTitle}
          </motion.h2>

          <motion.p
            {...(!animateIn ? {} : { variants: CELEBRATION_ITEM })}
            className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-700"
          >
            {/* TODO(Ana): parabens + certificado emitido */}
            Parabéns! Seu certificado da trilha {roadmap.title} foi emitido.
          </motion.p>

          {metadata.length > 0 ? (
            <motion.p
              {...(!animateIn ? {} : { variants: CELEBRATION_ITEM })}
              className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-800"
            >
              {metadata.join(" · ")}
            </motion.p>
          ) : null}

          <motion.div
            {...(!animateIn ? {} : { variants: CELEBRATION_ITEM })}
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
          >
            <Link
              href={`/certificados/${eligibility.code}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-5 py-3 text-base font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] sm:w-auto"
            >
              <Award className="h-5 w-5" aria-hidden />
              {/* TODO(Ana): label ver meu certificado */}
              Ver meu certificado
            </Link>
            {secondaryCtas.map((cta) =>
              cta.href.startsWith("/") ? (
                <Link
                  key={cta.id}
                  href={cta.href}
                  className={celebrationSecondaryClass}
                >
                  {cta.label}
                </Link>
              ) : (
                <a
                  key={cta.id}
                  href={cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={celebrationSecondaryClass}
                >
                  {cta.label}
                </a>
              ),
            )}
          </motion.div>
        </motion.div>
      );
    }

    // Erro e erro: nao esconde o bloco, nao finge sucesso, nao trata como
    // perfil incompleto.
    case "unavailable":
      return (
        <StateShell
          accent="danger"
          icon={<TriangleAlert className="h-7 w-7" aria-hidden />}
          title="Não conseguimos verificar seu certificado"
        >
          <p className={SUBTITLE}>
            Foi um problema temporário. Tente de novo em instantes.
          </p>
          <CtaRow>
            <button
              type="button"
              onClick={() => void load()}
              className={inkPrimary}
            >
              Tentar novamente
            </button>
          </CtaRow>
        </StateShell>
      );

    default:
      return null;
  }
}
