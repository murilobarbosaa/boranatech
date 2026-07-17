// Fonte UNICA dos tamanhos de amostra do plano gratis, compartilhada entre
// client e server. O client aplica o gate no que renderiza (paginas Cursos e
// Plataformas) e a pagina de planos usa na copy; o server fatia o payload das
// rotas de catalogo por tier (content.ts). Assim o limite anunciado, o limite
// renderizado e o limite servido pela API nunca divergem.
export const FREE_COURSES_SAMPLE_SIZE = 6;
export const FREE_PLATFORMS_SAMPLE_SIZE = 6;
