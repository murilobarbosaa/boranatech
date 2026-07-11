// Fonte unica dos creators que apoiam o projeto. Usada pela faixa
// (components/shared/CreatorsBand.tsx) e pela pagina /creators
// (pages/Creators.tsx). A landing estatica (client/public/lancamento.html)
// mantem a propria copia em JS por ser um HTML standalone.
//
// COMO ADICIONAR UM CREATOR (sem painel admin, so este array):
//   1. Coloque a foto em client/public/creators/.
//   2. Copie um bloco abaixo e preencha name, handle (sem o "@"), photo e
//      instagram.
//   3. Os campos de AUTODECLARACAO (bio, area, redes) sao DADO REAL do proprio
//      creator. Deixe vazios ate a pessoa fornecer o texto. NAO invente.

export interface CreatorRede {
  label: string; // ex.: "LinkedIn", "YouTube", "TikTok"
  url: string;
}

export interface Creator {
  name: string;
  handle: string; // @ sem o "@"
  photo: string; // caminho em /creators (vazio cai nas iniciais)
  instagram: string; // url do Instagram (rede principal; vazio = sem link)
  // AUTODECLARACAO: escrita pelo proprio creator, dado real. Vazio por ora.
  bio: string; // quem e / o que faz
  area: string; // area de atuacao (ex.: "Front-end", "Dados")
  redes: CreatorRede[]; // outras redes alem do Instagram
  founder?: boolean; // fundadores do Bora na Tech
}

// TODO(Ana): preencher bio, area e redes de cada creator com a autodeclaracao
// que a propria pessoa escrever. Os campos vazios abaixo sao proposital: nao
// inventamos bio, area nem redes de ninguem.
export const creators: Creator[] = [
  {
    name: "Grazi",
    handle: "grazi.tech",
    photo: "/creators/grazi-tech.jpg",
    instagram: "https://instagram.com/grazi.tech",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Jessica",
    handle: "jess.data",
    photo: "/creators/jess-data.jpg",
    instagram: "https://instagram.com/jess.data",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Gama",
    handle: "gama18k",
    photo: "/creators/gama18k.jpg",
    instagram: "https://instagram.com/gama18k",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Gabriel",
    handle: "gabrielsm.dev",
    photo: "/creators/gabrielsm-dev.jpg",
    instagram: "https://instagram.com/gabrielsm.dev",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Carol",
    handle: "carolpaier.tech",
    photo: "/creators/carolpaier.jpg",
    instagram: "https://instagram.com/carolpaier.tech",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Evelyn",
    handle: "code.evelyn",
    photo: "/creators/code-evelyn.jpg",
    instagram: "https://instagram.com/code.evelyn",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Ketlyn",
    handle: "ketlyncode",
    photo: "/creators/ketlyncode.jpg",
    instagram: "https://instagram.com/ketlyncode",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Ray",
    handle: "raibyhei",
    photo: "/creators/raibyhei.jpg",
    instagram: "https://instagram.com/raibyhei",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Dio Augusto",
    handle: "dioaugusto.dev",
    photo: "/creators/dioaugusto-dev.jpg",
    instagram: "https://instagram.com/dioaugusto.dev",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Nicole",
    handle: "devnicolelobo",
    photo: "/creators/devnicolelobo.jpg",
    instagram: "https://instagram.com/devnicolelobo",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Andre",
    handle: "andrebrito.dev",
    photo: "/creators/andrebrito-dev.jpg",
    instagram: "https://instagram.com/andrebrito.dev",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Vanessa",
    handle: "vua_nessa",
    photo: "/creators/vua_nessa.jpg",
    instagram: "https://instagram.com/vua_nessa",
    bio: "",
    area: "",
    redes: [],
  },
  {
    name: "Moni",
    handle: "monihillman",
    photo: "/creators/monihillman.jpg",
    instagram: "https://instagram.com/monihillman",
    bio: "",
    area: "",
    redes: [],
  },
];

// TODO(Ana): fundadores. Voce notou que voce e o Murilo ainda nao aparecem
// como creators. Preencha handle, photo (em /creators) e a autodeclaracao dos
// dois. Deixei os campos vazios de proposito: nao inventei handle, foto, bio,
// area nem redes de ninguem.
export const founders: Creator[] = [
  {
    name: "Ana",
    handle: "",
    photo: "",
    instagram: "",
    bio: "",
    area: "",
    redes: [],
    founder: true,
  },
  {
    name: "Murilo",
    handle: "",
    photo: "",
    instagram: "",
    bio: "",
    area: "",
    redes: [],
    founder: true,
  },
];
