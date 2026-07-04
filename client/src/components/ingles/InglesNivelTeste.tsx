import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  ChevronLeft,
  Lock,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { type EnglishLevel } from "@/lib/careerToolsData";

type Pergunta = {
  enunciado: string;
  opcoes: [string, string, string, string];
  correta: number;
};

const PERGUNTAS: Pergunta[] = [
  {
    enunciado: "In programming, a 'bug' is a ___.",
    opcoes: ["a new feature", "a defect or error", "a type of user", "a backup file"],
    correta: 1,
  },
  {
    enunciado: "She ___ code every day.",
    opcoes: ["write", "is write", "writes", "writing"],
    correta: 2,
  },
  {
    enunciado: "The message 'File not found' means the file ___.",
    opcoes: ["was saved", "is open", "does not exist at that path", "is too large"],
    correta: 2,
  },
  {
    enunciado: "Click 'Submit' to ___ the form.",
    opcoes: ["delete", "send", "print", "close"],
    correta: 1,
  },
  {
    enunciado: "The opposite of 'remote work' is ___ work.",
    opcoes: ["fast", "on-site", "online", "free"],
    correta: 1,
  },
  {
    enunciado: "If the tests ___, the deploy is blocked.",
    opcoes: ["fail", "fails", "will fail", "failing"],
    correta: 0,
  },
  {
    enunciado: "A 'deprecated' function ___.",
    opcoes: ["is brand new", "should no longer be used", "runs faster", "is more secure"],
    correta: 1,
  },
  {
    enunciado: "I'm responsible ___ the backend.",
    opcoes: ["of", "to", "for", "about"],
    correta: 2,
  },
  {
    enunciado: "The API returns data ___ JSON format.",
    opcoes: ["on", "at", "in", "by"],
    correta: 2,
  },
  {
    enunciado: "'Please review my pull request' asks you to ___.",
    opcoes: [
      "merge it right away",
      "look at the code and give feedback",
      "delete the branch",
      "open a new issue",
    ],
    correta: 1,
  },
  {
    enunciado: "If I ___ more time, I would refactor this.",
    opcoes: ["have", "will have", "had", "have had"],
    correta: 2,
  },
  {
    enunciado: "To 'roll back' a release means to ___.",
    opcoes: ["speed it up", "revert to a previous version", "document it", "scale it up"],
    correta: 1,
  },
  {
    enunciado: "The migration ___ before the meeting.",
    opcoes: ["will run", "will running", "will be run", "is ran"],
    correta: 2,
  },
  {
    enunciado: "If a process is 'error-prone', it ___.",
    opcoes: [
      "prevents errors",
      "tends to cause errors",
      "logs errors automatically",
      "fixes errors",
    ],
    correta: 1,
  },
  {
    enunciado: "'Let's not reinvent the wheel' suggests we should ___.",
    opcoes: [
      "build it from scratch",
      "reuse an existing solution",
      "remove the feature",
      "rewrite everything",
    ],
    correta: 1,
  },
];

type ResultadoNivel = {
  level: EnglishLevel;
  frase: string;
  cardClass: string;
  chipClass: string;
};

function nivelPorAcertos(acertos: number): ResultadoNivel {
  if (acertos <= 6) {
    return {
      level: "Básico",
      frase: "Ótimo ponto de partida. Contato diário com inglês técnico vai te levar longe.",
      cardClass: "bg-sky-50",
      chipClass: "bg-sky-200 text-sky-900",
    };
  }
  if (acertos <= 11) {
    return {
      level: "Intermediário",
      frase: "Você já se vira bem. Agora é ganhar naturalidade em conversa e escrita.",
      cardClass: "bg-violet-50",
      chipClass: "bg-violet-200 text-violet-900",
    };
  }
  return {
    level: "Avançado",
    frase: "Mandou muito bem. Você já está pronto para ambientes internacionais.",
    cardClass: "bg-amber-50",
    chipClass: "bg-amber-200 text-amber-900",
  };
}

const LETRAS = ["A", "B", "C", "D"];

