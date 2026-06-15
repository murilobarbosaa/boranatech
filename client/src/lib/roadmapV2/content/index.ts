import type { RoadmapV2 } from "../types";
import { frontend } from "./frontend";
import { backend } from "./backend";
import { fullstack } from "./fullstack";
import { dados } from "./dados";
import { uxui } from "./uxui";
import { ia } from "./ia";
import { produto } from "./produto";
import { ciberseguranca } from "./ciberseguranca";
import { cloud } from "./cloud";
import { gestao } from "./gestao";
import { qa } from "./qa";

export {
  frontend,
  backend,
  fullstack,
  dados,
  uxui,
  ia,
  produto,
  ciberseguranca,
  cloud,
  gestao,
  qa,
};
export const roadmapsV2: RoadmapV2[] = [
  frontend,
  backend,
  fullstack,
  dados,
  uxui,
  ia,
  produto,
  ciberseguranca,
  cloud,
  gestao,
  qa,
];
