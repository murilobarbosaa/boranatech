// Cursos de influencers/creators parceiros do Bora na Tech. Fonte unica,
// consumida pela pagina de Cursos (card pinned no topo) e pelo destaque no
// topo dos roadmaps (client/src/components/roadmapV2/RoadmapFeaturedCourse).
// Modelado como array generico pra escalar pros proximos parceiros sem
// refatoracao. roadmapSlugs controla em quais trilhas o destaque aparece.

export type CursoParceiro = {
  id: string;
  titulo: string;
  autor: string;
  link: string;
  descricao: string;
  tipo: "Gratuito" | "Pago";
  // Caminho da logo servida em client/public (raiz do Vite), ex.: "/logo.avif".
  logo: string;
  // Slugs das trilhas (shared/roadmapV2) onde este parceiro aparece em
  // destaque. Vazio = nao aparece em nenhum roadmap.
  roadmapSlugs: string[];
};

export const cursosParceiros: CursoParceiro[] = [
  {
    id: "aceleradev",
    titulo: "AceleraDev",
    autor: "PC (pctheone)",
    link: "https://aceleradev.com.br/",
    tipo: "Pago",
    logo: "/aceleradev.avif",
    roadmapSlugs: ["fullstack", "frontend", "backend"],
    descricao:
      "Comunidade e método prático para conquistar sua primeira (ou melhor) vaga em tech, mesmo sem experiência. Foco em currículo, LinkedIn, preparação para entrevistas e networking no Discord. Não é um curso de programação: é sobre posicionamento e entrada no mercado tech.",
  },
];
