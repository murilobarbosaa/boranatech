import { Fragment } from "react";
import {
  CODE_PLACEHOLDER,
  type QuizCodigo,
  type QuizTipo,
} from "@shared/roadmapQuiz/types";

// Trecho de codigo de uma pergunta da prova (tipos completar, erro e saida).
// Visual copiado do bloco cercado das folhas de trilha (MARKDOWN_COMPONENTS.pre
// em RoadmapNodeItem.tsx), sem importar nada de la: container escuro, borda
// grossa, fonte mono. Sem syntax highlighting, decisao de produto ja registrada
// naquele arquivo; a linguagem serve so ao rotulo do cabecalho.
//
// Cada linha ganha um numero no gutter porque as perguntas de tipo erro podem
// citar "linha 3" nas alternativas. No tipo completar, a lacuna
// CODE_PLACEHOLDER vira um destaque amarelo, com o texto "____" preservado
// dentro do span para copiar/colar e leitor de tela verem a lacuna; nos outros
// tipos o trecho e renderizado literal, mesmo que contenha "____".
type Props = {
  codigo: QuizCodigo;
  tipo?: QuizTipo;
};

const GUTTER_CLASS =
  "inline-block w-7 shrink-0 select-none pr-2 text-right tabular-nums text-slate-500";

function LinhaCompletar({ texto }: { texto: string }) {
  const partes = texto.split(CODE_PLACEHOLDER);
  return (
    <>
      {partes.map((parte, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span
              data-lacuna="true"
              className="rounded-[4px] bg-[var(--brand-yellow)] px-1 font-black text-ink-on-accent"
            >
              {CODE_PLACEHOLDER}
            </span>
          )}
          {parte}
        </Fragment>
      ))}
    </>
  );
}

export default function QuizCodeBlock({ codigo, tipo }: Props) {
  const linhas = codigo.trecho.split("\n");
  const rotulo = codigo.linguagem.toUpperCase();
  // TODO(Ana): aria-label do bloco de codigo da prova
  const ariaLabel = `Código em ${codigo.linguagem}`;
  return (
    <div className="overflow-hidden rounded-[10px] border-[2.5px] border-slate-900 bg-slate-900">
      <div className="border-b border-slate-700 px-4 py-1.5 font-mono text-[0.7rem] font-black tracking-[0.16em] text-slate-400">
        {rotulo}
      </div>
      <pre
        aria-label={ariaLabel}
        className="overflow-x-auto whitespace-pre p-4 font-mono text-[0.82rem] leading-relaxed text-slate-100"
      >
        {linhas.map((linha, i) => (
          <div key={i} data-linha={i + 1}>
            <span aria-hidden="true" data-numero-linha className={GUTTER_CLASS}>
              {i + 1}
            </span>
            <span data-conteudo>
              {tipo === "completar" ? <LinhaCompletar texto={linha} /> : linha}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}
