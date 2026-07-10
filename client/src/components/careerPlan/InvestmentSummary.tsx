import { getCatalogItem, type CareerCatalogItem } from "@shared/careerCatalog";
import { cn } from "@/lib/utils";
import { formatAmount, formatPrice, type StationCertVM } from "./types";

interface InvestmentSummaryProps {
  // TODAS as certs do plano (ancoradas + gerais), na ordem de exibicao.
  certs: StationCertVM[];
  catalogVersion: string;
}

type Currency = "USD" | "BRL";

interface CurrencyTotal {
  currency: Currency;
  required: number;
  withOptionals: number;
}

// Secao "Investimento da rota": soma honesta dos precos do catalogo.
// Regras: so itens presentes no catalogo atual e pagos entram na soma
// (gratuitos e desatualizados ficam fora, anotados); moedas NUNCA convertidas
// (subtotal por moeda); com certs opcionais o total vira duas linhas por
// moeda: obrigatorias + "ate X com as opcionais" (escolha declarada no lugar
// do total unico com nota).
export default function InvestmentSummary({
  certs,
  catalogVersion,
}: InvestmentSummaryProps) {
  if (certs.length === 0) return null;

  const rows: Array<{ cert: StationCertVM; item: CareerCatalogItem | null }> =
    certs.map((cert) => ({
      cert,
      item: getCatalogItem(cert.catalogId) ?? null,
    }));

  const outdatedCount = rows.filter((row) => !row.item).length;
  const freeCount = rows.filter(
    (row) => row.item && "free" in row.item.price,
  ).length;

  const totalsByCurrency = new Map<Currency, CurrencyTotal>();
  for (const row of rows) {
    if (!row.item || "free" in row.item.price) continue;
    const { amount, currency } = row.item.price;
    const entry = totalsByCurrency.get(currency) ?? {
      currency,
      required: 0,
      withOptionals: 0,
    };
    entry.withOptionals += amount;
    if (!row.cert.optional) entry.required += amount;
    totalsByCurrency.set(currency, entry);
  }
  // Ordem deterministica: BRL antes de USD.
  const totals = Array.from(totalsByCurrency.values()).sort((a, b) =>
    a.currency.localeCompare(b.currency),
  );

  const excludedNotes: string[] = [];
  if (freeCount > 0) {
    // TODO(Ana): nota de itens gratuitos fora da soma
    excludedNotes.push(
      freeCount === 1
        ? "1 item gratuito fora da soma"
        : `${freeCount} itens gratuitos fora da soma`,
    );
  }
  if (outdatedCount > 0) {
    // TODO(Ana): nota de itens desatualizados fora da soma
    excludedNotes.push(
      outdatedCount === 1
        ? "1 item desatualizado fora da soma"
        : `${outdatedCount} itens desatualizados fora da soma`,
    );
  }

  return (
    <section>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
        {/* TODO(Ana): titulo da secao de investimento */}
        Investimento da rota
      </p>
      <div className="card-brutal mt-3 rounded-2xl bg-white p-5">
        <ul className="divide-y divide-slate-200">
          {rows.map(({ cert, item }) => (
            <li
              key={cert.itemId}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0"
            >
              <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-bold text-slate-800">
                {item?.name ?? cert.catalogId}
                {cert.optional ? (
                  <span className="rounded-full border border-slate-400 bg-slate-100 px-1.5 text-[0.6rem] font-black uppercase text-slate-600">
                    {/* TODO(Ana): badge de certificacao opcional */}
                    opcional
                  </span>
                ) : null}
                {!item ? (
                  <span className="rounded-full border border-slate-400 bg-slate-100 px-1.5 text-[0.6rem] font-black uppercase text-slate-600">
                    {/* TODO(Ana): marcacao de item fora do catalogo atual */}
                    item desatualizado
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "text-sm font-black",
                  item && !("free" in item.price)
                    ? "text-slate-900"
                    : "text-slate-500",
                )}
              >
                {item ? formatPrice(cert.catalogId) : ""}
              </span>
            </li>
          ))}
        </ul>

        {totals.length > 0 ? (
          <div className="mt-4 border-t-2 border-slate-950 pt-3">
            {totals.map((total) => (
              <p
                key={total.currency}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5"
              >
                <span className="text-xs font-black uppercase tracking-wide text-slate-600">
                  {/* TODO(Ana): rotulo do total por moeda */}
                  Total em {total.currency === "BRL" ? "reais" : "dólares"}
                </span>
                <span className="text-right">
                  <span className="font-display text-lg font-black text-slate-950">
                    {formatAmount(total.required, total.currency)}
                  </span>
                  {total.withOptionals > total.required ? (
                    <span className="ml-1.5 text-xs font-bold text-slate-500">
                      {/* TODO(Ana): sufixo do total com opcionais */}
                      até {formatAmount(total.withOptionals, total.currency)}{" "}
                      com as opcionais
                    </span>
                  ) : null}
                </span>
              </p>
            ))}
          </div>
        ) : null}

        {excludedNotes.length > 0 ? (
          <p className="mt-2 text-xs font-medium text-slate-500">
            {excludedNotes.join("; ")}.
          </p>
        ) : null}

        <p className="mt-3 text-xs font-medium text-slate-500">
          {/* TODO(Ana): disclaimer fixo de precos */}
          Preços de referência de {catalogVersion}, direto do nosso catálogo
          curado. Confirme o valor no site oficial antes de comprar;
          provedores mudam preço sem aviso.
        </p>
      </div>
    </section>
  );
}
