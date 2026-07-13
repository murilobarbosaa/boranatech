// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool ia). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "ia",
  "questions": [
    {
      "id": "ia-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um sistema de reconhecimento de imagem. Qual abordagem é mais adequada para ensinar o sistema a identificar gatos?",
      "alternativas": {
        "a": "Programar regras específicas para cada tipo de gato.",
        "b": "Mostrar milhares de fotos de gatos para que o sistema aprenda os padrões.",
        "c": "Usar um banco de dados pequeno com imagens de gatos e cães.",
        "d": "Definir manualmente as características que um gato deve ter."
      },
      "correta": "b",
      "explicacao": "Mostrar milhares de fotos permite que o sistema aprenda os padrões que caracterizam os gatos, o que é a essência do aprendizado de máquina.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "ia-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você precisa escolher uma técnica para um problema de classificação simples com dados em tabela. Qual abordagem é mais indicada?",
      "alternativas": {
        "a": "Usar deep learning para garantir a melhor precisão.",
        "b": "Aplicar um modelo clássico de machine learning como árvores de decisão.",
        "c": "Criar um algoritmo do zero sem usar bibliotecas.",
        "d": "Utilizar um modelo de deep learning por ser mais moderno."
      },
      "correta": "b",
      "explicacao": "Modelos clássicos de machine learning são mais rápidos e econômicos para dados estruturados em tabela, ao contrário do deep learning que é mais complexo.",
      "fonte": "fundamentos.camadas"
    },
    {
      "id": "ia-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está montando um projeto de IA e precisa definir suas expectativas. O que é importante lembrar sobre o que a IA realmente faz?",
      "alternativas": {
        "a": "A IA pode entender o mundo como um ser humano.",
        "b": "A IA é capaz de encontrar padrões em grandes volumes de dados.",
        "c": "A IA sempre gera resultados perfeitos e sem erros.",
        "d": "A IA é uma solução mágica para todos os problemas."
      },
      "correta": "b",
      "explicacao": "A IA é eficaz em encontrar padrões em grandes volumes de dados, mas não tem consciência ou entendimento como um humano.",
      "fonte": "fundamentos.expectativas"
    },
    {
      "id": "ia-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você decidiu começar a aprender IA e escolheu uma linguagem de programação. Qual é a melhor escolha para essa área?",
      "alternativas": {
        "a": "Java, pois é mais popular e versátil.",
        "b": "C++, que é mais rápido e eficiente.",
        "c": "Python, que possui as principais bibliotecas de IA.",
        "d": "Ruby, que é mais fácil de aprender."
      },
      "correta": "c",
      "explicacao": "Python é a linguagem mais utilizada em IA devido às suas bibliotecas especializadas e à comunidade ativa.",
      "fonte": "fundamentos.ambiente"
    },
    {
      "id": "ia-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está usando Google Colab para um projeto de IA. O que é uma das principais vantagens de usar essa ferramenta?",
      "alternativas": {
        "a": "Ela permite o uso de qualquer linguagem de programação.",
        "b": "Ela oferece acesso gratuito a GPU para acelerar o treino de modelos.",
        "c": "Ela não requer conexão com a internet para funcionar.",
        "d": "Ela é a única ferramenta disponível para IA."
      },
      "correta": "b",
      "explicacao": "O acesso gratuito a GPU no Google Colab é uma grande vantagem, pois acelera significativamente o treinamento de modelos de deep learning.",
      "fonte": "fundamentos.ambiente"
    },
    {
      "id": "ia-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você quer explicar a diferença entre IA, machine learning e deep learning para um colega. O que você deve enfatizar?",
      "alternativas": {
        "a": "Deep learning é mais amplo que machine learning.",
        "b": "Machine learning é um subconjunto da IA, e deep learning é um subconjunto de machine learning.",
        "c": "IA e machine learning são sinônimos e podem ser usados de forma intercambiável.",
        "d": "Deep learning não está relacionado a IA."
      },
      "correta": "b",
      "explicacao": "Machine learning é um subconjunto da IA, enquanto deep learning é um subconjunto de machine learning, formando uma hierarquia.",
      "fonte": "fundamentos.camadas"
    },
    {
      "id": "ia-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está preparando um projeto de IA e precisa coletar dados. O que é crucial para garantir um bom modelo?",
      "alternativas": {
        "a": "Usar dados de qualquer fonte disponível, sem preocupação com a qualidade.",
        "b": "Coletar dados de alta qualidade e representativos do problema.",
        "c": "Utilizar apenas dados antigos, pois são mais confiáveis.",
        "d": "Ignorar a quantidade de dados, focando apenas na variedade."
      },
      "correta": "b",
      "explicacao": "Dados de alta qualidade e representativos são essenciais para treinar modelos eficazes e evitar enviesamentos.",
      "fonte": "fundamentos.expectativas"
    },
    {
      "id": "ia-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está desenvolvendo um assistente virtual que precisa entender comandos de voz. Qual abordagem de IA seria mais apropriada?",
      "alternativas": {
        "a": "Programar manualmente todas as respostas possíveis.",
        "b": "Utilizar técnicas de deep learning para reconhecimento de voz.",
        "c": "Usar um modelo de machine learning clássico para entender áudio.",
        "d": "Implementar um sistema baseado em regras fixas."
      },
      "correta": "b",
      "explicacao": "Deep learning é especialmente eficaz para dados não estruturados, como áudio, permitindo melhor reconhecimento de voz.",
      "fonte": "fundamentos.camadas"
    },
    {
      "id": "ia-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está explicando a um amigo o que a IA não é. Qual afirmação é correta?",
      "alternativas": {
        "a": "A IA é uma máquina que pode pensar como um humano.",
        "b": "A IA é uma técnica para automatizar tarefas repetitivas.",
        "c": "A IA é uma fonte de verdade absoluta e infalível.",
        "d": "A IA pode substituir completamente a criatividade humana."
      },
      "correta": "b",
      "explicacao": "A IA é uma técnica que ajuda a automatizar tarefas, mas não possui consciência ou entendimento humano.",
      "fonte": "fundamentos.expectativas"
    },
    {
      "id": "ia-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você está criando um projeto de IA e precisa escolher um ambiente de desenvolvimento. Qual é a opção mais prática para iniciantes?",
      "alternativas": {
        "a": "Instalar um software pesado no computador.",
        "b": "Usar o Google Colab, que roda no navegador e é gratuito.",
        "c": "Optar por um ambiente local sem acesso à internet.",
        "d": "Escolher um ambiente que não suporte bibliotecas de IA."
      },
      "correta": "b",
      "explicacao": "O Google Colab é ideal para iniciantes, pois não requer instalação e já possui as bibliotecas necessárias.",
      "fonte": "fundamentos.ambiente"
    },
    {
      "id": "ia-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você precisa manipular um conjunto de dados para um projeto de IA. Qual biblioteca do Python é mais indicada para essa tarefa?",
      "alternativas": {
        "a": "NumPy, que é ótima para cálculos numéricos em massa",
        "b": "Matplotlib, que é usada para desenhar gráficos",
        "c": "Pandas, que é ideal para manipulação de dados em tabelas",
        "d": "Scikit-learn, que é focada em algoritmos de aprendizado de máquina"
      },
      "correta": "c",
      "explicacao": "A biblioteca Pandas é a mais indicada para manipulação de dados em tabelas, sendo essencial para preparar dados antes de treinar modelos.",
      "fonte": "prerequisitos.python"
    },
    {
      "id": "ia-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você está aprendendo Python e quer se tornar fluente. Qual é a melhor prática recomendada para atingir esse objetivo?",
      "alternativas": {
        "a": "Ler livros sobre Python até se sentir confortável",
        "b": "Fazer exercícios abstratos de programação",
        "c": "Praticar escrevendo código com dados reais",
        "d": "Assistir a vídeos tutoriais sem praticar"
      },
      "correta": "c",
      "explicacao": "A prática de escrever código com dados reais ajuda a fixar a linguagem e aproxima do trabalho prático em IA.",
      "fonte": "prerequisitos.python"
    },
    {
      "id": "ia-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está começando a aprender sobre IA e se depara com a necessidade de entender seus dados. Qual área da matemática é mais importante nesse momento?",
      "alternativas": {
        "a": "Álgebra linear, para entender vetores e matrizes",
        "b": "Cálculo, para compreender derivadas",
        "c": "Estatística básica, para interpretar dados e modelos",
        "d": "Geometria, para entender formas e espaços"
      },
      "correta": "c",
      "explicacao": "A estatística básica é crucial para entender e interpretar dados, permitindo avaliar se um modelo é bom ou não.",
      "fonte": "prerequisitos.matematica"
    },
    {
      "id": "ia-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você quer entender como os modelos de IA aprendem. Qual conceito matemático é essencial para isso?",
      "alternativas": {
        "a": "Média, para calcular valores centrais",
        "b": "Derivada, para entender ajustes nos modelos",
        "c": "Distribuição, para analisar dados",
        "d": "Probabilidade, para prever resultados"
      },
      "correta": "b",
      "explicacao": "O conceito de derivada é essencial para entender como os modelos de IA ajustam seus parâmetros durante o aprendizado.",
      "fonte": "prerequisitos.matematica"
    },
    {
      "id": "ia-ini-15",
      "nivel": "iniciante",
      "pergunta": "Ao estudar álgebra linear, qual operação é fundamental para compreender como os dados são representados em IA?",
      "alternativas": {
        "a": "Adição de vetores, que é simples e direta",
        "b": "Multiplicação de matrizes, que é complexa mas essencial",
        "c": "Subtração de números, que é básica",
        "d": "Divisão de frações, que é comum em cálculos"
      },
      "correta": "b",
      "explicacao": "A multiplicação de matrizes é fundamental para entender a representação de dados e modelos em IA, especialmente em redes neurais.",
      "fonte": "prerequisitos.matematica"
    },
    {
      "id": "ia-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está iniciando um projeto de machine learning e precisa definir o problema. Qual é a primeira pergunta a se fazer?",
      "alternativas": {
        "a": "Qual modelo de machine learning eu vou usar?",
        "b": "Quais dados eu já tenho disponíveis?",
        "c": "O que exatamente eu quero prever ou decidir?",
        "d": "Como eu vou avaliar o modelo depois?"
      },
      "correta": "c",
      "explicacao": "Definir claramente o que se quer prever ou decidir é o primeiro passo essencial para guiar todo o projeto de machine learning.",
      "fonte": "ml.fluxo"
    },
    {
      "id": "ia-int-02",
      "nivel": "intermediario",
      "pergunta": "Durante a preparação de dados para um projeto de machine learning, você percebe que os dados estão desorganizados. O que você deve priorizar?",
      "alternativas": {
        "a": "Treinar um modelo com os dados disponíveis.",
        "b": "Limpar e organizar os dados antes de qualquer outra coisa.",
        "c": "Coletar mais dados sem se preocupar com a qualidade.",
        "d": "Testar diferentes algoritmos para ver qual funciona melhor."
      },
      "correta": "b",
      "explicacao": "Limpar e organizar os dados é crucial, pois dados ruins podem comprometer o resultado final do modelo.",
      "fonte": "ml.fluxo"
    },
    {
      "id": "ia-int-03",
      "nivel": "intermediario",
      "pergunta": "Você treinou um modelo de machine learning e agora precisa avaliar seu desempenho. O que você deve fazer primeiro?",
      "alternativas": {
        "a": "Usar os mesmos dados que foram usados para treinar.",
        "b": "Separar os dados em conjuntos de treino e teste.",
        "c": "Ajustar os parâmetros do modelo.",
        "d": "Comparar o modelo com outros que já foram testados."
      },
      "correta": "b",
      "explicacao": "Separar os dados em treino e teste é fundamental para avaliar o desempenho do modelo em dados que ele nunca viu.",
      "fonte": "ml.fluxo"
    },
    {
      "id": "ia-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está trabalhando em um projeto de classificação de emails como spam ou não. Qual técnica de aprendizado você deve usar?",
      "alternativas": {
        "a": "Aprendizado não supervisionado para descobrir padrões.",
        "b": "Aprendizado supervisionado com exemplos rotulados.",
        "c": "Aprendizado por reforço para otimizar decisões.",
        "d": "Nenhuma, pois isso não é um problema de machine learning."
      },
      "correta": "b",
      "explicacao": "A classificação de emails é um exemplo clássico de aprendizado supervisionado, onde você tem exemplos com respostas conhecidas.",
      "fonte": "ml.tipos"
    },
    {
      "id": "ia-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está utilizando um modelo de regressão para prever vendas. Qual métrica é mais adequada para avaliar o desempenho do modelo?",
      "alternativas": {
        "a": "Taxa de acerto bruta.",
        "b": "Erro médio absoluto.",
        "c": "Número de vendas reais.",
        "d": "Percentual de vendas acima da média."
      },
      "correta": "b",
      "explicacao": "O erro médio absoluto é uma métrica adequada para avaliar a precisão de previsões numéricas em regressão.",
      "fonte": "ml.avaliacao"
    },
    {
      "id": "ia-int-06",
      "nivel": "intermediario",
      "pergunta": "Ao avaliar um modelo de classificação, você percebe que a taxa de acerto é alta, mas as classes estão desbalanceadas. O que você deve considerar?",
      "alternativas": {
        "a": "A taxa de acerto é a única métrica que importa.",
        "b": "Usar apenas a taxa de acerto para avaliar o modelo.",
        "c": "Explorar métricas adicionais que considerem o desbalanceamento.",
        "d": "Aumentar o número de dados da classe minoritária."
      },
      "correta": "c",
      "explicacao": "Métricas adicionais, como precisão e recall, são importantes para avaliar modelos em situações de classes desbalanceadas.",
      "fonte": "ml.avaliacao"
    },
    {
      "id": "ia-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está usando o scikit-learn e deseja treinar um modelo. Qual é o primeiro passo que você deve executar?",
      "alternativas": {
        "a": "Chamar a função de métrica para avaliar o modelo.",
        "b": "Separar os dados em treino e teste.",
        "c": "Chamar o método .fit() com os dados de treino.",
        "d": "Escolher um modelo para usar."
      },
      "correta": "b",
      "explicacao": "O primeiro passo é sempre separar os dados em conjuntos de treino e teste antes de treinar o modelo.",
      "fonte": "ml.sklearn"
    },
    {
      "id": "ia-int-08",
      "nivel": "intermediario",
      "pergunta": "Você decidiu usar uma árvore de decisão para um projeto de machine learning. Qual é uma das principais vantagens desse modelo?",
      "alternativas": {
        "a": "É o modelo mais complexo e poderoso disponível.",
        "b": "É fácil de visualizar e interpretar as decisões que toma.",
        "c": "Não requer separação de dados para treino e teste.",
        "d": "Funciona melhor que todos os outros modelos em qualquer situação."
      },
      "correta": "b",
      "explicacao": "Uma das principais vantagens das árvores de decisão é sua facilidade de visualização e interpretação das decisões.",
      "fonte": "ml.sklearn"
    },
    {
      "id": "ia-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está aprendendo a usar o scikit-learn e precisa gerar previsões com o modelo treinado. Qual método você deve usar?",
      "alternativas": {
        "a": "Chamar o método .predict() com os dados de teste.",
        "b": "Chamar o método .fit() novamente com os dados de teste.",
        "c": "Usar a função de métrica para prever.",
        "d": "Separar os dados de teste novamente."
      },
      "correta": "a",
      "explicacao": "O método .predict() é utilizado para gerar previsões com o modelo treinado usando dados que ele nunca viu.",
      "fonte": "ml.sklearn"
    },
    {
      "id": "ia-int-10",
      "nivel": "intermediario",
      "pergunta": "Você está criando uma rede neural para classificar imagens. Qual é a razão principal para usar várias camadas na rede?",
      "alternativas": {
        "a": "Camadas adicionais ajudam a aprender padrões mais complexos nos dados.",
        "b": "Camadas extras aumentam a velocidade de processamento da rede.",
        "c": "Camadas em excesso garantem que a rede sempre acerte as previsões.",
        "d": "Camadas adicionais são necessárias para que a rede funcione corretamente."
      },
      "correta": "a",
      "explicacao": "Várias camadas permitem que a rede aprenda padrões complexos, aumentando sua capacidade de generalização.",
      "fonte": "deeplearning.redes"
    },
    {
      "id": "ia-int-11",
      "nivel": "intermediario",
      "pergunta": "Durante o treinamento de uma rede neural, você percebe que a função de perda não está diminuindo. O que você deve considerar ajustar primeiro?",
      "alternativas": {
        "a": "Aumentar a taxa de aprendizado para fazer ajustes mais rápidos nos pesos.",
        "b": "Reduzir a quantidade de dados de treinamento para simplificar o problema.",
        "c": "Alterar a função de perda para uma que seja mais adequada ao seu problema.",
        "d": "Aumentar o número de épocas para dar mais tempo ao modelo para aprender."
      },
      "correta": "a",
      "explicacao": "Aumentar a taxa de aprendizado pode ajudar a rede a fazer ajustes mais significativos nos pesos, potencialmente reduzindo a função de perda.",
      "fonte": "deeplearning.treino"
    },
    {
      "id": "ia-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um modelo de deep learning e precisa de uma biblioteca para facilitar o processo. Qual das opções abaixo é a mais recomendada para iniciantes?",
      "alternativas": {
        "a": "TensorFlow, pois é mais robusto e oferece mais funcionalidades.",
        "b": "Keras, que é uma interface de alto nível do TensorFlow, tornando a construção de redes mais simples.",
        "c": "PyTorch, que tem uma curva de aprendizado mais difícil mas é mais poderosa.",
        "d": "NumPy, que é uma biblioteca fundamental para operações matemáticas."
      },
      "correta": "b",
      "explicacao": "Keras é uma interface de alto nível que simplifica a construção de redes neurais, sendo ideal para iniciantes.",
      "fonte": "deeplearning.frameworks"
    },
    {
      "id": "ia-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está treinando uma rede neural e observou que o erro de treinamento está diminuindo, mas o erro de validação está aumentando. O que isso pode indicar?",
      "alternativas": {
        "a": "A rede está aprendendo os dados de treinamento muito bem, mas não generaliza para novos dados.",
        "b": "A rede não está sendo treinada por tempo suficiente e precisa de mais épocas.",
        "c": "A taxa de aprendizado está muito baixa e precisa ser aumentada.",
        "d": "Os dados de validação são irrelevantes e não devem ser considerados."
      },
      "correta": "a",
      "explicacao": "Esse comportamento indica que a rede pode estar sofrendo de overfitting, aprendendo os padrões dos dados de treinamento em detrimento da generalização.",
      "fonte": "deeplearning.treino"
    },
    {
      "id": "ia-int-14",
      "nivel": "intermediario",
      "pergunta": "Você precisa otimizar o desempenho de uma rede neural que está treinando. Qual estratégia você deve considerar para melhorar a eficiência do treinamento?",
      "alternativas": {
        "a": "Aumentar o número de neurônios em cada camada para capturar mais informações.",
        "b": "Utilizar uma GPU para acelerar o processamento durante o treinamento.",
        "c": "Reduzir o número de camadas para simplificar a rede.",
        "d": "Aumentar o tamanho do batch para que mais dados sejam processados de uma vez."
      },
      "correta": "b",
      "explicacao": "Utilizar uma GPU pode acelerar significativamente o treinamento de redes neurais, melhorando a eficiência.",
      "fonte": "deeplearning.frameworks"
    },
    {
      "id": "ia-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está ajustando uma rede neural e percebe que a taxa de aprendizado é muito alta. Qual é o impacto disso no treinamento?",
      "alternativas": {
        "a": "Os pesos podem ser ajustados de forma muito brusca, levando a um treinamento instável.",
        "b": "Os pesos não serão ajustados o suficiente, resultando em um aprendizado lento.",
        "c": "A rede se tornará mais robusta e resistente a overfitting.",
        "d": "O treinamento será concluído mais rapidamente, com resultados mais precisos."
      },
      "correta": "a",
      "explicacao": "Uma taxa de aprendizado muito alta pode causar ajustes bruscos nos pesos, tornando o treinamento instável e dificultando a convergência.",
      "fonte": "deeplearning.treino"
    },
    {
      "id": "ia-av-01",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um sistema de reconhecimento de objetos em imagens. Para garantir que o modelo aprenda a detectar padrões visuais de forma eficaz, qual abordagem você deve usar?",
      "alternativas": {
        "a": "Treinar uma rede neural convolucional do zero com um grande conjunto de dados.",
        "b": "Utilizar transfer learning a partir de um modelo pré-treinado em milhões de imagens.",
        "c": "Aplicar técnicas de classificação de imagem sem considerar a detecção de objetos.",
        "d": "Usar um modelo de rede neural recorrente para processamento de imagens."
      },
      "correta": "b",
      "explicacao": "A utilização de transfer learning permite adaptar um modelo já treinado, economizando tempo e recursos, o que é ideal para iniciantes em visão computacional.",
      "fonte": "dominios.visao"
    },
    {
      "id": "ia-av-02",
      "nivel": "avancado",
      "pergunta": "Você está criando um chatbot que precisa entender e responder perguntas de usuários. Qual técnica você deve usar para lidar com a ambiguidade e contexto da linguagem?",
      "alternativas": {
        "a": "Implementar uma rede neural convolucional para análise de texto.",
        "b": "Utilizar a arquitetura de rede neural transformer para capturar a ordem e contexto das palavras.",
        "c": "Aplicar um modelo de regressão linear para prever respostas baseadas em palavras-chave.",
        "d": "Desenvolver um sistema baseado em regras fixas para responder perguntas."
      },
      "correta": "b",
      "explicacao": "A arquitetura transformer é projetada para lidar com a ordem e contexto das palavras, o que é essencial para o processamento de linguagem natural.",
      "fonte": "dominios.nlp"
    },
    {
      "id": "ia-av-03",
      "nivel": "avancado",
      "pergunta": "Você está trabalhando em um projeto de classificação de sentimentos em textos. Qual é a primeira etapa que você deve realizar para preparar os dados para o modelo?",
      "alternativas": {
        "a": "Converter os textos em números através da tokenização e vetorização.",
        "b": "Treinar um modelo de linguagem do zero com todos os dados disponíveis.",
        "c": "Aplicar técnicas de deep learning sem pré-processar os dados.",
        "d": "Utilizar um modelo de regressão para prever sentimentos diretamente."
      },
      "correta": "a",
      "explicacao": "Converter textos em números através da tokenização e vetorização é fundamental para que o modelo entenda e processe a linguagem humana.",
      "fonte": "dominios.nlp"
    },
    {
      "id": "ia-av-04",
      "nivel": "avancado",
      "pergunta": "Você precisa gerar respostas de um assistente virtual com alta precisão. Qual abordagem você deve adotar ao usar um LLM via API?",
      "alternativas": {
        "a": "Ajustar a temperatura para alta, para obter respostas mais criativas.",
        "b": "Definir um prompt de sistema claro e ajustar a temperatura para baixa.",
        "c": "Usar um prompt de usuário longo e detalhado sem um prompt de sistema.",
        "d": "Focar em prompts curtos para economizar tokens, independentemente do contexto."
      },
      "correta": "b",
      "explicacao": "Definir um prompt de sistema claro e ajustar a temperatura para baixa garante respostas mais previsíveis e consistentes, essenciais para precisão.",
      "fonte": "generativa.api"
    },
    {
      "id": "ia-av-05",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um chatbot que precisa responder com informações específicas de sua empresa. Qual técnica é mais eficaz para adaptar um modelo pronto?",
      "alternativas": {
        "a": "Treinar o modelo do zero com dados da empresa.",
        "b": "Conectar o modelo a uma base de conhecimento própria com dados relevantes.",
        "c": "Usar um modelo genérico sem adaptações, confiando apenas na memória do modelo.",
        "d": "Fornecer instruções vagas e esperar que o modelo entenda o contexto."
      },
      "correta": "b",
      "explicacao": "Conectar o modelo a uma base de conhecimento própria permite que ele utilize informações específicas, reduzindo alucinações e melhorando a precisão das respostas.",
      "fonte": "generativa.adaptar"
    },
    {
      "id": "ia-av-06",
      "nivel": "avancado",
      "pergunta": "Você quer utilizar um modelo de linguagem para classificar sentimentos em textos. Qual é a melhor prática ao usar um modelo do Hugging Face?",
      "alternativas": {
        "a": "Baixar o modelo mais complexo disponível para garantir a melhor performance.",
        "b": "Escrever instruções claras e fornecer exemplos no prompt para guiar o modelo.",
        "c": "Ignorar a documentação do modelo e usar qualquer formato de entrada.",
        "d": "Usar um modelo sem considerar o custo por token, focando apenas na qualidade."
      },
      "correta": "b",
      "explicacao": "Escrever instruções claras e fornecer exemplos ajuda a guiar o modelo, resultando em respostas melhores e mais relevantes.",
      "fonte": "generativa.huggingface"
    },
    {
      "id": "ia-av-07",
      "nivel": "avancado",
      "pergunta": "Você está criando um sistema que gera texto baseado em um LLM. Como você deve estruturar sua chamada para garantir controle sobre o comportamento do modelo?",
      "alternativas": {
        "a": "Usar apenas um prompt de usuário e deixar o modelo decidir o resto.",
        "b": "Separar claramente o prompt de sistema e o prompt de usuário na chamada.",
        "c": "Definir um prompt de sistema vago para dar liberdade ao modelo.",
        "d": "Focar em um único prompt longo que combine todas as instruções."
      },
      "correta": "b",
      "explicacao": "Separar claramente o prompt de sistema e o prompt de usuário permite que você controle o comportamento do modelo e varie as perguntas de forma eficaz.",
      "fonte": "generativa.api"
    },
    {
      "id": "ia-av-08",
      "nivel": "avancado",
      "pergunta": "Você deseja usar um LLM para gerar conteúdo criativo, mas também precisa de consistência. Qual configuração de temperatura é mais adequada?",
      "alternativas": {
        "a": "Temperatura alta para obter respostas mais variadas e criativas.",
        "b": "Temperatura baixa para garantir previsibilidade e consistência.",
        "c": "Temperatura média para equilibrar criatividade e precisão.",
        "d": "Temperatura zero, para evitar qualquer variação nas respostas."
      },
      "correta": "b",
      "explicacao": "A temperatura baixa garante respostas mais previsíveis e consistentes, o que é essencial para tarefas que exigem precisão.",
      "fonte": "generativa.api"
    },
    {
      "id": "ia-av-09",
      "nivel": "avancado",
      "pergunta": "Você precisa que um modelo de linguagem responda com informações atualizadas sobre sua empresa. Qual abordagem é mais eficaz?",
      "alternativas": {
        "a": "Confiar apenas na memória do modelo, pois ele é treinado em dados amplos.",
        "b": "Incluir informações relevantes da sua base de conhecimento junto com a pergunta.",
        "c": "Usar um modelo genérico sem adaptações, pois ele já é bom o suficiente.",
        "d": "Treinar o modelo do zero com dados da empresa, ignorando opções mais simples."
      },
      "correta": "b",
      "explicacao": "Incluir informações relevantes da sua base de conhecimento ajuda a garantir que o modelo responda com dados atualizados e específicos.",
      "fonte": "generativa.adaptar"
    },
    {
      "id": "ia-av-10",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um modelo de IA e percebe que os dados contêm viés. O que você deve fazer para mitigar esse problema?",
      "alternativas": {
        "a": "Ignorar o viés, pois todos os dados têm algum nível de distorção.",
        "b": "Recolher mais dados de grupos sub-representados para equilibrar o conjunto.",
        "c": "Aumentar o peso dos dados que representam os grupos majoritários.",
        "d": "Treinar o modelo sem considerar a origem dos dados."
      },
      "correta": "b",
      "explicacao": "Recolher mais dados de grupos sub-representados ajuda a equilibrar o conjunto e reduz o viés no modelo.",
      "fonte": "pratica.etica"
    },
    {
      "id": "ia-av-11",
      "nivel": "avancado",
      "pergunta": "Você decidiu criar um chatbot que responde a perguntas sobre um tema específico. Qual abordagem é a mais recomendada para garantir que ele forneça respostas precisas?",
      "alternativas": {
        "a": "Usar apenas a memória do modelo sem uma base de conhecimento externa.",
        "b": "Integrar uma base de conhecimento própria que o modelo consulte para respostas.",
        "c": "Permitir que o modelo gere respostas sem qualquer supervisão.",
        "d": "Focar apenas na interface de usuário, sem se preocupar com a precisão das respostas."
      },
      "correta": "b",
      "explicacao": "Integrar uma base de conhecimento própria permite que o chatbot forneça respostas mais precisas e contextualizadas.",
      "fonte": "pratica.projeto"
    },
    {
      "id": "ia-av-12",
      "nivel": "avancado",
      "pergunta": "Você está prestes a participar de uma competição no Kaggle. Qual é a melhor estratégia para maximizar seu aprendizado durante o processo?",
      "alternativas": {
        "a": "Focar apenas em vencer a competição, ignorando o aprendizado com os outros.",
        "b": "Estudar as soluções compartilhadas após a competição para entender diferentes abordagens.",
        "c": "Copiar a solução de um competidor que já venceu para garantir um bom resultado.",
        "d": "Evitar interagir com outros participantes para não ser influenciado."
      },
      "correta": "b",
      "explicacao": "Estudar as soluções compartilhadas após a competição é uma maneira eficaz de aprender com as abordagens de outros e aprimorar suas habilidades.",
      "fonte": "pratica.kaggle"
    },
    {
      "id": "ia-av-13",
      "nivel": "avancado",
      "pergunta": "Ao construir um modelo de IA, você se depara com dados que podem violar a privacidade das pessoas. Qual deve ser sua abordagem?",
      "alternativas": {
        "a": "Utilizar os dados sem preocupações, pois são apenas números.",
        "b": "Remover dados identificáveis e garantir que a privacidade seja respeitada.",
        "c": "Compartilhar os dados abertamente para que outros também possam usá-los.",
        "d": "Ignorar a privacidade, já que o modelo não é para uso comercial."
      },
      "correta": "b",
      "explicacao": "Remover dados identificáveis e garantir a privacidade é essencial para respeitar os direitos das pessoas e evitar problemas legais.",
      "fonte": "pratica.etica"
    },
    {
      "id": "ia-av-14",
      "nivel": "avancado",
      "pergunta": "Você completou a trilha de IA e quer continuar evoluindo. Qual é a melhor maneira de escolher seu próximo passo?",
      "alternativas": {
        "a": "Escolher aleatoriamente um tópico que parece interessante.",
        "b": "Focar em aprender tudo de uma vez para não perder tempo.",
        "c": "Identificar a área que mais te atrai e se aprofundar nela.",
        "d": "Seguir as tendências do mercado sem considerar seu próprio interesse."
      },
      "correta": "c",
      "explicacao": "Identificar a área que mais te atrai e se aprofundar nela é fundamental para criar valor real e manter a motivação.",
      "fonte": "pratica.proximos"
    },
    {
      "id": "ia-av-15",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo um projeto de IA e precisa garantir que as decisões do modelo sejam transparentes. O que você deve fazer?",
      "alternativas": {
        "a": "Apresentar as respostas do modelo como verdades absolutas.",
        "b": "Explicar a origem das respostas e como o modelo chegou a elas.",
        "c": "Evitar detalhar o funcionamento do modelo para não confundir os usuários.",
        "d": "Focar apenas na funcionalidade, sem se preocupar com a transparência."
      },
      "correta": "b",
      "explicacao": "Explicar a origem das respostas e o funcionamento do modelo é essencial para garantir a transparência e a confiança dos usuários.",
      "fonte": "pratica.etica"
    }
  ]
};

export default pool;
