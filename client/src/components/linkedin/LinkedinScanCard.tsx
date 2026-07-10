import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Linkedin } from "lucide-react";
import { AREA_LABELS, type AreaSlug } from "@shared/areas";
import {
  LINKEDIN_LEVEL_LABELS,
  type LinkedinLevel,
} from "@shared/linkedin/schema";

// TODO(Ana): revisar os rotulos do scan. Eles descrevem o pipeline REAL do
// analisador de LinkedIn (o texto do PDF ja foi extraido e parseado no
// navegador; o server roda as checagens deterministicas de recrutador e faz
// 1 chamada de IA para os textos) e rodam em loop rotativo, sem prometer
// conclusao de etapa nem porcentagem: a resposta e unica e o client nao sabe
// em que etapa o server esta de verdade.
const SCAN_STEPS = [
  "Conferindo o texto do seu perfil...",
  "Rodando as checagens de recrutador...",
  "Buscando as palavras-chave da sua área...",
  "Escrevendo seus textos com a IA...",
];

// Card de scan do estado de analise, no molde do ScanCard do GitHub: ancora
// HONESTA no topo (o icone do LinkedIn + chips com a area e o nivel que o
// proprio usuario informou no formulario, nada inventado), shimmer
// INDETERMINADO (nunca porcentagem) e rotulo rotativo a cada 2.5s. reduce:
// barra estatica e troca de texto sem fade.
export default function LinkedinScanCard({
  area,
  level,
  reduce,
}: {
  area: AreaSlug;
  level: LinkedinLevel;
  reduce: boolean;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setStep((s) => (s + 1) % SCAN_STEPS.length),
      2500,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="status"
      className="card-brutal mx-auto max-w-3xl rounded-2xl border-slate-950 bg-white p-8 text-center"
    >
      <div className="flex flex-col items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-950 bg-sky-600 text-white shadow-[3px_3px_0_#0f172a]"
          aria-hidden
        >
          <Linkedin className="h-6 w-6" />
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-700">
            {AREA_LABELS[area]}
          </span>
          <span className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black text-slate-700">
            {LINKEDIN_LEVEL_LABELS[level]}
          </span>
        </div>
      </div>
      <div className="mx-auto mt-6 h-3 w-full max-w-sm overflow-hidden rounded-full border-2 border-slate-900 bg-slate-100">
        {reduce ? (
          <div className="h-full w-full bg-sky-300" />
        ) : (
          <motion.div
            className="h-full w-1/3 rounded-full bg-sky-500"
            animate={{ x: ["-110%", "320%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <div className="mt-4 min-h-[1.5rem] text-sm font-bold text-slate-600">
        {reduce ? (
          <p>{SCAN_STEPS[step]}</p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {SCAN_STEPS[step]}
            </motion.p>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
