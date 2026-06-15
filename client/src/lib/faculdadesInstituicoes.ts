export interface FaculdadeCurso {
  instituicao: string;
  sigla: string;
  curso: string;
  grau: "Técnico" | "Tecnólogo" | "Bacharelado";
  duracao: string;
  modalidade: "Presencial" | "EAD" | "Híbrido";
  uf: string;
  rede: "Pública" | "Privada";
  url: string;
  reputacao: string;
  areasLeva: string[];
}

export const EMEC_URL = "https://emec.mec.gov.br";

export const faculdadesInstituicoes: FaculdadeCurso[] = [
  {
    "instituicao": "Centro Universitário Internacional Uninter",
    "sigla": "Uninter",
    "curso": "Análise e Desenvolvimento de Sistemas",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://www.uninter.com/graduacao/a-distancia/tecnologia-em-analise-e-desenvolvimento-de-sistemas/",
    "reputacao": "instituicao com tradicao em ensino a distancia e ampla rede de polos",
    "areasLeva": [
      "Desenvolvimento",
      "Full-stack",
      "QA"
    ]
  },
  {
    "instituicao": "Centro Universitário Internacional Uninter",
    "sigla": "Uninter",
    "curso": "Segurança da Informação",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://www.uninter.com/graduacao-ead/tecnologia-em-seguranca-da-informacao/",
    "reputacao": "referencia em EAD no Brasil com catalogo amplo de cursos de tecnologia",
    "areasLeva": [
      "Seguranca",
      "Pentest",
      "SOC"
    ]
  },
  {
    "instituicao": "Centro Universitário Internacional Uninter",
    "sigla": "Uninter",
    "curso": "Ciência de Dados",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://www.uninter.com/graduacao/a-distancia/tecnologia-em-ciencia-de-dados/",
    "reputacao": "instituicao com forte estrutura de ensino online e presenca nacional",
    "areasLeva": [
      "Ciencia de dados",
      "BI",
      "Machine Learning"
    ]
  },
  {
    "instituicao": "Centro Universitário Internacional Uninter",
    "sigla": "Uninter",
    "curso": "Gestão da Tecnologia da Informação",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://www.uninter.com/graduacao/a-distancia/tecnologia-em-gestao-da-tecnologia-da-informacao/",
    "reputacao": "rede consolidada em educacao a distancia com muitos polos pelo pais",
    "areasLeva": [
      "Gestao de TI",
      "Governanca",
      "Produto"
    ]
  },
  {
    "instituicao": "CESAR School",
    "sigla": "CESAR School",
    "curso": "Análise e Desenvolvimento de Sistemas",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "Presencial",
    "uf": "PE",
    "rede": "Privada",
    "url": "https://www.cesar.school/graduacao/analise-e-desenvolvimento-de-sistemas-ads/",
    "reputacao": "escola ligada ao centro de inovacao CESAR no Recife, com ensino baseado em problemas reais e empreendedorismo.",
    "areasLeva": [
      "Desenvolvimento",
      "Full-stack",
      "QA"
    ]
  },
  {
    "instituicao": "Faculdade Anhanguera",
    "sigla": "Anhanguera",
    "curso": "Análise e Desenvolvimento de Sistemas",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://estudenaanhanguera.com.br/analise-e-desenvolvimento-de-sistemas-tecnologo/",
    "reputacao": "rede nacional do grupo Cogna com forte atuacao em EAD pelo Brasil",
    "areasLeva": [
      "Desenvolvimento",
      "Full-stack",
      "QA"
    ]
  },
  {
    "instituicao": "Faculdade Anhanguera",
    "sigla": "Anhanguera",
    "curso": "Sistemas para Internet",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://estudenaanhanguera.com.br/sistemas-para-internet-tecnologo/",
    "reputacao": "rede ampla com muitos polos presenciais e oferta robusta de cursos online",
    "areasLeva": [
      "Desenvolvimento web",
      "Front-end",
      "Back-end"
    ]
  },
  {
    "instituicao": "Faculdade Anhanguera",
    "sigla": "Anhanguera",
    "curso": "Gestão da Tecnologia da Informação",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://estudenaanhanguera.com.br/gestao-da-tecnologia-da-informacao-tecnologo/",
    "reputacao": "instituicao popular de grande alcance nacional na modalidade a distancia",
    "areasLeva": [
      "Gestao de TI",
      "Governanca",
      "Produto"
    ]
  },
  {
    "instituicao": "Faculdade Anhanguera",
    "sigla": "Anhanguera",
    "curso": "Jogos Digitais",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://estudenaanhanguera.com.br/jogos-digitais-tecnologo/",
    "reputacao": "rede grande e acessivel com variedade de cursos de tecnologia em EAD",
    "areasLeva": [
      "Desenvolvimento de jogos"
    ]
  },
  {
    "instituicao": "Faculdade de Informática e Administração Paulista",
    "sigla": "FIAP",
    "curso": "Engenharia de Software",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Híbrido",
    "uf": "SP",
    "rede": "Privada",
    "url": "https://www.fiap.com.br/graduacao/bacharelado/engenharia-de-software/",
    "reputacao": "instituicao privada conhecida pelo foco em tecnologia e inovacao, com formacao full stack e ofertas presencial, online e semipresencial.",
    "areasLeva": [
      "Desenvolvimento",
      "Arquitetura de software",
      "Lideranca tecnica"
    ]
  },
  {
    "instituicao": "Faculdade de Informática e Administração Paulista",
    "sigla": "FIAP",
    "curso": "Engenharia de Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "SP",
    "rede": "Privada",
    "url": "https://www.fiap.com.br/graduacao/bacharelado/engenharia-de-computacao/",
    "reputacao": "curso com forte enfase pratica em projetos e laboratorios, abordando IA, IoT e sistemas embarcados.",
    "areasLeva": [
      "Sistemas embarcados",
      "IoT",
      "Redes",
      "Robotica"
    ]
  },
  {
    "instituicao": "Faculdade Descomplica",
    "sigla": "Descomplica",
    "curso": "Análise e Desenvolvimento de Sistemas",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://descomplica.com.br/faculdade/tecnologia/analise-e-desenvolvimento-de-sistemas/",
    "reputacao": "faculdade 100% digital voltada a flexibilidade e preco acessivel",
    "areasLeva": [
      "Desenvolvimento",
      "Full-stack",
      "QA"
    ]
  },
  {
    "instituicao": "Faculdade Descomplica",
    "sigla": "Descomplica",
    "curso": "Jogos Digitais",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://descomplica.com.br/faculdade/tecnologia/jogos-digitais/",
    "reputacao": "instituicao totalmente online com cursos curtos e foco no mercado",
    "areasLeva": [
      "Desenvolvimento de jogos"
    ]
  },
  {
    "instituicao": "Faculdade Descomplica",
    "sigla": "Descomplica",
    "curso": "Sistemas para Internet",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://descomplica.com.br/faculdade/tecnologia/sistemas-para-internet/",
    "reputacao": "faculdade digital com trilhas praticas e enfase em desenvolvimento web",
    "areasLeva": [
      "Desenvolvimento web",
      "Front-end",
      "Back-end"
    ]
  },
  {
    "instituicao": "Ibmec",
    "sigla": "IBMEC",
    "curso": "Engenharia de Software",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "SP",
    "rede": "Privada",
    "url": "https://www.ibmec.br/graduacao/engenharia-de-software",
    "reputacao": "instituicao privada reconhecida na area de negocios que ampliou sua atuacao em tecnologia e engenharia.",
    "areasLeva": [
      "Desenvolvimento",
      "Arquitetura de software",
      "Lideranca tecnica"
    ]
  },
  {
    "instituicao": "Instituto de Tecnologia e Liderança",
    "sigla": "Inteli",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "SP",
    "rede": "Privada",
    "url": "https://www.inteli.edu.br/ciencia-da-computacao/",
    "reputacao": "instituto novo focado em tecnologia e lideranca, com ensino baseado em projetos reais junto a empresas parceiras.",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Instituto Tecnológico de Aeronáutica",
    "sigla": "ITA",
    "curso": "Engenharia de Computação",
    "grau": "Bacharelado",
    "duracao": "5 anos",
    "modalidade": "Presencial",
    "uf": "SP",
    "rede": "Pública",
    "url": "https://comp.ita.br/ensino/graduacao.html",
    "reputacao": "instituto federal de engenharia muito seletivo, ligado à Força Aérea",
    "areasLeva": [
      "Sistemas embarcados",
      "IoT",
      "Redes",
      "Robotica"
    ]
  },
  {
    "instituicao": "Pontifícia Universidade Católica de Minas Gerais",
    "sigla": "PUC Minas",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "MG",
    "rede": "Privada",
    "url": "https://vemprapuc.pucminas.br/graduacao/ciencia-da-computacao",
    "reputacao": "instituicao privada mineira de grande porte, com formacao que equilibra teoria e pratica em computacao.",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Pontifícia Universidade Católica do Paraná",
    "sigla": "PUCPR",
    "curso": "Engenharia de Software",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "PR",
    "rede": "Privada",
    "url": "https://www.pucpr.br/cursos-graduacao/engenharia-de-software/",
    "reputacao": "universidade privada do Parana com curriculo voltado ao mercado, metodologias ativas e temas como DevOps e seguranca.",
    "areasLeva": [
      "Desenvolvimento",
      "Arquitetura de software",
      "Lideranca tecnica"
    ]
  },
  {
    "instituicao": "Pontifícia Universidade Católica do Rio de Janeiro",
    "sigla": "PUC-Rio",
    "curso": "Engenharia de Computação",
    "grau": "Bacharelado",
    "duracao": "5 anos",
    "modalidade": "Presencial",
    "uf": "RJ",
    "rede": "Privada",
    "url": "https://www.inf.puc-rio.br/cursos/engenharia-de-computacao/",
    "reputacao": "universidade privada tradicional do Rio, com departamento de informatica forte em pesquisa e parcerias com a industria.",
    "areasLeva": [
      "Sistemas embarcados",
      "IoT",
      "Redes",
      "Robotica"
    ]
  },
  {
    "instituicao": "Pontifícia Universidade Católica do Rio de Janeiro",
    "sigla": "PUC-Rio",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "RJ",
    "rede": "Privada",
    "url": "https://www.puc-rio.br/ensinopesq/ccg/ciencia_computacao.html",
    "reputacao": "curso consolidado com laboratorios tematicos e diversas oportunidades de estagio remunerado.",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade de Brasília",
    "sigla": "UnB",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "DF",
    "rede": "Pública",
    "url": "https://www.cic.unb.br/ensino/graduacao",
    "reputacao": "universidade federal da capital, com departamento de computação consolidado",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade de Fortaleza",
    "sigla": "Unifor",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "CE",
    "rede": "Privada",
    "url": "https://unifor.br/web/graduacao/ciencia-da-computacao",
    "reputacao": "maior universidade privada do Ceara, com parque tecnologico e ecossistema de inovacao e empreendedorismo.",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade de São Paulo",
    "sigla": "USP",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "SP",
    "rede": "Pública",
    "url": "https://bcc.ime.usp.br/",
    "reputacao": "maior universidade pública do país, referência tradicional em computação no IME",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade Estácio de Sá",
    "sigla": "Estácio",
    "curso": "Análise e Desenvolvimento de Sistemas",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://estacio.br/cursos/graduacao/analise-e-desenvolvimento-de-sistemas",
    "reputacao": "rede grande e tradicional com forte presenca em EAD por todo o Brasil",
    "areasLeva": [
      "Desenvolvimento",
      "Full-stack",
      "QA"
    ]
  },
  {
    "instituicao": "Universidade Estácio de Sá",
    "sigla": "Estácio",
    "curso": "Defesa Cibernética",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://estacio.br/cursos/graduacao/defesa-cibernetica",
    "reputacao": "rede consolidada com ampla oferta de cursos de tecnologia a distancia",
    "areasLeva": [
      "Seguranca",
      "Pentest",
      "SOC"
    ]
  },
  {
    "instituicao": "Universidade Estácio de Sá",
    "sigla": "Estácio",
    "curso": "Gestão da Tecnologia da Informação",
    "grau": "Tecnólogo",
    "duracao": "2,5 anos",
    "modalidade": "EAD",
    "uf": "Nacional",
    "rede": "Privada",
    "url": "https://estacio.br/cursos/graduacao/gestao-da-tecnologia-da-informacao",
    "reputacao": "instituicao de grande porte com muitos polos e cursos de TI em EAD",
    "areasLeva": [
      "Gestao de TI",
      "Governanca",
      "Produto"
    ]
  },
  {
    "instituicao": "Universidade Estadual de Campinas",
    "sigla": "Unicamp",
    "curso": "Engenharia de Computação",
    "grau": "Bacharelado",
    "duracao": "5 anos",
    "modalidade": "Presencial",
    "uf": "SP",
    "rede": "Pública",
    "url": "https://ic.unicamp.br/graduacao/engenharia-da-computacao/",
    "reputacao": "universidade estadual paulista de forte tradição em pesquisa e tecnologia",
    "areasLeva": [
      "Sistemas embarcados",
      "IoT",
      "Redes",
      "Robotica"
    ]
  },
  {
    "instituicao": "Universidade Estadual de Campinas",
    "sigla": "Unicamp",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "5 anos",
    "modalidade": "Presencial",
    "uf": "SP",
    "rede": "Pública",
    "url": "https://ic.unicamp.br/graduacao/ciencia-da-computacao/",
    "reputacao": "um dos cursos de computação mais antigos do Brasil, no Instituto de Computação",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade Federal de Minas Gerais",
    "sigla": "UFMG",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "MG",
    "rede": "Pública",
    "url": "https://dcc.ufmg.br/bacharelado-em-ciencia-da-computacao/",
    "reputacao": "universidade pública federal de referência em pesquisa em computação",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade Federal de Pernambuco",
    "sigla": "UFPE",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos e meio",
    "modalidade": "Presencial",
    "uf": "PE",
    "rede": "Pública",
    "url": "https://portal.cin.ufpe.br/graduacao/ciencia-da-computacao/",
    "reputacao": "Centro de Informática reconhecido como polo de tecnologia no Nordeste",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade Federal de Santa Catarina",
    "sigla": "UFSC",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "SC",
    "rede": "Pública",
    "url": "https://cco.ufsc.br/",
    "reputacao": "universidade federal com curso de computação bem avaliado em Florianópolis",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade Federal de Viçosa",
    "sigla": "UFV",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "MG",
    "rede": "Pública",
    "url": "https://ccp.ufv.br/",
    "reputacao": "universidade federal mineira com curso de computação consolidado",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade Federal do ABC",
    "sigla": "UFABC",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "SP",
    "rede": "Pública",
    "url": "https://bcc.ufabc.edu.br/",
    "reputacao": "universidade federal de proposta interdisciplinar na região do ABC paulista",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade Federal do Ceará",
    "sigla": "UFC",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "CE",
    "rede": "Pública",
    "url": "https://www.ufc.br/ensino/guia-de-profissoes/576-ciencia-da-computacao",
    "reputacao": "universidade pública federal de referência na formação em tecnologia no Ceará",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade Federal do Rio de Janeiro",
    "sigla": "UFRJ",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "RJ",
    "rede": "Pública",
    "url": "https://ic.ufrj.br/",
    "reputacao": "universidade federal histórica, com um dos primeiros cursos de computação do país",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade Federal do Rio Grande do Sul",
    "sigla": "UFRGS",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos e meio",
    "modalidade": "Presencial",
    "uf": "RS",
    "rede": "Pública",
    "url": "https://www.inf.ufrgs.br/site/ciencia-da-computacao/",
    "reputacao": "Instituto de Informática de tradição em pesquisa no Sul do país",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade Presbiteriana Mackenzie",
    "sigla": "Mackenzie",
    "curso": "Ciência da Computação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "SP",
    "rede": "Privada",
    "url": "https://www.mackenzie.br/graduacao/sao-paulo-higienopolis/ciencia-da-computacao",
    "reputacao": "universidade privada tradicional de Sao Paulo, com longa historia no ensino e formacao solida em computacao.",
    "areasLeva": [
      "Desenvolvimento",
      "IA e Machine Learning",
      "Dados",
      "Pesquisa"
    ]
  },
  {
    "instituicao": "Universidade Presbiteriana Mackenzie",
    "sigla": "Mackenzie",
    "curso": "Sistemas de Informação",
    "grau": "Bacharelado",
    "duracao": "4 anos",
    "modalidade": "Presencial",
    "uf": "SP",
    "rede": "Privada",
    "url": "https://www.mackenzie.br/graduacao/sao-paulo-higienopolis/sistemas-de-informacao",
    "reputacao": "curso voltado a gestao e desenvolvimento de sistemas, conectando tecnologia e necessidades de negocio.",
    "areasLeva": [
      "Analise de sistemas",
      "Gestao de TI",
      "Dados"
    ]
  }
];
