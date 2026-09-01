import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ProGate from "@/components/pro/ProGate";
import IntakeChatPanel, {
  type IntakeChatMessage,
} from "@/components/ai/IntakeChatPanel";
import {
  AiGenerationProgressCard,
  useAiGeneration,
} from "@/components/roadmapV2/AiGenerationProgress";
import { clearDraft, loadDraft, saveDraft } from "@/lib/roadmapIntakeDraft";
import {
  blockFromError,
  BLOCK_COPY,
  isTransient,
  type ChatBlock,
  type ChatBlockKind,
} from "@/lib/roadmapChatBlock";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  getAiRoadmapContext,
  IntakeChatApiError,
  listAiRoadmaps,
  sendIntakeChatTurn,
  streamGeneration,
  streamResume,
  type AiRoadmapContext,
  type AiRoadmapListItem,
  type IntakeChatProposal,
} from "@/services/aiRoadmapService";
import {
  captureRoadmapCanGenerate,
  captureRoadmapChatBloqueado,
  captureRoadmapChatIniciado,
  captureRoadmapGeracaoConcluida,
  captureRoadmapGeracaoFalhou,
  captureRoadmapGeracaoIniciada,
} from "@/lib/analytics";
import {
  buildGenerationIntake,
  CHAT_KICKOFF,
  type IntakeRequiredChoiceField,
} from "@shared/aiRoadmap";

// Pagina do Roadmap com IA (Pro): entendimento (intake), geracao ao vivo por
// SSE e lista dos roadmaps ja gerados. A visualizacao vive em /roadmaps/ia/:slug.

// Janela em que um status generating e considerado geracao ATIVA (espelha a
// janela anti-abuso do server). Mais velho que isso, a geracao morreu no meio.
const GENERATING_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

// Rascunho do chat no localStorage: chave por usuario, no padrao bnt:<feature>:v1.
// TTL curto (24h): uma conversa de 7 etapas nao pode se perder num reload, mas
// tambem nao deve ressuscitar dias depois. Limpo ao concluir a geracao.
// Mora em client/src/lib/roadmapIntakeDraft.ts para ser testavel sem DOM.

// Campos essenciais para gerar (os 3 enums que viram os rotulos do prompt de
// geracao; format e assumido "misto"). O progresso da conversa e quantos deles
// ja foram capturados, derivado do missing[] que o backend devolve.
const ESSENTIAL_FIELDS = ["goal", "hoursPerWeek", "deadline"] as const;

// A partir de quantas mensagens restantes a UI comeca a avisar. Maior que o
// POUSO_SUAVE_RESTANTES do backend (3) de proposito: a pessoa ve o aviso antes
// de o modelo comecar a aterrissar, entao a aterrissagem nao parece abrupta.
const AVISO_RESTANTES_A_PARTIR_DE = 5;

// A semente de abertura da conversa MUDOU DE LADO na fase 2: hoje ela vive no
// servidor (CHAT_KICKOFF em server/lib/aiRoadmap/intakeChat.ts) e e injetada na
// montagem do prompt. Enquanto o client a prefixava, ela era contada como
// mensagem do usuario e comia uma vaga do orcamento de turnos. Nao voltar a
// mandar semente daqui no fluxo normal: o servidor remove a que vier no corpo,
// mas o teto ja estaria errado antes disso.
//
// O texto usado no retry de compatibilidade do turno de abertura (ver runTurn)
// vem de @shared/aiRoadmap, a MESMA constante que o servidor usa: se as duas
// divergissem, o backend novo deixaria de reconhecer a semente para remove-la.
// REMOVER O RETRY APOS 2026-08-30; a constante fica, e do servidor.

