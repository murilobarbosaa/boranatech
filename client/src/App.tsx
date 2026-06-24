import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import LaunchGate from "./components/gate/LaunchGate";
import ScrollToTop from "./components/ScrollToTop";
import RequireAuth from "./components/auth/RequireAuth";
import { AuthProvider } from "./contexts/AuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAffiliate } from "./hooks/useAffiliate";
import Home from "./pages/home/HomeLanding";
import Areas from "./pages/Areas";
import AreaDetalhe from "./pages/AreaDetalhe";
import SubAreaDetalhe from "./pages/SubAreaDetalhe";
import RoadmapCarreira from "./pages/RoadmapCarreira";
import RoadmapsV2 from "./pages/RoadmapsV2";
import RoadmapsV2Index from "./pages/RoadmapsV2Index";
import Cursos from "./pages/Cursos";
import Plataformas from "./pages/Plataformas";
import Faculdades from "./pages/Faculdades";
import FaculdadeDetalhe from "./pages/FaculdadeDetalhe";
import Eventos from "./pages/Eventos";
import Projetos from "./pages/Projetos";
import Estagio from "./pages/Estagio";
import Noticias from "./pages/Noticias";
import Comunidades from "./pages/Comunidades";
import Sobre from "./pages/Sobre";
import Dicas from "./pages/Dicas";
import Mulheres from "./pages/Mulheres";
import Dicionario from "./pages/Dicionario";
import Comparador from "./pages/Comparador";
import QuizCarreira from "./pages/QuizCarreira";
import QuizCarreiraResultado from "./pages/quiz-carreira/QuizCarreiraResultado";
import Perfil from "./pages/Perfil";
import PerfilFavoritos from "./pages/PerfilFavoritos";
import Conquistas from "./pages/conquistas/Conquistas";
import Auth from "./pages/Auth";
import Cadastro from "./pages/Cadastro";
import BemVindo from "./pages/BemVindo";
import Checkout from "./pages/Checkout";
import CheckoutSucesso from "./pages/CheckoutSucesso";
import RecuperarSenha from "./pages/RecuperarSenha";
import TrocarSenha from "./pages/TrocarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import Tecnologias from "./pages/Tecnologias";
import TecnologiaDetalhe from "./pages/TecnologiaDetalhe";
import TecnologiaComparador from "./pages/TecnologiaComparador";
import TecnologiaMapa from "./pages/TecnologiaMapa";
import TecnologiaRanking from "./pages/TecnologiaRanking";
import TecnologiaJogos from "./pages/TecnologiaJogos";
import Empresas from "./pages/Empresas";
import EmpresaDetalhe from "./pages/EmpresaDetalhe";
import EmpresaRankingJunior from "./pages/EmpresaRankingJunior";
import Salarios from "./pages/Salarios";
import Entrevistas from "./pages/Entrevistas";
import EntrevistaPerguntas from "./pages/EntrevistaPerguntas";
import EntrevistaSimulador from "./pages/EntrevistaSimulador";
import EntrevistaDesafios from "./pages/EntrevistaDesafios";
import Portfolio from "./pages/Portfolio";
import PortfolioAnalisar from "./pages/PortfolioAnalisar";
import Curriculo from "./pages/Curriculo";
import CurriculoAnalisar from "./pages/CurriculoAnalisar";
import CurriculoGerar from "./pages/CurriculoGerar";
import CurriculoLinkedin from "./pages/CurriculoLinkedin";
import LinkedinAnalisar from "./pages/LinkedinAnalisar";
import Estudos from "./pages/Estudos";
import EstudosDiario from "./pages/EstudosDiario";
import Empregabilidade from "./pages/Empregabilidade";
import Networking from "./pages/Networking";
import Freelance from "./pages/Freelance";
import Evolucao from "./pages/Evolucao";
import Simulador from "./pages/Simulador";
import Ingles from "./pages/Ingles";
import InglesOndeEstudar from "./pages/InglesOndeEstudar";
import InglesNoTrabalho from "./pages/InglesNoTrabalho";
import InglesEntrevista from "./pages/InglesEntrevista";
import InglesVocabulario from "./pages/InglesVocabulario";
import Ferramentas from "./pages/Ferramentas";
import GuiaIa from "./pages/GuiaIa";
import Mentorias from "./pages/Mentorias";
import Admin from "./pages/Admin";
import Licenca from "./pages/Licenca";
import Privacidade from "./pages/Privacidade";
import TermosDeUso from "./pages/TermosDeUso";
import DevProBorders from "./pages/dev/ProBordersPlayground";

function Router() {
  return (
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
      <Route path="/tecnologias/por-area">
        {() => (
          <RequireAuth>
            <TecnologiaMapa />
          </RequireAuth>
        )}
      </Route>
      {/* TODO: remover redirect após 90 dias em prod */}
      <Route path="/tecnologias/mapa">
        {() => <Redirect to="/tecnologias/por-area" />}
      </Route>
      <Route path="/tecnologias/ranking">
        {() => (
          <RequireAuth>
            <TecnologiaRanking />
          </RequireAuth>
        )}
      </Route>
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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
                <LaunchGate>
                  <Router />
                </LaunchGate>
              </TooltipProvider>
            </SubscriptionProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
