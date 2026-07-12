import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import SectionLabel from "@/components/shared/SectionLabel";
import VagasJobCard from "@/components/vagas/VagasJobCard";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { fetchDestaques, type VagaItem } from "@/services/vagasService";

const ac = getPageAccentUi("cyan");

// Secao de vagas destaque (Pro). Montada SOMENTE para assinante (o pai
// condiciona a isPro). Vazio ou erro: a secao inteira some sem bloco vazio;
// erro e logado e nao derruba a pagina (o feed e o conteudo principal).
export default function VagasDestaques({
  onOpen,
}: {
  onOpen: (id: string) => void;
}) {
  const [items, setItems] = useState<VagaItem[]>([]);

  useEffect(() => {
    let active = true;
    fetchDestaques()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((err: unknown) => {
        console.warn("[vagas] destaques indisponíveis:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mb-12">
      {/* TODO(Ana): validar titulo e copy da secao de destaques. */}
      <SectionLabel icon={Star} ac={ac}>
        Destaques
      </SectionLabel>
      <h2 className="mt-2 font-display text-2xl font-black text-slate-950">
        Vagas em destaque
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((job) => (
          <VagasJobCard key={job.id} job={job} onOpen={onOpen} highlight />
        ))}
      </div>
    </div>
  );
}
