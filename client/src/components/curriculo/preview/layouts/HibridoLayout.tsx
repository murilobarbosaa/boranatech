import type { Curriculo } from "@shared/curriculo/schema";

import { getLabels } from "../labels";
import Cabecalho from "../sections/Cabecalho";
import ResumoProfissional from "../sections/ResumoProfissional";
import SecaoCertificacoes from "../sections/SecaoCertificacoes";
import SecaoExperiencia from "../sections/SecaoExperiencia";
import SecaoFormacao from "../sections/SecaoFormacao";
import SecaoHabilidades from "../sections/SecaoHabilidades";
import SecaoIdiomas from "../sections/SecaoIdiomas";
import SecaoProjetos from "../sections/SecaoProjetos";

/**
 * Híbrido: cabeçalho com tagline, habilidades NO TOPO, depois experiência
 * (ou "Projetos e Atividades" pra persona estudante), projetos, formação.
 * Ordem ATS-friendly. Bom pra iniciante, transição e maioria dos juniors.
 */
export default function HibridoLayout({ curriculo }: { curriculo: Curriculo }) {
  const labels = getLabels(curriculo.idioma);
  const tituloExperiencia =
    curriculo.persona === "estudante" ? labels.projetosAtividades : labels.experiencia;

  return (
    <>
      <Cabecalho dadosPessoais={curriculo.dadosPessoais} objetivo={curriculo.objetivo} variant="tagline" />
      <ResumoProfissional resumo={curriculo.resumoProfissional} title={labels.resumo} />
      <SecaoHabilidades title={labels.habilidades} items={curriculo.habilidades} variant="wrap" />
      <SecaoExperiencia title={tituloExperiencia} items={curriculo.experiencias} />
      <SecaoProjetos title={labels.projetos} items={curriculo.projetos} />
      <SecaoFormacao title={labels.formacao} items={curriculo.formacao} />
      <SecaoIdiomas title={labels.idiomas} items={curriculo.idiomas} />
      <SecaoCertificacoes title={labels.certificacoes} items={curriculo.certificacoes} />
    </>
  );
}
