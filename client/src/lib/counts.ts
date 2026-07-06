import { areasTI, roadmaps } from "@/lib/data";
import { dictionaryTerms } from "@/lib/platformData";

// Fonte unica das contagens da plataforma, sempre derivadas dos arrays reais.
// So inclui o que tem array contavel; numeros sem fonte contavel (ex.:
// tecnologias, que vem da API) ficam de fora e nao sao inventados aqui.
export const areasCount = areasTI.length;
export const roadmapsCount = roadmaps.length;
export const dictionaryTermsCount = dictionaryTerms.length;