export default function InglesNivelTeste() {
  const { user } = useAuth();
  const [respostas, setRespostas] = useState<(number | null)[]>(() =>
    PERGUNTAS.map(() => null),
  );
  const [atual, setAtual] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  if (!user) {
    return (
      <div className="card-brutal rounded-2xl bg-white p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-900 bg-amber-300 shadow-[3px_3px_0_#0f172a]">
          <Lock className="h-6 w-6 text-slate-950" aria-hidden />
        </span>
        <h3 className="font-display mt-5 text-2xl font-black text-slate-950">
          Faça login para descobrir seu nível
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          O teste de nível de inglês é gratuito e leva poucos minutos. Crie sua
          conta para responder e receber seu resultado.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/cadastro"
            className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-[#FFB800] px-6 py-3 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/login"
            className="text-sm font-black text-slate-700 underline decoration-2 underline-offset-4 hover:text-slate-950"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    );
  }

  if (finalizado) {
    const acertos = respostas.reduce<number>(
      (soma, resposta, i) => (resposta === PERGUNTAS[i].correta ? soma + 1 : soma),
      0,
    );
    const resultado = nivelPorAcertos(acertos);

    return (
      <div
        className={`card-brutal rounded-2xl p-8 text-center ${resultado.cardClass}`}
        role="status"
        aria-live="polite"
      >
        <span className="social-badge mx-auto inline-flex px-3 py-1 text-xs font-black uppercase">
          seu resultado
        </span>
        <h3 className="font-display mt-4 text-xl font-black text-slate-950">
          Seu nível de inglês é
        </h3>
        <p
          className={`font-display mx-auto mt-3 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 px-6 py-2 text-3xl font-black shadow-[3px_3px_0_#0f172a] ${resultado.chipClass}`}
        >
          <BadgeCheck className="h-7 w-7" aria-hidden />
          {resultado.level}
        </p>
        <p className="mt-4 text-lg font-black text-slate-950">
          {acertos} de {PERGUNTAS.length} acertos
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-700">
          {resultado.frase}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setRespostas(PERGUNTAS.map(() => null));
              setAtual(0);
              setFinalizado(false);
            }}
            className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Refazer o teste
          </button>
          <a
            href="#montar-trilha"
            className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-[3px_3px_0_#0f172a]"
          >
            Montar minha trilha
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    );
  }

  const pergunta = PERGUNTAS[atual];
  const selecionada = respostas[atual];
  const progresso = ((atual + 1) / PERGUNTAS.length) * 100;
  const ultima = atual === PERGUNTAS.length - 1;

  const escolher = (indice: number) => {
    setRespostas((anteriores) => {
      const proximas = [...anteriores];
      proximas[atual] = indice;
      return proximas;
    });
  };

  return (
    <div className="card-brutal rounded-2xl bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          Pergunta {atual + 1} de {PERGUNTAS.length}
        </p>
        <p className="text-xs font-black text-slate-500">
          {Math.round(progresso)}%
        </p>
      </div>
      <div
        className="mt-2 h-3 w-full overflow-hidden rounded-full border-2 border-slate-900 bg-white"
        role="progressbar"
        aria-valuenow={atual + 1}
        aria-valuemin={1}
        aria-valuemax={PERGUNTAS.length}
        aria-label="Progresso do teste"
      >
        <div
          className="h-full bg-sky-400 transition-all"
          style={{ width: `${progresso}%` }}
        />
      </div>

      <h3 className="font-display mt-6 text-xl font-black text-slate-950">
        {pergunta.enunciado}
      </h3>

      <div className="mt-5 grid gap-3" role="group" aria-label="Opções de resposta">
        {pergunta.opcoes.map((opcao, indice) => {
          const ativa = selecionada === indice;
          return (
            <button
              key={opcao}
              type="button"
              onClick={() => escolher(indice)}
              aria-pressed={ativa}
              className={`flex items-center gap-3 rounded-xl border-2 border-slate-900 px-4 py-3 text-left text-sm font-bold text-slate-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 ${
                ativa
                  ? "bg-sky-100 shadow-[3px_3px_0_#0f172a]"
                  : "bg-white hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0f172a]"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-black ${
                  ativa ? "bg-sky-400 text-slate-950" : "bg-white text-slate-700"
                }`}
                aria-hidden
              >
                {LETRAS[indice]}
              </span>
              <span>{opcao}</span>
              {ativa ? (
                <CheckCircle className="ml-auto h-5 w-5 text-sky-700" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setAtual((v) => Math.max(0, v - 1))}
          disabled={atual === 0}
          className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Voltar
        </button>
        <button
          type="button"
          onClick={() => {
            if (ultima) {
              setFinalizado(true);
            } else {
              setAtual((v) => Math.min(PERGUNTAS.length - 1, v + 1));
            }
          }}
          disabled={selecionada === null}
          className="bnt-pressable inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-[#FFB800] px-6 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ultima ? "Ver resultado" : "Próxima"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
