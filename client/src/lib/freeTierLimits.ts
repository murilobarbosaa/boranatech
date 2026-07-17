// Reexport da fonte unica compartilhada (shared/freeTierLimits.ts), pra o
// client e o server usarem exatamente as mesmas constantes. Mantido aqui pra
// nao quebrar os imports existentes (@/lib/freeTierLimits).
export {
  FREE_COURSES_SAMPLE_SIZE,
  FREE_PLATFORMS_SAMPLE_SIZE,
} from "@shared/freeTierLimits";
