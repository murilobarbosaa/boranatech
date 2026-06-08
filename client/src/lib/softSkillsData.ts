export interface SoftSkillRecurso {
  nome: string;
  url: string;
  oQueE: string;
}

export interface SoftSkill {
  nome: string;
  oQueE: string;
  porQueImportaEmTI: string;
  comoDesenvolver: string[];
  recursos: SoftSkillRecurso[];
  areas?: string[];
}

export const softSkills: SoftSkill[] = [
  {
    nome: "Comunicação",
    oQueE:
      "Explicar ideias com clareza, por escrito e falando, para pessoas técnicas e não técnicas.",
    porQueImportaEmTI:
      "Dev passa o dia explicando decisão técnica na daily, escrevendo descrição de PR e documentação, e alinhando prazo e escopo com PO e clientes que não programam.",
    comoDesenvolver: [
      "Escreva um post técnico curto sobre algo que você aprendeu esta semana.",
      "Documente decisões em um ADR (Architecture Decision Record): contexto, opção escolhida e o porquê.",
      "Apresente um tema rápido na daily ou em um meetup local.",
      "Treine explicar um conceito técnico para alguém leigo, sem jargão.",
    ],
    recursos: [
      {
        nome: "dev.to",
        url: "https://dev.to",
        oQueE: "Comunidade para publicar e ler artigos técnicos.",
      },
      {
        nome: "Hashnode",
        url: "https://hashnode.com",
        oQueE: "Plataforma de blog técnico com domínio próprio gratuito.",
      },
      {
        nome: "Toastmasters",
        url: "https://www.toastmasters.org",
        oQueE: "Clubes para treinar falar em público com prática regular.",
      },
    ],
  },
  {
    nome: "Trabalho em equipe e colaboração",
    oQueE:
      "Construir junto: dividir tarefas, revisar o código dos outros e depender bem das pessoas do time.",
    porQueImportaEmTI:
      "Software é feito em time: seu código passa por code review, integra com o de outras pessoas e trava ou destrava o trabalho de colegas.",
    comoDesenvolver: [
      "Abra um Pull Request em um projeto open source e converse com o maintainer sobre os ajustes.",
      "Participe de um hackathon e entregue algo em grupo sob tempo.",
      "Faça pair programming com um colega, alternando quem escreve.",
      "Revise o PR de outra pessoa com comentários úteis, não só apontando erros.",
    ],
    recursos: [
      {
        nome: "GitHub good first issues",
        url: "https://github.com/topics/good-first-issue",
        oQueE: "Issues marcadas para quem está começando a contribuir.",
      },
      {
        nome: "Hacktoberfest",
        url: "https://hacktoberfest.com",
        oQueE: "Evento anual que incentiva contribuições em open source.",
      },
      {
        nome: "Major League Hacking",
        url: "https://mlh.io",
        oQueE: "Calendário global de hackathons para estudantes e iniciantes.",
      },
    ],
  },
  {
    nome: "Resolução de problemas e pensamento crítico",
    oQueE:
      "Decompor um problema desconhecido em partes menores e investigar até achar a causa.",
    porQueImportaEmTI:
      "O trabalho real é debugar o que ninguém entende ainda: reproduzir o bug, isolar a causa e escolher a melhor solução entre várias.",
    comoDesenvolver: [
      "Antes de codar, escreva em uma frase o problema e quebre em 3 passos.",
      "Debugue com método: reproduza, isole, levante uma hipótese e teste uma de cada vez.",
      "Resolva um desafio por dia e leia a solução de outras pessoas depois.",
      "Ajude alguém com um bug: explicar força você a raciocinar melhor.",
    ],
    recursos: [
      {
        nome: "LeetCode",
        url: "https://leetcode.com",
        oQueE: "Desafios de algoritmos e estruturas de dados.",
      },
      {
        nome: "Codewars",
        url: "https://www.codewars.com",
        oQueE: "Katas de programação com níveis crescentes de dificuldade.",
      },
      {
        nome: "Exercism",
        url: "https://exercism.org",
        oQueE: "Exercícios gratuitos com mentoria em dezenas de linguagens.",
      },
      {
        nome: "Stack Overflow",
        url: "https://stackoverflow.com",
        oQueE: "Perguntas e respostas reais sobre erros e dúvidas técnicas.",
      },
    ],
  },
  {
    nome: "Dar e receber feedback e inteligência emocional",
    oQueE:
      "Receber crítica do seu trabalho sem levar para o pessoal e dar feedback específico e gentil.",
    porQueImportaEmTI:
      "Code review e retrospectiva são constantes: seu código será criticado e você vai comentar o dos outros, sem azedar a relação do time.",
    comoDesenvolver: [
      "Peça review do seu código e trate cada comentário como melhoria, não ataque.",
      "Ao revisar, aponte o problema e sugira o caminho: que tal extrair isso numa função?",
      "Separe a pessoa do código: critique a solução, nunca quem escreveu.",
      "Participe da retrospectiva e traga um ponto de melhora sem culpar ninguém.",
    ],
    recursos: [
      {
        nome: "Conventional Comments",
        url: "https://conventionalcomments.org",
        oQueE: "Padrão para escrever feedback claro e acionável em review.",
      },
      {
        nome: "Retromat",
        url: "https://retromat.org",
        oQueE: "Gerador de formatos de retrospectiva ágil para times.",
      },
    ],
  },
  {
    nome: "Aprender a aprender e autonomia",
    oQueE:
      "Buscar e filtrar informação sozinho para resolver o que você ainda não sabe.",
    porQueImportaEmTI:
      "A stack muda toda hora: ninguém ensina tudo, então você precisa ler doc, entender mensagem de erro e se virar antes de pedir ajuda.",
    comoDesenvolver: [
      "Antes de perguntar, leia a mensagem de erro inteira e a documentação oficial.",
      "Aprenda em público: poste o que estudou, mesmo incompleto.",
      "Mantenha um plano de estudo com um roadmap e revise o progresso toda semana.",
      "Reproduza um tutorial e depois refaça do zero, sem olhar.",
    ],
    recursos: [
      {
        nome: "roadmap.sh",
        url: "https://roadmap.sh",
        oQueE: "Mapas de estudo por área para guiar o que aprender e quando.",
      },
      {
        nome: "MDN Web Docs",
        url: "https://developer.mozilla.org",
        oQueE: "Documentação oficial de referência para a web.",
      },
      {
        nome: "DevDocs",
        url: "https://devdocs.io",
        oQueE: "Documentação de várias linguagens e ferramentas num só lugar.",
      },
    ],
  },
  {
    nome: "Gestão de tempo e organização",
    oQueE:
      "Organizar estudo, entregas e estimativas para dar conta sem se afogar.",
    porQueImportaEmTI:
      "Você equilibra estudar, entregar tarefa e estimar prazo; sem organização, vira atraso e retrabalho.",
    comoDesenvolver: [
      "Use Pomodoro: 25 minutos de foco, 5 de pausa, e anote o que terminou.",
      "Faça time-blocking: reserve blocos na agenda para estudo e para foco profundo.",
      "Quebre uma tarefa grande em subtarefas de no máximo meio dia.",
      "Estime cada tarefa antes e compare com o tempo real depois para calibrar.",
    ],
    recursos: [
      {
        nome: "Notion",
        url: "https://www.notion.so",
        oQueE: "Espaço para notas, planos de estudo e organização pessoal.",
      },
      {
        nome: "Trello",
        url: "https://trello.com",
        oQueE: "Quadros estilo kanban para acompanhar tarefas.",
      },
      {
        nome: "Pomofocus",
        url: "https://pomofocus.io",
        oQueE: "Timer Pomodoro online para blocos de foco.",
      },
    ],
  },
  {
    nome: "Networking e vida em comunidade",
    oQueE:
      "Construir e manter relações na área para trocar conhecimento, mentoria e oportunidade.",
    porQueImportaEmTI:
      "Muita vaga e indicação saem primeiro em comunidade; trocar com gente mais experiente acelera o aprendizado e abre portas.",
    comoDesenvolver: [
      "Entre em uma comunidade ativa (veja a lista nesta página) e participe, não só observe.",
      "Vá a um meetup ou evento tech e converse com pelo menos uma pessoa nova.",
      "Ajude quem está começando: responder dúvida também é networking.",
      "Mantenha o LinkedIn atualizado e comente conteúdo da área de forma genuína.",
    ],
    recursos: [
      {
        nome: "Meetup",
        url: "https://www.meetup.com",
        oQueE: "Encontra meetups e eventos de tecnologia por cidade.",
      },
      {
        nome: "LinkedIn",
        url: "https://www.linkedin.com",
        oQueE: "Rede profissional para conexões, conteúdo e vagas.",
      },
      {
        nome: "GitHub",
        url: "https://github.com",
        oQueE: "Onde a comunidade open source colabora e se conhece.",
      },
    ],
  },
  {
    nome: "Inglês",
    oQueE:
      "Ler, escrever e entender inglês técnico o suficiente para trabalhar na área.",
    porQueImportaEmTI:
      "Documentação, mensagens de erro, cursos e boa parte do mercado estão em inglês; sem ele você depende de tradução e perde oportunidade.",
    comoDesenvolver: [
      "Troque a interface do celular e do editor para inglês.",
      "Consuma conteúdo técnico em inglês, com legenda no começo.",
      "Escreva seus commits, issues e PRs em inglês.",
      "Pratique conversação uma vez por semana, nem que seja com IA.",
    ],
    recursos: [
      {
        nome: "Duolingo",
        url: "https://www.duolingo.com",
        oQueE: "Lições curtas e gamificadas para criar hábito de estudo.",
      },
      {
        nome: "BBC Learning English",
        url: "https://www.bbc.co.uk/learningenglish",
        oQueE: "Cursos gratuitos de gramática, vocabulário e listening.",
      },
      {
        nome: "italki",
        url: "https://www.italki.com",
        oQueE: "Aulas e conversação com professores do mundo todo.",
      },
    ],
  },
];
