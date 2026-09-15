// Declaracao minima do css-tree (3.2.1), so com o que o validarCss usa. Mesmo
// caminho do scripts/jsdom.d.ts do Lote 08: o pacote nao publica tipos, e a
// regra do CLAUDE.md e nao acrescentar dependencia (aqui, um @types) que a
// tarefa nao pediu.
declare module "css-tree" {
  export interface CssLocation {
    start: { offset: number; line: number; column: number };
    end: { offset: number; line: number; column: number };
  }

  export interface CssNode {
    type: string;
    loc?: CssLocation | null;
    name?: string;
    property?: string;
    kind?: string;
    value?: CssNode;
    prelude?: CssNode | null;
    children?: { toArray(): CssNode[] } | null;
  }

  export interface SyntaxMatchResult {
    error: { message: string } | null;
  }

  export interface ParseOptions {
    positions?: boolean;
    onParseError?: (error: { message: string }) => void;
  }

  export function parse(source: string, options?: ParseOptions): CssNode;
  export function generate(node: CssNode): string;
  export function walk(
    ast: CssNode,
    options: { visit?: string; enter?: (node: CssNode) => void },
  ): void;

  export const lexer: {
    matchProperty(property: string, value: CssNode): SyntaxMatchResult;
  };
}
