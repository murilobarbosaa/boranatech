// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool infraestrutura). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "infraestrutura",
  "questions": [
    {
      "id": "infraestrutura-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você recebeu um chamado de um funcionário que não consegue acessar a internet. O que você deve fazer primeiro?",
      "alternativas": {
        "a": "Verificar se o cabo de rede está conectado corretamente.",
        "b": "Reiniciar o computador do funcionário.",
        "c": "Aumentar a velocidade do roteador.",
        "d": "Desconectar todos os dispositivos da rede."
      },
      "correta": "a",
      "explicacao": "Verificar a conexão do cabo é uma etapa inicial importante para resolver problemas de acesso à internet.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "infraestrutura-ini-02",
      "nivel": "iniciante",
      "pergunta": "Um novo funcionário precisa de acesso a um sistema interno. Qual é a sua melhor abordagem?",
      "alternativas": {
        "a": "Criar um acesso temporário e depois mudar para o permanente.",
        "b": "Configurar o acesso de acordo com as políticas de segurança da empresa.",
        "c": "Liberar o acesso sem verificar as permissões necessárias.",
        "d": "Solicitar que o funcionário aguarde até que você tenha mais tempo."
      },
      "correta": "b",
      "explicacao": "Configurar o acesso de acordo com as políticas de segurança garante que o funcionário tenha as permissões corretas e evita problemas futuros.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "infraestrutura-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você está organizando a documentação de um equipamento de rede. O que deve ser priorizado?",
      "alternativas": {
        "a": "Registrar apenas os problemas que surgiram com o equipamento.",
        "b": "Incluir informações sobre a configuração e manutenção do equipamento.",
        "c": "Manter a documentação em um formato que só você entenda.",
        "d": "Escrever a documentação apenas quando houver tempo livre."
      },
      "correta": "b",
      "explicacao": "Incluir informações sobre configuração e manutenção é essencial para garantir que outros possam entender e utilizar o equipamento corretamente.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "infraestrutura-ini-04",
      "nivel": "iniciante",
      "pergunta": "Um colega de trabalho quer saber como você se sente em relação a trabalhar com suporte. O que você deve destacar como uma vantagem?",
      "alternativas": {
        "a": "É uma área que exige muito conhecimento técnico avançado.",
        "b": "Oferece uma visão ampla de como a tecnologia funciona na prática.",
        "c": "Permite trabalhar apenas com programação.",
        "d": "É uma área que não tem muitas oportunidades de crescimento."
      },
      "correta": "b",
      "explicacao": "Destacar a visão ampla que o suporte proporciona ajuda a mostrar como a prática diária é valiosa para entender a tecnologia.",
      "fonte": "fundamentos.porta"
    },
    {
      "id": "infraestrutura-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você está considerando uma carreira em suporte e infraestrutura. Qual é uma expectativa realista sobre o salário inicial?",
      "alternativas": {
        "a": "É geralmente mais alto do que em outras áreas de tecnologia.",
        "b": "É mais baixo do que o de desenvolvimento, mas oferece oportunidades de crescimento.",
        "c": "Não existe uma faixa salarial definida para essa área.",
        "d": "É sempre o mesmo, independentemente da empresa."
      },
      "correta": "b",
      "explicacao": "É verdade que o salário inicial no suporte costuma ser mais baixo, mas a área abre caminho para posições mais bem pagas com especialização.",
      "fonte": "fundamentos.porta"
    },
    {
      "id": "infraestrutura-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está montando um computador e precisa instalar o processador. Qual é a melhor prática para evitar danos ao componente?",
      "alternativas": {
        "a": "Tocar nos contatos do processador para garantir que está funcionando.",
        "b": "Descarregar a eletricidade estática antes de manuseá-lo.",
        "c": "Usar uma ferramenta metálica para encaixar o processador.",
        "d": "Instalar o processador sem verificar a posição correta."
      },
      "correta": "b",
      "explicacao": "Descarregar a eletricidade estática antes de manusear componentes é fundamental para evitar danos.",
      "fonte": "hardware.montagem"
    },
    {
      "id": "infraestrutura-ini-07",
      "nivel": "iniciante",
      "pergunta": "Um cliente relata que o computador está muito lento. Qual ação você deve priorizar para diagnosticar o problema?",
      "alternativas": {
        "a": "Trocar imediatamente o HD por um SSD.",
        "b": "Verificar a quantidade de memória RAM instalada.",
        "c": "Desinstalar todos os programas do computador.",
        "d": "Formatar o computador para resolver a lentidão."
      },
      "correta": "b",
      "explicacao": "Verificar a quantidade de memória RAM é essencial, pois pouca RAM pode causar lentidão.",
      "fonte": "hardware.componentes"
    },
    {
      "id": "infraestrutura-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você precisa conectar um novo monitor ao computador. Qual é a primeira coisa que deve ser verificada antes de fazer a conexão?",
      "alternativas": {
        "a": "Se o monitor está ligado na tomada.",
        "b": "Se o cabo do monitor é compatível com a porta do computador.",
        "c": "Se o computador está com o sistema operacional atualizado.",
        "d": "Se o monitor é da mesma marca do computador."
      },
      "correta": "b",
      "explicacao": "Verificar a compatibilidade do cabo com a porta é crucial para garantir a conexão correta.",
      "fonte": "hardware.componentes"
    },
    {
      "id": "infraestrutura-ini-09",
      "nivel": "iniciante",
      "pergunta": "Ao montar um computador, você percebe que a fonte não está ligando. Qual é a primeira ação que você deve realizar?",
      "alternativas": {
        "a": "Substituir a fonte por uma nova imediatamente.",
        "b": "Verificar se todos os cabos estão conectados corretamente.",
        "c": "Desmontar o computador para verificar a placa-mãe.",
        "d": "Testar a fonte em outro computador sem verificar nada."
      },
      "correta": "b",
      "explicacao": "Verificar se todos os cabos estão conectados corretamente é a primeira ação para identificar o problema.",
      "fonte": "hardware.montagem"
    },
    {
      "id": "infraestrutura-ini-10",
      "nivel": "iniciante",
      "pergunta": "Durante a manutenção de um computador, você nota poeira acumulada. O que você deve fazer para evitar superaquecimento?",
      "alternativas": {
        "a": "Limpar o interior do computador com um pano seco.",
        "b": "Usar um aspirador de pó para remover a poeira.",
        "c": "Desmontar todas as peças e limpar uma a uma.",
        "d": "Limpar o interior do computador com ar comprimido."
      },
      "correta": "d",
      "explicacao": "Usar ar comprimido é a melhor prática para remover poeira sem danificar os componentes.",
      "fonte": "hardware.montagem"
    },
    {
      "id": "infraestrutura-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você precisa instalar o Windows em uma máquina nova. Qual é o primeiro passo que você deve realizar?",
      "alternativas": {
        "a": "Baixar a imagem do sistema operacional e criar um pen drive bootável.",
        "b": "Conectar a máquina à internet e baixar todos os drivers necessários.",
        "c": "Configurar as permissões de usuário antes de iniciar a instalação.",
        "d": "Verificar se a máquina possui um software de antivírus instalado."
      },
      "correta": "a",
      "explicacao": "O primeiro passo para instalar o Windows é baixar a imagem do sistema e criar um pen drive bootável para iniciar o processo de instalação.",
      "fonte": "sistemas.windows"
    },
    {
      "id": "infraestrutura-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você está enfrentando um problema onde um programa não abre no Windows. Qual ferramenta você deve usar primeiro para diagnosticar o que está acontecendo?",
      "alternativas": {
        "a": "O gerenciador de tarefas para verificar o uso de recursos.",
        "b": "O visualizador de eventos para checar logs de erro.",
        "c": "O painel de controle para desinstalar o programa.",
        "d": "O prompt de comando para tentar reinstalar o programa."
      },
      "correta": "a",
      "explicacao": "O gerenciador de tarefas é a ferramenta ideal para verificar o uso de recursos e identificar se o programa está travado ou consumindo muitos recursos.",
      "fonte": "sistemas.windows"
    },
    {
      "id": "infraestrutura-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você precisa gerenciar permissões de usuários em um sistema Linux. Qual comando é mais apropriado para verificar as permissões de um arquivo?",
      "alternativas": {
        "a": "ls -l",
        "b": "chmod -R",
        "c": "chown",
        "d": "mkdir"
      },
      "correta": "a",
      "explicacao": "O comando 'ls -l' lista os arquivos e suas permissões, permitindo que você veja quem pode ler, escrever ou executar cada arquivo.",
      "fonte": "sistemas.linux"
    },
    {
      "id": "infraestrutura-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você quer instalar um novo programa em um servidor Linux. Qual é a prática recomendada para fazer isso?",
      "alternativas": {
        "a": "Usar o gerenciador de pacotes da distribuição.",
        "b": "Baixar o arquivo .tar.gz e descompactar manualmente.",
        "c": "Copiar o arquivo de instalação de outro servidor.",
        "d": "Instalar o programa diretamente do repositório de arquivos."
      },
      "correta": "a",
      "explicacao": "A prática recomendada é usar o gerenciador de pacotes, pois ele cuida das dependências e garante que a instalação seja feita corretamente.",
      "fonte": "sistemas.linux"
    },
    {
      "id": "infraestrutura-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você precisa acessar um servidor Linux remotamente. Qual protocolo você deve usar para garantir uma conexão segura?",
      "alternativas": {
        "a": "FTP",
        "b": "SSH",
        "c": "Telnet",
        "d": "HTTP"
      },
      "correta": "b",
      "explicacao": "O SSH (Secure Shell) é o protocolo recomendado para acessar servidores Linux de forma segura, garantindo a proteção dos dados transmitidos.",
      "fonte": "sistemas.linux"
    },
    {
      "id": "infraestrutura-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está tentando resolver um problema de conexão em uma rede local. Ao usar o comando 'ping', você recebe resposta de um IP, mas não consegue acessar um site. O que isso indica?",
      "alternativas": {
        "a": "O problema está na configuração do DNS.",
        "b": "A rede local está completamente fora do ar.",
        "c": "O roteador está com defeito.",
        "d": "O firewall do seu computador está bloqueando o acesso."
      },
      "correta": "a",
      "explicacao": "Receber resposta do 'ping' indica que a rede local está funcionando, mas a falha em acessar o site sugere um problema no DNS, que não está traduzindo o nome do site para o IP correto.",
      "fonte": "redes.fundamentos"
    },
    {
      "id": "infraestrutura-int-02",
      "nivel": "intermediario",
      "pergunta": "Um usuário se conecta à rede e não recebe um endereço IP. Qual ferramenta você deve usar para diagnosticar o problema relacionado ao DHCP?",
      "alternativas": {
        "a": "ipconfig",
        "b": "tracert",
        "c": "nslookup",
        "d": "ping"
      },
      "correta": "a",
      "explicacao": "O comando 'ipconfig' permite verificar se o dispositivo obteve um endereço IP do DHCP, ajudando a identificar se o problema está na distribuição de IPs.",
      "fonte": "redes.servicos"
    },
    {
      "id": "infraestrutura-int-03",
      "nivel": "intermediario",
      "pergunta": "Você precisa configurar uma nova rede Wi-Fi em um escritório. Qual configuração é essencial para garantir uma conexão segura?",
      "alternativas": {
        "a": "Deixar a rede aberta para facilitar o acesso.",
        "b": "Usar uma senha forte e um protocolo de segurança como WPA2.",
        "c": "Desativar o DHCP para evitar conflitos de IP.",
        "d": "Configurar o Wi-Fi na mesma faixa de frequência de outras redes próximas."
      },
      "correta": "b",
      "explicacao": "Usar uma senha forte e um protocolo de segurança como WPA2 é essencial para proteger a rede Wi-Fi de acessos não autorizados.",
      "fonte": "redes.servicos"
    },
    {
      "id": "infraestrutura-int-04",
      "nivel": "intermediario",
      "pergunta": "Um switch está apresentando lentidão na rede. Qual é uma boa prática para diagnosticar o problema?",
      "alternativas": {
        "a": "Verificar se o cabeamento está organizado e sem danos.",
        "b": "Substituir o switch imediatamente por um novo.",
        "c": "Desconectar todos os dispositivos e conectar um por um.",
        "d": "Reiniciar o switch sem verificar as configurações."
      },
      "correta": "a",
      "explicacao": "Verificar o cabeamento é uma boa prática, pois um cabeamento desorganizado ou danificado pode causar problemas de desempenho na rede.",
      "fonte": "redes.equipamentos"
    },
    {
      "id": "infraestrutura-int-05",
      "nivel": "intermediario",
      "pergunta": "Você está configurando um roteador para conectar sua rede local à internet. Qual configuração é crucial para garantir a comunicação correta?",
      "alternativas": {
        "a": "Definir o endereço IP do roteador como um IP privado.",
        "b": "Configurar o roteador para usar um endereço IP público fornecido pelo ISP.",
        "c": "Desativar o firewall do roteador para evitar bloqueios.",
        "d": "Conectar o roteador a um switch sem configurar as portas."
      },
      "correta": "b",
      "explicacao": "Configurar o roteador com um endereço IP público fornecido pelo ISP é crucial para permitir que a rede local se conecte à internet corretamente.",
      "fonte": "redes.equipamentos"
    },
    {
      "id": "infraestrutura-int-06",
      "nivel": "intermediario",
      "pergunta": "Você precisa compartilhar documentos entre todos os funcionários da empresa. Qual tipo de servidor você deve configurar?",
      "alternativas": {
        "a": "Servidor de arquivos",
        "b": "Servidor de impressão",
        "c": "Servidor de aplicações",
        "d": "Servidor DNS"
      },
      "correta": "a",
      "explicacao": "O servidor de arquivos centraliza os documentos da empresa, permitindo que todos acessem e compartilhem arquivos de qualquer máquina.",
      "fonte": "servidores.servidores"
    },
    {
      "id": "infraestrutura-int-07",
      "nivel": "intermediario",
      "pergunta": "Um funcionário foi demitido e você precisa revogar seu acesso a todos os sistemas da empresa. Qual ferramenta você deve usar?",
      "alternativas": {
        "a": "Gerenciamento de usuários no Active Directory",
        "b": "Configuração de permissões em cada computador",
        "c": "Remoção manual das contas em cada sistema",
        "d": "Desativação do servidor de arquivos"
      },
      "correta": "a",
      "explicacao": "O Active Directory permite gerenciar usuários centralmente, desativando a conta do funcionário em um único lugar, o que revoga seu acesso em toda a empresa.",
      "fonte": "servidores.ad"
    },
    {
      "id": "infraestrutura-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está configurando um ambiente de testes e precisa instalar múltiplos sistemas operacionais sem afetar sua máquina principal. O que você deve fazer?",
      "alternativas": {
        "a": "Criar máquinas virtuais usando uma ferramenta de virtualização",
        "b": "Instalar os sistemas operacionais diretamente no hardware",
        "c": "Usar um servidor físico para cada sistema operacional",
        "d": "Configurar um dual boot na máquina principal"
      },
      "correta": "a",
      "explicacao": "Criar máquinas virtuais permite rodar múltiplos sistemas operacionais de forma isolada, sem risco para a máquina principal.",
      "fonte": "servidores.virtualizacao"
    },
    {
      "id": "infraestrutura-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está implementando uma estratégia de backup para a empresa. Qual é a regra que deve ser seguida para garantir a segurança dos dados?",
      "alternativas": {
        "a": "3 cópias dos dados, 2 mídias diferentes, 1 cópia fora do local",
        "b": "2 cópias dos dados, 1 mídia, 1 cópia fora do local",
        "c": "3 cópias dos dados, 1 mídia, 1 cópia fora do local",
        "d": "1 cópia dos dados, 2 mídias diferentes, 3 cópias no local"
      },
      "correta": "a",
      "explicacao": "A regra 3-2-1 garante que os dados estejam seguros, mantendo múltiplas cópias em diferentes mídias e uma delas fora do local.",
      "fonte": "servidores.backup"
    },
    {
      "id": "infraestrutura-int-10",
      "nivel": "intermediario",
      "pergunta": "Você precisa garantir que um novo funcionário tenha acesso apenas aos recursos necessários para sua função. O que você deve aplicar?",
      "alternativas": {
        "a": "Princípio do menor privilégio no Active Directory",
        "b": "Permissões amplas para evitar problemas",
        "c": "Acesso total para facilitar o trabalho",
        "d": "Gerenciamento de permissões em cada computador individualmente"
      },
      "correta": "a",
      "explicacao": "O princípio do menor privilégio assegura que o funcionário tenha apenas os acessos necessários, aumentando a segurança da empresa.",
      "fonte": "servidores.ad"
    },
    {
      "id": "infraestrutura-int-11",
      "nivel": "intermediario",
      "pergunta": "Você precisa restaurar um arquivo que foi acidentalmente deletado. O que é essencial que você tenha feito antes?",
      "alternativas": {
        "a": "Testado a restauração do backup",
        "b": "Criado múltiplas cópias do arquivo",
        "c": "Armazenado o backup em uma única mídia",
        "d": "Realizado a replicação em tempo real"
      },
      "correta": "a",
      "explicacao": "Testar a restauração do backup garante que você possa recuperar os dados quando necessário, evitando surpresas durante uma crise.",
      "fonte": "servidores.backup"
    },
    {
      "id": "infraestrutura-int-12",
      "nivel": "intermediario",
      "pergunta": "Você recebeu um chamado de um usuário que não consegue acessar um software essencial. O que você deve fazer primeiro?",
      "alternativas": {
        "a": "Registrar o chamado e escalar imediatamente para o nível 2.",
        "b": "Tentar resolver o problema sozinho antes de registrar o chamado.",
        "c": "Registrar o chamado, fazer perguntas para entender o problema e tentar resolver.",
        "d": "Fechar o chamado sem ação, pois o usuário pode resolver por conta própria."
      },
      "correta": "c",
      "explicacao": "A melhor prática é registrar o chamado e fazer perguntas para entender o problema, garantindo que você tenha as informações necessárias para tentar resolver antes de escalar.",
      "fonte": "suporte.chamados"
    },
    {
      "id": "infraestrutura-int-13",
      "nivel": "intermediario",
      "pergunta": "Um colega está tendo dificuldades para configurar um novo equipamento de rede. O que você deve fazer para garantir que ele consiga realizar a tarefa?",
      "alternativas": {
        "a": "Dizer a ele para procurar um vídeo online que ensine a configuração.",
        "b": "Documentar o passo a passo da configuração enquanto você ajuda e compartilhar com ele.",
        "c": "Fazer a configuração você mesmo, já que é mais rápido.",
        "d": "Aconselhar que ele peça ajuda ao gerente, pois você não pode ajudar."
      },
      "correta": "b",
      "explicacao": "Documentar o passo a passo enquanto ajuda não só ajuda seu colega, mas também cria um recurso valioso para futuras referências.",
      "fonte": "suporte.documentacao"
    },
    {
      "id": "infraestrutura-int-14",
      "nivel": "intermediario",
      "pergunta": "Um usuário relatou que recebeu um email solicitando suas credenciais de login. Qual a melhor orientação que você pode dar a ele?",
      "alternativas": {
        "a": "Ignorar o email, pois provavelmente é um spam.",
        "b": "Clicar no link e verificar se a página é legítima.",
        "c": "Informá-lo sobre phishing e recomendar que não forneça suas informações.",
        "d": "Dizer que ele deve mudar sua senha imediatamente, sem mais explicações."
      },
      "correta": "c",
      "explicacao": "Orientar o usuário sobre phishing e a não fornecer suas informações é crucial para protegê-lo e a empresa de ataques.",
      "fonte": "suporte.seguranca"
    },
    {
      "id": "infraestrutura-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está organizando a documentação dos ativos da empresa. Qual é a informação mais importante que deve ser registrada?",
      "alternativas": {
        "a": "A data de compra de cada equipamento.",
        "b": "O nome do funcionário que usa cada equipamento.",
        "c": "A localização física de cada ativo e suas especificações.",
        "d": "O histórico de manutenção de cada equipamento."
      },
      "correta": "c",
      "explicacao": "Registrar a localização física e as especificações dos ativos é essencial para a manutenção e planejamento eficaz na infraestrutura.",
      "fonte": "suporte.documentacao"
    },
    {
      "id": "infraestrutura-av-01",
      "nivel": "avancado",
      "pergunta": "Você está se preparando para a certificação CCNA da Cisco. Qual é a melhor maneira de garantir que você compreenda os conceitos de redes de forma prática?",
      "alternativas": {
        "a": "Estudar apenas a teoria dos livros de redes.",
        "b": "Montar um laboratório virtual e praticar a configuração de redes.",
        "c": "Assistir a vídeos sobre redes sem praticar.",
        "d": "Focar apenas em simulados de exames."
      },
      "correta": "b",
      "explicacao": "Montar um laboratório virtual permite que você aplique os conceitos aprendidos, garantindo uma compreensão prática e sólida.",
      "fonte": "carreira.certificacoes"
    },
    {
      "id": "infraestrutura-av-02",
      "nivel": "avancado",
      "pergunta": "Você está montando um homelab e precisa documentar o ambiente. Qual item é essencial para garantir que qualquer técnico consiga entender e reproduzir sua configuração?",
      "alternativas": {
        "a": "Um diagrama da rede com todos os dispositivos.",
        "b": "Apenas uma lista de softwares utilizados.",
        "c": "Um runbook detalhando cada configuração e solução de problemas.",
        "d": "Um vídeo mostrando como tudo foi montado."
      },
      "correta": "c",
      "explicacao": "Um runbook fornece instruções detalhadas e é crucial para que outros possam replicar e entender o ambiente configurado.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "infraestrutura-av-03",
      "nivel": "avancado",
      "pergunta": "Ao buscar sua primeira vaga na área de infraestrutura, qual é a estratégia mais eficaz para se destacar?",
      "alternativas": {
        "a": "Ter um currículo extenso com todas as certificações que você já fez.",
        "b": "Documentar suas práticas em um laboratório virtual e ter uma certificação básica.",
        "c": "Focar apenas em cursos online sem prática.",
        "d": "Apenas enviar currículos sem experiência prática."
      },
      "correta": "b",
      "explicacao": "Documentar suas práticas e ter uma certificação básica mostra iniciativa e conhecimento aplicado, o que é valorizado pelos empregadores.",
      "fonte": "carreira.evoluir"
    },
    {
      "id": "infraestrutura-av-04",
      "nivel": "avancado",
      "pergunta": "Você decidiu montar um servidor de arquivos no seu homelab. Qual é a primeira configuração que você deve realizar para garantir que ele esteja acessível na rede?",
      "alternativas": {
        "a": "Configurar o DHCP para atribuir IPs automaticamente.",
        "b": "Definir um endereço IP estático para o servidor.",
        "c": "Instalar um sistema operacional sem configurar a rede.",
        "d": "Criar usuários antes de configurar o servidor."
      },
      "correta": "b",
      "explicacao": "Definir um endereço IP estático para o servidor garante que ele sempre tenha o mesmo IP, facilitando o acesso e a configuração dos serviços.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "infraestrutura-av-05",
      "nivel": "avancado",
      "pergunta": "Você está considerando uma especialização em segurança após trabalhar em suporte. Qual é a melhor maneira de se preparar para essa transição?",
      "alternativas": {
        "a": "Focar apenas em certificações de segurança sem prática.",
        "b": "Continuar praticando em suporte e estudar segurança ao mesmo tempo.",
        "c": "Deixar de lado a prática em suporte e apenas estudar teoria.",
        "d": "Buscar um emprego em segurança imediatamente."
      },
      "correta": "b",
      "explicacao": "Continuar praticando em suporte enquanto estuda segurança permite que você aplique os conceitos de segurança em um contexto prático, facilitando a transição.",
      "fonte": "carreira.evoluir"
    },
    {
      "id": "infraestrutura-av-06",
      "nivel": "avancado",
      "pergunta": "Você está documentando seu homelab e percebe que precisa incluir um inventário. O que deve ser listado nesse inventário?",
      "alternativas": {
        "a": "Apenas os softwares instalados no servidor.",
        "b": "Todos os dispositivos, configurações e serviços em uso.",
        "c": "Somente os endereços IP utilizados na rede.",
        "d": "Apenas as senhas dos usuários."
      },
      "correta": "b",
      "explicacao": "Um inventário completo deve incluir todos os dispositivos, configurações e serviços, pois isso fornece uma visão clara do ambiente montado.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "infraestrutura-av-07",
      "nivel": "avancado",
      "pergunta": "Você quer se preparar para uma entrevista na área de redes. Qual é a melhor abordagem para demonstrar seu conhecimento?",
      "alternativas": {
        "a": "Falar apenas sobre suas certificações.",
        "b": "Descrever experiências práticas e como você resolveu problemas em redes.",
        "c": "Citar apenas conceitos teóricos sem exemplos práticos.",
        "d": "Focar em quais cursos você fez sem mencionar prática."
      },
      "correta": "b",
      "explicacao": "Descrever experiências práticas demonstra sua capacidade de aplicar o conhecimento em situações reais, o que é muito valorizado em entrevistas.",
      "fonte": "carreira.certificacoes"
    },
    {
      "id": "infraestrutura-av-08",
      "nivel": "avancado",
      "pergunta": "Você está montando um laboratório virtual e precisa escolher um sistema operacional para um servidor. Qual é a melhor escolha para quem está começando na área de infraestrutura?",
      "alternativas": {
        "a": "Um sistema operacional complexo e pouco documentado.",
        "b": "Um sistema operacional amplamente utilizado e com boa documentação.",
        "c": "Um sistema operacional que você nunca ouviu falar.",
        "d": "Um sistema operacional que não suporta virtualização."
      },
      "correta": "b",
      "explicacao": "Escolher um sistema operacional amplamente utilizado e bem documentado facilita o aprendizado e a resolução de problemas comuns.",
      "fonte": "carreira.evoluir"
    },
    {
      "id": "infraestrutura-av-09",
      "nivel": "avancado",
      "pergunta": "Você completou sua certificação CCNA e quer avançar na carreira. Qual é a melhor maneira de usar essa certificação para crescer profissionalmente?",
      "alternativas": {
        "a": "Buscar uma vaga em uma área completamente diferente.",
        "b": "Aplicar para posições que exigem conhecimento em redes e continuar aprendendo.",
        "c": "Focar apenas em certificações mais avançadas sem experiência prática.",
        "d": "Ignorar a prática em favor de mais estudos teóricos."
      },
      "correta": "b",
      "explicacao": "Aplicar para posições que exigem conhecimento em redes permite que você utilize sua certificação e ganhe experiência prática, essencial para o crescimento na carreira.",
      "fonte": "carreira.certificacoes"
    }
  ]
};

export default pool;
