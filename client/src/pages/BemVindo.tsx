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
  const { profile, profileStatus, refreshProfile } = useAuth();
  // Item 5.2. "Nunca perguntado" e `marketing_opt_in_at == null`, e nao mais
  // `marketing_opt_in !== true`.
  //
  // A condicao antiga nao distinguia "nunca perguntei" de "perguntei e a pessoa
  // disse nao", porque as duas situacoes davam `marketing_opt_in === false`. O
  // resultado era o card voltando a perguntar a quem ja tinha dispensado, toda vez.
  // O carimbo agora e gravado nas DUAS respostas (ver server/routes/me.ts), entao
  // `null` significa exatamente uma coisa: ninguem perguntou ainda.
  //
  // A exigencia de `profileStatus === "ready"` continua: antes de o profile
  // carregar nao da para saber, e em "error" tambem nao. Sem certeza, nao
  // perguntamos e nao escrevemos.
  const optInColetavel =
    profileStatus === "ready" && profile?.marketing_opt_in_at == null;
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
    // Item 5.3. `marketing_opt_in` entra no PATCH sempre que o card foi EXIBIDO,
    // com o valor que a pessoa deixou: marcado grava true, dispensado grava false.
    //
    // Antes, dispensar nao gravava nada, e como "nao gravou nada" era
    // indistinguivel de "nunca perguntei", o card voltava a perguntar na proxima
    // visita. Gravar o false (e, com ele, o carimbo do servidor) e o que encerra a
    // pergunta: depois de registrada, a decisao nao e refeita.
    //
    // A ressalva antiga sobre sobrescrever um opt-in do cadastro morreu junto com
    // o item 5.1: nao existe mais coleta de marketing no cadastro, entao nao ha
    // PATCH concorrente com o qual competir. E o que este card nao exibiu ele
    // continua nao escrevendo: fora de `optInColetavel`, o campo e omitido e o
    // PATCH parcial nao toca no valor existente.
    const updates: Record<string, unknown> = { onboarding_completed: true };
    if (optInColetavel) {
      updates.marketing_opt_in = marketingOptIn;
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

        {/* Item 5.5. O marketing NUNCA bloqueia nada e NUNCA e modal: e um card
            dispensavel, e seguir sem marcar e uma resposta valida (registrada como
            `false`), nao uma pergunta adiada.

            So aparece para quem ainda nao foi perguntado (optInColetavel), e SO
            depois do profile carregar: renderizar antes causava flicker e abria
            janela pra perguntar a quem ja tinha respondido. */}
        {optInColetavel && (
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
