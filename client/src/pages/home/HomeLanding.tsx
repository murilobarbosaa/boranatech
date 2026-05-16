import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import Hero from "./sections/Hero";
import LogoLoop from "./sections/LogoLoop";
import Mapa from "./sections/Mapa";
import PorOndeComecar from "./sections/PorOndeComecar";
import TurbineComIA from "./sections/TurbineComIA";
import Numeros from "./sections/Numeros";
import PraVoce from "./sections/PraVoce";
import Pro from "./sections/Pro";
import CtaFinal from "./sections/CtaFinal";

export default function HomeLanding() {
  return (
    <Layout>
      <SEO
        title="Bora na Tech? — Sua bússola para começar em tecnologia"
        description="Plataforma de carreira em TI para iniciantes. Áreas, roadmaps, cursos, projetos, IA, eventos e carreira organizados em uma jornada clara."
        url="/"
      />
      <Hero />
      <LogoLoop />
      <Mapa />
      <PorOndeComecar />
      <TurbineComIA />
      <Numeros />
      <PraVoce />
      <Pro />
      <CtaFinal />
    </Layout>
  );
}
