import { z } from "zod";

/**
 * Converte um schema Zod pro formato JSON Schema aceito pelo
 * "structured outputs" da OpenAI em strict mode.
 *
 * Regras do strict mode (resumo):
 * - todo objeto precisa de additionalProperties: false
 * - todo objeto precisa listar TODAS as propriedades em required
 * - campos "opcionais" (na lógica do Zod) são tratados como required + nullable
 * - palavras-chave de constraint (minLength, format, pattern, etc) são
 *   ignoradas ou rejeitadas: a gente remove
 *
 * O resultado é um objeto JSON Schema pronto pra ir no campo
 * response_format.json_schema.schema do chat completions.
 */

const UNSUPPORTED_KEYWORDS = [
  "minLength",
  "maxLength",
  "pattern",
  "format",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minItems",
  "maxItems",
  "uniqueItems",
  "default",
  "examples",
  "$schema",
  "$id",
] as const;

type JsonNode = Record<string, unknown> | unknown;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function makeNullable(node: JsonNode): JsonNode {
  if (!isPlainObject(node)) return node;

  const t = node.type;
  if (typeof t === "string" && t !== "null") {
    return { ...node, type: [t, "null"] };
  }
  if (Array.isArray(t)) {
    if (!t.includes("null")) {
      return { ...node, type: [...t, "null"] };
    }
    return node;
  }
  if (Array.isArray(node.anyOf)) {
    const hasNull = node.anyOf.some(
      (item) => isPlainObject(item) && item.type === "null",
    );
    if (hasNull) return node;
    return { ...node, anyOf: [...node.anyOf, { type: "null" }] };
  }
  if (node.enum && Array.isArray(node.enum)) {
    return { ...node, type: ["string", "null"], enum: [...node.enum, null] };
  }
  // Fallback: wrap in anyOf
  return { anyOf: [node, { type: "null" }] };
}

function strictify(node: JsonNode): JsonNode {
  if (!isPlainObject(node)) return node;

  const out: Record<string, unknown> = { ...node };

  for (const key of UNSUPPORTED_KEYWORDS) {
    delete out[key];
  }

  if (isPlainObject(out.properties)) {
    const originalRequired = new Set(
      Array.isArray(out.required) ? (out.required as string[]) : [],
    );
    const newProps: Record<string, unknown> = {};
    for (const [propKey, propValue] of Object.entries(out.properties)) {
      let processed = strictify(propValue);
      if (!originalRequired.has(propKey)) {
        processed = makeNullable(processed);
      }
      newProps[propKey] = processed;
    }
    out.properties = newProps;
    out.required = Object.keys(newProps);
    out.additionalProperties = false;
    if (out.type === undefined) out.type = "object";
  }

  if (out.items !== undefined) {
    out.items = strictify(out.items);
  }

  for (const combinator of ["anyOf", "allOf", "oneOf"] as const) {
    if (Array.isArray(out[combinator])) {
      out[combinator] = (out[combinator] as unknown[]).map((branch) =>
        strictify(branch),
      );
    }
  }

  if (isPlainObject(out.$defs)) {
    const defs: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(out.$defs)) {
      defs[k] = strictify(v);
    }
    out.$defs = defs;
  }

  return out;
}

export function toOpenAIStrictSchema(
  zodSchema: z.ZodTypeAny,
): Record<string, unknown> {
  const raw = z.toJSONSchema(zodSchema);
  const strict = strictify(raw);
  if (!isPlainObject(strict)) {
    throw new Error(
      "toOpenAIStrictSchema: resultado inesperado, schema raiz não é objeto",
    );
  }
  return strict;
}
