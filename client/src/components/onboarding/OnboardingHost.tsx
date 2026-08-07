import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "wouter";

import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingCoordinator } from "@/lib/onboarding/coordinator";
import { resolveRouteOnboarding } from "@/lib/onboarding/registry";
import {
  hasSeenOnboarding,
  markOnboardingSeen,
  migrateLocalRecordsToProfile,
} from "@/lib/onboarding/storage";
import type { OnboardingDef, OnboardingHow } from "@/lib/onboarding/types";
import type { OnboardingResultData } from "./OnboardingStories";

// Ponto UNICO de montagem do onboarding por rota. Irmao do <SuperInterstitial/>
// em App.tsx, dentro do ConsentGate: so existe depois que launch e consent
// liberam os children.
//
// O motor entra por lazy() para o CSS e os icones ficarem fora do bundle
// inicial; o conteudo dos passos entra pelo import dinamico do registry.

const OnboardingStories = lazy(() => import("./OnboardingStories"));

export default function OnboardingHost() {
  const [location] = useLocation();
  const { user, profile, profileStatus, loading } = useAuth();
  const { decision, claimForOnboarding, releaseToOthers, beginDecision } =
    useOnboardingCoordinator();

  const [open, setOpen] = useState(false);
  const [def, setDef] = useState<OnboardingDef | null>(null);
  const routeKeyRef = useRef<string | null>(null);

  // routeKeys ENCERRADOS nesta carga de pagina (concluidos ou pulados).
  //
  // Existe porque a persistencia do logado vai para `profiles.preferences` e o
  // AuthContext so enxerga o registro novo no proximo refresh do perfil: sem
  // isto, voltar para a mesma rota reabriria o onboarding que a pessoa acabou
  // de fechar.
  //
  // Preenchido no ENCERRAMENTO, nunca na abertura. Quem sai da pagina no meio
  // do onboarding nao decidiu nada, entao ele reabre ao voltar, na mesma carga
  // ou em outra.
  const handledRef = useRef<Set<string>>(new Set());

  const signedIn = Boolean(user);
  // Esperar o AuthContext resolver antes de decidir: abrir para quem esta
  // logado e ja viu (porque o perfil ainda nao chegou) e o erro que a espera
  // existe para evitar. 'error' tambem conta como resolvido, senao um /api/me
  // fora do ar deixaria o onboarding preso em "deciding" para sempre.
  const authResolved =
    !loading &&
    (!signedIn || profileStatus === "ready" || profileStatus === "error");

  /* --- migracao anonimo -> logado, uma vez por sessao ------------------- */
  const migratedRef = useRef(false);
  useEffect(() => {
    if (!signedIn || !authResolved || migratedRef.current) return;
    migratedRef.current = true;
    void migrateLocalRecordsToProfile(profile);
  }, [signedIn, authResolved, profile]);

  /* --- decisao por rota ------------------------------------------------ */
  useEffect(() => {
    let cancelled = false;

    // Rota nova: fecha o que estiver aberto SEM marcar como visto. Quem sai da
    // pagina no meio do onboarding nao decidiu nada, entao ele reaparece na
    // proxima visita. Marcar aqui trocaria "nao terminei" por "ja vi".
    setOpen(false);
    setDef(null);
    beginDecision();

    const settle = () => {
      if (!cancelled) releaseToOthers();
    };

    // Prerender e automacao (puppeteer no scripts/prerender.mjs) nunca veem o
    // overlay: ele entraria no HTML estatico servido pela Vercel.
    if (typeof navigator !== "undefined" && navigator.webdriver === true) {
      settle();
      return () => {
        cancelled = true;
      };
    }

    const resolved = resolveRouteOnboarding(location.split("?")[0]);
    if (!resolved || resolved.entry.type !== "onboarding") {
      settle();
      return () => {
        cancelled = true;
      };
    }

    const { routeKey, entry } = resolved;
    if (handledRef.current.has(routeKey)) {
      settle();
      return () => {
        cancelled = true;
      };
    }

    if (!authResolved) {
      // Continua em "deciding": ninguem abre enquanto nao souber.
      return () => {
        cancelled = true;
      };
    }

    if (hasSeenOnboarding(routeKey, profile)) {
      handledRef.current.add(routeKey);
      settle();
      return () => {
        cancelled = true;
      };
    }

    // Reivindica ANTES do import: o import pode demorar, e nessa janela o
    // SuperInterstitial nao pode se antecipar. Se o import falhar, solta.
    claimForOnboarding();
    routeKeyRef.current = routeKey;

    entry
      .load()
      .then((module) => {
        if (cancelled) return;
        setDef(module.default);
        setOpen(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Chunk fora do ar (deploy no meio da sessao) nao pode derrubar a
        // pagina: o onboarding e acessorio. Solta a vez e segue. Entra em
        // `handled` para nao repetir a tentativa (e o aviso) a cada navegacao
        // de volta nesta mesma carga.
        console.warn("[onboarding] falha ao carregar os passos", error);
        handledRef.current.add(routeKey);
        settle();
      });

    return () => {
      cancelled = true;
    };
    // `profile` fora das dependencias de proposito: ele muda a cada refresh do
    // AuthContext, e reexecutar a decisao a cada mudanca reabriria o overlay
    // que a pessoa acabou de fechar. O que importa e o valor no momento em que
    // a rota resolve, e `authResolved` ja garante que ele chegou.
  }, [location, authResolved]);

  /* --- travar a rolagem da pagina de baixo ------------------------------ */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleFinish = useCallback(
    (how: OnboardingHow, data: OnboardingResultData) => {
      const routeKey = routeKeyRef.current;
      // Fecha ANTES de persistir: a escrita e de rede e a pessoa ja decidiu.
      setOpen(false);
      setDef(null);
      if (!routeKey) return;
      handledRef.current.add(routeKey);
      void markOnboardingSeen({
        routeKey,
        profile,
        signedIn,
        record: {
          seen: true,
          how,
          at: new Date().toISOString(),
          ...(data.perfil || data.tour ? { data } : {}),
        },
      });
    },
    [profile, signedIn],
  );

  if (!open || !def) return null;
  // `decision` so pode ser "onboarding" aqui: quem abre e o mesmo efeito que
  // reivindica. A checagem existe para o invariante ficar legivel no codigo.
  if (decision !== "onboarding") return null;

  return (
    <Suspense fallback={null}>
      <OnboardingStories def={def} onFinish={handleFinish} />
    </Suspense>
  );
}
