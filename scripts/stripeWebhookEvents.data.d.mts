// Tipos do modulo de dados. O modulo em si e .mjs de propósito: ele e importado
// por scripts/stripe-webhook-events.mjs, que roda com `node` puro (sem tsx), e
// tambem pelo teste que trava a sincronia com o switch de handleWebhook.
export declare const HANDLED_EVENTS: readonly string[];
export declare const UNHANDLED_ON_PURPOSE: Readonly<Record<string, string>>;
export declare const EXPECTED_EVENTS: readonly string[];
