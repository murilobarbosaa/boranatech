import CreatorsBand from "@/components/shared/CreatorsBand";
import DicaDoDia from "./sections/DicaDoDia";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import Hero from "./sections/Hero";
import OQueEncontra from "./sections/OQueEncontra";
import LogoLoop from "./sections/LogoLoop";
import ProQuemE from "./sections/ProQuemE";
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
        title="Bora na Tech? · Sua bússola para começar em tecnologia"
        description="Plataforma de carreira em TI para iniciantes. Áreas, roadmaps, cursos, projetos, IA, eventos e carreira organizados em uma jornada clara."
        url="/"
      />
      <CreatorsBand />
      <Hero />
      <OQueEncontra />
      <LogoLoop />
      <ProQuemE />
      <Mapa />
      <PorOndeComecar />
      <TurbineComIA />
      <Numeros />
      <PraVoce />
      <DicaDoDia />
      <Pro />
      <CtaFinal />
    </Layout>
  );
}
