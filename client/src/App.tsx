import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAffiliate } from "./hooks/useAffiliate";
import Home from "./pages/Home";
import Areas from "./pages/Areas";
import AreaDetalhe from "./pages/AreaDetalhe";
import Roadmaps from "./pages/Roadmaps";
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
import Perfil from "./pages/Perfil";
import Auth from "./pages/Auth";
import Cadastro from "./pages/Cadastro";
import RecuperarSenha from "./pages/RecuperarSenha";
import NovaSenha from "./pages/NovaSenha";
import Tecnologias from "./pages/Tecnologias";
import TecnologiaDetalhe from "./pages/TecnologiaDetalhe";
import TecnologiaComparador from "./pages/TecnologiaComparador";
import TecnologiaMapa from "./pages/TecnologiaMapa";
import TecnologiaRanking from "./pages/TecnologiaRanking";
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
import CurriculoLinkedin from "./pages/CurriculoLinkedin";
import Estudos from "./pages/Estudos";
import EstudosDiario from "./pages/EstudosDiario";
import Empregabilidade from "./pages/Empregabilidade";
import Networking from "./pages/Networking";
import Freelance from "./pages/Freelance";
import Evolucao from "./pages/Evolucao";
import Simulador from "./pages/Simulador";
import Ingles from "./pages/Ingles";
import Ferramentas from "./pages/Ferramentas";
import Mentorias from "./pages/Mentorias";
import Admin from "./pages/Admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/areas" component={Areas} />
      <Route path="/areas/:slug" component={AreaDetalhe} />
      <Route path="/tecnologias" component={Tecnologias} />
      <Route path="/tecnologias/comparar" component={TecnologiaComparador} />
      <Route path="/tecnologias/mapa" component={TecnologiaMapa} />
      <Route path="/tecnologias/ranking" component={TecnologiaRanking} />
      <Route path="/tecnologias/:slug" component={TecnologiaDetalhe} />
      <Route path="/empresas" component={Empresas} />
      <Route path="/empresas/ranking-junior" component={EmpresaRankingJunior} />
      <Route path="/empresas/:slug" component={EmpresaDetalhe} />
      <Route path="/salarios" component={Salarios} />
      <Route path="/entrevistas" component={Entrevistas} />
      <Route path="/entrevistas/perguntas" component={EntrevistaPerguntas} />
      <Route path="/entrevistas/simulador" component={EntrevistaSimulador} />
      <Route path="/entrevistas/desafios" component={EntrevistaDesafios} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/portfolio/analisar" component={PortfolioAnalisar} />
      <Route path="/curriculo" component={Curriculo} />
      <Route path="/curriculo/analisar" component={CurriculoAnalisar} />
      <Route path="/curriculo/linkedin" component={CurriculoLinkedin} />
      <Route path="/estudos" component={Estudos} />
      <Route path="/estudos/diario" component={EstudosDiario} />
      <Route path="/empregabilidade" component={Empregabilidade} />
      <Route path="/networking" component={Networking} />
      <Route path="/freelance" component={Freelance} />
      <Route path="/evolucao" component={Evolucao} />
      <Route path="/simulador" component={Simulador} />
      <Route path="/ingles" component={Ingles} />
      <Route path="/ferramentas" component={Ferramentas} />
      <Route path="/mentorias" component={Mentorias} />
      <Route path="/admin" component={Admin} />
      <Route path="/roadmaps" component={Roadmaps} />
      <Route path="/cursos" component={Cursos} />
      <Route path="/plataformas" component={Plataformas} />
      <Route path="/faculdades/:slug" component={FaculdadeDetalhe} />
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
      <Route path="/quiz-carreira" component={QuizCarreira} />
      <Route path="/perfil" component={Perfil} />
      <Route path="/login">{() => <Auth mode="login" />}</Route>
      <Route path="/cadastro" component={Cadastro} />
      <Route path="/recuperar-senha" component={RecuperarSenha} />
      <Route path="/nova-senha" component={NovaSenha} />
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
          <SubscriptionProvider>
            <TooltipProvider>
              <Toaster />
              <AffiliateTracker />
              <ScrollToTop />
              <Router />
            </TooltipProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
