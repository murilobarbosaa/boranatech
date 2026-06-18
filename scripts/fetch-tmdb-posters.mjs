import fs from "node:fs/promises";
import path from "node:path";

const KEY = process.env.TMDB_API_KEY;
const OUT = path.resolve("client/src/lib/dicasPosters.generated.ts");

if (!KEY) {
  console.log(
    "[posters] TMDB_API_KEY ausente; mantendo capas em fallback. Build segue normalmente.",
  );
  process.exit(0);
}

const data = await import(path.resolve("client/src/lib/dicasData.ts"));
const screens = [
  ...data.bibliotecaFilmes.map((f) => ({ ...f, kind: f.tmdbType ?? "movie" })),
  ...data.bibliotecaSeries.map((s) => ({ ...s, kind: s.tmdbType ?? "tv" })),
];

const map = {};
for (const s of screens) {
  if (s.posterPath) {
    map[s.titulo] = s.posterPath;
    continue;
  }
  const q = encodeURIComponent(s.titulo);
  const yearParam =
    s.kind === "movie"
      ? `&primary_release_year=${s.ano}`
      : `&first_air_date_year=${s.ano}`;
  const url = `https://api.themoviedb.org/3/search/${s.kind}?api_key=${KEY}&language=pt-BR&query=${q}${yearParam}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`[posters] busca falhou (${res.status}) para ${s.titulo}`);
      continue;
    }
    const json = await res.json();
    const hit = (json.results || [])[0];
    if (!hit || !hit.poster_path) {
      console.log(`[posters] sem match confiavel para ${s.titulo} (${s.ano})`);
      continue;
    }
    const hitYear = (hit.release_date || hit.first_air_date || "").slice(0, 4);
    if (hitYear && String(s.ano) && hitYear !== String(s.ano)) {
      console.log(
        `[posters] ano nao bate para ${s.titulo}: ${hitYear} != ${s.ano}, ignorando`,
      );
      continue;
    }
    map[s.titulo] = hit.poster_path;
    console.log(`[posters] ok ${s.titulo} -> ${hit.poster_path}`);
  } catch (e) {
    console.log(`[posters] erro em ${s.titulo}: ${String(e)}`);
  }
}

const body = `export const generatedPosters: Record<string, string> = ${JSON.stringify(
  map,
  null,
  2,
)};\n`;
await fs.writeFile(OUT, body);
console.log(`[posters] gravado ${Object.keys(map).length} posteres em ${OUT}`);