// TODO(Ana): revisar TODOS os textos deste bloco (copy da pagina, badges de
// status, copy do chat e do resumo do intake).
const COPY = {
  seoTitle: "Roadmap com IA, sua trilha sob medida",
  seoDescription:
    "Converse com o Natechinho e receba um roadmap de estudos gerado sob medida para o seu momento, seu tempo e seu objetivo em tecnologia.",
  eyebrow: "exclusivo do pro",
  title: "Roadmap com IA",
  subtitle:
    "Um plano de estudos feito pra voce: o Natechinho conversa, cruza o que voce ja fez na plataforma e monta a trilha sob medida.",
  proGateDescription:
    "Converse rapido com o Natechinho e receba um roadmap de estudos unico, gerado sob medida pro seu tempo, seu objetivo e o que voce ja sabe.",
  listTitle: "Seus roadmaps gerados",
  listEmpty: "Voce ainda nao gerou nenhum roadmap.",
  listLoadError: "Nao foi possivel carregar seus roadmaps agora.",
  open: "Abrir",
  continueGeneration: "Continuar",
  generateNew: "Gerar novo",
  statusReady: "Pronto",
  statusDone: "Concluido",
  statusPartial: "Incompleto",
  statusFailed: "Falhou",
  statusGenerating: "Em andamento",
  statusStalled: "Interrompido",
  // TODO(Ana): revisar copy do painel de contexto do intake.
  contextTitle: "O que ja vamos usar de voce",
  contextHint: "Algo desatualizado?",
  contextUpdateProfile: "atualizar no perfil",
  contextUpdateQuiz: "refazer o quiz",
  // TODO(Ana): revisar copy do chat e do resumo do intake.
  chatTitle: "Papo com o Natechinho",
  chatSubtitle: "Uma pergunta por vez. No fim, seu roadmap.",
  chatPlaceholder: "Escreva sua resposta",
  chatOpeningError: "Nao consegui comecar a conversa agora. Tente de novo.",
  chatGenericError: "Nao consegui responder agora. Tente de novo.",
  // Aviso de aproximacao do teto. So aparece nas ultimas mensagens (ver
  // AVISO_RESTANTES_A_PARTIR_DE): antes disso e ruido.
  chatRestantes: (n: number) =>
    n === 1
      ? "Ultima mensagem desta conversa."
      : `Faltam ${n} mensagens nesta conversa.`,
  summaryTitle: "Fechou. Isto e o que eu entendi:",
  summaryHint:
    "Se algo ficou torto, e so me dizer aqui embaixo antes de gerar.",
  // No chat travado a dica acima seria mentira: nao ha "aqui embaixo" para
  // digitar. A saida passa a ser recomecar.
  summaryHintBlocked:
    "Se algo ficou torto, recomece a conversa antes de gerar.",
  summaryGoal: "Objetivo",
  summaryHours: "Tempo por semana",
  summaryDeadline: "Prazo",
  summaryStack: "Foco de stack",
  summaryStartingPoint: "Ponto de partida",
  summaryMotivation: "Motivacao",
  summaryConstraints: "Obstaculos",
  generate: "Gerar meu roadmap",
  generating: "Gerando...",
  // Substitui o antigo finalError ("Faltou alguma informacao essencial"), que
  // nao dizia O QUE faltava nem oferecia saida.
  missingTitle: "Falta pouco pra gerar",
  missingLead: "Ainda preciso saber:",
  // Quando o chat travou, a lista vira formulario: responder aqui e a saida.
  missingLeadBlocked: "Responda aqui e eu gero seu roadmap:",
  chatRestart: "Recomecar a conversa",
} as const;

// Rotulos em portugues dos campos que faltam. O usuario nunca ve "hoursPerWeek".
const MISSING_LABEL: Record<IntakeRequiredChoiceField, string> = {
  goal: "seu objetivo principal",
  hoursPerWeek: "quanto tempo por semana voce tem",
  deadline: "em quanto tempo quer chegar la",
};

// Bloqueios do chat e as saidas de cada um vivem em
// client/src/lib/roadmapChatBlock.ts, para o INVARIANTE (nunca fechar as duas
// saidas) ser afirmavel por teste em vez de por leitura de JSX.

