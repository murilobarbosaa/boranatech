// Reexport do gerado, para o caminho de import ficar estavel (`./all`) mesmo
// que o formato do arquivo gerado mude. Quem consome nao precisa saber que ha
// um gerador atras.
//
// So para testes e para o server (que nao se importa com tamanho de bundle).
// O client NUNCA importa este arquivo nem o gerado: o guard em
// client/src/lib/projectsV2Import.test.ts afirma isso, e existe porque
// importar `all` "por conveniencia" numa tela desfaz sozinho o motivo de o
// detalhe v2 morar em modulo separado.
export { PROJETOS_V2 } from "./all.generated";
