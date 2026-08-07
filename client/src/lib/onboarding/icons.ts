// Biblioteca de icones do onboarding, transcrita 1:1 do objeto `I` de
// design/onboardings/Onboarding_01_Home_1.html (bloco "2. ICONES").
//
// NAO trocar por lucide-react: os tracos, os raios e o peso da linha fazem
// parte da identidade visual desses cards, e o equivalente do lucide nao bate.
// O valor de cada chave e o MIOLO de um <svg viewBox="0 0 24 24">, renderizado
// pelo componente <OnbIcon> (client/src/components/onboarding/icons.tsx).
export const ONBOARDING_ICONS = {
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="M12 5 14 12 12 19 10 12Z" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  map: '<path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
  rocket:
    '<path d="M12 3c4 3 5 8 3 13H9C7 11 8 6 12 3Z"/><circle cx="12" cy="9" r="2"/><path d="M9 15l-3 4M15 15l3 4"/>',
  sprout:
    '<path d="M12 20v-7M12 13c0-4-3-6-7-6 0 4 3 6 7 6ZM12 11c0-3 3-5 6-5 0 3-3 5-6 5Z"/>',
  target:
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  braces:
    '<path d="M8 4C5 4 6 10 3 12c3 2 2 8 5 8"/><path d="M16 4c3 0 2 6 5 8-3 2-2 8-5 8"/>',
  book: '<path d="M4 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4Z"/><path d="M20 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7Z"/>',
  chat: '<path d="M4 5h16v10h-9l-4 4v-4H4Z"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10c-1 1-1 2-1 3H9c0-1 0-2-1-3a6 6 0 0 1 4-10Z"/>',
  code: '<polyline points="9,8 5,12 9,16"/><polyline points="15,8 19,12 15,16"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"/><path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 15.4c2 .7 3.5 2.2 3.5 4.6"/>',
  case: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12h18"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 2.5 15 0 18-2.5-3-2.5-15.4 0-18Z"/>',
  trophy:
    '<path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v3M9 20h6"/>',
  lock: '<rect x="4.5" y="10" width="15" height="10" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
  check:
    '<circle cx="12" cy="12" r="9"/><polyline points="8,12.3 11,15.2 16,9.4"/>',
  cpu: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  news: '<path d="M4 6h12v14H5a1 1 0 0 1-1-1Z"/><path d="M16 9h4v9a2 2 0 0 1-4 0Z"/><path d="M7 9.5h6M7 13h6M7 16.5h4"/>',
  cal: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  tools:
    '<path d="M14.5 5.5a4 4 0 0 0 5.2 5.2L11 19.4a2.4 2.4 0 0 1-3.4-3.4Z"/><path d="M6.5 4.5 9 7 7 9 4.5 6.5a1.4 1.4 0 0 1 2-2Z"/>',
  cap: '<path d="M12 4 2.5 9 12 14l9.5-5Z"/><path d="M6.5 11.2V16c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-4.8M21.5 9v5"/>',
  az: '<path d="M4 17 7 8l3 9M4.8 14.4h4.4"/><path d="M14 8h6l-6 9h6"/>',
  heart:
    '<path d="M12 20S4 15 4 9.6A4.1 4.1 0 0 1 12 7.4 4.1 4.1 0 0 1 20 9.6C20 15 12 20 12 20Z"/>',
  layers:
    '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5M3 17l9 5 9-5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  chart:
    '<path d="M4 20V4M4 20h16"/><rect x="7.5" y="12" width="3" height="5"/><rect x="12.5" y="8.5" width="3" height="8.5"/><rect x="17" y="5.5" width="3" height="11.5"/>',
  spark:
    '<path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9Z"/>',
  flag: '<path d="M6 21V4M6 4h11l-2.2 3.5L17 11H6"/>',
  term: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><polyline points="7,10 9.5,12 7,14"/><path d="M12.5 14.5h4"/>',
  cloud:
    '<path d="M7 18a4 4 0 0 1 .6-8 5.2 5.2 0 0 1 9.8 1.4A3.5 3.5 0 0 1 17 18Z"/>',
  cursor: '<path d="M6 3.5 18.5 12 12.6 13.2 10 19.5Z"/>',
} as const;

export type OnboardingIconName = keyof typeof ONBOARDING_ICONS;

/** Nomes na ordem de declaracao. O fundo da pagina indexa por esta ordem. */
export const ONBOARDING_ICON_NAMES = Object.keys(
  ONBOARDING_ICONS,
) as OnboardingIconName[];
