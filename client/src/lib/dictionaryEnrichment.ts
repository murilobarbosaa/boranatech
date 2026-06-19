export type DictionaryLevel = "Iniciante" | "Basico" | "Avancado";

export interface DictionaryEnrichment {
  level: DictionaryLevel;
  example: string;
}

export const dictionaryLevelOrder: DictionaryLevel[] = [
  "Iniciante",
  "Basico",
  "Avancado",
];

export const dictionaryLevelMeta: Record<
  DictionaryLevel,
  { label: string; emoji: string; blurb: string }
> = {
  Iniciante: {
    label: "Iniciante",
    emoji: "🌱",
    blurb: "Palavras que voce ouve nos primeiros dias na tech.",
  },
  Basico: {
    label: "Basico",
    emoji: "🚀",
    blurb: "O vocabulario do dia a dia de quem ja poe a mao no codigo.",
  },
  Avancado: {
    label: "Avancado",
    emoji: "🧠",
    blurb: "Termos mais tecnicos que aparecem quando voce se aprofunda.",
  },
};

export const dictionaryEnrichment: Record<string, DictionaryEnrichment> = {
  "API": {
    "level": "Basico",
    "example": "Consegui puxar a cotacao do dolar no meu app sem complicacao, foi so chamar a API certa."
  },
  "Deploy": {
    "level": "Basico",
    "example": "Terminei a feature na sexta e nem pensei em fazer deploy, ninguem merece quebrar producao no fim de semana."
  },
  "Framework": {
    "level": "Basico",
    "example": "Em vez de escrever tudo do zero, escolhi um framework e adiantei semanas de trabalho."
  },
  "Git": {
    "level": "Basico",
    "example": "Quebrei tudo sem querer, mas com o Git voltei pro commit anterior e respirei aliviada."
  },
  "GitHub": {
    "level": "Basico",
    "example": "Subi meu primeiro projeto no GitHub e mandei o link pra recrutadora ver meu codigo."
  },
  "Responsividade": {
    "level": "Basico",
    "example": "Testei a responsividade no celular e percebi que o menu ficava todo baguncado na tela pequena."
  },
  "HTML": {
    "level": "Iniciante",
    "example": "Comecei pelo HTML, montando a estrutura da pagina com titulos, paragrafos e umas imagens."
  },
  "CSS": {
    "level": "Iniciante",
    "example": "Passei a tarde no CSS so pra centralizar uma div, mas no final ficou lindo."
  },
  "JavaScript": {
    "level": "Basico",
    "example": "Adicionei um JavaScript no botao e agora ele mostra um alerta quando alguem clica."
  },
  "React": {
    "level": "Basico",
    "example": "Refiz a tela com React e ficou facil reaproveitar o mesmo card em varios lugares."
  },
  "DOM": {
    "level": "Basico",
    "example": "Usei JavaScript pra mexer no DOM e trocar o texto do titulo sem recarregar a pagina."
  },
  "Endpoint": {
    "level": "Basico",
    "example": "O front estava chamando o endpoint errado, por isso a lista de usuarios vinha sempre vazia."
  },
  "REST": {
    "level": "Basico",
    "example": "Montei uma API REST simples com GET pra listar e POST pra cadastrar os produtos."
  },
  "JSON": {
    "level": "Basico",
    "example": "A API devolveu um JSON enorme, mas achei rapidinho o campo de email que eu precisava."
  },
  "Autenticação": {
    "level": "Basico",
    "example": "Implementei a autenticacao com login do Google e os usuarios amaram nao ter que criar senha nova."
  },
  "Autorização": {
    "level": "Basico",
    "example": "O usuario logou de boa, mas a autorizacao barrou ele na area do admin, exatamente como eu queria."
  },
  "Banco de dados": {
    "level": "Basico",
    "example": "Salvei os cadastros no banco de dados pra nao perder tudo quando o servidor reiniciasse."
  },
  "SQL": {
    "level": "Basico",
    "example": "Escrevi um SQL rapidinho pra listar todos os clientes que se cadastraram esse mes."
  },
  "Dataset": {
    "level": "Basico",
    "example": "Baixei um dataset de filmes no Kaggle pra treinar minhas analises de dados."
  },
  "Dashboard": {
    "level": "Basico",
    "example": "Montei um dashboard com as vendas do mes e o chefe entendeu tudo so de bater o olho."
  },
  "Machine Learning": {
    "level": "Avancado",
    "example": "Usei machine learning pra prever quais clientes iam cancelar o plano com base no historico deles."
  },
  "Modelo": {
    "level": "Avancado",
    "example": "Treinei o modelo a noite toda e de manha ele ja acertava as previsoes que eu esperava."
  },
  "Prompt": {
    "level": "Iniciante",
    "example": "Ajustei o prompt umas tres vezes ate a IA gerar o texto do jeitinho que eu queria."
  },
  "UX": {
    "level": "Basico",
    "example": "Melhorei a UX do cadastro e a galera parou de desistir no meio do formulario."
  },
  "UI": {
    "level": "Basico",
    "example": "Capricho na UI com botoes grandes e cores contrastantes deixou a tela muito mais agradavel."
  },
  "Wireframe": {
    "level": "Basico",
    "example": "Antes de codar, rabisquei um wireframe no papel pra decidir onde cada coisa ficaria na tela."
  },
  "Protótipo": {
    "level": "Basico",
    "example": "Montei um prototipo navegavel no Figma e testei com tres amigos antes de programar qualquer coisa."
  },
  "Persona": {
    "level": "Basico",
    "example": "Criamos a persona da Joana, 22 anos, pra lembrar pra quem a gente esta desenhando o app."
  },
  "Backlog": {
    "level": "Basico",
    "example": "O backlog estava gigante, entao priorizamos so o que dava mais valor pro usuario agora."
  },
  "Sprint": {
    "level": "Basico",
    "example": "Nessa sprint a meta e finalizar a tela de login, nada de pegar tarefa nova no meio."
  },
  "KPI": {
    "level": "Basico",
    "example": "Nosso KPI principal e o numero de cadastros por semana, e essa semana bateu recorde."
  },
  "Cloud": {
    "level": "Basico",
    "example": "Subi o projeto na cloud e agora qualquer pessoa acessa o site de qualquer lugar do mundo."
  },
  "Container": {
    "level": "Avancado",
    "example": "Coloquei a aplicacao num container e ela rodou igualzinho na minha maquina e no servidor."
  },
  "CI/CD": {
    "level": "Avancado",
    "example": "Configurei o CI/CD e agora cada push roda os testes e publica sozinho, sem dor de cabeca."
  },
  "Firewall": {
    "level": "Basico",
    "example": "O firewall bloqueou a porta errada e a aplicacao ficou fora do ar por alguns minutos."
  },
  "Phishing": {
    "level": "Iniciante",
    "example": "Quase cai num phishing que imitava o banco, mas notei que o link estava estranho e parei a tempo."
  },
  "Bug": {
    "level": "Iniciante",
    "example": "Achei o bug que duplicava os pedidos, era so uma virgula no lugar errado."
  },
  "Teste de regressão": {
    "level": "Avancado",
    "example": "Rodei o teste de regressao depois da mudanca e descobri que o carrinho tinha parado de somar."
  },
  "MVP": {
    "level": "Basico",
    "example": "Lancamos um MVP bem enxuto pra validar a ideia antes de investir meses no produto completo."
  },
  "Portfólio": {
    "level": "Iniciante",
    "example": "Coloquei meus tres melhores projetos no portfolio e finalmente comecei a receber respostas das vagas."
  },
  "Networking": {
    "level": "Iniciante",
    "example": "Fui num evento de tech, fiz networking e sai de la com dois contatos pra uma vaga junior."
  },
  "Algoritmo": {
    "level": "Basico",
    "example": "Escrevi um algoritmo passo a passo pra ordenar a lista de nomes em ordem alfabetica."
  },
  "Variável": {
    "level": "Iniciante",
    "example": "Guardei o nome do usuario numa variavel pra reaproveitar ele em varias partes do codigo."
  },
  "Função": {
    "level": "Iniciante",
    "example": "Criei uma funcao que calcula o desconto, agora e so chamar ela em vez de repetir a conta."
  },
  "Loop": {
    "level": "Iniciante",
    "example": "Usei um loop pra percorrer a lista e mostrar todos os produtos sem escrever um por um."
  },
  "Condicional": {
    "level": "Iniciante",
    "example": "Coloquei uma condicional pra mostrar boas-vindas se a pessoa estiver logada e o login se nao estiver."
  },
  "Array": {
    "level": "Basico",
    "example": "Joguei os nomes num array e depois foi facil percorrer todos com um loop."
  },
  "Objeto": {
    "level": "Basico",
    "example": "Guardei o usuario num objeto com nome, idade e email, tudo organizadinho em pares de chave e valor."
  },
  "TypeScript": {
    "level": "Basico",
    "example": "Migrei o projeto pra TypeScript e ele ja apontou tres bugs antes de eu rodar nada."
  },
  "Node.js": {
    "level": "Basico",
    "example": "Subi uma API rapidinha com Node.js so pra testar a integracao com o front."
  },
  "NPM": {
    "level": "Basico",
    "example": "Rodei npm install e fui tomar um cafe enquanto baixava metade da internet."
  },
  "PNPM": {
    "level": "Basico",
    "example": "Troquei pra PNPM e meu node_modules parou de comer todo o HD."
  },
  "Vite": {
    "level": "Basico",
    "example": "Com Vite o servidor sobe num piscar de olhos, nem da tempo de respirar."
  },
  "SPA": {
    "level": "Basico",
    "example": "O site e uma SPA, entao voce navega entre as telas sem aquele reload chato."
  },
  "SSR": {
    "level": "Avancado",
    "example": "Liguei SSR pra pagina chegar pronta e o Google indexar tudo bonitinho."
  },
  "SEO": {
    "level": "Basico",
    "example": "Arrumei os titulos e meta tags pra melhorar o SEO e aparecer no Google."
  },
  "Acessibilidade": {
    "level": "Basico",
    "example": "Coloquei labels e contraste decente pra cuidar da acessibilidade da tela."
  },
  "Semântica": {
    "level": "Basico",
    "example": "Troquei aquele monte de div por tags semanticas e o HTML ficou bem mais limpo."
  },
  "Flexbox": {
    "level": "Basico",
    "example": "Resolvi o alinhamento do menu com flexbox em duas linhas de CSS."
  },
  "Grid": {
    "level": "Basico",
    "example": "Montei a galeria de cards com grid e ela se ajusta sozinha em qualquer tela."
  },
  "Componente": {
    "level": "Basico",
    "example": "Criei um componente de botao e agora reuso ele no app inteiro."
  },
  "Props": {
    "level": "Basico",
    "example": "Passei o titulo por props e o mesmo card serve pra varias secoes."
  },
  "State": {
    "level": "Basico",
    "example": "Guardei o contador no state e a tela atualiza sozinha a cada clique."
  },
  "Hook": {
    "level": "Basico",
    "example": "Usei o hook useEffect pra buscar os dados assim que a tela carrega."
  },
  "Roteamento": {
    "level": "Basico",
    "example": "Configurei o roteamento pra cada secao ter sua URL tipo /perfil e /cursos."
  },
  "Formulário": {
    "level": "Iniciante",
    "example": "Montei o formulario de cadastro com nome, email e senha numa tarde."
  },
  "Validação": {
    "level": "Basico",
    "example": "Coloquei validacao no email pra ninguem enviar texto sem arroba."
  },
  "CRUD": {
    "level": "Basico",
    "example": "Fiz o CRUD de tarefas: criar, listar, editar e apagar, o pacote completo."
  },
  "HTTP": {
    "level": "Basico",
    "example": "O front conversa com o back via HTTP, mandando pedido e esperando resposta."
  },
  "HTTPS": {
    "level": "Iniciante",
    "example": "So coloco senha em site com HTTPS, aquele cadeadinho na barra do navegador."
  },
  "Request": {
    "level": "Basico",
    "example": "Disparei um request pra API e fiquei olhando a aba network pra ver a resposta."
  },
  "Response": {
    "level": "Basico",
    "example": "A response veio vazia, ai descobri que o filtro estava errado no servidor."
  },
  "Status code": {
    "level": "Basico",
    "example": "Vi um status code 404 e ja sabia: a rota estava com o nome trocado."
  },
  "Middleware": {
    "level": "Avancado",
    "example": "Criei um middleware que confere o token antes de deixar a rota responder."
  },
  "Servidor": {
    "level": "Iniciante",
    "example": "O servidor caiu de madrugada e o site ficou fora do ar ate alguem reiniciar."
  },
  "Cliente": {
    "level": "Basico",
    "example": "O navegador e o cliente que pede os dados, o servidor so responde."
  },
  "Cache": {
    "level": "Basico",
    "example": "Liguei o cache e a pagina que demorava tres segundos abriu na hora."
  },
  "Cookie": {
    "level": "Iniciante",
    "example": "O cookie guarda meu login, por isso o site lembra de mim quando volto."
  },
  "Token": {
    "level": "Basico",
    "example": "O app guarda um token pra provar que eu ja fiz login a cada requisicao."
  },
  "JWT": {
    "level": "Avancado",
    "example": "Decodifiquei o JWT e vi que ele carrega o id do usuario e a data de expiracao."
  },
  "OAuth": {
    "level": "Avancado",
    "example": "Coloquei login com OAuth pra galera entrar usando a conta do Google."
  },
  "Hash": {
    "level": "Avancado",
    "example": "A senha vira hash no banco, entao nem eu consigo ver a senha original."
  },
  "Criptografia": {
    "level": "Basico",
    "example": "A criptografia embaralha os dados pra ninguem ler nada sem a chave certa."
  },
  "Vulnerabilidade": {
    "level": "Basico",
    "example": "Achei uma vulnerabilidade no formulario que deixava passar codigo malicioso."
  },
  "Pentest": {
    "level": "Avancado",
    "example": "O time fez um pentest e listou cinco brechas pra gente corrigir antes do lancamento."
  },
  "SOC": {
    "level": "Avancado",
    "example": "O pessoal do SOC monitora os alertas de seguranca de madrugada e fim de semana."
  },
  "Malware": {
    "level": "Iniciante",
    "example": "Nao baixa esse anexo estranho, pode ser malware tentando roubar tua senha."
  },
  "Ransomware": {
    "level": "Basico",
    "example": "A empresa levou um ransomware e ficou com os arquivos travados pedindo resgate."
  },
  "LGPD": {
    "level": "Basico",
    "example": "Por causa da LGPD a gente so coleta o dado que realmente precisa do usuario."
  },
  "Tabela": {
    "level": "Basico",
    "example": "Criei uma tabela de usuarios com colunas pra nome, email e data de cadastro."
  },
  "Registro": {
    "level": "Basico",
    "example": "Cada novo cadastro vira um registro na tabela, uma linha por pessoa."
  },
  "Chave primária": {
    "level": "Basico",
    "example": "Coloquei um id como chave primaria pra cada usuario ter um numero unico."
  },
  "Chave estrangeira": {
    "level": "Avancado",
    "example": "Liguei o pedido ao cliente com uma chave estrangeira apontando pro id dele."
  },
  "JOIN": {
    "level": "Avancado",
    "example": "Fiz um JOIN entre pedidos e clientes pra ver o nome de quem comprou."
  },
  "NoSQL": {
    "level": "Avancado",
    "example": "Guardei os dados num banco NoSQL porque o formato mudava demais pra usar tabela."
  },
  "ETL": {
    "level": "Avancado",
    "example": "Montei um ETL que extrai os dados crus, limpa e joga tudo no banco final."
  },
  "Data Lake": {
    "level": "Avancado",
    "example": "Joga tudo no Data Lake primeiro, depois a gente decide o que vira analise."
  },
  "Data Warehouse": {
    "level": "Avancado",
    "example": "O time de BI puxa os relatorios direto do Data Warehouse toda segunda."
  },
  "BI": {
    "level": "Basico",
    "example": "Montei um dashboard de BI e agora o chefe acompanha as vendas sozinho."
  },
  "Pandas": {
    "level": "Basico",
    "example": "Abri o CSV no Pandas e em duas linhas ja limpei as colunas baguncadas."
  },
  "Notebook": {
    "level": "Basico",
    "example": "Testei o grafico rapidinho no notebook antes de jogar no codigo de verdade."
  },
  "Métrica": {
    "level": "Basico",
    "example": "A metrica de churn subiu, melhor entender o que aconteceu essa semana."
  },
  "Correlação": {
    "level": "Avancado",
    "example": "Tem correlacao entre sorvete e afogamento, mas um nao causa o outro, e o calor."
  },
  "Média": {
    "level": "Iniciante",
    "example": "A media de notas da turma deu sete, ningem reprovou dessa vez."
  },
  "Mediana": {
    "level": "Basico",
    "example": "Usei a mediana porque um salario gigante estava distorcendo a media toda."
  },
  "Overfitting": {
    "level": "Avancado",
    "example": "O modelo decorou o treino e deu overfitting, foi pessimo nos dados novos."
  },
  "Treinamento": {
    "level": "Basico",
    "example": "Deixei o treinamento rodando a noite toda e de manha o modelo estava pronto."
  },
  "Inferência": {
    "level": "Avancado",
    "example": "Na inferencia o modelo so responde, todo o aprendizado pesado ja ficou para tras."
  },
  "Rede neural": {
    "level": "Avancado",
    "example": "Treinei uma rede neural pequena que ja reconhece se a foto tem gato ou cachorro."
  },
  "Deep Learning": {
    "level": "Avancado",
    "example": "Com deep learning o reconhecimento de voz do app ficou bem mais esperto."
  },
  "LLM": {
    "level": "Basico",
    "example": "Pluguei um LLM no suporte e ele ja responde as duvidas mais comuns sozinho."
  },
  "Fine-tuning": {
    "level": "Avancado",
    "example": "Fiz fine-tuning com nossos chamados e o modelo passou a falar a lingua da empresa."
  },
  "Embedding": {
    "level": "Avancado",
    "example": "Transformei cada texto em embedding e a busca passou a achar por significado."
  },
  "RAG": {
    "level": "Avancado",
    "example": "Montei um RAG que busca nos nossos PDFs antes da IA responder o cliente."
  },
  "Alucinação": {
    "level": "Basico",
    "example": "A IA inventou uma lei que nao existe, classica alucinacao, sempre confira."
  },
  "Docker": {
    "level": "Basico",
    "example": "Subi a aplicacao no Docker e funcionou igualzinho na maquina de todo mundo."
  },
  "Kubernetes": {
    "level": "Avancado",
    "example": "O Kubernetes sobe mais containers sozinho quando o trafego explode na promo."
  },
  "Pipeline": {
    "level": "Basico",
    "example": "Dei push e o pipeline testou, buildou e publicou sem eu tocar em nada."
  },
  "Build": {
    "level": "Basico",
    "example": "O build quebrou por causa de um import errado, vou corrigir e rodar de novo."
  },
  "Ambiente de produção": {
    "level": "Basico",
    "example": "Cuidado, isso aqui ja e ambiente de producao, quem mexe sao usuarios reais."
  },
  "Ambiente de homologação": {
    "level": "Basico",
    "example": "Testa primeiro no ambiente de homologacao, se passar a gente libera pra todos."
  },
  "Log": {
    "level": "Iniciante",
    "example": "Abri o log e o erro estava bem ali, faltava uma virgula boba no codigo."
  },
  "Monitoramento": {
    "level": "Basico",
    "example": "O monitoramento apitou de madrugada avisando que o servidor estava lento."
  },
  "Observabilidade": {
    "level": "Avancado",
    "example": "Com boa observabilidade eu vejo logs, metricas e traces e acho o problema rapido."
  },
  "SRE": {
    "level": "Avancado",
    "example": "O pessoal de SRE automatizou o deploy e o sistema quase nunca mais cai."
  },
  "IaC": {
    "level": "Avancado",
    "example": "Com IaC eu recrio toda a infra a partir de um arquivo versionado no Git."
  },
  "Terraform": {
    "level": "Avancado",
    "example": "Mudei uma linha no Terraform e ele criou o servidor na nuvem sozinho."
  },
  "Serverless": {
    "level": "Avancado",
    "example": "Subi a funcao em serverless e nem precisei pensar em gerenciar servidor."
  },
  "AWS": {
    "level": "Basico",
    "example": "Hospedei o projeto na AWS e ele aguenta bem os picos de acesso."
  },
  "Azure": {
    "level": "Basico",
    "example": "A empresa usa Azure, entao subi nossa API la na nuvem da Microsoft."
  },
  "GCP": {
    "level": "Basico",
    "example": "Coloquei o banco no GCP porque o resto do time ja trabalhava no Google Cloud."
  },
  "DNS": {
    "level": "Basico",
    "example": "Apontei o DNS pro novo servidor e em algumas horas o site ja respondia."
  },
  "Domínio": {
    "level": "Iniciante",
    "example": "Comprei o dominio boralanca.com.br e agora falta so subir o site."
  },
  "Hospedagem": {
    "level": "Iniciante",
    "example": "Contratei uma hospedagem baratinha so pra deixar meu portfolio no ar."
  },
  "Latência": {
    "level": "Basico",
    "example": "A latencia do servidor la fora era alta, troquei pra um mais perto e melhorou."
  },
  "Escalabilidade": {
    "level": "Avancado",
    "example": "Pensei na escalabilidade desde o inicio, dobrou o trafego e nem suamos."
  },
  "Arquitetura": {
    "level": "Basico",
    "example": "Antes de codar, desenhei a arquitetura pra ver como as partes se conversam."
  },
  "Monolito": {
    "level": "Avancado",
    "example": "Comecamos com um monolito mesmo, e mais simples de subir e tocar no inicio."
  },
  "Microsserviços": {
    "level": "Avancado",
    "example": "Quebramos o sistema em microsservicos pra cada time cuidar do seu pedaco."
  },
  "Fila": {
    "level": "Basico",
    "example": "Joguei o envio de email numa fila pra nao travar a tela do usuario."
  },
  "WebSocket": {
    "level": "Avancado",
    "example": "Usei WebSocket no chat e as mensagens aparecem na hora, sem precisar atualizar."
  },
  "Teste unitário": {
    "level": "Basico",
    "example": "Escrevi um teste unitario pra aquela funcao de calculo e ja peguei um bug."
  },
  "Teste de integração": {
    "level": "Basico",
    "example": "O teste de integracao confirmou que a API e o banco conversam direitinho."
  },
  "Teste E2E": {
    "level": "Basico",
    "example": "O teste E2E simula o usuario do login ate o pagamento, igual na vida real."
  },
  "Teste manual": {
    "level": "Basico",
    "example": "Antes de subir a feature, fiz um teste manual clicando em tudo pra ver se nada quebrava."
  },
  "Automação de testes": {
    "level": "Avancado",
    "example": "Coloquei automação de testes no projeto e agora o robô confere tudo enquanto eu tomo café."
  },
  "Caso de teste": {
    "level": "Basico",
    "example": "Escrevi um caso de teste pro login: usuário certo entra, senha errada bloqueia."
  },
  "Critério de aceite": {
    "level": "Basico",
    "example": "A tarefa só fecha quando bate todo critério de aceite que combinamos com o PO."
  },
  "Smoke test": {
    "level": "Avancado",
    "example": "Depois do deploy rodo um smoke test rápido só pra ver se o site ainda abre."
  },
  "Design System": {
    "level": "Basico",
    "example": "Com o Design System pronto, todo botão do app já nasce com a mesma cara."
  },
  "Auto-layout": {
    "level": "Basico",
    "example": "Liguei o auto-layout no Figma e os elementos se ajustaram sozinhos quando aumentei o texto."
  },
  "Jornada do usuário": {
    "level": "Basico",
    "example": "Mapeei a jornada do usuário do cadastro ao primeiro pedido pra achar onde ele desiste."
  },
  "Pesquisa com usuários": {
    "level": "Basico",
    "example": "Fiz pesquisa com usuários e descobri que ninguém entendia aquele ícone que eu amava."
  },
  "Usabilidade": {
    "level": "Iniciante",
    "example": "A usabilidade tá tão boa que minha avó conseguiu usar o app sem perguntar nada."
  },
  "Heurísticas": {
    "level": "Avancado",
    "example": "Avaliei a tela usando heurísticas e já achei três problemas de consistência."
  },
  "Benchmark": {
    "level": "Basico",
    "example": "Fiz um benchmark com três concorrentes pra ver como eles resolvem o checkout."
  },
  "Discovery": {
    "level": "Basico",
    "example": "Estamos na fase de discovery, ainda entendendo o problema antes de codar qualquer coisa."
  },
  "Delivery": {
    "level": "Basico",
    "example": "Saímos do discovery e entramos no delivery, agora é construir e entregar."
  },
  "Stakeholder": {
    "level": "Basico",
    "example": "Apresentei o protótipo pros stakeholders e todo mundo aprovou a direção."
  },
  "Roadmap": {
    "level": "Basico",
    "example": "Olha o roadmap: esse trimestre sai o pagamento, no próximo vem o app mobile."
  },
  "Kanban": {
    "level": "Basico",
    "example": "No nosso Kanban arrasto o cartão de a fazer pra fazendo assim que começo a tarefa."
  },
  "Scrum": {
    "level": "Basico",
    "example": "O time roda Scrum com sprints de duas semanas e daily toda manhã."
  },
  "Daily": {
    "level": "Basico",
    "example": "Na daily de hoje avisei que tava travado esperando o acesso ao banco."
  },
  "Retrospectiva": {
    "level": "Basico",
    "example": "Na retrospectiva combinamos revisar PR mais rápido pra ninguém ficar bloqueado."
  },
  "Product Owner": {
    "level": "Basico",
    "example": "O Product Owner priorizou o backlog e definiu o que entra na próxima sprint."
  },
  "Product Manager": {
    "level": "Basico",
    "example": "A Product Manager juntou dado de usuário e meta de negócio pra decidir a próxima feature."
  },
  "Issue": {
    "level": "Basico",
    "example": "Abri uma issue no GitHub descrevendo o bug com print e passos pra reproduzir."
  },
  "Pull Request": {
    "level": "Basico",
    "example": "Mandei o Pull Request e marquei dois colegas pra revisar antes do merge."
  },
  "Branch": {
    "level": "Basico",
    "example": "Criei uma branch nova só pra essa feature e deixei a main intacta."
  },
  "Commit": {
    "level": "Basico",
    "example": "Fiz um commit pequeno com a mensagem certinha pra ficar fácil de entender depois."
  },
  "Merge": {
    "level": "Basico",
    "example": "Depois da revisão aprovada, fiz o merge da minha branch na main."
  },
  "Conflito de merge": {
    "level": "Basico",
    "example": "Deu conflito de merge porque dois mexeram na mesma linha, tive que escolher na mão."
  },
  "README": {
    "level": "Basico",
    "example": "Caprichei no README explicando como rodar o projeto em três passos."
  },
  "Open Source": {
    "level": "Basico",
    "example": "Mandei minha primeira contribuição pra um projeto open source e foi aceita."
  },
  "Freelancer": {
    "level": "Iniciante",
    "example": "Peguei meu primeiro job como freelancer fazendo um site pra uma confeitaria."
  },
  "Estágio": {
    "level": "Iniciante",
    "example": "Comecei o estágio essa semana e já tô aprendendo como o time trabalha no dia a dia."
  },
  "Júnior": {
    "level": "Iniciante",
    "example": "Entrei como dev júnior e tenho um sênior me acompanhando nas primeiras tarefas."
  },
  "Hard skills": {
    "level": "Iniciante",
    "example": "Nas hard skills coloquei JavaScript, Git e SQL no meu currículo."
  },
  "Soft skills": {
    "level": "Iniciante",
    "example": "Numa entrevista as soft skills pesam: saber comunicar e trabalhar em time conta muito."
  },
  "Mentoria": {
    "level": "Iniciante",
    "example": "Tô numa mentoria e meu mentor me ajudou a montar um plano de estudos do zero."
  },
  "Currículo": {
    "level": "Iniciante",
    "example": "Atualizei o currículo com meus projetos do GitHub e já comecei a aplicar pra vagas."
  },
  "LinkedIn": {
    "level": "Iniciante",
    "example": "Postei meu projeto no LinkedIn e um recrutador chamou no mesmo dia."
  },
  "React Native": {
    "level": "Basico",
    "example": "Com React Native escrevi o app uma vez e ele rodou no Android e no iPhone."
  },
  "Flutter": {
    "level": "Basico",
    "example": "Fiz meu primeiro app em Flutter usando Dart e amei o hot reload."
  },
  "APK": {
    "level": "Basico",
    "example": "Gerei o APK e mandei no zap pra galera testar o app no Android."
  },
  "App Store": {
    "level": "Iniciante",
    "example": "Publiquei meu app na App Store e agora qualquer um baixa no iPhone."
  },
  "Play Store": {
    "level": "Iniciante",
    "example": "Subi o app na Play Store e em poucas horas já tinha os primeiros downloads."
  },
  "Expo": {
    "level": "Basico",
    "example": "Com o Expo testei meu app React Native no celular só lendo um QR code."
  },
  "Firebase": {
    "level": "Basico",
    "example": "Usei o Firebase pra login e banco e nem precisei montar servidor."
  },
  "GraphQL": {
    "level": "Avancado",
    "example": "Com GraphQL peço só nome e foto numa requisição só, sem trazer dado que não uso."
  },
  "gRPC": {
    "level": "Avancado",
    "example": "Conectei dois microsserviços com gRPC e a comunicação ficou rápida e tipada."
  },
  "ORM": {
    "level": "Avancado",
    "example": "Com o ORM eu salvo um objeto no código e ele vira linha no banco sem eu escrever SQL."
  },
  "Migração": {
    "level": "Basico",
    "example": "Rodei a migração e a tabela de usuários ganhou a coluna nova sem dor de cabeça."
  },
  "Índice (banco)": {
    "level": "Avancado",
    "example": "Criei um índice na coluna email e a busca que demorava segundos virou instantânea."
  },
  "Transação": {
    "level": "Basico",
    "example": "Coloquei tudo numa transação, então se um passo falhar nada é salvo pela metade."
  },
  "Deadlock": {
    "level": "Avancado",
    "example": "Deu deadlock porque duas requisições travaram esperando uma a outra liberar a linha."
  },
  "Normalização": {
    "level": "Avancado",
    "example": "Apliquei normalização pra não repetir o endereço do cliente em três tabelas diferentes."
  },
  "Denormalização": {
    "level": "Avancado",
    "example": "Fiz uma denormalização aqui pra evitar cinco joins e deixar o dashboard mais rápido."
  },
  "Mensageria": {
    "level": "Avancado",
    "example": "Joguei o envio de email na mensageria pra não travar a resposta da requisição."
  },
  "Pub/Sub": {
    "level": "Avancado",
    "example": "Com Pub/Sub, o serviço publica o evento e quem quiser se inscreve pra ouvir."
  },
  "Idempotência": {
    "level": "Avancado",
    "example": "Garanti idempotência no webhook, então se o pagamento chegar duas vezes não cobra de novo."
  },
  "Rate limit": {
    "level": "Basico",
    "example": "Tomei rate limit da API porque mandei requisição demais em poucos segundos."
  },
  "CORS": {
    "level": "Basico",
    "example": "Deu erro de CORS porque o front em outra porta tentou chamar a API sem permissão."
  },
  "CSRF": {
    "level": "Avancado",
    "example": "Adicionei token anti CSRF pra ninguém disparar uma ação logada sem a pessoa saber."
  },
  "XSS": {
    "level": "Avancado",
    "example": "Escapei o input do usuário pra evitar XSS e ninguém injetar script na página."
  },
  "SQL injection": {
    "level": "Avancado",
    "example": "Usei query parametrizada pra fechar a porta pra SQL injection no formulário de login."
  },
  "DDoS": {
    "level": "Basico",
    "example": "O site caiu por um ataque DDoS, foi tráfego falso demais batendo de uma vez."
  },
  "VPN": {
    "level": "Iniciante",
    "example": "Liguei a VPN da empresa pra conseguir acessar o servidor interno de casa."
  },
  "CDN": {
    "level": "Basico",
    "example": "Coloquei as imagens na CDN e o site abre rápido até pra quem está longe do servidor."
  },
  "Load balancer": {
    "level": "Avancado",
    "example": "O load balancer divide as requisições entre os servidores pra nenhum ficar sobrecarregado."
  },
  "Reverse proxy": {
    "level": "Avancado",
    "example": "Botei um reverse proxy na frente pra cuidar do TLS e mandar cada rota pro app certo."
  },
  "IP": {
    "level": "Iniciante",
    "example": "Pra acessar a impressora da rede eu digitei o IP dela direto no navegador."
  },
  "TCP/IP": {
    "level": "Basico",
    "example": "É o TCP/IP que garante que os dados cheguem certinhos e na ordem pela internet."
  },
  "UDP": {
    "level": "Avancado",
    "example": "A call usa UDP porque é melhor perder um quadro do que travar esperando o pacote."
  },
  "SSH": {
    "level": "Basico",
    "example": "Entrei no servidor por SSH e subi a nova versão direto pelo terminal."
  },
  "YAML": {
    "level": "Basico",
    "example": "Configurei o pipeline num arquivo YAML, é bem mais fácil de ler que JSON."
  },
  "Regex": {
    "level": "Basico",
    "example": "Montei uma regex pra validar se o email digitado tem cara de email mesmo."
  },
  "Timezone": {
    "level": "Basico",
    "example": "Esqueci do timezone e o agendamento disparou três horas mais cedo pro pessoal de fora."
  },
  "Unicode": {
    "level": "Basico",
    "example": "Graças ao Unicode dá pra salvar emoji e ideograma sem o texto virar caractere quebrado."
  },
  "UTF-8": {
    "level": "Basico",
    "example": "Salvei o arquivo em UTF-8 e os acentos pararam de aparecer todos bagunçados."
  },
  "Semáforo": {
    "level": "Avancado",
    "example": "Usei um semáforo pra deixar no máximo cinco tarefas baixando arquivo ao mesmo tempo."
  },
  "Dead letter queue": {
    "level": "Avancado",
    "example": "As mensagens que falharam foram parar na dead letter queue pra eu investigar depois."
  },
  "Feature flag": {
    "level": "Basico",
    "example": "Liguei a feature flag só pra uns usuários antes de soltar o recurso pra geral."
  },
  "A/B test": {
    "level": "Basico",
    "example": "Rodamos um A/B test e o botão verde converteu mais que o azul, então ficou o verde."
  },
  "OKR": {
    "level": "Basico",
    "example": "No OKR do trimestre o objetivo é crescer base de usuários e dobrar o engajamento."
  },
  "SLA": {
    "level": "Basico",
    "example": "O SLA do fornecedor promete o serviço no ar 99,9% do tempo, senão tem multa."
  },
  "SLO": {
    "level": "Avancado",
    "example": "Nosso SLO é responder em menos de 300ms, e estamos batendo a meta esse mês."
  },
  "Incidente": {
    "level": "Basico",
    "example": "Abriram um incidente às duas da manhã porque o checkout parou de processar pagamento."
  },
  "Postmortem": {
    "level": "Basico",
    "example": "No postmortem a gente mapeou a causa da queda e listou o que fazer pra não repetir."
  },
  "TDD": {
    "level": "Basico",
    "example": "Faço TDD: escrevo o teste que falha primeiro e só depois o código que faz ele passar."
  },
  "BDD": {
    "level": "Avancado",
    "example": "Com BDD a gente descreve o comportamento em frases que até o pessoal de negócio entende."
  },
  "Mock": {
    "level": "Basico",
    "example": "Criei um mock da API de pagamento pra testar sem cobrar ninguém de verdade."
  },
  "Stub": {
    "level": "Basico",
    "example": "Usei um stub que sempre devolve a mesma resposta pra isolar o código que estou testando."
  },
  "Faker / dado sintético": {
    "level": "Basico",
    "example": "Populei o banco de teste com Faker pra ter nomes realistas sem usar dado de cliente real."
  },
  "Golden file": {
    "level": "Avancado",
    "example": "Comparei a saída com o golden file e qualquer diferença acende o alerta no teste."
  },
  "Flaky test": {
    "level": "Basico",
    "example": "Esse flaky test passa nove vezes e falha na décima sem eu ter mexido em nada."
  },
  "Snapshot": {
    "level": "Basico",
    "example": "O teste de snapshot quebrou porque mudei o componente, aí atualizei o arquivo de referência."
  },
  "Lighthouse": {
    "level": "Basico",
    "example": "Rodei o Lighthouse e ele apontou imagens pesadas derrubando a nota de performance."
  },
  "Core Web Vitals": {
    "level": "Basico",
    "example": "Melhorei os Core Web Vitals e o Google parou de reclamar do carregamento da home."
  },
  "Bundle": {
    "level": "Basico",
    "example": "Meu bundle estava gigante, então separei em pedaços pra página carregar só o que precisa."
  },
  "Tree shaking": {
    "level": "Avancado",
    "example": "O tree shaking tirou aquela lib gigante que eu importei e nem usei, o bundle ficou bem menor."
  },
  "Code splitting": {
    "level": "Avancado",
    "example": "Fiz code splitting na rota de admin, aí quem só usa o site público nem baixa aquele código."
  },
  "Hydration": {
    "level": "Avancado",
    "example": "A página apareceu rápido, mas só clicou depois que a hydration rodou e ligou o JavaScript."
  },
  "WebAssembly": {
    "level": "Avancado",
    "example": "Compilei um trecho em Rust pra WebAssembly e o processamento de imagem voou no navegador."
  },
  "Canvas": {
    "level": "Basico",
    "example": "Desenhei o gráfico de pizza direto no canvas em vez de usar uma biblioteca pronta."
  },
  "WebGL": {
    "level": "Avancado",
    "example": "Coloquei um globo 3D girando na home usando WebGL, ficou liso até no celular."
  },
  "Game loop": {
    "level": "Basico",
    "example": "O game loop atualiza a posição da nave e redesenha a tela umas 60 vezes por segundo."
  },
  "Shader": {
    "level": "Avancado",
    "example": "Escrevi um shader pra deixar a água do jogo brilhando, rodou tudo na GPU."
  },
  "GDPR": {
    "level": "Basico",
    "example": "Como o site tem usuário na Europa, a gente teve que se adequar ao GDPR antes de lançar."
  },
  "Consentimento": {
    "level": "Iniciante",
    "example": "Aquele banner de cookies aparece pra pegar o consentimento antes de rastrear qualquer coisa."
  },
  "PII": {
    "level": "Basico",
    "example": "Nunca jogue PII como CPF e e-mail no log, senão vaza dado sensível sem querer."
  },
  "Anonimização": {
    "level": "Avancado",
    "example": "Fiz a anonimização dos dados antes de mandar pra análise, assim ninguém descobre quem é quem."
  },
  "Blockchain": {
    "level": "Basico",
    "example": "Estudei como a blockchain guarda cada transação num bloco que ninguém consegue alterar depois."
  },
  "Smart contract": {
    "level": "Avancado",
    "example": "O smart contract libera o pagamento sozinho assim que as duas partes confirmam o acordo."
  },
  "NFT": {
    "level": "Basico",
    "example": "Aquela arte digital virou NFT, então dá pra provar quem é o dono original dela."
  },
  "Ledger": {
    "level": "Basico",
    "example": "O ledger registra cada movimentação em ordem, então dá pra auditar tudo depois."
  },
  "IoT": {
    "level": "Basico",
    "example": "Montei um projeto de IoT em casa: o sensor avisa no celular quando a planta precisa de água."
  },
  "Firmware": {
    "level": "Basico",
    "example": "Atualizei o firmware do roteador e o WiFi parou de cair toda hora."
  },
  "RTOS": {
    "level": "Avancado",
    "example": "No marca-passo eles usam um RTOS porque a resposta tem que ser no tempo certo, sempre."
  },
  "CAD": {
    "level": "Basico",
    "example": "Modelei a peça no CAD antes de mandar pra impressora 3D imprimir o protótipo."
  },
  "Gerber": {
    "level": "Avancado",
    "example": "Exportei os arquivos Gerber e mandei pra fábrica produzir minha placa de circuito."
  },
  "CMS": {
    "level": "Basico",
    "example": "O cliente edita os textos do site sozinho pelo CMS, sem precisar me chamar."
  },
  "Headless CMS": {
    "level": "Avancado",
    "example": "Usei um headless CMS, aí o conteúdo vem por API e eu monto o visual do jeito que quiser."
  },
  "Webhook": {
    "level": "Basico",
    "example": "Configurei um webhook pra cair uma mensagem no Slack toda vez que alguém faz uma compra."
  },
  "Cron job": {
    "level": "Basico",
    "example": "Botei um cron job pra rodar o backup todo dia de madrugada, sem eu precisar lembrar."
  },
  "GDScript": {
    "level": "Basico",
    "example": "Aprendi GDScript no Godot e em uma tarde já tinha um joguinho de plataforma rodando."
  },
  "Unity": {
    "level": "Basico",
    "example": "Comecei meu primeiro jogo na Unity arrastando os objetos direto no editor visual."
  },
  "Unreal Engine": {
    "level": "Avancado",
    "example": "O pessoal usou a Unreal Engine pra deixar os gráficos do jogo com cara de cinema."
  },
  "Sprite": {
    "level": "Basico",
    "example": "Troquei o sprite do herói por um novo e ele já apareceu com a roupa diferente no jogo."
  },
  "Collider": {
    "level": "Avancado",
    "example": "Sem o collider no chão, o personagem atravessava o cenário e caía pro vazio."
  },
  "Ray tracing": {
    "level": "Avancado",
    "example": "Liguei o ray tracing e os reflexos nas poças do jogo ficaram absurdos de realistas."
  },
  "Áudio sampling": {
    "level": "Avancado",
    "example": "O áudio sampling captura a onda do som em vários pontinhos pra virar arquivo digital."
  },
  "Codec": {
    "level": "Basico",
    "example": "O vídeo não abria porque faltava o codec H.264 instalado na máquina."
  },
  "FFT": {
    "level": "Avancado",
    "example": "Usei FFT pra separar as frequências e descobrir qual nota estava tocando no áudio."
  },
  "Latência de áudio": {
    "level": "Avancado",
    "example": "A latência de áudio tava tão alta que minha voz chegava atrasada na call, parecia eco."
  },
  "Compliance": {
    "level": "Basico",
    "example": "O time de compliance pediu auditoria antes de a gente lançar o produto no banco."
  },
  "On-call": {
    "level": "Basico",
    "example": "Tô de on-call essa semana, então durmo de olho no celular caso o sistema caia de madrugada."
  },
  "Runbook": {
    "level": "Basico",
    "example": "Quando o servidor caiu, segui o runbook passo a passo e resolvi sem entrar em pânico."
  },
  "RFC": {
    "level": "Avancado",
    "example": "Antes de mudar todo o banco, escrevi uma RFC mostrando as opções e o time discutiu junto."
  },
  "ADR": {
    "level": "Avancado",
    "example": "Registrei num ADR o porquê de a gente ter escolhido Postgres, pra ninguém perguntar depois."
  },
  "Diagrama C4": {
    "level": "Avancado",
    "example": "Desenhei um diagrama C4 pra explicar o sistema do contexto geral até os detalhes do código."
  },
  "GD&T": {
    "level": "Avancado",
    "example": "O desenho da peça usa GD&T pra dizer exatamente quanto cada medida pode variar."
  },
  "EPC": {
    "level": "Avancado",
    "example": "Cada caixa do estoque tem um EPC na etiqueta RFID, então o leitor rastreia tudo na entrada."
  }
};
