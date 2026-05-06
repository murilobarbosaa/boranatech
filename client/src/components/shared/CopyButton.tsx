import { useState } from "react";
import { Copy } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-colors hover:bg-yellow-100 ${className}`}
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
}
