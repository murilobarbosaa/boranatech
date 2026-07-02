import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  BatteryLow,
  HelpCircle,
  Sparkles,
  Trash2,
  Clock,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import Layout from "@/components/Layout";
import { AiCtaLink } from "@/components/shared/AiCta";
import PageHero from "@/components/shared/PageHero";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import {
  createStudyEntry,
  deleteStudyEntry,
  getStudyEntries,
  getStudyStats,
  type StudyStats,
} from "@/services/studyService";
import { Link } from "wouter";

const ac = getPageAccentUi("rose");

export type StudySessionModeId = "produtiva" | "ritmo" | "dispersa" | "revisar";

const SESSION_MODES: Array<{
  id: StudySessionModeId;
  label: string;
  hint: string;
  Icon: typeof Sparkles;
  idleClass: string;
  activeRing: string;
}> = [
  {
    id: "produtiva",
    label: "Produtiva",
    hint: "Entendi o tema e sai com clareza do que fazer depois.",
    Icon: Sparkles,
    idleClass: "border-emerald-200 bg-emerald-50/80 hover:border-emerald-400",
    activeRing: "ring-2 ring-emerald-500 ring-offset-2",
  },
  {
    id: "ritmo",
    label: "No ritmo",
    hint: "Sessão dentro do normal, nem brilhou, nem travou.",
    Icon: Activity,
    idleClass: "border-slate-200 bg-slate-50 hover:border-slate-400",
    activeRing: "ring-2 ring-slate-700 ring-offset-2",
  },
  {
    id: "dispersa",
    label: "Pesada ou dispersa",
    hint: "Cansaço, interrupções ou cabeça cheia; foque menos tempo amanhã ou mude o horário.",
    Icon: BatteryLow,
    idleClass: "border-amber-200 bg-amber-50/90 hover:border-amber-400",
    activeRing: "ring-2 ring-amber-600 ring-offset-2",
  },
  {
    id: "revisar",
    label: "Confusa: revisar",
    hint: "Muitas dúvidas ou conteúdo denso; anote o que voltar e busque uma fonte extra.",
    Icon: HelpCircle,
    idleClass: "border-violet-200 bg-violet-50/90 hover:border-violet-400",
    activeRing: "ring-2 ring-violet-600 ring-offset-2",
  },
];

const MINUTE_PRESETS = [15, 25, 30, 45, 60, 90] as const;

export type StudyEntry = {
  id: string;
  text: string;
  minutes: number;
  mode: StudySessionModeId;
  at: string;
};

function localDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function last7DaysKeys(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(x.getDate() - i);
    out.push(localDateKey(x));
  }
  return out;
}

function modeInsight(entries: StudyEntry[]): string {
  const weekStart = last7DaysKeys()[0];
  const recent = entries.filter(
    (e) => localDateKey(new Date(e.at)) >= weekStart,
  );
  if (recent.length === 0) {
    return "Comece com registros curtos: mesmo 15 minutos válidos ajudam a ver padrões na próxima semana.";
  }
  const byMode = recent.reduce<Record<StudySessionModeId, number>>(
    (acc, e) => {
      acc[e.mode] = (acc[e.mode] || 0) + 1;
      return acc;
    },
    { produtiva: 0, ritmo: 0, dispersa: 0, revisar: 0 },
  );
  if (byMode.revisar >= Math.ceil(recent.length / 2)) {
    return "Muitas sessões “revisar”: quebre o tema em blocos menores ou troque de material antes de desistir.";
  }
  if (byMode.dispersa >= Math.ceil(recent.length / 2)) {
    return "Várias sessões pesadas seguidas: experimente horários diferentes ou sessões mais curtas com pausa.";
  }
  if (byMode.produtiva >= recent.length * 0.6) {
    return "Boa sequência de sessões produtivas: mantém o nível, mas registre o que funcionou para repetir.";
  }
  return "Volume consistente. Alterne dias de estudo novo com revisão leve para fixar o que já entrou bem.";
}

