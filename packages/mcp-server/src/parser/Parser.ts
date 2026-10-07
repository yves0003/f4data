import { Spec, Tokenizer } from "./Tokenizer.js";

export class Parser {
  private _tokenizer = new Tokenizer();
  private _lookahead: ReturnType<Tokenizer["getNextToken"]> = undefined;
  private errors: string[] = [];

  parse(string: string) {
    this.errors = [];
    this._tokenizer.init(string);
    this._lookahead = this._tokenizer.getNextToken();
    const body = [];
    while (this._lookahead !== null) {
      try {
        body.push(this.parseStatement());
      } catch (e) {
        this.errors.push((e as Error).message);
        this._recoverFromError();
      }
    }
    return { type: "Program", body, errors: this.errors };
  }

  private parseStatement() {
    switch (this._lookahead?.type) {
      case "PROPS":
        return this.parseProps();
      case "DEFINITION":
        return this.parseDefinition();
      case "TABLE":
        return this.parseTable();
      case "REF":
        return this.parseRef();
      case "ENUM":
        return this.parseEnum();
      default:
        this.errors.push(
          `Unexpected token '${this._lookahead?.value as string}' of type '${
            this._lookahead?.type as string
          }' at line ${this._lookahead?.line as number}`
        );
        this._recoverFromError();
        return null;
    }
  }

  private parseEnum() {
    this._eat("ENUM");
    const allNames = this.parseMultiQualifiedName();
    const [last_table, last_name] = allNames.slice(-1)!;
    if (this._lookahead?.type !== "LBRACE") {
      this.errors.push(
        `Expected '{' after enum name '${last_name || ""}' at line ${
          this._lookahead?.line ?? "unknown"
        }`
      );
      this._recoverFromError();
      return {
        type: "Enum",
        name: last_name,
        table: last_table || "Global",
        members: [],
        incomplete: true,
      };
    }

    this._eat("LBRACE");
    while ((this._lookahead?.type as string) === "NEWLINE") {
      this._eat("NEWLINE");
    }

    const members: { key: string; description: string; note: string }[] = [];
    while (
      this._lookahead &&
      (this._lookahead?.type as string) !== "RBRACE" &&
      this._lookahead !== null
    ) {
      if ((this._lookahead?.type as string) === "NEWLINE") break;
      if ((this._lookahead?.type as string) === "RBRACE") break;
      members.push(this.parseEnumMember());
    }

    this._eat("RBRACE");
    return {
      type: "Enum",
      allEnum: allNames.map((a) => ({
        type: "Enum",
        table: a[0] || "Global",
        name: a[1],
        members,
      })),
    };
  }

  private parseEnumMember() {
    const key = this.parseEnumKey();
    let description = "";
    let note = "";

    if (this._lookahead?.type === "COLON") {
      this._eat("COLON");
      description = this.collectTokensUntil(["NEWLINE", "LBRACKET", "RBRACE"]);
    }
    if (this._lookahead?.type === "LBRACKET") {
      note = this.parseNote2();
    }
    if (this._lookahead?.type === "NEWLINE") {
      this._eat("NEWLINE");
    }

    return { key, description: description.trim(), note };
  }

  private collectTokensUntil(stopTypes: string[]): string {
    let tokens = "";
    const line = this._lookahead?.line;
    while (
      this._lookahead &&
      !stopTypes.includes(this._lookahead.type as string) &&
      line === this._lookahead.line
    ) {
      const token = this._eat(this._lookahead.type);
      if (token) tokens += token.value + " ";
    }
    return tokens.trim();
  }

  private parseNote2(): string {
    this._eat("LBRACKET");
    this._eat("NOTE");
    this._eat("COLON");
    const noteValue = this.parseString();
    this._eat("RBRACKET");
    return noteValue ? noteValue : "";
  }

