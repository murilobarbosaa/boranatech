import type { RoadmapV2 } from "../types";
import { frontend } from "./frontend";
import { backend } from "./backend";

export { frontend, backend };
export const roadmapsV2: RoadmapV2[] = [frontend, backend];
