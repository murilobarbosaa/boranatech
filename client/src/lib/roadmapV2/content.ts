// Re-export fino: o conteudo das trilhas v2 vive em shared/ para o servidor
// (indexacao de busca) e o client lerem a mesma fonte. Mantem os imports
// existentes de "@/lib/roadmapV2/content" funcionando sem mudanca.
export * from "@shared/roadmapV2/content";
