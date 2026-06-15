import type { RoadmapV2 } from "../types";
import { frontend } from "./frontend";
import { backend } from "./backend";
import { fullstack } from "./fullstack";

export { frontend, backend, fullstack };
export const roadmapsV2: RoadmapV2[] = [frontend, backend, fullstack];
