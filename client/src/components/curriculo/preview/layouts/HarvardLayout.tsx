import type { Curriculo } from "@shared/curriculo/schema";

import { getLabels } from "../labels";
import Cabecalho from "../sections/Cabecalho";
import SecaoCertificacoes from "../sections/SecaoCertificacoes";
import SecaoExperiencia from "../sections/SecaoExperiencia";
import SecaoFormacao from "../sections/SecaoFormacao";
import SecaoHabilidades from "../sections/SecaoHabilidades";
import SecaoIdiomas from "../sections/SecaoIdiomas";
import SecaoProjetos from "../sections/SecaoProjetos";

/**
 * Harvard: cabeçalho centralizado, resumo INTEGRADO ao topo (sem section
 * heading separada), Educação primeiro (convenção acadêmica), depois
 * Experiência, Projetos, Habilidades inline (denso pra caber em 1 página).
 */
export default function HarvardLayout({ curriculo }: { curriculo: Curriculo }) {
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
        variant="center"
      />
      {curriculo.resumoProfissional?.trim() ? (
        <p className="mb-4 text-center text-[11px] italic leading-[1.5] text-slate-700">
          {curriculo.resumoProfissional}
        </p>
      ) : null}
      <SecaoFormacao
        title={labels.formacao}
        items={curriculo.formacao}
        compact
      />
      <SecaoExperiencia
        title={tituloExperiencia}
        items={curriculo.experiencias}
        compact
      />
      <SecaoProjetos
        title={labels.projetos}
        items={curriculo.projetos}
        compact
      />
      <SecaoHabilidades
        title={labels.habilidades}
        items={curriculo.habilidades}
        variant="inline"
      />
      <SecaoIdiomas title={labels.idiomas} items={curriculo.idiomas} />
      <SecaoCertificacoes
        title={labels.certificacoes}
        items={curriculo.certificacoes}
      />
    </>
  );
}
