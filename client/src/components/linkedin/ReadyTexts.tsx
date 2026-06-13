import { FileText, MessageSquare, Sparkles, Type } from "lucide-react";
import CopyButton from "@/components/shared/CopyButton";
import type { LinkedinQualitative } from "@shared/linkedin/schema";

const IA_EYEBROW =
  "inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-sky-300 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-slate-950 shadow-[3px_3px_0_#0f172a]";

function Block({
  icon,
  title,
  copyText,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  copyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-brutal rounded-2xl border-slate-950 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-lg font-black text-slate-950">
          {icon}
          {title}
        </h3>
        <CopyButton text={copyText} />
      </div>
      {children}
    </div>
  );
}

export default function ReadyTexts({
  qualitative,
}: {
  qualitative: LinkedinQualitative;
}) {
  const {
    headlines,
    sobreReescrito,
    bulletsReescritos,
    modeloMensagemRecrutador,
  } = qualitative;

  return (
    <div className="space-y-4">
      <span className={IA_EYEBROW}>
        <Sparkles className="h-3.5 w-3.5" />
        textos prontos para colar
      </span>

      <div className="card-brutal rounded-2xl border-slate-950 bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-black text-slate-950">
          <Type className="h-5 w-5 text-sky-700" />
          Headline em 3 versões
        </h3>
        <ul className="space-y-3">
          {headlines.map((headline, index) => (
            <li
              key={index}
              className="flex items-start justify-between gap-3 rounded-xl border-2 border-slate-200 bg-sky-50 p-3"
            >
              <p className="min-w-0 text-sm font-medium text-slate-800">
                {headline}
              </p>
              <CopyButton text={headline} />
            </li>
          ))}
        </ul>
      </div>

      <Block
        icon={<FileText className="h-5 w-5 text-sky-700" />}
        title="Sobre reescrito"
        copyText={sobreReescrito}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {sobreReescrito}
        </p>
      </Block>

      {bulletsReescritos.length > 0 ? (
        <div className="space-y-4">
          {bulletsReescritos.map((item, index) => (
            <Block
              key={index}
              icon={<FileText className="h-5 w-5 text-sky-700" />}
              title={`Experiência: ${item.contexto}`}
              copyText={item.bullets.join("\n")}
            >
              <ul className="space-y-2">
                {item.bullets.map((bullet, bulletIndex) => (
                  <li
                    key={bulletIndex}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </Block>
          ))}
        </div>
      ) : null}

      <Block
        icon={<MessageSquare className="h-5 w-5 text-sky-700" />}
        title="Mensagem para recrutador"
        copyText={modeloMensagemRecrutador}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {modeloMensagemRecrutador}
        </p>
      </Block>
    </div>
  );
}
