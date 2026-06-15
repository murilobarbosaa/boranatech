import type { RoadmapV2 } from "../types";
import { frontend } from "./frontend";
import { backend } from "./backend";
import { fullstack } from "./fullstack";
import { dados } from "./dados";

export { frontend, backend, fullstack, dados };
export const roadmapsV2: RoadmapV2[] = [frontend, backend, fullstack, dados];
