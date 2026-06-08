interface DifficultyMeterProps {
  value: number;
  label?: string;
}

export default function DifficultyMeter({
  value,
  label,
}: DifficultyMeterProps) {
  const safeValue = Math.max(1, Math.min(5, value));
  const labels = [
    "",
    "Muito fácil",
    "Fácil",
    "Médio",
    "Difícil",
    "Muito difícil",
  ];
  const colors = [
    "",
    "bg-blue-500",
    "bg-blue-400",
    "bg-amber-400",
    "bg-orange-500",
    "bg-red-500",
  ];

  return (
    <div>
      {label && (
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
          {label}
        </p>
      )}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className={`h-2 w-7 rounded-full ${item <= safeValue ? colors[safeValue] : "bg-slate-200"}`}
            />
          ))}
        </div>
        <span className="text-sm font-bold text-slate-700">
          {labels[safeValue]}
        </span>
      </div>
    </div>
  );
}
