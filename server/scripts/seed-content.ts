import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

import { areasTI, cursosGratuitos, plataformas, projetos, roadmaps } from "../../client/src/lib/data";
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

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("[seed] SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
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
        icon: area.emoji,
        daily_tasks: area.tarefasDiarias,
        profile_indicated: area.perfilIndicado,
        skills: area.habilidades,
        tools: area.ferramentas,
        roles: area.cargos,
        average_salary: { label: area.faixaSalarial, difficulty: area.dificuldade },
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

    if (error) logSeedError(`[seed] Erro ao inserir área ${area.slug}:`, error.message);
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
        market_demand: technology.demand,
        difficulty: technology.difficulty,
        beginner_friendly_score: technology.difficultyScore,
        salary_context: { label: technology.salaryRange },
        resources: technology.courses.map((course: string) => ({ title: course })),
        tools: technology.tools,
        companies_using: technology.companies,
        is_published: true,
        sort_order: index + 1,
      },
      { onConflict: "slug" },
    );

    if (error) logSeedError(`[seed] Erro ao inserir tecnologia ${technology.slug}:`, error.message);
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
        certificate: course.motivoIndicacao?.toLowerCase().includes("certificado") || false,
        description: course.descricao,
        tags: course.oQueAprende,
        language: course.idioma,
        is_published: true,
      },
      { onConflict: "slug" },
    );

    if (error) logSeedError(`[seed] Erro ao inserir curso ${course.id}:`, error.message);
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
        tags: [platform.tipo, platform.idioma, platform.nivelIdeal].filter(Boolean),
        is_published: true,
      },
      { onConflict: "slug" },
    );

    if (error) logSeedError(`[seed] Erro ao inserir plataforma ${platform.id}:`, error.message);
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
        tags: project.areaSlug ? [project.areaSlug, project.nivel] : [project.nivel],
        is_published: true,
      },
      { onConflict: "slug" },
    );

    if (error) logSeedError(`[seed] Erro ao inserir projeto ${project.id}:`, error.message);
    else console.log(`[seed] Projeto inserido: ${project.id}`);
  }
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
          estimated_duration_weeks: parseInt(roadmap.duracaoDias, 10) ? Math.ceil(parseInt(roadmap.duracaoDias, 10) / 7) : null,
          is_pro: index > 0,
          is_published: true,
          sort_order: index + 1,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !data) {
      logSeedError(`[seed] Erro ao inserir roadmap ${roadmap.id}:`, error?.message);
      continue;
    }

    await supabase.from("roadmap_steps").delete().eq("roadmap_id", data.id);

    const { error: stepsError } = await supabase.from("roadmap_steps").insert(
      roadmap.etapas.map((step: { numero: number; titulo: string; descricao: string; tempo: string }) => ({
        roadmap_id: data.id,
        title: step.titulo,
        description: step.descricao,
        order_index: step.numero,
        resources: [],
        deliverable: step.tempo,
        is_pro: false,
      })),
    );

    if (stepsError) logSeedError(`[seed] Erro ao inserir etapas do roadmap ${roadmap.id}:`, stepsError.message);
    else console.log(`[seed] Roadmap inserido: ${roadmap.id}`);
  }
}

async function main() {
  console.log("[seed] Iniciando seed completo...");
  await seedAreas();
  await seedTechnologies();
  await seedCourses();
  await seedPlatforms();
  await seedProjects();
  await seedRoadmaps();
  if (seedErrors > 0) {
    console.error(`[seed] Seed finalizado com ${seedErrors} erro(s). Verifique se as tabelas foram criadas no Supabase.`);
    process.exit(1);
  }
  console.log("[seed] Seed concluído.");
}

main().catch((err) => {
  console.error("[seed] Erro fatal:", err);
  process.exit(1);
});
