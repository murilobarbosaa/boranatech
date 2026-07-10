import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  FileUp,
  History,
  Linkedin,
  Lightbulb,
  Shield,
  Sparkles,
} from "lucide-react";
import Layout from "@/components/Layout";
import ProGate from "@/components/pro/ProGate";
import BrutalActionButton from "@/components/shared/BrutalActionButton";
import ReanalyzeCta from "@/components/shared/ReanalyzeCta";
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
import {
  BenefitPills,
  HowItWorksTimeline,
  ResultShowcase,
} from "@/components/linkedin/LinkedinAnalyzerIntro";
import LinkedinBackdrop from "@/components/linkedin/LinkedinBackdrop";
import LinkedinChecklist from "@/components/linkedin/LinkedinChecklist";
import LinkedinHistory from "@/components/linkedin/LinkedinHistory";
import LinkedinResultBackdrop from "@/components/linkedin/LinkedinResultBackdrop";
import LinkedinScanCard from "@/components/linkedin/LinkedinScanCard";
import LinkedinScoreHero from "@/components/linkedin/LinkedinScoreHero";
import { LinkedinError } from "@/components/linkedin/LinkedinStates";
import ScoreDeltaBanner from "@/components/shared/ScoreDeltaBanner";
import ReadyTexts from "@/components/linkedin/ReadyTexts";
import RecruiterFinder from "@/components/linkedin/RecruiterFinder";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  analyzeLinkedin,
  getLinkedinAnalysis,
  listLinkedinAnalyses,
} from "@/lib/linkedinClient";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { extractLinkedinPdf, PdfExtractError } from "@/lib/pdfExtract";
import { cn } from "@/lib/utils";
import { parseLinkedinText } from "@shared/linkedin/parse";
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
  type LinkedinAnalysisSummary,
  type LinkedinLevel,
  type Mercado,
  type OpenToWork,
  type SimNao,
} from "@shared/linkedin/schema";

const ac = getPageAccentUi("sky");

const STORAGE_KEY = "boranatech:linkedin-analyzer";
// Bump sempre que a forma da resposta mudar. A versao 2 marca o qualitative
// com proximoPasso: result salvo com shape antigo e descartado no restore.
const STORAGE_SHAPE_VERSION = 2;

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

interface FormState {
  profileText: string;
  area: AreaSlug;
  level: LinkedinLevel;
  mercado: Mercado;
  skills: string;
  foto: SimNao;
  banner: SimNao;
  openToWork: OpenToWork;
  conexoes: Conexoes;
  atividade: Atividade;
  objetivo: string;
}

function emptyForm(): FormState {
  return {
    profileText: "",
    area: "frontend",
    level: "junior",
    mercado: "brasil",
    skills: "",
    foto: "nao",
    banner: "nao",
    openToWork: "nao-sei",
    conexoes: "ate-50",
    atividade: "raramente",
    objetivo: "",
  };
}

interface StoredState {
  form: FormState;
  result: LinkedinAnalysisResponse | null;
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
    foto: v.foto === "sim" ? "sim" : "nao",
    banner: v.banner === "sim" ? "sim" : "nao",
    openToWork:
      v.openToWork === "sim" || v.openToWork === "nao"
        ? v.openToWork
        : "nao-sei",
    conexoes: CONEXOES.includes(v.conexoes as Conexoes)
      ? (v.conexoes as Conexoes)
      : base.conexoes,
    atividade: ATIVIDADE.includes(v.atividade as Atividade)
      ? (v.atividade as Atividade)
      : base.atividade,
    objetivo: typeof v.objetivo === "string" ? v.objetivo : "",
  };
}

function loadState(): StoredState {
  if (typeof window === "undefined") return { form: emptyForm(), result: null };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { form: emptyForm(), result: null };
    const parsed = JSON.parse(raw) as {
      form?: unknown;
      result?: unknown;
      version?: unknown;
    };
    const form = coerceForm(parsed.form);
    const result =
      parsed.version === STORAGE_SHAPE_VERSION &&
      parsed.result &&
      typeof parsed.result === "object"
        ? (parsed.result as LinkedinAnalysisResponse)
        : null;
    return { form, result };
  } catch {
    return { form: emptyForm(), result: null };
  }
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

