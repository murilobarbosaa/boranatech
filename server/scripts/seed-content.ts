import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

import {
  areasTI,
  cursosGratuitos,
  plataformas,
  projetos,
  roadmaps,
} from "../../client/src/lib/data";
import { technologies } from "../../client/src/lib/technologyData";

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=");
    }
  }
}

loadEnvFile();

/**
 * Seletor de seeder: `--only=projects` ou `--only projects`, aceitando lista
 * separada por virgula (`--only=projects,platforms`). Sem o flag, roda os
 * seis, na ordem de sempre.
 *
 * Existe porque os seeders NAO sao independentes em risco. `seedRoadmaps`
 * apaga e reinsere `roadmap_steps`, e essa tabela e lida em runtime pelo
 * verificador de badges (server/lib/badgeChecker.ts conta as etapas pra
 * decidir "trilha concluida"), por server/routes/me.ts e pelo pool de
 * contexto do usuario. Atualizar a tabela `projects` depois de uma mudanca de
 * catalogo nao tem motivo nenhum pra reescrever as etapas das trilhas e
 * arriscar o progresso de quem esta no meio de uma.
 *
 * A validacao acontece AQUI, antes da guarda de ambiente e antes de qualquer
 * cliente do Supabase existir: nome errado sai com 1 sem chance de encostar
 * no banco.
 */
const SEEDERS = [
  "areas",
  "technologies",
  "courses",
  "platforms",
  "projects",
  "roadmaps",
] as const;
type SeederName = (typeof SEEDERS)[number];

function parseOnly(argv: string[]): SeederName[] {
  const bruto: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--only=")) bruto.push(arg.slice("--only=".length));
    else if (arg === "--only") {
      const proximo = argv[i + 1];
      if (proximo === undefined || proximo.startsWith("--")) {
        console.error(
          "[seed] --only exige um nome. Validos:",
          SEEDERS.join(", "),
        );
        process.exit(1);
      }
      bruto.push(proximo);
      i += 1;
    }
  }
  if (bruto.length === 0) return [...SEEDERS];

  const pedidos = bruto
    .flatMap((valor) => valor.split(","))
    .map((nome) => nome.trim())
    .filter((nome) => nome.length > 0);

  const invalidos = pedidos.filter(
    (nome) => !(SEEDERS as readonly string[]).includes(nome),
  );
  if (invalidos.length > 0) {
    console.error(
      `[seed] Seeder desconhecido: ${invalidos.join(", ")}. Validos: ${SEEDERS.join(", ")}`,
    );
    process.exit(1);
  }
  if (pedidos.length === 0) {
    console.error("[seed] --only exige um nome. Validos:", SEEDERS.join(", "));
    process.exit(1);
  }
  // Ordem ORIGINAL, nao a que o usuario digitou: os seeders assumem a ordem
  // de main() (areas antes de roadmaps, por exemplo).
  return SEEDERS.filter((nome) => pedidos.includes(nome));
}

const SELECIONADOS = parseOnly(process.argv.slice(2));

// Mesmo par de nomes que server/lib/env.ts (requireEnv("SUPABASE_URL",
// ["VITE_SUPABASE_URL"])) e os cinco scripts de scripts/ ja aceitam. Esta
// seed era o UNICO ponto do repositorio que exigia so o primeiro nome, e o
// .env usa o segundo: por isso ela parava na guarda mesmo com tudo no lugar.
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "[seed] SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

let seedErrors = 0;

function logSeedError(message: string, errorMessage?: string) {
  seedErrors += 1;
  console.error(message, errorMessage);
}

async function seedAreas() {
  console.log("[seed] Iniciando seed de áreas...");

  for (let index = 0; index < areasTI.length; index += 1) {
    const area = areasTI[index];
    const { error } = await supabase.from("areas").upsert(
      {
        slug: area.slug,
        name: area.nome,
        short_description: area.descricaoCurta,
        full_description: area.descricaoCompleta,
        tag: area.nome,
        tag_class: area.tagClass,
        daily_tasks: area.tarefasDiarias,
        profile_indicated: area.perfilIndicado,
        skills: area.habilidades,
        tools: area.ferramentas,
        roles: area.cargos,
        average_salary: {
          label: area.faixaSalarial,
          difficulty: area.dificuldade,
        },
        initial_roadmap: area.roadmapInicial,
        projects: area.projetos,
        free_courses: area.cursosGratuitos,
        essential_terms: area.termosEssenciais,
        initial_tips: area.dicasIniciais,
        is_published: true,
        sort_order: index + 1,
      },
      { onConflict: "slug" },
    );

    if (error)
      logSeedError(`[seed] Erro ao inserir área ${area.slug}:`, error.message);
    else console.log(`[seed] Área inserida: ${area.slug}`);
  }
}

