// Bases nomeadas dos blocos de SQL das licoes (Lote 11a). Uma cerca
// ```sql banco=<nome> executa o bloco DEPOIS de carregar a base <nome> daqui,
// e e isso que torna a trilha escrevivel: CREATE TABLE mais INSERT mais a
// consulta nao cabem nas 10 linhas de um bloco.
//
// Registro unico, e nao arquivo solto: o verificador de blocos le daqui, e um
// nome fora deste mapa e erro de cerca.
//
// A base "teste" existe so para os controles do mecanismo. A base de verdade
// da trilha de SQL, e como a trilha a apresenta ao aluno, sao decisoes do
// Lote 11.
export const SQL_BANCOS: Record<string, string> = {
  teste: [
    "CREATE TABLE clientes (id INTEGER PRIMARY KEY, nome TEXT NOT NULL);",
    "CREATE TABLE pedidos (",
    "  id INTEGER PRIMARY KEY,",
    "  cliente_id INTEGER REFERENCES clientes (id),",
    "  total REAL",
    ");",
    "INSERT INTO clientes VALUES (1, 'Ana'), (2, 'Bruno');",
    "INSERT INTO pedidos VALUES (1, 1, 50.0), (2, 1, 20.5), (3, 2, 10);",
    "",
  ].join("\n"),
};

// Leitura tolerante a nome fora do mapa (undefined, nunca a propriedade de
// Object.prototype): "banco=toString" nao pode passar por base valida.
export function sqlBancoOf(nome: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(SQL_BANCOS, nome)
    ? SQL_BANCOS[nome]
    : undefined;
}
