import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMyProfile, updateMyProfile } from "@/services/profileService";
import {
  isValidCpf,
  type MissingProfileField,
} from "@shared/certificates/types";

// Modal do item 2: coleta so os campos que faltam (missing). CPF com mascara de
// digitacao, mas envia SO digitos. Validacao no client e feedback imediato;
// a do server (PATCH /api/me) continua sendo a que vale.
type CompleteProfileModalProps = {
  open: boolean;
  missing: MissingProfileField[];
  onClose: () => void;
  // Salvou com sucesso: quem chama reavalia a elegibilidade e fecha o modal.
  onSaved: () => void;
};

function maskCpf(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 9),
    digits.slice(9, 11),
  ].filter(Boolean);
  if (parts.length <= 3) return parts.join(".");
  return `${parts.slice(0, 3).join(".")}-${parts[3]}`;
}

function isValidFullName(name: string): boolean {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.every((word) => word.length >= 2);
}

const inputClass =
  "w-full rounded-[11px] border-[2.5px] border-slate-900 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-950 shadow-[3px_3px_0_#0f172a] outline-none focus:-translate-y-px focus:shadow-[4px_4px_0_#0f172a]";

export default function CompleteProfileModal({
  open,
  missing,
  onClose,
  onSaved,
}: CompleteProfileModalProps) {
  const needsName = missing.includes("full_name");
  const needsCpf = missing.includes("cpf");

  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill do nome com profiles.name (pode ser apelido), campo editavel.
  useEffect(() => {
    if (!open || !needsName) return;
    let cancelled = false;
    getMyProfile()
      .then((profile) => {
        if (!cancelled && profile.name) setFullName(profile.name);
      })
      .catch(() => {
        /* prefill e best-effort; sem ele o campo comeca vazio */
      });
    return () => {
      cancelled = true;
    };
  }, [open, needsName]);

  const cpfDigits = useMemo(() => cpf.replace(/\D/g, ""), [cpf]);
  const nameOk = !needsName || isValidFullName(fullName);
  const cpfOk = !needsCpf || isValidCpf(cpfDigits);
  const canSave = nameOk && cpfOk && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const updates: Record<string, string> = {};
      if (needsName) updates.full_name = fullName.trim();
      if (needsCpf) updates.cpf = cpfDigits;
      await updateMyProfile(updates);
      onSaved();
    } catch {
      // TODO(Ana): copy do erro de salvar identidade
      setError("Não deu pra salvar agora. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="border-[2.5px] border-slate-900 bg-[#faf8f4] shadow-[6px_6px_0_#7c3aed]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black text-slate-950">
            {/* TODO(Ana): titulo do modal de completar perfil */}
            Falta um passo para o seu certificado
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-600">
            {/* TODO(Ana): explica por que pedimos CPF */}
            O CPF consta no certificado e é o que permite a validação por
            faculdades e empresas.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4">
          {needsName ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-700">
                {/* TODO(Ana): rotulo do nome completo */}
                Nome completo
              </span>
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={inputClass}
                placeholder="Nome e sobrenome"
              />
              {fullName.trim() !== "" && !nameOk ? (
                <span className="mt-1 block text-xs font-bold text-red-600">
                  {/* TODO(Ana): erro de nome incompleto */}
                  Informe nome e sobrenome.
                </span>
              ) : null}
            </label>
          ) : null}

          {needsCpf ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-700">
                {/* TODO(Ana): rotulo do CPF */}
                CPF
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(event) => setCpf(maskCpf(event.target.value))}
                className={inputClass}
                placeholder="000.000.000-00"
              />
              {cpfDigits.length === 11 && !cpfOk ? (
                <span className="mt-1 block text-xs font-bold text-red-600">
                  {/* TODO(Ana): erro de CPF invalido */}
                  CPF inválido.
                </span>
              ) : null}
            </label>
          ) : null}

          {error ? (
            <p className="text-xs font-bold text-red-600">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center justify-center rounded-[11px] border-[2.5px] border-slate-900 bg-[#FFB800] px-4 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_#0f172a]"
          >
            {/* TODO(Ana): label do botao salvar identidade */}
            {saving ? "Salvando..." : "Salvar e continuar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
