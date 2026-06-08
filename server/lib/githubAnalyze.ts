import { env } from "./env";
import { fetchProfileData, fetchRepoData } from "./github";
import { analyzeProfile, analyzeRepo } from "./githubChecks";
import { buildOpenAIHeaders, DEFAULT_MODEL, OPENAI_BASE_URL } from "./openai";
import { toOpenAIStrictSchema } from "./openaiStrictSchema";
import { areaLabel, type AreaSelection } from "../../shared/areas";
import {
  GithubQualitativeSchema,
  type AnalysisMode,
  type DeterministicResult,
  type GithubAnalysisResponse,
  type GithubProfileData,
  type GithubQualitative,
  type GithubRepoData,
  type ProfileTopRepo,
} from "../../shared/github/schema";

/**
 * Orquestracao do analisador de GitHub.
 *
 * Busca os dados publicos, roda as checagens deterministicas (que produzem a
 * nota) e chama a IA SO pra parte qualitativa. A IA recebe as checagens ja
 * calculadas como fatos e o texto do README: interpreta, nao reavalia, nao
 * contradiz os fatos, nao inventa dado.
 */

const README_LIMIT = 6000;
const TOP_REPOS_LIMIT = 8;

// Retry da chamada da IA pra matar 502 intermitente.
const AI_MAX_ATTEMPTS = 3;
const AI_BACKOFF_MS = [400, 800];

const QUALITATIVE_JSON_SCHEMA = toOpenAIStrictSchema(GithubQualitativeSchema);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SYSTEM_PROMPT =
  "Voce e um mentor tecnico (um treinador) que ajuda iniciantes a melhorarem o GitHub pra conseguir oportunidades em tecnologia. Voce recebe checagens automaticas que JA foram calculadas sobre o perfil ou repositorio da pessoa, mais o texto do README, a nota, a faixa e a suficiencia da leitura. As checagens sao fatos: nao as reavalie, nao diga que um arquivo existe ou nao existe diferente do que esta nas checagens, e nao invente nenhum dado que nao esteja na entrada. Seu trabalho e interpretar esses fatos e o README e dar uma leitura util e acionavel. " +
  "A nota mede a prontidao do portfolio, nao o nivel tecnico da pessoa como dev. Deixe isso implicito no tom, nunca trate a nota como julgamento de competencia. " +
  "Tom de treinador: encorajador, gentil e honesto. Calibre pela nota e pela faixa: quanto mais baixa a nota, mais encorajador voce fica, sem suavizar a ponto de esconder o que falta. Reconheca o que ja existe antes de apontar o que falta. Nunca desmotive quem esta comecando. Nao prometa emprego nem dinheiro facil. " +
  "Enquadre cada melhoria como um proximo passo, nao como defeito ou erro. Em pontosFracos, escreva como lacunas a preencher, em tom suave, nunca como criticas duras. Em melhorias, inclua SEMPRE pelo menos um primeiro passo concreto e simples, algo que a pessoa consegue fazer hoje. " +
  "Quando a suficiencia da leitura for media ou baixa, diga com gentileza que a leitura e parcial por ter pouco material pra avaliar, e foque os proximos passos em gerar esse material (criar repositorio, adicionar README, descrever projetos), sem penalizar a pessoa por isso. " +
  "Portugues do Brasil. Nao use travessao nem meia-risca em nenhum texto, use ponto, virgula ou parenteses. No modo repo, foque em: o README deixa claro o que o projeto faz, por que existe e como rodar, e se o projeto se apresenta bem pra outro dev ou recrutador. No modo perfil, foque em: o README de perfil vende bem quem a pessoa e, no que trabalha e como contatar, e se os projetos em destaque comunicam valor. Responda apenas com o JSON do schema.";

export interface AnalyzeAiIo {
  inputChars: number;
  outputChars: number;
}

