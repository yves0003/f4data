type TokenType =
  | "KEYWORD"
  | "STRING"
  | "IDENTIFIER"
  | "LBRACE"
  | "RBRACE"
  | "LBRACKET"
  | "RBRACKET"
  | "COLON"
  | "DOT"
  | "HASH"
  | "COMMA"
  | "AS"
  | "NOTE"
  | "PERIOD"
  | "FREQ"
  | "REF" // New
  | "GT" // New: >
  | "LT" // New: <
  | "DASH" // New: -
  | "DOUBLE_ARROW" // New: <>
  | "EOF"
  | "DEFINITION"
  | "TABLE"
  | "RELATIONAL_OPERATOR";

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

interface ASTNode {
  type: string;
  [key: string]: unknown;
}

interface TableDefinition extends ASTNode {
  type: "Table";
  library: string;
  name: string;
  alias?: string;
  body: ASTNode[];
  definition?: string;
}

interface ColumnDefinition extends ASTNode {
  type: "Column";
  name: string;
  columnType: string;
  settings: string[];
  definition?: string;
}

interface RefDefinition extends ASTNode {
  type: "Ref";
  sourceTable: string;
  sourceColumn: string;
  relationship: string;
  targetTable: string;
  targetColumn: string;
  definition?: string;
}
// Add a toJSON method to handle serialization (optional)
interface ASTNode {
  toJSON?: () => object;
}

interface Number {
  roundTo(decimals: number): number;
}

type Ref = {
  type: string;
  left: string;
  relationship: string;
  right: string;
};

type TableVariable = {
  table: string;
  variable: string;
};

type Transformed = {
  rect1: TableVariable;
  rect2: TableVariable;
};
