import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fiscalFormErrors,
  fiscalFormToPayload,
  type FiscalFormValues,
} from "@/lib/fiscalSchema";
import { lookupCep } from "@/lib/viaCep";
import { getMyProfile, updateMyProfile } from "@/services/profileService";
import { UF_LIST, onlyDigits } from "@shared/fiscalIdentity";

// Coleta dos dados fiscais do tomador, no padrao visual e tecnico da
// CompleteProfileModal do certificado (mesmo Dialog, mesmo inputClass, mesmo
// estado controlado com useState em vez de react-hook-form).
//
// OBRIGATORIO: nome/razao social + documento valido. O endereco e RECOMENDADO e
// dito assim na interface: a Fase 1 decidiu que ausencia de endereco nao
// bloqueia a emissao, e um asterisco de obrigatorio aqui contradiria o servidor.

type FiscalDataModalProps = {
  open: boolean;
  onClose: () => void;
  /** Salvou: quem chama reavalia e decide o proximo passo (fechar, seguir). */
  onSaved: () => void;
  /** Copy do cabecalho, para o gate do checkout falar do checkout. */
  contexto?: "perfil" | "checkout";
};

function maskCpf(raw: string): string {
  const digits = onlyDigits(raw).slice(0, 11);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 9),
    digits.slice(9, 11),
  ].filter(Boolean);
  if (parts.length <= 3) return parts.join(".");
  return `${parts.slice(0, 3).join(".")}-${parts[3]}`;
}

function maskCnpj(raw: string): string {
  const d = onlyDigits(raw).slice(0, 14);
  let out = d.slice(0, 2);
  if (d.length > 2) out += `.${d.slice(2, 5)}`;
  if (d.length > 5) out += `.${d.slice(5, 8)}`;
  if (d.length > 8) out += `/${d.slice(8, 12)}`;
  if (d.length > 12) out += `-${d.slice(12, 14)}`;
  return out;
}

