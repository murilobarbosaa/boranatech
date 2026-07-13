import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import SobreNos from "@/components/shared/SobreNos";

// Pagina propria do Sobre Nos (rota /sobre). O conteudo vive no componente
// compartilhado SobreNos; o acesso e pelo item "Sobre nos" do menu Comunidade
// (grupo CONEXOES) e por um link no rodape.
export default function Sobre() {
  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Sobre nós · Bora na Tech?"
        description="Quem somos e por que existimos: o Bora na Tech? é a bússola de quem quer começar em tecnologia, com curadoria, ferramentas de IA e clareza."
        url="/sobre"
      />
      <SobreNos />
    </Layout>
  );
}
