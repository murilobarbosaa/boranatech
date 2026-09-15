// Tipos minimos do jsdom para os scripts (Lote 08).
//
// O pacote nao traz .d.ts proprio e `@types/jsdom` nao e dependencia deste
// projeto; a regra do CLAUDE.md e nao acrescentar dependencia que a tarefa nao
// pediu, entao aqui fica declarado SO o que o verificador de blocos usa. O
// `lib` do tsconfig base ja traz `dom`, de onde vem Document, DocumentFragment
// e Element.
declare module "jsdom" {
  export class JSDOM {
    constructor(html: string);
    readonly window: { readonly document: Document };
    static fragment(html: string): DocumentFragment;
  }
}
