import {
  ONBOARDING_ICONS,
  type OnboardingIconName,
} from "@/lib/onboarding/icons";
import logoSrc from "./bnt-logo.png";

// Porte React das funcoes `svg()`, `star()` e `logo()` do HTML de referencia
// (bloco "1. MARCA" e "2. ICONES").
//
// `dangerouslySetInnerHTML` aqui e sobre CONSTANTE de modulo, nunca sobre dado
// de usuario ou de servidor: o miolo vem de ONBOARDING_ICONS, que e um objeto
// literal no repositorio. A alternativa era reescrever 32 icones em JSX a mao,
// que troca um risco inexistente por um risco real de transcricao.

interface OnbIconProps {
  name: OnboardingIconName;
  size: number;
  color?: string;
  width?: number;
  className?: string;
}

export function OnbIcon({
  name,
  size,
  color = "#0B1020",
  width = 1.9,
  className,
}: OnbIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ONBOARDING_ICONS[name] }}
    />
  );
}

/** Estrela de 4 pontas, assinatura visual dos stories. */
export function OnbStar({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 1.6 14.1 9.9 22.4 12 14.1 14.1 12 22.4 9.9 14.1 1.6 12 9.9 9.9Z"
        fill={color}
      />
    </svg>
  );
}

/**
 * Logo da marca. No HTML era um data URI base64 dentro do proprio arquivo;
 * aqui e um PNG importado (o Vite emite com hash e ele sai do bundle JS).
 */
export function OnbLogo({ size }: { size: number }) {
  return (
    <img
      src={logoSrc}
      width={size}
      height={size}
      alt="Bora na Tech"
      decoding="async"
    />
  );
}
