import { Parser } from "./Parser";

type AST = ReturnType<Parser["parse"]>;

type DefinitionNode = {
  type: "Definition";
  value: string;
};

type TableNode = {
  type: "Table";
  name: string;
  body: VariableNode[];
};

export type EnumNode = {
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

type MemberNode = {
  key: string;
  description: string;
  note: string;
};

type ASTNodeType =
  | DefinitionNode
  | EnumNode
  | TableNode
  | VariableNode
  | RefNode
  | { type: string }; // Fallback for other node types

interface OutputVariable {
  _id: string;
  name: string;
  desc: string;
  type: string;
  cle: boolean;
  color: string;
  typeVar: string;
  settings: string[];
  hasMapping: boolean;
}

export interface OutputTable {
  cursorIsIn: boolean;
  position: {
    pos_x: number;
    pos_y: number;
  };
  _id: string;
  name: string;
  description: string;
  variables: OutputVariable[];
  date: string;
  __v: number;
  hideInMap: boolean;
}

// Helper type guards
function isDefinitionNode(node: ASTNodeType): node is DefinitionNode {
  return node.type === "Definition";
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

export const ast_to_data = (
  input: AST["body"],
  name = ""
): {
  name: string;
  tables: OutputTable[];
  mappings: EnumNode[];
  links: RefNode[];
} => {
  let lastDefinition = "";
  let tableCount = 0;
  const result: OutputTable[] = [];
  const allMapping: EnumNode[] = [];
  const allRef: RefNode[] = [];

  input.forEach((item) => {
    if (item && isEnumNode(item)) {
      allMapping.push(item);
    }
  });
  input.forEach((item) => {
    if (item && isRefNode(item)) {
      allRef.push(item);
    }
  });

  input.forEach((item) => {
    if (!item) {
      return;
    }
    // Use type guards instead of direct type checking
    if (isDefinitionNode(item)) {
      lastDefinition = item.value;
    } else if (isTableNode(item)) {
      const variables = item.body
        .filter(isVariableNode)
        .map((variable, varIndex) => {
          const prevIndexOrig =
            item.body.findIndex((elt) => elt.name === variable.name) - 1;
          const prevElt = item.body[prevIndexOrig];
          let lastDefVar =
            prevElt && prevElt.type === "Definition" ? prevElt.value || "" : "";
          let hasMapping = allMapping.find((e) =>
            e.table
              ? e.name.toLowerCase() === variable.name.toLowerCase() &&
                e.table.toLowerCase() === item.name.toLowerCase()
              : e.name.toLowerCase() === variable.name.toLowerCase()
          )
            ? true
            : false;
          return {
            _id: `${tableCount}-${varIndex}`,
            name: variable.name,
            desc: lastDefVar,
            type: variable.typeVar,
            cle: variable.settings.includes("pk"),
            color: "lightgrey",
            typeVar: variable.typeVar,
            settings: variable.settings,
            hasMapping: hasMapping,
          };
        });

      const newTable: OutputTable = {
        cursorIsIn: false,
        position: { pos_x: 0, pos_y: 0 },
        _id: String(tableCount),
        name: item.name.endsWith("_") ? item.name.slice(0, -1) : item.name,
        description: lastDefinition,
        variables,
        date: new Date().toISOString().split("T")[0],
        hideInMap: item.name.endsWith("_"),
        __v: 0,
      };

      result.push(newTable);
      lastDefinition = "";
      tableCount++;
    }
  });
  return { name, tables: result, mappings: allMapping, links: allRef };
};
