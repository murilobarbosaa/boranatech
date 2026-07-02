import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import RequireAuth from "./components/auth/RequireAuth";
import { AuthProvider } from "./contexts/AuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAffiliate } from "./hooks/useAffiliate";
import Home from "./pages/home/HomeLanding";
import AgentWidget from "./components/agent/AgentWidget";

const Admin = lazy(() => import("@/pages/Admin"));
const AreaDetalhe = lazy(() => import("@/pages/AreaDetalhe"));
const Areas = lazy(() => import("@/pages/Areas"));
const Auth = lazy(() => import("@/pages/Auth"));
const AuthGatePlayground = lazy(() => import("@/pages/dev/AuthGatePlayground"));
const BemVindo = lazy(() => import("@/pages/BemVindo"));
const Cadastro = lazy(() => import("@/pages/Cadastro"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const CheckoutSucesso = lazy(() => import("@/pages/CheckoutSucesso"));
const Comparador = lazy(() => import("@/pages/Comparador"));
const Comunidades = lazy(() => import("@/pages/Comunidades"));
const Conquistas = lazy(() => import("@/pages/conquistas/Conquistas"));
const Curriculo = lazy(() => import("@/pages/Curriculo"));
const CurriculoAnalisar = lazy(() => import("@/pages/CurriculoAnalisar"));
const CurriculoGerar = lazy(() => import("@/pages/CurriculoGerar"));
const CurriculoLinkedin = lazy(() => import("@/pages/CurriculoLinkedin"));
const Cursos = lazy(() => import("@/pages/Cursos"));
const DevProBorders = lazy(() => import("@/pages/dev/ProBordersPlayground"));
const Dicas = lazy(() => import("@/pages/Dicas"));
const Dicionario = lazy(() => import("@/pages/Dicionario"));
const Empregabilidade = lazy(() => import("@/pages/Empregabilidade"));
const EmpresaDetalhe = lazy(() => import("@/pages/EmpresaDetalhe"));
const EmpresaRankingJunior = lazy(() => import("@/pages/EmpresaRankingJunior"));
const Empresas = lazy(() => import("@/pages/Empresas"));
const EntrevistaDesafios = lazy(() => import("@/pages/EntrevistaDesafios"));
const EntrevistaPerguntas = lazy(() => import("@/pages/EntrevistaPerguntas"));
const EntrevistaSimulador = lazy(() => import("@/pages/EntrevistaSimulador"));
const Entrevistas = lazy(() => import("@/pages/Entrevistas"));
const Estagio = lazy(() => import("@/pages/Estagio"));
const Estudos = lazy(() => import("@/pages/Estudos"));
const EstudosDiario = lazy(() => import("@/pages/EstudosDiario"));
const Eventos = lazy(() => import("@/pages/Eventos"));
const Evolucao = lazy(() => import("@/pages/Evolucao"));
const FaculdadeDetalhe = lazy(() => import("@/pages/FaculdadeDetalhe"));
const Faculdades = lazy(() => import("@/pages/Faculdades"));
const Ferramentas = lazy(() => import("@/pages/Ferramentas"));
const Freelance = lazy(() => import("@/pages/Freelance"));
const GuiaIa = lazy(() => import("@/pages/GuiaIa"));
const Ingles = lazy(() => import("@/pages/Ingles"));
const InglesEntrevista = lazy(() => import("@/pages/InglesEntrevista"));
const InglesNoTrabalho = lazy(() => import("@/pages/InglesNoTrabalho"));
const InglesOndeEstudar = lazy(() => import("@/pages/InglesOndeEstudar"));
const InglesVocabulario = lazy(() => import("@/pages/InglesVocabulario"));
const Licenca = lazy(() => import("@/pages/Licenca"));
const LinkedinAnalisar = lazy(() => import("@/pages/LinkedinAnalisar"));
const Mentorias = lazy(() => import("@/pages/Mentorias"));
const Mulheres = lazy(() => import("@/pages/Mulheres"));
const Networking = lazy(() => import("@/pages/Networking"));
const Noticias = lazy(() => import("@/pages/Noticias"));
const Perfil = lazy(() => import("@/pages/Perfil"));
const PerfilFavoritos = lazy(() => import("@/pages/PerfilFavoritos"));
const PerguntasFrequentes = lazy(() => import("@/pages/PerguntasFrequentes"));
const Plataformas = lazy(() => import("@/pages/Plataformas"));
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const PortfolioAnalisar = lazy(() => import("@/pages/PortfolioAnalisar"));
const Privacidade = lazy(() => import("@/pages/Privacidade"));
const Projetos = lazy(() => import("@/pages/Projetos"));
const QuizCarreira = lazy(() => import("@/pages/QuizCarreira"));
const QuizCarreiraResultado = lazy(
  () => import("@/pages/quiz-carreira/QuizCarreiraResultado"),
);
const RecuperarSenha = lazy(() => import("@/pages/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("@/pages/RedefinirSenha"));
const RoadmapCarreira = lazy(() => import("@/pages/RoadmapCarreira"));
const RoadmapIA = lazy(() => import("@/pages/RoadmapIA"));
const RoadmapIAView = lazy(() => import("@/pages/RoadmapIAView"));
const RoadmapsV2 = lazy(() => import("@/pages/RoadmapsV2"));
const RoadmapsV2Index = lazy(() => import("@/pages/RoadmapsV2Index"));
const Salarios = lazy(() => import("@/pages/Salarios"));
const Simulador = lazy(() => import("@/pages/Simulador"));
const Sobre = lazy(() => import("@/pages/Sobre"));
const SubAreaDetalhe = lazy(() => import("@/pages/SubAreaDetalhe"));
const TecnologiaComparador = lazy(() => import("@/pages/TecnologiaComparador"));
const TecnologiaDetalhe = lazy(() => import("@/pages/TecnologiaDetalhe"));
const TecnologiaJogos = lazy(() => import("@/pages/TecnologiaJogos"));
const TecnologiaMapa = lazy(() => import("@/pages/TecnologiaMapa"));
const TecnologiaRanking = lazy(() => import("@/pages/TecnologiaRanking"));
const Tecnologias = lazy(() => import("@/pages/Tecnologias"));
const TermosDeUso = lazy(() => import("@/pages/TermosDeUso"));
const TrocarSenha = lazy(() => import("@/pages/TrocarSenha"));

function Router() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="size-8" />
        </div>
      }
    >
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/areas" component={Areas} />
        <Route path="/areas/:parent/:subarea">
          {() => (
            <RequireAuth>
              <SubAreaDetalhe />
            </RequireAuth>
          )}
        </Route>
        <Route path="/areas/:slug">
          {() => (
            <RequireAuth>
              <AreaDetalhe />
            </RequireAuth>
          )}
        </Route>
        <Route path="/tecnologias" component={Tecnologias} />
        <Route path="/tecnologias/comparar">
          {() => (
            <RequireAuth>
              <TecnologiaComparador />
            </RequireAuth>
          )}
        </Route>
        <Route path="/tecnologias/por-area" component={TecnologiaMapa} />
        {/* TODO: remover redirect após 90 dias em prod */}
        <Route path="/tecnologias/mapa">
          {() => <Redirect to="/tecnologias/por-area" />}
        </Route>
        <Route path="/tecnologias/ranking" component={TecnologiaRanking} />
        <Route path="/tecnologias/jogos">
          {() => (
            <RequireAuth>
              <TecnologiaJogos />
            </RequireAuth>
          )}
        </Route>
        <Route path="/tecnologias/:slug">
          {() => (
            <RequireAuth>
              <TecnologiaDetalhe />
            </RequireAuth>
          )}
        </Route>
        <Route path="/empresas" component={Empresas} />
        <Route path="/empresas/ranking-junior">
          {() => (
            <RequireAuth>
              <EmpresaRankingJunior />
            </RequireAuth>
          )}
        </Route>
        <Route path="/empresas/:slug">
          {() => (
            <RequireAuth>
              <EmpresaDetalhe />
            </RequireAuth>
          )}
        </Route>
        <Route path="/salarios" component={Salarios} />
        <Route path="/entrevistas" component={Entrevistas} />
        <Route path="/entrevistas/perguntas" component={EntrevistaPerguntas} />
        <Route path="/entrevistas/simulador" component={EntrevistaSimulador} />
        <Route path="/entrevistas/desafios" component={EntrevistaDesafios} />
        <Route path="/portfolio" component={Portfolio} />
        <Route path="/portfolio/analisar" component={PortfolioAnalisar} />
        <Route path="/curriculo" component={Curriculo} />
        <Route path="/curriculo/analisar" component={CurriculoAnalisar} />
        <Route path="/curriculo/gerar" component={CurriculoGerar} />
        <Route path="/curriculo/linkedin" component={CurriculoLinkedin} />
        <Route path="/linkedin/analisar" component={LinkedinAnalisar} />
        <Route path="/estudos" component={Estudos} />
        <Route path="/estudos/diario" component={EstudosDiario} />
        <Route path="/empregabilidade" component={Empregabilidade} />
        <Route path="/networking" component={Networking} />
        <Route path="/freelance" component={Freelance} />
        <Route path="/evolucao" component={Evolucao} />
        <Route path="/simulador" component={Simulador} />
        <Route path="/ingles" component={Ingles} />
        <Route path="/ingles/onde-estudar" component={InglesOndeEstudar} />
        <Route path="/ingles/no-trabalho" component={InglesNoTrabalho} />
        <Route path="/ingles/entrevista" component={InglesEntrevista} />
        <Route path="/ingles/vocabulario" component={InglesVocabulario} />
        <Route path="/ferramentas" component={Ferramentas} />
        <Route path="/ia" component={GuiaIa} />
        <Route path="/mentorias" component={Mentorias} />
        <Route path="/admin" component={Admin} />
        <Route path="/roadmaps" component={RoadmapsV2Index} />
        <Route path="/roadmaps/comecar-do-zero">
          {() => (
            <RequireAuth>
              <RoadmapCarreira roadmapId="zero-ti" />
            </RequireAuth>
          )}
        </Route>
        <Route path="/roadmaps/linkedin">
          {() => (
            <RequireAuth>
              <RoadmapCarreira roadmapId="linkedin" />
            </RequireAuth>
          )}
        </Route>
        {/* /roadmaps/ia ANTES de /roadmaps/:slug: o wouter casa na ordem e o
            segmento "ia" seria engolido pelo :slug (que redireciona slug
            desconhecido para /roadmaps). Nao reordenar. */}
        <Route path="/roadmaps/ia">
          {() => (
            <RequireAuth>
              <RoadmapIA />
            </RequireAuth>
          )}
        </Route>
        {/* Tambem ANTES de /roadmaps/:slug pela mesma razao de ordem acima. */}
        <Route path="/roadmaps/ia/:slug">
          {() => (
            <RequireAuth>
              <RoadmapIAView />
            </RequireAuth>
          )}
        </Route>
        <Route path="/roadmaps/:slug">
          {() => (
            <RequireAuth>
              <RoadmapsV2 />
            </RequireAuth>
          )}
        </Route>
        <Route path="/roadmaps-novo">{() => <Redirect to="/roadmaps" />}</Route>
        <Route path="/roadmaps-novo/:slug">
          {(params) => <Redirect to={`/roadmaps/${params.slug}`} />}
        </Route>
        <Route path="/cursos" component={Cursos} />
        <Route path="/plataformas" component={Plataformas} />
        <Route path="/faculdades/:slug">
          {() => (
            <RequireAuth>
              <FaculdadeDetalhe />
            </RequireAuth>
          )}
        </Route>
        <Route path="/faculdades" component={Faculdades} />
        <Route path="/eventos" component={Eventos} />
        <Route path="/projetos" component={Projetos} />
        <Route path="/estagio">{() => <Estagio />}</Route>
        <Route path="/carreiras">{() => <Estagio initialTab={1} />}</Route>
        <Route path="/portifolio">{() => <Estagio initialTab={2} />}</Route>
        <Route path="/noticias" component={Noticias} />
        <Route path="/comunidades" component={Comunidades} />
        <Route path="/sobre" component={Sobre} />
        <Route path="/dicas" component={Dicas} />
        <Route path="/mulheres" component={Mulheres} />
        <Route path="/dicionario" component={Dicionario} />
        <Route path="/comparador" component={Comparador} />
        <Route
          path="/quiz-carreira/resultado"
          component={QuizCarreiraResultado}
        />
        <Route path="/quiz-carreira" component={QuizCarreira} />
        <Route path="/perfil/conquistas" component={Conquistas} />
        <Route path="/perfil/favoritos" component={PerfilFavoritos} />
        <Route path="/perfil" component={Perfil} />
        <Route path="/perguntas-frequentes" component={PerguntasFrequentes} />
        <Route path="/planos/sucesso" component={CheckoutSucesso} />
        <Route path="/planos" component={Checkout} />
        {/* TODO: remover redirect após 90 dias em prod */}
        <Route path="/pro/sucesso">
          {() => <Redirect to="/planos/sucesso" />}
        </Route>
        <Route path="/pro">{() => <Redirect to="/planos" />}</Route>
        <Route path="/checkout" component={Checkout} />
        <Route path="/login">{() => <Auth mode="login" />}</Route>
        <Route path="/cadastro" component={Cadastro} />
        <Route path="/bem-vindo" component={BemVindo} />
        <Route path="/recuperar-senha" component={RecuperarSenha} />
        <Route path="/trocar-senha" component={TrocarSenha} />
        <Route path="/redefinir-senha" component={RedefinirSenha} />
        <Route path="/licenca" component={Licenca} />
        <Route path="/privacidade" component={Privacidade} />
        <Route path="/termos-de-uso" component={TermosDeUso} />
        {/* PROTOTIPO DESCARTAVEL: bordas Pro animadas. Remover junto com a pasta dev/. */}
        <Route path="/dev/pro-borders" component={DevProBorders} />
        {/* PROTOTIPO DESCARTAVEL: playground do gate de auth, so em dev. */}
        {import.meta.env.DEV && (
          <Route path="/dev/auth-gate" component={AuthGatePlayground} />
        )}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AffiliateTracker() {
  useAffiliate();
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <FavoritesProvider>
            <SubscriptionProvider>
              <TooltipProvider>
                <Toaster />
                <AffiliateTracker />
                <ScrollToTop />
                <Router />
                <AgentWidget />
              </TooltipProvider>
            </SubscriptionProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
