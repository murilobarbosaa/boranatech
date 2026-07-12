// Registry estatico dos pools de quiz por slug de trilha. E o unico caminho
// de import do runtime do Express (imports estaticos, entao o esbuild
// consegue empacotar; import dinamico por template de caminho ficaria fora do
// bundle). Pool novo no diretorio exige entrada aqui; o pnpm check
// (generateRoadmapMeta --check) falha se o registry e o diretorio divergirem.
// SERVER-ONLY: ver README.md desta pasta.
import type { QuizPool } from "../../../shared/roadmapQuiz/types";
import backend from "./backend";
import dados from "./dados";
import frontend from "./frontend";
import fullstack from "./fullstack";

export const roadmapQuizPools: Record<string, QuizPool> = {
  backend,
  dados,
  frontend,
  fullstack,
};
