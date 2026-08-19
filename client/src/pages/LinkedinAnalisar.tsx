import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BadgeCheck,
  Briefcase,
  ChevronDown,
  FileText,
  FileUp,
  History,
  Linkedin,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  Type,
} from "lucide-react";
import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import BrutalActionButton from "@/components/shared/BrutalActionButton";
import CopyButton from "@/components/shared/CopyButton";
import ReanalyzeCta from "@/components/shared/ReanalyzeCta";
import { BntSelect } from "@/components/shared/BntSelect";
import SectionLabel from "@/components/shared/SectionLabel";
import SEO from "@/components/SEO";
import { Spinner } from "@/components/ui/spinner";
import {
  AiSummary,
  Improvements,
  StrengthsWeaknesses,
} from "@/components/portfolio/QualitativePanels";
import { NextStepCard } from "@/components/shared/NextStepCard";
import NextStepsByArea from "@/components/shared/NextStepsByArea";
import { decidirDelta, type VeredictoDelta } from "@shared/linkedin/deltaFunil";
import {
  analiseAnteriorComparavel,
  montarAnaliseComparavel,
} from "@shared/linkedin/comparabilidade";
import {
  BenefitPills,
  HowItWorksTimeline,
  ResultShowcase,
} from "@/components/linkedin/LinkedinAnalyzerIntro";
import LinkedinBackdrop from "@/components/linkedin/LinkedinBackdrop";
import LinkedinHistory from "@/components/linkedin/LinkedinHistory";
import LinkedinResultBackdrop from "@/components/linkedin/LinkedinResultBackdrop";
import LinkedinScanCard from "@/components/linkedin/LinkedinScanCard";
import LinkedinScoreHero from "@/components/linkedin/LinkedinScoreHero";
import ErrorBoundary, { CodigoDoErro } from "@/components/ErrorBoundary";
import { LinkedinError } from "@/components/linkedin/LinkedinStates";
import ScoreDeltaBanner from "@/components/shared/ScoreDeltaBanner";
import RecruiterFinder from "@/components/linkedin/RecruiterFinder";
import SectionReport from "@/components/linkedin/SectionReport";
import { openAgentWidget } from "@/components/agent/AgentWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import FeedbackBanner from "@/components/shared/FeedbackBanner";
import { analyzeLinkedin, getLinkedinAnalysis } from "@/lib/linkedinClient";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { useLinkedinImprovementProgress } from "@/lib/useLinkedinImprovementProgress";
import { useLinkedinHistory } from "@/lib/useLinkedinHistory";
import { extractLinkedinPdf, PdfExtractError } from "@/lib/pdfExtract";
import { cn } from "@/lib/utils";
import { competenciasDoPdf } from "@shared/linkedin/competenciasDoPdf";
import { headlineParecCortada } from "@shared/linkedin/headlineCortada";
import {
  EVENTO_ENVIO,
  EVENTO_REVISAO,
  payloadEnvio,
  payloadRevisao,
} from "@/lib/headlineAvisoTelemetria";
import posthog from "posthog-js";
import { parseLinkedinText } from "@shared/linkedin/parse";
import { readQualitative } from "@shared/linkedin/readQualitative";
import { readDeterministic } from "@shared/linkedin/readDeterministic";
import { mesmoTextoHash } from "@shared/linkedin/textoHash";
import { hashLinkedinTextNoCliente } from "@/lib/linkedinTextHash";
import {
  decodeLinkedinStoredState,
  encodeLinkedinStoredState,
} from "@/lib/linkedinStoredState";
import {
  AREA_LABELS,
  AREA_SLUGS,
  isAreaSlug,
  type AreaSlug,
} from "@shared/areas";
import {
  ATIVIDADE,
  CONEXOES,
  LINKEDIN_LEVELS,
  LINKEDIN_LEVEL_LABELS,
  MERCADOS,
  MERCADO_LABELS,
  type Atividade,
  type Conexoes,
  type LinkedinAnalysisResponse,
  type LinkedinAnalyzeRequest,
  type LinkedinCheckCategory,
  type LinkedinLevel,
  type Mercado,
  type OpenToWork,
  type SimNao,
  HEADLINE_MANUAL_MAX,
  headlineManualAtiva,
  headlineFinalDe,
  normalizarHeadlineManual,
} from "@shared/linkedin/schema";

const ac = getPageAccentUi("sky");

const STORAGE_KEY = "boranatech:linkedin-analyzer";

const LEVEL_LABEL = LINKEDIN_LEVEL_LABELS;

const CONEXOES_LABEL: Record<Conexoes, string> = {
  "ate-50": "Até 50",
  "50-100": "50 a 100",
  "100-500": "100 a 500",
  "500-mais": "500 ou mais",
};

const ATIVIDADE_LABEL: Record<Atividade, string> = {
  nunca: "Nunca",
  raramente: "Raramente",
  semanal: "Toda semana",
  diaria: "Todo dia",
};

const SIM_NAO_LABEL: Record<SimNao, string> = {
  sim: "Sim",
  nao: "Não",
};

const OPEN_TO_WORK_LABEL: Record<OpenToWork, string> = {
  sim: "Sim, configurado",
  nao: "Não",
  "nao-sei": "Não sei",
};

// TODO(Ana): revisar o placeholder dos selects de sinais.
const SELECT_PLACEHOLDER = "Selecione";

// Os 5 sinais começam SEM resposta ("" = a pessoa ainda não respondeu): um
// default pre-marcado vira resposta errada silenciosa. O checklist de
// mínimos bloqueia o submit até os 5 terem valor, e o request schema segue
// intacto (o payload só é montado com valores válidos).
interface FormState {
  profileText: string;
  area: AreaSlug;
  level: LinkedinLevel;
  mercado: Mercado;
  skills: string;
  foto: SimNao | "";
  banner: SimNao | "";
  openToWork: OpenToWork | "";
  conexoes: Conexoes | "";
  atividade: Atividade | "";
  objetivo: string;
}

function emptyForm(): FormState {
  return {
    profileText: "",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "",
    foto: "",
    banner: "",
    openToWork: "",
    conexoes: "",
    atividade: "",
    objetivo: "",
  };
}

interface StoredState {
  form: FormState;
  result: LinkedinAnalysisResponse | null;
  // Id da analise persistida exibida (null = sem checklist de melhorias).
  analysisId: string | null;
  textoHash: string | null;
  headlineManual: string | null;
}

function coerceForm(value: unknown): FormState {
  const base = emptyForm();
  if (!value || typeof value !== "object") return base;
  const v = value as Partial<FormState>;
  return {
    profileText: typeof v.profileText === "string" ? v.profileText : "",
    area: isAreaSlug(v.area) ? v.area : base.area,
    level: LINKEDIN_LEVELS.includes(v.level as LinkedinLevel)
      ? (v.level as LinkedinLevel)
      : base.level,
    mercado: MERCADOS.includes(v.mercado as Mercado)
      ? (v.mercado as Mercado)
      : base.mercado,
    skills: typeof v.skills === "string" ? v.skills : "",
    // Sinais: valor valido restaura; qualquer outra coisa (inclusive o "")
    // do proprio estado sem resposta) volta pra sem resposta.
    foto: v.foto === "sim" || v.foto === "nao" ? v.foto : "",
    banner: v.banner === "sim" || v.banner === "nao" ? v.banner : "",
    openToWork:
      v.openToWork === "sim" ||
      v.openToWork === "nao" ||
      v.openToWork === "nao-sei"
        ? v.openToWork
        : "",
    conexoes: CONEXOES.includes(v.conexoes as Conexoes)
      ? (v.conexoes as Conexoes)
      : "",
    atividade: ATIVIDADE.includes(v.atividade as Atividade)
      ? (v.atividade as Atividade)
      : "",
    objetivo: typeof v.objetivo === "string" ? v.objetivo : "",
  };
}

function loadState(): StoredState {
  if (typeof window === "undefined") {
    return {
      form: emptyForm(),
      result: null,
      analysisId: null,
      textoHash: null,
      headlineManual: null,
    };
  }
  let raw: string | null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return {
      form: emptyForm(),
      result: null,
      analysisId: null,
      textoHash: null,
      headlineManual: null,
    };
  }
  const decoded = decodeLinkedinStoredState(raw);
  if (!decoded) {
    return {
      form: emptyForm(),
      result: null,
      analysisId: null,
      textoHash: null,
      headlineManual: null,
    };
  }
  return {
    form: coerceForm(decoded.form),
    result: decoded.result,
    analysisId: decoded.analysisId,
    textoHash: decoded.textoHash,
    headlineManual: decoded.headlineManual,
  };
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-slate-800">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-sky-200";

// Caminho de entrada: o PDF guiado e o primario; digitar na mao e o fallback;
// review e o pos-parse com os campos preenchidos.
type EntryPath = "pdf" | "manual" | "review";

