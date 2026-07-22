// Valida pools de quiz SEM regenerar (nao chama a OpenAI, nao troca ids).
// Uso: pnpm validate:quiz-pool [slug]
//   sem argumento: valida todos os pools do registry.
//   com slug: valida so aquele pool.
// Confere pool.slug, formato e unicidade dos ids, fonte apontando pra folha
// real da trilha, cobertura minima por secao e por nivel, e ausencia de
// travessao. E o passo de validacao pra quem AUTORA perguntas manualmente,
// alternativa segura ao gen:quiz-pool --force (que regenera e invalida
// tentativas registradas).
import { roadmapQuizPools } from "../server/data/roadmapQuizzes";
import { roadmapsV2 } from "../shared/roadmapV2/content";
import { validateQuizPool } from "./quizPoolValidation.mts";

const arg = process.argv.slice(2).find((token) => !token.startsWith("--"));
const slugs = arg ? [arg] : Object.keys(roadmapQuizPools);

let problemsFound = 0;
for (const slug of slugs) {
  const pool = roadmapQuizPools[slug];
  if (!pool) {
    console.error(`[validate:quiz-pool] pool "${slug}" nao existe no registry.`);
    problemsFound += 1;
    continue;
  }
  const roadmap = roadmapsV2.find((entry) => entry.slug === slug) ?? null;
  const problems = validateQuizPool(pool, slug, roadmap);
  if (problems.length === 0) {
    console.log(
      `[validate:quiz-pool] ${slug}: valido (${pool.questions.length} perguntas).`,
    );
  } else {
    problemsFound += problems.length;
    console.error(`[validate:quiz-pool] ${slug}: INVALIDO`);
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
  }
}

if (problemsFound > 0) {
  process.exit(1);
}
