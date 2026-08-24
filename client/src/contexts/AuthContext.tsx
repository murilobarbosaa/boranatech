import {
  captureUserSignedUpForEmail,
  captureUserSignedUpForOAuth,
  signupSourceFromUrl,
} from "@/lib/analytics";
import { identifySentryUser } from "@/lib/sentry";
import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  hasOAuthCallbackInUrl,
  readAuthErrorFromUrl,
} from "@/lib/authCallback";
import {
  authErrorFields,
  authErrorKindOf,
  reportAuthDiagnostic,
  reportAuthFailure,
} from "@/lib/authTelemetry";
import { reconcilePendingQuizResult } from "@/services/careerQuizService";
import {
  PENDING_CONSENT_KEY,
  recordConsent,
} from "@/services/consentService";
import type { Profile } from "@/services/contracts";
import { getMyProfile } from "@/services/profileService";
import type { Gender } from "@shared/gender";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import posthog from "posthog-js";

interface SignUpInput {
  name: string;
  email: string;
  password: string;
  gender?: Gender;
}

interface SignInInput {
  email: string;
  password: string;
}

type OAuthProvider = "google";

export type ProfileStatus = "idle" | "loading" | "ready" | "error";

// Backoff conservador para Railway cold-start (~8-15s típico).
// Duas tentativas, sem loop apertado. Esgotadas, espera próximo evento de auth natural.
const PROFILE_RETRY_DELAYS_MS = [3_000, 12_000];
const PROFILE_RETRY_JITTER = 0.25;
// A partir de quando uma espera passa a PARECER travada para quem está olhando.
//
// É uma pergunta humana, não técnica, e a resposta é a mesma em toda tela: abaixo
// disso um spinner lê como "carregando", acima disso lê como "morreu", e por volta
// dos 10s vem o reflexo de recarregar. Um número só, exportado, porque três
// literais 6000 espalhados são três coisas que alguém move em um lugar só.
//
// Consumidores: o skeleton de perfil e o aviso do retorno do OAuth (aqui), e a
// mensagem de progresso do ConsentGate durante o hold da escrita de consentimento.
export const PERCEIVED_STALL_MS = 6_000;

// Skeleton só no boot inicial sem perfil. Aos 6s força fallback visual sem matar retries.
const PROFILE_BOOT_SKELETON_TIMEOUT_MS = PERCEIVED_STALL_MS;

// Limite de espera pela troca PKCE no retorno do OAuth.
//
// Era 5000ms, e 5000ms era curto pelo motivo errado: o que tem que caber aqui é a
// volta do app do Google, um handshake TLS para uma origem nova e UM round trip
// para `<projeto>.supabase.co`, num aparelho que pode ter acabado de trocar de
// célula. Não passa pelo Railway, então cold start não entra na conta; latência
// ruim de rede móvel entra, e 5s cai dentro dela. Ou seja: o timer disparava em
// login SAUDÁVEL, e como a ação dele era declarar "não logado", uma lentidão
// virava logout.
//
// 20s fica acima do p99 de uma requisição em rede móvel ruim e ainda abaixo do
// ponto em que a pessoa conclui que a página morreu. Também não antecipa a falha
// do próprio SDK, cujos limites de rede são maiores.
//
// E o custo de errar para o lado longo caiu: o desfecho agora é um aviso
// recuperável, não um logout. Antes, esperar mais significava mais tempo até
// deslogar alguém injustamente; agora significa mais tempo até um "não deu para
// confirmar" honesto, com botão de tentar de novo.
const OAUTH_CALLBACK_TIMEOUT_MS = 20_000;

// Item 1.8. Quando a espera passa deste ponto, a tela passa a dizer que está viva.
//
// O problema que isto resolve não é técnico, é de comportamento: 20s de spinner
// mudo faz a pessoa recarregar por volta dos 10s, e recarregar mata o timer antes
// do desfecho, então a telemetria do 1.6/1.7 nunca é emitida. O conserto se
// sabotaria sozinho, e ainda pareceria que o caminho nunca é atingido.
//
// 6000ms, e o número NÃO é novo: é o PERCEIVED_STALL_MS acima, que já responde a
// esta mesma pergunta humana ("a partir de quando a pessoa desconfia que
// travou?") e já foi calibrado nesta base. Inventar um segundo limiar para a mesma
// pergunta criaria dois números para manter em sincronia sem nenhum ganho. Fica
// confortavelmente abaixo do reflexo de recarregar (~10s) e bem acima do p50 de um
// retorno saudável, então login normal nunca vê a mensagem.
const OAUTH_CALLBACK_REASSURANCE_MS = PERCEIVED_STALL_MS;