async function seedTechnologies() {
  console.log("[seed] Iniciando seed de tecnologias...");

  for (let index = 0; index < technologies.length; index += 1) {
    const technology = technologies[index];
    const { error } = await supabase.from("technologies").upsert(
      {
        slug: technology.slug,
        name: technology.name,
        category: technology.category,
        description: technology.description,
        long_description: technology.dailyTip,
        icon: technology.logoUrl || technology.icon,
        use_cases: technology.useCases,
        learning_path: technology.learningPath,
        related_area_slugs: technology.areas,
        difficulty: technology.difficulty,
        beginner_friendly_score: technology.difficultyScore,
        salary_context: { label: technology.salaryRange },
        resources: technology.courses.map((course: string) => ({
          title: course,
        })),
        tools: technology.tools,
        companies_using: technology.companies,
        is_published: true,
        sort_order: index + 1,
      },
      { onConflict: "slug" },
    );

    if (error)
      logSeedError(
        `[seed] Erro ao inserir tecnologia ${technology.slug}:`,
        error.message,
      );
    else console.log(`[seed] Tecnologia inserida: ${technology.slug}`);
  }
}

async function seedCourses() {
  console.log("[seed] Iniciando seed de cursos...");

  for (const course of cursosGratuitos) {
    const { error } = await supabase.from("courses").upsert(
      {
        slug: course.id,
        title: course.titulo,
        provider: course.canal,
        url: course.link,
        area_slug: course.areaSlug,
        level: course.nivel,
        price_label: course.preco || course.tipo || "Gratuito",
        is_free: (course.tipo || "Gratuito") !== "Pago",
        workload_hours: parseInt(course.duracao, 10) || null,
        certificate:
          course.motivoIndicacao?.toLowerCase().includes("certificado") ||
          false,
        description: course.descricao,
        tags: course.oQueAprende,
        language: course.idioma,
        is_published: true,
      },
      { onConflict: "slug" },
    );

    if (error)
      logSeedError(`[seed] Erro ao inserir curso ${course.id}:`, error.message);
    else console.log(`[seed] Curso inserido: ${course.id}`);
  }
}

async function seedPlatforms() {
  console.log("[seed] Iniciando seed de plataformas...");

  for (const platform of plataformas) {
    const { error } = await supabase.from("platforms").upsert(
      {
        slug: platform.id,
        name: platform.nome,
        url: platform.link,
        description: platform.descricao,
        price_label: platform.preco || platform.tipo,
        strengths: platform.pontosFortes,
        limitations: platform.limitacoes,
        best_for: platform.areasFortes,
        tags: [platform.tipo, platform.idioma, platform.nivelIdeal].filter(
          Boolean,
        ),
        is_published: true,
      },
      { onConflict: "slug" },
    );

    if (error)
      logSeedError(
        `[seed] Erro ao inserir plataforma ${platform.id}:`,
        error.message,
      );
    else console.log(`[seed] Plataforma inserida: ${platform.id}`);
  }
}

async function seedProjects() {
  console.log("[seed] Iniciando seed de projetos...");

  for (const project of projetos) {
    const { error } = await supabase.from("projects").upsert(
      {
        slug: project.id,
        title: project.nome,
        description: project.objetivo,
        objective: project.objetivo,
        level: project.nivel,
        area_slug: project.areaSlug,
        tools: project.ferramentas,
        simplified_steps: project.passosSimplificados,
        portfolio_tips: `${project.entregavel} Publicar em: ${project.comoPublicar}`,
        linkedin_suggestion: project.sugestaoLinkedIn,
        tags: project.areaSlug
          ? [project.areaSlug, project.nivel]
          : [project.nivel],
        is_published: true,
      },
      { onConflict: "slug" },
    );

    if (error)
      logSeedError(
        `[seed] Erro ao inserir projeto ${project.id}:`,
        error.message,
      );
    else console.log(`[seed] Projeto inserido: ${project.id}`);
  }

  await despublicarProjetosForaDoCatalogo();
}