// Opcoes do formulario de fallback. Reaproveitadas do formulario estatico que
// existia antes do commit 083432c (guided chat intake replaces static form);
// mesmos valores de enum, mesmos rotulos, mesmo desenho de botao.
const FALLBACK_QUESTIONS: Array<{
  key: IntakeRequiredChoiceField;
  question: string;
  options: Array<{ value: string; label: string }>;
}> = [
  {
    key: "goal",
    question: "Qual e o seu objetivo principal?",
    options: [
      { value: "primeira-vaga", label: "Conquistar a primeira vaga" },
      { value: "transicao", label: "Mudar de carreira pra tech" },
      { value: "freela", label: "Trabalhar como freelancer" },
      { value: "aprofundar", label: "Me aprofundar na minha area" },
    ],
  },
  {
    key: "hoursPerWeek",
    question: "Quanto tempo por semana voce tem pra estudar?",
    options: [
      { value: "ate-5", label: "Ate 5 horas" },
      { value: "5-10", label: "5 a 10 horas" },
      { value: "10-20", label: "10 a 20 horas" },
      { value: "20-mais", label: "Mais de 20 horas" },
    ],
  },
  {
    key: "deadline",
    question: "Em quanto tempo voce quer chegar la?",
    options: [
      { value: "3m", label: "3 meses" },
      { value: "6m", label: "6 meses" },
      { value: "12m", label: "12 meses" },
      { value: "sem-prazo", label: "Sem prazo definido" },
    ],
  },
];

// Rotulos de exibicao dos enums no resumo do intake (nao vao ao server; o server
// recebe o enum cru). TODO(Ana): revisar rotulos.
const GOAL_DISPLAY: Record<NonNullable<IntakeChatProposal["goal"]>, string> = {
  "primeira-vaga": "Conquistar a primeira vaga",
  transicao: "Mudar de carreira pra tech",
  freela: "Trabalhar como freelancer",
  aprofundar: "Aprofundar na area atual",
};
const HOURS_DISPLAY: Record<
  NonNullable<IntakeChatProposal["hoursPerWeek"]>,
  string
> = {
  "ate-5": "Ate 5 horas",
  "5-10": "5 a 10 horas",
  "10-20": "10 a 20 horas",
  "20-mais": "Mais de 20 horas",
};
const DEADLINE_DISPLAY: Record<
  NonNullable<IntakeChatProposal["deadline"]>,
  string
