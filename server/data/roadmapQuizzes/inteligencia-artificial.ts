// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool ia). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  slug: "inteligencia-artificial",
  questions: [
    {
      id: "inteligencia-artificial-ini-01",
      nivel: "iniciante",
      pergunta:
        "Você está desenvolvendo um sistema de reconhecimento de imagem. Qual abordagem é mais adequada para ensinar o sistema a identificar gatos?",
      alternativas: {
        a: "Programar regras específicas para cada tipo de gato.",
        b: "Mostrar milhares de fotos de gatos para que o sistema aprenda os padrões.",
        c: "Usar um banco de dados pequeno com imagens de gatos e cães.",
        d: "Definir manualmente as características que um gato deve ter.",
      },
      correta: "b",
      explicacao:
        "Mostrar milhares de fotos permite que o sistema aprenda os padrões que caracterizam os gatos, o que é a essência do aprendizado de máquina.",
      fonte: "fundamentos.oque",
    },
    {
      id: "inteligencia-artificial-ini-02",
      nivel: "iniciante",
      pergunta:
        "Você precisa escolher uma técnica para um problema de classificação simples com dados em tabela. Qual abordagem é mais indicada?",
      alternativas: {
        a: "Usar deep learning para garantir a melhor precisão.",
        b: "Aplicar um modelo clássico de machine learning como árvores de decisão.",
        c: "Criar um algoritmo do zero sem usar bibliotecas.",
        d: "Utilizar um modelo de deep learning por ser mais moderno.",
      },
      correta: "b",
      explicacao:
        "Modelos clássicos de machine learning são mais rápidos e econômicos para dados estruturados em tabela, ao contrário do deep learning que é mais complexo.",
      fonte: "fundamentos.camadas",
    },
    {
      id: "inteligencia-artificial-ini-03",
      nivel: "iniciante",
      pergunta:
        "Você está montando um projeto de IA e precisa definir suas expectativas. O que é importante lembrar sobre o que a IA realmente faz?",
      alternativas: {
        a: "A IA pode entender o mundo como um ser humano.",
        b: "A IA é capaz de encontrar padrões em grandes volumes de dados.",
        c: "A IA sempre gera resultados perfeitos e sem erros.",
        d: "A IA é uma solução mágica para todos os problemas.",
      },
      correta: "b",
      explicacao:
        "A IA é eficaz em encontrar padrões em grandes volumes de dados, mas não tem consciência ou entendimento como um humano.",
      fonte: "fundamentos.expectativas",
    },
    {
      id: "inteligencia-artificial-ini-04",
      nivel: "iniciante",
      pergunta:
        "Você decidiu começar a aprender IA e escolheu uma linguagem de programação. Qual é a melhor escolha para essa área?",
      alternativas: {
        a: "Java, pois é mais popular e versátil.",
        b: "C++, que é mais rápido e eficiente.",
        c: "Python, que possui as principais bibliotecas de IA.",
        d: "Ruby, que é mais fácil de aprender.",
      },
      correta: "c",
      explicacao:
        "Python é a linguagem mais utilizada em IA devido às suas bibliotecas especializadas e à comunidade ativa.",
      fonte: "fundamentos.ambiente",
    },
    {
      id: "inteligencia-artificial-ini-05",
      nivel: "iniciante",
      pergunta:
        "Você está usando Google Colab para um projeto de IA. O que é uma das principais vantagens de usar essa ferramenta?",
      alternativas: {
        a: "Ela permite o uso de qualquer linguagem de programação.",
        b: "Ela oferece acesso gratuito a GPU para acelerar o treino de modelos.",
        c: "Ela não requer conexão com a internet para funcionar.",
        d: "Ela é a única ferramenta disponível para IA.",
      },
      correta: "b",
      explicacao:
        "O acesso gratuito a GPU no Google Colab é uma grande vantagem, pois acelera significativamente o treinamento de modelos de deep learning.",
      fonte: "fundamentos.ambiente",
    },
    {
      id: "inteligencia-artificial-ini-06",
      nivel: "iniciante",
      pergunta:
        "Você quer explicar a diferença entre IA, machine learning e deep learning para um colega. O que você deve enfatizar?",
      alternativas: {
        a: "Deep learning é mais amplo que machine learning.",
        b: "Machine learning é um subconjunto da IA, e deep learning é um subconjunto de machine learning.",
        c: "IA e machine learning são sinônimos e podem ser usados de forma intercambiável.",
        d: "Deep learning não está relacionado a IA.",
      },
      correta: "b",
      explicacao:
        "Machine learning é um subconjunto da IA, enquanto deep learning é um subconjunto de machine learning, formando uma hierarquia.",
      fonte: "fundamentos.camadas",
    },
    {
      id: "inteligencia-artificial-ini-07",
      nivel: "iniciante",
      pergunta:
        "Você está preparando um projeto de IA e precisa coletar dados. O que é crucial para garantir um bom modelo?",
      alternativas: {
        a: "Usar dados de qualquer fonte disponível, sem preocupação com a qualidade.",
        b: "Coletar dados de alta qualidade e representativos do problema.",
        c: "Utilizar apenas dados antigos, pois são mais confiáveis.",
        d: "Ignorar a quantidade de dados, focando apenas na variedade.",
      },
      correta: "b",
      explicacao:
        "Dados de alta qualidade e representativos são essenciais para treinar modelos eficazes e evitar enviesamentos.",
      fonte: "fundamentos.expectativas",
    },
    {
      id: "inteligencia-artificial-ini-08",
      nivel: "iniciante",
      pergunta:
        "Você está desenvolvendo um assistente virtual que precisa entender comandos de voz. Qual abordagem de IA seria mais apropriada?",
      alternativas: {
        a: "Programar manualmente todas as respostas possíveis.",
        b: "Utilizar técnicas de deep learning para reconhecimento de voz.",
        c: "Usar um modelo de machine learning clássico para entender áudio.",
        d: "Implementar um sistema baseado em regras fixas.",
      },
      correta: "b",
      explicacao:
        "Deep learning é especialmente eficaz para dados não estruturados, como áudio, permitindo melhor reconhecimento de voz.",
      fonte: "fundamentos.camadas",
    },
    {
      id: "inteligencia-artificial-ini-09",
      nivel: "iniciante",
      pergunta:
        "Você está explicando a um amigo o que a IA não é. Qual afirmação é correta?",
      alternativas: {
        a: "A IA é uma máquina que pode pensar como um humano.",
        b: "A IA é uma técnica para automatizar tarefas repetitivas.",
        c: "A IA é uma fonte de verdade absoluta e infalível.",
        d: "A IA pode substituir completamente a criatividade humana.",
      },
      correta: "b",
      explicacao:
        "A IA é uma técnica que ajuda a automatizar tarefas, mas não possui consciência ou entendimento humano.",
      fonte: "fundamentos.expectativas",
    },
    {
      id: "inteligencia-artificial-ini-10",
      nivel: "iniciante",
      pergunta:
        "Você está criando um projeto de IA e precisa escolher um ambiente de desenvolvimento. Qual é a opção mais prática para iniciantes?",
      alternativas: {
        a: "Instalar um software pesado no computador.",
        b: "Usar o Google Colab, que roda no navegador e é gratuito.",
        c: "Optar por um ambiente local sem acesso à internet.",
        d: "Escolher um ambiente que não suporte bibliotecas de IA.",
      },
      correta: "b",
      explicacao:
        "O Google Colab é ideal para iniciantes, pois não requer instalação e já possui as bibliotecas necessárias.",
      fonte: "fundamentos.ambiente",
    },
    {
      id: "inteligencia-artificial-ini-11",
      nivel: "iniciante",
      pergunta:
        "Você precisa manipular um conjunto de dados para um projeto de IA. Qual biblioteca do Python é mais indicada para essa tarefa?",
      alternativas: {
        a: "NumPy, que é ótima para cálculos numéricos em massa.",
        b: "Matplotlib, que é usada para desenhar gráficos.",
        c: "Pandas, que é ideal para manipulação de dados em tabelas.",
        d: "Scikit-learn, que é focada em algoritmos de aprendizado de máquina.",
      },
      correta: "c",
      explicacao:
        "A biblioteca Pandas é a mais indicada para manipulação de dados em tabelas, sendo essencial para preparar dados antes de treinar modelos.",
      fonte: "prerequisitos.python",
    },
    {
      id: "inteligencia-artificial-ini-12",
      nivel: "iniciante",
      pergunta:
        "Você está aprendendo Python e quer se tornar fluente. Qual é a melhor prática recomendada para atingir esse objetivo?",
      alternativas: {
        a: "Ler livros sobre Python até se sentir confortável.",
        b: "Fazer exercícios abstratos de programação.",
        c: "Praticar escrevendo código com dados reais.",
        d: "Assistir a vídeos tutoriais sem praticar.",
      },
      correta: "c",
      explicacao:
        "A prática de escrever código com dados reais ajuda a fixar a linguagem e aproxima do trabalho prático em IA.",
      fonte: "prerequisitos.python",
    },
    {
      id: "inteligencia-artificial-ini-13",
      nivel: "iniciante",
      pergunta:
        "Você está começando a aprender sobre IA e se depara com a necessidade de entender seus dados. Qual área da matemática é mais importante nesse momento?",
      alternativas: {
        a: "Álgebra linear, para entender vetores e matrizes.",
        b: "Cálculo, para compreender derivadas.",
        c: "Estatística básica, para interpretar dados e modelos.",
        d: "Geometria, para entender formas e espaços.",
      },
      correta: "c",
      explicacao:
        "A estatística básica é crucial para entender e interpretar dados, permitindo avaliar se um modelo é bom ou não.",
      fonte: "prerequisitos.matematica",
    },
    {
      id: "inteligencia-artificial-ini-14",
      nivel: "iniciante",
      pergunta:
        "Você quer entender como os modelos de IA aprendem. Qual conceito matemático é essencial para isso?",
      alternativas: {
        a: "Média, para calcular valores centrais.",
        b: "Derivada, para entender ajustes nos modelos.",
        c: "Distribuição, para analisar dados.",
        d: "Probabilidade, para prever resultados.",
      },
      correta: "b",
      explicacao:
        "O conceito de derivada é essencial para entender como os modelos de IA ajustam seus parâmetros durante o aprendizado.",
      fonte: "prerequisitos.matematica",
    },
    {
      id: "inteligencia-artificial-ini-15",
      nivel: "iniciante",
      pergunta:
        "Ao estudar álgebra linear, qual operação é fundamental para compreender como os dados são representados em IA?",
      alternativas: {
        a: "Adição de vetores, que é simples e direta.",
        b: "Multiplicação de matrizes, que é complexa mas essencial.",
        c: "Subtração de números, que é básica.",
        d: "Divisão de frações, que é comum em cálculos.",
      },
      correta: "b",
      explicacao:
        "A multiplicação de matrizes é fundamental para entender a representação de dados e modelos em IA, especialmente em redes neurais.",
      fonte: "prerequisitos.matematica",
    },
    {
      id: "inteligencia-artificial-ini-16",
      nivel: "iniciante",
      pergunta:
        "Você vai representar um conjunto de dados para treinar um modelo. Como a álgebra linear organiza esses dados?",
      alternativas: {
        a: "Cada exemplo vira um vetor (lista de números) e o conjunto todo vira uma matriz.",
        b: "Cada exemplo vira uma equação que o modelo resolve isoladamente.",
        c: "Os dados precisam ser convertidos em texto antes de entrar no modelo.",
        d: "Cada coluna da tabela é tratada como um número único e indivisível.",
      },
      correta: "a",
      explicacao:
        "Na álgebra linear da IA, um exemplo é um vetor e o conjunto de dados inteiro é uma matriz (uma pilha de vetores); é assim que dados e modelos são representados e multiplicados.",
      fonte: "prerequisitos.algebra",
    },
    {
      id: "inteligencia-artificial-ini-17",
      nivel: "iniciante",
      pergunta:
        "Você está entendendo como um modelo reduz seus erros durante o treino. O que a ideia de derivada informa nesse processo?",
      alternativas: {
        a: "O valor final que o modelo deve prever para cada exemplo.",
        b: "Se mexer um pouco em uma entrada, o erro sobe ou desce, e com que intensidade.",
        c: "A quantidade de dados necessária para treinar o modelo.",
        d: "Quantas camadas a rede neural precisa ter para aprender.",
      },
      correta: "b",
      explicacao:
        "A derivada é a inclinação da curva num ponto: ela diz para que lado e com que intensidade o erro muda. É isso que orienta o modelo a descer, aos poucos, rumo ao menor erro.",
      fonte: "prerequisitos.calculo",
    },
    {
      id: "inteligencia-artificial-ini-18",
      nivel: "iniciante",
      pergunta:
        "Um colega afirma que os assistentes de chat atuais já são uma inteligência artificial geral (AGI). Por que essa afirmação está incorreta?",
      alternativas: {
        a: "Porque nenhum sistema de IA consegue processar linguagem humana ainda.",
        b: "Porque a AGI já existe, mas só em laboratórios de pesquisa fechados.",
        c: "Porque a IA atual é estreita (resolve tarefas específicas), e a AGI, com flexibilidade humana, ainda não existe.",
        d: "Porque assistentes de chat não usam inteligência artificial de verdade.",
      },
      correta: "c",
      explicacao:
        "Toda IA atual é fraca ou estreita: resolve tarefas específicas. A IA forte ou AGI, com a flexibilidade da mente humana, não existe; os LLMs parecem gerais, mas são previsores de texto muito capazes, não uma mente geral.",
      fonte: "fundamentos.tipos",
    },
    {
      id: "inteligencia-artificial-ini-19",
      nivel: "iniciante",
      pergunta:
        "Você lê que a IA já passou por invernos ao longo de sua história. O que esse termo descreve?",
      alternativas: {
        a: "Períodos em que promessas exageradas não se cumpriram e o interesse e o financiamento secaram.",
        b: "Épocas em que a IA foi proibida por lei em vários países.",
        c: "Momentos em que os computadores ficaram frios demais para treinar modelos.",
        d: "Fases em que a IA superou a inteligência humana e precisou ser contida.",
      },
      correta: "a",
      explicacao:
        "Os invernos da IA foram períodos em que promessas grandes demais, seguidas de resultados aquém, levaram a cortes de financiamento e queda de interesse. A área avança em ondas, com euforia e decepção se alternando, não em linha reta.",
      fonte: "fundamentos.historia",
    },
    {
      id: "inteligencia-artificial-ini-20",
      nivel: "iniciante",
      pergunta:
        "Ao olhar como a IA gera valor hoje nos mais diversos setores, qual padrão melhor descreve a maioria das aplicações reais?",
      alternativas: {
        a: "São robôs humanoides autônomos substituindo trabalhadores.",
        b: "São modelos bem escolhidos resolvendo um problema específico, apoiados em bons dados.",
        c: "São sistemas de inteligência geral que fazem qualquer tarefa.",
        d: "São algoritmos que dispensam dados, bastando poder de computação.",
      },
      correta: "b",
      explicacao:
        "A maioria das aplicações não é nada futurista: é um modelo bem escolhido resolvendo um problema específico de negócio. O valor quase sempre vem de juntar a IA a bons dados e a um processo que a usa de verdade, não da sofisticação do algoritmo.",
      fonte: "fundamentos.aplicacoes",
    },
    {
      id: "inteligencia-artificial-ini-21",
      nivel: "iniciante",
      pergunta:
        "Você quer isolar as bibliotecas de cada projeto para que a instalação de um não quebre o outro. Qual ferramenta resolve isso?",
      alternativas: {
        a: "Um ambiente virtual, com venv ou conda, que separa as dependências de cada projeto.",
        b: "O Jupyter Notebook, que executa o código de forma exploratória.",
        c: "O Git, que guarda o histórico de versões do código.",
        d: "O Google Colab, que roda tudo na nuvem sem instalação.",
      },
      correta: "a",
      explicacao:
        "Um ambiente virtual (venv ou conda) isola as dependências de cada projeto numa caixa separada, evitando conflitos entre versões de bibliotecas. Jupyter é onde você experimenta e o Git versiona o código, mas quem isola as dependências é o ambiente virtual.",
      fonte: "prerequisitos.ambiente",
    },
    {
      id: "inteligencia-artificial-int-01",
      nivel: "intermediario",
      pergunta:
        "Você está iniciando um projeto de machine learning e precisa definir o problema. Qual é a primeira pergunta a se fazer?",
      alternativas: {
        a: "Qual modelo de machine learning eu vou usar?",
        b: "Quais dados eu já tenho disponíveis?",
        c: "O que exatamente eu quero prever ou decidir?",
        d: "Como eu vou avaliar o modelo depois?",
      },
      correta: "c",
      explicacao:
        "Definir claramente o que se quer prever ou decidir é o primeiro passo essencial para guiar todo o projeto de machine learning.",
      fonte: "ml.fluxo",
    },
    {
      id: "inteligencia-artificial-int-02",
      nivel: "intermediario",
      pergunta:
        "Durante a preparação de dados para um projeto de machine learning, você percebe que os dados estão desorganizados. O que você deve priorizar?",
      alternativas: {
        a: "Treinar um modelo com os dados disponíveis.",
        b: "Limpar e organizar os dados antes de qualquer outra coisa.",
        c: "Coletar mais dados sem se preocupar com a qualidade.",
        d: "Testar diferentes algoritmos para ver qual funciona melhor.",
      },
      correta: "b",
      explicacao:
        "Limpar e organizar os dados é crucial, pois dados ruins podem comprometer o resultado final do modelo.",
      fonte: "ml.fluxo",
    },
    {
      id: "inteligencia-artificial-int-03",
      nivel: "intermediario",
      pergunta:
        "Você treinou um modelo de machine learning e agora precisa avaliar seu desempenho. O que você deve fazer primeiro?",
      alternativas: {
        a: "Usar os mesmos dados que foram usados para treinar.",
        b: "Separar os dados em conjuntos de treino e teste.",
        c: "Ajustar os parâmetros do modelo.",
        d: "Comparar o modelo com outros que já foram testados.",
      },
      correta: "b",
      explicacao:
        "Separar os dados em treino e teste é fundamental para avaliar o desempenho do modelo em dados que ele nunca viu.",
      fonte: "ml.fluxo",
    },
    {
      id: "inteligencia-artificial-int-04",
      nivel: "intermediario",
      pergunta:
        "Você está trabalhando em um projeto de classificação de emails como spam ou não. Qual técnica de aprendizado você deve usar?",
      alternativas: {
        a: "Aprendizado não supervisionado para descobrir padrões.",
        b: "Aprendizado supervisionado com exemplos rotulados.",
        c: "Aprendizado por reforço para otimizar decisões.",
        d: "Nenhuma, pois isso não é um problema de machine learning.",
      },
      correta: "b",
      explicacao:
        "A classificação de emails é um exemplo clássico de aprendizado supervisionado, onde você tem exemplos com respostas conhecidas.",
      fonte: "ml.tipos",
    },
    {
      id: "inteligencia-artificial-int-05",
      nivel: "intermediario",
      pergunta:
        "Você está utilizando um modelo de regressão para prever vendas. Qual métrica é mais adequada para avaliar o desempenho do modelo?",
      alternativas: {
        a: "Taxa de acerto bruta.",
        b: "Erro médio absoluto.",
        c: "Número de vendas reais.",
        d: "Percentual de vendas acima da média.",
      },
      correta: "b",
      explicacao:
        "O erro médio absoluto é uma métrica adequada para avaliar a precisão de previsões numéricas em regressão.",
      fonte: "ml.avaliacao",
    },
    {
      id: "inteligencia-artificial-int-06",
      nivel: "intermediario",
      pergunta:
        "Ao avaliar um modelo de classificação, você percebe que a taxa de acerto é alta, mas as classes estão desbalanceadas. O que você deve considerar?",
      alternativas: {
        a: "A taxa de acerto é a única métrica que importa.",
        b: "Usar apenas a taxa de acerto para avaliar o modelo.",
        c: "Explorar métricas adicionais que considerem o desbalanceamento.",
        d: "Aumentar o número de dados da classe minoritária.",
      },
      correta: "c",
      explicacao:
        "Métricas adicionais, como precisão e recall, são importantes para avaliar modelos em situações de classes desbalanceadas.",
      fonte: "ml.avaliacao",
    },
    {
      id: "inteligencia-artificial-int-07",
      nivel: "intermediario",
      pergunta:
        "Você está usando o scikit-learn e deseja treinar um modelo. Qual é o primeiro passo que você deve executar?",
      alternativas: {
        a: "Chamar a função de métrica para avaliar o modelo.",
        b: "Separar os dados em treino e teste.",
        c: "Chamar o método .fit() com os dados de treino.",
        d: "Escolher um modelo para usar.",
      },
      correta: "b",
      explicacao:
        "O primeiro passo é sempre separar os dados em conjuntos de treino e teste antes de treinar o modelo.",
      fonte: "ml.sklearn",
    },
    {
      id: "inteligencia-artificial-int-08",
      nivel: "intermediario",
      pergunta:
        "Você decidiu usar uma árvore de decisão para um projeto de machine learning. Qual é uma das principais vantagens desse modelo?",
      alternativas: {
        a: "É o modelo mais complexo e poderoso disponível.",
        b: "É fácil de visualizar e interpretar as decisões que toma.",
        c: "Não requer separação de dados para treino e teste.",
        d: "Funciona melhor que todos os outros modelos em qualquer situação.",
      },
      correta: "b",
      explicacao:
        "Uma das principais vantagens das árvores de decisão é sua facilidade de visualização e interpretação das decisões.",
      fonte: "ml.sklearn",
    },
    {
      id: "inteligencia-artificial-int-09",
      nivel: "intermediario",
      pergunta:
        "Você está aprendendo a usar o scikit-learn e precisa gerar previsões com o modelo treinado. Qual método você deve usar?",
      alternativas: {
        a: "Chamar o método .predict() com os dados de teste.",
        b: "Chamar o método .fit() novamente com os dados de teste.",
        c: "Usar a função de métrica para prever.",
        d: "Separar os dados de teste novamente.",
      },
      correta: "a",
      explicacao:
        "O método .predict() é utilizado para gerar previsões com o modelo treinado usando dados que ele nunca viu.",
      fonte: "ml.sklearn",
    },
    {
      id: "inteligencia-artificial-int-10",
      nivel: "intermediario",
      pergunta:
        "Você está criando uma rede neural para classificar imagens. Qual é a razão principal para usar várias camadas na rede?",
      alternativas: {
        a: "Camadas adicionais ajudam a aprender padrões mais complexos nos dados.",
        b: "Camadas extras aumentam a velocidade de processamento da rede.",
        c: "Camadas em excesso garantem que a rede sempre acerte as previsões.",
        d: "Camadas adicionais são necessárias para que a rede funcione corretamente.",
      },
      correta: "a",
      explicacao:
        "Várias camadas permitem que a rede aprenda padrões complexos, aumentando sua capacidade de generalização.",
      fonte: "deeplearning.redes",
    },
    {
      id: "inteligencia-artificial-int-11",
      nivel: "intermediario",
      pergunta:
        "Durante o treinamento de uma rede neural, você percebe que a função de perda não está diminuindo. O que você deve considerar ajustar primeiro?",
      alternativas: {
        a: "Aumentar a taxa de aprendizado para fazer ajustes mais rápidos nos pesos.",
        b: "Reduzir a quantidade de dados de treinamento para simplificar o problema.",
        c: "Alterar a função de perda para uma que seja mais adequada ao seu problema.",
        d: "Aumentar o número de épocas para dar mais tempo ao modelo para aprender.",
      },
      correta: "a",
      explicacao:
        "Aumentar a taxa de aprendizado pode ajudar a rede a fazer ajustes mais significativos nos pesos, potencialmente reduzindo a função de perda.",
      fonte: "deeplearning.treino",
    },
    {
      id: "inteligencia-artificial-int-12",
      nivel: "intermediario",
      pergunta:
        "Você está desenvolvendo um modelo de deep learning e precisa de uma biblioteca para facilitar o processo. Qual das opções abaixo é a mais recomendada para iniciantes?",
      alternativas: {
        a: "TensorFlow, pois é mais robusto e oferece mais funcionalidades.",
        b: "Keras, que é uma interface de alto nível do TensorFlow, tornando a construção de redes mais simples.",
        c: "PyTorch, que tem uma curva de aprendizado mais difícil mas é mais poderosa.",
        d: "NumPy, que é uma biblioteca fundamental para operações matemáticas.",
      },
      correta: "b",
      explicacao:
        "Keras é uma interface de alto nível que simplifica a construção de redes neurais, sendo ideal para iniciantes.",
      fonte: "deeplearning.frameworks",
    },
    {
      id: "inteligencia-artificial-int-13",
      nivel: "intermediario",
      pergunta:
        "Você está treinando uma rede neural e observou que o erro de treinamento está diminuindo, mas o erro de validação está aumentando. O que isso pode indicar?",
      alternativas: {
        a: "A rede está aprendendo os dados de treinamento muito bem, mas não generaliza para novos dados.",
        b: "A rede não está sendo treinada por tempo suficiente e precisa de mais épocas.",
        c: "A taxa de aprendizado está muito baixa e precisa ser aumentada.",
        d: "Os dados de validação são irrelevantes e não devem ser considerados.",
      },
      correta: "a",
      explicacao:
        "Esse comportamento indica que a rede pode estar sofrendo de overfitting, aprendendo os padrões dos dados de treinamento em detrimento da generalização.",
      fonte: "deeplearning.treino",
    },
    {
      id: "inteligencia-artificial-int-14",
      nivel: "intermediario",
      pergunta:
        "Você precisa otimizar o desempenho de uma rede neural que está treinando. Qual estratégia você deve considerar para melhorar a eficiência do treinamento?",
      alternativas: {
        a: "Aumentar o número de neurônios em cada camada para capturar mais informações.",
        b: "Utilizar uma GPU para acelerar o processamento durante o treinamento.",
        c: "Reduzir o número de camadas para simplificar a rede.",
        d: "Aumentar o tamanho do batch para que mais dados sejam processados de uma vez.",
      },
      correta: "b",
      explicacao:
        "Utilizar uma GPU pode acelerar significativamente o treinamento de redes neurais, melhorando a eficiência.",
      fonte: "deeplearning.frameworks",
    },
    {
      id: "inteligencia-artificial-int-15",
      nivel: "intermediario",
      pergunta:
        "Você está ajustando uma rede neural e percebe que a taxa de aprendizado é muito alta. Qual é o impacto disso no treinamento?",
      alternativas: {
        a: "Os pesos podem ser ajustados de forma muito brusca, levando a um treinamento instável.",
        b: "Os pesos não serão ajustados o suficiente, resultando em um aprendizado lento.",
        c: "A rede se tornará mais robusta e resistente a overfitting.",
        d: "O treinamento será concluído mais rapidamente, com resultados mais precisos.",
      },
      correta: "a",
      explicacao:
        "Uma taxa de aprendizado muito alta pode causar ajustes bruscos nos pesos, tornando o treinamento instável e dificultando a convergência.",
      fonte: "deeplearning.treino",
    },
    {
      id: "inteligencia-artificial-int-16",
      nivel: "intermediario",
      pergunta:
        "Você precisa prever se uma transação é fraude ou não (sim ou não). Qual modelo base é o mais indicado?",
      alternativas: {
        a: "Regressão linear, porque prevê valores contínuos com precisão.",
        b: "Regressão logística, porque prevê uma categoria a partir de uma probabilidade.",
        c: "K-means, porque separa as transações em grupos automaticamente.",
        d: "PCA, porque reduz o número de variáveis da transação.",
      },
      correta: "b",
      explicacao:
        "A regressão logística é o modelo base de classificação: devolve uma probabilidade (a chance de ser fraude) que você converte em sim ou não. A regressão linear prevê números, não categorias.",
      fonte: "ml.regressao",
    },
    {
      id: "inteligencia-artificial-int-17",
      nivel: "intermediario",
      pergunta:
        "Uma única árvore de decisão está decorando os dados de treino e indo mal em dados novos. Qual abordagem tende a resolver isso?",
      alternativas: {
        a: "Aumentar a profundidade da árvore para ela aprender mais detalhes.",
        b: "Usar um ensemble, como Random Forest ou Gradient Boosting, combinando várias árvores.",
        c: "Trocar a árvore por uma regressão linear simples.",
        d: "Remover as features menos importantes até sobrar apenas uma.",
      },
      correta: "b",
      explicacao:
        "Uma árvore sozinha tende a decorar e generaliza mal. Ensembles como Random Forest (votação entre muitas árvores) e Gradient Boosting (XGBoost, árvores em sequência corrigindo erros) resolvem isso e dominam problemas com dados em tabela.",
      fonte: "ml.arvores",
    },
    {
      id: "inteligencia-artificial-int-18",
      nivel: "intermediario",
      pergunta:
        "Você quer classificar um novo cliente olhando os exemplos mais parecidos que já conhece. Qual modelo segue exatamente essa ideia?",
      alternativas: {
        a: "SVM, que traça a fronteira de maior margem entre as classes.",
        b: "KNN, que classifica pelo voto dos k exemplos mais próximos.",
        c: "Regressão linear, que ajusta a melhor reta aos dados.",
        d: "Random Forest, que combina muitas árvores de decisão.",
      },
      correta: "b",
      explicacao:
        "O KNN (k vizinhos mais próximos) classifica um exemplo novo pela maioria entre os k exemplos mais parecidos que já conhece; é a ideia de similaridade. O SVM, em contraste, busca a fronteira que melhor separa as classes.",
      fonte: "ml.instancia",
    },
    {
      id: "inteligencia-artificial-int-19",
      nivel: "intermediario",
      pergunta:
        "Você tem milhares de clientes sem rótulo e quer descobrir grupos naturais entre eles. Que tipo de tarefa é essa?",
      alternativas: {
        a: "Aprendizado supervisionado de classificação, com o grupo como categoria.",
        b: "Aprendizado não supervisionado de clusterização, como o K-means.",
        c: "Regressão, prevendo a qual grupo cada cliente pertence.",
        d: "Aprendizado por reforço, com recompensas por agrupar bem.",
      },
      correta: "b",
      explicacao:
        "Descobrir grupos em dados sem rótulo é clusterização, o carro-chefe do aprendizado não supervisionado. O K-means é o algoritmo padrão: você define o número de grupos (k) e ele agrupa os exemplos parecidos.",
      fonte: "ml.clustering",
    },
    {
      id: "inteligencia-artificial-int-20",
      nivel: "intermediario",
      pergunta:
        "Seu conjunto de dados tem cinquenta colunas muito correlacionadas e o treino ficou lento. O que o PCA faz para ajudar?",
      alternativas: {
        a: "Cria novas linhas de dados sintéticos para aumentar o conjunto.",
        b: "Encontra as direções de maior variação e reescreve os dados em poucas componentes principais.",
        c: "Remove aleatoriamente metade das colunas para acelerar o treino.",
        d: "Converte todas as colunas de texto em números automaticamente.",
      },
      correta: "b",
      explicacao:
        "O PCA (análise de componentes principais) reduz a dimensionalidade encontrando as direções em que os dados mais variam e reescrevendo tudo em poucas componentes, mantendo a informação que importa e descartando o que quase não carrega.",
      fonte: "ml.dimensionalidade",
    },
    {
      id: "inteligencia-artificial-int-21",
      nivel: "intermediario",
      pergunta:
        "Numa base com uma coluna de data de nascimento, você cria uma coluna de idade a partir dela. Que trabalho é esse, e por que importa?",
      alternativas: {
        a: "Feature engineering, e a qualidade das variáveis costuma decidir mais o resultado que a escolha do algoritmo.",
        b: "Validação cruzada, usada para medir o modelo com mais confiança.",
        c: "Regularização, para impedir que o modelo decore os dados.",
        d: "Redução de dimensionalidade, para comprimir as variáveis existentes.",
      },
      correta: "a",
      explicacao:
        "Criar boas variáveis a partir das que existem é feature engineering, o coração da etapa de dados. Uma feature bem pensada, que capture algo que o modelo sozinho não veria, muitas vezes melhora o resultado mais do que trocar de algoritmo.",
      fonte: "ml.features",
    },
    {
      id: "inteligencia-artificial-int-22",
      nivel: "intermediario",
      pergunta:
        "Num teste que detecta uma doença, deixar de identificar um caso doente é mais grave que dar um alarme falso. Qual métrica você deve priorizar?",
      alternativas: {
        a: "A precisão, que mede quantos dos casos marcados como positivos eram mesmo.",
        b: "O recall, que mede quantos dos positivos reais o modelo conseguiu pegar.",
        c: "A taxa de acerto bruta, que resume tudo num só número.",
        d: "O tempo de treino do modelo, que indica sua eficiência.",
      },
      correta: "b",
      explicacao:
        "Quando perder um caso positivo é o erro mais grave, prioriza-se o recall (dos positivos reais, quantos o modelo pegou). A precisão pesa mais quando o custo maior é o alarme falso, como num filtro de spam.",
      fonte: "ml.metricas",
    },
    {
      id: "inteligencia-artificial-int-23",
      nivel: "intermediario",
      pergunta:
        "Seu modelo vai muito melhor no treino do que no teste. Qual destas NÃO é uma forma válida de reduzir esse overfitting?",
      alternativas: {
        a: "Conseguir mais dados variados para o modelo aprender o padrão geral.",
        b: "Simplificar o modelo, por exemplo podando a profundidade de uma árvore.",
        c: "Aplicar regularização, penalizando pesos exagerados.",
        d: "Treinar por mais tempo nos mesmos dados até o erro de treino zerar.",
      },
      correta: "d",
      explicacao:
        "Mais dados, simplificar o modelo e regularização combatem o overfitting. Treinar mais nos mesmos dados até o erro de treino zerar faz o oposto: aprofunda a decoreba e piora a generalização.",
      fonte: "ml.regularizacao",
    },
    {
      id: "inteligencia-artificial-int-24",
      nivel: "intermediario",
      pergunta:
        "O que o mecanismo de attention, no transformer, faz para interpretar uma palavra numa frase?",
      alternativas: {
        a: "Lê a frase palavra por palavra, em ordem, guardando só um resumo do que já viu.",
        b: "Olha todas as outras palavras da sequência ao mesmo tempo e pesa quanto cada uma importa naquele contexto.",
        c: "Ignora o contexto e traduz cada palavra isoladamente.",
        d: "Converte a frase em uma imagem para aplicar convoluções.",
      },
      correta: "b",
      explicacao:
        "A atenção olha, para cada palavra, todas as outras da sequência de uma vez e decide quanto cada uma pesa no contexto. Fazer isso em paralelo (em vez de sequencialmente, como as RNNs) melhorou o contexto e destravou modelos gigantes; é o T de GPT.",
      fonte: "deeplearning.transformers",
    },
    {
      id: "inteligencia-artificial-int-25",
      nivel: "intermediario",
      pergunta:
        "Por que uma rede neural convolucional (CNN) enxerga imagens melhor que uma rede comum totalmente conectada?",
      alternativas: {
        a: "Porque decora cada pixel da imagem em uma tabela para consultar depois.",
        b: "Porque usa filtros que deslizam pela imagem detectando padrões locais, como bordas e texturas.",
        c: "Porque transforma a imagem em uma sequência de palavras antes de processá-la.",
        d: "Porque dispensa dados de treino ao ignorar por completo a posição dos pixels.",
      },
      correta: "b",
      explicacao:
        "A CNN usa a convolução: pequenos filtros deslizam pela imagem procurando padrões locais (bordas, texturas), onde quer que apareçam. As primeiras camadas detectam coisas simples e as seguintes as combinam em objetos, algo que uma rede comum, que liga tudo a tudo, não faz bem.",
      fonte: "deeplearning.cnn",
    },
    {
      id: "inteligencia-artificial-int-26",
      nivel: "intermediario",
      pergunta:
        "Você vai processar frases, onde a ordem das palavras muda o sentido. O que uma LSTM acrescenta a uma rede recorrente simples?",
      alternativas: {
        a: "A capacidade de processar a imagem da frase com convoluções.",
        b: "Um mecanismo que decide o que guardar e o que descartar, preservando informação por mais tempo.",
        c: "A eliminação total da noção de ordem entre as palavras.",
        d: "A troca da memória por uma tabela fixa de palavras conhecidas.",
      },
      correta: "b",
      explicacao:
        "RNNs simples esqueciam o começo de sequências longas. A LSTM (memória de longo e curto prazo) tem um mecanismo interno que decide o que reter e o que descartar, preservando o contexto relevante por muito mais tempo, essencial quando a ordem carrega o significado.",
      fonte: "deeplearning.rnn",
    },
    {
      id: "inteligencia-artificial-av-01",
      nivel: "avancado",
      pergunta:
        "Você está desenvolvendo um sistema de reconhecimento de objetos em imagens. Para garantir que o modelo aprenda a detectar padrões visuais de forma eficaz, qual abordagem você deve usar?",
      alternativas: {
        a: "Treinar uma rede neural convolucional do zero com um grande conjunto de dados.",
        b: "Utilizar transfer learning a partir de um modelo pré-treinado em milhões de imagens.",
        c: "Aplicar técnicas de classificação de imagem sem considerar a detecção de objetos.",
        d: "Usar um modelo de rede neural recorrente para processamento de imagens.",
      },
      correta: "b",
      explicacao:
        "A utilização de transfer learning permite adaptar um modelo já treinado, economizando tempo e recursos, o que é ideal para iniciantes em visão computacional.",
      fonte: "dominios.visao",
    },
    {
      id: "inteligencia-artificial-av-02",
      nivel: "avancado",
      pergunta:
        "Você está criando um chatbot que precisa entender e responder perguntas de usuários. Qual técnica você deve usar para lidar com a ambiguidade e contexto da linguagem?",
      alternativas: {
        a: "Implementar uma rede neural convolucional para análise de texto.",
        b: "Utilizar a arquitetura de rede neural transformer para capturar a ordem e contexto das palavras.",
        c: "Aplicar um modelo de regressão linear para prever respostas baseadas em palavras-chave.",
        d: "Desenvolver um sistema baseado em regras fixas para responder perguntas.",
      },
      correta: "b",
      explicacao:
        "A arquitetura transformer é projetada para lidar com a ordem e contexto das palavras, o que é essencial para o processamento de linguagem natural.",
      fonte: "dominios.nlp",
    },
    {
      id: "inteligencia-artificial-av-03",
      nivel: "avancado",
      pergunta:
        "Você está trabalhando em um projeto de classificação de sentimentos em textos. Qual é a primeira etapa que você deve realizar para preparar os dados para o modelo?",
      alternativas: {
        a: "Converter os textos em números através da tokenização e vetorização.",
        b: "Treinar um modelo de linguagem do zero com todos os dados disponíveis.",
        c: "Aplicar técnicas de deep learning sem pré-processar os dados.",
        d: "Utilizar um modelo de regressão para prever sentimentos diretamente.",
      },
      correta: "a",
      explicacao:
        "Converter textos em números através da tokenização e vetorização é fundamental para que o modelo entenda e processe a linguagem humana.",
      fonte: "dominios.nlp",
    },
    {
      id: "inteligencia-artificial-av-04",
      nivel: "avancado",
      pergunta:
        "Você precisa gerar respostas de um assistente virtual com alta precisão. Qual abordagem você deve adotar ao usar um LLM via API?",
      alternativas: {
        a: "Ajustar a temperatura para alta, para obter respostas mais criativas.",
        b: "Definir um prompt de sistema claro e ajustar a temperatura para baixa.",
        c: "Usar um prompt de usuário longo e detalhado sem um prompt de sistema.",
        d: "Focar em prompts curtos para economizar tokens, independentemente do contexto.",
      },
      correta: "b",
      explicacao:
        "Definir um prompt de sistema claro e ajustar a temperatura para baixa garante respostas mais previsíveis e consistentes, essenciais para precisão.",
      fonte: "generativa.api",
    },
    {
      id: "inteligencia-artificial-av-05",
      nivel: "avancado",
      pergunta:
        "Você está desenvolvendo um chatbot que precisa responder com informações específicas de sua empresa. Qual técnica é mais eficaz para adaptar um modelo pronto?",
      alternativas: {
        a: "Treinar o modelo do zero com dados da empresa.",
        b: "Conectar o modelo a uma base de conhecimento própria com dados relevantes.",
        c: "Usar um modelo genérico sem adaptações, confiando apenas na memória do modelo.",
        d: "Fornecer instruções vagas e esperar que o modelo entenda o contexto.",
      },
      correta: "b",
      explicacao:
        "Conectar o modelo a uma base de conhecimento própria permite que ele utilize informações específicas, reduzindo alucinações e melhorando a precisão das respostas.",
      fonte: "generativa.adaptar",
    },
    {
      id: "inteligencia-artificial-av-06",
      nivel: "avancado",
      pergunta:
        "Você quer utilizar um modelo de linguagem para classificar sentimentos em textos. Qual é a melhor prática ao usar um modelo do Hugging Face?",
      alternativas: {
        a: "Baixar o modelo mais complexo disponível para garantir a melhor performance.",
        b: "Escrever instruções claras e fornecer exemplos no prompt para guiar o modelo.",
        c: "Ignorar a documentação do modelo e usar qualquer formato de entrada.",
        d: "Usar um modelo sem considerar o custo por token, focando apenas na qualidade.",
      },
      correta: "b",
      explicacao:
        "Escrever instruções claras e fornecer exemplos ajuda a guiar o modelo, resultando em respostas melhores e mais relevantes.",
      fonte: "generativa.huggingface",
    },
    {
      id: "inteligencia-artificial-av-07",
      nivel: "avancado",
      pergunta:
        "Você está criando um sistema que gera texto baseado em um LLM. Como você deve estruturar sua chamada para garantir controle sobre o comportamento do modelo?",
      alternativas: {
        a: "Usar apenas um prompt de usuário e deixar o modelo decidir o resto.",
        b: "Separar claramente o prompt de sistema e o prompt de usuário na chamada.",
        c: "Definir um prompt de sistema vago para dar liberdade ao modelo.",
        d: "Focar em um único prompt longo que combine todas as instruções.",
      },
      correta: "b",
      explicacao:
        "Separar claramente o prompt de sistema e o prompt de usuário permite que você controle o comportamento do modelo e varie as perguntas de forma eficaz.",
      fonte: "generativa.api",
    },
    {
      id: "inteligencia-artificial-av-08",
      nivel: "avancado",
      pergunta:
        "Você deseja usar um LLM para gerar conteúdo criativo, mas também precisa de consistência. Qual configuração de temperatura é mais adequada?",
      alternativas: {
        a: "Temperatura alta para obter respostas mais variadas e criativas.",
        b: "Temperatura baixa para garantir previsibilidade e consistência.",
        c: "Temperatura média para equilibrar criatividade e precisão.",
        d: "Temperatura zero, para evitar qualquer variação nas respostas.",
      },
      correta: "b",
      explicacao:
        "A temperatura baixa garante respostas mais previsíveis e consistentes, o que é essencial para tarefas que exigem precisão.",
      fonte: "generativa.api",
    },
    {
      id: "inteligencia-artificial-av-09",
      nivel: "avancado",
      pergunta:
        "Você precisa que um modelo de linguagem responda com informações atualizadas sobre sua empresa. Qual abordagem é mais eficaz?",
      alternativas: {
        a: "Confiar apenas na memória do modelo, pois ele é treinado em dados amplos.",
        b: "Incluir informações relevantes da sua base de conhecimento junto com a pergunta.",
        c: "Usar um modelo genérico sem adaptações, pois ele já é bom o suficiente.",
        d: "Treinar o modelo do zero com dados da empresa, ignorando opções mais simples.",
      },
      correta: "b",
      explicacao:
        "Incluir informações relevantes da sua base de conhecimento ajuda a garantir que o modelo responda com dados atualizados e específicos.",
      fonte: "generativa.adaptar",
    },
    {
      id: "inteligencia-artificial-av-10",
      nivel: "avancado",
      pergunta:
        "Você está desenvolvendo um modelo de IA e percebe que os dados contêm viés. O que você deve fazer para mitigar esse problema?",
      alternativas: {
        a: "Ignorar o viés, pois todos os dados têm algum nível de distorção.",
        b: "Recolher mais dados de grupos sub-representados para equilibrar o conjunto.",
        c: "Aumentar o peso dos dados que representam os grupos majoritários.",
        d: "Treinar o modelo sem considerar a origem dos dados.",
      },
      correta: "b",
      explicacao:
        "Recolher mais dados de grupos sub-representados ajuda a equilibrar o conjunto e reduz o viés no modelo.",
      fonte: "pratica.etica",
    },
    {
      id: "inteligencia-artificial-av-11",
      nivel: "avancado",
      pergunta:
        "Você decidiu criar um chatbot que responde a perguntas sobre um tema específico. Qual abordagem é a mais recomendada para garantir que ele forneça respostas precisas?",
      alternativas: {
        a: "Usar apenas a memória do modelo sem uma base de conhecimento externa.",
        b: "Integrar uma base de conhecimento própria que o modelo consulte para respostas.",
        c: "Permitir que o modelo gere respostas sem qualquer supervisão.",
        d: "Focar apenas na interface de usuário, sem se preocupar com a precisão das respostas.",
      },
      correta: "b",
      explicacao:
        "Integrar uma base de conhecimento própria permite que o chatbot forneça respostas mais precisas e contextualizadas.",
      fonte: "pratica.projeto",
    },
    {
      id: "inteligencia-artificial-av-12",
      nivel: "avancado",
      pergunta:
        "Você está prestes a participar de uma competição no Kaggle. Qual é a melhor estratégia para maximizar seu aprendizado durante o processo?",
      alternativas: {
        a: "Focar apenas em vencer a competição, ignorando o aprendizado com os outros.",
        b: "Estudar as soluções compartilhadas após a competição para entender diferentes abordagens.",
        c: "Copiar a solução de um competidor que já venceu para garantir um bom resultado.",
        d: "Evitar interagir com outros participantes para não ser influenciado.",
      },
      correta: "b",
      explicacao:
        "Estudar as soluções compartilhadas após a competição é uma maneira eficaz de aprender com as abordagens de outros e aprimorar suas habilidades.",
      fonte: "pratica.kaggle",
    },
    {
      id: "inteligencia-artificial-av-13",
      nivel: "avancado",
      pergunta:
        "Ao construir um modelo de IA, você se depara com dados que podem violar a privacidade das pessoas. Qual deve ser sua abordagem?",
      alternativas: {
        a: "Utilizar os dados sem preocupações, pois são apenas números.",
        b: "Remover dados identificáveis e garantir que a privacidade seja respeitada.",
        c: "Compartilhar os dados abertamente para que outros também possam usá-los.",
        d: "Ignorar a privacidade, já que o modelo não é para uso comercial.",
      },
      correta: "b",
      explicacao:
        "Remover dados identificáveis e garantir a privacidade é essencial para respeitar os direitos das pessoas e evitar problemas legais.",
      fonte: "pratica.etica",
    },
    {
      id: "inteligencia-artificial-av-14",
      nivel: "avancado",
      pergunta:
        "Você completou a trilha de IA e quer continuar evoluindo. Qual é a melhor maneira de escolher seu próximo passo?",
      alternativas: {
        a: "Escolher aleatoriamente um tópico que parece interessante.",
        b: "Focar em aprender tudo de uma vez para não perder tempo.",
        c: "Identificar a área que mais te atrai e se aprofundar nela.",
        d: "Seguir as tendências do mercado sem considerar seu próprio interesse.",
      },
      correta: "c",
      explicacao:
        "Identificar a área que mais te atrai e se aprofundar nela é fundamental para criar valor real e manter a motivação.",
      fonte: "pratica.proximos",
    },
    {
      id: "inteligencia-artificial-av-15",
      nivel: "avancado",
      pergunta:
        "Você está desenvolvendo um projeto de IA e precisa garantir que as decisões do modelo sejam transparentes. O que você deve fazer?",
      alternativas: {
        a: "Apresentar as respostas do modelo como verdades absolutas.",
        b: "Explicar a origem das respostas e como o modelo chegou a elas.",
        c: "Evitar detalhar o funcionamento do modelo para não confundir os usuários.",
        d: "Focar apenas na funcionalidade, sem se preocupar com a transparência.",
      },
      correta: "b",
      explicacao:
        "Explicar a origem das respostas e o funcionamento do modelo é essencial para garantir a transparência e a confiança dos usuários.",
      fonte: "pratica.etica",
    },
    {
      id: "inteligencia-artificial-av-16",
      nivel: "avancado",
      pergunta:
        "Um LLM respondeu com a citação de uma lei que parece precisa, mas você não encontra a fonte em lugar nenhum. O que explica esse comportamento?",
      alternativas: {
        a: "O LLM consultou a internet em tempo real e trouxe um dado desatualizado.",
        b: "O LLM alucinou: gerou um texto plausível com confiança, sem que ele seja verdade verificada.",
        c: "O LLM não foi treinado o suficiente e por isso ainda comete erros de digitação.",
        d: "O LLM confundiu o idioma da pergunta com o idioma do treino.",
      },
      correta: "b",
      explicacao:
        "LLMs preveem a próxima palavra plausível, não a verdade verificada, então alucinam: geram informações falsas com total confiança. Por isso qualquer uso sério exige verificação humana da saída.",
      fonte: "generativa.llms",
    },
    {
      id: "inteligencia-artificial-av-17",
      nivel: "avancado",
      pergunta:
        "Você quer que um LLM responda sobre os documentos internos da sua empresa, sempre atualizados, sem treinar nada. Qual técnica resolve isso?",
      alternativas: {
        a: "RAG: buscar os trechos relevantes dos documentos e entregá-los junto com a pergunta.",
        b: "Aumentar a temperatura para o modelo ser mais criativo nas respostas.",
        c: "Fine-tuning completo do modelo a cada novo documento adicionado.",
        d: "Confiar na memória do modelo, que já contém todo o conhecimento necessário.",
      },
      correta: "a",
      explicacao:
        "RAG (geração aumentada por recuperação) busca os trechos relevantes dos seus dados e os injeta no prompt, para o modelo responder ancorado neles. Isso dá respostas atualizadas, específicas e com fonte, reduzindo alucinação, sem treinar o modelo.",
      fonte: "generativa.rag",
    },
    {
      id: "inteligencia-artificial-av-18",
      nivel: "avancado",
      pergunta:
        "Você quer que um LLM consulte a previsão do tempo de verdade antes de responder. Como o function calling torna isso possível?",
      alternativas: {
        a: "O modelo executa a consulta sozinho, diretamente nos servidores do provedor.",
        b: "O modelo indica que quer chamar uma função que você disponibilizou, seu código a executa e devolve o resultado.",
        c: "O modelo memoriza a previsão durante o treino e a recupera na resposta.",
        d: "O modelo aumenta a temperatura para adivinhar o clima com mais variedade.",
      },
      correta: "b",
      explicacao:
        "No function calling, em vez de só gerar texto, o modelo sinaliza que quer chamar uma função que você forneceu; seu código a executa de verdade e devolve o resultado ao modelo. Assim o LLM supera fraquezas como fatos atualizados, delegando-as a ferramentas confiáveis.",
      fonte: "generativa.agentes",
    },
    {
      id: "inteligencia-artificial-av-19",
      nivel: "avancado",
      pergunta:
        "Um LLM erra num problema que exige várias etapas de raciocínio. Qual técnica de prompt tende a reduzir esse erro?",
      alternativas: {
        a: "Pedir explicitamente que o modelo pense passo a passo antes de dar a resposta final.",
        b: "Reduzir o prompt ao mínimo para economizar tokens.",
        c: "Repetir a mesma pergunta várias vezes na mesma chamada.",
        d: "Aumentar a temperatura para o modelo explorar mais respostas.",
      },
      correta: "a",
      explicacao:
        "Pedir para o modelo pensar passo a passo o faz explicitar as etapas antes de concluir, o que reduz erros em contas e lógica. Ainda assim, um bom prompt reduz, mas não elimina, alucinações: validar a saída continua obrigatório.",
      fonte: "generativa.prompts",
    },
    {
      id: "inteligencia-artificial-av-20",
      nivel: "avancado",
      pergunta:
        "Você quer um app em que o usuário envia a foto de um gráfico e recebe uma explicação em texto. Que tipo de modelo torna isso possível num sistema só?",
      alternativas: {
        a: "Um modelo de regressão treinado apenas com números.",
        b: "Um modelo multimodal, que entende imagem e texto no mesmo espaço de significado.",
        c: "Uma rede recorrente (LSTM) especializada em séries temporais.",
        d: "Um modelo de clusterização que agrupa imagens parecidas.",
      },
      correta: "b",
      explicacao:
        "Modelos multimodais entendem e combinam várias modalidades (imagem, texto, áudio) num espaço comum de significado, permitindo mandar uma foto e uma pergunta e receber uma resposta em texto, sem juntar vários sistemas na mão.",
      fonte: "generativa.multimodal",
    },
    {
      id: "inteligencia-artificial-av-21",
      nivel: "avancado",
      pergunta:
        "Um modelo em produção começa a errar cada vez mais com o tempo, sem nenhum bug no código. O que provavelmente aconteceu?",
      alternativas: {
        a: "Overfitting, que só aparece durante o treino.",
        b: "Drift: o mundo mudou e os dados de entrada deixaram de se parecer com os de treino.",
        c: "A GPU do servidor ficou lenta e degradou a qualidade das previsões.",
        d: "O modelo esqueceu o que aprendeu por falta de uso.",
      },
      correta: "b",
      explicacao:
        "Um modelo pode degradar sozinho por drift: o mundo muda, os dados que chegam deixam de se parecer com os de treino e a qualidade cai. Por isso MLOps exige monitorar previsões e dados em produção; a resposta costuma ser retreinar com dados atuais.",
      fonte: "pratica.mlops",
    },
    {
      id: "inteligencia-artificial-av-22",
      nivel: "avancado",
      pergunta:
        "Num chat interativo, você precisa de respostas rápidas e baratas para uma tarefa simples. Qual decisão faz mais sentido?",
      alternativas: {
        a: "Usar sempre o modelo maior e mais poderoso disponível, custe o que custar.",
        b: "Escolher o menor modelo que resolve bem a tarefa, equilibrando qualidade, custo e latência.",
        c: "Aumentar o tamanho do prompt para melhorar a resposta, sem olhar o custo por token.",
        d: "Priorizar a resposta mais lenta, pois ela costuma ser mais precisa.",
      },
      correta: "b",
      explicacao:
        "O modelo maior também é o mais caro e o mais lento. A pergunta certa não é qual o mais poderoso, e sim qual o menor modelo que resolve este problema bem o bastante, equilibrando qualidade, custo e latência.",
      fonte: "pratica.custos",
    },
    {
      id: "inteligencia-artificial-av-23",
      nivel: "avancado",
      pergunta:
        "Um serviço recomenda um item com a lógica de que pessoas com gosto parecido com o seu também gostaram dele. Que abordagem é essa?",
      alternativas: {
        a: "Filtragem baseada em conteúdo, que usa as características do próprio item.",
        b: "Filtragem colaborativa, que se baseia no comportamento de usuários parecidos.",
        c: "Arranque a frio, usado quando não há histórico do usuário.",
        d: "Redução de dimensionalidade, que comprime o catálogo de itens.",
      },
      correta: "b",
      explicacao:
        "Recomendar com base no comportamento de gente parecida é filtragem colaborativa (quem consumiu isto também consumiu aquilo). A baseada em conteúdo usa características do item; na prática, sistemas reais combinam as duas em modelos híbridos.",
      fonte: "dominios.recomendacao",
    },
    {
      id: "inteligencia-artificial-av-24",
      nivel: "avancado",
      pergunta:
        "Sua equipe vai treinar um modelo com dados pessoais de clientes no Brasil. Que marco legal rege diretamente essa coleta e uso?",
      alternativas: {
        a: "A LGPD, que no Brasil regula como dados pessoais podem ser coletados e usados.",
        b: "O AI Act, que é a única lei aplicável a qualquer projeto de IA no mundo.",
        c: "Nenhum, porque dados usados para treinar modelos não são regulados.",
        d: "Apenas os termos de uso internos da empresa, sem obrigação legal externa.",
      },
      correta: "a",
      explicacao:
        "No Brasil, a LGPD rege como dados pessoais podem ser coletados e usados, e alcança diretamente quem treina modelos com dados de pessoas. Na Europa, o AI Act impõe obrigações conforme o risco da aplicação e virou referência global.",
      fonte: "pratica.etica",
    },
    {
      id: "inteligencia-artificial-av-25",
      nivel: "avancado",
      pergunta:
        "Um aplicativo gera legendas automáticas transformando a fala de um vídeo em texto. Que tarefa de IA é essa?",
      alternativas: {
        a: "Síntese de voz (text-to-speech, TTS).",
        b: "Reconhecimento de fala (speech-to-text, STT).",
        c: "Visão computacional aplicada a vídeo.",
        d: "Tradução automática entre idiomas.",
      },
      correta: "b",
      explicacao:
        "Transformar voz em texto é reconhecimento de fala (speech-to-text, STT), o que gera legendas e transcrições. O caminho inverso, transformar texto em fala natural, é a síntese de voz (text-to-speech, TTS).",
      fonte: "dominios.audio",
    },
    {
      id: "inteligencia-artificial-av-26",
      nivel: "avancado",
      pergunta:
        "Ao avaliar um modelo que prevê vendas mês a mês, por que você NÃO pode embaralhar os dados antes de separar treino e teste?",
      alternativas: {
        a: "Porque embaralhar apaga os rótulos de cada venda.",
        b: "Porque a ordem no tempo importa: treinar com dados do futuro para prever o passado não faz sentido.",
        c: "Porque séries temporais não podem ser divididas em treino e teste.",
        d: "Porque embaralhar deixa o treino mais lento sem nenhum motivo.",
      },
      correta: "b",
      explicacao:
        "Numa série temporal, os dados não são independentes: o valor de hoje depende do de ontem. A separação entre treino e teste precisa respeitar a linha do tempo, porque treinar com dados do futuro para prever o passado não reflete o uso real do modelo.",
      fonte: "dominios.series",
    },
    {
      id: "inteligencia-artificial-av-27",
      nivel: "avancado",
      pergunta:
        "Você quer um papel focado em levar modelos à produção de forma robusta e escalável, mais perto da engenharia de software e da infraestrutura. Qual perfil combina mais?",
      alternativas: {
        a: "Cientista de Dados, focado em explorar dados e experimentar modelos.",
        b: "Engenheiro de Machine Learning, focado em produção, escala e MLOps.",
        c: "Engenheiro de IA, focado em construir produtos sobre modelos prontos.",
        d: "Analista de negócios, focado em relatórios e indicadores.",
      },
      correta: "b",
      explicacao:
        "O Engenheiro de Machine Learning foca em levar modelos à produção de forma robusta e escalável, puxando para a engenharia de software e a infraestrutura (o território de MLOps). O Cientista de Dados vive mais perto da estatística e do negócio, e o Engenheiro de IA constrói produtos sobre modelos prontos.",
      fonte: "pratica.carreira",
    },
  ],
};

export default pool;
