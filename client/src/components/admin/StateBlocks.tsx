// Blocos de estado compartilhados do admin (carregando / erro). Um unico dialeto
// visual reusado por todas as secoes: nenhum componente inventa outro.

export function LoadingBlock({
  label = "Carregando dados...",
}: {
  label?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center text-sm font-black text-slate-500">
      {label}
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-6 text-center text-sm font-black text-rose-700">
      {message}
    </div>
  );
}