/**
 * Despublica as linhas de `projects` cujo slug nao existe mais no catalogo.
 *
 * O upsert acima NUNCA remove nada, e a tabela nao e so um espelho morto: ela
 * alimenta `search_documents` pela reindexacao diaria (server/routes/cron.ts),
 * e o `search_documents` e o que a ferramenta searchPlatformContent do agente
 * de IA consulta. Sem esta passada, o agente continuaria recomendando os 54
 * projetos fundidos no lote 01b, com link pra uma pagina que nao os tem.
 *
 * NAO apaga linha: `is_published = false` tira do indice e das rotas de
 * conteudo (as duas filtram por `is_published`) e mantem o historico. Apagar
 * seria irreversivel e nao traz beneficio nenhum aqui.
 */
async function despublicarProjetosForaDoCatalogo() {
  const vivos = new Set(projetos.map((p) => p.id));

  const { data, error } = await supabase
    .from("projects")
    .select("slug")
    .eq("is_published", true);

  if (error) {
    logSeedError("[seed] Erro ao listar projetos publicados:", error.message);
    return;
  }

  // O filtro e em JS, nao um `not.in` na query: a lista de vivos tem 266
  // slugs e cabe na memoria, enquanto mandar 266 valores num filtro de URL
  // esbarra no limite de tamanho da querystring do PostgREST.
  const orfas = (data ?? [])
    .map((row) => String(row.slug))
    .filter((slug) => !vivos.has(slug));

  if (orfas.length === 0) {
    console.log("[seed] Nenhum projeto publicado fora do catalogo.");
    return;
  }

  const LOTE = 50;
  let despublicados = 0;
  for (let i = 0; i < orfas.length; i += LOTE) {
    const lote = orfas.slice(i, i + LOTE);
    const { error: updateError } = await supabase
      .from("projects")
      .update({ is_published: false })
      .in("slug", lote);

    if (updateError) {
      logSeedError(
        `[seed] Erro ao despublicar lote de ${lote.length} projeto(s):`,
        updateError.message,
      );
      continue;
    }
    for (const slug of lote)
      console.log(`[seed] Projeto despublicado: ${slug}`);
    despublicados += lote.length;
  }
  console.log(
    `[seed] ${despublicados} de ${orfas.length} projeto(s) fora do catalogo despublicados.`,
  );
}

async function seedRoadmaps() {
  console.log("[seed] Iniciando seed de roadmaps...");

  for (let index = 0; index < roadmaps.length; index += 1) {
    const roadmap = roadmaps[index];
    const { data, error } = await supabase
      .from("roadmaps")
      .upsert(
        {
          slug: roadmap.id,
          title: roadmap.nome,
          description: roadmap.descricao,
          area_slug: roadmap.areaSlug,
          level: roadmap.nivel,
          estimated_duration_weeks: parseInt(roadmap.duracaoDias, 10)
            ? Math.ceil(parseInt(roadmap.duracaoDias, 10) / 7)
            : null,
          is_pro: index > 0,
          is_published: true,
          sort_order: index + 1,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !data) {
      logSeedError(
        `[seed] Erro ao inserir roadmap ${roadmap.id}:`,
        error?.message,
      );
      continue;
    }

    await supabase.from("roadmap_steps").delete().eq("roadmap_id", data.id);

    const { error: stepsError } = await supabase.from("roadmap_steps").insert(
      roadmap.etapas.map(
        (step: {
          numero: number;
          titulo: string;
          descricao: string;
          tempo: string;
        }) => ({
          roadmap_id: data.id,
          title: step.titulo,
          description: step.descricao,
          order_index: step.numero,
          resources: [],
          deliverable: step.tempo,
          is_pro: false,
        }),
      ),
    );

    if (stepsError)
      logSeedError(
        `[seed] Erro ao inserir etapas do roadmap ${roadmap.id}:`,
        stepsError.message,
      );
    else console.log(`[seed] Roadmap inserido: ${roadmap.id}`);
  }
}

async function main() {
  const porNome: Record<SeederName, () => Promise<void>> = {
    areas: seedAreas,
    technologies: seedTechnologies,
    courses: seedCourses,
    platforms: seedPlatforms,
    projects: seedProjects,
    roadmaps: seedRoadmaps,
  };
  const completo = SELECIONADOS.length === SEEDERS.length;
  console.log(
    completo
      ? "[seed] Iniciando seed completo..."
      : `[seed] executando: ${SELECIONADOS.join(", ")}`,
  );
  for (const nome of SELECIONADOS) await porNome[nome]();
  if (seedErrors > 0) {
    console.error(
      `[seed] Seed finalizado com ${seedErrors} erro(s). Verifique se as tabelas foram criadas no Supabase.`,
    );
    process.exit(1);
  }
  console.log("[seed] Seed concluído.");
}

main().catch((err) => {
  console.error("[seed] Erro fatal:", err);
  process.exit(1);
});
