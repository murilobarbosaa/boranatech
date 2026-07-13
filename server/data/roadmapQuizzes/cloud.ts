// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool cloud). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "cloud",
  "questions": [
    {
      "id": "cloud-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você precisa de um servidor para um projeto temporário. O que você faz?",
      "alternativas": {
        "a": "Aluga um servidor na nuvem e desliga quando não precisar mais.",
        "b": "Compra um servidor físico e instala na sua empresa.",
        "c": "Usa um servidor de um amigo e espera que ele não tenha problemas.",
        "d": "Aluga um servidor e mantém ligado para garantir que não tenha problemas."
      },
      "correta": "a",
      "explicacao": "Alugar um servidor na nuvem permite que você desligue quando não precisar mais, evitando custos desnecessários.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "cloud-ini-02",
      "nivel": "iniciante",
      "pergunta": "Você quer desenvolver uma aplicação sem se preocupar com a infraestrutura. Qual modelo de nuvem você deve escolher?",
      "alternativas": {
        "a": "IaaS, para ter total controle sobre o servidor.",
        "b": "PaaS, onde o provedor cuida da infraestrutura.",
        "c": "SaaS, pois é mais simples e prático.",
        "d": "Um servidor físico, para garantir controle total."
      },
      "correta": "b",
      "explicacao": "O PaaS permite que você se concentre no desenvolvimento da aplicação, enquanto o provedor gerencia a infraestrutura.",
      "fonte": "fundamentos.modelos"
    },
    {
      "id": "cloud-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está aprendendo sobre provedores de nuvem e quer escolher um para focar. Qual é a melhor estratégia?",
      "alternativas": {
        "a": "Escolher um provedor e se aprofundar nele.",
        "b": "Experimentar todos os provedores ao mesmo tempo.",
        "c": "Focar apenas no provedor que seu amigo recomenda.",
        "d": "Escolher o provedor com a interface mais bonita."
      },
      "correta": "a",
      "explicacao": "Focar em um provedor permite que você aprenda os conceitos sem se distrair com diferenças de nomenclatura.",
      "fonte": "fundamentos.provedores"
    },
    {
      "id": "cloud-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você criou uma conta na nuvem e quer evitar surpresas na fatura. O que deve fazer primeiro?",
      "alternativas": {
        "a": "Configurar alertas de custo imediatamente.",
        "b": "Começar a criar recursos sem se preocupar com custos.",
        "c": "Desligar todos os recursos que você criou.",
        "d": "Aguardar um mês para ver como funciona a fatura."
      },
      "correta": "a",
      "explicacao": "Configurar alertas de custo ajuda a monitorar gastos e evita surpresas na fatura.",
      "fonte": "fundamentos.conta"
    },
    {
      "id": "cloud-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você precisa de um serviço de e-mail para sua equipe. Qual modelo de nuvem é mais adequado?",
      "alternativas": {
        "a": "IaaS, para ter controle total sobre o servidor de e-mail.",
        "b": "PaaS, para desenvolver sua própria aplicação de e-mail.",
        "c": "SaaS, para usar um serviço de e-mail pronto.",
        "d": "Um servidor físico, para garantir que tudo funcione corretamente."
      },
      "correta": "c",
      "explicacao": "O SaaS permite que você use um serviço de e-mail sem se preocupar com a infraestrutura subjacente.",
      "fonte": "fundamentos.modelos"
    },
    {
      "id": "cloud-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está testando serviços na nuvem e quer evitar custos. O que deve fazer com os recursos após o teste?",
      "alternativas": {
        "a": "Deixar os recursos ligados para evitar problemas.",
        "b": "Desligar ou remover os recursos após o teste.",
        "c": "Apenas ignorar os recursos, não há problema.",
        "d": "Criar novos recursos para testar mais funcionalidades."
      },
      "correta": "b",
      "explicacao": "Desligar ou remover os recursos após o teste evita cobranças indesejadas.",
      "fonte": "fundamentos.conta"
    },
    {
      "id": "cloud-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você quer escalar sua aplicação rapidamente. Qual modelo de nuvem oferece mais flexibilidade?",
      "alternativas": {
        "a": "IaaS, pois você controla toda a infraestrutura.",
        "b": "PaaS, que facilita a implementação da aplicação.",
        "c": "SaaS, que não permite escalabilidade.",
        "d": "Um servidor físico, que é mais confiável."
      },
      "correta": "a",
      "explicacao": "O IaaS oferece maior flexibilidade, permitindo que você ajuste a infraestrutura conforme necessário.",
      "fonte": "fundamentos.modelos"
    },
    {
      "id": "cloud-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está em uma empresa que já usa Microsoft. Qual provedor de nuvem pode ser mais vantajoso para você?",
      "alternativas": {
        "a": "AWS, pela quantidade de serviços.",
        "b": "Azure, por estar integrado ao ecossistema Microsoft.",
        "c": "Google Cloud, pela inovação em dados.",
        "d": "Qualquer um, pois todos são iguais."
      },
      "correta": "b",
      "explicacao": "O Azure é mais vantajoso para empresas que já utilizam o ecossistema Microsoft, oferecendo integração facilitada.",
      "fonte": "fundamentos.provedores"
    },
    {
      "id": "cloud-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você quer entender melhor os serviços de nuvem. Qual é a primeira coisa que deve fazer?",
      "alternativas": {
        "a": "Ler sobre todos os provedores ao mesmo tempo.",
        "b": "Escolher um provedor e explorar sua documentação.",
        "c": "Começar a criar recursos sem planejamento.",
        "d": "Focar apenas em um modelo de nuvem."
      },
      "correta": "b",
      "explicacao": "Escolher um provedor e explorar sua documentação ajuda a entender melhor os serviços disponíveis.",
      "fonte": "fundamentos.provedores"
    },
    {
      "id": "cloud-ini-10",
      "nivel": "iniciante",
      "pergunta": "Você deseja usar a camada gratuita de um provedor. O que deve ser feito para evitar cobranças?",
      "alternativas": {
        "a": "Criar recursos e deixá-los ligados.",
        "b": "Monitorar o uso e desligar recursos quando necessário.",
        "c": "Ignorar os limites da camada gratuita.",
        "d": "Usar todos os serviços disponíveis sem preocupação."
      },
      "correta": "b",
      "explicacao": "Monitorar o uso e desligar recursos evita que você ultrapasse os limites da camada gratuita e gere cobranças.",
      "fonte": "fundamentos.conta"
    },
    {
      "id": "cloud-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você precisa acessar um servidor na nuvem que não possui interface gráfica. Qual ferramenta você deve usar para se conectar a ele?",
      "alternativas": {
        "a": "SSH",
        "b": "FTP",
        "c": "HTTP",
        "d": "Telnet"
      },
      "correta": "a",
      "explicacao": "O SSH é a ferramenta recomendada para acesso remoto seguro a servidores sem interface gráfica, permitindo que você se conecte e administre o servidor via terminal.",
      "fonte": "bases.linux"
    },
    {
      "id": "cloud-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você está configurando uma rede virtual privada na nuvem e precisa garantir que apenas um servidor web esteja acessível pela internet. O que você deve fazer?",
      "alternativas": {
        "a": "Liberar todas as portas do firewall",
        "b": "Configurar a sub-rede para permitir acesso apenas à porta 80",
        "c": "Deixar o banco de dados acessível pela internet",
        "d": "Criar uma sub-rede pública para todos os servidores"
      },
      "correta": "b",
      "explicacao": "Liberar apenas a porta 80 na sub-rede garante que somente o servidor web esteja acessível, mantendo a segurança dos outros recursos.",
      "fonte": "bases.redes"
    },
    {
      "id": "cloud-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você quer listar os arquivos em um diretório no Linux. Qual comando você deve usar?",
      "alternativas": {
        "a": "ls -a",
        "b": "dir",
        "c": "list",
        "d": "show"
      },
      "correta": "a",
      "explicacao": "O comando 'ls -a' é o correto para listar arquivos em um diretório no Linux, mostrando todos os arquivos, incluindo os ocultos.",
      "fonte": "bases.linux"
    },
    {
      "id": "cloud-ini-14",
      "nivel": "iniciante",
      "pergunta": "Ao criar uma rede virtual, qual é a prática recomendada para a segurança dos bancos de dados?",
      "alternativas": {
        "a": "Colocá-los em uma sub-rede pública",
        "b": "Deixá-los acessíveis pela internet",
        "c": "Mantê-los em sub-redes privadas",
        "d": "Não usar firewalls"
      },
      "correta": "c",
      "explicacao": "Manter bancos de dados em sub-redes privadas é a prática recomendada, pois isso limita o acesso direto e aumenta a segurança.",
      "fonte": "bases.redes"
    },
    {
      "id": "cloud-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você está aprendendo a usar o terminal Linux e deseja editar um arquivo de texto. Qual comando você deve utilizar?",
      "alternativas": {
        "a": "edit",
        "b": "nano",
        "c": "write",
        "d": "open"
      },
      "correta": "b",
      "explicacao": "O comando 'nano' é uma ferramenta comum para editar arquivos de texto no terminal Linux, permitindo modificações diretas.",
      "fonte": "bases.linux"
    },
    {
      "id": "cloud-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está criando uma aplicação que precisa de alta disponibilidade. Qual é a melhor prática ao escolher regiões e zonas?",
      "alternativas": {
        "a": "Distribuir os recursos em mais de uma zona de disponibilidade na mesma região.",
        "b": "Criar todos os recursos em uma única zona para simplificar a gestão.",
        "c": "Escolher regiões diferentes para minimizar custos, mesmo que isso aumente a latência.",
        "d": "Utilizar uma única região para garantir que todos os dados estejam em um só lugar."
      },
      "correta": "a",
      "explicacao": "Distribuir os recursos em mais de uma zona de disponibilidade garante que a aplicação continue no ar mesmo se um data center falhar, aumentando a resiliência.",
      "fonte": "computacao.regioes"
    },
    {
      "id": "cloud-int-02",
      "nivel": "intermediario",
      "pergunta": "Você precisa armazenar imagens e documentos para um site. Qual é a melhor abordagem para garantir segurança e eficiência?",
      "alternativas": {
        "a": "Armazenar os arquivos em um bucket público para fácil acesso.",
        "b": "Criar buckets privados e definir permissões específicas para os arquivos que devem ser públicos.",
        "c": "Armazenar todos os arquivos em um servidor virtual para controle total.",
        "d": "Utilizar um bucket privado, mas deixar todos os arquivos abertos para facilitar o acesso."
      },
      "correta": "b",
      "explicacao": "Criar buckets privados e definir permissões específicas ajuda a evitar vazamentos de dados, garantindo que apenas os arquivos necessários sejam acessíveis publicamente.",
      "fonte": "computacao.armazenamento"
    },
    {
      "id": "cloud-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está configurando um servidor virtual e precisa garantir que não terá custos desnecessários. O que você deve fazer?",
      "alternativas": {
        "a": "Deixar o servidor ligado enquanto testa para evitar perda de progresso.",
        "b": "Desligar ou remover o servidor após o uso para não acumular custos.",
        "c": "Criar o servidor em uma região mais barata, mesmo que não seja a mais próxima dos usuários.",
        "d": "Aumentar o tamanho do servidor para garantir mais recursos, mesmo sem necessidade."
      },
      "correta": "b",
      "explicacao": "Desligar ou remover o servidor após o uso evita cobranças desnecessárias, já que o servidor virtual cobra enquanto está ligado.",
      "fonte": "computacao.vm"
    },
    {
      "id": "cloud-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um site estático e precisa escolher um método de armazenamento. Qual é a melhor opção?",
      "alternativas": {
        "a": "Utilizar armazenamento de objetos para hospedar os arquivos do site.",
        "b": "Armazenar os arquivos em um disco rígido local e fazer upload quando necessário.",
        "c": "Criar um servidor virtual para armazenar os arquivos do site.",
        "d": "Utilizar um bucket público para que todos possam acessar os arquivos facilmente."
      },
      "correta": "a",
      "explicacao": "O armazenamento de objetos é ideal para hospedar sites estáticos, pois permite acesso fácil e escalabilidade, além de ser mais econômico.",
      "fonte": "computacao.armazenamento"
    },
    {
      "id": "cloud-int-05",
      "nivel": "intermediario",
      "pergunta": "Ao escolher uma região para seu servidor virtual, qual fator deve ser considerado para melhorar a performance?",
      "alternativas": {
        "a": "A proximidade da região em relação aos seus usuários finais.",
        "b": "Escolher a região com o menor custo, independentemente da localização dos usuários.",
        "c": "Optar pela região que oferece mais zonas de disponibilidade, mesmo que distante dos usuários.",
        "d": "Selecionar a região com mais recursos disponíveis, sem considerar a latência."
      },
      "correta": "a",
      "explicacao": "A proximidade da região em relação aos usuários finais reduz a latência, melhorando a performance da aplicação.",
      "fonte": "computacao.regioes"
    },
    {
      "id": "cloud-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está gerenciando dados sensíveis e precisa garantir a conformidade com as leis de proteção de dados. O que deve ser feito?",
      "alternativas": {
        "a": "Armazenar os dados em qualquer região, desde que o custo seja baixo.",
        "b": "Escolher uma região que atenda às exigências legais de proteção de dados.",
        "c": "Utilizar zonas de disponibilidade em diferentes regiões para dispersar os dados.",
        "d": "Armazenar todos os dados em um único bucket público para facilitar o acesso."
      },
      "correta": "b",
      "explicacao": "Escolher uma região que atenda às exigências legais de proteção de dados é crucial para garantir a conformidade e a segurança das informações.",
      "fonte": "computacao.regioes"
    },
    {
      "id": "cloud-int-07",
      "nivel": "intermediario",
      "pergunta": "Você precisa de um servidor virtual para rodar uma aplicação. Qual configuração deve ser priorizada?",
      "alternativas": {
        "a": "Escolher um tamanho de servidor que atenda às necessidades da aplicação, sem exageros.",
        "b": "Selecionar o maior tamanho disponível para garantir desempenho máximo.",
        "c": "Criar o servidor em uma região distante para reduzir custos.",
        "d": "Ignorar as regras de rede e firewall para simplificar a configuração."
      },
      "correta": "a",
      "explicacao": "Escolher um tamanho de servidor que atenda às necessidades da aplicação garante eficiência e evita custos desnecessários.",
      "fonte": "computacao.vm"
    },
    {
      "id": "cloud-int-08",
      "nivel": "intermediario",
      "pergunta": "Você deseja compartilhar um arquivo específico de um bucket de armazenamento de objetos. Qual é a melhor prática?",
      "alternativas": {
        "a": "Tornar o bucket inteiro público para facilitar o acesso ao arquivo.",
        "b": "Definir permissões específicas para o arquivo que deseja compartilhar.",
        "c": "Criar cópias do arquivo em diferentes buckets públicos.",
        "d": "Deixar o arquivo em um bucket privado e enviar por e-mail para quem precisa."
      },
      "correta": "b",
      "explicacao": "Definir permissões específicas para o arquivo garante que apenas as pessoas autorizadas tenham acesso, mantendo a segurança dos dados.",
      "fonte": "computacao.armazenamento"
    },
    {
      "id": "cloud-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está configurando um novo serviço na nuvem e precisa garantir que um usuário específico tenha acesso apenas ao que é necessário. Qual abordagem você deve seguir?",
      "alternativas": {
        "a": "Criar um papel com permissões específicas e atribuí-lo ao usuário.",
        "b": "Dar ao usuário acesso total para evitar problemas futuros.",
        "c": "Criar uma identidade com todas as permissões disponíveis.",
        "d": "Atribuir permissões amplas para facilitar o trabalho."
      },
      "correta": "a",
      "explicacao": "A melhor prática é usar o princípio do menor privilégio, criando um papel com as permissões específicas que o usuário precisa.",
      "fonte": "identidade.iam"
    },
    {
      "id": "cloud-int-10",
      "nivel": "intermediario",
      "pergunta": "Você precisa expor um servidor web à internet, mas deseja manter a segurança do banco de dados. Qual configuração de rede deve ser feita?",
      "alternativas": {
        "a": "Colocar o banco de dados na sub-rede pública junto com o servidor web.",
        "b": "Criar uma sub-rede privada para o banco de dados e uma sub-rede pública para o servidor web.",
        "c": "Colocar o banco de dados na mesma sub-rede do servidor web para facilitar o acesso.",
        "d": "Expor o banco de dados diretamente à internet para evitar latência."
      },
      "correta": "b",
      "explicacao": "A configuração correta é manter o banco de dados na sub-rede privada, garantindo que ele não fique exposto à internet.",
      "fonte": "identidade.rede"
    },
    {
      "id": "cloud-int-11",
      "nivel": "intermediario",
      "pergunta": "Você está implementando um novo sistema na nuvem e precisa garantir a segurança dos dados. O que você deve considerar em relação à responsabilidade compartilhada?",
      "alternativas": {
        "a": "A segurança dos dados é completamente responsabilidade do provedor.",
        "b": "Você deve configurar corretamente os recursos e gerenciar acessos.",
        "c": "O provedor é responsável por todas as configurações de segurança.",
        "d": "A segurança na nuvem não é uma preocupação, pois tudo é seguro."
      },
      "correta": "b",
      "explicacao": "Na nuvem, você é responsável por como configura seus recursos e quem tem acesso a eles, enquanto o provedor cuida da segurança da infraestrutura.",
      "fonte": "identidade.responsabilidade"
    },
    {
      "id": "cloud-int-12",
      "nivel": "intermediario",
      "pergunta": "Ao criar uma política de acesso para um serviço na nuvem, qual é a prática recomendada para garantir segurança?",
      "alternativas": {
        "a": "Definir permissões amplas para evitar problemas de acesso.",
        "b": "Usar autenticação de múltiplos fatores para a conta principal.",
        "c": "Criar uma política que permita acesso irrestrito a todos os recursos.",
        "d": "Delegar todas as permissões a um único usuário para simplificar a gestão."
      },
      "correta": "b",
      "explicacao": "A autenticação de múltiplos fatores para a conta principal é uma prática recomendada para aumentar a segurança da conta.",
      "fonte": "identidade.iam"
    },
    {
      "id": "cloud-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está revisando as configurações de rede de uma aplicação na nuvem. Qual é a maneira correta de proteger seu banco de dados?",
      "alternativas": {
        "a": "Colocar o banco de dados na sub-rede pública para facilitar o acesso.",
        "b": "Acessar o banco de dados diretamente da internet para evitar latência.",
        "c": "Isolar o banco de dados em uma sub-rede privada sem acesso externo.",
        "d": "Permitir acesso ao banco de dados a partir de qualquer IP."
      },
      "correta": "c",
      "explicacao": "O banco de dados deve ser isolado em uma sub-rede privada, sem acesso direto da internet, para garantir sua proteção.",
      "fonte": "identidade.rede"
    },
    {
      "id": "cloud-int-14",
      "nivel": "intermediario",
      "pergunta": "Você recebeu um alerta de que um de seus buckets de armazenamento está público. O que você deve fazer imediatamente?",
      "alternativas": {
        "a": "Deixar o bucket público para facilitar o acesso.",
        "b": "Reverter a configuração e torná-lo privado para proteger os dados.",
        "c": "Adicionar mais permissões ao bucket para garantir que ele funcione corretamente.",
        "d": "Ignorar o alerta, pois buckets públicos são comuns."
      },
      "correta": "b",
      "explicacao": "A ação correta é reverter a configuração do bucket para privado, garantindo a segurança dos dados armazenados.",
      "fonte": "identidade.responsabilidade"
    },
    {
      "id": "cloud-int-15",
      "nivel": "intermediario",
      "pergunta": "Qual é a melhor prática ao atribuir permissões a um serviço na nuvem?",
      "alternativas": {
        "a": "Atribuir permissões mínimas necessárias para o funcionamento do serviço.",
        "b": "Dar permissões máximas para evitar problemas de acesso.",
        "c": "Atribuir permissões de forma aleatória para facilitar a configuração.",
        "d": "Manter todas as permissões abertas para facilitar o gerenciamento."
      },
      "correta": "a",
      "explicacao": "A melhor prática é atribuir apenas as permissões mínimas necessárias, seguindo o princípio do menor privilégio.",
      "fonte": "identidade.iam"
    },
    {
      "id": "cloud-av-01",
      "nivel": "avancado",
      "pergunta": "Você precisa implementar um banco de dados para um novo projeto, mas quer evitar a complexidade de gerenciá-lo. O que você deve fazer?",
      "alternativas": {
        "a": "Instalar um banco de dados em um servidor virtual e gerenciá-lo manualmente.",
        "b": "Contratar um banco de dados gerenciado que cuida da instalação e manutenção.",
        "c": "Usar um banco de dados local em sua máquina para desenvolvimento e depois migrar.",
        "d": "Criar scripts de backup e segurança para um banco de dados auto-hospedado."
      },
      "correta": "b",
      "explicacao": "Contratar um banco de dados gerenciado é a melhor opção, pois o provedor cuida da instalação, manutenção e segurança, permitindo que você se concentre no uso do banco.",
      "fonte": "servicos.bancos"
    },
    {
      "id": "cloud-av-02",
      "nivel": "avancado",
      "pergunta": "Você desenvolveu uma função que precisa ser executada em resposta a eventos, mas não quer se preocupar com a infraestrutura. Qual abordagem você deve escolher?",
      "alternativas": {
        "a": "Criar uma instância de servidor dedicada para rodar a função.",
        "b": "Utilizar um serviço serverless que execute a função sob demanda.",
        "c": "Rodar a função localmente e enviar os resultados para a nuvem.",
        "d": "Configurar um servidor virtual para executar a função em intervalos regulares."
      },
      "correta": "b",
      "explicacao": "Utilizar um serviço serverless é a melhor escolha, pois ele executa a função sob demanda e você não precisa gerenciar a infraestrutura.",
      "fonte": "servicos.serverless"
    },
    {
      "id": "cloud-av-03",
      "nivel": "avancado",
      "pergunta": "Você está gerenciando múltiplas aplicações em containers e precisa garantir que elas escalem automaticamente. Qual é a melhor solução?",
      "alternativas": {
        "a": "Gerenciar manualmente cada container em um servidor virtual.",
        "b": "Usar um orquestrador como Kubernetes gerenciado para automatizar a escalabilidade.",
        "c": "Executar todos os containers em uma única instância de servidor.",
        "d": "Criar scripts para escalar containers manualmente quando necessário."
      },
      "correta": "b",
      "explicacao": "Usar um orquestrador como Kubernetes gerenciado é a melhor solução, pois ele automatiza a escalabilidade e gerenciamento dos containers.",
      "fonte": "servicos.containers"
    },
    {
      "id": "cloud-av-04",
      "nivel": "avancado",
      "pergunta": "Você precisa garantir que seu banco de dados gerenciado esteja sempre disponível e seguro. O que você deve verificar?",
      "alternativas": {
        "a": "Se o provedor realiza backups automáticos e atualizações de segurança.",
        "b": "Se você pode acessar o banco de dados diretamente pela internet.",
        "c": "Se é possível instalar plugins de terceiros no banco gerenciado.",
        "d": "Se o banco de dados é configurável para rodar em um servidor local."
      },
      "correta": "a",
      "explicacao": "Verificar se o provedor realiza backups automáticos e atualizações de segurança é crucial para garantir a disponibilidade e segurança do banco de dados gerenciado.",
      "fonte": "servicos.bancos"
    },
    {
      "id": "cloud-av-05",
      "nivel": "avancado",
      "pergunta": "Você está criando uma aplicação que deve responder rapidamente a eventos. Qual abordagem serverless você deve considerar?",
      "alternativas": {
        "a": "Criar uma função que execute em um servidor dedicado.",
        "b": "Implementar uma função que seja acionada por eventos específicos, como uploads de arquivos.",
        "c": "Utilizar um banco de dados para armazenar as funções e chamá-las quando necessário.",
        "d": "Configurar um servidor virtual para monitorar e executar funções manualmente."
      },
      "correta": "b",
      "explicacao": "Implementar uma função que seja acionada por eventos específicos é a abordagem serverless ideal, pois permite que a função responda rapidamente sem gerenciamento de servidores.",
      "fonte": "servicos.serverless"
    },
    {
      "id": "cloud-av-06",
      "nivel": "avancado",
      "pergunta": "Você precisa garantir que sua infraestrutura na nuvem seja reproduzível e versionada. Qual abordagem você deve utilizar?",
      "alternativas": {
        "a": "Criar e gerenciar recursos manualmente no painel do provedor.",
        "b": "Descrever a infraestrutura em arquivos de texto e versioná-los no Git.",
        "c": "Utilizar ferramentas nativas de cada provedor para gerenciar a infraestrutura.",
        "d": "Fazer backups manuais da infraestrutura a cada alteração."
      },
      "correta": "b",
      "explicacao": "A abordagem correta é descrever a infraestrutura em arquivos de texto e versioná-los no Git, pois isso garante reprodutibilidade e controle de versões.",
      "fonte": "automacao.iac"
    },
    {
      "id": "cloud-av-07",
      "nivel": "avancado",
      "pergunta": "Você está configurando um pipeline de CI/CD e quer garantir que todas as alterações no código sejam testadas automaticamente antes de serem publicadas. O que você deve implementar?",
      "alternativas": {
        "a": "Configurar um script local para testar o código antes do envio.",
        "b": "Implementar a entrega contínua sem testes automáticos.",
        "c": "Criar um fluxo de integração contínua que execute testes a cada envio de código.",
        "d": "Publicar o código diretamente na nuvem sem verificações."
      },
      "correta": "c",
      "explicacao": "A implementação de um fluxo de integração contínua que execute testes a cada envio de código é essencial para detectar problemas antes de chegarem à produção.",
      "fonte": "automacao.cicd"
    },
    {
      "id": "cloud-av-08",
      "nivel": "avancado",
      "pergunta": "Você notou que os custos da sua infraestrutura na nuvem estão aumentando sem explicação. Qual é a primeira ação que você deve tomar?",
      "alternativas": {
        "a": "Desligar todos os recursos e esperar um mês para ver o que acontece.",
        "b": "Configurar alertas de orçamento para monitorar gastos.",
        "c": "Aumentar o limite de gastos sem monitorar.",
        "d": "Ignorar os custos e focar apenas no desempenho."
      },
      "correta": "b",
      "explicacao": "Configurar alertas de orçamento é a primeira ação recomendada para monitorar e controlar os gastos na nuvem.",
      "fonte": "automacao.custos"
    },
    {
      "id": "cloud-av-09",
      "nivel": "avancado",
      "pergunta": "Você está implementando infraestrutura como código com Terraform. Qual é a melhor prática para garantir que suas alterações não quebrem o ambiente?",
      "alternativas": {
        "a": "Fazer alterações diretamente no painel do provedor para evitar conflitos.",
        "b": "Testar as alterações em um ambiente separado antes de aplicar.",
        "c": "Aplicar as alterações diretamente no ambiente de produção.",
        "d": "Documentar as alterações em um arquivo separado."
      },
      "correta": "b",
      "explicacao": "Testar as alterações em um ambiente separado antes de aplicar é a melhor prática para evitar quebras no ambiente de produção.",
      "fonte": "automacao.iac"
    },
    {
      "id": "cloud-av-10",
      "nivel": "avancado",
      "pergunta": "Você deseja ser notificado automaticamente quando um servidor na nuvem estiver sobrecarregado. O que você deve configurar?",
      "alternativas": {
        "a": "Monitorar manualmente o uso do servidor a cada dia.",
        "b": "Criar alertas para condições anômalas, como alta utilização de CPU.",
        "c": "Desligar o servidor quando a carga estiver alta.",
        "d": "Aumentar a capacidade do servidor sem monitoramento."
      },
      "correta": "b",
      "explicacao": "Criar alertas para condições anômalas, como alta utilização de CPU, é a prática recomendada para ser notificado automaticamente e agir antes que o usuário perceba.",
      "fonte": "automacao.custos"
    },
    {
      "id": "cloud-av-11",
      "nivel": "avancado",
      "pergunta": "Você está se preparando para uma entrevista na área de cloud e precisa destacar sua experiência prática. Qual estratégia é mais eficaz para demonstrar suas habilidades?",
      "alternativas": {
        "a": "Criar um portfólio no GitHub com documentação detalhada dos projetos que você implementou.",
        "b": "Falar sobre a certificação que você obteve, mesmo que não tenha projetos práticos.",
        "c": "Listar todos os cursos que você fez, sem mencionar a aplicação prática.",
        "d": "Focar apenas na teoria dos conceitos de cloud, sem mencionar experiências práticas."
      },
      "correta": "a",
      "explicacao": "Criar um portfólio no GitHub com documentação detalhada demonstra suas habilidades práticas e conhecimento aplicado, o que é valorizado pelos empregadores.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "cloud-av-12",
      "nivel": "avancado",
      "pergunta": "Durante a construção de uma arquitetura de alta disponibilidade, você precisa decidir onde colocar o banco de dados. Qual é a melhor prática recomendada?",
      "alternativas": {
        "a": "Colocar o banco de dados na sub-rede privada para melhorar a segurança e a resiliência.",
        "b": "Colocar o banco de dados na sub-rede pública para facilitar o acesso.",
        "c": "Não se preocupar com a localização do banco de dados, pois ele pode ser acessado de qualquer lugar.",
        "d": "Colocar o banco de dados em uma zona de disponibilidade diferente da aplicação para evitar falhas."
      },
      "correta": "a",
      "explicacao": "Colocar o banco de dados na sub-rede privada é a melhor prática recomendada, pois aumenta a segurança e a resiliência da aplicação.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "cloud-av-13",
      "nivel": "avancado",
      "pergunta": "Você está estudando para uma certificação de cloud e quer garantir que seu aprendizado seja eficaz. Qual abordagem você deve seguir?",
      "alternativas": {
        "a": "Estudar apenas a teoria e fazer simulados para passar na certificação.",
        "b": "Combinar o estudo da certificação com a prática em projetos reais na camada gratuita.",
        "c": "Focar apenas em projetos práticos, ignorando a certificação.",
        "d": "Estudar a documentação do provedor sem aplicar os conceitos em prática."
      },
      "correta": "b",
      "explicacao": "Combinar o estudo da certificação com a prática em projetos reais é a abordagem mais eficaz, pois proporciona uma compreensão mais profunda dos conceitos.",
      "fonte": "carreira.certificacoes"
    },
    {
      "id": "cloud-av-14",
      "nivel": "avancado",
      "pergunta": "Você está desenvolvendo uma aplicação web que precisa ser resiliente a falhas. Qual é uma das principais estratégias que você deve implementar?",
      "alternativas": {
        "a": "Distribuir os servidores em mais de uma zona de disponibilidade para garantir continuidade.",
        "b": "Usar apenas uma zona de disponibilidade para reduzir custos operacionais.",
        "c": "Configurar todos os servidores em uma única sub-rede para simplificar a gestão.",
        "d": "Evitar o uso de balanceadores de carga, pois eles aumentam a complexidade."
      },
      "correta": "a",
      "explicacao": "Distribuir os servidores em mais de uma zona de disponibilidade é crucial para garantir que a aplicação continue funcionando mesmo em caso de falhas em um data center.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "cloud-av-15",
      "nivel": "avancado",
      "pergunta": "Ao planejar sua carreira em cloud, você percebe que é importante manter-se atualizado. Qual atitude é essencial para isso?",
      "alternativas": {
        "a": "Focar apenas nas certificações e esquecer a prática.",
        "b": "Praticar continuamente e acompanhar as atualizações dos provedores de cloud.",
        "c": "Confiar apenas no conhecimento adquirido durante a certificação inicial.",
        "d": "Evitar novas certificações para não sobrecarregar seu currículo."
      },
      "correta": "b",
      "explicacao": "Praticar continuamente e acompanhar as atualizações dos provedores de cloud é essencial para se manter relevante na área, já que novos serviços são lançados frequentemente.",
      "fonte": "carreira.entrar"
    }
  ]
};

export default pool;
