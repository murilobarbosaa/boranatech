import { Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ConsentGate from "./components/consent/ConsentGate";
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

const Admin = lazyWithRetry(() => import("@/pages/Admin"));
const AreaDetalhe = lazyWithRetry(() => import("@/pages/AreaDetalhe"));
const Areas = lazyWithRetry(() => import("@/pages/Areas"));
const Auth = lazyWithRetry(() => import("@/pages/Auth"));
const BemVindo = lazyWithRetry(() => import("@/pages/BemVindo"));
const Cadastro = lazyWithRetry(() => import("@/pages/Cadastro"));
const Checkout = lazyWithRetry(() => import("@/pages/Checkout"));
const CheckoutSucesso = lazyWithRetry(() => import("@/pages/CheckoutSucesso"));
const Comparador = lazyWithRetry(() => import("@/pages/Comparador"));
const Comunidades = lazyWithRetry(() => import("@/pages/Comunidades"));
const Sobre = lazyWithRetry(() => import("@/pages/Sobre"));
const Conquistas = lazyWithRetry(() => import("@/pages/conquistas/Conquistas"));
const Creators = lazyWithRetry(() => import("@/pages/Creators"));
const CurriculoAnalisar = lazyWithRetry(() => import("@/pages/CurriculoAnalisar"));
const CurriculoGerar = lazyWithRetry(() => import("@/pages/CurriculoGerar"));
const Cursos = lazyWithRetry(() => import("@/pages/Cursos"));
const Dicas = lazyWithRetry(() => import("@/pages/Dicas"));
const Dicionario = lazyWithRetry(() => import("@/pages/Dicionario"));
const EmpresaDetalhe = lazyWithRetry(() => import("@/pages/EmpresaDetalhe"));
const EmpresaRankingJunior = lazyWithRetry(() => import("@/pages/EmpresaRankingJunior"));
const Empresas = lazyWithRetry(() => import("@/pages/Empresas"));
const EntrevistaDesafios = lazyWithRetry(() => import("@/pages/EntrevistaDesafios"));
const EntrevistaPerguntas = lazyWithRetry(() => import("@/pages/EntrevistaPerguntas"));
const EntrevistaSessao = lazyWithRetry(() => import("@/pages/EntrevistaSessao"));
const Entrevistas = lazyWithRetry(() => import("@/pages/Entrevistas"));
const Vagas = lazyWithRetry(() => import("@/pages/Vagas"));
const EstudosDiario = lazyWithRetry(() => import("@/pages/EstudosDiario"));
const Eventos = lazyWithRetry(() => import("@/pages/Eventos"));
const Evolucao = lazyWithRetry(() => import("@/pages/Evolucao"));
const FaculdadeDetalhe = lazyWithRetry(() => import("@/pages/FaculdadeDetalhe"));
const Faculdades = lazyWithRetry(() => import("@/pages/Faculdades"));
const Ferramentas = lazyWithRetry(() => import("@/pages/Ferramentas"));
const GuiaIa = lazyWithRetry(() => import("@/pages/GuiaIa"));
const Ingles = lazyWithRetry(() => import("@/pages/Ingles"));
const InglesEntrevista = lazyWithRetry(() => import("@/pages/InglesEntrevista"));
const InglesNoTrabalho = lazyWithRetry(() => import("@/pages/InglesNoTrabalho"));
const InglesOndeEstudar = lazyWithRetry(() => import("@/pages/InglesOndeEstudar"));
const InglesVocabulario = lazyWithRetry(() => import("@/pages/InglesVocabulario"));
const Licenca = lazyWithRetry(() => import("@/pages/Licenca"));
const LinkedinAnalisar = lazyWithRetry(() => import("@/pages/LinkedinAnalisar"));
const Mentorias = lazyWithRetry(() => import("@/pages/Mentorias"));
const Mulheres = lazyWithRetry(() => import("@/pages/Mulheres"));
const Noticias = lazyWithRetry(() => import("@/pages/Noticias"));
const Perfil = lazyWithRetry(() => import("@/pages/Perfil"));
const PerfilFavoritos = lazyWithRetry(() => import("@/pages/PerfilFavoritos"));
const PerguntasFrequentes = lazyWithRetry(() => import("@/pages/PerguntasFrequentes"));
const PlanoCarreira = lazyWithRetry(() => import("@/pages/PlanoCarreira"));
const Plataformas = lazyWithRetry(() => import("@/pages/Plataformas"));
const PortfolioAnalisar = lazyWithRetry(() => import("@/pages/PortfolioAnalisar"));
const Privacidade = lazyWithRetry(() => import("@/pages/Privacidade"));
const Projetos = lazyWithRetry(() => import("@/pages/Projetos"));
const QuizCarreira = lazyWithRetry(() => import("@/pages/QuizCarreira"));
const QuizCarreiraResultado = lazyWithRetry(
  () => import("@/pages/quiz-carreira/QuizCarreiraResultado"),
);
const RecuperarSenha = lazyWithRetry(() => import("@/pages/RecuperarSenha"));
const RedefinirSenha = lazyWithRetry(() => import("@/pages/RedefinirSenha"));
const RoadmapIA = lazyWithRetry(() => import("@/pages/RoadmapIA"));
const RoadmapIAView = lazyWithRetry(() => import("@/pages/RoadmapIAView"));
const RoadmapQuiz = lazyWithRetry(() => import("@/pages/RoadmapQuiz"));
const RoadmapsV2 = lazyWithRetry(() => import("@/pages/RoadmapsV2"));
const RoadmapsV2Index = lazyWithRetry(() => import("@/pages/RoadmapsV2Index"));
const Salarios = lazyWithRetry(() => import("@/pages/Salarios"));
const SubAreaDetalhe = lazyWithRetry(() => import("@/pages/SubAreaDetalhe"));
const TecnologiaComparador = lazyWithRetry(() => import("@/pages/TecnologiaComparador"));
const TecnologiaDetalhe = lazyWithRetry(() => import("@/pages/TecnologiaDetalhe"));
const TecnologiaJogos = lazyWithRetry(() => import("@/pages/TecnologiaJogos"));
const TecnologiaMapa = lazyWithRetry(() => import("@/pages/TecnologiaMapa"));
const TecnologiaRanking = lazyWithRetry(() => import("@/pages/TecnologiaRanking"));
const Tecnologias = lazyWithRetry(() => import("@/pages/Tecnologias"));
const TermosDeUso = lazyWithRetry(() => import("@/pages/TermosDeUso"));
const TrocarSenha = lazyWithRetry(() => import("@/pages/TrocarSenha"));

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
        <Route path="/creators" component={Creators} />
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
        {/* TODO: remover redirect após 90 dias em prod */}
        <Route path="/entrevistas/simulador">
          {() => <Redirect to="/entrevistas" />}
        </Route>
        <Route path="/entrevistas/sessao/:id">
          {() => (
            <RequireAuth>
              <EntrevistaSessao />
            </RequireAuth>
          )}
        </Route>
        <Route path="/entrevistas/desafios" component={EntrevistaDesafios} />
        <Route path="/portfolio">
          {() => <Redirect to="/portfolio/analisar" />}
        </Route>
        <Route path="/portfolio/analisar" component={PortfolioAnalisar} />
        <Route path="/curriculo">
          {() => <Redirect to="/curriculo/analisar" />}
        </Route>
        <Route path="/curriculo/analisar" component={CurriculoAnalisar} />
        <Route path="/curriculo/gerar" component={CurriculoGerar} />
        {/* TODO: remover redirect após 90 dias em prod */}
        <Route path="/curriculo/linkedin">
          {() => <Redirect to="/linkedin/analisar" />}
        </Route>
        <Route path="/linkedin/analisar" component={LinkedinAnalisar} />
        <Route path="/plano-carreira" component={PlanoCarreira} />
        {/* TODO: remover redirect após 90 dias em prod */}
        <Route path="/estudos">{() => <Redirect to="/plano-carreira" />}</Route>
        <Route path="/estudos/diario" component={EstudosDiario} />
        {/* TODO: remover redirect após 90 dias em prod */}
        <Route path="/empregabilidade">
          {() => <Redirect to="/entrevistas" />}
        </Route>
        {/* TODO: remover redirect após 90 dias em prod */}
        <Route path="/networking">{() => <Redirect to="/comunidades" />}</Route>
        {/* TODO: remover redirect apos 90 dias em prod */}
        <Route path="/freelance">{() => <Redirect to="/vagas" />}</Route>
        <Route path="/evolucao" component={Evolucao} />
        {/* TODO: remover redirect após 90 dias em prod */}
        <Route path="/simulador">{() => <Redirect to="/" />}</Route>
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
        {/* Tambem ANTES de /roadmaps/:slug (ordem do wouter). Nao conflita
            com as rotas de IA acima: /roadmaps/ia e /roadmaps/ia/:slug ja
            casaram antes desta. */}
        <Route path="/roadmaps/:slug/prova">
          {() => (
            <RequireAuth>
              <RoadmapQuiz />
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
        <Route path="/projetos/:id" component={Projetos} />
        <Route path="/vagas" component={Vagas} />
        {/* TODO: remover redirect apos 90 dias em prod */}
        <Route path="/estagio/freelance">
          {() => <Redirect to="/vagas" />}
        </Route>
        {/* TODO: remover redirect apos 90 dias em prod */}
        <Route path="/estagio">{() => <Redirect to="/vagas" />}</Route>
        <Route path="/carreiras">
          {() => <Redirect to="/linkedin/analisar" />}
        </Route>
        <Route path="/portifolio">{() => <Redirect to="/portfolio" />}</Route>
        <Route path="/noticias" component={Noticias} />
        <Route path="/comunidades" component={Comunidades} />
        {/* Sobre Nos e uma pagina propria; o acesso e pelo item "Sobre nos" do
            menu Comunidade (grupo CONEXOES) e por um link no rodape. */}
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
                <LaunchGate>
                  <ConsentGate>
                    <Router />
                  </ConsentGate>
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
