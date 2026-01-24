export const Spec: [
  RegExp,
  (
    | "}"
    | "{"
    | "TABLE"
    | "DEFINITION"
    | "ENUM"
    | "DOT"
    | "IDENTIFIER"
    | "COL"
    | "REF"
    | "AS"
    | "NOTE"
    | "FREQ"
    | "PERIOD"
    | "COLON"
    | "RELATIONAL_OPERATOR"
    | "STRING"
    | "COMMA"
    | "LBRACKET"
    | "RBRACKET"
    | "RBRACE"
    | "LBRACE"
    | "TRIPLE_QUOTE_STRING"
    | "NEWLINE"
    | null
  )
][] = [
  // Whitespace and comments
  [/^\s+/, null],
  [/^\/\/.*/, null],
  //[/^\/\*[\s\S]*?\*\//, null],
  [/^[ \t\r]+/, null],
  //New line
  //[/\r?\n/y, "NEWLINE"],
  // Multi-line strings
  [/^```[\s\S]*?```/, "TRIPLE_QUOTE_STRING"],
  [/^'''[\s\S]*?'''/, "TRIPLE_QUOTE_STRING"],
  [/^"""[\s\S]*?"""/, "TRIPLE_QUOTE_STRING"],
  // Strings
  [/^'(?:\\.|[^'])*'/, "STRING"],
  [/^"(?:\\.|[^"])*"/, "STRING"],
  // Keywords => gpt=[/^#.*/, "DEFINITION"],
  //[/^#.*\b/, "DEFINITION"],
  [/^#(.*)/, "DEFINITION"],
  [/^enum\b/i, "ENUM"],
  [/^table\b/i, "TABLE"],
  [/^ref\b/i, "REF"],
  [/^as\b/i, "AS"],
  [/^note\b/i, "NOTE"],
  [/^period\b/i, "PERIOD"],
  [/^(?:freq|frequency)\b/i, "FREQ"],
  //Punctuation
  [/^\{/, "LBRACE"],
  [/^\}/, "RBRACE"],
  [/^\./, "DOT"],
  [/^\[/, "LBRACKET"],
  [/^\]/, "RBRACKET"],
  [/^:/, "COLON"],
  [/^\./, "DOT"],
  [/^,/, "COMMA"],
  //Relationships
  [/^<>/, "RELATIONAL_OPERATOR"],
  [/^[><-]/, "RELATIONAL_OPERATOR"],
  // the rest
  //[/^\w+/, "IDENTIFIER"],
  [/^[\wáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜ'-]+/, "IDENTIFIER"],
  [/\n/, "NEWLINE"],
];

export class Tokenizer {
  _string = "";
  _cursor = 0;
  private _lineStarts: number[] = [0];
  _nbLines = 0;

  init(string: string) {
    this._string = string;
    this._cursor = 0;
    this._nbLines = string.split(/\n/).length;
  }

  hasMoreTokens() {
    return this._cursor < this._string.length;
  }
  isEOF() {
    return this._cursor === this._string.length;
  }
  getLineNumber() {
    return this._nbLines - this._string.slice(this._cursor).split(/\n/).length;
  }
  getNextToken():
    | undefined
    | null
    | {
        type: (typeof Spec)[0][1];
        value: string;
        line: number;
      } {
    if (!this.hasMoreTokens()) {
      return null;
    }
    const string = this._string.slice(this._cursor);

    for (const [regexp, tokenType] of Spec) {
      const tokenValue = this._match(regexp, string);
      if (tokenValue === null) {
        continue;
      }
      if (tokenType === null) {
        return this.getNextToken();
      }
      return {
        type: tokenType,
        value: tokenValue,
        line: this.getLineNumber(),
      };
    }
  }

  _match(regexp: RegExp, string: string) {
    const matched = regexp.exec(string);
    if (matched === null) {
      return null;
    }
    this._cursor += matched[0].length;
    return matched[0];
  }
}
