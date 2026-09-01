import { GENDER_VALUES } from "@shared/gender";
import { PROFILE_TEXT_LIMITS, isProfileUrlField } from "@shared/profileFields";

import { Field } from "./UserFields";

// Campo que troca entre LEITURA e EDICAO no mesmo lugar da tela. Em leitura
// renderiza exatamente o <Field> de sempre, entao o modo de leitura nao muda
// nada; em edicao vira rotulo + input + erro do campo.
//
// useState cru, sem react-hook-form: e o dialeto do admin inteiro
// (NotificationsManager, VagasDestaqueAdmin, TasksDashboard), sao 14 campos de
// texto planos, e o unico estado derivado de que a fatia precisa (ha alteracao
// nao salva?) sai de uma comparacao com o snapshot carregado, que e mais
// confiavel que o isDirty da biblioteca e cabe em tres linhas.

const INPUT =
  "w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:bg-yellow-50 disabled:opacity-60 dark:focus:bg-secondary";

const INPUT_ERRO = "border-rose-600 bg-rose-50";

export type CamposForm = Record<string, string>;

export function EditableField({
  label,
  name,
  editing,
  form,
  onChange,
  error,
  disabled,
  readValue,
  readEmpty,
  multiline,
}: {
  label: string;
  name: string;
  editing: boolean;
  form: CamposForm;
  onChange: (name: string, value: string) => void;
  error?: string;
  disabled?: boolean;
  readValue: React.ReactNode;
  readEmpty: boolean;
  multiline?: boolean;
}) {
  if (!editing)
    return <Field label={label} value={readValue} empty={readEmpty} />;

  const id = `campo-${name}`;
  const limite = PROFILE_TEXT_LIMITS[name];
  const comum = {
    id,
    name,
    value: form[name] ?? "",
    disabled,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(name, e.target.value),
    className: `${INPUT} ${error ? INPUT_ERRO : ""}`,
    // maxLength NAO substitui a validacao: e so uma cortesia do navegador. A
    // regra de verdade e a compartilhada, checada antes de enviar e de novo no
    // servidor.
    ...(limite ? { maxLength: limite } : {}),
    ...(isProfileUrlField(name) ? { inputMode: "url" as const } : {}),
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
      >
        {label}
      </label>
      {multiline ? (
        <textarea {...comum} rows={3} />
      ) : (
        <input type="text" {...comum} />
      )}
      {error ? (
        <p className="mt-1 text-xs font-black text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}

export function GenderField({
  editing,
  form,
  onChange,
  error,
  disabled,
  readValue,
  readEmpty,
}: {
  editing: boolean;
  form: CamposForm;
  onChange: (name: string, value: string) => void;
  error?: string;
  disabled?: boolean;
  readValue: React.ReactNode;
  readEmpty: boolean;
}) {
  if (!editing)
    return <Field label="Gênero" value={readValue} empty={readEmpty} />;

  // <select> nativo, nao BntSelect: o BntSelect abre portal e este formulario
  // vive DENTRO de um Dialog, o que traz a discussao de camada (z-[2100]) para
  // um campo de cinco opcoes. Trocar depois e trivial se fizer falta.
  return (
    <div>
      <label
        htmlFor="campo-gender"
        className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
      >
        Gênero
      </label>
      <select
        id="campo-gender"
        name="gender"
        value={form.gender ?? ""}
        disabled={disabled}
        onChange={(e) => onChange("gender", e.target.value)}
        className={`${INPUT} ${error ? INPUT_ERRO : ""}`}
      >
        <option value="">Não informado</option>
        {GENDER_VALUES.map((valor) => (
          <option key={valor} value={valor}>
            {valor}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1 text-xs font-black text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
