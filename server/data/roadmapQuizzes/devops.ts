// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool devops). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "devops",
  "questions": [
    {
      "id": "devops-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está em uma equipe de desenvolvimento e percebe que as entregas estão lentas. O que você deve priorizar para melhorar a situação?",
      "alternativas": {
        "a": "Implementar uma nova ferramenta de gerenciamento de projetos",
        "b": "Aumentar a colaboração entre desenvolvimento e operações",
        "c": "Contratar mais desenvolvedores para acelerar o trabalho",
        "d": "Focar apenas em testes manuais antes da entrega"
      },
      "correta": "b",
      "explicacao": "Aumentar a colaboração entre desenvolvimento e operações é fundamental para melhorar a velocidade e a qualidade das entregas, reduzindo conflitos e aumentando a responsabilidade compartilhada.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "devops-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você faz parte de uma equipe onde o desenvolvedor entrega o código e a operação apenas coloca em produção. Qual é o problema dessa abordagem?",
      "alternativas": {
        "a": "A operação não tem informações sobre o código",
        "b": "O desenvolvedor não se preocupa com a produção",
        "c": "Ambos os times não têm métricas de desempenho",
        "d": "Não há necessidade de testes automatizados"
      },
      "correta": "b",
      "explicacao": "O desenvolvedor não se preocupa com a produção, o que gera um conflito estrutural e pode resultar em problemas de estabilidade e lentidão para o usuário.",
      "fonte": "fundamentos.problema"
    },
    {
      "id": "devops-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está aprendendo sobre DevOps e deseja entender sua essência. Qual é o principal objetivo dessa cultura?",
      "alternativas": {
        "a": "Integrar ferramentas de automação",
        "b": "Entregar valor ao usuário de forma rápida e segura",
        "c": "Reduzir custos operacionais",
        "d": "Aumentar a quantidade de código entregue"
      },
      "correta": "b",
      "explicacao": "O principal objetivo do DevOps é entregar valor ao usuário de forma rápida e segura, unindo velocidade e qualidade.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "devops-ini-04",
      "nivel": "iniciante",
      "pergunta": "Sua equipe está implementando DevOps e deseja garantir que todos os membros compartilhem responsabilidades. O que você deve fazer?",
      "alternativas": {
        "a": "Criar silos entre desenvolvimento e operações",
        "b": "Focar apenas em automação de testes",
        "c": "Promover a colaboração entre todos os times envolvidos",
        "d": "Definir claramente as funções de cada membro da equipe"
      },
      "correta": "c",
      "explicacao": "Promover a colaboração entre todos os times envolvidos é essencial para compartilhar responsabilidades e derrubar o muro da confusão.",
      "fonte": "fundamentos.problema"
    },
    {
      "id": "devops-ini-05",
      "nivel": "iniciante",
      "pergunta": "Ao implementar DevOps, você percebe que muitas tarefas são repetitivas. O que é recomendado fazer?",
      "alternativas": {
        "a": "Delegar essas tarefas para estagiários",
        "b": "Automatizar essas tarefas",
        "c": "Realizar tudo manualmente para garantir qualidade",
        "d": "Ignorar essas tarefas, pois não são importantes"
      },
      "correta": "b",
      "explicacao": "Automatizar tarefas repetitivas é uma prática recomendada em DevOps, pois aumenta a eficiência e reduz erros humanos.",
      "fonte": "fundamentos.pilares"
    },
    {
      "id": "devops-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está avaliando a performance da sua equipe DevOps. Qual métrica é importante acompanhar para guiar melhorias?",
      "alternativas": {
        "a": "A quantidade de código escrito por dia",
        "b": "O tempo médio para se recuperar de uma falha",
        "c": "O número de reuniões realizadas",
        "d": "A quantidade de ferramentas utilizadas"
      },
      "correta": "b",
      "explicacao": "Acompanhar o tempo médio para se recuperar de uma falha é uma métrica importante que ajuda a guiar melhorias com base em dados reais.",
      "fonte": "fundamentos.pilares"
    },
    {
      "id": "devops-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você quer garantir que sua equipe de DevOps melhore continuamente. Qual abordagem deve ser adotada?",
      "alternativas": {
        "a": "Fazer grandes mudanças de uma só vez",
        "b": "Implementar pequenas melhorias ao longo do tempo",
        "c": "Evitar mudanças para não causar instabilidade",
        "d": "Focar apenas em feedbacks positivos"
      },
      "correta": "b",
      "explicacao": "Implementar pequenas melhorias ao longo do tempo é a abordagem recomendada para garantir a melhoria contínua em DevOps.",
      "fonte": "fundamentos.pilares"
    },
    {
      "id": "devops-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está em uma reunião e alguém sugere que a equipe deve apenas focar em ferramentas de DevOps. O que você deve lembrar?",
      "alternativas": {
        "a": "Ferramentas são mais importantes que a cultura",
        "b": "A cultura é fundamental e as ferramentas devem servir a ela",
        "c": "Apenas ferramentas novas garantem sucesso em DevOps",
        "d": "A cultura não tem impacto nas entregas"
      },
      "correta": "b",
      "explicacao": "A cultura é fundamental em DevOps, e as ferramentas devem servir a essa cultura, não o contrário.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "devops-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você percebe que a equipe de operações está sempre culpando os desenvolvedores pelos problemas. Como você pode ajudar a mudar essa dinâmica?",
      "alternativas": {
        "a": "Criar um sistema de culpabilização",
        "b": "Incentivar a responsabilidade compartilhada entre dev e ops",
        "c": "Fazer reuniões apenas com desenvolvedores",
        "d": "Evitar discussões sobre problemas"
      },
      "correta": "b",
      "explicacao": "Incentivar a responsabilidade compartilhada entre desenvolvimento e operações é crucial para derrubar o muro da confusão e melhorar a colaboração.",
      "fonte": "fundamentos.problema"
    },
    {
      "id": "devops-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você precisa automatizar uma tarefa repetitiva no Linux. O que você deve fazer?",
      "alternativas": {
        "a": "Repetir a tarefa manualmente sempre que necessário.",
        "b": "Escrever um script em Bash para automatizar a tarefa.",
        "c": "Criar um documento detalhando a tarefa para futuras referências.",
        "d": "Usar um software de terceiros para tentar automatizar."
      },
      "correta": "b",
      "explicacao": "Escrever um script em Bash permite automatizar tarefas repetitivas, economizando tempo e esforço.",
      "fonte": "bases.linux"
    },
    {
      "id": "devops-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você está trabalhando em um projeto e precisa fazer alterações sem afetar a versão principal do código. O que você deve fazer?",
      "alternativas": {
        "a": "Fazer alterações diretamente na versão principal do código.",
        "b": "Criar uma branch para suas alterações.",
        "c": "Compartilhar o código com um colega antes de fazer alterações.",
        "d": "Fazer um commit das alterações sem testar."
      },
      "correta": "b",
      "explicacao": "Criar uma branch permite que você trabalhe em suas alterações sem afetar a versão principal, garantindo segurança e organização.",
      "fonte": "bases.git"
    },
    {
      "id": "devops-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você precisa verificar quem pode acessar um arquivo no Linux. Qual comando você deve usar?",
      "alternativas": {
        "a": "ls -l para listar arquivos e suas permissões.",
        "b": "cp para copiar o arquivo e verificar as permissões.",
        "c": "mv para mover o arquivo e ver as permissões.",
        "d": "rm para remover o arquivo e verificar se você tem acesso."
      },
      "correta": "a",
      "explicacao": "O comando ls -l lista arquivos junto com suas permissões, permitindo verificar quem pode acessá-los.",
      "fonte": "bases.linux"
    },
    {
      "id": "devops-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você fez uma alteração no código e deseja integrá-la à versão principal. O que você deve fazer?",
      "alternativas": {
        "a": "Fazer um push diretamente para a branch principal.",
        "b": "Criar um pull request para integrar suas alterações.",
        "c": "Fazer um commit e esperar que alguém revise.",
        "d": "Apagar a branch e criar uma nova para evitar conflitos."
      },
      "correta": "b",
      "explicacao": "Criar um pull request permite que suas alterações sejam revisadas e aprovadas antes de serem integradas à versão principal, promovendo qualidade.",
      "fonte": "bases.git"
    },
    {
      "id": "devops-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você deseja entender como gerenciar processos no Linux. Qual comando você deve usar?",
      "alternativas": {
        "a": "cat para visualizar o conteúdo de um arquivo.",
        "b": "ps para listar os processos em execução.",
        "c": "echo para imprimir mensagens no terminal.",
        "d": "touch para criar novos arquivos."
      },
      "correta": "b",
      "explicacao": "O comando ps lista os processos em execução, ajudando a gerenciar e monitorar o que está ativo no sistema.",
      "fonte": "bases.linux"
    },
    {
      "id": "devops-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você quer garantir que suas alterações no Git sejam bem documentadas. O que você deve fazer?",
      "alternativas": {
        "a": "Fazer commits com mensagens vagas ou genéricas.",
        "b": "Escrever mensagens de commit claras e descritivas.",
        "c": "Fazer um commit sem mensagem para agilidade.",
        "d": "Criar um documento separado para anotar as alterações."
      },
      "correta": "b",
      "explicacao": "Mensagens de commit claras e descritivas ajudam a entender o histórico do projeto e facilitam a colaboração.",
      "fonte": "bases.git"
    },
    {
      "id": "devops-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo uma aplicação que precisa ser executada em diferentes ambientes. Qual a principal vantagem de usar Docker para empacotar sua aplicação?",
      "alternativas": {
        "a": "A aplicação sempre funcionará, independentemente das configurações do sistema operacional.",
        "b": "O Docker permite que você instale dependências diretamente no sistema operacional.",
        "c": "O Docker garante que a aplicação terá acesso a todos os recursos do servidor.",
        "d": "A aplicação será mais rápida em ambientes de produção."
      },
      "correta": "a",
      "explicacao": "O Docker empacota a aplicação com todas as suas dependências, garantindo que funcione da mesma forma em qualquer ambiente.",
      "fonte": "containers.docker"
    },
    {
      "id": "devops-int-02",
      "nivel": "intermediario",
      "pergunta": "Você precisa orquestrar uma aplicação que consiste em um servidor web e um banco de dados. Qual ferramenta você deve usar para facilitar esse processo?",
      "alternativas": {
        "a": "Docker CLI, para executar os containers individualmente.",
        "b": "Docker Compose, para definir e gerenciar todos os containers em um único arquivo.",
        "c": "Kubernetes, para gerenciar a escalabilidade dos containers.",
        "d": "Um script Bash, para automatizar a execução dos containers."
      },
      "correta": "b",
      "explicacao": "O Docker Compose permite descrever todos os containers em um único arquivo, facilitando a orquestração com um único comando.",
      "fonte": "containers.compose"
    },
    {
      "id": "devops-int-03",
      "nivel": "intermediario",
      "pergunta": "Ao construir uma imagem Docker, você percebe que ela está muito grande. O que você pode fazer para otimizar o tamanho da imagem?",
      "alternativas": {
        "a": "Adicionar mais dependências para garantir que tudo funcione.",
        "b": "Usar uma imagem base mais leve e remover arquivos desnecessários.",
        "c": "Incluir todos os arquivos do projeto na imagem para evitar problemas.",
        "d": "Executar a imagem em modo de produção para reduzir o tamanho."
      },
      "correta": "b",
      "explicacao": "Usar uma imagem base mais leve e remover arquivos desnecessários ajuda a manter a imagem pequena e eficiente.",
      "fonte": "containers.registry"
    },
    {
      "id": "devops-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está usando Docker Compose para desenvolver uma aplicação. Como o arquivo de configuração do Compose ajuda no processo de desenvolvimento?",
      "alternativas": {
        "a": "Ele permite que você suba a aplicação sem precisar de um banco de dados.",
        "b": "Ele documenta todas as dependências e configurações necessárias para rodar a aplicação.",
        "c": "Ele garante que a aplicação sempre funcione sem erros.",
        "d": "Ele permite que você execute os containers em paralelo."
      },
      "correta": "b",
      "explicacao": "O arquivo do Compose atua como documentação viva, descrevendo todas as peças necessárias para a aplicação rodar.",
      "fonte": "containers.compose"
    },
    {
      "id": "devops-int-05",
      "nivel": "intermediario",
      "pergunta": "Após construir uma imagem Docker, você precisa enviá-la para um servidor. Qual é o passo correto para fazer isso?",
      "alternativas": {
        "a": "Executar o comando 'docker run' no servidor para puxar a imagem.",
        "b": "Fazer um 'push' da imagem para um registry e depois 'pull' no servidor.",
        "c": "Copiar a imagem manualmente para o servidor via USB.",
        "d": "Executar o comando 'docker build' no servidor para criar a imagem."
      },
      "correta": "b",
      "explicacao": "Fazer um 'push' da imagem para um registry e depois 'pull' no servidor garante que a imagem correta seja utilizada.",
      "fonte": "containers.registry"
    },
    {
      "id": "devops-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está escrevendo um Dockerfile e precisa garantir que a aplicação sempre rode com a versão correta de uma dependência. O que você deve fazer?",
      "alternativas": {
        "a": "Usar a tag 'latest' para sempre pegar a versão mais recente.",
        "b": "Especificar a versão exata da dependência no Dockerfile.",
        "c": "Não se preocupar com versões, pois o Docker cuida disso.",
        "d": "Usar uma imagem base que já contém todas as dependências."
      },
      "correta": "b",
      "explicacao": "Especificar a versão exata da dependência no Dockerfile garante que a aplicação sempre use a versão correta.",
      "fonte": "containers.docker"
    },
    {
      "id": "devops-int-07",
      "nivel": "intermediario",
      "pergunta": "Você deseja compartilhar uma imagem Docker com sua equipe. Qual é a melhor prática para garantir que todos tenham acesso à mesma versão da imagem?",
      "alternativas": {
        "a": "Enviar a imagem por e-mail para cada membro da equipe.",
        "b": "Publicar a imagem em um registry com uma tag específica.",
        "c": "Pedir para cada membro da equipe construir a imagem localmente.",
        "d": "Usar uma imagem base padrão que todos já possuem."
      },
      "correta": "b",
      "explicacao": "Publicar a imagem em um registry com uma tag específica permite que todos acessem a mesma versão da imagem facilmente.",
      "fonte": "containers.registry"
    },
    {
      "id": "devops-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está utilizando Docker Compose e precisa garantir que os containers se conectem corretamente. O que você deve incluir no arquivo de configuração do Compose?",
      "alternativas": {
        "a": "As portas que cada container deve expor e as variáveis de ambiente.",
        "b": "A ordem em que os containers devem ser iniciados.",
        "c": "Os nomes dos containers que você deseja criar.",
        "d": "A quantidade de memória que cada container deve usar."
      },
      "correta": "a",
      "explicacao": "Incluir as portas e variáveis de ambiente no arquivo de configuração do Compose garante que os containers se conectem corretamente.",
      "fonte": "containers.compose"
    },
    {
      "id": "devops-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está configurando um pipeline de CI/CD no GitHub Actions. Após um push, qual etapa deve ser a primeira a ocorrer?",
      "alternativas": {
        "a": "Executar os testes automatizados",
        "b": "Construir a imagem Docker",
        "c": "Fazer o deploy em produção",
        "d": "Baixar o código em um ambiente limpo"
      },
      "correta": "d",
      "explicacao": "A primeira etapa deve ser baixar o código em um ambiente limpo para garantir que as verificações sejam feitas em um estado controlado.",
      "fonte": "cicd.pipeline"
    },
    {
      "id": "devops-int-10",
      "nivel": "intermediario",
      "pergunta": "Durante a construção do seu pipeline, você deseja garantir que mudanças quebradas não cheguem à produção. Qual abordagem você deve seguir?",
      "alternativas": {
        "a": "Realizar o deploy de todas as mudanças de uma vez",
        "b": "Integrar mudanças frequentemente e em pequenas quantidades",
        "c": "Fazer testes apenas após o deploy",
        "d": "Ignorar os testes se o código compilar"
      },
      "correta": "b",
      "explicacao": "Integrar mudanças frequentemente e em pequenas quantidades ajuda a identificar problemas rapidamente e reduz o risco de falhas em produção.",
      "fonte": "cicd.conceito"
    },
    {
      "id": "devops-int-11",
      "nivel": "intermediario",
      "pergunta": "Você precisa implementar uma estratégia de deploy que minimize o risco de impactar todos os usuários ao mesmo tempo. Qual estratégia você deve escolher?",
      "alternativas": {
        "a": "Deploy em massa para todos os usuários",
        "b": "Deploy gradual, liberando para uma fração dos usuários primeiro",
        "c": "Deploy sem testes",
        "d": "Deploy apenas fora do horário comercial"
      },
      "correta": "b",
      "explicacao": "O deploy gradual libera a mudança para uma fração pequena dos usuários, permitindo monitorar e reverter rapidamente se necessário.",
      "fonte": "cicd.deploy"
    },
    {
      "id": "devops-int-12",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um pipeline e quer que ele seja acionado sempre que houver um push. Qual configuração é essencial no seu arquivo YAML?",
      "alternativas": {
        "a": "on: pull_request",
        "b": "on: push",
        "c": "on: workflow_dispatch",
        "d": "on: schedule"
      },
      "correta": "b",
      "explicacao": "A configuração 'on: push' garante que o pipeline seja acionado automaticamente sempre que houver um push no repositório.",
      "fonte": "cicd.pipeline"
    },
    {
      "id": "devops-int-13",
      "nivel": "intermediario",
      "pergunta": "Ao implementar um rollback em seu processo de deploy, qual é a principal vantagem dessa prática?",
      "alternativas": {
        "a": "Evitar a necessidade de testes",
        "b": "Permitir voltar rapidamente à versão anterior em caso de falha",
        "c": "Reduzir a frequência de deploys",
        "d": "Aumentar o tempo de inatividade do sistema"
      },
      "correta": "b",
      "explicacao": "O rollback permite que você retorne rapidamente à versão anterior se algo der errado, aumentando a segurança do processo de deploy.",
      "fonte": "cicd.deploy"
    },
    {
      "id": "devops-int-14",
      "nivel": "intermediario",
      "pergunta": "Você deseja garantir que seu pipeline de CI/CD não permita que código quebrado seja integrado. Qual é a melhor prática a ser implementada?",
      "alternativas": {
        "a": "Executar testes automatizados após cada commit",
        "b": "Fazer testes apenas na versão final",
        "c": "Ignorar testes se o código estiver bem documentado",
        "d": "Realizar testes apenas em ambientes de produção"
      },
      "correta": "a",
      "explicacao": "Executar testes automatizados após cada commit ajuda a identificar problemas antes que o código chegue à produção, evitando falhas.",
      "fonte": "cicd.conceito"
    },
    {
      "id": "devops-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está configurando um pipeline e quer garantir que ele documente o que cada etapa faz. Qual é a melhor prática?",
      "alternativas": {
        "a": "Deixar as etapas sem explicação para simplificar",
        "b": "Adicionar comentários explicativos no arquivo YAML",
        "c": "Usar nomes de etapas genéricos",
        "d": "Não documentar, pois isso é desnecessário"
      },
      "correta": "b",
      "explicacao": "Adicionar comentários explicativos no arquivo YAML ajuda a entender o que cada etapa faz, facilitando a manutenção e a colaboração.",
      "fonte": "cicd.pipeline"
    },
    {
      "id": "devops-av-01",
      "nivel": "avancado",
      "pergunta": "Você precisa criar uma nova rede e um servidor usando Terraform. Qual comando você deve usar após declarar o estado desejado no arquivo de configuração?",
      "alternativas": {
        "a": "terraform init",
        "b": "terraform apply",
        "c": "terraform plan",
        "d": "terraform destroy"
      },
      "correta": "b",
      "explicacao": "O comando 'terraform apply' é utilizado para aplicar as mudanças declaradas no arquivo de configuração, criando a infraestrutura desejada.",
      "fonte": "iac.terraform"
    },
    {
      "id": "devops-av-02",
      "nivel": "avancado",
      "pergunta": "Você está utilizando Ansible para configurar servidores. Qual prática você deve seguir para garantir que a configuração seja aplicada corretamente em múltiplas execuções?",
      "alternativas": {
        "a": "Evitar usar variáveis para manter a configuração fixa",
        "b": "Usar sempre o mesmo arquivo de configuração sem alterações",
        "c": "Garantir que suas tarefas sejam idempotentes",
        "d": "Executar as configurações manualmente em cada servidor"
      },
      "correta": "c",
      "explicacao": "A idempotência garante que a aplicação da configuração repetidamente não cause efeitos colaterais, mantendo o estado desejado dos servidores.",
      "fonte": "iac.config"
    },
    {
      "id": "devops-av-03",
      "nivel": "avancado",
      "pergunta": "Ao usar Terraform, você deseja garantir que o estado da infraestrutura esteja sempre sincronizado com a configuração. Qual prática é recomendada para isso?",
      "alternativas": {
        "a": "Manter os arquivos de configuração apenas no ambiente local",
        "b": "Versionar os arquivos de configuração no Git",
        "c": "Criar a infraestrutura manualmente antes de usar o Terraform",
        "d": "Executar o Terraform apenas uma vez e não atualizar mais"
      },
      "correta": "b",
      "explicacao": "Versionar os arquivos de configuração no Git permite rastrear mudanças e garantir que o estado da infraestrutura esteja sempre alinhado com a configuração.",
      "fonte": "iac.terraform"
    },
    {
      "id": "devops-av-04",
      "nivel": "avancado",
      "pergunta": "Você está configurando um servidor com Ansible e deseja que o estado do servidor seja sempre o mesmo, independentemente de quantas vezes a configuração for aplicada. O que você deve garantir sobre suas tarefas?",
      "alternativas": {
        "a": "As tarefas devem ser escritas em um formato não legível",
        "b": "As tarefas devem ser executadas em ordem fixa",
        "c": "As tarefas devem ser independentes e não causarem efeitos colaterais",
        "d": "As tarefas devem ser aplicadas manualmente para garantir precisão"
      },
      "correta": "c",
      "explicacao": "As tarefas devem ser idempotentes e não causar efeitos colaterais, garantindo que o estado do servidor permaneça consistente em múltiplas aplicações.",
      "fonte": "iac.config"
    },
    {
      "id": "devops-av-05",
      "nivel": "avancado",
      "pergunta": "Você está implementando um serviço que precisa escalar rapidamente em resposta a picos de tráfego. Qual é a melhor abordagem para garantir que o serviço se recupere automaticamente de falhas?",
      "alternativas": {
        "a": "Usar um deployment para gerenciar as réplicas do serviço.",
        "b": "Criar um pod manualmente para cada instância do serviço.",
        "c": "Configurar um service para direcionar o tráfego para os pods.",
        "d": "Rodar o serviço em um único container sem gerenciamento de estado."
      },
      "correta": "a",
      "explicacao": "Um deployment é responsável por manter o número desejado de réplicas do serviço, garantindo que novas instâncias sejam criadas automaticamente em caso de falhas.",
      "fonte": "orquestracao.objetos"
    },
    {
      "id": "devops-av-06",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo uma aplicação que requer alta disponibilidade e precisa ser acessível por um nome fixo. Como você deve estruturar isso no Kubernetes?",
      "alternativas": {
        "a": "Criar um service que aponte para os pods da aplicação.",
        "b": "Usar o IP de um pod diretamente para acessá-lo.",
        "c": "Configurar um deployment sem um service associado.",
        "d": "Manter um registro DNS externo para cada pod."
      },
      "correta": "a",
      "explicacao": "Um service fornece um endereço fixo e estável que distribui o tráfego entre os pods, permitindo acesso consistente à aplicação.",
      "fonte": "orquestracao.objetos"
    },
    {
      "id": "devops-av-07",
      "nivel": "avancado",
      "pergunta": "Você está considerando usar Kubernetes para um projeto pequeno que consiste em um site estático. Qual é a decisão mais adequada?",
      "alternativas": {
        "a": "Usar Kubernetes, pois é a solução mais moderna.",
        "b": "Optar por uma solução mais simples, como Docker Compose.",
        "c": "Criar um cluster Kubernetes autogerenciado do zero.",
        "d": "Usar Kubernetes apenas para aprender, sem necessidade real."
      },
      "correta": "b",
      "explicacao": "Para um projeto pequeno, soluções como Docker Compose são mais adequadas e menos complexas do que Kubernetes.",
      "fonte": "orquestracao.pratica"
    },
    {
      "id": "devops-av-08",
      "nivel": "avancado",
      "pergunta": "Ao usar o kubectl, você precisa investigar um problema em um pod específico. Qual comando é o mais apropriado para obter detalhes sobre o estado atual desse pod?",
      "alternativas": {
        "a": "kubectl get pods",
        "b": "kubectl describe pod <nome-do-pod>",
        "c": "kubectl logs <nome-do-pod>",
        "d": "kubectl apply -f <manifesto.yaml>"
      },
      "correta": "b",
      "explicacao": "O comando 'kubectl describe pod <nome-do-pod>' fornece informações detalhadas sobre o estado e eventos do pod, ajudando na investigação de problemas.",
      "fonte": "orquestracao.pratica"
    },
    {
      "id": "devops-av-09",
      "nivel": "avancado",
      "pergunta": "Você precisa garantir que o Kubernetes mantenha um número específico de réplicas de uma aplicação. Qual objeto você deve usar para definir e controlar isso?",
      "alternativas": {
        "a": "Um pod, que é a menor unidade de execução.",
        "b": "Um service, que gerencia o tráfego entre os pods.",
        "c": "Um deployment, que gerencia as réplicas dos pods.",
        "d": "Um namespace, que organiza os recursos no cluster."
      },
      "correta": "c",
      "explicacao": "Um deployment é o objeto que permite declarar e manter um número desejado de réplicas de uma aplicação no Kubernetes.",
      "fonte": "orquestracao.objetos"
    },
    {
      "id": "devops-av-10",
      "nivel": "avancado",
      "pergunta": "Você está implementando um sistema que precisa de resiliência e escalabilidade em um ambiente de produção. Qual é a principal vantagem de usar Kubernetes nesse contexto?",
      "alternativas": {
        "a": "Ele simplifica a configuração de redes entre containers.",
        "b": "Ele automatiza a recuperação e escalonamento de containers.",
        "c": "Ele elimina a necessidade de monitoramento de containers.",
        "d": "Ele garante que todos os pods tenham IPs fixos."
      },
      "correta": "b",
      "explicacao": "Kubernetes automatiza a recuperação de containers falhos e permite o escalonamento dinâmico, garantindo resiliência e eficiência em ambientes de produção.",
      "fonte": "orquestracao.kubernetes"
    },
    {
      "id": "devops-av-11",
      "nivel": "avancado",
      "pergunta": "Você decidiu usar Kubernetes para um projeto que requer alta disponibilidade. Qual é a melhor prática ao configurar o cluster para garantir que ele opere de forma eficiente?",
      "alternativas": {
        "a": "Manter todos os pods em um único nó para simplificar a gestão.",
        "b": "Distribuir os pods em múltiplos nós para evitar pontos únicos de falha.",
        "c": "Criar um único deployment sem réplicas para reduzir a complexidade.",
        "d": "Usar um service sem especificar um tipo de acesso."
      },
      "correta": "b",
      "explicacao": "Distribuir os pods em múltiplos nós aumenta a resiliência do sistema, evitando que a falha de um único nó comprometa a disponibilidade da aplicação.",
      "fonte": "orquestracao.kubernetes"
    },
    {
      "id": "devops-av-12",
      "nivel": "avancado",
      "pergunta": "Você está monitorando um sistema e percebe um aumento inesperado na taxa de erros. O que você deve fazer para investigar a causa do problema?",
      "alternativas": {
        "a": "Verificar os logs para entender o que aconteceu e identificar a origem do erro.",
        "b": "Aumentar a capacidade do servidor para lidar com a carga sem investigar.",
        "c": "Ignorar os alertas e esperar que o problema se resolva sozinho.",
        "d": "Reiniciar o servidor sem analisar os dados disponíveis."
      },
      "correta": "a",
      "explicacao": "Verificar os logs é essencial para entender o que causou o aumento na taxa de erros e tomar ações corretivas.",
      "fonte": "observabilidade.monitoramento"
    },
    {
      "id": "devops-av-13",
      "nivel": "avancado",
      "pergunta": "Você precisa implementar um sistema de alertas para seu aplicativo. Qual abordagem você deve seguir para garantir que os alertas sejam úteis e não gerem excesso de notificações?",
      "alternativas": {
        "a": "Configurar alertas para todas as métricas disponíveis, assim você não perde nada.",
        "b": "Definir regras de alerta baseadas em métricas críticas que afetam a experiência do usuário.",
        "c": "Criar alertas apenas para eventos que já causaram problemas no passado.",
        "d": "Desconsiderar a frequência dos alertas e focar apenas na gravidade dos eventos."
      },
      "correta": "b",
      "explicacao": "Definir regras de alerta com base em métricas críticas ajuda a evitar sobrecarga de notificações e garante que você seja avisado sobre problemas relevantes.",
      "fonte": "observabilidade.monitoramento"
    },
    {
      "id": "devops-av-14",
      "nivel": "avancado",
      "pergunta": "Você está montando um portfólio para se candidatar a uma vaga em DevOps. Qual projeto seria mais adequado para demonstrar suas habilidades práticas?",
      "alternativas": {
        "a": "Um projeto simples de frontend sem integração com backend.",
        "b": "Um pipeline de CI/CD que automatiza testes e deploys de uma aplicação.",
        "c": "Um documento teórico sobre os conceitos de DevOps.",
        "d": "Um projeto de infraestrutura que não utiliza automação."
      },
      "correta": "b",
      "explicacao": "Um pipeline de CI/CD demonstra habilidades práticas em automação e integração, que são essenciais para a área de DevOps.",
      "fonte": "observabilidade.carreira"
    },
    {
      "id": "devops-av-15",
      "nivel": "avancado",
      "pergunta": "Você está considerando uma transição de carreira para DevOps. Qual experiência prévia pode ser mais valiosa para essa mudança?",
      "alternativas": {
        "a": "Experiência em desenvolvimento de software, especialmente em backend.",
        "b": "Experiência em design gráfico e criação de interfaces.",
        "c": "Experiência em vendas e atendimento ao cliente.",
        "d": "Experiência em marketing digital e redes sociais."
      },
      "correta": "a",
      "explicacao": "Experiência em desenvolvimento de software, especialmente em backend, é valiosa para entender como os sistemas são construídos e operados em DevOps.",
      "fonte": "observabilidade.carreira"
    }
  ]
};

export default pool;