type ParsedRepo = { owner: string; repo: string };
type ParsedProfile = { login: string };

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n... (texto truncado em ${limit} caracteres)`;
}

function checksBlock(deterministic: DeterministicResult): string {
  const lines = deterministic.checks.map(
    (check) => `- [${check.status}] ${check.label}: ${check.detail}`,
  );
  return lines.join("\n");
}

function selectTopRepos(data: GithubProfileData): ProfileTopRepo[] {
  return data.repos
    .filter((repo) => !repo.fork)
    .slice()
    .sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      const aTime = a.pushedAt ? Date.parse(a.pushedAt) : 0;
      const bTime = b.pushedAt ? Date.parse(b.pushedAt) : 0;
      return bTime - aTime;
    })
    .slice(0, TOP_REPOS_LIMIT)
    .map((repo) => ({
      name: repo.name,
      description: repo.description,
      primaryLanguage: repo.primaryLanguage,
      stars: repo.stars,
    }));
}

function buildRepoPrompt(
  data: GithubRepoData,
  deterministic: DeterministicResult,
  label: string | null,
): string {
  const languages = Object.keys(data.languages);
  const areaLines = label
    ? [
        `Area alvo: ${label}.`,
        `Enquadre a leitura e os proximos passos pensando em quem quer trabalhar com ${label}, citando o que importa pra esse papel quando fizer sentido. Nao invente que o repo e dessa area se os dados nao mostrarem isso.`,
        "",
      ]
    : [];
  return [
    "Modo: repositorio",
    ...areaLines,
    `Repositorio: ${data.fullName}`,
    `URL: ${data.htmlUrl}`,
    `Linguagem principal: ${data.primaryLanguage ?? "nao informada"}`,
    `Linguagens detectadas: ${languages.length > 0 ? languages.join(", ") : "nenhuma"}`,
    `Estrelas: ${data.stars} | Forks: ${data.forks} | Issues abertas: ${data.openIssues}`,
    `Ultimo push: ${data.pushedAt ?? "desconhecido"}`,
    `Topics: ${data.topics.length > 0 ? data.topics.join(", ") : "nenhum"}`,
    `Licenca: ${data.license ?? "nenhuma"}`,
    "",
    "Checagens automaticas ja calculadas (sao fatos, nao reavalie nem contradiga):",
    checksBlock(deterministic),
    "",
    `Nota deterministica ja calculada: ${deterministic.score} de 100 (faixa ${deterministic.band}). Nao recalcule a nota.`,
    `Suficiencia da leitura: ${deterministic.suficiencia}. Use pra calibrar o tom e o quanto a leitura e parcial.`,
    "",
    "README (texto cru, pode estar truncado):",
    data.readme ? truncate(data.readme, README_LIMIT) : "(sem README)",
  ].join("\n");
}

function buildProfilePrompt(
  data: GithubProfileData,
  deterministic: DeterministicResult,
  topRepos: ProfileTopRepo[],
  label: string | null,
): string {
  const links: string[] = [];
  if (data.blog) links.push(`site ${data.blog}`);
  if (data.email) links.push(`email ${data.email}`);
  if (data.twitterUsername) links.push(`twitter ${data.twitterUsername}`);

  const topReposBlock =
    topRepos.length > 0
      ? topRepos
          .map(
            (repo) =>
              `- ${repo.name} (${repo.primaryLanguage ?? "linguagem nao informada"}, ${repo.stars} estrelas): ${repo.description ?? "sem descricao"}`,
          )
          .join("\n")
      : "(nenhum repositorio proprio em destaque)";

  const areaLines = label
    ? [
        `Area alvo: ${label}.`,
        `Enquadre a leitura e os proximos passos pensando em quem quer trabalhar com ${label}, citando o que importa pra esse papel quando fizer sentido. Nao invente que a pessoa e dessa area se os dados nao mostrarem isso.`,
        "",
      ]
    : [];
  return [
    "Modo: perfil",
    ...areaLines,
    `Usuario: ${data.login}`,
    `URL: ${data.htmlUrl}`,
    `Nome: ${data.name ?? "nao informado"}`,
    `Bio: ${data.bio ?? "nao informada"}`,
    `Empresa: ${data.company ?? "nao informada"} | Local: ${data.location ?? "nao informado"}`,
    `Links de contato: ${links.length > 0 ? links.join(", ") : "nenhum"}`,
    `Repositorios publicos: ${data.publicRepos} | Seguidores: ${data.followers}`,
    "",
    "Checagens automaticas ja calculadas (sao fatos, nao reavalie nem contradiga):",
    checksBlock(deterministic),
    "",
    `Nota deterministica ja calculada: ${deterministic.score} de 100 (faixa ${deterministic.band}). Nao recalcule a nota.`,
    `Suficiencia da leitura: ${deterministic.suficiencia}. Use pra calibrar o tom e o quanto a leitura e parcial.`,
    "",
    "Repositorios em destaque (ate 8):",
    topReposBlock,
    "",
    "README de perfil (texto cru, pode estar truncado):",
    data.profileReadme ? truncate(data.profileReadme, README_LIMIT) : "(sem README de perfil)",
  ].join("\n");
}

async function runQualitativeOnce(
  userText: string,
  onAiIo?: (io: AnalyzeAiIo) => void,
): Promise<GithubQualitative> {
  const response = await fetch(OPENAI_BASE_URL, {
    method: "POST",
    headers: buildOpenAIHeaders(env.openaiApiKey),
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.5,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "github_qualitative",
          strict: true,
          schema: QUALITATIVE_JSON_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OpenAI respondeu ${response.status}: ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("A IA nao retornou conteudo.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Resposta da IA nao veio em JSON valido: ${detail}. Trecho: ${content.slice(0, 200)}`);
  }

  const validation = GithubQualitativeSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = JSON.stringify(validation.error.issues).slice(0, 300);
    throw new Error(`Resposta da IA nao bateu com o schema esperado: ${issues}`);
  }

  onAiIo?.({ inputChars: userText.length, outputChars: content.length });
  return validation.data;
}

