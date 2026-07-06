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
  logoUrl?: string;
  idioma?: string;
  externo?: boolean;
}

interface MiniQuizProps {
  titulo: string;
  subtitulo?: string;
  perguntas: MiniQuizPergunta[];
  resultados: Record<string, MiniQuizResultado>;
  alternativas?: number;
  porque?: string;
  // Opcional: quando presente e retorna false, bloqueia o avanco da resposta.
  // Usado por paginas que gateiam o quiz; ausente = comportamento padrao.
  onBeforeAnswer?: () => boolean;
}

function ResultadoLogo({
  nome,
  logoUrl,
}: {
  nome: string;
  logoUrl?: string;
}) {
  const [errored, setErrored] = useState(false);
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-[2px_2px_0_#0f172a]">
      {!logoUrl || errored ? (
        <span className="font-display text-sm font-black text-violet-700">
          {nome.charAt(0).toUpperCase()}
        </span>
      ) : (
        <img
          src={logoUrl}
          alt={`Logo ${nome}`}
          className="h-7 w-7 object-contain"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      )}
    </span>
  );
}

export default function MiniQuiz({
  titulo,
  subtitulo,
  perguntas,
  resultados,
  alternativas,
  porque,
  onBeforeAnswer,
}: MiniQuizProps) {
  const [step, setStep] = useState(0);
  const [pontos, setPontos] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const total = perguntas.length;
  const perguntaAtual = perguntas[step];

  function escolher(opcao: MiniQuizOpcao) {
    if (onBeforeAnswer && !onBeforeAnswer()) return;
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

  const ranked = [...chaves].sort(
    (a, b) => (pontos[b] ?? 0) - (pontos[a] ?? 0),
  );
  const vencedora = resultados[ranked[0]] ?? resultado;
  const alternativasList =
    alternativas !== undefined
      ? ranked.slice(1, 1 + alternativas).map((chave) => resultados[chave])
      : [];

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
      ) : alternativas !== undefined ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="rounded-xl border-2 border-violet-300 bg-violet-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-violet-700">
              Sua recomendação
            </p>
            <div className="mt-3 flex items-start gap-3">
              <ResultadoLogo
                nome={vencedora.titulo}
                logoUrl={vencedora.logoUrl}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-display text-xl font-black text-slate-950">
                    {vencedora.titulo}
                  </h4>
                  {vencedora.idioma ? (
                    <span className="rounded-full border-2 border-slate-900 bg-white px-2 py-0.5 text-[11px] font-black text-slate-700">
                      {vencedora.idioma}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {vencedora.descricao}
                </p>
              </div>
            </div>
            {porque ? (
              <p className="mt-3 text-sm font-bold text-violet-800">{porque}</p>
            ) : null}
            {vencedora.acaoRotulo && vencedora.acaoHref ? (
              vencedora.externo ? (
                <a
                  href={vencedora.acaoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-brutal-accent mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black"
                >
                  {vencedora.acaoRotulo}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  href={vencedora.acaoHref}
                  className="btn-brutal-accent mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black"
                >
                  {vencedora.acaoRotulo}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )
            ) : null}
          </div>

          {alternativasList.length ? (
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Também combinam
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {alternativasList.map((alt) => {
                  const conteudo = (
                    <>
                      <ResultadoLogo nome={alt.titulo} logoUrl={alt.logoUrl} />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate font-display text-sm font-black text-slate-950">
                            {alt.titulo}
                          </span>
                          {alt.idioma ? (
                            <span className="shrink-0 rounded-full border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[10px] font-black text-slate-600">
                              {alt.idioma}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </>
                  );
                  return alt.externo && alt.acaoHref ? (
                    <a
                      key={alt.titulo}
                      href={alt.acaoHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border-2 border-slate-900 bg-white p-3 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                    >
                      {conteudo}
                    </a>
                  ) : alt.acaoHref ? (
                    <Link
                      key={alt.titulo}
                      href={alt.acaoHref}
                      className="flex items-center gap-3 rounded-xl border-2 border-slate-900 bg-white p-3 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                    >
                      {conteudo}
                    </Link>
                  ) : (
                    <div
                      key={alt.titulo}
                      className="flex items-center gap-3 rounded-xl border-2 border-slate-900 bg-white p-3 shadow-[2px_2px_0_#0f172a]"
                    >
                      {conteudo}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={refazer}
            className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[3px_3px_0_#0f172a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
          >
            <RotateCcw className="h-4 w-4" />
            Refazer
          </button>
        </motion.div>
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
