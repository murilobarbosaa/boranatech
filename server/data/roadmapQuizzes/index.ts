// Registry estatico dos pools de quiz por slug de trilha. E o unico caminho
// de import do runtime do Express (imports estaticos, entao o esbuild
// consegue empacotar; import dinamico por template de caminho ficaria fora do
// bundle). Pool novo no diretorio exige entrada aqui; o pnpm check
// (generateRoadmapMeta --check) falha se o registry e o diretorio divergirem.
// SERVER-ONLY: ver README.md desta pasta.
import type { QuizPool } from "../../../shared/roadmapQuiz/types";
import analiseDados from "./analise-dados";
import backend from "./backend";
import bancoDeDados from "./banco-de-dados";
import cloud from "./cloud";
import dados from "./dados";
import devops from "./devops";
import engenhariaDados from "./engenharia-dados";
import frontend from "./frontend";
import fullstack from "./fullstack";
import infraestrutura from "./infraestrutura";
import mobile from "./mobile";
import produto from "./produto";
import sre from "./sre";
import uxui from "./uxui";

export const roadmapQuizPools: Record<string, QuizPool> = {
  "analise-dados": analiseDados,
  backend,
  "banco-de-dados": bancoDeDados,
  cloud,
  dados,
  devops,
  "engenharia-dados": engenhariaDados,
  frontend,
  fullstack,
  infraestrutura,
  mobile,
  produto,
  sre,
  uxui,
};
