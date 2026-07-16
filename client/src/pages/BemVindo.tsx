import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, type LucideIcon, Sparkles } from "lucide-react";

import SEO from "@/components/SEO";
import CeuEstrelado from "@/components/shared/CeuEstrelado";
import { useAuth } from "@/contexts/AuthContext";
import { updateMyProfile } from "@/services/profileService";
import { PRO_TOOL_ICONS } from "@/lib/proToolIcons";

// TODO(Ana): copy provisoria dos beneficios Pro. Revisar titulos e ordem.
// Icones vem da fonte unica compartilhada com /planos (proToolIcons).
const PRO_BENEFICIOS: { icon: LucideIcon; label: string }[] = [
  { icon: PRO_TOOL_ICONS.avaliadorGithub, label: "Análise de GitHub" },
  { icon: PRO_TOOL_ICONS.avaliadorLinkedin, label: "Otimização de LinkedIn" },
  { icon: PRO_TOOL_ICONS.avaliadorCurriculo, label: "Análise de currículo" },
  { icon: PRO_TOOL_ICONS.planoCarreira, label: "Plano de carreira" }, // TODO(Ana): validar label
  {
    icon: PRO_TOOL_ICONS.simuladorEntrevistas,
    label: "Simulador de entrevista",
  },
  { icon: PRO_TOOL_ICONS.projetosPortfolio, label: "Análise de portfólio" },
  { icon: Sparkles, label: "Ferramentas exclusivas" },
];

export default function BemVindo() {
  const reduce = useReducedMotion();
  const [, setLocation] = useLocation();
  const { profile, refreshProfile } = useAuth();
  // Opt-in de comunicacao promocional: DESMARCADO por default, escolha
  // explicita. Editavel depois no perfil.
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Quem ja concluiu o onboarding nao ve a tela de novo: redireciona pro perfil.
  // O sinal de "ja fez onboarding" e SO o perfil. Enquanto profile e null/
  // undefined (carregando), nao redireciona: o recem-cadastrado, que tem
  // onboarding_completed = false, permanece na tela. O fallback local
  // (bnt_onboarding_done) so existe apos a pessoa AGIR e o PATCH falhar, nunca
  // e gravado no signup.
  useEffect(() => {
    const jaOnboardado =
      profile?.onboarding_completed === true ||
      (typeof window !== "undefined" &&
        window.localStorage.getItem("bnt_onboarding_done") === "true");
    if (jaOnboardado) setLocation("/perfil", { replace: true });
  }, [profile, setLocation]);

  // Marca onboarding_completed no perfil (PATCH). Se falhar, grava o fallback
  // local pra nao prender a pessoa nesta tela num retorno futuro. Leva junto
  // a escolha de opt-in de marketing (o carimbo e gravado pelo server).
  function marcarOnboarding() {
    // So grava o opt-in quando marcado AQUI. NUNCA grava false: o default do banco
    // ja e false, e um false aqui poderia sobrescrever um opt-in feito no cadastro,
    // que chega via PATCH concorrente no SIGNED_IN. Por isso omitimos o campo em vez
    // de mandar false. Idempotente.
    const updates: Record<string, unknown> = { onboarding_completed: true };
    if (marketingOptIn) {
      updates.marketing_opt_in = true;
    }
    void updateMyProfile(updates)
      .then(() => refreshProfile())
      .catch(() => {
        try {
          window.localStorage.setItem("bnt_onboarding_done", "true");
        } catch {
          // localStorage indisponivel; a navegacao segue mesmo assim.
        }
      });
  }

  // TODO: trocar pra /onboarding quando a rota existir.
  function irParaPrimeirosPassos() {
    marcarOnboarding();
    setLocation("/quiz-carreira");
  }

  function irParaExplorar() {
    marcarOnboarding();
    setLocation("/areas");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <SEO
        title="Boas vindas · Bora na Tech?"
        description="Sua conta foi criada. Comece sua jornada em tecnologia."
        url="/bem-vindo"
        noindex
      />
      <CeuEstrelado />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 mx-auto w-full max-w-2xl text-center"
      >
        {/* TODO(Ana): titulo e subtitulo de boas-vindas (copy provisoria). */}
        <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
          Boas vindas ao{" "}
          <span
            className="text-amber-400"
            style={{ textShadow: "0 0 22px rgba(255,184,0,0.45)" }}
          >
            Bora na Tech!
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base font-medium text-slate-300">
          Sua conta tá pronta. Vamos te mostrar o caminho do primeiro passo até
          a primeira vaga.
        </p>

        {/* So oferece o opt-in a quem ainda nao optou. Quem marcou no cadastro
            (profile.marketing_opt_in === true) nao e perguntado de novo. Usuarios
            antigos (default false) continuam vendo normalmente. */}
        {profile?.marketing_opt_in !== true && (
          <label className="mx-auto mt-6 flex max-w-md cursor-pointer items-start justify-center gap-2 text-left text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(event) => setMarketingOptIn(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
            />
            {/* TODO(Ana): texto do consentimento de comunicação promocional. */}
            <span>
              Aceito receber e-mails com novidades e promoções do Bora na Tech.
              Dá pra mudar isso no perfil quando quiser.
            </span>
          </label>
        )}

        {/* Botao primario: Primeiros passos. */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={irParaPrimeirosPassos}
            className="bnt-pressable group inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-8 py-4 font-display font-black text-slate-950 shadow-[4px_4px_0_#0f172a] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0f172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {/* TODO(Ana): rotulo do botao primario. */}
            Primeiros passos
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </button>
          {/* TODO(Ana): linha discreta indicando que leva ao onboarding. */}
          <p className="text-xs font-medium text-slate-400">
            Leva a um passo a passo rápido pra te situar.
          </p>
        </div>

        {/* Link secundario discreto. */}
        {/* TODO(Ana): rotulo do link secundario. */}
        <button
          type="button"
          onClick={irParaExplorar}
          className="mt-5 inline-block text-sm font-bold text-slate-400 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Explorar por conta própria
        </button>

        {/* Bloco Pro compacto. */}
        <div className="mt-10 rounded-2xl border-2 border-amber-400/30 bg-white/5 p-5 text-left md:p-6">
          <div className="flex items-center gap-2">
            <Sparkles
              size={18}
              className="text-amber-400"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            {/* TODO(Ana): nome e chamada do bloco Pro. */}
            <h2
              className="font-display text-lg font-black text-amber-400"
              style={{ textShadow: "0 0 16px rgba(255,184,0,0.4)" }}
            >
              Bora na Tech Pro
            </h2>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-300">
            Tudo que acelera sua entrada em TI, com IA:
          </p>

          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
            {PRO_BENEFICIOS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm font-medium text-slate-200"
              >
                <Icon
                  size={16}
                  className="shrink-0 text-amber-400"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          {/* TODO(Ana): rotulo do link para a pagina Pro. */}
          <Link
            href="/planos"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-amber-400 underline-offset-4 transition-colors hover:text-amber-300 hover:underline"
          >
            Conhecer o Pro
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
