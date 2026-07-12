// Editar APENAS estes valores quando atualizar redes/links.
// Quando uma URL social estiver vazia, o ícone vira placeholder não-clicável ("em breve").

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/boranatech/",
  linkedin: "https://www.linkedin.com/in/bora-na-tech-b17107412/",
  tiktok: "https://www.tiktok.com/@boranatech_",
  twitter: "https://x.com/boranatech",
} as const;

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: readonly FooterLink[] };

export const FOOTER_COLUMNS: Record<string, FooterColumn> = {
  explorar: {
    title: "EXPLORAR",
    links: [
      { label: "Áreas da TI", href: "/areas" },
      { label: "Roadmaps", href: "/roadmaps" },
      { label: "Cursos", href: "/cursos" },
      { label: "Plataformas", href: "/plataformas" },
      { label: "Faculdades", href: "/faculdades" },
      { label: "Dicionário", href: "/dicionario" },
    ],
  },
  carreira: {
    title: "CARREIRA",
    links: [
      { label: "Eventos Tech", href: "/eventos" },
      { label: "Projetos", href: "/projetos" },
      // TODO(Ana): validar o label do link de vagas
      { label: "Vagas e Carreira", href: "/vagas" },
      { label: "Notícias", href: "/noticias" },
      { label: "Dicas", href: "/dicas" },
    ],
  },
  comunidade: {
    title: "COMUNIDADE",
    links: [
      { label: "Comunidades", href: "/comunidades" },
      { label: "Área de Mulheres", href: "/mulheres" },
      { label: "Mentorias", href: "/mentorias" },
      { label: "Quiz de Carreira", href: "/quiz-carreira" },
    ],
  },
  projeto: {
    title: "PROJETO",
    links: [
      { label: "Sobre o Projeto", href: "/sobre" },
      { label: "Perguntas frequentes", href: "/perguntas-frequentes" },
      { label: "Comparador", href: "/comparador" },
      { label: "Missão e Valores", href: "/sobre#missao" },
      { label: "Licença Creative Commons", href: "/licenca" },
      { label: "Termos de Uso", href: "/termos-de-uso" },
      { label: "Política de Privacidade", href: "/privacidade" },
    ],
  },
} as const;
