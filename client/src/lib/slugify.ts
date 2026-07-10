// Util puro de slug, extraido de technologyData.ts para a home (LogoLoop)
// nao arrastar o catalogo de tecnologias pro grafo do boot.
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace("#", "sharp")
    .replace(/\+/g, "plus")
    .replace(/\./g, "")
    .replace(/\s+/g, "-");
}