const selectClass =
  "w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-sky-200";
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
        <select
          value={form.area}
          onChange={(event) => update("area", event.target.value as AreaSlug)}
          className={selectClass}
        >
          {AREA_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {AREA_LABELS[slug]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Nível">
        <select
          value={form.level}
          onChange={(event) =>
            update("level", event.target.value as LinkedinLevel)
          }
          className={selectClass}
        >
          {LINKEDIN_LEVELS.map((level) => (
            <option key={level} value={level}>
              {LEVEL_LABEL[level]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Onde você quer trabalhar?">
        <select
          value={form.mercado}
          onChange={(event) => update("mercado", event.target.value as Mercado)}
          className={selectClass}
        >
          {MERCADOS.map((mercado) => (
            <option key={mercado} value={mercado}>
              {MERCADO_LABELS[mercado]}
            </option>
          ))}
        </select>
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
        <select
          value={form.foto}
          onChange={(event) => update("foto", event.target.value as SimNao)}
          className={selectClass}
        >
          {(["sim", "nao"] as SimNao[]).map((value) => (
            <option key={value} value={value}>
              {SIM_NAO_LABEL[value]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tem banner personalizado?">
        <select
          value={form.banner}
          onChange={(event) => update("banner", event.target.value as SimNao)}
          className={selectClass}
        >
          {(["sim", "nao"] as SimNao[]).map((value) => (
            <option key={value} value={value}>
              {SIM_NAO_LABEL[value]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Open to Work para recrutadores?">
        <select
          value={form.openToWork}
          onChange={(event) =>
            update("openToWork", event.target.value as OpenToWork)
          }
          className={selectClass}
        >
          {(["sim", "nao", "nao-sei"] as OpenToWork[]).map((value) => (
            <option key={value} value={value}>
              {OPEN_TO_WORK_LABEL[value]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Quantas conexões?">
        <select
          value={form.conexoes}
          onChange={(event) =>
            update("conexoes", event.target.value as Conexoes)
          }
          className={selectClass}
        >
          {CONEXOES.map((value) => (
            <option key={value} value={value}>
              {CONEXOES_LABEL[value]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Com que frequência posta ou comenta?">
        <select
          value={form.atividade}
          onChange={(event) =>
            update("atividade", event.target.value as Atividade)
          }
          className={selectClass}
        >
          {ATIVIDADE.map((value) => (
            <option key={value} value={value}>
              {ATIVIDADE_LABEL[value]}
            </option>
          ))}
        </select>
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

function SkillsSuggested({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null;
  return (
    <div className="card-brutal rounded-2xl border-slate-950 bg-white p-5">
      <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-black text-slate-950">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        Skills para adicionar
      </h3>
      <p className="mb-3 text-sm text-slate-600">
        Sugestões a partir do que falta no seu perfil. Adicione só o que você
        realmente sabe, mesmo que no básico.
      </p>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex rounded-full border-2 border-amber-400 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LinkedinAnalisar() {
  const { isPro } = useSubscription();
  const { profile } = useAuth();

  const [bootstrap] = useState(loadState);
  const [form, setForm] = useState<FormState>(bootstrap.form);
  const [result, setResult] = useState<LinkedinAnalysisResponse | null>(
    bootstrap.result,
  );
  // PDF e a porta de entrada; quem ja tem texto (sessao restaurada) cai
  // direto no modo revisao.
  const [entryPath, setEntryPath] = useState<EntryPath>(() =>
    bootstrap.form.profileText.trim().length > 0 ? "review" : "pdf",
  );
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfStatus, setPdfStatus] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [analyses, setAnalyses] = useState<LinkedinAnalysisSummary[]>([]);
  const [openingId, setOpeningId] = useState<string | null>(null);
  // Delta de nota vs a analise IMEDIATAMENTE anterior (toda analise de
  // LinkedIn e do mesmo perfil da pessoa, entao nao ha alvo a normalizar).
  const [scoreDelta, setScoreDelta] = useState<{
    from: number;
    to: number;
  } | null>(null);
  // Confirmacao leve da reanalise (consome 1 uso de IA).
  const [confirmReanalyze, setConfirmReanalyze] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const areaTouched = useRef(false);

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
        JSON.stringify({ form, result, version: STORAGE_SHAPE_VERSION }),
      );
    } catch {
      // storage cheio ou indisponivel: segue so em memoria.
    }
  }, [form, result]);

  useEffect(() => {
    if (!isPro) return;
    let active = true;
    void listLinkedinAnalyses().then((data) => {
      if (active) setAnalyses(data);
    });
    return () => {
      active = false;
    };
  }, [isPro]);

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
      setForm((prev) => ({
        ...prev,
        profileText: text,
        // Prefill das skills a partir do PDF SO quando o campo esta vazio: o
        // export traz apenas as principais competencias e a pessoa complementa.
        skills:
          prev.skills.trim() === "" && detected.skillsPdf.length > 0
            ? detected.skillsPdf.join(", ")
            : prev.skills,
      }));
      setPdfStatus(
        `PDF lido (${text.length.toLocaleString("pt-BR")} caracteres).`,
      );
      setEntryPath("review");
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

  async function runAnalysis() {
    if (loading) return;
    if (form.profileText.trim().length < 200) {
      setError("INVALID_REQUEST");
      return;
    }
    setLoading(true);
    setError("");
    setConfirmReanalyze(false);

    // Nota da analise imediatamente anterior, capturada ANTES da nova entrar
    // no historico (a lista vem em ordem decrescente).
    const priorScore = analyses[0]?.score ?? null;

    try {
      // O analysisId devolvido junto passa a ser consumido na L6 (checklist
      // de melhorias aplicadas); por ora so o data importa.
      const { data } = await analyzeLinkedin({
        profileText: form.profileText.trim(),
        area: form.area,
        level: form.level,
        mercado: form.mercado,
        skills: form.skills,
        foto: form.foto,
        banner: form.banner,
        openToWork: form.openToWork,
        conexoes: form.conexoes,
        atividade: form.atividade,
        objetivo: form.objetivo.trim() || undefined,
      });
      setResult(data);
      // Delta SO quando a nota mudou: empate nao vira banner nem seta, e o
      // contador do hero volta a animar de 0 (semantica alinhada ao GitHub).
      setScoreDelta(
        priorScore !== null && priorScore !== data.deterministic.score
          ? { from: priorScore, to: data.deterministic.score }
          : null,
      );
      const fresh = await listLinkedinAnalyses();
      setAnalyses(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ANALYSIS_FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function openHistory(id: string) {
    if (openingId) return;
    setOpeningId(id);
    try {
      const record = await getLinkedinAnalysis(id);
      if (record) {
        setResult(record.result);
        setError("");
        setConfirmReanalyze(false);
        // Anterior = a entrada logo DEPOIS da aberta na lista (desc), pulando
        // a propria linha. Mesmo criterio do analyze: delta so quando a nota
        // mudou de fato.
        const idx = analyses.findIndex((item) => item.id === id);
        const prior = idx >= 0 ? (analyses[idx + 1]?.score ?? null) : null;
        setScoreDelta(
          prior !== null && prior !== record.result.deterministic.score
            ? { from: prior, to: record.result.deterministic.score }
            : null,
        );
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
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
  // result null). L6: limpar aqui tambem os campos do loop de melhorias
  // (analysisId, progresso aplicado) quando existirem.
  function startNewAnalysis() {
    setResult(null);
    setError("");
    setScoreDelta(null);
    setConfirmReanalyze(false);
  }

  const profileChars = form.profileText.trim().length;
  const canSubmit = profileChars >= 200 && !loading;

  const reduce = useReducedMotion() ?? false;
  // Estado de ENTRADA: sem analise em andamento, sem erro e sem resultado. E
  // onde vivem o cenario, a explicacao (timeline + vitrine), as pills e o
  // historico colapsavel.
  const showEntry = !loading && !error && !result;
  // Estado de RESULTADO: e o unico em que o palco de intake NAO renderiza (a
  // saida e o link Nova analise do header); erro mantem o palco pra pessoa
  // corrigir o texto e tentar de novo.
  const showResult = !loading && !error && result !== null;

  // Checklist de prontidao: o minimo REAL do backend (200 caracteres, o
  // schema da rota) bloqueia; a ausencia de Sobre e experiencias e aviso (o
  // server devolve 422 quando o texto nao tem nada aproveitavel).
  const checklistItems: string[] = [];
  if (profileChars < 200) {
    checklistItems.push(ENTRY_COPY.checklistChars(profileChars));
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
        {!loading && !error && result ? (
          <LinkedinResultBackdrop
            faixa={result.deterministic.faixa}
            reduce={reduce}
          />
        ) : null}
        <div className="container relative z-10">
          {/* Cabecalho integrado, presente nos 3 estados (entrada, loading,
              resultado). O slot do topo esquerdo e o lugar universal de
              "voltar": no resultado vira o link Nova analise; na entrada e no
              scan fica vazio. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-10"
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

          {!isPro ? (
            <ProGate description="A análise lê seu perfil do LinkedIn, calcula uma nota e entrega os textos prontos para você ser encontrado por recrutadores de estágio, trainee, júnior ou pleno." />
          ) : (
            <div className="space-y-8">
              {/* Ordem narrativa da entrada: explicacao (timeline + vitrine)
                  na coluna esquerda, palco de intake na direita; empilham em
                  coluna unica no mobile. Em loading e erro o grid some e o
                  palco segue sozinho no topo; no RESULTADO nada disso
                  renderiza (o form state vive na pagina, entao a reanalise
                  le o estado normalmente e Nova analise traz o palco de
                  volta com os dados preservados). */}
              {!showResult ? (
                <div
                  className={
                    showEntry
                      ? "grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start"
                      : undefined
                  }
                >
                  {showEntry ? (
                    <div className="space-y-12">
                      <HowItWorksTimeline />
                      <ResultShowcase />
                    </div>
                  ) : null}
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
                            onClick={() => setEntryPath("manual")}
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
                              onClick={() => setEntryPath("pdf")}
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
                              onClick={() => setEntryPath("pdf")}
                              className="text-sm font-bold text-sky-700 underline underline-offset-2 hover:text-sky-900"
                            >
                              {ENTRY_COPY.swapPdf}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={cn(
                                "rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black text-slate-900",
                                parsed?.headline
                                  ? "bg-emerald-100"
                                  : "bg-amber-100",
                              )}
                            >
                              Headline:{" "}
                              {parsed?.headline
                                ? "detectada"
                                : ENTRY_COPY.reviewNotFound}
                            </span>
                            <span
                              className={cn(
                                "rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black text-slate-900",
                                parsed?.sobre
                                  ? "bg-emerald-100"
                                  : "bg-amber-100",
                              )}
                            >
                              Sobre:{" "}
                              {parsed?.sobre
                                ? `${parsed.sobre.length} caracteres`
                                : ENTRY_COPY.reviewNotFound}
                            </span>
                            <span
                              className={cn(
                                "rounded-full border-2 border-slate-900 px-3 py-1 text-xs font-black text-slate-900",
                                parsed && parsed.experiencias.length > 0
                                  ? "bg-emerald-100"
                                  : "bg-amber-100",
                              )}
                            >
                              Experiências: {parsed?.experiencias.length ?? 0}{" "}
                              detectada
                              {(parsed?.experiencias.length ?? 0) === 1
                                ? ""
                                : "s"}
                            </span>
                            <span className="rounded-full border-2 border-slate-900 bg-sky-100 px-3 py-1 text-xs font-black text-slate-900">
                              Competências no PDF:{" "}
                              {parsed?.skillsPdf.length ?? 0}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {parsed?.headline ? (
                              <details className="rounded-xl border-2 border-slate-200 bg-white p-3">
                                <summary className="cursor-pointer text-sm font-black text-slate-800">
                                  Headline detectada
                                </summary>
                                <p className="mt-2 text-sm text-slate-700">
                                  {parsed.headline}
                                </p>
                              </details>
                            ) : null}
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
                                  detectada
                                  {parsed.experiencias.length === 1 ? "" : "s"})
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
                        <BrutalActionButton
                          variant="ai"
                          type="submit"
                          disabled={!canSubmit}
                          loading={loading}
                          icon={<Sparkles className="h-4 w-4" aria-hidden />}
                          className="px-6 py-3"
                        >
                          {loading ? "Analisando..." : "Analisar meu LinkedIn"}
                        </BrutalActionButton>
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
                    form.profileText.trim().length >= 200
                      ? () => void runAnalysis()
                      : undefined
                  }
                />
              ) : null}

              {!loading && !error && result ? (
                <div
                  className="area-rise space-y-8"
                  style={{ animationDelay: "0.08s" }}
                >
                  <LinkedinScoreHero
                    response={result}
                    scoreDelta={scoreDelta}
                    reduce={reduce}
                  />

                  {scoreDelta ? (
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
                    <NextStepCard
                      proximoPasso={result.qualitative.proximoPasso}
                    />
                  </motion.div>

                  {/* Corpo revista: coluna narrativa (7) + trilho lateral
                      consultavel (5). No mobile os wrappers viram display
                      contents e as classes order-* definem a ordem de leitura
                      empilhada: resumo, fortes/fracos, raio-X, melhorias,
                      recrutador, textos prontos, proximos passos, skills,
                      reanalise. */}
                  <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
                    <div className="contents lg:col-span-7 lg:block lg:space-y-8">
                      <Reveal className="order-1 lg:order-none">
                        <AiSummary
                          resumo={result.qualitative.resumo}
                          accent={ac}
                        />
                      </Reveal>
                      <Reveal className="order-2 lg:order-none" delay={0.05}>
                        <StrengthsWeaknesses
                          pontosFortes={result.qualitative.pontosFortes}
                          pontosFracos={result.qualitative.pontosFracos}
                          accent={ac}
                        />
                      </Reveal>
                      <Reveal className="order-4 lg:order-none" delay={0.05}>
                        <Improvements
                          melhorias={result.qualitative.melhorias}
                          accent={ac}
                        />
                      </Reveal>
                      <Reveal className="order-6 lg:order-none">
                        <ReadyTexts qualitative={result.qualitative} />
                      </Reveal>
                      <Reveal className="order-8 lg:order-none">
                        <SkillsSuggested
                          skills={result.qualitative.skillsSugeridas}
                        />
                      </Reveal>
                      {/* Climax do loop fechando a COLUNA PRINCIPAL, com a
                          confirmacao em 2 passos e o custo explicito de
                          sempre; celebrate chega na L6 com o checklist de
                          melhorias aplicadas. */}
                      <Reveal className="order-9 lg:order-none">
                        <ReanalyzeCta
                          confirming={confirmReanalyze}
                          onStart={() => setConfirmReanalyze(true)}
                          onConfirm={() => void runAnalysis()}
                          onCancel={() => setConfirmReanalyze(false)}
                          spotlight
                        />
                      </Reveal>
                    </div>

                    <div className="contents lg:col-span-5 lg:block lg:space-y-8">
                      <Reveal className="order-3 lg:order-none" delay={0.1}>
                        <div className="space-y-4">
                          {/* TODO(Ana): revisar o rotulo do trilho lateral. */}
                          <SectionLabel ac={ac}>Raio-X completo</SectionLabel>
                          <LinkedinChecklist
                            checks={result.deterministic.checks}
                          />
                        </div>
                      </Reveal>
                      <Reveal className="order-5 lg:order-none">
                        <RecruiterFinder
                          deterministic={result.deterministic}
                          mercado={result.mercado}
                        />
                      </Reveal>
                      <Reveal className="order-7 lg:order-none">
                        <NextStepsByArea area={result.area} />
                      </Reveal>
                    </div>
                  </div>
                </div>
              ) : null}

              {showEntry && analyses.length > 0 ? (
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
                    />
                  </div>
                </details>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