export default function EstudosDiario() {
  const { loading: authLoading, user } = useAuth();
  const { isPro, loading } = useSubscription();
  const [entries, setEntries] = useState<StudyEntry[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [mode, setMode] = useState<StudySessionModeId>("ritmo");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setEntries([]);
      setStats(null);
      setLoadingEntries(false);
      return;
    }

    setLoadingEntries(true);
    Promise.all([getStudyEntries({ limit: 30 }), getStudyStats("7d")])
      .then(([nextEntries, nextStats]) => {
        setEntries(
          nextEntries.map((entry) => ({
            id: entry.id,
            text: entry.text,
            minutes: entry.minutes,
            mode: entry.mode,
            at: entry.studied_at,
          })),
        );
        setStats(nextStats);
      })
      .catch(console.error)
      .finally(() => setLoadingEntries(false));
  }, [authLoading, user]);

  const streak = stats?.current_streak ?? 0;
  const weekKeys = useMemo(() => last7DaysKeys(), []);
  const minutesByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const k of weekKeys) map[k] = 0;
    for (const e of entries) {
      const k = localDateKey(new Date(e.at));
      if (k in map) map[k] += e.minutes;
    }
    return map;
  }, [entries, weekKeys]);
  const weekTotalMin = useMemo(
    () => weekKeys.reduce((s, k) => s + (minutesByDay[k] || 0), 0),
    [minutesByDay, weekKeys],
  );
  const maxDayMin = Math.max(1, ...weekKeys.map((k) => minutesByDay[k] || 0));
  const insight = useMemo(() => modeInsight(entries), [entries]);

  async function refreshStats() {
    try {
      const nextStats = await getStudyStats("7d");
      setStats(nextStats);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || minutes <= 0 || saving || !user) return;

    try {
      setSaving(true);
      const entry = await createStudyEntry({
        text: trimmed,
        minutes,
        mode,
        studied_at: new Date().toISOString(),
      });
      setEntries((current) => [
        {
          id: entry.id,
          text: entry.text,
          minutes: entry.minutes,
          mode: entry.mode,
          at: entry.studied_at,
        },
        ...current,
      ]);
      setText("");
      setMode("ritmo");
      void refreshStats();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id: string) {
    const previous = entries;
    setEntries((current) => current.filter((e) => e.id !== id));

    try {
      await deleteStudyEntry(id);
      void refreshStats();
    } catch (err) {
      console.error(err);
      setEntries(previous);
    }
  }

  const selectedMode = SESSION_MODES.find((m) => m.id === mode)!;

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Diário de estudos"
        description="Registre suas sessões de estudo e acompanhe sua rotina: cada registro conta como foi a sessão e mostra o que importa para ajustar o seu ritmo."
        url="/estudos/diario"
      />
      <PageHero
        accent="fuchsia"
        eyebrow="só pelo perfil"
        title="Diário de Estudos"
        subtitle="Cada registro conta como foi a sessão, não humor genérico, e sim o que importa para ajustar rotina."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <p className="mb-6 text-center text-sm font-semibold text-slate-600">
            <Link
              href="/perfil"
              className="font-black text-violet-800 underline decoration-2 underline-offset-2 hover:text-violet-950"
            >
              Voltar ao perfil
            </Link>
          </p>
          {authLoading ? (
            <div className="card-brutal rounded-2xl bg-white p-6 text-center">
              <p className="font-display text-2xl font-black text-slate-950">
                Carregando seu diário...
              </p>
            </div>
          ) : !user ? (
            <div className="card-brutal rounded-2xl bg-white p-6 text-center">
              <h2 className="font-display text-2xl font-black text-slate-950">
                Faça login para usar o diário
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Seu histórico fica salvo na sua conta e sincroniza entre
                dispositivos.
              </p>
              <Link
                href="/login"
                className="btn-brutal-accent mt-5 inline-flex rounded-full px-6 py-3 text-sm font-black"
              >
                Entrar na conta
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              <form
                className="card-brutal rounded-2xl bg-white p-6 shadow-[5px_5px_0_#0f172a] lg:col-span-2"
                onSubmit={handleSubmit}
              >
                <h2 className="font-display text-2xl font-black">
                  Registrar sessão
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Descreva o foco principal e marque como a sessão se saiu,
                  isso guia ajustes reais de estudo.
                </p>

                <div className="mt-5">
                  <span className="mb-2 flex items-center gap-2 font-black text-slate-950">
                    <Clock className="h-4 w-4" />
                    Duração
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {MINUTE_PRESETS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMinutes(m)}
                        className={cn(
                          "rounded-full border-2 px-3 py-1.5 text-sm font-black transition-all",
                          minutes === m
                            ? cn(
                                "border-slate-900 text-white shadow-[3px_3px_0_#0f172a]",
                                ac.progressFill,
                              )
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
                        )}
                      >
                        {m} min
                      </button>
                    ))}
                  </div>
                  <label className="mt-3 block text-xs font-bold text-slate-500">
                    Outro valor
                    <input
                      type="number"
                      min={1}
                      className={cn(
                        "mt-1 w-full rounded-xl border-2 p-3 text-base font-semibold",
                        ac.input,
                      )}
                      value={minutes}
                      onChange={(event) =>
                        setMinutes(Number(event.target.value))
                      }
                    />
                  </label>
                </div>

                <label className="mt-6 block font-black text-slate-950">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />O que você estudou ou
                    praticou?
                  </span>
                  <textarea
                    required
                    placeholder="Ex.: capítulo de async/await, 3 exercícios de SQL, revisão de anotações de rede..."
                    className={cn(
                      "mt-2 min-h-28 w-full rounded-xl border-2 p-3 text-sm font-medium",
                      ac.input,
                    )}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                  />
                </label>

                <div className="mt-6">
                  <p className="font-black text-slate-950">
                    Como foi a sessão?
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Escolha o que melhor descreve a qualidade do estudo. Não é
                    emoji, é diagnóstico para você.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {SESSION_MODES.map((item) => {
                      const isOn = mode === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMode(item.id)}
                          className={cn(
                            "flex gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0f172a]",
                            isOn
                              ? cn(
                                  item.activeRing,
                                  "border-slate-900",
                                  item.idleClass,
                                )
                              : item.idleClass,
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-900 bg-white shadow-[2px_2px_0_#0f172a]",
                              isOn && "bg-amber-200",
                            )}
                          >
                            <item.Icon
                              className="h-5 w-5 text-slate-900"
                              strokeWidth={2.25}
                            />
                          </span>
                          <span>
                            <span className="block font-display text-base font-black text-slate-950">
                              {item.label}
                            </span>
                            <span className="mt-1 block text-xs font-medium leading-snug text-slate-600">
                              {item.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-brutal-accent mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 font-black"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar no diário"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <aside className="space-y-5">
                <div
                  className={cn(
                    "card-brutal rounded-2xl p-6 text-white shadow-[5px_5px_0_#0f172a]",
                    ac.tableBanner,
                  )}
                >
                  <p className={cn("text-sm font-bold", ac.tableBannerMuted)}>
                    Sequência (dias com registro)
                  </p>
                  <p className="font-display text-5xl font-black">{streak}</p>
                  <p className="text-sm font-medium opacity-90">
                    Conta só se você registrou hoje ou ontem.
                  </p>
                </div>

                <div className="card-brutal rounded-2xl bg-white p-5 shadow-[5px_5px_0_#0f172a]">
                  <h3 className="font-display text-xl font-black">
                    Últimos 7 dias
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Altura = minutos estudados naquele dia
                  </p>
                  <div className="mt-4 flex h-28 items-end gap-1.5">
                    {weekKeys.map((k) => {
                      const min = minutesByDay[k] || 0;
                      const h = Math.max(8, (min / maxDayMin) * 100);
                      const isToday = k === localDateKey(new Date());
                      return (
                        <div
                          key={k}
                          className="flex flex-1 flex-col items-center gap-1"
                        >
                          <div
                            className={cn(
                              "w-full max-w-[2.5rem] rounded-t-md border-2 border-slate-900 transition-all",
                              min > 0
                                ? cn(ac.progressFill, "opacity-90")
                                : "bg-slate-100",
                              isToday && "ring-2 ring-amber-400 ring-offset-1",
                            )}
                            style={{ height: `${h}%` }}
                            title={`${k}: ${min} min`}
                          />
                          <span className="text-[10px] font-black text-slate-500">
                            {k.slice(8)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-700">
                    Total na semana: {(weekTotalMin / 60).toFixed(1)}h (
                    {weekTotalMin} min)
                  </p>
                </div>

                {/* TODO(Ana): copy da CTA do plano de estudos com IA */}
                {!isPro && !loading ? (
                  <AiCtaLink
                    href="/estudos"
                    description="A IA monta seu cronograma por semana"
                    accent="fuchsia"
                    className="w-full"
                  >
                    Cansou de planejar na mão? Monte seu plano de estudos com IA
                  </AiCtaLink>
                ) : null}
              </aside>

              <div className="card-brutal rounded-2xl bg-white p-6 shadow-[5px_5px_0_#0f172a] lg:col-span-3">
                <h2 className="font-display text-2xl font-black">Histórico</h2>
                {loadingEntries ? (
                  <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                    Carregando histórico...
                  </p>
                ) : entries.length === 0 ? (
                  <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                    Nenhum registro ainda. O primeiro já destrava o gráfico da
                    semana.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {entries.map((entry) => {
                      const meta = SESSION_MODES.find(
                        (m) => m.id === entry.mode,
                      )!;
                      const when = new Date(entry.at);
                      return (
                        <li
                          key={entry.id}
                          className="flex gap-3 rounded-xl border-2 border-slate-100 bg-slate-50/80 p-4 transition-colors hover:border-slate-300"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-slate-900 bg-white shadow-[2px_2px_0_#0f172a]">
                            <meta.Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-500">
                              {when.toLocaleDateString("pt-BR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                timeZone: "America/Sao_Paulo",
                              })}{" "}
                              ·{" "}
                              {when.toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "America/Sao_Paulo",
                              })}{" "}
                              · {entry.minutes} min ·{" "}
                              <span className="text-slate-800">
                                {meta.label}
                              </span>
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">
                              {entry.text}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="self-start rounded-lg border-2 border-slate-200 p-2 text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                            aria-label="Remover registro"
                            onClick={() => removeEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p
                  className={cn(
                    "mt-5 rounded-xl p-4 text-sm font-bold leading-relaxed",
                    ac.panelSoft,
                    ac.tbodyAccent,
                  )}
                >
                  <span className="font-display text-xs uppercase tracking-wide opacity-80">
                    Resumo automático ·{" "}
                  </span>
                  {insight}
                </p>
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  Última escolha no formulário:{" "}
                  <strong className="text-slate-800">
                    {selectedMode.label}
                  </strong>{" "}
                  , {selectedMode.hint}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
