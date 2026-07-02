// Re-export fino: os tipos das trilhas v2 vivem em shared/ para o servidor
// (indexacao de busca) e o client lerem a mesma fonte. Mantem os imports
// existentes de "@/lib/roadmapV2/types" funcionando sem mudanca.
export * from "@shared/roadmapV2/types";
