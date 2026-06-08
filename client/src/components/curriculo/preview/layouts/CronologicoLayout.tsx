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
 * Cronológico: cabeçalho à esquerda, experiência em destaque (lista temporal
 * da mais recente pra mais antiga, assumindo que a IA já entregou nessa
 * ordem), depois formação, habilidades, projetos. Pra quem tem histórico.
 */
export default function CronologicoLayout({
  curriculo,
}: {
  curriculo: Curriculo;
}) {
  const labels = getLabels(curriculo.idioma);
  const tituloExperiencia =
    curriculo.persona === "estudante"
      ? labels.projetosAtividades
      : labels.experiencia;

  return (
    <>
      <Cabecalho
        dadosPessoais={curriculo.dadosPessoais}
        objetivo={curriculo.objetivo}
        variant="left"
      />
      <ResumoProfissional
        resumo={curriculo.resumoProfissional}
        title={labels.resumo}
      />
      <SecaoExperiencia
        title={tituloExperiencia}
        items={curriculo.experiencias}
      />
      <SecaoFormacao title={labels.formacao} items={curriculo.formacao} />
      <SecaoHabilidades
        title={labels.habilidades}
        items={curriculo.habilidades}
        variant="wrap"
      />
      <SecaoProjetos title={labels.projetos} items={curriculo.projetos} />
      <SecaoIdiomas title={labels.idiomas} items={curriculo.idiomas} />
      <SecaoCertificacoes
        title={labels.certificacoes}
        items={curriculo.certificacoes}
      />
    </>
  );
}
