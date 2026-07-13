// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool sre). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "sre",
  "questions": [
    {
      "id": "sre-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está gerenciando um sistema que deve ser confiável. Qual abordagem do SRE você deve seguir para garantir que o sistema funcione de forma consistente?",
      "alternativas": {
        "a": "Medir a confiabilidade com números e definir metas explícitas.",
        "b": "Buscar 100% de disponibilidade para evitar falhas.",
        "c": "Focar em automação sem considerar a confiabilidade.",
        "d": "Aumentar a complexidade do sistema para garantir mais recursos."
      },
      "correta": "a",
      "explicacao": "Medir a confiabilidade e definir metas explícitas é fundamental para o SRE, pois permite gerenciar a confiabilidade de forma consciente e eficaz.",
      "fonte": "fundamentos.vsdevops"
    },
    {
      "id": "sre-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você precisa automatizar tarefas de operação em um sistema grande. Qual é a abordagem correta que um engenheiro de SRE deve adotar?",
      "alternativas": {
        "a": "Automatizar tudo que antes era feito manualmente por equipes de operações.",
        "b": "Focar apenas na programação e ignorar a operação.",
        "c": "Delegar totalmente a operação a uma equipe de suporte.",
        "d": "Usar ferramentas de monitoramento sem integração com o código."
      },
      "correta": "a",
      "explicacao": "A automação de tarefas manuais é um dos princípios centrais do SRE, garantindo eficiência e confiabilidade.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "sre-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está avaliando a confiabilidade de um serviço. Qual é a prática recomendada pelo SRE para gerenciar a confiabilidade?",
      "alternativas": {
        "a": "Definir um nível de confiabilidade adequado e gerenciar em torno dele.",
        "b": "Buscar sempre a perfeição, visando 100% de disponibilidade.",
        "c": "Ignorar o feedback dos usuários sobre a confiabilidade do serviço.",
        "d": "Aumentar a complexidade do sistema para garantir mais funcionalidades."
      },
      "correta": "a",
      "explicacao": "Definir um nível adequado de confiabilidade e gerenciar em torno dele é uma prática essencial do SRE, evitando custos desnecessários e promovendo inovação.",
      "fonte": "fundamentos.risco"
    },
    {
      "id": "sre-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está projetando um sistema em escala. Qual é a diferença fundamental entre SRE e DevOps que você deve considerar?",
      "alternativas": {
        "a": "SRE é uma implementação concreta e prescritiva da filosofia DevOps.",
        "b": "DevOps foca apenas em operações, enquanto SRE foca em desenvolvimento.",
        "c": "SRE não utiliza métricas para medir a confiabilidade.",
        "d": "DevOps é mais rigoroso em suas práticas do que SRE."
      },
      "correta": "a",
      "explicacao": "SRE é uma implementação concreta da filosofia DevOps, com práticas e métricas específicas para garantir a confiabilidade.",
      "fonte": "fundamentos.vsdevops"
    },
    {
      "id": "sre-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você precisa responder a um incidente em um sistema. Qual é a abordagem que um engenheiro de SRE deve seguir?",
      "alternativas": {
        "a": "Analisar o incidente e automatizar a resposta sempre que possível.",
        "b": "Ignorar o incidente e focar em novas funcionalidades.",
        "c": "Aguardar a equipe de suporte resolver o problema.",
        "d": "Documentar o incidente apenas se houver impacto financeiro."
      },
      "correta": "a",
      "explicacao": "Analisar e automatizar a resposta a incidentes é uma prática fundamental no SRE para melhorar a confiabilidade do sistema.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "sre-ini-06",
      "nivel": "iniciante",
      "pergunta": "Ao definir SLOs para um serviço, qual é a consideração mais importante que um engenheiro de SRE deve ter?",
      "alternativas": {
        "a": "Estabelecer um SLO que seja alcançável e que reflita a experiência do usuário.",
        "b": "Definir um SLO que garanta 100% de disponibilidade.",
        "c": "Criar SLOs complexos que sejam difíceis de medir.",
        "d": "Ignorar a opinião dos usuários ao definir SLOs."
      },
      "correta": "a",
      "explicacao": "Um SLO deve ser alcançável e refletir a experiência do usuário, garantindo que as metas sejam realistas e relevantes.",
      "fonte": "fundamentos.risco"
    },
    {
      "id": "sre-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está considerando a confiabilidade de um serviço. O que deve ser evitado para não comprometer a inovação?",
      "alternativas": {
        "a": "Buscar 100% de confiabilidade, pois isso impede mudanças.",
        "b": "Definir um orçamento de falhas para gerenciar riscos.",
        "c": "Permitir que o sistema tenha algumas falhas controladas.",
        "d": "Implementar mudanças rápidas sem avaliar o impacto."
      },
      "correta": "a",
      "explicacao": "Buscar 100% de confiabilidade pode impedir mudanças e inovações, o que é contraproducente para o SRE.",
      "fonte": "fundamentos.risco"
    },
    {
      "id": "sre-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está implementando práticas de SRE em sua equipe. Qual é a principal diferença que você deve comunicar entre SRE e DevOps?",
      "alternativas": {
        "a": "SRE é mais focado em métricas e confiabilidade do que DevOps.",
        "b": "DevOps não utiliza automação, enquanto SRE sempre automatiza.",
        "c": "SRE não se preocupa com a colaboração entre equipes.",
        "d": "DevOps é uma prática mais antiga que SRE."
      },
      "correta": "a",
      "explicacao": "A principal diferença é que SRE é mais focado em métricas e confiabilidade, enquanto DevOps é uma filosofia mais ampla.",
      "fonte": "fundamentos.vsdevops"
    },
    {
      "id": "sre-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você está em um projeto que exige alta disponibilidade. Qual é a abordagem correta para gerenciar a confiabilidade, segundo os princípios do SRE?",
      "alternativas": {
        "a": "Definir um nível de confiabilidade que seja adequado ao serviço.",
        "b": "Buscar sempre a perfeição em cada aspecto do sistema.",
        "c": "Desconsiderar o custo de manter a alta disponibilidade.",
        "d": "Focar apenas em manter o sistema funcionando, sem métricas."
      },
      "correta": "a",
      "explicacao": "Definir um nível adequado de confiabilidade é crucial para gerenciar recursos e garantir a operação do sistema.",
      "fonte": "fundamentos.risco"
    },
    {
      "id": "sre-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você está enfrentando um sistema lento e precisa diagnosticar o problema. Qual é o primeiro passo que você deve tomar?",
      "alternativas": {
        "a": "Verificar os logs do sistema para identificar erros",
        "b": "Reiniciar o servidor para ver se melhora",
        "c": "Aumentar os recursos do servidor sem investigar",
        "d": "Atualizar todos os pacotes do sistema imediatamente"
      },
      "correta": "a",
      "explicacao": "Verificar os logs do sistema é essencial para entender o que está acontecendo e identificar a causa raiz do problema.",
      "fonte": "bases.tecnica"
    },
    {
      "id": "sre-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você precisa automatizar uma tarefa repetitiva em um servidor Linux. Qual linguagem de programação você escolheria para isso?",
      "alternativas": {
        "a": "Java, por ser uma linguagem robusta",
        "b": "Python, por ser ótima para automação",
        "c": "C++, por permitir controle baixo nível",
        "d": "Ruby, por ser popular em scripts"
      },
      "correta": "b",
      "explicacao": "Python é amplamente utilizada para automação e scripts, tornando-a a escolha ideal para essa tarefa.",
      "fonte": "bases.tecnica"
    },
    {
      "id": "sre-ini-12",
      "nivel": "iniciante",
      "pergunta": "Ao trabalhar com containers, qual é a principal função do Kubernetes?",
      "alternativas": {
        "a": "Criar containers a partir de imagens",
        "b": "Gerenciar a orquestração de múltiplos containers",
        "c": "Aumentar a segurança dos containers",
        "d": "Monitorar o uso de CPU dos containers"
      },
      "correta": "b",
      "explicacao": "O Kubernetes é responsável por orquestrar e gerenciar múltiplos containers, garantindo sua operação em escala.",
      "fonte": "bases.k8s"
    },
    {
      "id": "sre-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está configurando um sistema que utiliza containers. Qual tecnologia você deve usar para empacotar sua aplicação?",
      "alternativas": {
        "a": "Kubernetes, para orquestração",
        "b": "Docker, para empacotamento de aplicações",
        "c": "Ansible, para automação de configurações",
        "d": "Terraform, para provisionamento de infraestrutura"
      },
      "correta": "b",
      "explicacao": "Docker é a tecnologia mais conhecida para empacotar aplicações em containers, permitindo que rodem em qualquer lugar.",
      "fonte": "bases.k8s"
    },
    {
      "id": "sre-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você precisa garantir que um serviço continue funcionando mesmo se um container falhar. O que o Kubernetes faz para ajudar nisso?",
      "alternativas": {
        "a": "Reinicia automaticamente o container que falhou",
        "b": "Desliga todos os containers para evitar sobrecarga",
        "c": "Notifica o desenvolvedor sobre a falha",
        "d": "Aumenta a capacidade do servidor automaticamente"
      },
      "correta": "a",
      "explicacao": "O Kubernetes reinicia automaticamente um container que falhou, garantindo a continuidade do serviço.",
      "fonte": "bases.k8s"
    },
    {
      "id": "sre-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você está vindo da área de desenvolvimento e quer se tornar um SRE. O que você deve focar para complementar suas habilidades?",
      "alternativas": {
        "a": "Aprimorar conhecimentos em programação apenas",
        "b": "Fortalecer a compreensão de infraestrutura e sistemas",
        "c": "Aprender mais sobre design de interfaces",
        "d": "Focar em linguagens de baixo nível como Assembly"
      },
      "correta": "b",
      "explicacao": "Como desenvolvedor, você já tem a programação, mas precisa fortalecer sua compreensão de infraestrutura e sistemas para se tornar um SRE.",
      "fonte": "bases.tecnica"
    },
    {
      "id": "sre-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está analisando a experiência do usuário em um serviço de streaming. Qual SLI você deve priorizar para entender se os usuários estão satisfeitos com a velocidade do serviço?",
      "alternativas": {
        "a": "A taxa de erros das requisições",
        "b": "A latência das requisições",
        "c": "O uso de CPU do servidor",
        "d": "O número de requisições por segundo"
      },
      "correta": "b",
      "explicacao": "A latência mede quanto tempo as requisições demoram, o que impacta diretamente na percepção de velocidade pelos usuários.",
      "fonte": "confiabilidade.sli"
    },
    {
      "id": "sre-int-02",
      "nivel": "intermediario",
      "pergunta": "Você precisa definir um SLO para um serviço de e-commerce. Qual das opções abaixo melhor traduz uma meta clara e mensurável para a disponibilidade do serviço?",
      "alternativas": {
        "a": "O sistema deve ser rápido e estável",
        "b": "99,9% das requisições devem ser bem-sucedidas em 30 dias",
        "c": "O serviço deve ter uma boa performance",
        "d": "O tempo de resposta deve ser aceitável para os usuários"
      },
      "correta": "b",
      "explicacao": "Um SLO deve ser uma meta explícita e mensurável, como '99,9% das requisições devem ser bem-sucedidas em 30 dias'.",
      "fonte": "confiabilidade.slo"
    },
    {
      "id": "sre-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está implementando um novo recurso em um serviço que tem um SLO de 99,5% de disponibilidade. Qual é o seu error budget para um período de 30 dias?",
      "alternativas": {
        "a": "Cerca de 15 minutos por mês",
        "b": "Cerca de 36 minutos por mês",
        "c": "Cerca de 43 minutos por mês",
        "d": "Cerca de 1 hora por mês"
      },
      "correta": "c",
      "explicacao": "O error budget é 0,5% de 30 dias, que equivale a cerca de 43 minutos por mês.",
      "fonte": "confiabilidade.errorbudget"
    },
    {
      "id": "sre-int-04",
      "nivel": "intermediario",
      "pergunta": "Ao medir a confiabilidade de um serviço, você percebe que a latência está alta, mas os usuários não estão reclamando. Qual é a abordagem correta para definir um SLI nesse caso?",
      "alternativas": {
        "a": "Medir a latência média das requisições",
        "b": "Focar em percentis para entender a experiência dos usuários mais afetados",
        "c": "Ignorar a latência, pois os usuários não se queixam",
        "d": "Aumentar a quantidade de requisições para melhorar a média"
      },
      "correta": "b",
      "explicacao": "Focar em percentis, como o 99, revela a experiência dos usuários mais prejudicados, que são os que reclamam.",
      "fonte": "confiabilidade.sli"
    },
    {
      "id": "sre-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está discutindo com sua equipe sobre a definição de um SLO. Qual é a melhor prática ao escolher a meta para esse SLO?",
      "alternativas": {
        "a": "Definir a meta o mais alta possível para garantir qualidade",
        "b": "Escolher uma meta que todos concordem e que reflita o que os usuários realmente precisam",
        "c": "Basear a meta em experiências passadas sem considerar o contexto atual",
        "d": "Estabelecer uma meta que seja fácil de alcançar para evitar pressão"
      },
      "correta": "b",
      "explicacao": "A escolha do SLO deve ser uma decisão compartilhada que reflita o que os usuários realmente precisam e o que o negócio pode sustentar.",
      "fonte": "confiabilidade.slo"
    },
    {
      "id": "sre-int-06",
      "nivel": "intermediario",
      "pergunta": "Você percebe que o error budget de um serviço está se esgotando rapidamente. Qual deve ser a prioridade da equipe nesse momento?",
      "alternativas": {
        "a": "Aumentar a frequência de lançamentos para corrigir problemas rapidamente",
        "b": "Parar lançamentos e focar em estabilizar o serviço",
        "c": "Continuar lançando novas funcionalidades, pois o SLO ainda não foi quebrado",
        "d": "Reduzir a equipe para cortar custos"
      },
      "correta": "b",
      "explicacao": "Quando o error budget se esgota, a prioridade deve ser estabilizar o serviço até que o orçamento se recomponha.",
      "fonte": "confiabilidade.errorbudget"
    },
    {
      "id": "sre-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está implementando um novo sistema de monitoramento e precisa escolher quais SLIs utilizar. Qual abordagem você deve evitar?",
      "alternativas": {
        "a": "Medir a disponibilidade com base nas requisições bem-sucedidas",
        "b": "Incluir métricas que não impactam a experiência do usuário",
        "c": "Focar na latência para entender a rapidez do serviço",
        "d": "Analisar a taxa de erros para identificar falhas"
      },
      "correta": "b",
      "explicacao": "Incluir métricas que não impactam a experiência do usuário não ajuda a medir a confiabilidade de forma eficaz.",
      "fonte": "confiabilidade.sli"
    },
    {
      "id": "sre-int-08",
      "nivel": "intermediario",
      "pergunta": "Você e sua equipe definiram um SLO de 95% de disponibilidade. O que isso significa em termos de error budget para um período de 30 dias?",
      "alternativas": {
        "a": "Você pode ter até 36 minutos de falhas por mês",
        "b": "Você pode ter até 1,5 horas de falhas por mês",
        "c": "Você pode ter até 30 minutos de falhas por mês",
        "d": "Você pode ter até 43 minutos de falhas por mês"
      },
      "correta": "a",
      "explicacao": "Um SLO de 95% significa que você aceita 5% de falhas, o que equivale a cerca de 36 minutos por mês.",
      "fonte": "confiabilidade.errorbudget"
    },
    {
      "id": "sre-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está monitorando um serviço e percebe que a latência aumentou. Qual métrica você deve observar para entender melhor o problema?",
      "alternativas": {
        "a": "A taxa de erros do serviço",
        "b": "O tráfego de requisições recebidas",
        "c": "O tempo médio das requisições bem-sucedidas",
        "d": "O uso de CPU do servidor"
      },
      "correta": "c",
      "explicacao": "Observar o tempo médio das requisições bem-sucedidas ajuda a entender a latência e a identificar se o problema está nas requisições que estão sendo processadas.",
      "fonte": "observabilidade.sinais"
    },
    {
      "id": "sre-int-10",
      "nivel": "intermediario",
      "pergunta": "Você precisa investigar um erro que ocorreu em um sistema. Qual abordagem é mais eficaz para descobrir o que aconteceu?",
      "alternativas": {
        "a": "Consultar as métricas de uso de recursos do sistema",
        "b": "Analisar os logs detalhados do sistema",
        "c": "Verificar a latência das requisições",
        "d": "Observar a taxa de tráfego do serviço"
      },
      "correta": "b",
      "explicacao": "Analisar os logs detalhados permite entender o que exatamente ocorreu no momento do erro, fornecendo informações cruciais para a investigação.",
      "fonte": "observabilidade.tres"
    },
    {
      "id": "sre-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está configurando um alerta para um serviço. Qual critério deve ser seguido para garantir que o alerta seja realmente útil?",
      "alternativas": {
        "a": "Alertar sobre qualquer erro que ocorra no sistema",
        "b": "Alerte apenas sobre problemas que afetam o usuário e exigem ação imediata",
        "c": "Criar alertas para todos os recursos que estão próximos do limite",
        "d": "Alerte quando a latência média ultrapassar um certo valor"
      },
      "correta": "b",
      "explicacao": "Alertar apenas sobre problemas que afetam o usuário e exigem ação imediata ajuda a evitar a fadiga de alertas e garante que a equipe se concentre no que realmente importa.",
      "fonte": "observabilidade.alertas"
    },
    {
      "id": "sre-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está utilizando Prometheus e Grafana para monitorar um serviço. Qual é a melhor prática ao criar um dashboard?",
      "alternativas": {
        "a": "Incluir o máximo de métricas possível para ter uma visão completa",
        "b": "Focar nos quatro sinais de ouro para monitorar a saúde do serviço",
        "c": "Mostrar apenas as métricas que não mudam com frequência",
        "d": "Organizar as métricas em ordem alfabética para facilitar a visualização"
      },
      "correta": "b",
      "explicacao": "Focar nos quatro sinais de ouro garante que o dashboard mostre as informações mais relevantes sobre a saúde do serviço, permitindo uma resposta rápida a problemas.",
      "fonte": "observabilidade.sinais"
    },
    {
      "id": "sre-int-13",
      "nivel": "intermediario",
      "pergunta": "Você notou que a equipe está recebendo muitos alertas irrelevantes. Qual é a melhor maneira de resolver esse problema?",
      "alternativas": {
        "a": "Reduzir o número de alertas configurados",
        "b": "Ajustar os critérios dos alertas para focar em sintomas que exigem ação",
        "c": "Aumentar a frequência dos alertas para garantir que não sejam perdidos",
        "d": "Criar um canal de comunicação para discutir todos os alertas"
      },
      "correta": "b",
      "explicacao": "Ajustar os critérios dos alertas para focar em sintomas que exigem ação ajuda a reduzir o ruído e a fadiga de alertas, tornando os alertas mais úteis.",
      "fonte": "observabilidade.alertas"
    },
    {
      "id": "sre-int-14",
      "nivel": "intermediario",
      "pergunta": "Você está implementando tracing em um sistema distribuído. O que é mais importante garantir durante essa implementação?",
      "alternativas": {
        "a": "Que o tracing registre apenas erros",
        "b": "Que todas as requisições sejam rastreadas com informações de tempo",
        "c": "Que o tracing seja feito apenas em serviços críticos",
        "d": "Que o tracing não impacte a performance do sistema"
      },
      "correta": "b",
      "explicacao": "Rastrear todas as requisições com informações de tempo é crucial para entender onde o tempo se perde e identificar problemas em sistemas distribuídos.",
      "fonte": "observabilidade.tres"
    },
    {
      "id": "sre-int-15",
      "nivel": "intermediario",
      "pergunta": "Você precisa entender por que apenas usuários de uma região específica estão enfrentando lentidão. Qual abordagem você deve tomar?",
      "alternativas": {
        "a": "Verificar as métricas de latência e comparar com outras regiões",
        "b": "Analisar os logs de erro para essa região",
        "c": "Consultar os dados de tráfego para a região afetada",
        "d": "Aumentar a capacidade do servidor para essa região"
      },
      "correta": "a",
      "explicacao": "Verificar as métricas de latência e compará-las com outras regiões pode ajudar a identificar se o problema é específico dessa região ou se está relacionado a outros fatores.",
      "fonte": "observabilidade.tres"
    },
    {
      "id": "sre-av-01",
      "nivel": "avancado",
      "pergunta": "Durante um incidente, você percebe que a comunicação está confusa e as pessoas estão agindo de forma desorganizada. Qual é a melhor abordagem para restaurar o serviço rapidamente?",
      "alternativas": {
        "a": "Definir papéis claros para a equipe e centralizar a comunicação.",
        "b": "Permitir que cada membro da equipe tome decisões independentes para acelerar a resposta.",
        "c": "Focar em investigar a causa raiz imediatamente para evitar futuros problemas.",
        "d": "Desligar todos os serviços afetados para tentar resolver o problema rapidamente."
      },
      "correta": "a",
      "explicacao": "Definir papéis claros e manter a comunicação centralizada ajuda a organizar a resposta e priorizar a restauração do serviço.",
      "fonte": "incidentes.resposta"
    },
    {
      "id": "sre-av-02",
      "nivel": "avancado",
      "pergunta": "Após resolver um incidente, você está preparando um post-mortem. Qual é a abordagem mais eficaz para garantir que a equipe aprenda com a falha?",
      "alternativas": {
        "a": "Focar nas ações individuais que levaram ao erro para responsabilizar os envolvidos.",
        "b": "Analisar as causas sistêmicas e evitar apontar culpados.",
        "c": "Registrar apenas as soluções implementadas, sem discutir o que deu errado.",
        "d": "Realizar o post-mortem em um ambiente formal, com todos os envolvidos sendo avaliados."
      },
      "correta": "b",
      "explicacao": "Analisar as causas sistêmicas sem culpar indivíduos promove um ambiente de aprendizado e transparência.",
      "fonte": "incidentes.postmortem"
    },
    {
      "id": "sre-av-03",
      "nivel": "avancado",
      "pergunta": "Você está em um plantão e recebe um alerta de falha no sistema. Qual é a primeira ação recomendada para lidar com essa situação?",
      "alternativas": {
        "a": "Investigar a causa do alerta antes de tomar qualquer ação.",
        "b": "Restaurar o serviço rapidamente, priorizando a mitigação do impacto no usuário.",
        "c": "Desligar o sistema afetado para evitar mais problemas.",
        "d": "Notificar a alta administração sobre o incidente imediatamente."
      },
      "correta": "b",
      "explicacao": "A prioridade deve ser restaurar o serviço e mitigar o impacto no usuário antes de investigar a causa.",
      "fonte": "incidentes.resposta"
    },
    {
      "id": "sre-av-04",
      "nivel": "avancado",
      "pergunta": "Após um incidente, você percebe que a equipe está relutante em compartilhar erros. Qual estratégia você deve implementar para melhorar a cultura de aprendizado na equipe?",
      "alternativas": {
        "a": "Estabelecer punições para quem comete erros.",
        "b": "Promover uma cultura de post-mortems sem culpa, focando em melhorias sistêmicas.",
        "c": "Realizar reuniões frequentes para criticar as decisões tomadas durante o incidente.",
        "d": "Evitar discutir os erros para não desmotivar a equipe."
      },
      "correta": "b",
      "explicacao": "Promover uma cultura sem culpa ajuda a criar um ambiente seguro onde as pessoas se sentem à vontade para relatar problemas e aprender com eles.",
      "fonte": "incidentes.postmortem"
    },
    {
      "id": "sre-av-05",
      "nivel": "avancado",
      "pergunta": "Durante a documentação de um post-mortem, é importante incluir ações concretas para evitar a repetição do incidente. Qual elemento é essencial para garantir que essas ações sejam implementadas?",
      "alternativas": {
        "a": "Atribuir responsáveis claros para cada ação identificada.",
        "b": "Listar ações genéricas que podem ser aplicadas a qualquer incidente.",
        "c": "Discutir as ações apenas com a alta administração.",
        "d": "Evitar mencionar ações que não foram implementadas anteriormente."
      },
      "correta": "a",
      "explicacao": "Atribuir responsáveis claros para as ações garante que haja um acompanhamento e responsabilidade na implementação das melhorias.",
      "fonte": "incidentes.postmortem"
    },
    {
      "id": "sre-av-06",
      "nivel": "avancado",
      "pergunta": "Você está enfrentando um aumento de carga em seu sistema e precisa garantir que ele continue funcionando. Qual abordagem você deve priorizar?",
      "alternativas": {
        "a": "Adicionar mais instâncias da aplicação para distribuir a carga.",
        "b": "Aumentar a capacidade da máquina atual para suportar mais usuários.",
        "c": "Limitar o número de usuários que podem acessar o sistema ao mesmo tempo.",
        "d": "Reduzir a qualidade do serviço para atender à demanda."
      },
      "correta": "a",
      "explicacao": "Adicionar mais instâncias permite escalar horizontalmente, o que é a abordagem recomendada para lidar com aumento de carga sem degradar o serviço.",
      "fonte": "automacao.resiliencia"
    },
    {
      "id": "sre-av-07",
      "nivel": "avancado",
      "pergunta": "Durante uma análise de falhas, você percebe que um componente crítico do seu sistema falhou, mas o sistema como um todo continuou funcionando. Qual técnica você provavelmente implementou para garantir isso?",
      "alternativas": {
        "a": "Redundância, com cópias do componente crítico em diferentes zonas de disponibilidade.",
        "b": "Degradação graciosa, onde o sistema oferece funcionalidades limitadas em caso de falha.",
        "c": "Contenção de falhas, evitando que a falha se espalhe para outros componentes.",
        "d": "Todas as anteriores."
      },
      "correta": "d",
      "explicacao": "Implementar redundância, degradação graciosa e contenção de falhas são técnicas que contribuem para a resiliência do sistema, permitindo que ele continue funcionando mesmo diante de falhas.",
      "fonte": "automacao.resiliencia"
    },
    {
      "id": "sre-av-08",
      "nivel": "avancado",
      "pergunta": "Você está repetindo uma tarefa manual que já fez várias vezes. O que você deve fazer para melhorar a eficiência da sua equipe?",
      "alternativas": {
        "a": "Investigar se a tarefa pode ser automatizada.",
        "b": "Continuar fazendo manualmente, pois é mais rápido do que parar para automatizar.",
        "c": "Delegar a tarefa para um colega da equipe.",
        "d": "Documentar o processo para que outros possam seguir."
      },
      "correta": "a",
      "explicacao": "A mentalidade do SRE é automatizar tarefas repetitivas para eliminar o toil e liberar tempo para trabalho mais significativo.",
      "fonte": "automacao.toil"
    },
    {
      "id": "sre-av-09",
      "nivel": "avancado",
      "pergunta": "Você está projetando um novo sistema e quer garantir que ele seja resiliente. Qual abordagem você deve considerar?",
      "alternativas": {
        "a": "Assumir que o sistema funcionará perfeitamente e não se preocupar com falhas.",
        "b": "Incluir redundância e caminhos alternativos para componentes críticos.",
        "c": "Focar apenas na escalabilidade, pois isso é mais importante.",
        "d": "Testar o sistema apenas após a implementação."
      },
      "correta": "b",
      "explicacao": "Incluir redundância e caminhos alternativos é fundamental para garantir que o sistema continue funcionando mesmo diante de falhas.",
      "fonte": "automacao.resiliencia"
    },
    {
      "id": "sre-av-10",
      "nivel": "avancado",
      "pergunta": "Você notou que sua equipe gasta muito tempo em tarefas repetitivas. Qual é a melhor prática recomendada para lidar com isso?",
      "alternativas": {
        "a": "Revisar as tarefas e identificar quais podem ser automatizadas.",
        "b": "Aumentar o número de membros da equipe para dividir as tarefas.",
        "c": "Criar um cronograma para que cada membro faça as tarefas em turnos.",
        "d": "Fazer uma reunião para discutir a carga de trabalho."
      },
      "correta": "a",
      "explicacao": "A melhor prática é revisar as tarefas e identificar oportunidades de automação, reduzindo o toil e melhorando a eficiência da equipe.",
      "fonte": "automacao.toil"
    },
    {
      "id": "sre-av-11",
      "nivel": "avancado",
      "pergunta": "Você está configurando um alerta em Grafana para monitorar a taxa de erros de uma aplicação. Qual abordagem você deve seguir para garantir que o alerta seja acionado por sintoma?",
      "alternativas": {
        "a": "Configure o alerta para disparar quando a latência média ultrapassar um limite definido.",
        "b": "Defina o alerta para ser acionado quando a taxa de erros subir acima de 5% em um intervalo de 5 minutos.",
        "c": "Crie um alerta que dispare sempre que o número total de requisições for menor que 100.",
        "d": "Estabeleça um alerta que acione um aviso quando o uso de CPU exceder 80%."
      },
      "correta": "b",
      "explicacao": "A alternativa correta é a que dispara o alerta baseado em um sintoma, que é a taxa de erros, refletindo a experiência do usuário.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "sre-av-12",
      "nivel": "avancado",
      "pergunta": "Durante a simulação de um incidente, você precisa documentar um postmortem. Qual informação é essencial incluir para garantir que o documento seja eficaz e sem culpa?",
      "alternativas": {
        "a": "Detalhes sobre quem foi o responsável pelo incidente e suas falhas.",
        "b": "Uma linha do tempo do incidente, incluindo ações tomadas e o uso do error budget.",
        "c": "A descrição técnica do sistema que falhou e suas limitações.",
        "d": "Um resumo das críticas recebidas pela equipe após o incidente."
      },
      "correta": "b",
      "explicacao": "Incluir uma linha do tempo e ações tomadas ajuda a entender o que ocorreu e evita atribuir culpa, focando na melhoria contínua.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "sre-av-13",
      "nivel": "avancado",
      "pergunta": "Você está definindo um SLO para uma aplicação. Qual dos seguintes SLIs melhor reflete a experiência do usuário e deve ser escolhido?",
      "alternativas": {
        "a": "Taxa de sucesso das requisições em comparação ao total de requisições realizadas.",
        "b": "Tempo de resposta médio das requisições processadas pela aplicação.",
        "c": "Quantidade de erros 500 registrados no sistema durante um mês.",
        "d": "Número total de requisições recebidas pela aplicação."
      },
      "correta": "b",
      "explicacao": "O tempo de resposta médio é um indicador direto da experiência do usuário, enquanto os outros não refletem diretamente a usabilidade.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "sre-av-14",
      "nivel": "avancado",
      "pergunta": "Ao entrar na carreira de SRE, qual é a base prévia mais recomendada para garantir uma transição bem-sucedida?",
      "alternativas": {
        "a": "Ter experiência em suporte técnico, lidando com problemas de usuários.",
        "b": "Possuir um conhecimento profundo em linguagens de programação, sem entender infraestrutura.",
        "c": "Ter uma sólida formação em desenvolvimento ou em infraestrutura/DevOps.",
        "d": "Focar apenas em certificações de ferramentas específicas de monitoramento."
      },
      "correta": "c",
      "explicacao": "Uma sólida formação em desenvolvimento ou infraestrutura/DevOps é essencial para entender tanto a programação quanto a operação, que são fundamentais para SRE.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "sre-av-15",
      "nivel": "avancado",
      "pergunta": "Qual das seguintes qualidades é considerada essencial para um SRE, especialmente em situações de crise?",
      "alternativas": {
        "a": "Habilidade em resolver problemas rapidamente, sem considerar o impacto a longo prazo.",
        "b": "Capacidade de manter a calma sob pressão e focar na resolução do incidente.",
        "c": "Tendência a evitar automação, preferindo processos manuais para controle.",
        "d": "Aptidão para criticar as decisões da equipe durante um incidente."
      },
      "correta": "b",
      "explicacao": "Manter a calma sob pressão é fundamental para a resposta a incidentes, permitindo uma análise clara e eficaz da situação.",
      "fonte": "carreira.entrar"
    }
  ]
};

export default pool;
