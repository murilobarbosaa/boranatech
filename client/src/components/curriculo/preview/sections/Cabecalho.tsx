import type { DadosPessoais, Objetivo } from "@shared/curriculo/schema";

type Variant = "left" | "center" | "tagline";

interface CabecaloProps {
  dadosPessoais: DadosPessoais;
  objetivo: Objetivo;
  variant: Variant;
}

/**
 * Cabeçalho do currículo. Três variantes só mudam alinhamento e ordem
 * visual; o conteúdo é o mesmo. variant="left" (cronológico),
 * "center" (harvard, sóbrio acadêmico), "tagline" (híbrido moderno).
 */
export default function Cabecalho({ dadosPessoais, objetivo, variant }: CabecaloProps) {
  const align = variant === "center" ? "text-center" : "text-left";
  const contactSep = "·";

  const contatos: string[] = [];
  if (dadosPessoais.email) contatos.push(dadosPessoais.email);
  if (dadosPessoais.telefone) contatos.push(dadosPessoais.telefone);
  if (dadosPessoais.cidade) contatos.push(dadosPessoais.cidade);
  if (dadosPessoais.linkedin) contatos.push(stripUrl(dadosPessoais.linkedin));
  if (dadosPessoais.github) contatos.push(stripUrl(dadosPessoais.github));

  return (
    <header className={`mb-5 ${align}`}>
      <h1 className="font-body text-[26px] font-black leading-tight tracking-tight text-slate-900 sm:text-[30px]">
        {dadosPessoais.nome}
      </h1>
      {variant === "tagline" ? (
        <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          {objetivo.cargo}
        </p>
      ) : variant === "center" ? (
        <p className="mt-1 text-[12px] font-medium text-slate-600">{objetivo.cargo}</p>
      ) : (
        <p className="mt-0.5 text-[13px] font-medium text-slate-700">{objetivo.cargo}</p>
      )}
      <p
        className={`mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10.5px] text-slate-600 ${
          variant === "center" ? "justify-center" : ""
        }`}
      >
        {contatos.map((item, idx) => (
          <span key={idx} className="inline-flex items-center gap-2">
            {idx > 0 ? <span aria-hidden className="text-slate-400">{contactSep}</span> : null}
            <span>{item}</span>
          </span>
        ))}
      </p>
      <hr className="mt-4 border-t border-slate-300" />
    </header>
  );
}

function stripUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}
