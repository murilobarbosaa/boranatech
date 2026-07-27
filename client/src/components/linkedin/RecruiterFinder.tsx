import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { readDeterministic } from "@shared/linkedin/readDeterministic";
import {
  LINKEDIN_CAMPO_LABELS,
  type LinkedinCampo,
  type LinkedinDeterministicResult,
  type Mercado,
} from "@shared/linkedin/schema";

interface RecruiterFinderProps {
  deterministic: LinkedinDeterministicResult;
  mercado: Mercado;
}

/** "Competências", "Competências e Headline", "A, B e C". */
function listar(campos: LinkedinCampo[]): string {
  const nomes = campos.map((c) => LINKEDIN_CAMPO_LABELS[c]);
  if (nomes.length <= 1) return nomes[0] ?? "";
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

const IA_EYEBROW =
  "inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-sky-300 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-slate-950 shadow-[3px_3px_0_#0f172a]";

export default function RecruiterFinder({
  deterministic,
  mercado,
}: RecruiterFinderProps) {
  // Leitura tolerante: estas tres sao as unicas leituras do jsonb persistido
  // que chamam metodo em array (.length/.map) e portanto derrubariam a pagina
  // se o campo faltasse. O tipo da prop descreve o que o servidor escreve HOJE,
  // nao o que as analises antigas gravaram. Ver docs/divida-leitura-persistida.md.
  const {
    keywordsEncontradas,
    keywordsFaltantes,
    titulosIngles,
    keywordsCampos,
  } = readDeterministic(deterministic);
  const showIngles = mercado === "exterior" || mercado === "ambos";

  // Análise gravada antes da Fase 2A não tem a decomposição por campo. Nesse
  // caso a UI cai nas duas listas de antes, que continuam corretas, só menos
  // úteis. Nunca inventa destino para dado que não veio.
  const temDestino = keywordsCampos.length > 0;
  const comLacuna = keywordsCampos.filter(
    (k) => k.comprovado && k.faltaEm.length > 0,
  );
  const completos = keywordsCampos.filter(
    (k) => k.comprovado && k.faltaEm.length === 0,
  );
  const semEvidencia = keywordsCampos.filter((k) => !k.comprovado);

  return (
    <div className="card-brutal rounded-2xl border-slate-950 bg-white p-6">
      <span className={IA_EYEBROW}>
        <Search className="h-3.5 w-3.5" />
        como um recrutador te encontra
      </span>

      <p className="mt-4 text-sm font-medium text-slate-600">
        Recrutadores filtram perfis por palavras-chave. Abaixo, cada tecnologia
        da sua área com o campo exato em que ela já está e o campo em que falta.
        Adicione só o que você realmente sabe.
      </p>

      {temDestino ? (
        <div className="mt-5 space-y-5">
          <div>
            <p className="mb-1 text-sm font-black text-slate-900">
              Você já prova, mas falta escrever em algum campo (
              {comLacuna.length})
            </p>
            <p className="mb-3 text-xs font-medium text-slate-500">
              Competências é o campo por onde o recrutador filtra. A headline
              aparece em toda busca e o Sobre é indexado. Escrever nos três é o
              que mais rende.
            </p>
            {comLacuna.length > 0 ? (
              <ul className="space-y-2">
                {comLacuna.map((k) => (
                  <li
                    key={k.termo}
                    className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs"
                  >
                    <span className="font-black text-slate-900">{k.termo}</span>
                    <span className="font-medium text-slate-500">
                      já está em {listar(k.presenteEm)}
                    </span>
                    <span className="font-black text-amber-800">
                      adicione em {listar(k.faltaEm)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                Nada pendente aqui: o que você prova já está escrito nos campos
                certos.
              </p>
            )}
          </div>

          {completos.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-black text-slate-900">
                Completas, em todos os campos ({completos.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {completos.map((k) => (
                  <span
                    key={k.termo}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                  >
                    <Check className="h-3 w-3" />
                    {k.termo}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-1 text-sm font-black text-slate-900">
              Sem evidência no perfil ({semEvidencia.length})
            </p>
            <p className="mb-3 text-xs font-medium text-slate-500">
              Estas não têm campo de destino hoje: escrever qualquer uma delas
              sem saber seria mentira no seu perfil. Elas entram em Competências
              depois que você aprender.
            </p>
            {semEvidencia.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {semEvidencia.map((k) => (
                  <span
                    key={k.termo}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600"
                  >
                    <X className="h-3 w-3 text-slate-400" />
                    {k.termo}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Você cobre todas as tecnologias-chave da área.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-black text-slate-900">
              No seu perfil ({keywordsEncontradas.length})
            </p>
            {keywordsEncontradas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keywordsEncontradas.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-600 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                  >
                    <Check className="h-3 w-3" />
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Nenhuma tecnologia-chave da área detectada ainda.
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-black text-slate-900">
              Faltando ({keywordsFaltantes.length})
            </p>
            {keywordsFaltantes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {keywordsFaltantes.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600"
                  >
                    <X className="h-3 w-3 text-slate-400" />
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Você cobre todas as tecnologias-chave da área.
              </p>
            )}
          </div>
        </div>
      )}

      {showIngles ? (
        <div className="mt-6 border-t-2 border-dashed border-slate-200 pt-5">
          <p className="mb-2 text-sm font-black text-slate-900">
            Títulos que recrutadores buscam em inglês
          </p>
          <div className="flex flex-wrap gap-2">
            {titulosIngles.map((titulo) => (
              <span
                key={titulo.titulo}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-bold",
                  titulo.encontrado
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-300 bg-slate-50 text-slate-600",
                )}
              >
                {titulo.encontrado ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3 text-slate-400" />
                )}
                {titulo.titulo}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
