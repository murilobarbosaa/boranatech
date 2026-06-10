export interface DicaTema {
  key: string;
  label: string;
  dicas: string[];
}

export const dicasPraticas: DicaTema[] = [
  {
    key: "estagio",
    label: "Estágio",
    dicas: [
      "Candidate-se mesmo sem cumprir todos os requisitos; quase ninguém cumpre 100%.",
      "Tenha 2 a 3 projetos no GitHub pra mostrar na prática o que sabe.",
      "Prepare-se pra explicar um projeto seu do começo ao fim (o que faz e por que fez assim).",
      "Currículo de 1 página, focado em tecnologias e projetos, não em tarefas genéricas.",
      "Acompanhe as empresas que te interessam; muitos programas de estágio abrem turmas em períodos específicos do ano.",
      "Use o LinkedIn: perfil completo e postar o que está aprendendo abre portas.",
      "No estágio: pergunte sem medo, anote tudo, peça feedback e entregue o combinado.",
    ],
  },
  {
    key: "curriculo",
    label: "Currículo e LinkedIn",
    dicas: [
      "1 página, objetivo, com tecnologias e links dos projetos.",
      "Adapte o currículo pra cada vaga, usando palavras da descrição.",
      "Corte o irrelevante; foque no que importa pra vaga.",
      "LinkedIn com foto, headline clara e projetos fixados.",
      "Peça pra alguém da área revisar antes de enviar.",
    ],
  },
  {
    key: "entrevistas",
    label: "Entrevistas",
    dicas: [
      "Revise lógica e o básico da stack da vaga.",
      "Pratique explicar seu raciocínio em voz alta enquanto resolve.",
      "Tenha exemplos reais prontos pra perguntas comportamentais.",
      "Não saber tudo é normal; mostre como você aprende e busca solução.",
      "Prepare perguntas pra fazer no fim (mostra interesse).",
    ],
  },
  {
    key: "portfolio",
    label: "Portfólio e GitHub",
    dicas: [
      "Projetos que resolvem algo real valem mais que clones de tutorial.",
      "README claro em cada projeto: o que é, como rodar, um print.",
      "2 a 3 projetos bem-feitos superam 10 pela metade.",
      "Commits frequentes e GitHub organizado contam como evidência.",
    ],
  },
  {
    key: "estudar",
    label: "Como estudar",
    dicas: [
      "Aprenda fazendo: teoria e prática juntas.",
      "Uma trilha por vez; evite pular de tecnologia em tecnologia.",
      "Reconstrua do zero o que aprendeu pra fixar.",
      "Constância vale mais que maratona; pouco e todo dia.",
      "Documente o que aprende (vira revisão e portfólio).",
    ],
  },
  {
    key: "softskills",
    label: "Soft skills",
    dicas: [
      "Comunique com clareza e saiba explicar o que fez.",
      "Faça boas perguntas: diga o contexto e o que já tentou.",
      "Code review com humildade; feedback não é ataque.",
      "Gestão de tempo e foco fazem diferença.",
      "Inglês técnico destrava documentação e oportunidades.",
    ],
  },
  {
    key: "carreira",
    label: "Carreira e mercado",
    dicas: [
      "Foque em fundamentos, não só na ferramenta da moda.",
      "Networking: comunidades e eventos abrem portas reais.",
      "Peça feedback e mostre evolução pra crescer de júnior pra pleno.",
      "Ajudar outras pessoas também acelera seu aprendizado.",
    ],
  },
  {
    key: "bemestar",
    label: "Bem-estar",
    dicas: [
      "Ritmo sustentável; aprender cansa e descansar faz parte.",
      "Comparação é armadilha; cada trajetória é uma.",
      "Pedir ajuda é maturidade, não fraqueza.",
    ],
  },
];
