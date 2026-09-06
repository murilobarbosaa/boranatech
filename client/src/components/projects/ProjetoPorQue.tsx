import type { ProjetoV2Detalhe } from "@shared/projects/v2/types";

export default function ProjetoPorQue({
  briefing,
}: {
  briefing: ProjetoV2Detalhe["briefing"];
}) {
  return (
    <>
      <p className="mt-3 text-base leading-relaxed text-foreground">
        {briefing.contexto}
      </p>
      <h3 className="mt-5 font-display text-base font-bold text-foreground">
        Você vai sair sabendo
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {briefing.aprende.map((item) => (
          <span
            key={item}
            className="rounded-[10px] bg-muted px-3 py-1.5 text-sm font-semibold text-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </>
  );
}