  private parseEnumKey(): string {
    if (this._lookahead?.type === "STRING") {
      const token = this._eat("STRING");
      return token ? token.value.slice(1, -1) : "";
    }
    const token = this._eat("IDENTIFIER");
    return token ? token.value : "";
  }

  private _recoverFromError() {
    while (this._lookahead !== null) {
      if (
        this._lookahead &&
        (this._lookahead.type === "DEFINITION" ||
          this._lookahead.type === "TABLE" ||
          this._lookahead.type === "REF" ||
          this._lookahead.type === "RBRACE")
      ) {
        break;
      }
      this._lookahead = this._tokenizer.getNextToken();
    }
  }

  private parseRef() {
    this._eat("REF");
    this._eat("COLON");
    const left = this.parseQualifiedName().join(".");
    const relationshipToken = this._eat("RELATIONAL_OPERATOR");
    const relationship = relationshipToken ? relationshipToken.value : "";
    const right = this.parseQualifiedName().join(".");
    return { type: "Ref", left, relationship, right };
  }

  private parseTable() {
    this._eat("TABLE");
    const [library, name] = this.parseQualifiedName();
    const alias = this.parseAlias();

    if (this._lookahead?.type !== "LBRACE") {
      this.errors.push(
        `Missing '{' after table declaration at line ${
          this._lookahead?.line ?? "unknown"
        }`
      );
      this._recoverFromError();
      return {
        type: "Table",
        library: library || "public",
        name,
        alias,
        body: [],
        incomplete: true,
      };
    }

    this._eat("LBRACE");
    const body = [];
    while (this._lookahead && (this._lookahead?.type as string) !== "RBRACE") {
      if (
        (this._lookahead.type as string) === "TABLE" ||
        (this._lookahead.type as string) === "REF"
      ) {
        this.errors.push(
          `Unexpected ${this._lookahead.type} inside table body at line ${this._lookahead.line}`
        );
        this._recoverFromError();
        return { type: "Table", library: library || "public", name, alias, body, incomplete: true };
      }
      body.push(this.parseTableElement());
    }

    this._eat("RBRACE");
    return { type: "Table", library: library || "public", name, alias, body };
  }

  private parseTableElement() {
    switch (this._lookahead?.type) {
      case "NOTE":
        return this.parseNote();
      case "PERIOD":
        return this.parsePeriod();
      case "FREQ":
        return this.parseFreq();
      case "DEFINITION":
        return this.parseDefinition();
      default:
        return this.parseVariableLine();
    }
  }

  private parseNote() {
    this._eat("NOTE");
    this._eat("COLON");
    const value = this.parseString();
    return { type: "Note", value };
  }

  private parsePeriod() {
    this._eat("PERIOD");
    this._eat("COLON");
    const value = this.parseString();
    return { type: "Period", value };
  }

  private parseFreq() {
    this._eat("FREQ");
    this._eat("COLON");
    const value = this.parseString();
    return { type: "Frequency", value };
  }

  private parseDefinition() {
    const value = this._eat("DEFINITION")?.value;
    return { type: "Definition", value: value?.slice(1).trim() };
  }

  private parseProps() {
    const value = this._eat("PROPS")?.value;
    return { type: "PropsFile", value: value?.slice(1).trim() };
  }

  private parseString() {
    if (this._lookahead?.type === "TRIPLE_QUOTE_STRING") {
      const value = this._eat("TRIPLE_QUOTE_STRING")?.value;
      return value?.slice(3, -3).trim();
    }
    const token = this._eat("STRING");
    return token?.value.slice(1, -1);
  }

