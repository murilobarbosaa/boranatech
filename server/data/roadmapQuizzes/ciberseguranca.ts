// GENERATED FILE. Gerado por scripts/generateQuizPool.mts
// (pnpm gen:quiz-pool ciberseguranca). SERVER-ONLY: este arquivo contem o GABARITO;
// NUNCA importar, direta ou indiretamente, de client/src (o client recebe as
// perguntas sem gabarito via API). Ids sao estaveis: regenerar com --force
// troca os ids e invalida tentativas registradas. Ver README.md desta pasta.
// TODO(Ana): revisao editorial completa deste pool (perguntas, alternativas
// e explicacoes de todos os niveis).
import type { QuizPool } from "../../../shared/roadmapQuiz/types";

const pool: QuizPool = {
  "slug": "ciberseguranca",
  "questions": [
    {
      "id": "ciberseguranca-ini-01",
      "nivel": "iniciante",
      "pergunta": "Você está analisando a segurança de um sistema e percebe que a informação sensível pode ser acessada por pessoas não autorizadas. Qual princípio da tríade CIA está comprometido?",
      "alternativas": {
        "a": "Integridade",
        "b": "Confidencialidade",
        "c": "Disponibilidade",
        "d": "Autenticidade"
      },
      "correta": "b",
      "explicacao": "A confidencialidade é o princípio que garante que a informação só seja acessada por quem tem permissão. Se pessoas não autorizadas têm acesso, isso é uma violação da confidencialidade.",
      "fonte": "fundamentos.triade"
    },
    {
      "id": "ciberseguranca-ini-02",
      "nivel": "iniciante",
      "pergunta": "Durante uma análise de segurança, você descobre que um sistema foi alterado sem autorização, mas você não consegue identificar quem fez a alteração. Qual aspecto da tríade CIA foi violado?",
      "alternativas": {
        "a": "Disponibilidade",
        "b": "Integridade",
        "c": "Confidencialidade",
        "d": "Autenticidade"
      },
      "correta": "b",
      "explicacao": "A integridade é o princípio que garante que a informação não seja alterada de forma indevida. A alteração sem autorização compromete a integridade dos dados.",
      "fonte": "fundamentos.triade"
    },
    {
      "id": "ciberseguranca-ini-03",
      "nivel": "iniciante",
      "pergunta": "Você precisa garantir que um sistema esteja sempre acessível para os usuários autorizados. Qual princípio da tríade CIA você deve priorizar?",
      "alternativas": {
        "a": "Confidencialidade",
        "b": "Integridade",
        "c": "Disponibilidade",
        "d": "Autenticidade"
      },
      "correta": "c",
      "explicacao": "A disponibilidade é o princípio que assegura que o sistema esteja acessível a quem precisa, quando precisa. Priorizar a disponibilidade é essencial para garantir o acesso legítimo.",
      "fonte": "fundamentos.triade"
    },
    {
      "id": "ciberseguranca-ini-04",
      "nivel": "iniciante",
      "pergunta": "Você está prestes a realizar um teste de penetração em um sistema. O que é essencial ter antes de começar?",
      "alternativas": {
        "a": "Uma boa ideia de como invadir o sistema",
        "b": "A autorização explícita para testar o sistema",
        "c": "Um plano de ataque detalhado",
        "d": "Um conhecimento profundo das vulnerabilidades"
      },
      "correta": "b",
      "explicacao": "A autorização explícita é essencial antes de realizar qualquer teste em um sistema, pois testar sem permissão é ilegal e antiético.",
      "fonte": "fundamentos.etica"
    },
    {
      "id": "ciberseguranca-ini-05",
      "nivel": "iniciante",
      "pergunta": "Você encontrou uma vulnerabilidade em um sistema que não pertence a você. O que você deve fazer?",
      "alternativas": {
        "a": "Explorar a vulnerabilidade para aprender",
        "b": "Informar o responsável pelo sistema",
        "c": "Ignorar, pois não é seu problema",
        "d": "Testar a vulnerabilidade em um ambiente não autorizado"
      },
      "correta": "b",
      "explicacao": "Informar o responsável pelo sistema é a atitude ética e legal a ser tomada, pois explorar a vulnerabilidade sem autorização é crime.",
      "fonte": "fundamentos.etica"
    },
    {
      "id": "ciberseguranca-ini-06",
      "nivel": "iniciante",
      "pergunta": "Você está em um laboratório de segurança e deseja praticar técnicas de invasão. Qual é a melhor abordagem?",
      "alternativas": {
        "a": "Testar qualquer sistema que você encontrar",
        "b": "Utilizar ambientes controlados e autorizados",
        "c": "Fazer testes em sistemas de amigos com consentimento verbal",
        "d": "Acessar sistemas públicos sem autorização"
      },
      "correta": "b",
      "explicacao": "Utilizar ambientes controlados e autorizados garante que você pratique legalmente e de forma ética, evitando problemas legais.",
      "fonte": "fundamentos.etica"
    },
    {
      "id": "ciberseguranca-ini-07",
      "nivel": "iniciante",
      "pergunta": "Você está revisando as práticas de segurança de uma empresa. O que é fundamental para garantir a segurança dos dados?",
      "alternativas": {
        "a": "Implementar soluções de segurança sem planejamento",
        "b": "Focar apenas na proteção contra ataques externos",
        "c": "Gerenciar continuamente os riscos de segurança",
        "d": "Apenas confiar em software de segurança"
      },
      "correta": "c",
      "explicacao": "Gerenciar continuamente os riscos de segurança é fundamental, pois a segurança não é um produto, mas um processo contínuo.",
      "fonte": "fundamentos.oque"
    },
    {
      "id": "ciberseguranca-ini-08",
      "nivel": "iniciante",
      "pergunta": "Você está analisando o tráfego de rede e percebe que muitos pacotes estão sendo enviados para o IP de um servidor. O que você deve fazer primeiro para entender melhor a situação?",
      "alternativas": {
        "a": "Verificar quais portas estão abertas no servidor usando uma ferramenta de mapeamento.",
        "b": "Desconectar o servidor da rede para evitar possíveis ataques.",
        "c": "Instalar um firewall para bloquear todos os pacotes que chegam ao servidor.",
        "d": "Aumentar a largura de banda do servidor para lidar com o tráfego."
      },
      "correta": "a",
      "explicacao": "Verificar as portas abertas ajuda a identificar quais serviços estão expostos e pode indicar possíveis vulnerabilidades.",
      "fonte": "redes.basico"
    },
    {
      "id": "ciberseguranca-ini-09",
      "nivel": "iniciante",
      "pergunta": "Você precisa garantir que um servidor web esteja acessível apenas de forma segura. Qual protocolo você deve priorizar para essa tarefa?",
      "alternativas": {
        "a": "HTTP, pois é mais rápido que HTTPS.",
        "b": "FTP, que é usado para transferências de arquivos.",
        "c": "HTTPS, que é a versão segura do HTTP.",
        "d": "DNS, que traduz nomes de domínio em endereços IP."
      },
      "correta": "c",
      "explicacao": "O HTTPS garante que a comunicação entre o navegador e o servidor web seja criptografada, aumentando a segurança.",
      "fonte": "redes.protocolos"
    },
    {
      "id": "ciberseguranca-ini-10",
      "nivel": "iniciante",
      "pergunta": "Ao realizar um mapeamento de rede, você descobre que várias portas estão abertas em um servidor. O que isso significa em termos de segurança?",
      "alternativas": {
        "a": "Isso indica que o servidor está bem protegido contra ataques.",
        "b": "Isso pode representar várias superfícies de ataque que precisam ser monitoradas.",
        "c": "Isso significa que o servidor não está configurado corretamente e deve ser desconectado.",
        "d": "Isso sugere que o servidor é mais eficiente em suas operações."
      },
      "correta": "b",
      "explicacao": "Portas abertas representam serviços expostos que podem ser vulneráveis a ataques, exigindo monitoramento e proteção.",
      "fonte": "redes.protocolos"
    },
    {
      "id": "ciberseguranca-ini-11",
      "nivel": "iniciante",
      "pergunta": "Você está configurando um firewall e precisa decidir quais portas manter abertas. Qual abordagem é recomendada?",
      "alternativas": {
        "a": "Manter todas as portas abertas para garantir que todos os serviços funcionem.",
        "b": "Abrir apenas as portas necessárias para os serviços que você precisa.",
        "c": "Fechar todas as portas e abrir apenas as que você acha que são seguras.",
        "d": "Abrir portas aleatórias para confundir possíveis atacantes."
      },
      "correta": "b",
      "explicacao": "Abrir apenas as portas necessárias reduz a superfície de ataque e melhora a segurança do sistema.",
      "fonte": "redes.protocolos"
    },
    {
      "id": "ciberseguranca-ini-12",
      "nivel": "iniciante",
      "pergunta": "Você precisa listar todos os arquivos em um diretório no terminal do Linux. Qual comando você deve usar?",
      "alternativas": {
        "a": "ls -a",
        "b": "list -all",
        "c": "dir",
        "d": "show files"
      },
      "correta": "a",
      "explicacao": "O comando 'ls -a' lista todos os arquivos, incluindo os ocultos, no diretório atual.",
      "fonte": "linux.terminal"
    },
    {
      "id": "ciberseguranca-ini-13",
      "nivel": "iniciante",
      "pergunta": "Você está configurando um novo usuário no Linux e deseja garantir que ele tenha apenas as permissões necessárias. O que você deve fazer?",
      "alternativas": {
        "a": "Conceder permissões de root ao usuário",
        "b": "Definir permissões mínimas de acordo com o que o usuário precisa",
        "c": "Dar acesso total a todos os arquivos do sistema",
        "d": "Criar um grupo com permissões amplas para o usuário"
      },
      "correta": "b",
      "explicacao": "Definir permissões mínimas garante que o usuário só tenha acesso ao que realmente precisa, seguindo o princípio do menor privilégio.",
      "fonte": "linux.permissoes"
    },
    {
      "id": "ciberseguranca-ini-14",
      "nivel": "iniciante",
      "pergunta": "Você está usando uma máquina virtual para praticar comandos no Linux. Qual é a principal vantagem de usar esse ambiente?",
      "alternativas": {
        "a": "É mais rápido do que usar um computador físico",
        "b": "Permite experimentar sem risco para a máquina real",
        "c": "Oferece mais comandos disponíveis do que o Linux normal",
        "d": "Facilita a instalação de software no sistema real"
      },
      "correta": "b",
      "explicacao": "Uma máquina virtual permite que você experimente e pratique comandos no Linux sem afetar seu sistema operacional principal.",
      "fonte": "linux.terminal"
    },
    {
      "id": "ciberseguranca-ini-15",
      "nivel": "iniciante",
      "pergunta": "Você se depara com um processo em execução no Linux e deseja saber mais sobre ele. Qual comando é mais apropriado para isso?",
      "alternativas": {
        "a": "procinfo",
        "b": "ps -ef",
        "c": "list processes",
        "d": "show running"
      },
      "correta": "b",
      "explicacao": "O comando 'ps -ef' exibe uma lista detalhada de todos os processos em execução no sistema.",
      "fonte": "linux.terminal"
    },
    {
      "id": "ciberseguranca-int-01",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um sistema que precisa proteger informações sensíveis. Qual abordagem de criptografia você deve usar para garantir que apenas a sua aplicação consiga acessar esses dados?",
      "alternativas": {
        "a": "Utilizar criptografia simétrica, onde a mesma chave é usada para criptografar e descriptografar os dados.",
        "b": "Utilizar criptografia assimétrica, onde uma chave pública é usada para criptografar e a chave privada para descriptografar.",
        "c": "Utilizar um algoritmo de hash para transformar os dados em uma impressão digital.",
        "d": "Utilizar criptografia caseira, criando um algoritmo próprio para a situação."
      },
      "correta": "a",
      "explicacao": "A criptografia simétrica é adequada para proteger informações sensíveis, pois utiliza a mesma chave para criptografar e descriptografar, garantindo acesso controlado.",
      "fonte": "conceitos.cripto"
    },
    {
      "id": "ciberseguranca-int-02",
      "nivel": "intermediario",
      "pergunta": "Você está configurando um servidor web e deseja garantir que a comunicação com os usuários seja segura. Qual é a configuração essencial que você deve implementar?",
      "alternativas": {
        "a": "Habilitar HTTPS para garantir a confidencialidade e integridade dos dados trocados.",
        "b": "Habilitar HTTP para facilitar o acesso dos usuários ao site.",
        "c": "Usar um certificado autoassinado para economizar custos.",
        "d": "Desabilitar todos os cabeçalhos de segurança para evitar conflitos."
      },
      "correta": "a",
      "explicacao": "Habilitar HTTPS é essencial para garantir a confidencialidade e integridade dos dados trocados entre o servidor e os usuários.",
      "fonte": "conceitos.tls"
    },
    {
      "id": "ciberseguranca-int-03",
      "nivel": "intermediario",
      "pergunta": "Você está criando um sistema de autenticação e deseja garantir que as senhas dos usuários estejam seguras. Qual prática você deve seguir?",
      "alternativas": {
        "a": "Armazenar as senhas em texto puro para facilitar a recuperação.",
        "b": "Utilizar um algoritmo de hash forte para armazenar as senhas.",
        "c": "Reutilizar senhas de outros sistemas para simplificar o processo.",
        "d": "Permitir que os usuários escolham senhas muito simples para facilitar a memorização."
      },
      "correta": "b",
      "explicacao": "Utilizar um algoritmo de hash forte para armazenar as senhas é fundamental para garantir que, mesmo em caso de vazamento, as senhas não sejam expostas.",
      "fonte": "conceitos.autenticacao"
    },
    {
      "id": "ciberseguranca-int-04",
      "nivel": "intermediario",
      "pergunta": "Você está analisando um sistema que apresenta falhas de segurança. Qual é a primeira coisa que você deve fazer para identificar as vulnerabilidades?",
      "alternativas": {
        "a": "Ignorar as vulnerabilidades, pois elas não afetam a operação do sistema.",
        "b": "Consultar a lista do OWASP Top 10 para identificar as falhas mais comuns.",
        "c": "Aumentar o número de usuários para testar a resistência do sistema.",
        "d": "Desativar todas as funcionalidades do sistema para evitar ataques."
      },
      "correta": "b",
      "explicacao": "Consultar a lista do OWASP Top 10 é uma prática recomendada para identificar as vulnerabilidades mais comuns em sistemas web.",
      "fonte": "conceitos.vulnerabilidades"
    },
    {
      "id": "ciberseguranca-int-05",
      "nivel": "intermediario",
      "pergunta": "Você recebeu um e-mail que parece ser de seu banco, pedindo que você clique em um link. Qual é a melhor prática a seguir?",
      "alternativas": {
        "a": "Clicar no link imediatamente, pois parece ser legítimo.",
        "b": "Verificar a autenticidade do e-mail por outro canal, como o telefone do banco.",
        "c": "Responder ao e-mail pedindo mais informações.",
        "d": "Ignorar o e-mail e não tomar nenhuma ação."
      },
      "correta": "b",
      "explicacao": "Verificar a autenticidade do e-mail por outro canal é a melhor prática para evitar cair em um golpe de phishing.",
      "fonte": "conceitos.engenharia"
    },
    {
      "id": "ciberseguranca-int-06",
      "nivel": "intermediario",
      "pergunta": "Você está desenvolvendo um aplicativo que precisa garantir a integridade dos dados. Qual abordagem você deve usar para verificar se os dados não foram alterados?",
      "alternativas": {
        "a": "Utilizar um hash para comparar os dados originais com os recebidos.",
        "b": "Armazenar os dados em texto puro para facilitar a comparação.",
        "c": "Usar criptografia simétrica para ocultar os dados.",
        "d": "Ignorar a integridade, pois isso não é uma prioridade."
      },
      "correta": "a",
      "explicacao": "Utilizar um hash permite verificar a integridade dos dados, pois qualquer alteração nos dados resultará em um hash diferente.",
      "fonte": "conceitos.cripto"
    },
    {
      "id": "ciberseguranca-int-07",
      "nivel": "intermediario",
      "pergunta": "Você está implementando um sistema de autenticação de múltiplos fatores. Qual é um exemplo de um segundo fator que você poderia usar?",
      "alternativas": {
        "a": "Uma senha que o usuário já possui.",
        "b": "Um código enviado para o celular do usuário.",
        "c": "Uma pergunta de segurança que o usuário escolheu.",
        "d": "Um documento de identidade apresentado fisicamente."
      },
      "correta": "b",
      "explicacao": "Um código enviado para o celular do usuário é um exemplo típico de um segundo fator em um sistema de autenticação de múltiplos fatores.",
      "fonte": "conceitos.autenticacao"
    },
    {
      "id": "ciberseguranca-int-08",
      "nivel": "intermediario",
      "pergunta": "Você está revisando a configuração de um servidor e percebe que ele possui senhas padrão. O que você deve fazer?",
      "alternativas": {
        "a": "Deixar as senhas padrão, pois elas são fáceis de lembrar.",
        "b": "Alterar as senhas padrão para senhas fortes e únicas.",
        "c": "Desativar o sistema para evitar riscos.",
        "d": "Documentar as senhas padrão para referência futura."
      },
      "correta": "b",
      "explicacao": "Alterar as senhas padrão para senhas fortes e únicas é essencial para evitar vulnerabilidades de segurança.",
      "fonte": "conceitos.vulnerabilidades"
    },
    {
      "id": "ciberseguranca-int-09",
      "nivel": "intermediario",
      "pergunta": "Você está criando um site e quer garantir que ele não seja alvo de ataques de injeção. Qual prática você deve adotar?",
      "alternativas": {
        "a": "Misturar dados do usuário com comandos SQL diretamente.",
        "b": "Utilizar consultas parametrizadas para separar dados de comandos.",
        "c": "Permitir qualquer tipo de entrada do usuário sem validação.",
        "d": "Usar um sistema de autenticação fraco para simplificar o acesso."
      },
      "correta": "b",
      "explicacao": "Utilizar consultas parametrizadas é a prática recomendada para evitar ataques de injeção, pois separa dados de comandos.",
      "fonte": "conceitos.vulnerabilidades"
    },
    {
      "id": "ciberseguranca-int-10",
      "nivel": "intermediario",
      "pergunta": "Você foi contratado para realizar um pentest em uma empresa. Antes de iniciar, qual é a primeira ação que deve tomar?",
      "alternativas": {
        "a": "Iniciar a exploração das vulnerabilidades encontradas.",
        "b": "Definir o escopo e obter autorização formal por escrito.",
        "c": "Executar um mapeamento de rede sem avisar a empresa.",
        "d": "Instalar ferramentas de ataque na rede da empresa."
      },
      "correta": "b",
      "explicacao": "A primeira ação deve ser sempre definir o escopo e obter autorização formal por escrito, garantindo que o teste seja legítimo e dentro das regras.",
      "fonte": "ofensiva.redteam"
    },
    {
      "id": "ciberseguranca-int-11",
      "nivel": "intermediario",
      "pergunta": "Durante a fase de reconhecimento de um pentest, qual ferramenta você deve usar para descobrir quais portas estão abertas em um sistema?",
      "alternativas": {
        "a": "Wireshark, para capturar pacotes de dados.",
        "b": "Nmap, para mapear portas e serviços.",
        "c": "Metasploit, para explorar vulnerabilidades.",
        "d": "Burp Suite, para interceptar tráfego web."
      },
      "correta": "b",
      "explicacao": "O Nmap é a ferramenta adequada para mapear portas e serviços, essencial na fase de reconhecimento para identificar o que está exposto.",
      "fonte": "ofensiva.ferramentas"
    },
    {
      "id": "ciberseguranca-int-12",
      "nivel": "intermediario",
      "pergunta": "Você identificou uma vulnerabilidade em um sistema durante um pentest. Qual deve ser o próximo passo após a identificação?",
      "alternativas": {
        "a": "Explorar a vulnerabilidade para comprovar o acesso.",
        "b": "Documentar a vulnerabilidade e suas implicações.",
        "c": "Informar a equipe de TI da empresa imediatamente.",
        "d": "Desconsiderar a vulnerabilidade se não houver impacto imediato."
      },
      "correta": "b",
      "explicacao": "O próximo passo deve ser sempre documentar a vulnerabilidade e suas implicações, para que isso seja incluído no relatório final do pentest.",
      "fonte": "ofensiva.fases"
    },
    {
      "id": "ciberseguranca-int-13",
      "nivel": "intermediario",
      "pergunta": "Você está utilizando o Wireshark para analisar o tráfego da rede. O que você deve garantir antes de iniciar a captura?",
      "alternativas": {
        "a": "Que você tem autorização por escrito para capturar o tráfego.",
        "b": "Que a rede está livre de qualquer atividade suspeita.",
        "c": "Que o tráfego é exclusivamente de sua responsabilidade.",
        "d": "Que você está em uma rede pública para evitar problemas legais."
      },
      "correta": "a",
      "explicacao": "Antes de iniciar a captura com o Wireshark, é essencial garantir que você tem autorização por escrito para evitar qualquer ato ilícito.",
      "fonte": "ofensiva.ferramentas"
    },
    {
      "id": "ciberseguranca-int-14",
      "nivel": "intermediario",
      "pergunta": "Após completar um pentest, qual é o principal entregável que você deve fornecer ao cliente?",
      "alternativas": {
        "a": "Um relatório detalhando as falhas e recomendações de correção.",
        "b": "A lista de ferramentas utilizadas durante o teste.",
        "c": "Um resumo das vulnerabilidades encontradas sem explicações.",
        "d": "Um acesso remoto à máquina do cliente para correções."
      },
      "correta": "a",
      "explicacao": "O principal entregável de um pentest é um relatório detalhando as falhas encontradas e recomendações de correção, que é fundamental para a segurança da empresa.",
      "fonte": "ofensiva.redteam"
    },
    {
      "id": "ciberseguranca-int-15",
      "nivel": "intermediario",
      "pergunta": "Você está em um laboratório de treinamento e deseja testar a varredura de portas. Qual ferramenta deve utilizar?",
      "alternativas": {
        "a": "Wireshark, para analisar o tráfego em tempo real.",
        "b": "Nmap, para realizar a varredura de portas.",
        "c": "Metasploit, para explorar as portas abertas.",
        "d": "Burp Suite, para interceptar requisições HTTP."
      },
      "correta": "b",
      "explicacao": "O Nmap é a ferramenta apropriada para realizar a varredura de portas em um ambiente de laboratório, permitindo descobrir serviços expostos.",
      "fonte": "ofensiva.ferramentas"
    },
    {
      "id": "ciberseguranca-av-01",
      "nivel": "avancado",
      "pergunta": "Você está monitorando os logs de um sistema e nota um acesso a partir de um país que não tem relação com a operação. O que você deve fazer primeiro?",
      "alternativas": {
        "a": "Ignorar o acesso, pois pode ser um falso positivo.",
        "b": "Investigar o acesso e verificar se há atividades suspeitas associadas.",
        "c": "Bloquear imediatamente o acesso desse país.",
        "d": "Notificar a equipe de gestão sobre o acesso sem investigar."
      },
      "correta": "b",
      "explicacao": "A investigação é crucial para determinar se o acesso é realmente suspeito ou um falso positivo, permitindo uma resposta adequada.",
      "fonte": "defensiva.blueteam"
    },
    {
      "id": "ciberseguranca-av-02",
      "nivel": "avancado",
      "pergunta": "Durante um ataque de ransomware, você precisa conter o dano. Qual é a ação mais apropriada a ser tomada?",
      "alternativas": {
        "a": "Desconectar todos os sistemas da rede imediatamente.",
        "b": "Isolar os sistemas afetados para evitar a propagação do ransomware.",
        "c": "Aguardar para ver se o ataque se espalha antes de agir.",
        "d": "Tentar remover o ransomware dos sistemas afetados sem isolamento."
      },
      "correta": "b",
      "explicacao": "Isolar os sistemas afetados é uma prática recomendada para limitar o impacto do ataque e evitar que ele se espalhe.",
      "fonte": "defensiva.incidentes"
    },
    {
      "id": "ciberseguranca-av-03",
      "nivel": "avancado",
      "pergunta": "Depois de um incidente de segurança, qual etapa é frequentemente negligenciada, mas essencial para melhorar a defesa da organização?",
      "alternativas": {
        "a": "Detecção e análise do incidente.",
        "b": "Preparação para futuros incidentes.",
        "c": "Lições aprendidas a partir do incidente.",
        "d": "Erradicação da causa do incidente."
      },
      "correta": "c",
      "explicacao": "As lições aprendidas são fundamentais para evitar a repetição de incidentes e melhorar a postura de segurança da organização.",
      "fonte": "defensiva.incidentes"
    },
    {
      "id": "ciberseguranca-av-04",
      "nivel": "avancado",
      "pergunta": "Você faz parte de um SOC e recebe um alerta de múltiplas tentativas de login falhadas em um servidor. Qual deve ser sua primeira ação?",
      "alternativas": {
        "a": "Desconectar o servidor da rede para evitar acesso não autorizado.",
        "b": "Investigar a origem das tentativas de login e determinar se são maliciosas.",
        "c": "Aumentar a complexidade das senhas do servidor.",
        "d": "Informar a equipe de gestão sobre o alerta sem investigar."
      },
      "correta": "b",
      "explicacao": "Investigar a origem das tentativas de login é crucial para entender se há uma ameaça real e como responder adequadamente.",
      "fonte": "defensiva.blueteam"
    },
    {
      "id": "ciberseguranca-av-05",
      "nivel": "avancado",
      "pergunta": "Durante a resposta a um incidente, qual comportamento deve ser evitado para garantir uma resposta eficaz?",
      "alternativas": {
        "a": "Seguir o plano de resposta estabelecido.",
        "b": "Agir rapidamente sem pensar nas consequências.",
        "c": "Documentar todas as ações tomadas durante o incidente.",
        "d": "Comunicar-se claramente com a equipe sobre o que está acontecendo."
      },
      "correta": "b",
      "explicacao": "Agir por impulso pode piorar a situação, por isso seguir um plano estruturado é essencial para uma resposta eficaz.",
      "fonte": "defensiva.incidentes"
    },
    {
      "id": "ciberseguranca-av-06",
      "nivel": "avancado",
      "pergunta": "Você quer praticar suas habilidades em cibersegurança de forma legal e segura. Qual ambiente você deve escolher?",
      "alternativas": {
        "a": "Um laboratório pessoal com máquinas virtuais isoladas.",
        "b": "Um servidor de produção da empresa onde trabalha.",
        "c": "Um site de testes de segurança sem autorização.",
        "d": "Um sistema de terceiros para explorar vulnerabilidades."
      },
      "correta": "a",
      "explicacao": "Um laboratório pessoal permite praticar sem riscos, enquanto as outras opções podem ser ilegais ou prejudiciais.",
      "fonte": "carreira.pratica"
    },
    {
      "id": "ciberseguranca-av-07",
      "nivel": "avancado",
      "pergunta": "Você está se preparando para uma certificação de cibersegurança. Qual certificação é mais recomendada para quem está começando?",
      "alternativas": {
        "a": "CompTIA Security+, que cobre fundamentos de segurança.",
        "b": "Certified Ethical Hacker, que foca em técnicas de ataque.",
        "c": "CISSP, que é voltada para profissionais experientes.",
        "d": "CompTIA Network+, que é mais sobre redes do que segurança."
      },
      "correta": "a",
      "explicacao": "A CompTIA Security+ é reconhecida como uma ótima porta de entrada para iniciantes na área de segurança.",
      "fonte": "carreira.certificacoes"
    },
    {
      "id": "ciberseguranca-av-08",
      "nivel": "avancado",
      "pergunta": "Você decidiu montar um projeto de SIEM doméstico. Qual é a primeira etapa que você deve realizar?",
      "alternativas": {
        "a": "Coletar logs de um sistema em seu laboratório.",
        "b": "Configurar um servidor de produção para testes.",
        "c": "Analisar logs de sistemas de terceiros.",
        "d": "Criar um alerta sem coletar dados primeiro."
      },
      "correta": "a",
      "explicacao": "Coletar logs é essencial para a análise e criação de alertas no seu SIEM doméstico.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "ciberseguranca-av-09",
      "nivel": "avancado",
      "pergunta": "Você está buscando sua primeira oportunidade em cibersegurança. Qual estratégia é mais eficaz para se destacar?",
      "alternativas": {
        "a": "Documentar seu laboratório e desafios que resolveu.",
        "b": "Apenas focar em obter certificações de alto nível.",
        "c": "Enviar currículos sem experiência prévia.",
        "d": "Focar em redes sociais e marketing pessoal."
      },
      "correta": "a",
      "explicacao": "Documentar suas práticas e desafios mostra iniciativa e experiência concreta, o que é valorizado na área.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "ciberseguranca-av-10",
      "nivel": "avancado",
      "pergunta": "Você está participando de um CTF e precisa resolver um desafio de segurança. O que é essencial para ter sucesso?",
      "alternativas": {
        "a": "Pensar como um atacante e explorar o sistema.",
        "b": "Seguir as regras e limites da competição.",
        "c": "Usar ferramentas de ataque sem entender seu funcionamento.",
        "d": "Focar apenas na velocidade de resolução."
      },
      "correta": "b",
      "explicacao": "Seguir as regras é crucial em um CTF, garantindo que você pratique de forma legal e ética.",
      "fonte": "carreira.pratica"
    },
    {
      "id": "ciberseguranca-av-11",
      "nivel": "avancado",
      "pergunta": "Você quer se preparar para uma posição de analista de SOC júnior. Qual experiência é mais relevante?",
      "alternativas": {
        "a": "Experiência em suporte técnico e redes.",
        "b": "Apenas certificações de alto nível.",
        "c": "Conhecimento em linguagens de programação.",
        "d": "Experiência em vendas de software."
      },
      "correta": "a",
      "explicacao": "Experiência em suporte técnico e redes fornece a base necessária para trabalhar em um SOC.",
      "fonte": "carreira.entrar"
    },
    {
      "id": "ciberseguranca-av-12",
      "nivel": "avancado",
      "pergunta": "Você está criando alertas em seu SIEM doméstico. Qual tipo de evento deve gerar um alerta?",
      "alternativas": {
        "a": "Tentativas de senha falhas em sequência.",
        "b": "Acesso a um sistema em horário normal.",
        "c": "Um serviço rodando conforme esperado.",
        "d": "Logs de acesso sem anomalias."
      },
      "correta": "a",
      "explicacao": "Tentativas de senha falhas em sequência são um sinal claro de atividade suspeita e devem gerar alertas.",
      "fonte": "carreira.projeto"
    },
    {
      "id": "ciberseguranca-av-13",
      "nivel": "avancado",
      "pergunta": "Você deseja melhorar suas habilidades em cibersegurança. Qual prática é mais recomendada?",
      "alternativas": {
        "a": "Participar de plataformas de desafios como o TryHackMe.",
        "b": "Ler apenas livros sobre segurança.",
        "c": "Assistir a vídeos sem prática aplicada.",
        "d": "Focar em teoria sem aplicação prática."
      },
      "correta": "a",
      "explicacao": "Plataformas de desafios oferecem prática aplicada e são essenciais para desenvolver habilidades em cibersegurança.",
      "fonte": "carreira.pratica"
    },
    {
      "id": "ciberseguranca-av-14",
      "nivel": "avancado",
      "pergunta": "Você está considerando uma certificação avançada em cibersegurança. O que deve ser seu foco principal?",
      "alternativas": {
        "a": "Dominar os fundamentos antes de avançar.",
        "b": "Decorar respostas para o exame.",
        "c": "Focar apenas em ferramentas específicas.",
        "d": "Ignorar a prática em ambientes seguros."
      },
      "correta": "a",
      "explicacao": "Dominar os fundamentos é crucial para avançar com sucesso em certificações mais especializadas.",
      "fonte": "carreira.certificacoes"
    },
    {
      "id": "ciberseguranca-av-15",
      "nivel": "avancado",
      "pergunta": "Você quer entrar na área de cibersegurança vindo de outra função de TI. Qual é o primeiro passo mais indicado?",
      "alternativas": {
        "a": "Construir uma base sólida em sistemas e redes.",
        "b": "Buscar uma posição de alta responsabilidade diretamente.",
        "c": "Focar apenas em certificações sem prática.",
        "d": "Evitar qualquer experiência em TI antes de mudar."
      },
      "correta": "a",
      "explicacao": "Construir uma base sólida em sistemas e redes é fundamental para uma transição bem-sucedida para cibersegurança.",
      "fonte": "carreira.entrar"
    }
  ]
};

export default pool;
