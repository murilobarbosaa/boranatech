// TODO(Ana): revisao editorial completa desta trilha (titulos, descricoes e
// todo o conteudo em markdown foram escritos a partir do roadmap legado
// "LinkedIn para Estágio e Trainee" e precisam de revisao de copy).
import type { RoadmapV2 } from "../types";

export const linkedinTrail: RoadmapV2 = {
  slug: "linkedin",
  area: "carreira",
  kind: "carreira",
  title: "LinkedIn para Estágio e Trainee",
  level: "Iniciante",
  description:
    "Como montar um LinkedIn atrativo mesmo sem experiência formal. Feita para estudantes e iniciantes buscando estágio, trainee ou primeiro emprego em TI.",
  sections: [
    {
      id: "fundacao",
      title: "Fundação do perfil",
      description:
        "A primeira impressão em dois segundos: foto e título que fazem o recrutador parar de rolar. Ajuda ter pelo menos um projeto ou curso para mostrar.",
      level: "iniciante",
      children: [
        {
          id: "fundacao.foto",
          title: "Foto profissional",
          description:
            "Boa iluminação, fundo neutro e expressão amigável, sem precisar de fotógrafo.",
          content:
            "A foto é a primeira coisa que qualquer pessoa vê no seu perfil, e perfil sem foto (ou com foto inadequada) é um dos erros mais comuns de quem está começando: muita gente nem clica pra ver o resto.\n\nA boa notícia: você não precisa de fotógrafo profissional. Precisa de três coisas. Primeiro, boa iluminação: luz natural de frente ou levemente de lado, nunca contra a luz. Perto de uma janela durante o dia resolve. Segundo, fundo neutro: uma parede lisa, sem bagunça atrás. Terceiro, expressão amigável: um sorriso natural transmite muito mais acessibilidade do que uma pose séria forçada.\n\nEnquadre do peito pra cima, com o rosto ocupando boa parte da imagem (na miniatura minúscula do feed, rosto pequeno some). Roupa alinhada com o que você usaria numa entrevista da sua área: em tecnologia, uma camiseta lisa ou camisa simples funciona bem.\n\nEvite: selfie de espelho, foto de festa cortada, foto com óculos escuros, filtro pesado, foto de anos atrás. Peça pra alguém tirar várias em sequência com o celular e escolha a mais natural. Trinta minutos de esforço aqui mudam a taxa de resposta de todo o resto do perfil.",
        },
        {
          id: "fundacao.titulo",
          title: "Título profissional",
          description:
            "A linha abaixo do seu nome que aparece em toda busca e todo convite.",
          content:
            'O título (headline) é a linha que aparece grudada no seu nome em todo lugar: nas buscas, nos convites de conexão, nos comentários. Junto com a foto, ele decide se a pessoa clica no seu perfil ou passa direto.\n\nQuem está começando costuma deixar ali só "Estudante" ou o nome da faculdade. Isso desperdiça o espaço: não diz sua área, nem o que você sabe, nem o que busca. Recrutadores buscam por palavras-chave, e um título vago te deixa fora dessas buscas.\n\nUma fórmula que funciona pra quem busca a primeira oportunidade: "Estudante de [Área] | Aprendendo [Tecnologias] | Em busca de estágio ou trainee". Por exemplo: "Estudante de Análise de Dados | Aprendendo SQL e Power BI | Em busca de estágio". Seja específico: área real, tecnologias reais que você está estudando.\n\nDois cuidados: não se descreva como algo que ainda não é ("Desenvolvedor Full Stack" sem nunca ter trabalhado soa mal na entrevista) e não entulhe o título com dez tecnologias. Duas ou três bem escolhidas comunicam melhor que uma lista de buzzwords.\n\nEssa etapa leva uma hora, incluindo olhar títulos de outras pessoas da sua área pra calibrar o seu.',
        },
      ],
    },
    {
      id: "historia",
      title: "Sua história",
      description:
        "As seções de texto onde você deixa de ser um nome com foto e vira uma pessoa com trajetória.",
      level: "iniciante",
      children: [
        {
          id: "historia.sobre",
          title: "Seção Sobre",
          description:
            "De 3 a 5 linhas contando quem você é, o que estuda e o que busca.",
          content:
            'A seção Sobre é o único lugar do perfil onde você fala com o leitor em primeira pessoa. É onde o recrutador descobre a pessoa por trás dos cursos, e é lida com atenção justamente nos perfis sem experiência formal, porque é o que existe pra avaliar.\n\nEscreva de três a cinco linhas cobrindo três pontos: quem você é (sua formação atual ou transição, de onde veio seu interesse por tecnologia), o que está aprendendo agora (área e principais tecnologias, mencionando projetos se já tiver) e o que busca (estágio, trainee, primeira oportunidade, e em quê).\n\nSeja humano e autêntico. "Descobri programação tentando automatizar planilhas no trabalho administrativo e não parei mais" conta uma história; "Profissional proativo com perfil dinâmico e foco em resultados" não diz absolutamente nada e o leitor pula. Escreva do jeito que você falaria numa conversa, sem formalidade artificial.\n\nErros a evitar: parágrafo único gigante (quebre em blocos curtos), mentir ou inflar habilidades (a entrevista revela), e terminar sem dizer o que você procura. Feche com a frase mais importante: o que você busca e como te contatar.\n\nDuas horas bastam pra escrever, deixar descansar e revisar no dia seguinte antes de publicar.',
        },
        {
          id: "historia.experiencias",
          title: "Experiências e projetos",
          description:
            "Sem emprego formal? Projetos, cursos e atividades contam sua trajetória.",
          content:
            '"Não tenho nada pra colocar em experiência" é a trava mais comum de quem busca o primeiro emprego, e ela vem de uma leitura errada: a seção não precisa conter só emprego com carteira assinada. Projetos acadêmicos, projetos pessoais, trabalho voluntário, iniciação científica, monitoria, freelas informais e atividades extracurriculares são experiência.\n\nAdicione seus projetos na seção de projetos do perfil (ou como experiência, se foi algo contínuo). Pra cada item, descreva duas coisas: o que você fez (o problema, as ferramentas, o resultado) e o que aprendeu fazendo. "Construí uma página de cadastro com validação de formulário em JavaScript; aprendi na prática a lidar com eventos e manipulação do DOM" mostra muito mais do que o nome do projeto sozinho.\n\nSempre que existir, inclua o link: repositório no GitHub, projeto no Behance, site no ar. Perfil que aponta pra trabalho real e verificável sai na frente de qualquer texto bonito.\n\nExperiências fora da tecnologia também entram se mostrarem responsabilidade e habilidades transferíveis: atendimento ensina comunicação, vendas ensina negociação, qualquer trabalho ensina prazo e convivência. Descreva com foco no que transfere.\n\nReserve duas a três horas pra montar essa seção com calma. Ela é o coração do perfil de quem está começando.',
        },
      ],
    },
    {
      id: "competencias",
      title: "Competências e formação",
      description:
        "Habilidades e educação preenchidas com honestidade, e os erros que derrubam perfis iniciantes.",
      level: "intermediario",
      children: [
        {
          id: "competencias.habilidades",
          title: "Habilidades",
          description:
            "Liste o que você realmente sabe, mesmo que em nível básico.",
          content:
            'A seção de habilidades (skills) alimenta diretamente a busca de recrutadores: quando alguém filtra candidatos por "SQL" ou "Figma", é essa seção que pesa. Deixar ela vazia te torna invisível nessas buscas; entulhar com o que você não sabe te derruba na entrevista.\n\nA regra é uma só: adicione as tecnologias e habilidades que você realmente sabe, mesmo que em nível básico. Saber o básico com honestidade é perfeitamente aceitável pra estágio e trainee; ninguém espera senioridade de quem está começando. O que não é aceitável é o blefe: mentir ou exagerar nas habilidades é o erro que mais destrói candidaturas, porque a entrevista técnica revela em cinco minutos.\n\nOrganize colocando no topo as três habilidades mais relevantes pra vaga que você busca (o LinkedIn permite fixar as principais). Inclua também habilidades de base que iniciante subestima: Git, lógica de programação, inglês de leitura, Excel ou Planilhas.\n\nCom o tempo, peça validações (endorsements) pra colegas de curso e projetos que viram você usar essas habilidades de verdade. Validação de quem conviveu com seu trabalho tem mais peso do que dezenas de cliques aleatórios.\n\nMeia hora resolve essa etapa. Volte a ela a cada tecnologia nova que você aprender de verdade.',
        },
        {
          id: "competencias.educacao",
          title: "Educação e cursos",
          description:
            "Formação e certificados relevantes, com destaque pro que é da área.",
          content:
            'A seção de educação dá contexto pra sua trajetória e também entra nos filtros de busca de recrutadores (muitas vagas de estágio filtram por curso e previsão de formatura).\n\nAdicione sua formação atual com nome da instituição, curso e período (incluindo a previsão de conclusão, que é informação chave pra vagas de estágio). Se você está em transição de carreira e a graduação anterior não é da área, inclua mesmo assim: formação completa mostra capacidade de terminar o que começa, e recrutador valoriza isso.\n\nNos certificados (licenças e certificações), inclua os cursos relevantes que você concluiu: o curso de lógica, o curso introdutório da sua área, certificações gratuitas de plataformas conhecidas. Priorize qualidade sobre quantidade: dez certificados de cursos de duas horas impressionam menos do que dois cursos densos concluídos de ponta a ponta.\n\nDica que muita gente esquece: cursos concluídos também podem aparecer na experiência da seção Sobre ou como contexto nos projetos ("projeto final do curso X"). As seções conversam entre si, e o conjunto conta a história de alguém em movimento.\n\nUma hora é suficiente pra deixar essa seção completa e atualizada.',
        },
        {
          id: "competencias.erros",
          title: "Erros comuns no perfil",
          description:
            "O checklist do que derruba perfis iniciantes e como se proteger.",
          content:
            'Antes de partir pra fase ativa da trilha, vale uma auditoria honesta no que você montou até aqui, porque três erros se repetem na maioria dos perfis iniciantes.\n\nPrimeiro: perfil incompleto. Foto ok mas Sobre vazio, experiência ok mas sem habilidades listadas. Perfil pela metade passa mensagem de desleixo, e o algoritmo de busca do LinkedIn rebaixa perfis incompletos. Percorra seção por seção e feche os buracos.\n\nSegundo: foto ausente ou inadequada. Já coberto na primeira etapa, mas vale repetir porque é o erro de maior impacto: sem foto adequada, o resto do perfil quase não é visto.\n\nTerceiro: não publicar nada por medo de julgamento. O medo é compreensível e praticamente universal, mas o custo é alto: perfil mudo não aparece no feed de ninguém e depende só de busca ativa. As próximas etapas atacam exatamente isso.\n\nE o erro transversal que contamina tudo: mentir ou exagerar. Não invente experiência, não infle nível de habilidade, não se dê títulos que não sustenta. Seja honesto sobre seu nível: "estou aprendendo X" é uma posição respeitada; ser desmascarado em entrevista fecha portas de verdade.\n\nRevise seu perfil contra esses quatro pontos antes de seguir. Quinze minutos de auditoria evitam semanas de silêncio nas candidaturas.',
        },
      ],
    },
    {
      id: "presenca",
      title: "Presença ativa",
      description:
        "Perfil pronto é o começo: agora o LinkedIn vira ferramenta de visibilidade e relacionamento.",
      level: "intermediario",
      children: [
        {
          id: "presenca.posts",
          title: "Primeiros posts",
          description:
            "Compartilhe o que está aprendendo, sem esperar estar pronto.",
          content:
            'Publicar conteúdo é o que separa um perfil parado de um perfil que trabalha por você. Cada post é uma chance de aparecer no feed de recrutadores e profissionais da área sem gastar nada além de consistência.\n\nVocê não precisa ensinar nada avançado nem virar influencer. O formato mais eficaz pra quem está começando é também o mais simples: compartilhar o que está aprendendo. "Hoje aprendi X" é um ótimo começo. Terminou uma etapa do curso? Conte o que descobriu. Travou três dias num erro e resolveu? Esse post ajuda outra pessoa travada no mesmo lugar. Publicou projeto novo? Mostre com print e link.\n\nPosts de aprendizado têm uma vantagem escondida: documentam sua evolução em público. Um recrutador que abre seu perfil e vê meses de progresso consistente tem um sinal de dedicação que nenhum currículo transmite.\n\nO medo de julgamento vai aparecer de novo aqui. Lembre: seu post não precisa agradar especialistas, precisa ser honesto sobre onde você está. A comunidade tech no LinkedIn é acolhedora com quem compartilha o processo de aprender.\n\nComece com um post por semana. Essa etapa não termina: publicar vira hábito contínuo, e a regularidade importa mais do que a frequência.',
        },
        {
          id: "presenca.networking",
          title: "Networking ativo",
          description:
            "Conexões com intenção, comentários genuínos e presença na comunidade.",
          content:
            'A maioria das oportunidades de primeira vaga não chega por candidatura fria: chega por gente que lembra de você. Networking no LinkedIn é construir essa rede antes de precisar dela, e é atividade contínua, não tarefa com fim.\n\nComece conectando com quem está no mesmo caminho: colegas de curso e de comunidade, pessoas que comentam nos mesmos posts que você. Depois expanda pra quem está onde você quer chegar: profissionais da sua área, recrutadores de tech, pessoas de empresas que te interessam. Ao enviar convite pra quem não te conhece, adicione uma nota curta e genuína: quem você é e por que quer se conectar. A taxa de aceitação muda completamente.\n\nConexão aceita é começo, não fim. O relacionamento se constrói na interação pública: comente posts relevantes da sua rede com contribuições reais (uma pergunta boa, uma experiência sua, um obrigado específico), não com "top!" genérico. Comentário bom te expõe pra rede inteira da pessoa, de graça.\n\nInteraja também com a comunidade fora do LinkedIn (grupos, eventos, comunidades da sua área) e conecte depois com quem você conheceu lá: a conexão com contexto é sempre a mais forte.\n\nRitmo sustentável: alguns convites com nota por semana e comentários genuínos todo dia levam menos de quinze minutos diários.',
        },
      ],
    },
    {
      id: "decolagem",
      title: "Rumo às vagas",
      description:
        "Com o perfil forte e a rede crescendo, é hora de transformar presença em oportunidades.",
      level: "avancado",
      children: [
        {
          id: "decolagem.candidaturas",
          title: "Candidate-se com estratégia",
          description:
            "Vagas de estágio e trainee, eventos de networking e constância.",
          content:
            'Com o LinkedIn montado, comece a se candidatar a vagas de estágio, trainee e júnior, e a participar de eventos de networking. A busca ativa funciona melhor com método do que com volume cego.\n\nUse os filtros de busca de vagas do LinkedIn a seu favor: filtre por nível de experiência (estágio, júnior), configure alertas pras buscas que importam e ative a moldura "Open to Work" (você pode deixá-la visível só pra recrutadores, se preferir discrição). Perfil completo com habilidades preenchidas melhora o casamento com as vagas sugeridas.\n\nNão se candidate só ao que bate cem por cento dos requisitos: vaga de estágio com lista enorme de tecnologias costuma ser lista de desejos, não de exigências. Batendo boa parte dos requisitos essenciais, aplique. E sempre que possível, procure alguém da empresa na sua rede pra conversar antes: uma indicação interna multiplica as chances da candidatura.\n\nEventos de networking (meetups, semanas acadêmicas, feiras de carreira, lives com sessão de perguntas) merecem espaço na agenda: é onde candidatura vira conversa e perfil vira pessoa.\n\nTrate a busca como projeto: algumas candidaturas de qualidade por semana, com acompanhamento, batem dezenas de cliques em "candidatura simplificada" sem critério. Constância e paciência: a primeira oportunidade costuma demorar mais do que a gente quer, e chega pra quem não parou.',
        },
        {
          id: "decolagem.analise",
          title: "Analise seu perfil com IA",
          description:
            "Feche o ciclo: uma análise objetiva do seu LinkedIn com nota e plano de melhorias.",
          content:
            "Você montou o perfil inteiro seguindo esta trilha. O próximo passo natural é submeter o resultado a uma avaliação objetiva: o Analisador de LinkedIn da plataforma lê seu perfil, calcula uma nota e devolve um diagnóstico do que está forte e do que ainda segura o perfil, com plano de melhorias priorizadas.\n\nA análise avalia exatamente os pontos que você trabalhou nas etapas anteriores: foto e título, seção Sobre, experiências e projetos, habilidades e formação. O resultado vem com um checklist de melhorias pra marcar conforme aplica, e você pode rodar nova análise depois de ajustar, comparando a evolução da nota entre as versões.\n\nUse o diagnóstico como um revisor imparcial: ele enxerga o perfil como um recrutador apressado enxergaria, sem o carinho que você tem pelo próprio texto. As melhorias de prioridade alta são o melhor lugar pra investir sua próxima hora de trabalho no perfil.\n\nO analisador é uma ferramenta Pro da plataforma. Se você é assinante, essa é a forma mais rápida de fechar o ciclo desta trilha com feedback concreto; se ainda não é, a auditoria manual da etapa de erros comuns segue sendo seu checklist de revisão.\n\nPerfil analisado, melhorias aplicadas, presença ativa rodando: seu LinkedIn deixou de ser um cadastro parado e virou um ativo trabalhando pela sua primeira vaga.",
          resources: [
            {
              label: "Analisador de LinkedIn com IA",
              url: "/linkedin/analisar",
            },
          ],
        },
      ],
    },
  ],
};
