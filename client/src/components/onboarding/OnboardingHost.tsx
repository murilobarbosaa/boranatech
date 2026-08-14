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
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useOnboardingCoordinator } from "@/lib/onboarding/coordinator";
import { foiEncerrado, marcarEncerrado } from "@/lib/onboarding/encerrados";
import { resolveRouteOnboarding } from "@/lib/onboarding/registry";
import {
  hasSeenOnboarding,
  markOnboardingSeen,
  migrateLocalRecordsToProfile,
} from "@/lib/onboarding/storage";
import { encerrarTour, iniciarTour, tourAtivo } from "@/lib/onboarding/tour";
import { proximaRotaDoTour } from "@/lib/onboarding/tourOrder";
import type { OnboardingDef, OnboardingHow } from "@/lib/onboarding/types";
import type { OnboardingResultData } from "./OnboardingStories";

// Ponto UNICO de montagem do onboarding por rota. Irmao do <SuperInterstitial/>
// em App.tsx, dentro do ConsentGate: so existe depois que launch e consent
// liberam os children.
//
// O motor entra por lazy() para o CSS e os icones ficarem fora do bundle
// inicial; o conteudo dos passos entra pelo import dinamico do registry.

const OnboardingStories = lazy(() => import("./OnboardingStories"));

/**
 * Quanto o overlay espera, depois de DECIDIR abrir, antes de aparecer. Existe
 * para a pessoa ver a pagina primeiro: onboarding que cobre a tela no instante
 * do carregamento e indistinguivel de um pop-up.
 *
 * Nao adia a PRECEDENCIA. O coordenador e reivindicado na decisao, nao aqui,
 * senao o SuperInterstitial abriria dentro desta janela e os dois apareceriam.
 */
export const DELAY_ABERTURA_MS = 2500;

/**
 * Duracao da animacao de saida, casada com `.bnt-onb.saindo` do onboarding.css.
 * O host so desmonta depois dela; com movimento reduzido a animacao tem duracao
 * zerada pelo CSS e aqui o valor vira 0, senao ficaria um overlay invisivel
 * segurando o scroll lock por 220ms.
 */
export const SAIDA_MS = 220;

/**
 * Cadencia DENTRO do tour guiado, mais curta que a abertura avulsa.
 *
 * Os 2500ms existem para a pessoa ver a pagina antes de ser interrompida. No
 * tour ela PEDIU para ser levada de tela em tela, entao o mesmo intervalo vira
 * espera. 1500ms ainda da tempo de a pagina pintar e registrar onde chegou.
 */
export const DELAY_TOUR_MS = 1500;