  private parseQualifiedName() {
    const allNames = [];
    const parts = [this._eat("IDENTIFIER")?.value];
    while (this._lookahead?.type === "DOT") {
      this._eat("DOT");
      parts.push(this._eat("IDENTIFIER")?.value || "");
    }
    if (parts.length === 1) {
      allNames.push([null, parts[0]]);
    } else {
      allNames.push([parts[0], parts[1]]);
    }
    if (this._lookahead?.type === "IDENTIFIER") {
      const parts2 = [this._eat("IDENTIFIER")?.value];
      if (this._lookahead.type !== "IDENTIFIER" && this._lookahead.type === "DOT") {
        this._eat("DOT");
        parts2.push(this._eat("IDENTIFIER")?.value || "");
      }
      if (parts2.length === 1) {
        allNames.push([null, parts2[0]]);
      } else {
        allNames.push([parts2[0], parts2[1]]);
      }
    }
    return allNames.length > 1 ? allNames[1] : allNames[0];
  }

  private parseMultiQualifiedName() {
    const allNames: [string | null, string][] = [];
    while (this._lookahead?.type === "IDENTIFIER") {
      const parts: (string | null)[] = [this._eat("IDENTIFIER")?.value || null];
      if (this._lookahead.type !== "IDENTIFIER" && this._lookahead?.type === "DOT") {
        this._eat("DOT");
        parts.push(this._eat("IDENTIFIER")?.value || "");
      }
      if (parts.length === 1) {
        allNames.push([null, parts[0] as string]);
      } else {
        allNames.push([parts[0] as string, parts[1] as string]);
      }
    }
    return allNames;
  }

  private parseAlias() {
    if (this._lookahead?.type === "AS") {
      this._eat("AS");
      return this._eat("IDENTIFIER")?.value;
    }
    return null;
  }

  private parseVariableLine() {
    const lineStart = this._lookahead!.line;
    const name = this._eat(
      this._lookahead?.type === "STRING" ? "STRING" : "IDENTIFIER"
    )?.value;
    const typeVar = this._eat("IDENTIFIER")?.value;
    const settings = this.parseSettings();

    while (
      this._lookahead &&
      this._lookahead.line === lineStart &&
      this._lookahead.type !== "NEWLINE" &&
      this._lookahead.type !== "RBRACE"
    ) {
      this.errors.push(this._lookahead.value);
      this._eat(this._lookahead.type);
    }

    return { type: "Variable", name, typeVar, settings };
  }

  private parseSettings() {
    if (this._lookahead?.type !== "LBRACKET") {
      return [];
    }
    const lineNumber = this._lookahead.line;
    this._eat("LBRACKET");
    const settings = [];

    while (this._lookahead && (this._lookahead.type as string) !== "RBRACKET") {
      const valueToken = this._eat(["STRING", "IDENTIFIER"]);
      if (valueToken) settings.push(valueToken.value);

      if ((this._lookahead?.type as string) === "COMMA") {
        this._eat("COMMA");
      } else if ((this._lookahead?.type as string) !== "RBRACKET") {
        if (this._lookahead) {
          this.errors.push(
            `Expected ',' or ']' after setting value at line ${this._lookahead.line}`
          );
          break;
        }
      }
    }

    if ((this._lookahead?.type as string) === "RBRACKET") {
      this._eat("RBRACKET");
    } else {
      this.errors.push(`Missing closing ']' for settings starting at line ${lineNumber}`);
    }

    return settings;
  }

  private _eat(tokenType: (typeof Spec)[0][1] | (typeof Spec)[0][1][]) {
    const token = this._lookahead;
    if (!token) {
      const expected = Array.isArray(tokenType) ? tokenType.join(" or ") : tokenType;
      this.errors.push(`Unexpected end of input, expected '${expected || "null"}'.`);
      return null;
    }
    const expectedTypes = Array.isArray(tokenType) ? tokenType : [tokenType];
    if (!expectedTypes.includes(token.type)) {
      const expectedStr = expectedTypes.join(" or ");
      this.errors.push(
        `Expected ${expectedStr} at line ${token.line}, found '${token.type || ""}' ('${token.value}')`
      );
      this._lookahead = this._tokenizer.getNextToken();
      return token;
    }
    this._lookahead = this._tokenizer.getNextToken();
    return token;
  }
}