async function runQualitative(
  userText: string,
  onAiIo?: (io: AnalyzeAiIo) => void,
): Promise<GithubQualitative> {
  if (!env.openaiApiKey) {
    throw new Error("Servico de IA nao configurado.");
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await runQualitativeOnce(userText, onAiIo);
    } catch (err) {
      lastError = err;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(`[github-analyze] IA tentativa ${attempt}/${AI_MAX_ATTEMPTS} falhou: ${detail}`);
      if (attempt < AI_MAX_ATTEMPTS) {
        await sleep(AI_BACKOFF_MS[attempt - 1] ?? 800);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Falha ao gerar a analise da IA.");
}

/**
 * Qualitativo deterministico e caloroso pra perfil essencialmente vazio
 * (sem repo autoral). Garante o tom e evita chamar a IA a toa.
 */
function emptyProfileQualitative(): GithubQualitative {
  return {
    resumo:
      "Você está começando agora, e isso é totalmente normal. Seu GitHub ainda não tem projetos próprios publicados, então o caminho aqui é simples: começar a construir e mostrar o que é seu.",
    pontosFortes: [],
    pontosFracos: [],
    melhorias: [
      {
        prioridade: "alta",
        titulo: "Crie seu primeiro repositório próprio",
        comoFazer:
          "Suba um projeto pequeno que você já fez, ou crie um do zero, mesmo simples. O importante é ter algo seu publicado pra começar.",
      },
      {
        prioridade: "media",
        titulo: "Escreva um README de perfil",
        comoFazer:
          "Crie um repositório com o mesmo nome do seu usuário e adicione um README.md contando quem você é e no que está estudando ou trabalhando.",
      },
    ],
    readmeSugestao: null,
  };
}

/**
 * Qualitativo deterministico e caloroso pra repositorio quase vazio.
 */
function emptyRepoQualitative(): GithubQualitative {
  return {
    resumo:
      "Esse repositório está praticamente vazio, e tudo bem, todo projeto começa assim. O próximo passo é dar contexto pra quem chega.",
    pontosFortes: [],
    pontosFracos: [],
    melhorias: [
      {
        prioridade: "alta",
        titulo: "Adicione um README ao projeto",
        comoFazer:
          "Crie um README.md explicando em poucas linhas o que o projeto faz, por que existe e como rodar. É a primeira coisa que recrutadores e outros devs olham.",
      },
    ],
    readmeSugestao: null,
  };
}

export async function analyzeGithub(
  mode: AnalysisMode,
  parsed: ParsedRepo | ParsedProfile,
  area: AreaSelection,
  onAiIo?: (io: AnalyzeAiIo) => void,
): Promise<GithubAnalysisResponse> {
  const label = areaLabel(area);

  if (mode === "repo") {
    const { owner, repo } = parsed as ParsedRepo;
    const data = await fetchRepoData(owner, repo);
    const deterministic = analyzeRepo(data);
    // Repo essencialmente vazio: atalho deterministico caloroso, sem IA.
    const isEmptyRepo = deterministic.suficiencia === "baixa";
    const qualitative = isEmptyRepo
      ? emptyRepoQualitative()
      : await runQualitative(buildRepoPrompt(data, deterministic, label), onAiIo);

    return {
      mode: "repo",
      area,
      target: {
        kind: "repo",
        login: data.owner,
        repo: data.name,
        htmlUrl: data.htmlUrl,
      },
      deterministic,
      metadata: {
        primaryLanguage: data.primaryLanguage,
        languages: data.languages,
        stars: data.stars,
        forks: data.forks,
        openIssues: data.openIssues,
        pushedAt: data.pushedAt,
      },
      qualitative,
    };
  }

  const { login } = parsed as ParsedProfile;
  const data = await fetchProfileData(login);
  const deterministic = analyzeProfile(data);
  const topRepos = selectTopRepos(data);
  // Perfil sem nenhum repo autoral (zero repos ou so forks): atalho caloroso, sem IA.
  const hasAuthoredRepo = data.repos.some((repo) => !repo.fork);
  const qualitative = hasAuthoredRepo
    ? await runQualitative(buildProfilePrompt(data, deterministic, topRepos, label), onAiIo)
    : emptyProfileQualitative();

  return {
    mode: "perfil",
    area,
    target: {
      kind: "perfil",
      login: data.login,
      repo: null,
      htmlUrl: data.htmlUrl,
    },
    deterministic,
    metadata: {
      publicRepos: data.publicRepos,
      followers: data.followers,
      topRepos,
    },
    qualitative,
  };
}