// Por que o retorno do OAuth não pôde ser concluído. Nunca significa "deslogado":
// significa "não sabemos", e a UI trata como estado explícito com ação de retry.
export type AuthCallbackIssue =
  // A URL de callback trouxe error/error_code do provider (item 1.2).
  | { kind: "provider_error"; code: string | null; description: string | null }
  // O limite acima estourou e getSession() também não achou sessão (item 1.3).
  | { kind: "unconfirmed"; code: null; description: null };

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  profileStatus: ProfileStatus;
  profileError: Error | null;
  loading: boolean;
  // Desfecho não-conclusivo do retorno do OAuth. null = nada a relatar.
  callbackIssue: AuthCallbackIssue | null;
  // A troca PKCE está demorando o bastante para valer avisar que está viva
  // (item 1.8). Não é erro e não oferece ação: só sinaliza progresso.
  callbackSlow: boolean;
  // Reconsulta a sessão e, se ela existir, retoma o fluxo normal. É a ação do
  // botão "tentar novamente" do aviso.
  retryCallback: () => Promise<void>;
  // Item 3.4. Há uma gravação de consentimento em voo, disparada pelo aceite que
  // a pessoa deu no cadastro. Enquanto for true, NINGUÉM pode concluir nada sobre
  // o estado de consentimento: ler agora é ler antes da escrita, que é exatamente
  // a corrida medida no Passo 2 (50 pessoas viram o modal com a linha já gravada,
  // todas com menos de 5s de distância). Não é erro e não é "não consentiu": é
  // "ainda não dá para saber".
  consentWriteInFlight: boolean;
  // Contador de gravações de consentimento CONFIRMADAS pelo servidor nesta carga
  // de página. Zero significa "nenhuma ainda", nunca "falhou".
  //
  // Existe porque a escrita continua tentando depois que o gate desiste de
  // esperar (ver CONSENT_WRITE_HOLD_MS no ConsentGate): quando ela finalmente
  // conclui, o modal pode já estar na tela, e quem abriu tem que fechar sozinho.
  // Mesmo mecanismo do desfecho tardio do retorno do OAuth, que limpa o aviso
  // sem exigir clique.
  consentWriteConfirmed: number;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (input: SignInInput) => Promise<void>;
  signInWithOAuth: (
    provider: OAuthProvider,
    options?: { redirectTo?: string },
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Superfície dedicada a teste: NÃO usar em código de produção. Existe apenas
// para permitir que testes comparem profileRef.current com profile estado a
// estado, travando a invariante anti-race da Questão 1.
interface AuthInternalsForTests {
  profileRef: React.RefObject<Profile | null>;
}
const AuthInternalsForTestsContext = createContext<
  AuthInternalsForTests | undefined
>(undefined);

export function __useAuthInternalsForTests() {
  return useContext(AuthInternalsForTestsContext);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function authRedirectTo() {
  const redirectPath = import.meta.env.VITE_AUTH_REDIRECT_PATH || "/perfil";
  const normalizedPath = redirectPath.startsWith("/")
    ? redirectPath
    : `/${redirectPath}`;
  // Em produção, VITE_SITE_URL fixa o domínio canônico para o OAuth sempre
  // voltar a https://boranatech.com.br, independente do host de origem
  // (apex/www/alias da Vercel). Sem a env (preview/local), usa a origin atual
  // para o callback retornar ao mesmo host onde o login começou.
  const base = (
    import.meta.env.VITE_SITE_URL || window.location.origin
  ).replace(/\/+$/, "");
  return `${base}${normalizedPath}`;
}

function computeRetryDelay(attempt: number): number | null {
  if (attempt >= PROFILE_RETRY_DELAYS_MS.length) return null;
  const base = PROFILE_RETRY_DELAYS_MS[attempt];
  const jitter = base * PROFILE_RETRY_JITTER * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(base + jitter));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("idle");
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [callbackIssue, setCallbackIssue] = useState<AuthCallbackIssue | null>(
    null,
  );
  const [callbackSlow, setCallbackSlow] = useState(false);
  const [consentWriteInFlight, setConsentWriteInFlight] = useState(false);
  const [consentWriteConfirmed, setConsentWriteConfirmed] = useState(0);

  // Identidade do Sentry, derivada da sessão. UM lugar só, de propósito: o
  // `setSession` acontece em cinco pontos deste arquivo, e uma chamada por ponto
  // sumiria no primeiro que alguém esquecesse. Reagir à mudança cobre todos por
  // construção, inclusive o logout (sessão null -> identidade null). Só o id vai;
  // a montagem por allowlist mora em `buildSentryUser`.
  useEffect(() => {
    identifySentryUser(session);
  }, [session]);

  // Trava de "um flush por carga de página". SIGNED_IN pode chegar mais de uma
  // vez (StrictMode em dev, reassinatura do listener) e sem isto o mesmo aceite
  // dispararia dois POSTs concorrentes: o segundo colidiria com o primeiro no
  // índice único, e o par de escritas confundiria a leitura de quem espera o
  // in-flight cair. Ref, não estado: precisa ser lido e escrito de forma
  // síncrona dentro do próprio handler, antes de qualquer render.
  const consentFlushStartedRef = useRef(false);

  // O retry precisa de startProfileLifecycle/reconcileQuizForSession, que vivem no
  // closure do effect de boot. Guardar a função num ref evita colocar o nonce nas
  // deps do effect, o que re-assinaria o onAuthStateChange a cada tentativa e
  // mexeria nas invariantes de corrida que os testes deste arquivo travam.
  const retryCallbackRef = useRef<(() => Promise<void>) | null>(null);

  // profileRef é mantido em sincronia SÍNCRONA com setProfile em cada caller
  // (fetchAndApply success, cancelProfileLifecycle, ambos ramos de refreshProfile).
  // NÃO usar useEffect espelho: o effect roda após commit, abrindo 1 render
  // de janela onde profile já mudou mas o ref ainda reflete o valor antigo,
  // exatamente a race que startProfileLifecycle observa via profileRef.current
  // para escolher mode='initial' vs 'background'.
  const profileRef = useRef<Profile | null>(null);
  // Geração compartilhada entre o fluxo interno (useEffect) e o refreshProfile
  // exportado. Cada início de busca incrementa; só aplica resultado se o ref
  // ainda for o mesmo. Fecha a Race B: SIGNED_OUT durante refreshProfile em
  // voo bumpa a geração via cancelProfileLifecycle, e a resolução tardia do
  // refreshProfile vê gen antigo e descarta -> não ressuscita perfil deslogado.
  const generationRef = useRef(0);

  // Reconciliacao do resultado do quiz feito deslogado: dispara quando a sessao
  // passa a existir, no maximo uma vez por usuario de sessao (o ref guarda o
  // ultimo id tratado e e zerado no SIGNED_OUT, entao um novo login tenta de
  // novo). Best-effort e assincrona: nunca bloqueia o fluxo de auth.
  const quizReconcileUserRef = useRef<string | null>(null);

  useEffect(() => {
    function reconcileQuizForSession(target: Session) {
      const uid = target.user?.id;
      if (!uid || quizReconcileUserRef.current === uid) return;
      quizReconcileUserRef.current = uid;
      void reconcilePendingQuizResult();
    }
    let mounted = true;
    // Referência de tempo do boot, para o elapsed_ms do erro vindo na URL (esse
    // caminho não tem um "início da troca" próprio: quando a página carrega, a
    // falha já aconteceu no provider).
    const bootStartedAt = Date.now();
    let safetyTimer: number | undefined;
    let reassuranceTimer: number | undefined;
    // Havia callback de OAuth na URL quando este effect começou? Capturado UMA vez,
    // antes de qualquer await, porque o supabase-js remove o `?code=` da URL durante
    // a própria inicialização: consultar depois pode dar false e perderíamos a
    // medição de 1.7. Usado SÓ para timing; a lógica de segurar o loading continua
    // consultando a URL onde já consultava, para não mexer no comportamento testado.
    const callbackPresentAtBoot = hasOAuthCallbackInUrl();
    // Instante de referência do retorno do OAuth, e trava de "só reporta uma vez":
    // sem ela, TOKEN_REFRESHED depois do login contaria como um segundo retorno e
    // inflaria a distribuição com tempos que não são de retorno nenhum.
    //
    // Semeado AQUI, no boot, e não dentro do ramo que segura o loading: quando a
    // troca PKCE termina ANTES do nosso getSession resolver, não passamos por
    // aquele ramo, e é justamente esse o caminho rápido e saudável que o
    // histograma do 1.7 mais precisa conter. Semear só no ramo lento deixaria a
    // distribuição enviesada para os casos ruins, ou seja, mediria o oposto do
    // que a pergunta pede.
    let oauthReturnStartedAt: number | null = callbackPresentAtBoot
      ? bootStartedAt
      : null;
    let oauthOutcomeReported = false;
    let retryTimer: number | undefined;
    let skeletonTimer: number | undefined;
    let retryAttempt = 0;
    // Início da primeira tentativa do ciclo atual de perfil. Alimenta elapsed_ms do
    // log de falha de perfil: mede o ciclo inteiro (com os retries), não a última
    // tentativa, porque o que importa é quanto tempo a pessoa ficou sem perfil.
    let profileFetchStartedAt = Date.now();
    // generationRef é compartilhado com refreshProfile (escopo do componente).
    // Use sempre generationRef.current dentro deste effect para que qualquer
    // bump externo (refreshProfile) seja observado pelas chamadas em voo aqui.

    // Limpa os DOIS timers do ciclo de callback, de propósito. Eles nascem juntos e
    // morrem juntos, e uma função separada para cada um significaria lembrar de
    // chamar as duas em cada um dos call sites: a guarda mora dentro, não no
    // chamador, senão o timer de tranquilização sobreviveria ao desfecho e a
    // mensagem apareceria depois do login já ter dado certo.
    function clearSafetyTimer() {
      if (safetyTimer !== undefined) {
        window.clearTimeout(safetyTimer);
        safetyTimer = undefined;
      }
      if (reassuranceTimer !== undefined) {
        window.clearTimeout(reassuranceTimer);
        reassuranceTimer = undefined;
      }
    }

    // Desfecho do retorno do OAuth, reportado no máximo uma vez por carga de
    // página. Concentrado aqui porque 1.6 e 1.7 são o MESMO instante medido, só
    // com nome diferente conforme o caminho: chamar reportAuthDiagnostic solto em
    // cada ramo abriria a porta para os dois dispararem juntos.
    function reportOAuthOutcome(stage:
      | "session_recovered_after_timeout"
      | "oauth_return_succeeded") {
      if (oauthOutcomeReported || oauthReturnStartedAt === null) return;
      oauthOutcomeReported = true;
      reportAuthDiagnostic({
        stage,
        method: "oauth_redirect",
        provider: "google",
        elapsedMs: Date.now() - oauthReturnStartedAt,
      });
    }

    function clearRetryTimer() {
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
        retryTimer = undefined;
      }
    }

    function clearSkeletonTimer() {
      if (skeletonTimer !== undefined) {
        window.clearTimeout(skeletonTimer);
        skeletonTimer = undefined;
      }
    }

    async function fetchAndApply(targetSession: Session, gen: number) {
      try {
        const nextProfile = await getMyProfile();
        if (!mounted) return;
        if (gen !== generationRef.current) return; // suplantado por uma chamada mais nova
        clearRetryTimer();
        clearSkeletonTimer();
        retryAttempt = 0;
        profileRef.current = nextProfile;
        setProfile(nextProfile);
        setProfileStatus("ready");
        setProfileError(null);
      } catch (err) {
        if (!mounted) return;
        if (gen !== generationRef.current) return;
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[AuthContext] loadProfile failed", error);
        setProfileError(error);
        // NUNCA regride profile bom: se já há perfil cacheado, mantém.
        // Status também fica como estava ('ready'), o erro fica só no profileError.
        const attempt = retryAttempt;
        const delay = computeRetryDelay(attempt);
        if (delay === null) {
          // Retries esgotados. Estado terminal: se não há perfil, status='error'.
          //
          // Item 1.4: este é o estágio 'profile', NÃO 'provider'. O provider fez a
          // parte dele (existe sessão válida aqui, senão não estaríamos buscando
          // perfil); o que falhou foi GET /api/me, ou seja, nossa API ou nosso
          // banco. Para quem está na tela as duas falhas são idênticas, e é
          // justamente por isso que o log tem que separá-las.
          //
          // Reportado só no terminal, não a cada tentativa: 3 eventos por falha
          // inflariam a contagem e o que interessa é "quantas pessoas ficaram sem
          // perfil", não quantos pacotes se perderam no caminho.
          reportAuthFailure({
            stage: "profile",
            method: "oauth_redirect",
            provider: null,
            errorCode: "profile_fetch_exhausted",
            errorMessage: error.message,
            // `httpStatus` sozinho nao distingue "200 com corpo invalido" de
            // "nem falamos com a API": o `?? null` abaixo achata os dois em
            // null. `errorKind` carrega a distincao, declarada por quem lancou.
            errorKind: authErrorKindOf(err),
            httpStatus:
              (err as { status?: number | null } | null)?.status ?? null,
            elapsedMs: Date.now() - profileFetchStartedAt,
          });
          if (!profileRef.current) {
            setProfileStatus("error");
          }
          return;
        }
        retryAttempt = attempt + 1;
        clearRetryTimer();
        retryTimer = window.setTimeout(() => {
          if (!mounted) return;
          if (gen !== generationRef.current) return;
          void fetchAndApply(targetSession, gen);
        }, delay);
      }
    }

    function startProfileLifecycle(
      targetSession: Session,
      mode: "initial" | "background",
    ) {
      generationRef.current += 1;
      const gen = generationRef.current;
      retryAttempt = 0;
      profileFetchStartedAt = Date.now();
      clearRetryTimer();
      clearSkeletonTimer();
      if (mode === "initial" && !profileRef.current) {
        setProfileStatus("loading");
        // Skeleton timeout muda só o que aparece na tela; NÃO cancela retries.
        // Se um retry chegar com sucesso depois, status='ready' restaura por cima.
        skeletonTimer = window.setTimeout(() => {
          if (!mounted) return;
          if (gen !== generationRef.current) return;
          if (profileRef.current) return;
          setProfileStatus((prev) => (prev === "loading" ? "error" : prev));
        }, PROFILE_BOOT_SKELETON_TIMEOUT_MS);
      }
      void fetchAndApply(targetSession, gen);
    }

    function cancelProfileLifecycle() {
      generationRef.current += 1;
      clearRetryTimer();
      clearSkeletonTimer();
      retryAttempt = 0;
      profileRef.current = null;
      setProfile(null);
      setProfileStatus("idle");
      setProfileError(null);
    }

    if (!supabase) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (!mounted) return;
        const initialSession = data.session;
        setSession(initialSession);

        if (initialSession) {
          startProfileLifecycle(initialSession, "initial");
          reconcileQuizForSession(initialSession);
        }

        // Item 1.2: erro do provider na URL de callback. Antes isso era ignorado
        // por completo (hasAuthErrorInUrl existia e só o fluxo de recuperação de
        // senha consumia), então "redirect fora da allowlist" e "usuário cancelou"
        // chegavam como uma tela deslogada sem explicação e sem registro.
        //
        // Reporta SEMPRE que o parâmetro existe, porque a tentativa falhou de fato,
        // mas só bloqueia a tela quando não há sessão: quem já está logado e cai
        // aqui com uma URL velha não precisa ver aviso nenhum.
        const urlError = readAuthErrorFromUrl();
        if (urlError) {
          reportAuthFailure({
            stage: "provider",
            method: "oauth_redirect",
            provider: "google",
            errorCode: urlError.errorCode ?? urlError.error,
            errorMessage: urlError.description,
            elapsedMs: Date.now() - bootStartedAt,
          });
          if (!initialSession) {
            setCallbackIssue({
              kind: "provider_error",
              code: urlError.errorCode ?? urlError.error,
              description: urlError.description,
            });
            setLoading(false);
            return;
          }
        }

        // Callback de OAuth em andamento: getSession resolveu null mas a URL ainda
        // tem ?code= (PKCE) / token no hash (implicit). A troca vai concluir e
        // emitir SIGNED_IN. NÃO feche o loading agora, senão abrimos a janela
        // (loading=false, user=null) que faz os guards redirecionarem indevidamente.
        if (!initialSession && hasOAuthCallbackInUrl()) {
          console.info("[auth] holding loading for OAuth callback");
          const callbackStartedAt = Date.now();
          safetyTimer = window.setTimeout(() => {
            void resolveStalledCallback(callbackStartedAt);
          }, OAUTH_CALLBACK_TIMEOUT_MS);
          // Item 1.8: não muda fluxo nem oferece ação, só deixa de parecer morta.
          reassuranceTimer = window.setTimeout(() => {
            if (!mounted) return;
            setCallbackSlow(true);
            reportAuthDiagnostic({
              stage: "oauth_return_slow",
              method: "oauth_redirect",
              provider: "google",
              elapsedMs: Date.now() - callbackStartedAt,
            });
          }, OAUTH_CALLBACK_REASSURANCE_MS);
          return;
        }

        setLoading(false);
      });

    // Item 1.3. O que este caminho NÃO faz mais, e é o ponto todo: não chama
    // setSession(null) nem cancelProfileLifecycle(). O timer antigo zerava sessão e
    // o app declarava "não logado" enquanto a troca PKCE ainda podia estar em voo,
    // ou seja, transformava lentidão de rede em logout, e o único rastro era um
    // console.warn que ninguém lê.
    //
    // Agora o estouro do limite só ENCERRA o loading, e antes de concluir qualquer
    // coisa consulta getSession() e confia no resultado: se a troca concluiu e só a
    // notificação se perdeu, adota a sessão e segue o fluxo normal. Se realmente não
    // há sessão, vira estado explícito com retry, nunca silêncio.
    async function resolveStalledCallback(startedAt: number) {
      if (!mounted || !supabase) return;

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const recovered = data.session;
      if (recovered) {
        console.info("[auth] callback resolved late; adopting session");
        // Item 1.6. Este é o caso que o timer antigo destruía: sessão VÁLIDA
        // encontrada depois do limite. Evento próprio, NÃO classificado como
        // falha, porque aqui o login deu certo. É a medida que diz se o
        // problema (3) morreu no Passo 1: se este evento parar de aparecer, o
        // limite passou a caber na latência real.
        reportOAuthOutcome("session_recovered_after_timeout");
        setSession(recovered);
        startProfileLifecycle(
          recovered,
          profileRef.current ? "background" : "initial",
        );
        reconcileQuizForSession(recovered);
        setCallbackIssue(null);
        setCallbackSlow(false);
        setLoading(false);
        return;
      }

      // Continua medido depois do conserto de propósito: sem o evento, "arrumamos o
      // timer" seria afirmação sem instrumento, e não teríamos como saber se 20s é o
      // número certo nem com que frequência esse caminho é atingido de verdade.
      reportAuthFailure({
        stage: "session_unconfirmed",
        method: "oauth_redirect",
        provider: "google",
        errorCode: "pkce_exchange_unconfirmed",
        elapsedMs: Date.now() - startedAt,
      });
      setCallbackIssue({ kind: "unconfirmed", code: null, description: null });
      // O card de falha substitui a mensagem de progresso.
      setCallbackSlow(false);
      setLoading(false);
    }

    // Mesma consulta do retry manual, sem reportar de novo (a falha já foi
    // registrada quando o limite estourou; um segundo evento por clique
    // distorceria a contagem).
    retryCallbackRef.current = async () => {
      if (!mounted || !supabase) return;
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const recovered = data.session;
      if (!recovered) return;
      setSession(recovered);
      startProfileLifecycle(
        recovered,
        profileRef.current ? "background" : "initial",
      );
      reconcileQuizForSession(recovered);
      setCallbackIssue(null);
      setLoading(false);
    };

    function handleAuthChange(
      event: AuthChangeEvent,
      nextSession: Session | null,
    ) {
      // Durante um callback de OAuth, um INITIAL_SESSION(null) pode chegar antes
      // do SIGNED_IN. Ignore esse estado transitório para não fechar o loading
      // (e reabrir a janela). O SIGNED_IN (ou a salvaguarda) resolve depois.
      if (!nextSession && event !== "SIGNED_OUT" && hasOAuthCallbackInUrl()) {
        return;
      }

      clearSafetyTimer();
      setSession(nextSession);
      // Chegou desfecho de verdade: qualquer aviso de "não deu para confirmar"
      // deixa de valer. Cobre a troca PKCE que concluiu DEPOIS do limite, caso em
      // que o aviso já estava na tela e precisa sair sozinho, sem clique.
      setCallbackIssue(null);
      setCallbackSlow(false);
      // Item 1.7: retorno de OAuth concluído com sucesso. Medido do início do
      // retorno até o SIGNED_IN confirmado. Só conta quando havia callback na URL
      // no boot (`oauthReturnStartedAt`), então login por e-mail/senha e refresh de
      // token não entram na distribuição.
      if (event === "SIGNED_IN" && nextSession) {
        reportOAuthOutcome("oauth_return_succeeded");
      }
      if (event === "SIGNED_OUT" || !nextSession) {
        quizReconcileUserRef.current = null;
        cancelProfileLifecycle();
      } else {
        if (nextSession.user) {
          posthog.identify(nextSession.user.id);
          // Cadastro via OAuth: dispara user_signed_up UMA vez, so quando a conta
          // acabou de ser criada (created_at ~ last_sign_in_at). Nunca em login de
          // conta existente nem em TOKEN_REFRESHED (so no SIGNED_IN). O fluxo
          // email/senha ja dispara no signUp; a funcao ignora provider=email.
          if (event === "SIGNED_IN") {
            captureUserSignedUpForOAuth(nextSession.user);
            // Aceite pendente de um signup (e-mail ou OAuth): agora ha identidade
            // via JWT, grava o consentimento.
            //
            // Itens 3.2 e 3.3. O que mudou, e por que:
            //
            // ANTES a flag era apagada ANTES do POST e o POST era disparado com
            // .catch silencioso, sem retry. Um blip de rede apagava a intencao de
            // aceite e nao gravava nada, sem deixar rastro. AGORA a flag so sai
            // depois de o servidor CONFIRMAR a gravacao; falhou, ela FICA, e a
            // intencao continua registrada para a proxima tentativa.
            //
            // O retry e o backoff vivem dentro de recordConsent, cobrindo tambem o
            // botao do ConsentGate. Aqui so esperamos o desfecho.
            //
            // `void` mais async interno, e nao await direto, porque handleAuthChange
            // e um callback SINCRONO do onAuthStateChange: devolver uma Promise para
            // o SDK nao faria ninguem esperar por ela. Quem de fato espera e o gate,
            // via consentWriteInFlight, e por isso a flag sobe AQUI, no mesmo tique
            // sincrono do setSession: as duas atualizacoes entram no mesmo lote de
            // render, entao o ConsentGate nunca chega a ver "tem usuario e nao ha
            // escrita em voo" durante a janela da corrida.
            if (
              sessionStorage.getItem(PENDING_CONSENT_KEY) &&
              !consentFlushStartedRef.current
            ) {
              consentFlushStartedRef.current = true;
              setConsentWriteInFlight(true);
              void (async () => {
                try {
                  // Item 4.4. `signup_wrap_implicit`, e nao mais
                  // `signup_form_checkbox`, NO MESMO commit que removeu a caixa de
                  // selecao. O que aconteceu agora foi um clique num botao com o
                  // aviso ao lado, e isso e um mecanismo de consentimento distinto
                  // de marcar uma caixa: se as duas formas dividissem a string, nao
                  // haveria como separa-las depois. A string antiga permanece na
                  // allowlist como historico, sem novos usos.
                  await recordConsent("signup_wrap_implicit");
                  sessionStorage.removeItem(PENDING_CONSENT_KEY);
                  // Depois da flag, e so no sucesso: e este sinal que autoriza o
                  // ConsentGate a fechar um modal que ele ja tenha aberto por ter
                  // desistido de esperar.
                  if (mounted) setConsentWriteConfirmed((n) => n + 1);
                } catch (consentErr) {
                  // Flag PRESERVADA de proposito. O ConsentGate assume a partir
                  // daqui e pede o aceite, que e o comportamento correto: nao
                  // temos confirmacao de que a linha existe.
                  console.warn(
                    "[auth] failed to record pending consent:",
                    consentErr,
                  );
                } finally {
                  // Liberado nos DOIS desfechos. Deixar preso no erro travaria o
                  // gate em "checking" para sempre, trocando um consentimento
                  // perdido por uma tela morta.
                  if (mounted) setConsentWriteInFlight(false);
                }
              })();
            }
            // Item 5.1. Aqui ficava o flush do opt-in de marketing pendente do
            // signup. Removido junto com os checkboxes que o alimentavam: sem
            // escritor, era codigo morto que continuaria lendo sessionStorage, e
            // uma API de "opt-in pendente" sem chamador convida alguem a religar a
            // coleta no cadastro, que e exatamente o que a LGPD art. 8 par. 4
            // desaconselha. A escolha de marketing agora acontece no /bem-vindo e
            // no perfil, nunca junto do aceite dos termos.
          }
        }
        reconcileQuizForSession(nextSession);
        // Modo 'initial' apenas quando ainda não há perfil cacheado.
        // TOKEN_REFRESHED/USER_UPDATED com perfil presente entram em 'background'
        // e nunca acendem skeleton.
        const mode: "initial" | "background" = profileRef.current
          ? "background"
          : "initial";
        startProfileLifecycle(nextSession, mode);
        if (
          event === "SIGNED_IN" &&
          localStorage.getItem("bnt_social_signup_pending") === "true"
        ) {
          localStorage.removeItem("bnt_social_signup_pending");
          window.setTimeout(() => {
            if (window.location.pathname !== "/bem-vindo")
              window.location.assign("/bem-vindo");
          }, 0);
        }
      }
      setLoading(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      mounted = false;
      clearSafetyTimer();
      clearRetryTimer();
      clearSkeletonTimer();
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async ({ name, email, password, gender }: SignUpInput) => {
      try {
        const client = assertSupabaseConfigured();
        const { error } = await client.auth.signUp({
          email: normalizeEmail(email),
          password,
          options: {
            data: {
              name: name.trim(),
              gender,
            },
            emailRedirectTo: `${window.location.origin}/perfil`,
          },
        });

        if (error) throw error;

        captureUserSignedUpForEmail(signupSourceFromUrl());
      } catch (error) {
        console.error("[AuthContext] signUp failed", error);
        // Reportado AQUI, dentro da função, e não em cada tela de cadastro: guarda
        // no chamador precisa ser repetida em Auth.tsx e AuthModal.tsx e desaparece
        // na primeira tela nova que alguém escrever sem lembrar.
        const fields = authErrorFields(error);
        reportAuthFailure({
          stage: "provider",
          method: "email_signup",
          provider: "email",
          errorCode: fields.code,
          errorMessage: fields.message,
          httpStatus: fields.status,
        });
        throw error;
      }
    },
    [],
  );

  const signIn = useCallback(async ({ email, password }: SignInInput) => {
    const client = assertSupabaseConfigured();
    const { data, error } = await client.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (error) {
      const fields = authErrorFields(error);
      reportAuthFailure({
        stage: "provider",
        method: "email_password",
        provider: "email",
        errorCode: fields.code,
        errorMessage: fields.message,
        httpStatus: fields.status,
      });
      throw error;
    }

    if (data.user) {
      posthog.identify(data.user.id);
      posthog.capture("user_signed_in");
    }
  }, []);

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider, options?: { redirectTo?: string }) => {
      const client = assertSupabaseConfigured();
      posthog.capture("oauth_sign_in_started", { provider });
      const startedAt = Date.now();

      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: options?.redirectTo ?? authRedirectTo(),
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        // Falha ANTES de sair da página (ex.: provider desabilitado no projeto,
        // redirectTo fora da allowlist). Distinta da falha no RETORNO, que é
        // reportada no boot do effect: as duas são stage 'provider', e o que as
        // separa no log é o error_code.
        const fields = authErrorFields(error);
        reportAuthFailure({
          stage: "provider",
          method: "oauth_redirect",
          provider,
          errorCode: fields.code ?? "oauth_start_failed",
          errorMessage: fields.message,
          httpStatus: fields.status,
          elapsedMs: Date.now() - startedAt,
        });
        throw error;
      }
    },
    [],
  );

  // One-shot. Não dispara retry interno; caller decide o que fazer com a falha.
  // Sucesso aplicado atualiza profile e zera profileError. Falha propaga.
  //
  // Participa do generation guard: bumpa antes de buscar, cheka antes de
  // aplicar. Se foi suplantado (SIGNED_OUT, ou outra busca mais nova chegou
  // antes), resolve sem aplicar, o estado já reflete dado >= este.
  // Log info-level para não virar silêncio (lembra do H3).
  const refreshProfile = useCallback(async () => {
    if (!session) {
      generationRef.current += 1;
      profileRef.current = null;
      setProfile(null);
      setProfileStatus("idle");
      setProfileError(null);
      return;
    }

    generationRef.current += 1;
    const gen = generationRef.current;
    const nextProfile = await getMyProfile();
    if (gen !== generationRef.current) {
      console.info(
        "[AuthContext] refreshProfile suplantado; estado atual já reflete dado >= este",
      );
      return;
    }
    profileRef.current = nextProfile;
    setProfile(nextProfile);
    setProfileStatus("ready");
    setProfileError(null);
  }, [session]);

  const retryCallback = useCallback(async () => {
    await retryCallbackRef.current?.();
  }, []);

  const signOut = useCallback(async () => {
    const client = assertSupabaseConfigured();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    // O listener onAuthStateChange recebe SIGNED_OUT e zera o ciclo de perfil
    // (timers, geração, profileError) via cancelProfileLifecycle.
    posthog.capture("user_signed_out");
    posthog.reset();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const client = assertSupabaseConfigured();
    const { error } = await client.auth.resetPasswordForEmail(
      normalizeEmail(email),
      {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      },
    );

    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const client = assertSupabaseConfigured();
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      profileStatus,
      profileError,
      loading,
      callbackIssue,
      callbackSlow,
      retryCallback,
      consentWriteInFlight,
      consentWriteConfirmed,
      signUp,
      signIn,
      signInWithOAuth,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
    }),
    [
      callbackIssue,
      callbackSlow,
      consentWriteInFlight,
      consentWriteConfirmed,
      loading,
      profile,
      profileStatus,
      profileError,
      resetPassword,
      retryCallback,
      refreshProfile,
      session,
      signIn,
      signInWithOAuth,
      signOut,
      signUp,
      updatePassword,
    ],
  );

  const internalsValue = useMemo<AuthInternalsForTests>(
    () => ({ profileRef }),
    [],
  );

  return (
    <AuthInternalsForTestsContext.Provider value={internalsValue}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </AuthInternalsForTestsContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
