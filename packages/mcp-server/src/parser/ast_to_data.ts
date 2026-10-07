import { Parser } from "./Parser.js";

type AST = ReturnType<Parser["parse"]>;

type DefinitionNode = { type: "Definition"; value: string };
type PropsFileNode = { type: "PropsFile"; value: string };
type TableNode = { type: "Table"; name: string; library?: string; body: VariableNode[] };

export type EnumNode = { type: "Enum"; allEnum: EnumNodeElt[] };
export type EnumNodeElt = {
  type: "Enum";
  name: string;
  members: MemberNode[];
  table?: string;
};
export type RefNode = {
  type: "Ref";
  left: string;
  relationship: string;
  right: string;
};

type VariableNode = {
  type: "Variable" | "Definition";
  name: string;
  typeVar: string;
  settings: string[];
  value?: string;
};

type MemberNode = { key: string; description: string; note: string };

type ASTNodeType =
  | DefinitionNode
  | PropsFileNode
  | EnumNode
  | TableNode
  | VariableNode
  | RefNode
  | { type: string };

export interface OutputVariable {
  _id: string;
  name: string;
  desc: string;
  type: string;
  cle: boolean;
  typeVar: string;
  settings: string[];
  hasMapping: boolean;
}

export interface OutputTable {
  _id: string;
  name: string;
  library: string;
  description: string;
  note: string;
  period: string;
  variables: OutputVariable[];
  hideInMap: boolean;
}

export interface DictionaryData {
  name: string;
  desc: string;
  tables: OutputTable[];
  mappings: EnumNodeElt[];
  links: RefNode[];
  props: PropsFileNode[];
}

function isDefinitionNode(node: ASTNodeType): node is DefinitionNode {
  return node.type === "Definition";
}
function isPropsFileNode(node: ASTNodeType): node is PropsFileNode {
  return node.type === "PropsFile";
}
function isTableNode(node: ASTNodeType): node is TableNode {
  return node.type === "Table";
}
function isEnumNode(node: ASTNodeType): node is EnumNode {
  return node.type === "Enum";
}
function isVariableNode(node: ASTNodeType): node is VariableNode {
  return node.type === "Variable";
}
function isRefNode(node: ASTNodeType): node is RefNode {
  return node.type === "Ref";
}

function addUniqueToArr<T>(arr: T[], obj: T, keys: (keyof T)[]) {
  const exists = arr.some((item) => keys.every((k) => item[k] === obj[k]));
  if (!exists) arr.push(obj);
}

export const ast_to_data = (input: AST["body"], name = ""): DictionaryData => {
  let lastDefinition = "";
  let tableCount = 0;
  const result: OutputTable[] = [];
  const allMapping: EnumNodeElt[] = [];
  const allRef: RefNode[] = [];
  const allProps: PropsFileNode[] = [];

  input.forEach((item) => {
    if (item && isEnumNode(item)) {
      for (const elt of item.allEnum) {
        addUniqueToArr(allMapping, elt, ["name", "table"]);
      }
    }
  });
  input.forEach((item) => {
    if (item && isRefNode(item)) allRef.push(item);
  });
  input.forEach((item) => {
    if (item && isPropsFileNode(item)) allProps.push(item);
  });

  input.forEach((item) => {
    if (!item) return;
    if (isDefinitionNode(item)) {
      lastDefinition = item.value;
    } else if (isTableNode(item)) {
      const variables = item.body
        .filter(isVariableNode)
        .map((variable, varIndex) => {
          const prevIndexOrig =
            item.body.findIndex((elt) => elt.name === variable.name) - 1;
          const prevElt = item.body[prevIndexOrig];
          const lastDefVar =
            prevElt && prevElt.type === "Definition" ? prevElt.value || "" : "";
          const hasMapping = !!allMapping.find((e) =>
            e.table
              ? e.name.toLowerCase() === variable.name.toLowerCase() &&
                e.table.toLowerCase() === item.name.toLowerCase()
              : e.name.toLowerCase() === variable.name.toLowerCase()
          );
          return {
            _id: `${tableCount}-${varIndex}`,
            name: variable.name,
            desc: lastDefVar,
            type: variable.typeVar,
            cle: variable.settings.includes("pk"),
            typeVar: variable.typeVar,
            settings: variable.settings,
            hasMapping,
          };
        });

      const rawName = String(item.name ?? "");
      const tableNote = (item.body as { type: string; value?: string }[])
        .find((e) => e.type === "Note")?.value ?? "";
      const tablePeriod = (item.body as { type: string; value?: string }[])
        .find((e) => e.type === "Period")?.value ?? "";
      result.push({
        _id: String(tableCount),
        name: rawName.endsWith("_") ? rawName.slice(0, -1) : rawName,
        library: String(item.library ?? "public"),
        description: lastDefinition,
        note: tableNote,
        period: tablePeriod,
        variables,
        hideInMap: rawName.endsWith("_"),
      });

      lastDefinition = "";
      tableCount++;
    }
  });

  const descFile =
    allProps
      .find((p) => p.value.startsWith("desc"))
      ?.value.slice(5)
      .trim() || "";

  return { name, desc: descFile, tables: result, mappings: allMapping, links: allRef, props: allProps };
};