function maskCep(raw: string): string {
  const d = onlyDigits(raw).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

const inputClass =
  "w-full rounded-[11px] border-[2.5px] border-slate-900 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-950 shadow-[3px_3px_0_var(--bnt-shadow)] outline-none focus:-translate-y-px focus:shadow-[4px_4px_0_var(--bnt-shadow)]";

const labelClass =
  "mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-700";

const EMPTY: FiscalFormValues = {
  tipoDocumento: "cpf",
  fullName: "",
  razaoSocial: "",
  documento: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

export default function FiscalDataModal({
  open,
  onClose,
  onSaved,
  contexto = "perfil",
}: FiscalDataModalProps) {
  const [values, setValues] = useState<FiscalFormValues>(EMPTY);
  // Codigo IBGE nao tem campo na interface (ninguem digita isso): ele vem do
  // ViaCEP e viaja junto no payload.
  const [codigoMunicipio, setCodigoMunicipio] = useState("");
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepAviso, setCepAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // So mostra erro de campo depois da primeira tentativa de salvar: marcar
  // tudo de vermelho antes de a pessoa digitar e ruido, nao ajuda.
  const [submetido, setSubmetido] = useState(false);

  function set<K extends keyof FiscalFormValues>(
    key: K,
    value: FiscalFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // Prefill com o que ja existe no perfil. Best-effort: sem ele o formulario
  // comeca vazio, que e degradacao aceitavel.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getMyProfile()
      .then((profile) => {
        if (cancelled) return;
        const pj = profile.fiscal_documento_preferencia === "cnpj";
        setValues({
          tipoDocumento: pj ? "cnpj" : "cpf",
          fullName: profile.full_name ?? "",
          razaoSocial: profile.razao_social ?? "",
          documento: pj
            ? maskCnpj(profile.cnpj ?? "")
            : maskCpf(profile.cpf ?? ""),
          cep: maskCep(profile.endereco_cep ?? ""),
          logradouro: profile.endereco_logradouro ?? "",
          numero: profile.endereco_numero ?? "",
          complemento: profile.endereco_complemento ?? "",
          bairro: profile.endereco_bairro ?? "",
          cidade: profile.endereco_cidade ?? "",
          uf: profile.endereco_uf ?? "",
        });
      })
      .catch(() => {
        /* prefill e best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const errors = useMemo(
    () => (submetido ? fiscalFormErrors(values) : {}),
    [submetido, values],
  );

  const pj = values.tipoDocumento === "cnpj";

  async function handleCepBlur() {
    const digits = onlyDigits(values.cep);
    if (digits.length !== 8) return;
    setCepLoading(true);
    setCepAviso(null);
    const encontrado = await lookupCep(digits);
    setCepLoading(false);
    if (!encontrado) {
      // Nao e erro: CEP novo pode nao estar na base, e o servico pode estar
      // fora. A pessoa preenche a mao e segue.
      // TODO(Ana): aviso de CEP nao encontrado (nao e erro, e convite a preencher a mao).
      setCepAviso("Não encontramos esse CEP. Você pode preencher à mão.");
      return;
    }
    setValues((prev) => ({
      ...prev,
      // Nao sobrescreve o que a pessoa ja digitou: o autofill preenche o que
      // esta vazio. Apagar um complemento digitado seria pior que nao ajudar.
      logradouro: prev.logradouro || encontrado.logradouro,
      bairro: prev.bairro || encontrado.bairro,
      cidade: encontrado.cidade,
      uf: encontrado.uf,
    }));
    setCodigoMunicipio(encontrado.codigoMunicipio);
  }

  async function handleSave() {
    setSubmetido(true);
    const found = fiscalFormErrors(values);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setError(null);
    try {
      const payload = fiscalFormToPayload(values);
      if (codigoMunicipio) {
        payload.endereco_codigo_municipio = codigoMunicipio;
      }
      await updateMyProfile(payload);
      onSaved();
    } catch {
      // TODO(Ana): copy do erro ao salvar dados fiscais
      setError("Não deu pra salvar agora. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-[2.5px] border-slate-900 bg-[var(--brand-cream)] shadow-[6px_6px_0_#7c3aed]">
        {/* TODO(Ana): titulo nos dois contextos (checkout e perfil) e o
            paragrafo de finalidade logo abaixo. */}
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black text-slate-950">
            {contexto === "checkout"
              ? "Antes de assinar, seus dados de nota"
              : "Dados para a sua nota fiscal"}
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-600">
            Para emitir a nota fiscal da sua assinatura, precisamos do seu nome
            completo e CPF ou CNPJ. Usamos esses dados exclusivamente para a
            emissão.
          </DialogDescription>
        </DialogHeader>

        {/* TODO(Ana): rotulos, placeholders e legendas de TODOS os campos do
            formulario abaixo (tipo de documento, razao social, nome completo,
            CPF ou CNPJ, e o bloco de endereco). */}
        <div className="mt-2 flex flex-col gap-4">
          <fieldset>
            <legend className={labelClass}>Tipo de documento</legend>
            <div className="flex gap-2">
              {(["cpf", "cnpj"] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => {
                    set("tipoDocumento", tipo);
                    // O documento e limpo na troca: uma mascara de CPF com
                    // digitos de CNPJ atras ficaria plausivel e errada.
                    set("documento", "");
                  }}
                  aria-pressed={values.tipoDocumento === tipo}
                  className={`flex-1 rounded-[11px] border-[2.5px] border-slate-900 px-3 py-2 text-sm font-black uppercase shadow-[3px_3px_0_var(--bnt-shadow)] transition-all ${
                    values.tipoDocumento === tipo
                      ? "bg-[var(--brand-yellow)] text-ink-on-accent"
                      : "bg-white text-slate-600"
                  }`}
                >
                  {tipo === "cpf" ? "CPF" : "CNPJ"}
                </button>
              ))}
            </div>
          </fieldset>

          {pj ? (
            <label className="block">
              <span className={labelClass}>Razão social</span>
              <input
                type="text"
                value={values.razaoSocial}
                onChange={(e) => set("razaoSocial", e.target.value)}
                className={inputClass}
                placeholder="Nome da empresa no CNPJ"
              />
              {errors.razaoSocial ? (
                <span className="mt-1 block text-xs font-bold text-red-600">
                  {errors.razaoSocial}
                </span>
              ) : null}
            </label>
          ) : (
            <label className="block">
              <span className={labelClass}>Nome completo</span>
              <input
                type="text"
                autoComplete="name"
                value={values.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                className={inputClass}
                placeholder="Nome e sobrenome"
              />
              {errors.fullName ? (
                <span className="mt-1 block text-xs font-bold text-red-600">
                  {errors.fullName}
                </span>
              ) : null}
            </label>
          )}

          <label className="block">
            <span className={labelClass}>{pj ? "CNPJ" : "CPF"}</span>
            <input
              type="text"
              inputMode="numeric"
              value={values.documento}
              onChange={(e) =>
                set(
                  "documento",
                  pj ? maskCnpj(e.target.value) : maskCpf(e.target.value),
                )
              }
              className={inputClass}
              placeholder={pj ? "00.000.000/0000-00" : "000.000.000-00"}
            />
            {errors.documento ? (
              <span className="mt-1 block text-xs font-bold text-red-600">
                {errors.documento}
              </span>
            ) : null}
          </label>

          <div className="rounded-[11px] border-[2.5px] border-dashed border-slate-300 p-3">
            {/* TODO(Ana): titulo do bloco de endereco e a frase que explica
                por que ele e pedido. */}
            <p className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">
              Endereço (recomendado)
            </p>
            <p className="mb-3 text-xs font-medium text-slate-500">
              Algumas prefeituras exigem o endereço do tomador na nota.
            </p>

            <label className="block">
              <span className={labelClass}>CEP</span>
              <input
                type="text"
                inputMode="numeric"
                value={values.cep}
                onChange={(e) => set("cep", maskCep(e.target.value))}
                onBlur={handleCepBlur}
                className={inputClass}
                placeholder="00000-000"
              />
              {cepLoading ? (
                <span className="mt-1 block text-xs font-bold text-slate-500">
                  {/* TODO(Ana): estado de busca do CEP. */}
                  Buscando endereço...
                </span>
              ) : null}
              {cepAviso ? (
                <span className="mt-1 block text-xs font-bold text-amber-700">
                  {cepAviso}
                </span>
              ) : null}
              {errors.cep ? (
                <span className="mt-1 block text-xs font-bold text-red-600">
                  {errors.cep}
                </span>
              ) : null}
            </label>

            <div className="mt-3 grid grid-cols-[2fr_1fr] gap-3">
              <label className="block">
                <span className={labelClass}>Logradouro</span>
                <input
                  type="text"
                  value={values.logradouro}
                  onChange={(e) => set("logradouro", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Número</span>
                <input
                  type="text"
                  value={values.numero}
                  onChange={(e) => set("numero", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Complemento</span>
                <input
                  type="text"
                  value={values.complemento}
                  onChange={(e) => set("complemento", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Bairro</span>
                <input
                  type="text"
                  value={values.bairro}
                  onChange={(e) => set("bairro", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-3 grid grid-cols-[2fr_1fr] gap-3">
              <label className="block">
                <span className={labelClass}>Cidade</span>
                <input
                  type="text"
                  value={values.cidade}
                  onChange={(e) => set("cidade", e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>UF</span>
                <select
                  value={values.uf}
                  onChange={(e) => set("uf", e.target.value)}
                  className={inputClass}
                >
                  <option value="">--</option>
                  {UF_LIST.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
                {errors.uf ? (
                  <span className="mt-1 block text-xs font-bold text-red-600">
                    {errors.uf}
                  </span>
                ) : null}
              </label>
            </div>
          </div>

          {error ? (
            <p className="text-xs font-bold text-red-600">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-[11px] border-[2.5px] border-slate-900 bg-[var(--brand-yellow)] px-4 py-2.5 text-sm font-black text-ink-on-accent shadow-[3px_3px_0_var(--bnt-shadow)] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_var(--bnt-shadow)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {/* TODO(Ana): os tres rotulos do botao de salvar (salvando, e os
                dois textos por contexto). */}
            {saving
              ? "Salvando..."
              : contexto === "checkout"
                ? "Salvar e continuar"
                : "Salvar dados fiscais"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