> = {
  "3m": "3 meses",
  "6m": "6 meses",
  "12m": "12 meses",
  "sem-prazo": "Sem prazo definido",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

function StatusBadge({ item }: { item: AiRoadmapListItem }) {
  const styles: Record<string, string> = {
    ready: "bg-emerald-100 text-emerald-800",
    done: "bg-violet-100 text-violet-800",
    partial: "bg-amber-100 text-amber-800",
    failed: "bg-rose-100 text-rose-800",
    generating: "bg-sky-100 text-sky-800",
    stalled: "bg-slate-100 text-slate-600",
  };
  let kind: string = item.status;
  let label: string;
  if (item.status === "ready") {
    const total = item.totalSteps ?? null;
    const completed = item.completedSteps ?? null;
    if (
      total !== null &&
      completed !== null &&
      total > 0 &&
      completed >= total
    ) {
      kind = "done";
      label = COPY.statusDone;
    } else {
      label = COPY.statusReady;
    }
  } else if (item.status === "partial") label = COPY.statusPartial;
  else if (item.status === "failed") label = COPY.statusFailed;
  else if (
    Date.now() - new Date(item.updated_at).getTime() <
    GENERATING_ACTIVE_WINDOW_MS
  ) {
    label = COPY.statusGenerating;
  } else {
    kind = "stalled";
    label = COPY.statusStalled;
  }
  return (
    <span
      className={`rounded-full border-[1.5px] border-slate-900 px-2 py-0.5 text-[11px] font-black ${styles[kind] ?? styles.stalled}`}
    >
      {label}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-black text-slate-500">{label}:</dt>
      <dd className="min-w-0 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export default function RoadmapIA() {
  const { isPro } = useSubscription();
  const [, setLocation] = useLocation();

  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Estado do chat de intake guiado. O historico e efemero (reenviado a cada
  // turno) e persistido so no localStorage; o intake parcial mais recente vem do
  // backend a cada turno.
  const [messages, setMessages] = useState<IntakeChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  // Bloqueio do chat, tipado. Antes eram dois estados frouxos (chatError string
  // e turnLimitReached boolean) e o turn_limit voltava sem setar nenhum dos
  // dois, o que produzia a tela com input travado, mensagem dizendo "voce ja
  // pode gerar" e nenhum botao de gerar. Agora todo bloqueio tem um kind, e o
  // kind decide o que a tela oferece.
  const [block, setBlock] = useState<ChatBlock | null>(null);
  // Respostas dadas pelo formulario de fallback. Tem PRECEDENCIA sobre o que o
  // chat propos: se a pessoa respondeu na mao, e essa a resposta que vale.
  const [formOverrides, setFormOverrides] = useState<
    Partial<Record<IntakeRequiredChoiceField, string>>
  >({});
  const [intake, setIntake] = useState<IntakeChatProposal | null>(null);
  const [missing, setMissing] = useState<string[]>([...ESSENTIAL_FIELDS]);
  const [ready, setReady] = useState(false);
  // Mensagens que ainda cabem na conversa, vindo do backend. null = backend
  // antigo (janela de deploy) ou nenhum turno ainda; a UI simplesmente nao avisa.
  const [restantes, setRestantes] = useState<number | null>(null);
  // Guarda de uma execucao so do bootstrap (restore do rascunho ou abertura).
  const bootstrappedRef = useRef(false);
  // Espelhos para telemetria dentro de callbacks que nao dependem do estado
  // (runTurn tem deps vazias de proposito, para nao remontar a cada turno).
  const canGenerateRef = useRef(false);
  const canGenerateEmitidoRef = useRef(false);
  const fasePublicadaRef = useRef<string | null>(null);

  const onDone = useCallback(
    (slug: string) => {
      if (userId) clearDraft(userId);
      setLocation(`/roadmaps/ia/${slug}`);
    },
    [setLocation, userId],
  );
  const { state, start, reset } = useAiGeneration(onDone);

  const [list, setList] = useState<AiRoadmapListItem[] | null | undefined>(
    undefined,
  );
  const loadList = useCallback(() => {
    listAiRoadmaps()
      .then(setList)
      .catch(() => setList(null));
  }, []);
  useEffect(() => {
    loadList();
  }, [loadList]);

  // Painel "o que ja vamos usar de voce": best-effort, falha esconde o painel.
  const [context, setContext] = useState<AiRoadmapContext | null>(null);
  useEffect(() => {
    if (!isPro) return;
    getAiRoadmapContext()
      .then(setContext)
      .catch(() => setContext(null));
  }, [isPro]);

  const contextChips: string[] = [];
  if (context) {
    if (context.quiz?.area) {
      contextChips.push(
        context.quiz.level
          ? `Quiz: ${context.quiz.area}, nivel ${context.quiz.level}`
          : `Quiz: ${context.quiz.area}`,
      );
    }
    for (const skill of context.skills) contextChips.push(skill);
    for (const trail of context.trails) {
      contextChips.push(
        trail.pct !== null ? `${trail.title} (${trail.pct}%)` : trail.title,
      );
    }
    if (context.careerGoal)
      contextChips.push(`Objetivo: ${context.careerGoal}`);
    if (context.studyMinutes30d !== null) {
      const hours = Math.round(context.studyMinutes30d / 60);
      contextChips.push(
        hours >= 1
          ? `${hours}h de estudo nos ultimos 30 dias`
          : `${context.studyMinutes30d} min de estudo nos ultimos 30 dias`,
      );
    }
  }

  // Erro parcial ou bloqueio mudam o estado das linhas: atualiza a lista.
  useEffect(() => {
    if (state.phase === "error" || state.phase === "blocked") loadList();
  }, [state.phase, loadList]);

  // Um turno do chat. O historico vai SEM semente (o servidor injeta a dele).
  // Todo erro vira um ChatBlock tipado; o kind decide se a tela oferece Tentar
  // de novo (so transient) ou as saidas terminais.
  const runTurn = useCallback(
    async (history: IntakeChatMessage[], isOpening: boolean) => {
      setSending(true);
      setBlock(null);
      try {
        let result;
        try {
          result = await sendIntakeChatTurn(history);
        } catch (err) {
          // JANELA DE DEPLOY. O turno de ABERTURA vai com historico vazio, e o
          // backend anterior a fase 2 rejeitava corpo vazio com invalid_request
          // (ele contava com a semente que o client prefixava). Vercel e Railway
          // sobem separados e a Vercel costuma terminar primeiro, entao existe
          // uma janela de 1 a 3 minutos com este bundle contra aquele backend, e
          // nela a conversa NAO ABRIA de jeito nenhum. O mesmo vale depois de um
          // rollback do servidor, que nao tem prazo para acabar.
          //
          // A saida e uma tentativa unica com a semente antiga. Contra o backend
          // NOVO ela e inofensiva (validateIntakeChatBody remove a semente em
          // qualquer posicao, e o orcamento nao muda); contra o ANTIGO ela e
          // exatamente o que ele espera. Some quando o backend antigo sair de
          // circulacao: REMOVER APOS 2026-08-30.
          const abrindoContraBackendAntigo =
            isOpening &&
            history.length === 0 &&
            err instanceof IntakeChatApiError &&
            err.code === "invalid_request";
          if (!abrindoContraBackendAntigo) throw err;
          result = await sendIntakeChatTurn([
            { role: "user", content: CHAT_KICKOFF },
          ]);
        }
        setMessages([...history, { role: "assistant", content: result.reply }]);
        setIntake(result.intake);
        setMissing(result.missing);
        setReady(result.ready);
        setRestantes(result.restantes);
      } catch (err) {
        const bloqueio = blockFromError(
          err,
          isOpening ? COPY.chatOpeningError : COPY.chatGenericError,
        );
        setBlock(bloqueio);
        captureRoadmapChatBloqueado({
          motivo: bloqueio.kind,
          can_generate: canGenerateRef.current,
          turnos: history.filter((m) => m.role === "user").length,
        });
      } finally {
        setSending(false);
      }
    },
    [],
  );

  const handleSend = useCallback(
    (text: string) => {
      const next = [...messages, { role: "user" as const, content: text }];
      setMessages(next);
      void runTurn(next, false);
    },
    [messages, runTurn],
  );

  // Reenvia a ultima mensagem do usuario sem duplicar: o historico ja termina
  // nela (a resposta do assistente nao foi anexada por causa do erro). So e
  // oferecido em bloqueio transitorio.
  const handleRetry = useCallback(() => {
    if (sending) return;
    void runTurn(messages, false);
  }, [messages, runTurn, sending]);

  // Saida SEMPRE disponivel: joga fora o rascunho e recomeca do zero. Antes
  // disto, quem batia no teto ficava preso ate o TTL de 24h do rascunho expirar,
  // porque recarregar a pagina restaurava exatamente o mesmo estado travado.
  const restartChat = useCallback(() => {
    if (sending) return;
    if (userId) clearDraft(userId);
    setMessages([]);
    setIntake(null);
    setMissing([...ESSENTIAL_FIELDS]);
    setReady(false);
    setRestantes(null);
    setBlock(null);
    setFormOverrides({});
    void runTurn([], true);
  }, [runTurn, sending, userId]);

  // Bootstrap (uma vez, so Pro, com sessao e no phase idle): restaura o rascunho
  // ou dispara o turno de abertura. O phase idle evita gerar um turno por engano
  // enquanto uma geracao roda.
  useEffect(() => {
    if (!isPro || !userId || state.phase !== "idle") return;
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    const draft = loadDraft(userId);
    captureRoadmapChatIniciado({ retomado_de_rascunho: draft !== null });
    if (draft) {
      setMessages(draft.messages);
      setIntake(draft.intake);
      setMissing(draft.missing);
      setReady(draft.ready);
      setRestantes(draft.restantes ?? null);
      return;
    }
    void runTurn([], true);
  }, [isPro, userId, state.phase, runTurn]);

  // Persiste o rascunho a cada mudanca relevante (best-effort; TTL na leitura).
  useEffect(() => {
    if (!userId || messages.length === 0) return;
    saveDraft(userId, { messages, intake, missing, ready, restantes });
  }, [userId, messages, intake, missing, ready]);

  // Prontidao para gerar, pela MESMA funcao que o servidor usa. O servidor ja
  // manda a resposta pronta; recalcular localmente cobre a janela de deploy
  // (front novo contra backend antigo, que nao manda canGenerate) e o caso do
  // formulario de fallback, cujos valores ainda nao passaram por turno nenhum.
  const readiness = buildGenerationIntake({
    ...(intake ?? {}),
    ...formOverrides,
  });
  const canGenerate = readiness.canGenerate;
  const missingToGenerate = readiness.missing;

  // A conversa nao pode continuar: bloqueio terminal (teto, cota, payload, Pro,
  // requisicao invalida). Nesse estado o input fica travado, entao a tela PRECISA
  // oferecer outra coisa: gerar (se der) ou o formulario de fallback.
  const chatBlocked = block !== null && !isTransient(block);

  // Telemetria do degrau que faltava. Dispara UMA vez, na primeira vez que o
  // intake fica completo: e o evento que separa "desistiu da conversa" de
  // "conversou tudo e mesmo assim nao gerou".
  const turnosDados = messages.filter((m) => m.role === "user").length;
  useEffect(() => {
    canGenerateRef.current = canGenerate;
    if (canGenerate && !canGenerateEmitidoRef.current) {
      canGenerateEmitidoRef.current = true;
      captureRoadmapCanGenerate({
        turnos: turnosDados,
        via_formulario: Object.keys(formOverrides).length > 0,
      });
    }
  }, [canGenerate, formOverrides, turnosDados]);

  // Desfecho da geracao, uma vez por transicao de fase.
  useEffect(() => {
    if (state.phase === "idle" || state.phase === "running") {
      fasePublicadaRef.current = null;
      return;
    }
    if (fasePublicadaRef.current === state.phase) return;
    fasePublicadaRef.current = state.phase;
    if (state.phase === "done") {
      captureRoadmapGeracaoConcluida({
        secoes_falhas: state.failed.length,
        parcial: state.failed.length > 0,
      });
      return;
    }
    captureRoadmapGeracaoFalhou({
      motivo: state.blockedCode ?? "stream_error",
    });
  }, [state.phase, state.failed.length, state.blockedCode]);

  // Gera com o payload que o buildGenerationIntake montou. Sem caminho de
  // validacao proprio aqui: se canGenerate e true, o payload existe.
  const payloadToGenerate = readiness.intake;
  // Trava o botao entre o clique e a resposta. `state.phase` so vira "running"
  // depois do primeiro frame SSE, entao ele sozinho deixa uma janela aberta.
  const [generating, setGenerating] = useState(false);
  const generate = useCallback(async () => {
    if (!payloadToGenerate || generating) return;
    setGenerating(true);
    captureRoadmapGeracaoIniciada({
      via_formulario: Object.keys(formOverrides).length > 0,
    });
    try {
      await start((handlers) => streamGeneration(payloadToGenerate, handlers));
    } finally {
      setGenerating(false);
    }
  }, [formOverrides, generating, payloadToGenerate, start]);

  const resume = async (slug: string) => {
    await start((handlers) => streamResume(slug, handlers));
  };

  const generationActive = state.phase === "running" || state.phase === "done";

  // Progresso da conversa: quantos campos essenciais ja sairam do missing[].
  const essentialOpen = missing.filter((f) =>
    (ESSENTIAL_FIELDS as readonly string[]).includes(f),
  ).length;
  const essentialDone = ESSENTIAL_FIELDS.length - essentialOpen;

  return (
    <Layout>
      <SEO
        title={COPY.seoTitle}
        description={COPY.seoDescription}
        url="/roadmaps/ia"
      />
      <section className="bg-[var(--brand-cream)] [background-image:radial-gradient(rgba(15,23,42,0.07)_1.4px,transparent_1.4px)] [background-size:22px_22px]">
        <div className="mx-auto max-w-[760px] px-5 pb-20 pt-8">
          <Link
            href="/roadmaps"
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Todos os roadmaps
          </Link>

          <div className="mt-5">
            <span className="inline-block rounded-full border-2 border-slate-900 bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-900 shadow-[2px_2px_0_var(--bnt-shadow)]">
              {COPY.eyebrow}
            </span>
            <h1 className="mt-3.5 font-display text-3xl font-black leading-tight tracking-tight text-slate-950">
              {COPY.title}
            </h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
              {COPY.subtitle}
            </p>
          </div>

          <div className="mt-8">
            {!isPro ? (
              <ProGate
                feature="roadmap_ia"
                description={COPY.proGateDescription}
              />
            ) : generationActive ||
              state.phase === "error" ||
              state.phase === "blocked" ? (
              <AiGenerationProgressCard
                state={state}
                onResume={(slug) => void resume(slug)}
                onReset={reset}
              />
            ) : (
              <div className="space-y-5">
                {contextChips.length > 0 ? (
                  <div className="rounded-[12px] border-[2px] border-slate-900 bg-violet-50 p-4">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-violet-900">
                      {COPY.contextTitle}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {contextChips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border-[1.5px] border-slate-900 bg-white px-2.5 py-1 text-xs font-bold text-slate-800"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      {COPY.contextHint}{" "}
                      <Link
                        href="/perfil"
                        className="font-bold text-violet-800 underline underline-offset-2"
                      >
                        {COPY.contextUpdateProfile}
                      </Link>{" "}
                      ou{" "}
                      <Link
                        href="/quiz-carreira"
                        className="font-bold text-violet-800 underline underline-offset-2"
                      >
                        {COPY.contextUpdateQuiz}
                      </Link>
                      .
                    </p>
                  </div>
                ) : null}

                <IntakeChatPanel
                  messages={messages}
                  sending={sending}
                  onSend={handleSend}
                  title={COPY.chatTitle}
                  subtitle={COPY.chatSubtitle}
                  error={
                    block
                      ? isTransient(block)
                        ? (block.message ?? COPY.chatGenericError)
                        : null
                      : null
                  }
                  // Tentar de novo SO no transitorio: nos bloqueios
                  // deterministicos reenviar o mesmo corpo da o mesmo erro, e o
                  // botao virava uma promessa que nunca se cumpre.
                  onRetry={isTransient(block) ? handleRetry : undefined}
                  turnLimitReached={chatBlocked}
                  turnLimitMessage={
                    block && !isTransient(block)
                      ? BLOCK_COPY[
                          block.kind as Exclude<ChatBlockKind, "transient">
                        ]
                      : undefined
                  }
                  onRestart={restartChat}
                  restartLabel={COPY.chatRestart}
                  progress={{
                    done: essentialDone,
                    total: ESSENTIAL_FIELDS.length,
                  }}
                  remainingHint={
                    restantes !== null &&
                    restantes > 0 &&
                    restantes <= AVISO_RESTANTES_A_PARTIR_DE
                      ? COPY.chatRestantes(restantes)
                      : null
                  }
                  placeholder={COPY.chatPlaceholder}
                />

                {/* O resumo renderiza o PAYLOAD que vai ser enviado, nao a
                    proposta crua do chat: o que a pessoa confere e exatamente o
                    que o servidor recebe. `ready` (fim da conversa) so decide o
                    destaque visual; quem decide a EXISTENCIA do botao e
                    canGenerate. */}
                {canGenerate && payloadToGenerate ? (
                  <div
                    className={`rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 ${ready ? "shadow-[4px_4px_0_#FCC700]" : "shadow-[3px_3px_0_var(--bnt-shadow)]"}`}
                  >
                    <p className="font-display text-lg font-black text-slate-950">
                      {COPY.summaryTitle}
                    </p>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <SummaryRow
                        label={COPY.summaryGoal}
                        value={GOAL_DISPLAY[payloadToGenerate.goal]}
                      />
                      <SummaryRow
                        label={COPY.summaryHours}
                        value={HOURS_DISPLAY[payloadToGenerate.hoursPerWeek]}
                      />
                      <SummaryRow
                        label={COPY.summaryDeadline}
                        value={DEADLINE_DISPLAY[payloadToGenerate.deadline]}
                      />
                      {payloadToGenerate.stackFocus ? (
                        <SummaryRow
                          label={COPY.summaryStack}
                          value={payloadToGenerate.stackFocus}
                        />
                      ) : null}
                      {payloadToGenerate.startingPoint ? (
                        <SummaryRow
                          label={COPY.summaryStartingPoint}
                          value={payloadToGenerate.startingPoint}
                        />
                      ) : null}
                      {payloadToGenerate.motivation ? (
                        <SummaryRow
                          label={COPY.summaryMotivation}
                          value={payloadToGenerate.motivation}
                        />
                      ) : null}
                      {payloadToGenerate.constraints ? (
                        <SummaryRow
                          label={COPY.summaryConstraints}
                          value={payloadToGenerate.constraints}
                        />
                      ) : null}
                    </dl>
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      {chatBlocked ? COPY.summaryHintBlocked : COPY.summaryHint}
                    </p>
                    {/* disabled enquanto a requisicao esta em voo: sem isto,
                        dois cliques disparavam duas geracoes, e as duas passavam
                        pela checagem de concorrencia do servidor antes de
                        qualquer insert. O indice unico parcial fecha a corrida
                        no banco; isto evita provoca-la. */}
                    <button
                      type="button"
                      onClick={() => void generate()}
                      disabled={generating}
                      className="bnt-pressable mt-4 inline-flex items-center gap-2 rounded-[11px] border-[2.5px] border-slate-900 bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-[3px_3px_0_var(--bnt-shadow)] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_var(--bnt-shadow)] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-[3px_3px_0_var(--bnt-shadow)]"
                    >
                      <Sparkles className="h-4 w-4" />
                      {generating ? COPY.generating : COPY.generate}
                    </button>
                  </div>
                ) : (
                  /* canGenerate false: a pessoa ve NOMEADO o que falta, em vez
                     do antigo silencio (o botao simplesmente nao existia). Se o
                     chat ainda pode continuar, a lista basta (responder no chat
                     e o caminho); se o chat travou, o formulario abaixo e a
                     saida, porque senao nao sobraria nenhuma. */
                  <div className="rounded-[14px] border-[2.5px] border-slate-900 bg-white p-5 shadow-[3px_3px_0_var(--bnt-shadow)]">
                    <p className="font-display text-lg font-black text-slate-950">
                      {COPY.missingTitle}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {chatBlocked ? COPY.missingLeadBlocked : COPY.missingLead}
                    </p>
                    {chatBlocked ? (
                      <div className="mt-4 space-y-5">
                        {FALLBACK_QUESTIONS.filter((q) =>
                          missingToGenerate.includes(q.key),
                        ).map((q) => (
                          <fieldset key={q.key}>
                            <legend className="font-display text-base font-black text-slate-950">
                              {q.question}
                            </legend>
                            <div className="mt-2.5 flex flex-wrap gap-2.5">
                              {q.options.map((option) => {
                                const active =
                                  formOverrides[q.key] === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() =>
                                      setFormOverrides((prev) => ({
                                        ...prev,
                                        [q.key]: option.value,
                                      }))
                                    }
                                    className={`rounded-[11px] border-[2.5px] border-slate-900 px-4 py-2.5 text-sm font-extrabold shadow-[3px_3px_0_var(--bnt-shadow)] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--bnt-shadow)] ${
                                      active
                                        ? "bg-[var(--brand-yellow)] text-ink-on-accent"
                                        : "bg-white text-slate-600"
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          </fieldset>
                        ))}
                      </div>
                    ) : (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-bold text-slate-800">
                        {missingToGenerate.map((field) => (
                          <li key={field}>{MISSING_LABEL[field]}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-12">
            <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">
              {COPY.listTitle}
            </h2>
            {list === undefined ? (
              <div className="mt-6 flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : list === null ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                {COPY.listLoadError}
              </p>
            ) : list.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                {COPY.listEmpty}
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {list.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border-[2.5px] border-slate-900 bg-white p-4 shadow-[3px_3px_0_var(--bnt-shadow)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge item={item} />
                      {item.status === "ready" ? (
                        <Link
                          href={`/roadmaps/ia/${item.slug}`}
                          className="inline-flex items-center gap-1.5 rounded-[10px] border-[2px] border-slate-900 bg-[var(--brand-yellow)] px-3 py-1.5 text-xs font-black text-ink-on-accent shadow-[2px_2px_0_var(--bnt-shadow)] transition-all hover:-translate-y-px"
                        >
                          {COPY.open}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : item.status === "partial" && isPro ? (
                        <button
                          type="button"
                          onClick={() => void resume(item.slug)}
                          className="inline-flex items-center rounded-[10px] border-[2px] border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)] transition-all hover:-translate-y-px"
                        >
                          {COPY.continueGeneration}
                        </button>
                      ) : item.status === "failed" ? (
                        <span className="text-xs font-bold text-slate-500">
                          {COPY.generateNew}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
