import type { ProjetoRequisito } from "@shared/projects/catalog";

export default function ProjetoRequisitos({
  requisitos,
}: {
  requisitos: ProjetoRequisito[];
}) {
  return (
    <>
      <p className="mt-2 text-sm text-muted-foreground">
        É o contrato do projeto. Quando os {requisitos.length} estiverem
        verdade, você terminou.
      </p>
      <ul className="mt-3 grid gap-2">
        {requisitos.map((req) => (
          <li
            key={req.id}
            className="flex items-start gap-3 rounded-[10px] bg-card p-3 text-sm text-foreground"
          >
            <span
              className="mt-1 h-3.5 w-3.5 shrink-0 rounded-[4px] border-2 border-violet-500"
              aria-hidden
            />
            {req.descricao}
          </li>
        ))}
      </ul>
    </>
  );
}