// TODO(Ana): revisar TODA a copy do fluxo de entrada por PDF (passos,
// dropzone, revisao, erros e links).
const ENTRY_COPY = {
  pdfTitle: "Traga seu perfil em 30 segundos",
  pdfSubtitle:
    "Exporte o PDF oficial do seu perfil e deixe a gente preencher tudo. Você só revisa.",
  steps: [
    "Abra seu perfil no LinkedIn.",
    "Toque em Mais (More) logo abaixo do seu nome.",
    "Escolha Salvar como PDF.",
    "Solte o arquivo aqui embaixo.",
  ],
  dropIdle: "Arraste o PDF aqui ou clique para escolher",
  dropHint: "Somente PDF, até 5MB.",
  dropReading: "Lendo o PDF...",
  privacy:
    "Seu arquivo nunca sai do navegador: a gente lê o texto aqui mesmo e só o texto vai pra análise.",
  manualLink: "Prefiro preencher na mão",
  backToPdf: "Usar o PDF do LinkedIn (recomendado)",
  parseFail:
    "Esse PDF não parece o export de perfil do LinkedIn. Siga o passo a passo acima (Mais, Salvar como PDF) e tente de novo, ou preencha na mão.",
  reviewTitle: "Confira o que detectamos",
  reviewSubtitle:
    "Preenchemos com o que veio no PDF. Revise, complete o que faltar e analise.",
  reviewNotFound: "não detectado",
  reviewFullText: "Ver e editar o texto completo extraído",
  swapPdf: "Trocar o PDF",
  skillsGapTitle: "Complete suas competências",
  skillsGapHint:
    "O PDF do LinkedIn costuma trazer só as principais competências (até 5). Cole as outras da seção Competências do seu perfil, separadas por vírgula.",
  confirmTitle: "Confirme o que o PDF não traz",
  confirmHint:
    "O export do LinkedIn não inclui foto, banner, Open to Work, conexões nem sua frequência de atividade. Responda aqui.",
  manualTitle: "Seu perfil",
  manualSubtitle:
    "Cole o texto do seu perfil (headline, Sobre, experiências) e preencha os campos abaixo.",
  checklistTitle: "Falta pouco pra analisar:",
  checklistChars: (n: number) =>
    `Texto do perfil com pelo menos 200 caracteres (agora: ${n}).`,
  checklistSections:
    "Inclua o Sobre ou as experiências: não detectamos nenhum dos dois no texto.",
  // TODO(Ana): revisar o item de sinais do checklist de minimos.
  checklistSinais:
    "Responda as 5 perguntas do perfil (foto, banner, Open to Work, conexões e atividade).",
} as const;

type UpdateField = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;

// Area, nivel, mercado e objetivo: contexto da analise, presente nos dois
// caminhos (o PDF nao traz esses dados de forma confiavel).
function ContextFields({
  form,
  update,
}: {
  form: FormState;
  update: UpdateField;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Área de interesse">
        <BntSelect
          accent="blue"
          label="Área de interesse"
          value={form.area}
          onValueChange={(v) => update("area", v as AreaSlug)}
          options={AREA_SLUGS.map((slug) => ({
            value: slug,
            label: AREA_LABELS[slug],
          }))}
        />
      </Field>

      <Field label="Nível">
        <BntSelect
          accent="blue"
          label="Nível"
          value={form.level}
          onValueChange={(v) => update("level", v as LinkedinLevel)}
          options={LINKEDIN_LEVELS.map((level) => ({
            value: level,
            label: LEVEL_LABEL[level],
          }))}
        />
      </Field>

      <Field label="Onde você quer trabalhar?">
        <BntSelect
          accent="blue"
          label="Onde você quer trabalhar?"
          value={form.mercado}
          onValueChange={(v) => update("mercado", v as Mercado)}
          options={MERCADOS.map((mercado) => ({
            value: mercado,
            label: MERCADO_LABELS[mercado],
          }))}
        />
      </Field>

      <Field label="Objetivo (opcional)">
        <input
          value={form.objetivo}
          onChange={(event) => update("objetivo", event.target.value)}
          placeholder="Ex: estágio remoto em front-end"
          maxLength={300}
          className={inputClass}
        />
      </Field>
    </div>
  );
}

// As cinco perguntas que o export do LinkedIn sabidamente NAO responde.
function ProfileQuestions({
  form,
  update,
}: {
  form: FormState;
  update: UpdateField;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Tem foto profissional?">
        <BntSelect
          accent="blue"
          label="Tem foto profissional?"
          placeholder={SELECT_PLACEHOLDER}
          value={form.foto}
          onValueChange={(v) => update("foto", v as SimNao)}
          options={(["sim", "nao"] as SimNao[]).map((value) => ({
            value,
            label: SIM_NAO_LABEL[value],
          }))}
        />
      </Field>

      <Field label="Tem banner personalizado?">
        <BntSelect
          accent="blue"
          label="Tem banner personalizado?"
          placeholder={SELECT_PLACEHOLDER}
          value={form.banner}
          onValueChange={(v) => update("banner", v as SimNao)}
          options={(["sim", "nao"] as SimNao[]).map((value) => ({
            value,
            label: SIM_NAO_LABEL[value],
          }))}
        />
      </Field>

      <Field label="Open to Work para recrutadores?">
        <BntSelect
          accent="blue"
          label="Open to Work para recrutadores?"
          placeholder={SELECT_PLACEHOLDER}
          value={form.openToWork}
          onValueChange={(v) => update("openToWork", v as OpenToWork)}
          options={(["sim", "nao", "nao-sei"] as OpenToWork[]).map((value) => ({
            value,
            label: OPEN_TO_WORK_LABEL[value],
          }))}
        />
      </Field>

      <Field label="Quantas conexões?">
        <BntSelect
          accent="blue"
          label="Quantas conexões?"
          placeholder={SELECT_PLACEHOLDER}
          value={form.conexoes}
          onValueChange={(v) => update("conexoes", v as Conexoes)}
          options={CONEXOES.map((value) => ({
            value,
            label: CONEXOES_LABEL[value],
          }))}
        />
      </Field>

      <Field label="Com que frequência posta ou comenta?">
        <BntSelect
          accent="blue"
          label="Com que frequência posta ou comenta?"
          placeholder={SELECT_PLACEHOLDER}
          value={form.atividade}
          onValueChange={(v) => update("atividade", v as Atividade)}
          options={ATIVIDADE.map((value) => ({
            value,
            label: ATIVIDADE_LABEL[value],
          }))}
        />
      </Field>
    </div>
  );
}

// Entrada padrao dos blocos do corpo revista do resultado: whileInView uma
// vez, stagger curto via delay; reduce pula direto. Copia do Reveal do GitHub.
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Icones das secoes do prontuario (mapa unico, na ordem de leitura).
const SECTION_ICON_CLASS = "h-5 w-5 text-sky-700";

// Nota honesta de estado vazio dos cards do prontuario: diz so o que a
// analise detectou (ou nao detectou), nunca inventa conteudo.
const EMPTY_NOTE_CLASS =
  "mt-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-sm font-medium text-slate-600";

/**
 * Fallback de dominio do resultado. Duas coisas que a tela cheia generica nao
 * consegue dar: diz que a analise NAO se perdeu (ela esta gravada, o que
 * quebrou foi a montagem da tela), e oferece saida util em vez de so recarregar.
 */
