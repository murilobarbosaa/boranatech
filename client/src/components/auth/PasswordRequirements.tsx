import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordRequirementsProps {
  value: string;
  isFocused: boolean;
}

interface Requirement {
  label: string;
  test: (pw: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: "8+ caracteres", test: (pw) => pw.length >= 8 },
  { label: "letra maiúscula", test: (pw) => /[A-Z]/.test(pw) },
  { label: "letra minúscula", test: (pw) => /[a-z]/.test(pw) },
  { label: "número", test: (pw) => /[0-9]/.test(pw) },
  { label: "caractere especial", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function PasswordRequirements({
  value,
  isFocused,
}: PasswordRequirementsProps) {
  const checks = useMemo(
    () =>
      REQUIREMENTS.map((req) => ({ label: req.label, valid: req.test(value) })),
    [value],
  );

  const allValid = checks.every((check) => check.valid);
  const shouldShow = isFocused || (value.length > 0 && !allValid);

  return (
    <AnimatePresence initial={false}>
      {shouldShow && (
        <motion.div
          key="password-requirements"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
            <p className="mb-2 text-slate-800">Sua senha precisa ter:</p>
            <div className="flex flex-wrap gap-2">
              {checks.map((check) => (
                <span
                  key={check.label}
                  className={cn(
                    "rounded-full px-2 py-1 transition-colors",
                    check.valid
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-white text-slate-500",
                  )}
                >
                  {check.label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
