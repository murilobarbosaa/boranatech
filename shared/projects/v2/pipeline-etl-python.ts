import type { ProjetoV2Detalhe } from "./types";

// TODO(Ana): revisar todo o texto deste modulo (piloto v2, nao aprovado)
const detalhe: ProjetoV2Detalhe = {
  id: "pipeline-etl-python",
  tipoEntrega: "repo",
  briefing: {
    contexto:
      "Os dados nunca chegam prontos: vêm de um CSV exportado do sistema de vendas, de uma API pública, de uma planilha de alguém. O trabalho de engenharia de dados começa em pegar isso, limpar, padronizar e colocar num banco onde outras pessoas conseguem consultar. Este projeto é esse caminho de ponta a ponta, em Python, com log de cada etapa e a possibilidade de rodar de novo sem duplicar nada.",
    aprende: [
      "Extrair dados de CSV e de uma API pública",
      "Transformar com Pandas: tipos, nulos e nomes de coluna",
      "Validar antes de gravar",
      "Carregar num banco com SQLAlchemy",
      "Logar e tornar o pipeline reexecutável",
    ],
    preRequisitos: [
      {
        rotulo: "Python básico (funções, listas, dicionários)",
        href: "/roadmaps/engenharia-dados",
      },
      {
        rotulo: "Conhecer o DataFrame do Pandas",
        href: "/dicionario?termo=Pandas",
      },
      {
        rotulo: "SQL básico (criar tabela, inserir, consultar)",
        href: "/dicionario?termo=SQL",
      },
    ],
    tempoEstimado: { horas: [8, 16], semanas: [1, 2] },
  },
  requisitos: [
    {
      id: "extracao",
      descricao:
        "Extração de pelo menos uma fonte (CSV ou API pública), em uma função separada",
      verificacao:
        "Arquivo ou função de extração identificável na árvore e citado no README",
    },
    {
      id: "transformacao",
      descricao:
        "Pelo menos 3 regras de transformação (conversão de tipo, tratamento de nulo, padronização de nome de coluna), listadas no README",
      verificacao: "README lista as regras",
    },
    {
      id: "validacao",
      descricao:
        "Validação que impede a carga se faltar coluna obrigatória ou se o resultado vier vazio",
      verificacao: "README descreve a validação e o que acontece quando falha",
    },
    {
      id: "carga",
      descricao:
        "Carga em PostgreSQL ou SQLite via SQLAlchemy, com a tabela criada pelo próprio pipeline",
      verificacao: "requirements.txt tem sqlalchemy e o README diz qual banco",
    },
    {
      id: "log",
      descricao:
        "Log (arquivo ou stdout) com início, fim, quantidade de linhas por etapa e erros",
      verificacao: "README traz um print ou trecho do log",
    },
    {
      id: "reexecutavel",
      descricao:
        "Rodar duas vezes não duplica dados (upsert, truncate antes da carga, ou chave única), e o README explica a estratégia",
      verificacao: "README tem a seção de reexecução",
    },
    {
      id: "um-comando",
      descricao:
        "O pipeline roda inteiro com um comando (por exemplo, python pipeline.py)",
      verificacao: "README mostra o comando",
    },
    {
      id: "requirements",
      descricao: "requirements.txt com as dependências",
      verificacao: "Arquivo existe na raiz",
    },
    {
      id: "cinco-commits",
      descricao: "Pelo menos 5 commits com mensagens que dizem o que mudou",
      verificacao: "A API do GitHub lista 5 ou mais commits",
    },
  ],
  etapas: [
    {
      id: "extrair",
      titulo: "Extrair",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Escolha a fonte e escreva extract.py: lê o CSV ou chama a API e devolve um DataFrame.",
        "Imprima shape e as primeiras linhas.",
      ],
      prontoQuando: "python extract.py mostra os dados brutos.",
    },
    {
      id: "transformar",
      titulo: "Transformar",
      tempo: "2 a 4 h",
      oQueFazer: [
        "Em transform.py, padronize nomes de coluna, converta datas e números, trate nulos.",
        "Anote cada regra que aplicar: elas vão para o README.",
      ],
      prontoQuando:
        "O DataFrame sai com tipos certos e sem as sujeiras que você listou.",
    },
    {
      id: "validar",
      titulo: "Validar",
      tempo: "1 h",
      oQueFazer: [
        "Antes de carregar, confira colunas obrigatórias e se há linhas.",
        "Falha de validação para o pipeline com mensagem clara.",
      ],
      prontoQuando:
        "Remover uma coluna do CSV faz o pipeline parar antes de gravar.",
    },
    {
      id: "carregar",
      titulo: "Carregar",
      tempo: "2 a 3 h",
      oQueFazer: [
        "Em load.py, conecte com SQLAlchemy, crie a tabela e grave.",
        "Decida como rodar de novo sem duplicar.",
      ],
      prontoQuando:
        "Consultar o banco mostra os dados e rodar de novo não dobra a contagem.",
    },
    {
      id: "documentar",
      titulo: "Logar e documentar",
      tempo: "1 a 2 h",
      oQueFazer: [
        "Adicione logging com contagem por etapa.",
        "Escreva o README com o desenho E, T, L, o comando, as regras e um print do log.",
      ],
      prontoQuando: "Outra pessoa roda o pipeline só com o README.",
    },
  ],
  kit: [
    {
      tipo: "modelo",
      titulo: "Estrutura de pastas",
      nota: "extract.py, transform.py, load.py, pipeline.py (chama os três na ordem), requirements.txt, README.md, uma pasta data para o CSV de entrada.",
    },
    {
      tipo: "link",
      titulo: "BrasilAPI",
      url: "https://brasilapi.com.br",
      nota: "API pública brasileira sem cadastro: CEPs, bancos, feriados. Boa fonte para a extração.",
    },
    {
      tipo: "link",
      titulo: "Portal de dados abertos",
      url: "https://dados.gov.br",
      nota: "CSVs reais de governo. Prefira um arquivo de até alguns MB para começar.",
    },
    {
      tipo: "checklist",
      titulo: "Validações mínimas",
      nota: "Colunas obrigatórias presentes. Pelo menos 1 linha. Sem nulo na chave. Datas dentro de um intervalo plausível. Valores numéricos não negativos onde não faz sentido.",
    },
    {
      tipo: "link",
      titulo: "SQLAlchemy",
      url: "https://docs.sqlalchemy.org",
      nota: "Com Pandas, DataFrame.to_sql resolve a carga simples; upsert exige um pouco mais.",
    },
  ],
  ajuda: {
    trilha: {
      slug: "engenharia-dados",
      nodeIds: [
        "pipelines.etl",
        "pipelines.ingestao",
        "bases.python",
        "escala.qualidade",
      ],
    },
    termos: ["ETL", "Pipeline", "SQL", "Log"],
  },
  verificacaoAutomatica: [
    "repo_publico",
    "readme_existe",
    "arquivo:requirements.txt",
    "min_commits_5",
  ],
};

export default detalhe;