function ResultadoIndisponivel({
  eventId,
  onNovaAnalise,
}: {
  eventId: string | null;
  onNovaAnalise: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-950 bg-white p-8 shadow-[5px_5px_0_#0f172a]">
      <div className="flex flex-col items-center text-center">
        <AlertTriangle size={36} className="mb-4 shrink-0 text-amber-500" />
        <h3 className="mb-2 font-display text-xl font-black text-slate-950">
          Não foi possível montar este resultado
        </h3>
        <p className="mb-6 max-w-md text-sm font-medium text-slate-600">
          A análise foi concluída e está salva no seu histórico. O que falhou
          foi a montagem desta tela, e o erro já foi registrado do nosso lado.
        </p>

        {eventId ? <CodigoDoErro id={eventId} /> : null}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bnt-pressable rounded-xl border-2 border-slate-950 bg-[#FFB800] px-4 py-2 font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
          >
            Recarregar a página
          </button>
          <button
            type="button"
            onClick={onNovaAnalise}
            className="bnt-pressable rounded-xl border-2 border-slate-950 bg-white px-4 py-2 font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
          >
            Fazer nova análise
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LinkedinAnalisar() {
  const { isPro } = useSubscription();
  const { profile } = useAuth();
  const { analyses, analysesRef, historyStatus, refreshLinkedinHistory } =
    useLinkedinHistory({ enabled: isPro });

  const [bootstrap] = useState(loadState);
  const [form, setForm] = useState<FormState>(bootstrap.form);
  const [result, setResult] = useState<LinkedinAnalysisResponse | null>(
    bootstrap.result,
  );
  // Id da analise persistida exibida: chaveia o checklist de melhorias
  // aplicadas. null quando a persistencia best-effort falhou ou o restore
  // veio do storage v2 (sem checklist; nunca recuperado por nota).
  const [analysisId, setAnalysisId] = useState<string | null>(
    bootstrap.analysisId,
  );
  const [resultTextoHash, setResultTextoHash] = useState<string | null>(
    bootstrap.textoHash,
  );
  const [headlineManual, setHeadlineManual] = useState<string | null>(
    bootstrap.headlineManual,
  );
  // PDF e a porta de entrada; quem ja tem texto (sessao restaurada) cai
  // direto no modo revisao.
  const [entryPath, setEntryPath] = useState<EntryPath>(() =>
    bootstrap.form.profileText.trim().length > 0 ? "review" : "pdf",
  );
  // Origem efetiva do texto, separada do passo visual `review`: um PDF segue
  // sendo PDF depois que a interface avança para a revisão.
  const [entrySource, setEntrySource] = useState<EntryPath>(() =>
    bootstrap.form.profileText.trim().length > 0 ? "review" : "pdf",
  );
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfStatus, setPdfStatus] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [historyOpenError, setHistoryOpenError] = useState("");
  // Delta de nota vs a analise IMEDIATAMENTE anterior (toda analise de
  // LinkedIn e do mesmo perfil da pessoa, entao nao ha alvo a normalizar).
  const [scoreDelta, setScoreDelta] = useState<{
    from: number;
    to: number;
  } | null>(null);
  // Regua de leitura do perfil mudou entre a analise anterior e esta? Quando
  // muda, as duas notas nao sao comparaveis: nao ha delta nem celebracao, so
  // um aviso. Sem isto, uma correcao de parser vira "voce melhorou" com
  // confete, comemorando algo que a pessoa nao fez.
  const [reguaMudou, setReguaMudou] = useState(false);
  // Confirmacao leve da reanalise (consome 1 uso de IA).
  const [confirmReanalyze, setConfirmReanalyze] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const areaTouched = useRef(false);
  // Ancora do topo do cenario (container do header integrado): alvo da
  // rolagem nas trocas de estado.
  const stageTopRef = useRef<HTMLDivElement>(null);

  function replaceAnalysisId(id: string | null): void {
    setAnalysisId(id);
  }

  useEffect(() => {
    if (areaTouched.current) return;
    const fromProfile = profile?.area_interesse;
    if (fromProfile && isAreaSlug(fromProfile)) {
      setForm((prev) => ({ ...prev, area: fromProfile }));
    }
  }, [profile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        encodeLinkedinStoredState({
          form,
          result,
          analysisId,
          textoHash: resultTextoHash,
          headlineManual,
        }),
      );
    } catch {
      // storage cheio ou indisponivel: segue so em memoria.
    }
  }, [form, result, analysisId, resultTextoHash, headlineManual]);

  // Versao ausente = linha gravada antes do carimbo, tratada como 1.
  /**
   * Aplicador UNICO do veredito do funil. Os dois caminhos que mostram delta
   * (analise nova e abrir do historico) passam por aqui, e nenhum deles chama
   * `setScoreDelta` direto: `deltaFunil.test.ts` enumera os call sites da fonte
   * e falha se algum voltar a decidir por conta propria.
   */
  function aplicarDelta(v: VeredictoDelta): void {
    setReguaMudou(v.reguaMudou);
    setScoreDelta(v.delta);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    if (key === "area") areaTouched.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Parse estruturado do texto atual (a MESMA funcao que o server roda), pra
  // alimentar o modo revisao e o checklist. Puro e barato.
  const parsed = useMemo(
    () =>
      form.profileText.trim().length > 0
        ? parseLinkedinText(form.profileText)
        : null,
    [form.profileText],
  );

  const headlineProfileTextRef = useRef(form.profileText);
  useEffect(() => {
    if (headlineProfileTextRef.current === form.profileText) return;
    headlineProfileTextRef.current = form.profileText;
    setHeadlineManual(null);
  }, [form.profileText]);

  const manualAtiva = headlineManualAtiva(headlineManual);
  const headlineManualNormalizada = normalizarHeadlineManual(headlineManual);
  const headlineExibida = manualAtiva
    ? (headlineManual ?? "")
    : (parsed?.headline ?? "");
  const headlineEfetiva = headlineFinalDe(
    parsed?.headline ?? null,
    headlineManual,
  );
  const headlineFoiEditada =
    manualAtiva &&
    headlineManualNormalizada !== (parsed?.headline ?? "").trim();

  /**
   * A headline lida tem assinatura de corte? Decide o terceiro estado do chip.
   *
   * Derivado, nao estado: o texto e a unica fonte, entao guardar isto em
   * `useState` criaria uma segunda verdade que precisaria ser sincronizada. E o
   * Header/Footer desta base ja ensinou o custo disso.
   */
  const headlineCortada =
    parsed?.headlineRegion?.status === "ambiguous" ||
    headlineParecCortada(
      headlineEfetiva,
      headlineFoiEditada ? null : parsed?.headlineContexto,
    );

  const [formTextoHash, setFormTextoHash] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setFormTextoHash(null);
    if (form.profileText.trim().length === 0) return () => undefined;
    void hashLinkedinTextNoCliente(form.profileText).then((hash) => {
      if (active) setFormTextoHash(hash);
    });
    return () => {
      active = false;
    };
  }, [form.profileText]);

  /**
   * O aviso apareceu ALGUMA vez nesta sessao de formulario?
   *
   * `useRef` e nao `useState`: e so telemetria, ninguem renderiza a partir
   * disto, e um `setState` aqui causaria render extra a cada tecla. Vive na
   * pagina, que nao remonta entre o passo de revisao e o envio (diferente do
   * Header/Footer, que remontam a cada navegacao).
   */
  const avisoVistoRef = useRef(false);
  useEffect(() => {
    // Em efeito, nao no corpo do render: mutar ref durante o render e o padrao
    // que quebra em render concorrente, e aqui nao ha ganho nenhum em fazer
    // isso. Idempotente de proposito, so liga, nunca desliga: a pergunta e "o
    // aviso apareceu alguma vez", nao "esta aparecendo agora".
    if (headlineCortada) avisoVistoRef.current = true;
  }, [headlineCortada]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setPdfError("");
    setPdfStatus("");
    setExtracting(true);
    try {
      const text = await extractLinkedinPdf(file);
      const detected = parseLinkedinText(text);
      if (!detected.usable) {
        setPdfError(ENTRY_COPY.parseFail);
        return;
      }
      const { aceitas: competenciasAceitas, descartadas: competenciasFora } =
        competenciasDoPdf(
          detected.skillsPdf,
          detected.skillsPdfConfiaveis !== false,
        );
      const competenciasPedemRevisao =
        detected.skillsPdf.length > 0 && detected.skillsPdfConfiaveis === false;
      if (competenciasFora.length > 0) {
        // Só metadados: os valores podem ser nome, headline ou localização e
        // não devem sair do formulário para o console.
        console.warn("[linkedin] competencias descartadas do prefill:", {
          quantidade: competenciasFora.length,
          origemConfiavel: detected.skillsPdfConfiaveis !== false,
        });
      }
      setForm((prev) => ({
        ...prev,
        profileText: text,
        // Prefill das skills a partir do PDF SO quando o campo esta vazio: o
        // export traz apenas as principais competencias e a pessoa complementa.
        //
        // Passa por `competenciasDoPdf` porque `skillsPdf` as vezes carrega o
        // BLOCO DE IDENTIDADE (nome, cidade, estado, pais) junto, e este e o
        // unico ponto do fluxo em que o produto ESCREVE dado num campo que a
        // pessoa submete, e que depois vai para o prompt da OpenAI. A guarda
        // mora aqui, na entrada do formulario, e nao no parser: cobre a causa
        // conhecida (corte da secao lateral passando do fim) e a competencia
        // quebrada de linha, com o mesmo teto e sem esperar conserto de parser.
        skills:
          prev.skills.trim() === "" && competenciasAceitas.length > 0
            ? competenciasAceitas.join(", ")
            : prev.skills,
      }));
      setPdfStatus(
        `PDF lido (${text.length.toLocaleString("pt-BR")} caracteres).${
          competenciasPedemRevisao
            ? " Confirme as competências manualmente: a fronteira da seção não ficou clara."
            : ""
        }`,
      );
      setEntrySource("pdf");
      setEntryPath("review");
      // UMA captura por chegada de arquivo. NAO fica no `useMemo` de `parsed`
      // (que recomputa por tecla) nem numa transicao de estado (que roda de
      // novo em re-render): `handleFile` roda uma vez por PDF escolhido.
      posthog.capture(EVENTO_REVISAO, payloadRevisao(text, "pdf"));
    } catch (err) {
      if (err instanceof PdfExtractError) {
        setPdfError(err.message);
      } else {
        setPdfError(ENTRY_COPY.parseFail);
      }
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onDropPdf(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  // Rolagem ao topo do cenario nas trocas de estado (analisar, resultado,
  // historico): ancora no container do header, que tem scroll-mt pra
  // compensar o header fixo do site; smooth vira auto com reduce.
  function scrollToStageTop() {
    stageTopRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }

  async function runAnalysis() {
    if (loading) return;
    // Destructuring narra o tipo: depois do guard, os 5 sinais sao os tipos
    // validos do request schema (que segue intacto, sem aceitar vazio).
    const { foto, banner, openToWork, conexoes, atividade } = form;
    if (
      form.profileText.trim().length < 200 ||
      !foto ||
      !banner ||
      !openToWork ||
      !conexoes ||
      !atividade
    ) {
      setError("INVALID_REQUEST");
      return;
    }
    setLoading(true);
    setError("");
    setConfirmReanalyze(false);
    // Depois do guard e antes da chamada: so conta submit que de fato vai
    // acontecer. Aqui o texto e o final, entao `parsed?.headline` ja e a
    // headline que sera analisada.
    posthog.capture(
      EVENTO_ENVIO,
      payloadEnvio(avisoVistoRef.current, headlineEfetiva),
    );
    // A pessoa dispara o submit no fim do form: sobe pro scan card no topo.
    scrollToStageTop();

    try {
      const request: LinkedinAnalyzeRequest = {
        profileText: form.profileText.trim(),
        area: form.area,
        level: form.level,
        mercado: form.mercado,
        skills: form.skills,
        foto,
        banner,
        openToWork,
        conexoes,
        atividade,
        objetivo: form.objetivo.trim() || undefined,
        entryPath: entrySource,
        headlineManual: headlineFoiEditada
          ? (headlineManualNormalizada ?? undefined)
          : undefined,
      };
      const {
        data,
        analysisId: newAnalysisId,
        textoHash,
      } = await analyzeLinkedin(request);
      setResult(data);
      replaceAnalysisId(newAnalysisId);
      setResultTextoHash(textoHash);
      const atualComparavel = montarAnaliseComparavel(
        request,
        {
          headline: data.deterministic.headline,
          deterministicVersion: data.deterministicVersion,
          qualitativeVersion: data.qualitativeVersion,
        },
        textoHash,
      );
      const anterior = analiseAnteriorComparavel(
        analysesRef.current,
        atualComparavel,
      );
      // FUNIL UNICO do delta: todas as supressoes moram em decidirDelta.
      aplicarDelta(
        decidirDelta({
          notaAnterior: anterior?.score ?? null,
          versaoAnterior: anterior?.deterministicVersion,
          checksAnteriores: anterior?.checks,
          incompletaAnterior: anterior?.notaIncompleta,
          notaAtual: data.deterministic.score,
          versaoAtual: data.deterministicVersion,
          checksAtuais: data.deterministic.checks,
          incompletaAtual: data.deterministic.notaIncompleta,
        }),
      );
      // Resultado chegou: de volta ao topo (a pessoa pode ter rolado
      // durante o loading).
      scrollToStageTop();
      // Refresh do historico FORA do try da analise: e acessorio e ja custou
      // uma chamada de IA. Se ele falhar dentro do try, o catch liga o error e
      // o estado de resultado some (showResult exige error vazio), trocando um
      // resultado pago por uma tela de erro. Falha aqui so deixa a lista
      // desatualizada ate a proxima carga.
      void refreshLinkedinHistory({ showLoading: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ANALYSIS_FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function openHistory(id: string) {
    if (openingId) return;
    setOpeningId(id);
    setHistoryOpenError("");
    try {
      const record = await getLinkedinAnalysis(id);
      if (!record) {
        setHistoryOpenError(
          "Não conseguimos abrir esta análise agora. Tente novamente.",
        );
        return;
      }
      {
        setResult(record.result);
        setResultTextoHash(record.textoHash ?? null);
        // O id da linha do historico chaveia o checklist salvo da analise.
        replaceAnalysisId(record.id);
        setError("");
        setConfirmReanalyze(false);
        // Procura depois da linha aberta porque a lista está em ordem
        // decrescente, mas só aceita uma análise com o mesmo SHA-256.
        const latestAnalyses = analysesRef.current;
        const idx = latestAnalyses.findIndex((item) => item.id === id);
        // FUNIL UNICO do delta: todas as supressoes moram em decidirDelta.
        const currentDeterministic = record.result.deterministic;
        const anterior = analiseAnteriorComparavel(
          latestAnalyses,
          record,
          idx >= 0 ? idx + 1 : latestAnalyses.length,
        );
        aplicarDelta(
          decidirDelta({
            notaAnterior: anterior?.score ?? null,
            versaoAnterior: anterior?.deterministicVersion,
            checksAnteriores: anterior?.checks,
            incompletaAnterior: anterior?.notaIncompleta,
            notaAtual: currentDeterministic.score,
            versaoAtual: record.result.deterministicVersion,
            checksAtuais: currentDeterministic.checks,
            incompletaAtual: currentDeterministic.notaIncompleta,
          }),
        );
        scrollToStageTop();
      }
    } catch {
      setHistoryOpenError(
        "Não conseguimos abrir esta análise agora. Tente novamente.",
      );
    } finally {
      setOpeningId(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAnalysis();
  }

  // Saida do estado de resultado: reset SO de UI. Mantem form e entryPath (a
  // pessoa volta pra revisao com os dados preservados); o resultado
  // persistido some pelo proprio effect de persistencia (que passa a gravar
  // result e analysisId nulos). O applied zera pelo effect de carga quando o
  // analysisId vira null.
  function startNewAnalysis() {
    setResult(null);
    replaceAnalysisId(null);
    setResultTextoHash(null);
    setError("");
    setScoreDelta(null);
    setReguaMudou(false);
    setConfirmReanalyze(false);
    setHistoryOpenError("");
  }

  const profileChars = form.profileText.trim().length;
  const signalsAnswered =
    form.foto !== "" &&
    form.banner !== "" &&
    form.openToWork !== "" &&
    form.conexoes !== "" &&
    form.atividade !== "";
  const canSubmit = profileChars >= 200 && signalsAnswered && !loading;

  // Lista calculada em codigo (deterministic). Ausente nas analises gravadas
  // antes da v3, entao leitura guardada.
  const deterministic = result?.deterministic ?? null;
  const deterministicView = useMemo(
    () =>
      result
        ? readDeterministic(result.deterministic, result.deterministicVersion)
        : null,
    [result],
  );
  const deterministicCamposAusentes = deterministicView?.camposAusentes ?? [];
  const deterministicKeywordsCampos = deterministicView?.keywordsCampos ?? [];

  const skillsAdicionarAgora = deterministic?.skillsParaAdicionarAgora ?? [];

  // Leitura VERSIONADA do qualitative persistido: nunca acessar
  // result.qualitative.x direto (o jsonb pode ter sido gravado por outra versao
  // do codigo). Degrada para render parcial em vez de derrubar a pagina.
  const qual = useMemo(
    () =>
      result
        ? readQualitative(result.qualitative, result.qualitativeVersion)
        : null,
    [result],
  );

  const improvementsTotal = qual?.melhorias.length ?? 0;
  const {
    applied,
    progressError,
    progressAvailable,
    initialLoaded: progressInitialLoaded,
    toggle: toggleImprovement,
  } = useLinkedinImprovementProgress({
    analysisId,
    total: improvementsTotal,
    // O objeto muda a cada abertura, inclusive ao reabrir a mesma analysisId.
    sessionIdentity: result,
  });

  // Checklist interativo: exige analise persistida E a feature disponivel no
  // banco. O GET inicial precisa terminar antes de liberar os checkboxes.
  const checklistEnabled =
    Boolean(analysisId) &&
    progressAvailable &&
    progressInitialLoaded &&
    !progressError;

  // Placar do checklist: so conta indices dentro do range das melhorias da
  // analise exibida. Sem analysisId (persistencia falhou ou storage v2), com a
  // feature indisponivel, ou com erro de progresso, o placar e null e o chip
  // NAO renderiza: erro nunca vira um "0 de N" falso.
  const appliedCount = Array.from(applied).filter(
    (index) =>
      Number.isInteger(index) && index >= 0 && index < improvementsTotal,
  ).length;
  const improvementsScore =
    checklistEnabled && !progressError && improvementsTotal > 0
      ? { done: appliedCount, total: improvementsTotal }
      : null;
  const allApplied =
    !reguaMudou &&
    deterministic?.notaIncompleta !== true &&
    improvementsScore !== null &&
    improvementsScore.done === improvementsScore.total;

  const reduce = useReducedMotion() ?? false;
  // Estado de ENTRADA: sem analise em andamento, sem erro e sem resultado. E
  // onde vivem o cenario, a explicacao (timeline + vitrine), as pills e o
  // historico colapsavel.
  const showEntry = !loading && !error && !result;
  // Estado de RESULTADO: e o unico em que o palco de intake NAO renderiza (a
  // saida e o link Nova analise do header); erro mantem o palco pra pessoa
  // corrigir o texto e tentar de novo.
  const showResult = !loading && !error && result !== null;

  // Checks da analise exibida agrupados por categoria: cada secao do
  // prontuario recebe SO os seus (checks nao aplicaveis ao mercado nem vem
  // no array, entao a lista ja chega filtrada do server).
  const checksByCategory = (category: LinkedinCheckCategory) =>
    deterministic?.checks.filter((check) => check.category === category) ?? [];

  // Fonte honesta da camada "seu atual" do prontuario: o result NAO carrega
  // o texto do Sobre nem os titulos das experiencias; so o parsed do form
  // tem. Ao abrir uma analise do historico o form pode conter OUTRO texto,
  // entao o parsed so vale quando o SHA-256 do texto bate com a analise
  // exibida. Sem match, os
  // cards degradam para as contagens do próprio deterministic; nunca texto de
  // outra análise. Linhas antigas sem hash não recebem fallback heurístico.
  const textoAtualEhDaAnalise = mesmoTextoHash(formTextoHash, resultTextoHash);
  const sobreAtual =
    deterministic !== null &&
    textoAtualEhDaAnalise &&
    parsed?.sobre &&
    parsed.sobre.trim().length === deterministic.sobreTamanho
      ? parsed.sobre
      : null;
  const experienciasAtual =
    deterministic !== null &&
    textoAtualEhDaAnalise &&
    parsed !== null &&
    parsed.experiencias.length > 0 &&
    parsed.experiencias.length === deterministic.experienciasContagem
      ? parsed.experiencias
      : null;

  // Checklist de prontidao: o minimo REAL do backend (200 caracteres, o
  // schema da rota) bloqueia; a ausencia de Sobre e experiencias e aviso (o
  // server devolve 422 quando o texto nao tem nada aproveitavel).
  const checklistItems: string[] = [];
  if (profileChars < 200) {
    checklistItems.push(ENTRY_COPY.checklistChars(profileChars));
  }
  if (!signalsAnswered) {
    checklistItems.push(ENTRY_COPY.checklistSinais);
  }
  if (parsed !== null && !parsed.sobre && parsed.experiencias.length === 0) {
    checklistItems.push(ENTRY_COPY.checklistSections);
  }

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Analisador de LinkedIn com IA"
        description="Veja como recrutadores encontram (ou não) seu perfil no LinkedIn e receba textos prontos para colar: headline, seção Sobre, experiências e mensagem."
        url="/linkedin/analisar"
      />
      {/* Cenario da pagina inteira no molde do Analisador de GitHub: sem
          PageHero, o cabecalho vive DENTRO do cenario, que nasce no topo. O
          backdrop vivo (gradiente + doodles) so existe no estado de entrada. */}
      <section className="relative overflow-hidden bg-[#faf8f4] pb-16 pt-8 [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        {showEntry ? <LinkedinBackdrop reduce={reduce} /> : null}
        {/* Cenario do resultado tingido pela faixa da nota; o estado de erro
            fica sem backdrop (so o pontilhado cream). */}
        {!loading && !error && result && deterministic && qual ? (
          <LinkedinResultBackdrop faixa={deterministic.faixa} reduce={reduce} />
        ) : null}
        <div className="container relative z-10">
          {/* Cabecalho integrado, presente nos 3 estados (entrada, loading,
              resultado). O slot do topo esquerdo e o lugar universal de
              "voltar": no resultado vira o link Nova analise; na entrada e no
              scan fica vazio. */}
          <motion.div
            ref={stageTopRef}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-10 scroll-mt-24"
          >
            {showResult ? (
              <button
                type="button"
                onClick={startNewAnalysis}
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-bold",
                  ac.link,
                  ac.linkHover,
                )}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {/* TODO(Ana): validar o rotulo do link de voltar. */}
                Nova análise
              </button>
            ) : null}
            <p className={cn(showResult ? "mt-5" : undefined)}>
              {/* TODO(Ana): validar o eyebrow do cabecalho. */}
              <span className="inline-flex rounded-full border-2 border-slate-900 bg-sky-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
                Análise Pro
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
                <Linkedin className="h-8 w-8" />
              </span>
              <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 md:text-[clamp(2rem,5vw,2.6rem)]">
                Analisador de LinkedIn
              </h1>
            </div>
            <p className="mt-3 max-w-2xl text-base font-medium text-slate-600">
              Veja como recrutadores encontram (ou não encontram) seu perfil e
              receba os textos prontos para colar: headline, Sobre, experiências
              e mensagem.
            </p>
          </motion.div>

          {/* A introdução espera o histórico assentar para não piscar. Erro é
              fail-open para esta faixa, mas continua visível como erro próprio
              no bloco de histórico abaixo. */}
          {showEntry &&
          (!isPro || (historyStatus !== "loading" && analyses.length === 0)) ? (
            <div className="mb-10">
              <HowItWorksTimeline />
            </div>
          ) : null}
          {!isPro ? (
            <ProGate
              feature="linkedin_analyzer"
              description="A análise lê seu perfil do LinkedIn, considera as evidências da sua trajetória e entrega textos prontos para diferentes momentos de carreira."
            />
          ) : (
            <div className="space-y-8">
              {/* Ordem narrativa da entrada: explicacao (timeline + vitrine)
                  na coluna esquerda, palco de intake na direita; empilham em
                  coluna unica no mobile. Em erro o grid some e o palco segue
                  sozinho no topo pra pessoa corrigir; em LOADING o palco NAO
                  renderiza (so o scan card centralizado abaixo) e no
                  RESULTADO tambem nao (o form state vive na pagina, entao a
                  reanalise le o estado normalmente e Nova analise traz o
                  palco de volta com os dados preservados). */}
              {!showResult && !loading ? (
                <div
                  className={
                    showEntry
                      ? "grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start"
                      : undefined
                  }
                >
                  {showEntry ? <ResultShowcase /> : null}
                  {/* Palco de intake: peca da familia da vitrine (rotacao leve
                    + selo de proposito), contendo TODO o fluxo de entrada
                    existente (PDF -> revisao -> analise, fallback manual). */}
                  <div
                    className={cn(
                      "card-brutal area-rise relative -rotate-[0.4deg] rounded-2xl border-slate-950 bg-white p-6 sm:p-8",
                      ac.liftShadow,
                    )}
                  >
                    {/* Selo de proposito SO na entrada: em loading, erro e
                      resultado o palco fica sem o convite. */}
                    {showEntry ? (
                      // TODO(Ana): revisar o selo do palco.
                      <span className="absolute -top-3.5 left-6 z-10 inline-flex rotate-1 items-center gap-1.5 rounded-full border-2 border-slate-950 bg-[#FFB800] px-3 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]">
                        <Sparkles className="h-3 w-3" aria-hidden />
                        Comece aqui
                      </span>
                    ) : null}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(event) =>
                          void handleFile(event.target.files?.[0])
                        }
                      />

                      {entryPath === "pdf" ? (
                        <div className="space-y-5">
                          <div>
                            <h2 className="font-display text-2xl font-black text-slate-950">
                              {ENTRY_COPY.pdfTitle}
                            </h2>
                            <p className="mt-1 text-sm font-medium text-slate-600">
                              {ENTRY_COPY.pdfSubtitle}
                            </p>
                          </div>

                          <ol className="grid gap-3 sm:grid-cols-2">
                            {ENTRY_COPY.steps.map((step, i) => (
                              <li
                                key={step}
                                className="flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-3"
                              >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-amber-300 font-display text-base font-black text-slate-950 shadow-[2px_2px_0_#0f172a]">
                                  {i + 1}
                                </span>
                                <span className="text-sm font-medium text-slate-700">
                                  {step}
                                </span>
                              </li>
                            ))}
                          </ol>

                          <div
                            role="button"
                            tabIndex={0}
                            aria-label={ENTRY_COPY.dropIdle}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                fileInputRef.current?.click();
                              }
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDropPdf}
                            className={cn(
                              "flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-slate-900 p-8 text-center transition-colors",
                              dragOver
                                ? "bg-sky-100"
                                : "bg-sky-50 hover:bg-sky-100",
                            )}
                          >
                            {extracting ? (
                              <Spinner className="h-8 w-8 text-sky-700" />
                            ) : (
                              <FileUp className="h-8 w-8 text-sky-700" />
                            )}
                            <p className="font-display text-base font-black text-slate-950">
                              {extracting
                                ? ENTRY_COPY.dropReading
                                : ENTRY_COPY.dropIdle}
                            </p>
                            <p className="text-xs font-bold text-slate-500">
                              {ENTRY_COPY.dropHint}
                            </p>
                          </div>

                          <div className="flex items-start gap-2 rounded-xl border-2 border-sky-200 bg-sky-50 p-3 text-xs font-medium text-sky-900">
                            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                            <span>{ENTRY_COPY.privacy}</span>
                          </div>

                          {pdfError ? (
                            <p className="rounded-xl border-2 border-slate-950 bg-rose-100 px-3 py-2 text-sm font-bold text-rose-800">
                              {pdfError}
                            </p>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => {
                              setEntryPath("manual");
                              setEntrySource("manual");
                            }}
                            className="text-sm font-bold text-slate-500 underline underline-offset-2 hover:text-slate-800"
                          >
                            {ENTRY_COPY.manualLink}
                          </button>
                        </div>
                      ) : null}

                      {entryPath === "manual" ? (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h2 className="font-display text-2xl font-black text-slate-950">
                                {ENTRY_COPY.manualTitle}
                              </h2>
                              <p className="mt-1 text-sm font-medium text-slate-600">
                                {ENTRY_COPY.manualSubtitle}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEntryPath("pdf");
                                setEntrySource("pdf");
                              }}
                              className="text-sm font-bold text-sky-700 underline underline-offset-2 hover:text-sky-900"
                            >
                              {ENTRY_COPY.backToPdf}
                            </button>
                          </div>

                          <Field
                            label="Texto do seu perfil"
                            hint="Headline, Sobre, experiências e formação. Mínimo de 200 caracteres."
                          >
                            <textarea
                              value={form.profileText}
                              onChange={(event) =>
                                update("profileText", event.target.value)
                              }
                              onPaste={(event) => {
                                // Le do clipboard, e nao do estado: no `onPaste`
                                // o texto colado ainda nao entrou em
                                // `form.profileText`, e esperar o `onChange`
                                // devolveria o caminho por tecla.
                                const colado =
                                  event.clipboardData.getData("text");
                                if (colado.trim().length > 0) {
                                  posthog.capture(
                                    EVENTO_REVISAO,
                                    payloadRevisao(colado, "paste"),
                                  );
                                }
                              }}
                              placeholder="Cole aqui o texto do seu perfil do LinkedIn (headline, Sobre, experiências...)."
                              className={cn(inputClass, "min-h-36")}
                            />
                          </Field>

                          <ContextFields form={form} update={update} />

                          <Field
                            label="Cole suas competências (skills) do LinkedIn"
                            hint="Separadas por vírgula. Copie da seção Competências do seu perfil."
                          >
                            <textarea
                              value={form.skills}
                              onChange={(event) =>
                                update("skills", event.target.value)
                              }
                              placeholder="Ex: React, JavaScript, TypeScript, Git, HTML, CSS, Node.js..."
                              className={cn(inputClass, "min-h-20")}
                            />
                          </Field>

                          <ProfileQuestions form={form} update={update} />
                        </>
                      ) : null}

                      {entryPath === "review" ? (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h2 className="font-display text-2xl font-black text-slate-950">
                                {ENTRY_COPY.reviewTitle}
                              </h2>
                              <p className="mt-1 text-sm font-medium text-slate-600">
                                {ENTRY_COPY.reviewSubtitle}
                              </p>
                              {pdfStatus ? (
                                <p className="mt-1 text-xs font-bold text-emerald-700">
                                  {pdfStatus}
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEntryPath("pdf");
                                setEntrySource("pdf");
                              }}
                              className="text-sm font-bold text-sky-700 underline underline-offset-2 hover:text-sky-900"
                            >
                              {ENTRY_COPY.swapPdf}
                            </button>
                          </div>

                          {/* Os chips dizem O QUE FOI LIDO e pedem conferencia.
                              NAO afirmam que a leitura esta certa: verde de
                              "detectada" era um sinal tranquilizador que uma
                              headline cortada ao meio produzia igualzinho, e foi
                              exatamente por isso que o truncamento passou 13
                              rodadas de auditoria e so apareceu no uso real.
                              Presenca nao e correcao, e a cor nao pode dizer que
                              e. Por isso: ambar quando falta (acao clara) e
                              neutro quando existe (a pessoa e quem confere, logo
                              abaixo, com o texto aberto). */}
                          <div className="flex flex-wrap gap-2">
                            {/* TRES estados, nao dois. O terceiro existe porque
                                "existe" e "esta inteira" sao perguntas
                                diferentes, e o neutro respondia a primeira
                                enquanto a pessoa lia a segunda. Medido: 27 das
                                156 headlines persistidas tem assinatura
                                inequivoca de corte, e o chip neutro dizia
                                "confira abaixo" em todas elas. */}
                            <span
                              className={cn(
                                "rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black text-slate-900",
                                !headlineEfetiva
                                  ? "bg-amber-100"
                                  : headlineCortada
                                    ? "bg-[#FFB800]"
                                    : "bg-white",
                              )}
                            >
                              Headline:{" "}
                              {!headlineEfetiva
                                ? ENTRY_COPY.reviewNotFound
                                : headlineFoiEditada
                                  ? "corrigida por você"
                                  : headlineCortada
                                    ? "parece cortada"
                                    : "confira abaixo"}
                            </span>
                            <span
                              className={cn(
                                "rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black text-slate-900",
                                parsed?.sobre ? "bg-white" : "bg-amber-100",
                              )}
                            >
                              Sobre:{" "}
                              {parsed?.sobre
                                ? `${parsed.sobre.length} caracteres lidos`
                                : ENTRY_COPY.reviewNotFound}
                            </span>
                            <span
                              className={cn(
                                "rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black text-slate-900",
                                parsed && parsed.experiencias.length > 0
                                  ? "bg-white"
                                  : "bg-amber-100",
                              )}
                            >
                              Experiências: {parsed?.experiencias.length ?? 0}{" "}
                              lida
                              {(parsed?.experiencias.length ?? 0) === 1
                                ? ""
                                : "s"}
                            </span>
                            <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-900">
                              Competências no PDF:{" "}
                              {parsed?.skillsPdf.length ?? 0} lidas
                            </span>
                          </div>

                          <div className="space-y-2">
                            {/* ABERTO por padrao, e o unico do grupo que e. A
                                headline e o campo de maior peso da regua (35 dos
                                pontos, mais as duas coberturas) e o que mais
                                sofre com quebra de linha do export. Escondido
                                atras de um clique, ninguem conferia. */}
                            <details
                              open
                              className="rounded-xl border-2 border-slate-900 bg-white p-3"
                            >
                              <summary className="cursor-pointer text-sm font-black text-slate-800">
                                Headline detectada: confira e corrija se
                                precisar
                              </summary>
                              {!parsed?.headline ? (
                                <p className="mt-2 rounded-lg bg-amber-100 p-2 text-xs font-bold text-slate-900">
                                  Não detectamos uma headline. Você pode
                                  preenchê-la isoladamente abaixo.
                                </p>
                              ) : null}
                              {headlineCortada ? (
                                <p
                                  role="status"
                                  className="mt-2 rounded-lg bg-[#FFB800]/20 p-2 text-xs font-bold text-slate-900"
                                >
                                  A headline que lemos pode estar cortada.
                                  Corrija o campo abaixo antes de analisar.
                                </p>
                              ) : null}
                              <label
                                htmlFor="linkedin-headline-manual"
                                className="mt-3 block text-xs font-black text-slate-700"
                              >
                                Headline usada na análise
                              </label>
                              <textarea
                                id="linkedin-headline-manual"
                                value={headlineExibida}
                                onChange={(event) =>
                                  setHeadlineManual(
                                    event.target.value === ""
                                      ? null
                                      : event.target.value,
                                  )
                                }
                                maxLength={HEADLINE_MANUAL_MAX}
                                rows={2}
                                aria-describedby="linkedin-headline-help linkedin-headline-count"
                                className="mt-1 w-full resize-y rounded-lg border-2 border-slate-900 bg-white p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                              />
                              <div className="mt-1 flex items-start justify-between gap-3 text-xs">
                                <p
                                  id="linkedin-headline-help"
                                  className="font-medium text-slate-500"
                                >
                                  A correção muda só a headline analisada. O
                                  texto bruto extraído do PDF permanece intacto.
                                </p>
                                <span
                                  id="linkedin-headline-count"
                                  className="shrink-0 font-bold tabular-nums text-slate-500"
                                >
                                  {headlineExibida.length} /{" "}
                                  {HEADLINE_MANUAL_MAX}
                                </span>
                              </div>
                            </details>
                            {parsed?.sobre ? (
                              <details className="rounded-xl border-2 border-slate-200 bg-white p-3">
                                <summary className="cursor-pointer text-sm font-black text-slate-800">
                                  Sobre ({parsed.sobre.length} caracteres)
                                </summary>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                  {parsed.sobre}
                                </p>
                              </details>
                            ) : null}
                            {parsed && parsed.experiencias.length > 0 ? (
                              <details className="rounded-xl border-2 border-slate-200 bg-white p-3">
                                <summary className="cursor-pointer text-sm font-black text-slate-800">
                                  Experiências ({parsed.experiencias.length}{" "}
                                  lida
                                  {parsed.experiencias.length === 1 ? "" : "s"}
                                  ): confira se falta alguma
                                </summary>
                                <ul className="mt-2 space-y-2">
                                  {parsed.experiencias.map((exp, i) => (
                                    <li
                                      key={i}
                                      className="text-sm text-slate-700"
                                    >
                                      <span className="font-bold text-slate-900">
                                        {exp.titulo || "(sem título)"}
                                      </span>
                                      {exp.empresa ? (
                                        <span className="text-slate-500">
                                          {" "}
                                          em {exp.empresa}
                                        </span>
                                      ) : null}
                                      {exp.descricao ? (
                                        <span>
                                          {" "}
                                          · {exp.descricao.slice(0, 160)}
                                          {exp.descricao.length > 160
                                            ? "..."
                                            : ""}
                                        </span>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            ) : null}
                            <details className="rounded-xl border-2 border-slate-200 bg-white p-3">
                              <summary className="cursor-pointer text-sm font-black text-slate-800">
                                {ENTRY_COPY.reviewFullText}
                              </summary>
                              <textarea
                                value={form.profileText}
                                onChange={(event) =>
                                  update("profileText", event.target.value)
                                }
                                className={cn(inputClass, "mt-2 min-h-40")}
                              />
                            </details>
                          </div>

                          <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
                            <p className="text-sm font-black text-slate-900">
                              {ENTRY_COPY.skillsGapTitle}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-600">
                              {ENTRY_COPY.skillsGapHint}
                            </p>
                            <textarea
                              value={form.skills}
                              onChange={(event) =>
                                update("skills", event.target.value)
                              }
                              placeholder="Ex: React, JavaScript, TypeScript, Git, HTML, CSS, Node.js..."
                              className={cn(inputClass, "mt-2 min-h-20")}
                            />
                          </div>

                          <div className="space-y-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
                            <div>
                              <p className="text-sm font-black text-slate-900">
                                {ENTRY_COPY.confirmTitle}
                              </p>
                              <p className="mt-1 text-xs font-medium text-slate-600">
                                {ENTRY_COPY.confirmHint}
                              </p>
                            </div>
                            <ProfileQuestions form={form} update={update} />
                          </div>

                          <ContextFields form={form} update={update} />
                        </>
                      ) : null}

                      {entryPath !== "pdf" &&
                      !loading &&
                      checklistItems.length > 0 ? (
                        <div className="rounded-xl border-2 border-slate-950 bg-amber-50 p-3">
                          <p className="text-sm font-black text-slate-900">
                            {ENTRY_COPY.checklistTitle}
                          </p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs font-medium text-slate-700">
                            {checklistItems.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {entryPath !== "pdf" ? (
                        <div className="flex justify-center">
                          {/* Acento sky da pagina no lugar do violet do
                              variant ai, com a sombra na cor do liftShadow
                              sky (#0284c7) do pageAccentUi. */}
                          <BrutalActionButton
                            variant="ai"
                            type="submit"
                            disabled={!canSubmit}
                            loading={loading}
                            icon={<Sparkles className="h-4 w-4" aria-hidden />}
                            accentClass="bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-300"
                            className="px-6 py-3 shadow-[3px_3px_0_#0284c7] hover:shadow-[4px_4px_0_#0284c7] disabled:hover:shadow-[3px_3px_0_#0284c7]"
                          >
                            {loading
                              ? "Analisando..."
                              : "Analisar meu LinkedIn"}
                          </BrutalActionButton>
                        </div>
                      ) : null}
                    </form>
                  </div>
                </div>
              ) : null}

              {showEntry ? <BenefitPills /> : null}

              {loading ? (
                <LinkedinScanCard
                  area={form.area}
                  level={form.level}
                  reduce={reduce}
                />
              ) : null}

              {!loading && error ? (
                <LinkedinError
                  error={error}
                  onRetry={
                    form.profileText.trim().length >= 200 && signalsAnswered
                      ? () => void runAnalysis()
                      : undefined
                  }
                />
              ) : null}

              {!loading && !error && result && deterministic && qual ? (
                /* Boundary ESTREITO. Sem ele, um erro de render aqui sobe ate o
                   boundary do App e derruba a pagina inteira, header e tudo.
                   Foi o que aconteceu com `skillsSugeridas`: a analise foi
                   cobrada, persistida, e a pessoa levou tela de erro no lugar
                   do resultado. Contido aqui, o resto da pagina fica de pe e
                   sobra uma saida util. */
                <ErrorBoundary
                  escopo="linkedin-resultado"
                  fallback={({ eventId }) => (
                    <ResultadoIndisponivel
                      eventId={eventId}
                      onNovaAnalise={startNewAnalysis}
                    />
                  )}
                >
                  <div
                    className="area-rise space-y-8"
                    style={{ animationDelay: "0.08s" }}
                  >
                    <LinkedinScoreHero
                      response={{ ...result, deterministic }}
                      scoreDelta={scoreDelta}
                      reduce={reduce}
                      improvements={improvementsScore}
                    />

                    {reguaMudou ? (
                      // Copy FECHADA. Requisito: o banner recebe so um booleano e
                      // nao sabe de qual versao a pessoa veio, entao cada frase
                      // tem que ser verdadeira para QUALQUER transicao.
                      //
                      // A versao anterior afirmava "a headline que vinha cortada
                      // ao meio agora e lida inteira". Era especifica da transicao
                      // v4 -> v5 e, medido em 2026-07-31 sobre as analises
                      // persistidas, era FALSA para 39 de 156: a correcao cobre
                      // quebra na virgula com continuacao forte, e as quebras
                      // dominantes (separador orfao, termo composto partido, prosa
                      // cortada) seguem intactas. Prometer conserto que a pessoa
                      // nao recebeu e pior que nao explicar, e era a unica
                      // afirmacao verificavel do banner.
                      //
                      // O paragrafo de julho FICA: ele e datado ("se a sua analise
                      // anterior e de antes de julho"), entao continua verdadeiro
                      // sem depender de qual foi a mudanca mais recente.
                      //
                      // "o que lemos do seu perfil para preencher a analise" cobre
                      // as TRES coisas que ja causaram bump: criterio (v3 -> v4),
                      // leitura do parser (v4 -> v5) e o que e escrito no
                      // formulario a partir do PDF (v5 -> v6, o pre-preenchimento
                      // de competencias). Foi escolhida por cobrir as tres sem
                      // afirmar qual foi a ultima, que e o requisito do booleano.
                      <FeedbackBanner variant="warn">
                        Esta nota não é comparável com a da sua análise
                        anterior, e a comparação recomeça a partir daqui. Entre
                        uma análise e outra, podem ter mudado os critérios da
                        régua ou o que lemos do seu perfil para preencher a
                        análise, e qualquer um dos dois move a nota do mesmo
                        perfil, sem você ter mexido em nada. Se a sua análise
                        anterior é de antes de julho, os critérios também
                        mudaram, quase tudo para deixar a régua mais justa: a
                        cobertura de palavras-chave pedia metade de todas as
                        tecnologias da área, o que em algumas áreas significava
                        mais de trinta, e agora considera quantas existem na sua
                        área de verdade; o nível que você informa passou a
                        contar, então quem está começando não é medido pela
                        régua de quem está há anos na área; e cada experiência
                        passou a ser avaliada por si, então uma sem descrição
                        não é mais compensada por outra bem escrita.
                      </FeedbackBanner>
                    ) : scoreDelta ? (
                      <ScoreDeltaBanner
                        from={scoreDelta.from}
                        to={scoreDelta.to}
                      />
                    ) : null}

                    {/* Spotlight fora das colunas: a ponte nota -> acao. */}
                    <motion.div
                      initial={
                        reduce ? false : { opacity: 0, y: 16, scale: 0.98 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { delay: 0.3, duration: 0.4, ease: "easeOut" }
                      }
                      className="rotate-[0.5deg]"
                    >
                      <NextStepCard proximoPasso={qual.proximoPasso} />
                    </motion.div>

                    {/* Corpo prontuario: coluna unica de leitura vertical (o
                      grid revista 7/5 morreu). Resumo curto da IA, o bloco
                      compacto de fortes/fracos justificando o veredito
                      geral, o loop de melhorias intacto e um card por secao
                      do perfil: veredito derivado dos checks, o atual
                      detectado e o texto pronto pra colar. */}
                    <div className="mx-auto mt-14 max-w-3xl space-y-8">
                      <Reveal>
                        <AiSummary
                          resumo={qual.resumo}
                          accent={ac}
                          onAskAgent={() =>
                            // TODO(Ana): revisar o texto pre-preenchido da ponte.
                            openAgentWidget(
                              "Sobre minha análise de LinkedIn de hoje: ",
                            )
                          }
                        />
                      </Reveal>
                      <Reveal delay={0.05}>
                        <StrengthsWeaknesses
                          pontosFortes={qual.pontosFortes}
                          pontosFracos={qual.pontosFracos}
                          accent={ac}
                        />
                      </Reveal>
                      <Reveal delay={0.05}>
                        <div className="space-y-3">
                          {analysisId &&
                          !progressInitialLoaded &&
                          !progressError ? (
                            <FeedbackBanner variant="warn">
                              Carregando seu progresso salvo…
                            </FeedbackBanner>
                          ) : !checklistEnabled && !progressError ? (
                            <FeedbackBanner variant="warn">
                              {/* TODO(Ana): revisar o aviso de progresso indisponivel. */}
                              O progresso de melhorias está indisponível para
                              esta análise.
                            </FeedbackBanner>
                          ) : null}
                          {progressError ? (
                            <FeedbackBanner variant="error">
                              {progressError}
                            </FeedbackBanner>
                          ) : null}
                          <Improvements
                            melhorias={qual.melhorias}
                            accent={ac}
                            applied={checklistEnabled ? applied : undefined}
                            onToggle={
                              checklistEnabled ? toggleImprovement : undefined
                            }
                          />
                        </div>
                      </Reveal>

                      <Reveal>
                        {/* TODO(Ana): revisar o rotulo do prontuario. */}
                        <SectionLabel ac={ac}>
                          Prontuário do seu perfil
                        </SectionLabel>
                      </Reveal>

                      <Reveal>
                        <SectionReport
                          title="Headline"
                          pasteHint="Cole no campo de headline do seu perfil, no lugar do que está lá. A headline é um campo único: isto SUBSTITUI o texto atual, não soma."
                          icon={
                            <Type className={SECTION_ICON_CLASS} aria-hidden />
                          }
                          checks={checksByCategory("headline")}
                          atual={
                            deterministic.headline ? (
                              <p className="break-words">
                                {deterministic.headline}
                              </p>
                            ) : null
                          }
                          paste={
                            <ul className="space-y-3">
                              {qual.headlines.map((headline, index) => (
                                <li
                                  key={index}
                                  className="flex items-start justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white p-3"
                                >
                                  <p className="min-w-0 text-sm font-medium text-slate-800">
                                    {headline}
                                  </p>
                                  <CopyButton text={headline} />
                                </li>
                              ))}
                            </ul>
                          }
                        >
                          {deterministic.headline === null ? (
                            // TODO(Ana): revisar a nota de headline nao detectada.
                            <p className={EMPTY_NOTE_CLASS}>
                              Não detectamos uma headline no texto analisado.
                              Comece pelas versões prontas abaixo e cole a sua
                              preferida no perfil.
                            </p>
                          ) : null}
                        </SectionReport>
                      </Reveal>

                      <Reveal>
                        <SectionReport
                          title="Sobre"
                          pasteHint="Cole na seção Sobre, no lugar do texto atual. É um campo único, então isto SUBSTITUI o que está lá. Se você tem um trecho que quer manter, junte antes de salvar."
                          icon={
                            <FileText
                              className={SECTION_ICON_CLASS}
                              aria-hidden
                            />
                          }
                          checks={checksByCategory("sobre")}
                          atual={
                            sobreAtual ? (
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {sobreAtual}
                              </p>
                            ) : null
                          }
                          paste={
                            <div>
                              <div className="mb-2 flex justify-end">
                                <CopyButton text={qual.sobreReescrito} />
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                                {qual.sobreReescrito}
                              </p>
                            </div>
                          }
                        >
                          {deterministic.sobreTamanho === 0 ? (
                            // TODO(Ana): revisar a nota de Sobre nao detectado.
                            <p className={EMPTY_NOTE_CLASS}>
                              Não detectamos a seção Sobre no texto analisado. O
                              texto pronto abaixo resolve isso: é só colar no
                              seu perfil.
                            </p>
                          ) : sobreAtual === null ? (
                            // TODO(Ana): revisar a nota do Sobre sem texto salvo.
                            <p className={EMPTY_NOTE_CLASS}>
                              Detectamos um Sobre com{" "}
                              {deterministic.sobreTamanho} caracteres nesta
                              análise (o texto completo não fica salvo no
                              histórico).
                            </p>
                          ) : null}
                        </SectionReport>
                      </Reveal>

                      <Reveal>
                        <SectionReport
                          title="Experiências"
                          pasteHint="Cole na descrição da experiência de mesmo nome, dentro do LinkedIn. Aqui depende de você: estes bullets reescrevem os que já existem, mas se a sua descrição tiver algo que não aparece aqui (um projeto, uma ferramenta, um número), mantenha essa parte e troque o resto."
                          icon={
                            <Briefcase
                              className={SECTION_ICON_CLASS}
                              aria-hidden
                            />
                          }
                          checks={checksByCategory("experiencias")}
                          atual={
                            experienciasAtual ? (
                              <ul className="space-y-2">
                                {experienciasAtual.map((exp, index) => {
                                  // Ruido de paginacao do PDF sai SO daqui (a
                                  // exibicao); o parse que pontuou fica intacto.
                                  // Sem limpeza aqui: o rodape de paginacao ja
                                  // sai na normalizacao, antes do parse.
                                  const titulo = exp.titulo || "(sem título)";
                                  const descricao = exp.descricao;
                                  return (
                                    <li key={index}>
                                      <span className="font-bold text-slate-900">
                                        {titulo}
                                      </span>
                                      {exp.empresa ? (
                                        <span className="text-slate-500">
                                          {" "}
                                          em {exp.empresa}
                                        </span>
                                      ) : null}
                                      {descricao ? (
                                        <span>
                                          {" "}
                                          · {descricao.slice(0, 160)}
                                          {descricao.length > 160 ? "..." : ""}
                                        </span>
                                      ) : null}
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : null
                          }
                          paste={
                            qual.bulletsReescritos.length > 0 ? (
                              <div className="space-y-4">
                                {qual.bulletsReescritos.map((item, index) => (
                                  <div
                                    key={index}
                                    className="rounded-xl border-2 border-slate-200 bg-white p-4"
                                  >
                                    <div className="mb-2 flex items-start justify-between gap-3">
                                      <p className="min-w-0 text-sm font-black text-slate-900">
                                        {item.contexto}
                                      </p>
                                      <CopyButton
                                        text={item.bullets.join("\n")}
                                      />
                                    </div>
                                    <ul className="space-y-2">
                                      {item.bullets.map(
                                        (bullet, bulletIndex) => (
                                          <li
                                            key={bulletIndex}
                                            className="flex items-start gap-2 text-sm text-slate-700"
                                          >
                                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                                            {bullet}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            ) : null
                          }
                        >
                          {deterministic.experienciasContagem === 0 ? (
                            // TODO(Ana): revisar a nota de experiencias nao detectadas.
                            <p className={EMPTY_NOTE_CLASS}>
                              Não detectamos experiências no texto analisado.
                              Comece pela melhoria priorizada correspondente:
                              cadastre um projeto seu como experiência.
                            </p>
                          ) : experienciasAtual === null ? (
                            // TODO(Ana): revisar a nota das experiencias sem titulos salvos.
                            <p className={EMPTY_NOTE_CLASS}>
                              Detectamos {deterministic.experienciasContagem}{" "}
                              experiência
                              {deterministic.experienciasContagem === 1
                                ? ""
                                : "s"}{" "}
                              nesta análise (os títulos não ficam salvos no
                              histórico).
                            </p>
                          ) : null}
                        </SectionReport>
                      </Reveal>

                      <Reveal>
                        <SectionReport
                          title="Competências"
                          pasteHint="Adicione uma a uma em Competências, no seu perfil. Aqui é SOMA, não troca: nada do que você já cadastrou precisa sair."
                          icon={
                            <Award className={SECTION_ICON_CLASS} aria-hidden />
                          }
                          checks={checksByCategory("skills")}
                          atual={
                            deterministic.skillsContagem > 0 ? (
                              <p>
                                {deterministic.skillsContagem} competência
                                {deterministic.skillsContagem === 1
                                  ? " informada"
                                  : "s informadas"}{" "}
                                nesta análise.
                              </p>
                            ) : null
                          }
                          paste={
                            skillsAdicionarAgora.length > 0 ||
                            qual.skillsParaEstudar.length > 0 ? (
                              <div className="space-y-5">
                                {/* Bloco 1: o que a pessoa JA comprova no perfil
                                  e pode cadastrar hoje. Este tem CopyButton. */}
                                {skillsAdicionarAgora.length > 0 ? (
                                  <div>
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="text-sm text-slate-600">
                                        {/* TODO(Ana): revisar a copy do bloco de adicionar agora. */}
                                        <span className="font-black text-slate-900">
                                          Adicione agora:
                                        </span>{" "}
                                        seu perfil já demonstra estas
                                        tecnologias, mas elas não estão nas suas
                                        competências.
                                      </p>
                                      <CopyButton
                                        text={skillsAdicionarAgora.join(", ")}
                                      />
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {skillsAdicionarAgora.map((skill) => (
                                        <span
                                          key={skill}
                                          className="inline-flex rounded-full border-2 border-emerald-500 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {/* Bloco 2: trilha de estudo. SEM CopyButton de
                                  proposito: copiar em massa para as
                                  competencias e exatamente o conselho errado
                                  que este bloco existe para evitar. */}
                                {qual.skillsParaEstudar.length > 0 ? (
                                  <div
                                    className={
                                      skillsAdicionarAgora.length > 0
                                        ? "border-t-2 border-dashed border-slate-200 pt-5"
                                        : undefined
                                    }
                                  >
                                    <p className="text-sm text-slate-600">
                                      {/* TODO(Ana): revisar a copy do bloco de estudo. */}
                                      <span className="font-black text-slate-900">
                                        Para estudar:
                                      </span>{" "}
                                      comuns na sua área e ainda sem sinal no
                                      seu perfil. Não adicione às competências
                                      antes de realmente saber usar.
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {qual.skillsParaEstudar.map((skill) => (
                                        <span
                                          key={skill}
                                          className="inline-flex rounded-full border-2 border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ) : null
                          }
                        >
                          {deterministic.skillsContagem === 0 ? (
                            // TODO(Ana): revisar a nota de competencias nao informadas.
                            <p className={EMPTY_NOTE_CLASS}>
                              Você não informou competências nesta análise.
                              Cadastre as suas na seção Competências do LinkedIn
                              e cole aqui na próxima análise.
                            </p>
                          ) : null}
                        </SectionReport>
                      </Reveal>

                      <Reveal>
                        <SectionReport
                          title="Sinais do perfil (você declarou)"
                          icon={
                            <BadgeCheck
                              className={SECTION_ICON_CLASS}
                              aria-hidden
                            />
                          }
                          checks={checksByCategory("sinais")}
                        >
                          {/* Separacao visual do que a ferramenta LEU do PDF.
                            Estes cinco vem do formulario e a plataforma nao tem
                            como conferir; deixar isso explicito e metade do que
                            substituiu o teto de peso que existiu e foi
                            revertido. A outra metade e a supressao de delta. */}
                          <p className="mt-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-900">
                            Estes cinco pontos vêm das suas respostas no
                            formulário, não do PDF: a gente não consegue
                            conferir foto, banner, Open to Work, conexões nem
                            frequência de posts. Eles contam na nota porque são
                            ações reais e fáceis de fazer, mas valem pelo que
                            você fizer de verdade, não pelo que marcar aqui.
                          </p>
                        </SectionReport>
                      </Reveal>

                      {/* RecruiterFinder dentro do prontuario: agrupado logo
                        abaixo do card da secao (card-brutal aninhado em
                        card-brutal ficaria pesado). */}
                      <Reveal>
                        <div className="space-y-4">
                          <SectionReport
                            title="Como recrutadores te encontram"
                            icon={
                              <Search
                                className={SECTION_ICON_CLASS}
                                aria-hidden
                              />
                            }
                            checks={checksByCategory("encontrabilidade")}
                          />
                          <RecruiterFinder
                            deterministic={deterministic}
                            mercado={result.mercado}
                          />
                        </div>
                      </Reveal>

                      <Reveal>
                        <SectionReport
                          title="Mensagem para recrutador"
                          pasteHint="Esta não vai no seu perfil. Copie e envie no chat do LinkedIn quando responder um recrutador, trocando o que estiver entre colchetes."
                          icon={
                            <MessageSquare
                              className={SECTION_ICON_CLASS}
                              aria-hidden
                            />
                          }
                          checks={[]}
                          paste={
                            <div>
                              <div className="mb-2 flex justify-end">
                                <CopyButton
                                  text={qual.modeloMensagemRecrutador}
                                />
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                                {qual.modeloMensagemRecrutador}
                              </p>
                            </div>
                          }
                        />
                      </Reveal>

                      <Reveal>
                        <NextStepsByArea
                          area={result.area}
                          contexto={
                            // Sem keywordsCampos (analise anterior a Fase 2A) o
                            // componente volta ao modo so-area sozinho: preferir
                            // recomendacao generica a recomendacao com contexto
                            // pela metade.
                            !deterministicCamposAusentes.includes(
                              "keywordsCampos",
                            )
                              ? {
                                  nivelUsuario: result.level,
                                  lacunas: deterministicKeywordsCampos
                                    .filter((k) => !k.comprovado)
                                    .map((k) => k.termo),
                                  tecnologiasDaArea:
                                    deterministicKeywordsCampos.map(
                                      (k) => k.termo,
                                    ),
                                  textoPerfil: deterministic.perfilDedup ?? "",
                                  // Semente estavel: a mesma analise reaberta
                                  // recebe a mesma ordem. Sem id (persistencia
                                  // falhou), cai num derivado do proprio
                                  // resultado, que tambem e estavel.
                                  seed:
                                    analysisId ??
                                    `${result.area}:${deterministic.score}:${deterministic.sobreTamanho}`,
                                }
                              : undefined
                          }
                        />
                      </Reveal>

                      {/* Climax do loop fechando o prontuario, com a
                        confirmacao em 2 passos e o custo explicito de
                        sempre, celebrando no N de N. */}
                      <Reveal>
                        <ReanalyzeCta
                          confirming={confirmReanalyze}
                          onStart={() => setConfirmReanalyze(true)}
                          onConfirm={() => void runAnalysis()}
                          onCancel={() => setConfirmReanalyze(false)}
                          spotlight
                          celebrate={allApplied}
                        />
                      </Reveal>
                    </div>
                  </div>
                </ErrorBoundary>
              ) : null}

              {showEntry && historyStatus === "success_with_data" ? (
                <details
                  className={cn(
                    "area-rise group rounded-2xl border-2 border-slate-950 bg-white shadow-[4px_4px_0_#0f172a] transition-shadow",
                    ac.liftShadow,
                  )}
                  style={{ animationDelay: "0.16s" }}
                >
                  {/* TODO(Ana): revisar o rotulo da faixa colapsavel do historico. */}
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
                    <span className="flex items-center gap-3 font-display text-lg font-black text-slate-950">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-950 bg-sky-300 text-slate-950 shadow-[2px_2px_0_#0f172a]"
                        aria-hidden
                      >
                        <History className="h-5 w-5" />
                      </span>
                      Análises anteriores
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-black",
                          ac.tag,
                        )}
                      >
                        {analyses.length}
                      </span>
                    </span>
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-slate-600 transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="px-5 pb-5">
                    <LinkedinHistory
                      analyses={analyses}
                      onOpen={(id) => void openHistory(id)}
                      loadingId={openingId}
                      status={historyStatus}
                      openError={historyOpenError}
                    />
                  </div>
                </details>
              ) : showEntry &&
                (historyStatus === "loading" || historyStatus === "error") ? (
                <LinkedinHistory
                  analyses={analyses}
                  onOpen={(id) => void openHistory(id)}
                  loadingId={openingId}
                  status={historyStatus}
                  openError={historyOpenError}
                />
              ) : null}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
