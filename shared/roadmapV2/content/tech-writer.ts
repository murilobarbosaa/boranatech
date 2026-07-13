// TODO(Ana): revisao editorial completa desta trilha (titulos, descricoes e
// todo o conteudo em markdown sao novos e precisam de revisao de copy).
import type { RoadmapV2 } from "../types";

export const techWriter: RoadmapV2 = {
  slug: "tech-writer",
  area: "carreira",
  kind: "carreira",
  title: "Tech Writer e Documentação do Zero",
  level: "Iniciante",
  description:
    "Escrever para tecnologia: transformar produtos complexos em textos claros que as pessoas entendem. Uma das áreas de tech que mais acolhe quem vem de humanas e comunicação.",
  sections: [
    {
      id: "fundamentos",
      title: "Fundamentos da escrita técnica",
      description:
        "O que faz um tech writer, o que é escrever com clareza e por que a área acolhe quem vem de humanas.",
      level: "iniciante",
      children: [
        {
          id: "fundamentos.o-que-e",
          title: "O que é escrita técnica",
          description:
            "Comunicar informação técnica de forma clara, objetiva e útil para quem precisa realizar uma tarefa.",
          content:
            "Escrita técnica é comunicar informação sobre um produto ou tecnologia de forma que a pessoa certa consiga usar aquilo para realizar uma tarefa. Não é literatura nem marketing: o objetivo não é encantar nem convencer, e sim fazer o leitor entender e conseguir agir, com o menor esforço possível.\n\nO tech writer (redator técnico) é quem escreve manuais, tutoriais, documentação de produtos e de APIs, guias de uso, artigos de ajuda. O trabalho é traduzir a complexidade que os engenheiros criam numa linguagem que o público (que pode ser outro desenvolvedor ou um usuário leigo) compreende sem sofrer.\n\nÉ uma área de tecnologia que valoriza quem sabe escrever bem, organizar informação e ter empatia com quem lê. Por isso acolhe muita gente vinda de jornalismo, letras, comunicação, pedagogia e áreas de humanas, que trazem exatamente essas habilidades e aprendem a parte técnica pelo caminho.",
        },
        {
          id: "fundamentos.clareza",
          title: "Clareza e objetividade",
          description:
            "Os princípios que transformam texto confuso em texto que a pessoa entende de primeira.",
          content:
            "Clareza é a virtude número um da escrita técnica, e ela tem princípios concretos. Frases curtas comunicam melhor que frases longas e cheias de subordinadas. A voz ativa (\"clique no botão\") é mais direta que a passiva (\"o botão deve ser clicado\"). Uma ideia por parágrafo evita que o leitor se perca.\n\nObjetividade significa cortar o que não ajuda: rodeios, repetições, palavras difíceis quando existe uma simples, informação que não serve para a tarefa. O leitor de documentação não está lendo por prazer; está tentando resolver algo. Cada palavra a mais é um obstáculo entre ele e a solução.\n\nConsistência fecha o tripé: usar sempre o mesmo termo para a mesma coisa, o mesmo formato para as mesmas estruturas. Chamar um recurso de três nomes diferentes no mesmo documento confunde. Esses princípios parecem simples, mas aplicá-los com disciplina é o que separa a boa documentação da que ninguém consegue seguir.",
        },
      ],
    },
    {
      id: "produto-usuario",
      title: "Entender o produto e o usuário",
      description:
        "Não dá para explicar o que você não entende, nem escrever para quem você não conhece.",
      level: "iniciante",
      children: [
        {
          id: "produto.entender",
          title: "Entender o que você documenta",
          description:
            "Como aprender o produto o suficiente para explicá-lo, mesmo sem ser especialista.",
          content:
            "Você não precisa saber programar como um engenheiro para documentar um produto, mas precisa entender o suficiente para explicá-lo com segurança. Isso significa usar o produto de verdade, testar os passos que você descreve, e não ter vergonha de perguntar.\n\nA melhor documentação nasce de quem realmente experimentou o caminho. Se você escreve um tutorial sem ter executado cada passo, quase certamente vai pular algo óbvio para o especialista mas invisível para o iniciante. Fazer o percurso você mesmo revela esses buracos antes que o leitor caia neles.\n\nConversar com quem construiu (desenvolvedores, pessoas de produto) é parte central do trabalho. Boas perguntas extraem o conhecimento que está na cabeça deles e ainda não no papel. Curiosamente, a posição de quem está aprendendo é uma vantagem: você percebe as dificuldades que o especialista já esqueceu que existem.",
        },
        {
          id: "produto.publico",
          title: "Conhecer o público",
          description:
            "Escrever para um desenvolvedor experiente é diferente de escrever para um usuário iniciante.",
          content:
            "A mesma informação é escrita de formas diferentes dependendo de quem vai ler. Documentação para desenvolvedores experientes pode assumir conhecimento prévio e ser mais densa; um guia para usuários iniciantes precisa explicar cada passo, evitar jargão e antecipar dúvidas. Escrever sem saber para quem é atirar no escuro.\n\nDefinir o público envolve perguntas simples: qual o nível de conhecimento técnico da pessoa? O que ela já sabe e o que precisa aprender? Qual tarefa ela quer realizar? Em que contexto ela vai ler isto, com calma ou no meio de um problema urgente? As respostas mudam o tom, a profundidade e o formato.\n\nUma técnica útil é imaginar uma pessoa concreta representando o público (uma persona) e escrever para ela. \"Como eu explicaria isso para a Marina, que está usando o produto pela primeira vez?\" gera um texto muito melhor do que escrever para um leitor abstrato e genérico.",
        },
      ],
    },
    {
      id: "tipos",
      title: "Tipos de documentação",
      description:
        "Documentação não é tudo igual: cada tipo serve a uma necessidade e tem uma forma própria.",
      level: "intermediario",
      children: [
        {
          id: "tipos.quatro",
          title: "Os quatro tipos de documentação",
          description:
            "Tutorial, guia prático, referência e explicação, cada um com um propósito distinto.",
          content:
            "Uma forma consagrada de organizar documentação separa quatro tipos, cada um servindo a uma necessidade diferente (essa divisão é conhecida como Diátaxis). Misturá-los no mesmo texto é uma das razões mais comuns de documentação confusa.\n\nO tutorial ensina passo a passo, pegando na mão de quem está aprendendo do zero, com um resultado garantido no fim. O guia prático (how-to) mostra como resolver uma tarefa específica para quem já tem alguma base. A referência descreve de forma precisa e completa cada parte do produto, para consulta pontual. A explicação aprofunda o porquê das coisas, o contexto e os conceitos.\n\nSaber que tipo você está escrevendo evita o erro clássico de tentar ensinar, referenciar e explicar tudo ao mesmo tempo, gerando um texto que não serve bem para nenhum propósito. Definir o tipo primeiro dá forma e foco ao que você vai produzir.",
        },
        {
          id: "tipos.estrutura",
          title: "Estrutura e organização",
          description:
            "Como organizar um conjunto de documentos para que a pessoa ache o que procura.",
          content:
            "Documentação não é um texto só; é um conjunto que precisa ser navegável. Se a pessoa não encontra o que procura, a informação existe mas não serve. Por isso a arquitetura da informação (como os documentos são organizados e ligados) é parte do trabalho do tech writer.\n\nBoas práticas incluem títulos claros e descritivos (que dizem exatamente o que a seção contém), uma hierarquia lógica (do geral ao específico), e navegação previsível. Um índice, links entre documentos relacionados e uma busca que funciona transformam um monte de páginas soltas numa base útil.\n\nPense sempre no caminho do leitor: ele chega com uma pergunta na cabeça e precisa encontrar a resposta rápido. Organizar por tarefas e objetivos do usuário, e não pela estrutura interna do produto, costuma servir melhor, porque as pessoas buscam pelo que querem fazer, não pela forma como o sistema foi construído.",
        },
      ],
    },
    {
      id: "api",
      title: "Documentação de API",
      description:
        "Um dos trabalhos mais valorizados: documentar interfaces de programação para outros desenvolvedores.",
      level: "intermediario",
      children: [
        {
          id: "api.o-que",
          title: "O que documentar numa API",
          description:
            "As informações que um desenvolvedor precisa para usar uma API sem adivinhar nada.",
          content:
            "Uma API é a interface pela qual um sistema oferece funcionalidades para outros programas usarem. Documentar API é escrever para um público específico (desenvolvedores) que precisa de informação precisa para integrar seu sistema ao produto, e é uma das especialidades mais valorizadas da área.\n\nUma boa documentação de API cobre, para cada recurso: o que ele faz, como chamá-lo (endereço, método, parâmetros esperados), o que ele devolve, e como tratar erros. Nada de \"deve ser mais ou menos assim\": o desenvolvedor precisa de exatidão, porque um detalhe errado quebra a integração.\n\nO que separa a documentação boa da sofrível são os exemplos. Mostrar uma chamada real com a entrada e a resposta correspondente vale mais que parágrafos de descrição. Desenvolvedores aprendem copiando, adaptando e testando exemplos concretos, então fornecê-los é o maior favor que você pode fazer a quem lê.",
        },
        {
          id: "api.padroes",
          title: "Padrões e ferramentas de API",
          description:
            "Formatos consagrados que padronizam como APIs são descritas e documentadas.",
          content:
            "A documentação de API amadureceu a ponto de ter padrões próprios. O OpenAPI (antes conhecido como Swagger) é uma especificação amplamente usada para descrever APIs de forma estruturada: os recursos, os parâmetros, as respostas. A partir dessa descrição, ferramentas geram documentação navegável e até permitem testar chamadas direto na página.\n\nPara o tech writer, entender esses padrões abre portas. Muitas vezes o trabalho é colaborar com os desenvolvedores para manter essa descrição correta e, sobre ela, escrever as partes que a máquina não gera sozinha: guias de introdução, exemplos de uso completos, explicações de conceitos e de fluxos que envolvem vários recursos.\n\nEssa combinação (a parte estruturada que padroniza e a parte escrita que dá contexto) é o que torna uma API agradável de usar. E como quase toda empresa de tecnologia hoje oferece APIs, saber documentá-las bem é uma habilidade com demanda constante no mercado.",
        },
      ],
    },
    {
      id: "tutoriais",
      title: "Tutoriais e guias",
      description:
        "A arte de ensinar por escrito: passo a passo que realmente funciona quando o leitor executa.",
      level: "intermediario",
      children: [
        {
          id: "tutoriais.passo-a-passo",
          title: "Escrever um bom passo a passo",
          description:
            "Cada passo claro, na ordem certa, sem pular nada que o iniciante não sabe.",
          content:
            "Um tutorial funciona quando o leitor consegue seguir e chegar ao resultado, sem travar no meio. Isso exige quebrar a tarefa em passos pequenos e ordenados, cada um com uma ação clara, e não pular nada, mesmo o que parece óbvio para você, porque o óbvio para o autor costuma ser o ponto onde o iniciante empaca.\n\nDetalhes fazem diferença: dizer onde a pessoa está antes de cada passo, o que ela deve ver acontecer depois de executá-lo (para confirmar que deu certo), e o que fazer se algo sair diferente do esperado. Capturas de tela ou trechos de código no ponto certo ancoram o leitor e reduzem a ambiguidade.\n\nComece o tutorial dizendo o que a pessoa vai conseguir fazer ao final e o que ela precisa ter antes de começar. Terminar com o resultado alcançado e um próximo passo sugerido dá senso de conquista e continuidade. Um bom tutorial respeita o tempo e a insegurança de quem está aprendendo.",
        },
        {
          id: "tutoriais.testar",
          title: "Testar a própria documentação",
          description:
            "A única forma de garantir que o guia funciona é seguir cada passo você mesmo.",
          content:
            "A regra de ouro dos tutoriais: teste seguindo seus próprios passos, exatamente como estão escritos, sem completar mentalmente o que você sabe. É assustador quantas vezes um guia que parecia perfeito revela um passo faltando, uma ordem errada ou uma instrução ambígua quando executado ao pé da letra.\n\nO ideal é testar do zero, num ambiente limpo, como se você fosse o iniciante que nunca viu aquilo. Melhor ainda é pedir para outra pessoa seguir o tutorial e observar onde ela hesita ou erra. Cada tropeço dela aponta um lugar onde o texto precisa melhorar.\n\nDocumentação desatualizada é quase tão ruim quanto documentação inexistente, porque quebra a confiança do leitor. Por isso testar não é só na criação: sempre que o produto muda, a documentação precisa ser revisada e testada de novo. Manter os guias vivos e corretos é parte contínua do trabalho, não um esforço único.",
        },
      ],
    },
    {
      id: "docs-as-code",
      title: "Docs-as-code",
      description:
        "Tratar documentação como código: escrever em Markdown, versionar com Git e revisar em pull requests.",
      level: "intermediario",
      children: [
        {
          id: "docs.markdown",
          title: "Markdown e a escrita para docs",
          description:
            "A linguagem de marcação simples que virou padrão para escrever documentação técnica.",
          content:
            "Markdown é uma forma simples de formatar texto usando marcações leves: asteriscos para negrito, cerquilhas para títulos, hífens para listas. O texto continua legível mesmo cru, e vira uma página formatada quando processado. Virou o padrão para escrever documentação técnica por ser fácil de aprender e independente de qualquer editor específico.\n\nPara o tech writer, dominar Markdown é praticamente obrigatório hoje. A boa notícia é que o básico se aprende em uma tarde: títulos, listas, links, ênfase, blocos de código e tabelas cobrem quase tudo que você vai usar no dia a dia.\n\nEscrever em Markdown também muda o fluxo de trabalho: como é texto puro, ele se integra às ferramentas dos desenvolvedores, pode ser versionado e vive perto do código que documenta. Essa proximidade é justamente a base da filosofia de docs-as-code, que a próxima etapa aprofunda.",
        },
        {
          id: "docs.git",
          title: "Git e revisão de documentação",
          description:
            "Versionar a documentação e revisá-la com o mesmo cuidado que se dá ao código.",
          content:
            "A filosofia docs-as-code trata a documentação com as mesmas ferramentas e o mesmo rigor do código. Na prática, isso significa escrever em Markdown, guardar os textos num repositório versionado com Git, e propor mudanças por pull request, que outra pessoa revisa antes de publicar.\n\nOs ganhos são reais. O histórico do Git mostra quem mudou o quê e quando, permitindo voltar atrás. A revisão em pull request garante que alterações passem por um segundo olhar, mantendo qualidade e consistência. E manter a documentação perto do código aumenta a chance de ela ser atualizada junto quando o produto muda, combatendo o problema crônico de docs que envelhecem.\n\nPara quem vem de humanas, aprender esse fluxo de Git e pull request é o principal degrau técnico da profissão, e é totalmente alcançável. Não exige programar: exige entender o fluxo de versionar, propor mudança e revisar, que a trilha de Engenharia de Software cobre em mais detalhe se você quiser aprofundar.",
        },
      ],
    },
    {
      id: "revisao",
      title: "Revisão e clareza",
      description:
        "O trabalho de lapidar o texto: editar, padronizar a voz e garantir que qualquer pessoa entenda.",
      level: "intermediario",
      children: [
        {
          id: "revisao.editar",
          title: "Editar o próprio texto",
          description:
            "O primeiro rascunho nunca é o final: cortar, simplificar e reorganizar até ficar claro.",
          content:
            "Escrever bem é, em grande parte, reescrever. O primeiro rascunho serve para tirar as ideias da cabeça; a clareza vem na edição. Voltar ao texto com olhar crítico e cortar o excesso, simplificar frases longas, trocar palavras difíceis por simples e reorganizar o que está fora de ordem é onde a qualidade nasce.\n\nUma técnica poderosa é deixar o texto descansar e voltar depois, de preferência no dia seguinte. Com distância, você lê quase como um leitor novo e percebe as confusões que na hora da escrita passaram batido. Ler em voz alta também revela frases truncadas e trechos que não fluem.\n\nA pergunta que guia a edição é sempre a mesma: uma pessoa do público-alvo entenderia isto de primeira, sem reler? Se a resposta é não, o problema é do texto, não do leitor. Assumir essa responsabilidade (a clareza é dever de quem escreve) é a mentalidade que distingue o bom redator técnico.",
        },
        {
          id: "revisao.estilo",
          title: "Guia de estilo, voz e tom",
          description:
            "Manter consistência de linguagem em toda a documentação, com regras acordadas.",
          content:
            "Quando várias pessoas escrevem documentação, ou quando uma pessoa escreve muita coisa ao longo do tempo, manter consistência vira desafio. Um guia de estilo resolve isso: um documento que define as escolhas de linguagem da equipe, como qual termo usar para cada conceito, como formatar exemplos, qual o tom da comunicação.\n\nVoz e tom são parte disso. A voz é a personalidade constante da documentação (mais formal, mais próxima, mais direta), e o tom se ajusta ao contexto (uma mensagem de erro pede empatia; uma referência pede neutralidade). Definir isso evita que a documentação pareça escrita por dez pessoas diferentes sem combinar nada.\n\nConsistência não é preciosismo: ela reduz o esforço do leitor, que aprende os padrões uma vez e os reconhece em todo lugar. Chamar sempre a mesma coisa pelo mesmo nome, formatar sempre igual, manter o mesmo nível de detalhe, tudo isso torna a documentação previsível e confiável, que é exatamente o que quem lê precisa.",
        },
      ],
    },
    {
      id: "carreira",
      title: "Ferramentas e carreira",
      description:
        "As ferramentas do dia a dia, como montar portfólio e como entrar e crescer na área.",
      level: "intermediario",
      children: [
        {
          id: "carreira.ferramentas",
          title: "Ferramentas do tech writer",
          description:
            "O ecossistema de editores, geradores de site e recursos que apoiam a escrita técnica.",
          content:
            "As ferramentas do tech writer giram em torno de escrever, organizar e publicar. Editores de texto e de Markdown para escrever; sistemas de controle de versão para versionar; e geradores de site de documentação, que transformam arquivos Markdown num site navegável, com busca e menu, sem exigir que você programe o site do zero.\n\nSomam-se recursos de apoio: ferramentas de captura e edição de imagem para as telas dos tutoriais, verificadores de gramática e estilo, e às vezes ferramentas de diagramação para explicar fluxos visualmente. O conjunto exato varia de empresa para empresa, mas a lógica é sempre escrever em texto simples e publicar de forma automatizada.\n\nO importante não é dominar toda ferramenta que existe, e sim entender as categorias e ser capaz de aprender a específica que cada trabalho usar. A habilidade central continua sendo escrever com clareza; as ferramentas são meios para colocar essa escrita no mundo de forma organizada.",
        },
        {
          id: "carreira.portfolio",
          title: "Portfólio e entrada na área",
          description:
            "Como demonstrar a habilidade de escrever e conseguir a primeira oportunidade.",
          content:
            "Como em muitas áreas de tecnologia, o portfólio fala mais alto que o diploma para o tech writer. E a boa notícia é que você pode construí-lo sozinho: escrever tutoriais sobre algo que você aprendeu, documentar um projeto de código aberto que use, criar guias claros sobre um produto que conhece. Cada peça mostra na prática que você sabe explicar.\n\nContribuir com a documentação de projetos abertos é um caminho especialmente bom: você ganha experiência real, colabora com desenvolvedores, aprende o fluxo de docs-as-code e ainda produz trabalho público que qualquer recrutador pode ver. Muitos projetos precisam de ajuda com documentação e recebem bem quem chega para contribuir.\n\nA área acolhe perfis diversos, e a combinação de saber escrever com disposição para aprender tecnologia é valiosa e relativamente rara. Se você gosta de organizar informação, de ensinar e de deixar as coisas claras, tech writing é uma porta de entrada legítima e crescente para uma carreira em tecnologia.",
        },
      ],
    },
  ],
};
