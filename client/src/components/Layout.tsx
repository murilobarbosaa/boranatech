/*
  BORA NA TECH? (Layout Component)
  Wraps all pages with Header and Footer
*/

import Header from "./Header";
import Footer from "./Footer";
import FiscalDataBanner from "./fiscal/FiscalDataBanner";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Aviso de dados fiscais pendentes. Mora aqui porque o Layout e o unico
          ponto que TODA pagina atravessa; ele proprio decide quando aparecer
          (so assinante ativo, so com dado faltando, so se nao dispensado nesta
          sessao) e devolve null no resto dos casos. */}
      <FiscalDataBanner />
      <main className="flex-1" role="main">
        {children}
      </main>
      <Footer />
    </div>
  );
}
