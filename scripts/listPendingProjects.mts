// Lista os projetos do catalogo que ainda NAO tem modulo v2, agrupados por
// area, para escolher a proxima leva de conteudo. Sem rede, so leitura.
//
// Uso: pnpm projetos:pendentes
//
// SEM NUMERAL de proposito: o total do catalogo e o numero de modulos v2 sao
// lidos das fontes (o catalogo e o registro gerado), nunca escritos aqui. Uma
// contagem fixa neste arquivo ficaria errada na primeira leva publicada.
import { projetos } from "../shared/projects/catalog";
import { PROJETOS_V2_IDS } from "../shared/projects/v2";

const SEM_AREA = "(sem area)";

const comModulo = new Set<string>(PROJETOS_V2_IDS);
const pendentes = projetos.filter((p) => !comModulo.has(p.id));

const porArea = new Map<string, typeof pendentes>();
for (const p of pendentes) {
  const area = p.areaSlug ?? SEM_AREA;
  const lista = porArea.get(area) ?? [];
  lista.push(p);
  porArea.set(area, lista);
}

const areas = [...porArea.entries()]
  .map(([area, lista]) => ({
    area,
    lista,
    gratis: lista.filter((p) => p.pro !== true).length,
    pro: lista.filter((p) => p.pro === true).length,
  }))
  .sort(
    (a, b) =>
      b.gratis - a.gratis || b.pro - a.pro || a.area.localeCompare(b.area),
  );

for (const { area, lista, gratis, pro } of areas) {
  console.log(`${area}: ${gratis} gratis, ${pro} pro`);
  for (const p of lista)
    console.log(`  - ${p.id} (${p.nivel})${p.pro === true ? " [pro]" : ""}`);
  console.log("");
}

const noCatalogo = new Set(projetos.map((p) => p.id));
const v2NoCatalogo = PROJETOS_V2_IDS.filter((id) => noCatalogo.has(id)).length;
console.log(`v2: ${v2NoCatalogo} de ${projetos.length}`);