export default function OnboardingHost() {
  const [location, navigate] = useLocation();
  const { user, profile, profileStatus, loading } = useAuth();
  const { decision, claimForOnboarding, releaseToOthers, beginDecision } =
    useOnboardingCoordinator();

  const reducedMotion = usePrefersReducedMotion();

  const [open, setOpen] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [def, setDef] = useState<OnboardingDef | null>(null);
  const routeKeyRef = useRef<string | null>(null);

  // Timers vivos: o do atraso de abertura e o da animacao de saida. Ficam em
  // ref para o efeito de rota poder cancelar os dois sem depender de estado.
  const timersRef = useRef<number[]>([]);
  const limparTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  // routeKeys ENCERRADOS nesta carga de pagina (concluidos ou pulados) moram em
  // `@/lib/onboarding/encerrados`, fora do componente.
  //
  // Existe porque a persistencia do logado vai para `profiles.preferences` e o
  // AuthContext so enxerga o registro novo no proximo refresh do perfil: sem
  // isto, voltar para a mesma rota reabriria o onboarding que a pessoa acabou
  // de fechar.
  //
  // FORA do componente porque o escopo e a CARGA, e ref e escopo de MONTAGEM: o
  // host remonta dentro da mesma carga (o ConsentGate desmonta os children a
  // cada re-checagem) e o registro em ref nascia vazio.
  //
  // Preenchido no ENCERRAMENTO, nunca na abertura. Quem sai da pagina no meio
  // do onboarding nao decidiu nada, entao ele reabre ao voltar, na mesma carga
  // ou em outra.
  const donoDosRegistros = user?.id ?? null;

  // Rota para onde o tour acabou de navegar. Serve para detectar guarda: se a
  // location que chegar nao for esta, alguem redirecionou (RequireAuth manda
  // para /cadastro) e a sequencia pula esse item em vez de despejar a pessoa
  // numa tela de login no meio do tour.
  const alvoDoTourRef = useRef<string | null>(null);

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

  // Perfil e dono por ref: `jaViu` (e portanto `avancarTour`, e portanto o
  // efeito de decisao) NAO pode trocar de identidade quando o AuthContext
  // refaz o fetch do perfil. Trocando, o efeito reexecutava a cada
  // TOKEN_REFRESHED e o overlay ABERTO sumia e voltava do primeiro card. E a
  // mesma razao pela qual `profile` esta fora das dependencias do efeito; sem
  // as refs, ele entrava de novo por esta porta.
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const donoRef = useRef(donoDosRegistros);
  donoRef.current = donoDosRegistros;

  /**
   * Ja viu? Soma o que esta persistido com o que foi encerrado NESTA carga.
   *
   * O registro da carga entra porque a persistencia do logado so aparece no
   * perfil no proximo refresh: sem ele o tour ofereceria de novo a rota que a
   * pessoa acabou de concluir e andaria em circulo.
   */
  const jaViu = useCallback(
    (rk: string) =>
      foiEncerrado(rk, donoRef.current) ||
      hasSeenOnboarding(rk, profileRef.current),
    [],
  );

  /** Leva o tour para a proxima rota da ordem, ou encerra se acabou. */
  const avancarTour = useCallback(
    (depoisDe: string) => {
      const proxima = proximaRotaDoTour(depoisDe, jaViu);
      if (!proxima) {
        encerrarTour();
        return;
      }
      alvoDoTourRef.current = proxima;
      navigate(proxima);
    },
    [jaViu, navigate],
  );

  /* --- decisao por rota ------------------------------------------------ */
  useEffect(() => {
    let cancelled = false;

    // Rota nova: cancela o atraso pendente e fecha o que estiver aberto SEM
    // marcar como visto. Quem sai da pagina no meio do onboarding (ou antes de
    // ele aparecer) nao decidiu nada, entao ele reaparece na proxima visita.
    // Marcar aqui trocaria "nao terminei" por "ja vi".
    //
    // Cancelar dentro do atraso NAO devolve a vez ao SuperInterstitial: a
    // reivindicacao do coordenador e sticky pela carga, de proposito. A pessoa
    // ja esta navegando; abrir um interstitial em cima disso seria trocar um
    // pop-up por outro.
    limparTimers();
    setOpen(false);
    setSaindo(false);
    setDef(null);
    beginDecision();

    const settle = () => {
      // Decisao terminal sem abrir: o alvo do tour deixa de estar pendente.
      alvoDoTourRef.current = null;
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

    // Tour rolando bloqueia o SuperInterstitial pela carga INTEIRA, inclusive
    // nas rotas da sequencia que nao tem onboarding para abrir e nos reloads no
    // meio do tour. Sem isto, uma perna do tour sem overlay soltaria a vez e o
    // interstitial apareceria no meio da sequencia.
    const emTour = tourAtivo();
    if (emTour) claimForOnboarding();

    const resolved = resolveRouteOnboarding(location.split("?")[0]);

    // Chegamos onde o tour mandou? Se nao, alguem redirecionou (o RequireAuth
    // manda anonimo para /cadastro). Pula o item e segue a sequencia.
    //
    // O alvo fica PENDENTE ate o overlay abrir de fato, e nao ate a location
    // bater. O motivo e a forma da guarda: o RequireAuth so decide DEPOIS de
    // renderizar, entao a location passa por /roadmaps/ia por um instante e so
    // ai vira /cadastro. Limpar o alvo na chegada fazia o redirect seguinte
    // parecer navegacao comum, e a pessoa ficava largada na tela de cadastro.
    //
    // Efeito colateral aceito: navegar A MAO dentro da janela de 1,5s entre
    // chegar e o overlay abrir tambem conta como guarda, e o tour segue para o
    // proximo item. E uma janela curta, dentro de um modo em que a pessoa pediu
    // para ser levada de tela em tela.
    const alvo = alvoDoTourRef.current;
    if (emTour && alvo !== null && resolved?.routeKey !== alvo) {
      alvoDoTourRef.current = null;
      avancarTour(alvo);
      return () => {
        cancelled = true;
      };
    }

    if (!resolved || resolved.entry.type !== "onboarding") {
      settle();
      return () => {
        cancelled = true;
      };
    }

    const { routeKey, entry } = resolved;
    if (foiEncerrado(routeKey, donoDosRegistros)) {
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
      marcarEncerrado(routeKey, donoDosRegistros);
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
        // O atraso conta a partir daqui, com os passos ja em maos: assim ele e
        // o tempo que a pessoa ve a pagina, e nao tempo de download disfarcado.
        const id = window.setTimeout(
          () => {
            // Abriu: o alvo chegou de verdade e deixa de estar pendente.
            alvoDoTourRef.current = null;
            setOpen(true);
          },
          emTour ? DELAY_TOUR_MS : DELAY_ABERTURA_MS,
        );
        timersRef.current.push(id);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Chunk fora do ar (deploy no meio da sessao) nao pode derrubar a
        // pagina: o onboarding e acessorio. Solta a vez e segue. Entra em
        // `handled` para nao repetir a tentativa (e o aviso) a cada navegacao
        // de volta nesta mesma carga.
        console.warn("[onboarding] falha ao carregar os passos", error);
        marcarEncerrado(routeKey, donoDosRegistros);
        settle();
      });

    return () => {
      cancelled = true;
    };
    // `profile` fora das dependencias de proposito: ele muda a cada refresh do
    // AuthContext, e reexecutar a decisao a cada mudanca reabriria o overlay
    // que a pessoa acabou de fechar. O que importa e o valor no momento em que
    // a rota resolve, e `authResolved` ja garante que ele chegou.
  }, [location, authResolved, avancarTour, donoDosRegistros]);

  // Timer sobrevivente a desmontagem chamaria setState em componente morto.
  useEffect(() => limparTimers, [limparTimers]);

  /* --- travar a rolagem da pagina de baixo ------------------------------ */
  // Mesmo mecanismo do SuperModal: guarda o valor anterior e restaura na saida,
  // em vez de assumir que era "". O overlay so trava enquanto esta montado,
  // entao a fase de saida ainda segura o scroll, que e o desejado.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleFinish = useCallback(
    (how: OnboardingHow, data: OnboardingResultData, destino?: string) => {
      const routeKey = routeKeyRef.current;
      // Anima a saida e so entao desmonta. A persistencia nao espera a
      // animacao: a pessoa ja decidiu, e a escrita e de rede.
      setSaindo(true);
      const id = window.setTimeout(
        () => {
          setOpen(false);
          setSaindo(false);
          setDef(null);
        },
        reducedMotion ? 0 : SAIDA_MS,
      );
      timersRef.current.push(id);

      // Navegacao do proCta. Vai ANTES da persistencia de proposito: a troca de
      // rota e o que a pessoa pediu, e nao pode esperar uma escrita de rede.
      // O efeito de rota vai rodar e cancelar o que estiver pendente, entao a
      // persistencia abaixo precisa nao depender de nada do ciclo atual (nao
      // depende: `routeKey` ja esta em maos).
      if (destino) navigate(destino);

      if (!routeKey) return;
      marcarEncerrado(routeKey, donoDosRegistros);
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

      /* --- maquina do tour guiado ------------------------------------- */
      if (destino) {
        // proCta durante o tour: a pessoa escolheu sair do fluxo para assinar.
        // Persiste esta pagina como concluida (acima) e ABORTA o resto.
        encerrarTour();
        return;
      }
      if (how === "pulado") {
        // "Pular" aborta o tour INTEIRO, nao so esta pagina. As rotas nao
        // visitadas continuam nao-vistas e voltam a aparecer individualmente,
        // que e o comportamento padrao.
        encerrarTour();
        return;
      }
      if (data.tour === "guiado" && !tourAtivo()) {
        // Card 5 da home: e aqui que o tour nasce. `!tourAtivo()` porque o
        // registro de `data.tour` viaja com a home e nao pode reiniciar um tour
        // que ja esta rolando.
        iniciarTour();
        avancarTour(routeKey);
        return;
      }
      if (tourAtivo()) avancarTour(routeKey);
    },
    [profile, signedIn, reducedMotion, navigate, avancarTour, donoDosRegistros],
  );

  if (!open || !def) return null;
  // `decision` so pode ser "onboarding" aqui: quem abre e o mesmo efeito que
  // reivindica. A checagem existe para o invariante ficar legivel no codigo.
  if (decision !== "onboarding") return null;

  return (
    <Suspense fallback={null}>
      <OnboardingStories def={def} onFinish={handleFinish} saindo={saindo} />
    </Suspense>
  );
}
