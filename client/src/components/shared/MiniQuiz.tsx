import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, RotateCcw } from "lucide-react";

export interface MiniQuizOpcao {
  rotulo: string;
  pontosPara: string[];
}
export interface MiniQuizPergunta {
  id: string;
  pergunta: string;
  opcoes: MiniQuizOpcao[];
}
export interface MiniQuizResultado {
  titulo: string;
  descricao: string;
  acaoRotulo?: string;
  acaoHref?: string;
}

interface MiniQuizProps {
  titulo: string;
  subtitulo?: string;
  perguntas: MiniQuizPergunta[];
  resultados: Record<string, MiniQuizResultado>;
}

export default function MiniQuiz({
  titulo,
  subtitulo,
  perguntas,
  resultados,
}: MiniQuizProps) {
  const [step, setStep] = useState(0);
  const [pontos, setPontos] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const total = perguntas.length;
  const perguntaAtual = perguntas[step];

  function escolher(opcao: MiniQuizOpcao) {
    setPontos((prev) => {
      const next = { ...prev };
      opcao.pontosPara.forEach((chave) => {
        next[chave] = (next[chave] ?? 0) + 1;
      });
      return next;
    });
    if (step + 1 >= total) {
      setFinished(true);
    } else {
      setStep((atual) => atual + 1);
    }
  }

  function refazer() {
    setStep(0);
    setPontos({});
    setFinished(false);
  }

  const chaves = Object.keys(resultados);
  const chaveVencedora = chaves.reduce(
    (melhor, chave) =>
      (pontos[chave] ?? 0) > (pontos[melhor] ?? 0) ? chave : melhor,
    chaves[0],
  );
  const resultado = resultados[chaveVencedora];

  return (
    <div className="card-brutal rounded-2xl border-2 border-slate-900 bg-white p-6">
      <div className="mb-5">
        <h3 className="font-display text-2xl font-black text-slate-950">
          {titulo}
        </h3>
        {subtitulo ? (
          <p className="mt-1 text-sm text-slate-600">{subtitulo}</p>
        ) : null}
      </div>

      {!finished ? (
        <div>
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-wide text-violet-700">
              Pergunta {step + 1} de {total}
            </p>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border-2 border-slate-900 bg-violet-50">
              <div
                className="h-full rounded-full bg-violet-600 transition-all duration-300"
                style={{ width: `${(step / total) * 100}%` }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={perguntaAtual.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-display text-lg font-black text-slate-950">
                {perguntaAtual.pergunta}
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                {perguntaAtual.opcoes.map((opcao) => (
                  <button
                    key={opcao.rotulo}
                    type="button"
                    onClick={() => escolher(opcao)}
                    className="rounded-full border-2 border-slate-900 bg-white px-4 py-2.5 text-left text-sm font-bold text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-px hover:bg-violet-50 hover:shadow-[3px_3px_0_#0f172a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                  >
                    {opcao.rotulo}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="rounded-xl border-2 border-violet-300 bg-violet-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-violet-700">
              Seu resultado
            </p>
            <h4 className="mt-1 font-display text-xl font-black text-slate-950">
              {resultado.titulo}
            </h4>
            <p className="mt-2 text-sm text-slate-600">{resultado.descricao}</p>
            {resultado.acaoRotulo && resultado.acaoHref ? (
              <Link
                href={resultado.acaoHref}
                className="btn-brutal-accent mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black"
              >
                {resultado.acaoRotulo}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
          <button
            type="button"
            onClick={refazer}
            className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
          >
            <RotateCcw className="h-4 w-4" />
            Refazer
          </button>
        </motion.div>
      )}
    </div>
  );
}
