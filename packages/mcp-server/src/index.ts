#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { loadDictionaries, type LoadedDictionary } from "./dictionary.js";

// ── CLI args ──────────────────────────────────────────────────────────────────
// Usage: node dist/index.js --path /dir1 --path /file.rd
function parsePaths(): string[] {
  const args = process.argv.slice(2);
  const paths: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--path" || args[i] === "-p") && args[i + 1]) {
      paths.push(args[++i]);
    }
  }
  if (process.env.F4DATA_PATH) {
    paths.push(...process.env.F4DATA_PATH.split(",").map((s) => s.trim()));
  }
  return paths;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function findDictionary(
  dicts: LoadedDictionary[],
  name?: string,
): LoadedDictionary | undefined {
  if (!name) return dicts[0];
  return dicts.find(
    (d) =>
      d.label.toLowerCase() === name.toLowerCase() || d.filePath.endsWith(name),
  );
}

function relationshipLabel(op: string): string {
  switch (op) {
    case ">":
      return "one-to-many";
    case "<":
      return "many-to-one";
    case "-":
      return "one-to-one";
    case "<>":
      return "many-to-many";
    default:
      return op;
  }
}

// ── Tool definitions ──────────────────────────────────────────────────────────
const TOOLS: Tool[] = [
  {
    name: "list_tables",
    description:
      "List all tables in a dictionary with their description and variable count.",
    inputSchema: {
      type: "object",
      properties: {
        dictionary: {
          type: "string",
          description:
            "Dictionary name (optional — defaults to the first loaded dictionary).",
        },
      },
    },
  },
  {
    name: "get_table_schema",
    description:
      "Return the full schema of a table: columns, types, primary keys, settings and enum flags.",
    inputSchema: {
      type: "object",
      required: ["table"],
      properties: {
        table: { type: "string", description: "Table name." },
        dictionary: {
          type: "string",
          description: "Dictionary name (optional).",
        },
      },
    },
  },
  {
    name: "search_variables",
    description:
      "Search for variables (columns) by name or type across all tables of a dictionary.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: {
          type: "string",
          description: "Keyword to search in variable names or types.",
        },
        dictionary: {
          type: "string",
          description: "Dictionary name (optional).",
        },
      },
    },
  },
  {
    name: "get_relationships",
    description:
      "Return all relationships (REF) defined in a dictionary, optionally filtered by table.",
    inputSchema: {
      type: "object",
      properties: {
        table: {
          type: "string",
          description: "Filter relationships involving this table (optional).",
        },
        dictionary: {
          type: "string",
          description: "Dictionary name (optional).",
        },
      },
    },
  },
  {
    name: "get_enum_values",
    description:
      "Return the allowed enum values for a variable, with their descriptions.",
    inputSchema: {
      type: "object",
      required: ["variable"],
      properties: {
        variable: { type: "string", description: "Variable (column) name." },
        table: {
          type: "string",
          description: "Table name to narrow the search (optional).",
        },
        dictionary: {
          type: "string",
          description: "Dictionary name (optional).",
        },
      },
    },
  },
  {
    name: "search_enum_values",
    description:
      "Search across all enums for a keyword in value keys or their descriptions. Useful to find which variable uses a specific coded value.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: {
          type: "string",
          description: "Keyword to search in enum keys or descriptions.",
        },
        dictionary: {
          type: "string",
          description: "Dictionary name (optional).",
        },
      },
    },
  },
  {
    name: "describe_database",
    description:
      "Return a high-level narrative description of the database: its purpose, tables, relationships and key variables.",
    inputSchema: {
      type: "object",
      properties: {
        dictionary: {
          type: "string",
          description: "Dictionary name (optional).",
        },
      },
    },
  },
  {
    name: "list_dictionaries",
    description:
      "List all loaded dictionaries with their file path and table count.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "reload_dictionaries",
    description:
      "Reload all .rd files from disk and return the updated knowledge base. Call this after the user says they have updated or added a dictionary.",
    inputSchema: { type: "object", properties: {} },
  },
];

// ── Knowledge base builder ────────────────────────────────────────────────────
function buildKnowledgeBase(dicts: LoadedDictionary[]): string {
  const sections: string[] = [];

  for (const dict of dicts) {
    const { data } = dict;
    sections.push(`### Dictionary: ${dict.label}${data.desc ? ` — ${data.desc}` : ""}`);

    const libnameEnum = data.mappings.find(
      (m) => m.name.toLowerCase() === "libnames",
    );

    for (const table of data.tables) {
      const tableDesc = table.description ? ` — ${table.description}` : "";
      sections.push(`\n#### Table: ${table.name}${tableDesc}`);
      if (table.note) sections.push(`Note: ${table.note}`);
      if (table.period) sections.push(`Period: ${table.period}`);
      const sasLib =
        table.library && table.library !== "public"
          ? table.library
          : libnameEnum?.members.find(
              (mb) => mb.key.toLowerCase() === table.name.toLowerCase(),
            )?.description;
      if (sasLib) {
        const libPath = libnameEnum?.members.find(
          (mb) => mb.key.toLowerCase() === sasLib.toLowerCase(),
        )?.description;
        const pathStr = libPath ? ` (path: ${libPath})` : "";
        sections.push(`SAS: ${sasLib}.${table.name}${pathStr}`);
      }

      const pkNames = table.variables.filter((v) => v.cle).map((v) => v.name);
      if (pkNames.length) {
        sections.push(`Primary key(s): ${pkNames.join(", ")}`);
      }

      sections.push("Variables:");
      for (const v of table.variables) {
        const flags: string[] = [];
        if (v.cle) flags.push("PK");
        if (v.hasMapping) flags.push("has enum");
        const flagStr = flags.length ? ` [${flags.join(", ")}]` : "";
        const desc = v.desc ? ` — ${v.desc}` : "";
        sections.push(`  - ${v.name} (${v.type ?? "?"})${flagStr}${desc}`);

        if (v.hasMapping) {
          const enums = data.mappings.filter((m) =>
            m.name.toLowerCase() === v.name.toLowerCase() &&
            (!m.table || m.table.toLowerCase() === table.name.toLowerCase())
          );
          for (const e of enums) {
            const values = e.members
              .map((mb) => {
                const desc = mb.description ? `: ${mb.description}` : "";
                const note = mb.note ? ` (${mb.note})` : "";
                return `${mb.key}${desc}${note}`;
              })
              .join(" | ");
            if (values) sections.push(`    Allowed values: ${values}`);
          }
        }
      }
    }

    if (libnameEnum) {
      sections.push("\nSAS LIBNAME assignments:");
      for (const mb of libnameEnum.members) {
        const path = mb.description ? ` "${mb.description}"` : "";
        const note = mb.note ? ` — ${mb.note}` : "";
        sections.push(`  - LIBNAME ${mb.key}${path}${note}`);
      }
    }

    if (data.links.length > 0) {
      sections.push("\nRelationships:");
      for (const r of data.links) {
        sections.push(`  - ${r.left} ${relationshipLabel(r.relationship)} ${r.right}`);
      }
    }

    sections.push("");
  }

  return sections.join("\n");
}

// ── Instructions builder ─────────────────────────────────────────────────────
function buildFullInstructions(dicts: LoadedDictionary[]): string {
  if (dicts.length === 0) {
    return `
No data dictionary is currently available. This means no .rd files have been loaded.

When the user asks any question about data, tables, variables or relationships, respond clearly:
"I currently have no data dictionary available. Please add a dictionary via the f4data extension in VS Code, then restart this server."

Do not attempt to answer data questions without a dictionary loaded.
`.trim();
  }

  return `
You are the owner and data expert of all the data dictionaries loaded below.
You have full knowledge of every table, variable, key, enum value and relationship.

## COMPLETE KNOWLEDGE BASE
${buildKnowledgeBase(dicts)}

## Rules you must always follow
1. Use the knowledge base above as your primary source of truth. Use the tools only to fetch details not covered above or to confirm ambiguous cases.
2. Never display raw file paths, source code, JSON blobs or internal IDs. Translate everything into clear, human-readable language.
3. When describing a table or variable, always include its description if one exists, its type, whether it is a primary key, and whether it has controlled values (enum).
4. When a relationship exists, explain it in plain language (e.g. "each user can have multiple orders").
5. If a piece of information does not exist in the dictionaries, say so clearly and honestly — do not guess or invent data.
6. If the user's question is ambiguous (e.g. a name exists in several tables), list the matches and ask for clarification.
7. Prefer prose for conceptual questions ("what does this table represent?", "how are these two tables related?").
8. Tables and enum values may have notes and periods defined in the knowledge base. Use them silently to enrich your understanding and improve answer accuracy, but do not display them unless the user explicitly asks ("show the note", "what is the period", "give me more details").
9. When a name is approximate, misspelled or poorly formulated, use the knowledge base to identify the most plausible match by comparing with all known table names, variable names, descriptions and enum values before responding. Never fail silently.
10. Always respond in the same language the user writes in. When presenting any content from a tool — tables, variables, enum values, relationships, descriptions — translate all descriptive text into the user's language. Keep original technical identifiers (table names, column names, enum keys) unchanged. Whenever translated content is displayed, add a short indicator at the very beginning of the response, before any content, such as: "_(🌐 Translated from [source language])_". Omit this indicator and show the original text if the user explicitly asks for it ("show original", "in English", "sans traduction", etc.).
11. You are a SAS and Python code expert. When the user asks you to write code to query, process or analyse the data: default to SAS (DATA steps, PROC SQL, macros) unless the user explicitly requests Python or another language. Always wrap the generated code in a SAS macro (or Python function) so the user can invoke it with a single call, and show that call as an example. Before writing any SAS code, look up the "SAS LIBNAME assignments" section in the knowledge base to find the correct library for each table involved, and always open the generated code with the matching LIBNAME statement(s) so it is ready to run without modification. If no LIBNAME assignment exists for a table, use a placeholder (e.g. MYLIB) and note it to the user.
12. If the user shares helper files, macro libraries or utility programs in the conversation, treat them as the official code library for this project. When writing code, prefer calling or adapting the macros/functions they contain instead of writing from scratch. Reference the macro or function name explicitly in your answer so the user knows exactly which helper to invoke.
13. Some tables are physically partitioned by period. When a table's period field contains a date pattern (YYYY_MM, YYYYMM, YYYY_Q, etc.), the actual SAS datasets are named TABLE_PERIOD (e.g. ORDERS_2000_01). Use your judgment to pick the best approach: generate a %DO macro loop when the user requests a specific date range and iterating period by period is cleaner; use a DATA step SET with all relevant datasets (e.g. SET lib.ORDERS_2000_01 lib.ORDERS_2000_02 ...) or the colon wildcard (SET lib.ORDERS_:) when combining all available data at once is more appropriate. Always explain briefly which approach you chose and why. If the table has no period defined, query it as a single dataset as usual.
14. Data availability dates can appear at two levels — library and variable. (a) Library level: the note field of "SAS LIBNAME assignments" entries may contain the last available data date in any language or phrasing (e.g. "last update: 2026-05", "dernière mise à jour: 2026-05"). Treat it as the data ceiling for that library: cap date-range queries at that period and never generate code that reads beyond it. (b) Variable level: a variable's description may also contain its own last update date using the same free-form phrasing. When present, a variable-level date takes precedence over the library-level date for that specific column. In both cases, use these dates silently to inform code generation and answer accuracy — do not display them unless the user explicitly asks (e.g. "when was this last updated?", "what is the latest available date?").
15. After a reload_dictionaries call, treat the refreshed data as the current and only truth. Never comment on what may have changed, what was added, or what was removed compared to before the reload — unless the user explicitly asks "what changed?" or "what is new?". Simply continue the conversation using the updated knowledge base as if it had always been that way.
`.trim();
}


// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const paths = parsePaths();
  let dicts = await loadDictionaries(paths);
  process.stderr.write(
    dicts.length === 0
      ? "f4data-mcp: started with no dictionaries loaded.\n"
      : `f4data-mcp: loaded ${dicts.length} dictionar${dicts.length === 1 ? "y" : "ies"}: ${dicts.map((d) => d.label).join(", ")}\n`,
  );

  const instructions = buildFullInstructions(dicts);

  const server = new Server(
    { name: "f4data", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} }, instructions },
  );

  // ── Resources: one per .rd file ─────────────────────────────────────────────
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: dicts.map((d) => ({
      uri: `f4data://dictionary/${encodeURIComponent(d.label)}`,
      name: d.label,
      description: d.data.desc || `Dictionary: ${d.label}`,
      mimeType: "application/json",
    })),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const label = decodeURIComponent(
      req.params.uri.replace("f4data://dictionary/", ""),
    );
    const dict = dicts.find((d) => d.label === label);
    if (!dict) {
      throw new Error(`Dictionary '${label}' not found.`);
    }
    return {
      contents: [
        {
          uri: req.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(dict.data, null, 2),
        },
      ],
    };
  });

  // ── Prompts ─────────────────────────────────────────────────────────────────
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: "data_analyst",
        description:
          "Start a data analysis session on the loaded dictionaries.",
        arguments: [
          {
            name: "question",
            description: "Your question about the data.",
            required: false,
          },
        ],
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (req) => {
    if (req.params.name !== "data_analyst")
      throw new Error(`Unknown prompt: ${req.params.name}`);
    const question = req.params.arguments?.question as string | undefined;
    const overview = dicts
      .map(
        (d) =>
          `- **${d.label}**: ${d.data.tables.map((t) => t.name).join(", ")}`,
      )
      .join("\n");

    const userMessage = question
      ? question
      : "Give me an overview of the available data.";

    return {
      description: "Data analysis session on f4data dictionaries",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are a data owner and expert analyst. Here are the available dictionaries:\n${overview}\n\n${userMessage}`,
          },
        },
      ],
    };
  });

  // ── Tools ───────────────────────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const a = (args ?? {}) as Record<string, string>;

    switch (name) {
      // ── list_dictionaries ──────────────────────────────────────────────────
      case "list_dictionaries": {
        const rows = dicts.map(
          (d) =>
            `• **${d.label}** — ${d.data.tables.length} table(s), ${d.data.links.length} relation(s)\n  File: ${d.filePath}`,
        );
        return { content: [{ type: "text", text: rows.join("\n") }] };
      }

      // ── list_tables ────────────────────────────────────────────────────────
      case "list_tables": {
        const dict = findDictionary(dicts, a.dictionary);
        if (!dict)
          return {
            content: [
              { type: "text", text: `Dictionary '${a.dictionary}' not found.` },
            ],
          };

        const lines = dict.data.tables.map((t) => {
          const pkVars = t.variables.filter((v) => v.cle).map((v) => v.name);
          const desc = t.description ? ` — ${t.description}` : "";
          const pk = pkVars.length ? ` [PK: ${pkVars.join(", ")}]` : "";
          return `• **${t.name}**${desc}${pk} (${t.variables.length} variable${t.variables.length === 1 ? "" : "s"})`;
        });

        const header = `# Dictionary: ${dict.label}${dict.data.desc ? `\n${dict.data.desc}` : ""}\n\n`;
        return { content: [{ type: "text", text: header + lines.join("\n") }] };
      }

      // ── get_table_schema ───────────────────────────────────────────────────
      case "get_table_schema": {
        const dict = findDictionary(dicts, a.dictionary);
        if (!dict)
          return {
            content: [
              { type: "text", text: `Dictionary '${a.dictionary}' not found.` },
            ],
          };

        const q = a.table?.toLowerCase() ?? "";
        let table = dict.data.tables.find(
          (t) => t.name.toLowerCase() === q,
        );
        if (!table) {
          const partialMatches = dict.data.tables.filter((t) =>
            t.name.toLowerCase().includes(q)
          );
          if (partialMatches.length === 1) {
            table = partialMatches[0];
          } else if (partialMatches.length > 1) {
            const names = partialMatches.map((t) => `**${t.name}**`).join(", ");
            return {
              content: [{ type: "text", text: `'${a.table}' matches several tables in '${dict.label}': ${names}. Please be more specific.` }],
            };
          }
        }
        if (!table) {
          const names = dict.data.tables.map((t) => t.name).join(", ");
          return {
            content: [
              {
                type: "text",
                text: `Table '${a.table}' not found in '${dict.label}'. Available: ${names}`,
              },
            ],
          };
        }

        const lines: string[] = [`# Table: ${table.name}`];
        if (table.description) lines.push(`> ${table.description}`);
        lines.push("");
        lines.push("| Variable | Type | PK | Settings | Enum | Description |");
        lines.push("|----------|------|----|----------|------|-------------|");
        for (const v of table.variables) {
          const pk = v.cle ? "✓" : "";
          const settings = v.settings.filter((s) => s !== "pk").join(", ");
          const hasEnum = v.hasMapping ? "✓" : "";
          lines.push(
            `| ${v.name} | ${v.type ?? ""} | ${pk} | ${settings} | ${hasEnum} | ${v.desc} |`,
          );
        }

        // Relationships involving this table
        const rels = dict.data.links.filter(
          (r) =>
            r.left.split(".")[0].toLowerCase() === table.name.toLowerCase() ||
            r.right.split(".")[0].toLowerCase() === table.name.toLowerCase(),
        );
        if (rels.length > 0) {
          lines.push("\n## Relationships");
          for (const r of rels) {
            lines.push(
              `• \`${r.left}\` **${relationshipLabel(r.relationship)}** \`${r.right}\``,
            );
          }
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      // ── search_variables ───────────────────────────────────────────────────
      case "search_variables": {
        const dict = findDictionary(dicts, a.dictionary);
        if (!dict)
          return {
            content: [
              { type: "text", text: `Dictionary '${a.dictionary}' not found.` },
            ],
          };

        const q = a.query?.toLowerCase() ?? "";
        const matches: string[] = [];

        for (const t of dict.data.tables) {
          for (const v of t.variables) {
            if (
              v.name.toLowerCase().includes(q) ||
              (v.type ?? "").toLowerCase().includes(q) ||
              v.desc.toLowerCase().includes(q)
            ) {
              const pk = v.cle ? " [PK]" : "";
              const enum_ = v.hasMapping ? " [has enum]" : "";
              matches.push(
                `• **${t.name}.${v.name}** : ${v.type ?? "?"}${pk}${enum_}${v.desc ? ` — ${v.desc}` : ""}`,
              );
            }
          }
        }

        if (matches.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No variable matching '${a.query}' found in '${dict.label}'.`,
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text:
                `# Variables matching "${a.query}" in ${dict.label}\n\n` +
                matches.join("\n"),
            },
          ],
        };
      }

      // ── get_relationships ──────────────────────────────────────────────────
      case "get_relationships": {
        const dict = findDictionary(dicts, a.dictionary);
        if (!dict)
          return {
            content: [
              { type: "text", text: `Dictionary '${a.dictionary}' not found.` },
            ],
          };

        let links = dict.data.links;
        if (a.table) {
          const t = a.table.toLowerCase();
          links = links.filter(
            (r) =>
              r.left.split(".")[0].toLowerCase() === t ||
              r.right.split(".")[0].toLowerCase() === t,
          );
        }

        if (links.length === 0) {
          const msg = a.table
            ? `No relationships found for table '${a.table}' in '${dict.label}'.`
            : `No relationships defined in '${dict.label}'.`;
          return { content: [{ type: "text", text: msg }] };
        }

        const lines = links.map(
          (r) =>
            `• \`${r.left}\` **${relationshipLabel(r.relationship)}** \`${r.right}\``,
        );
        const header = a.table
          ? `# Relationships for table '${a.table}' in ${dict.label}`
          : `# All relationships in ${dict.label}`;
        return {
          content: [{ type: "text", text: header + "\n\n" + lines.join("\n") }],
        };
      }

      // ── get_enum_values ────────────────────────────────────────────────────
      case "get_enum_values": {
        const dict = findDictionary(dicts, a.dictionary);
        if (!dict)
          return {
            content: [
              { type: "text", text: `Dictionary '${a.dictionary}' not found.` },
            ],
          };

        const varName = a.variable?.toLowerCase() ?? "";
        const tableName = a.table?.toLowerCase();

        const matches = dict.data.mappings.filter((m) => {
          const nameMatch = m.name.toLowerCase() === varName;
          if (!nameMatch) return false;
          if (tableName) return (m.table ?? "").toLowerCase() === tableName;
          return true;
        });

        if (matches.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No enum found for variable '${a.variable}'${a.table ? ` in table '${a.table}'` : ""} in '${dict.label}'.`,
              },
            ],
          };
        }

        const lines: string[] = [];
        for (const m of matches) {
          lines.push(`## ${m.table ? `${m.table}.` : ""}${m.name}`);
          lines.push("| Value | Description |");
          lines.push("|-------|-------------|");
          for (const member of m.members) {
            lines.push(
              `| \`${member.key}\` | ${member.description} |`,
            );
          }
          lines.push("");
        }

        return {
          content: [
            {
              type: "text",
              text: `# Enum values for '${a.variable}'\n\n` + lines.join("\n"),
            },
          ],
        };
      }

      // ── search_enum_values ────────────────────────────────────────────────
      case "search_enum_values": {
        const dict = findDictionary(dicts, a.dictionary);
        if (!dict)
          return {
            content: [
              { type: "text", text: `Dictionary '${a.dictionary}' not found.` },
            ],
          };

        const q = a.query?.toLowerCase() ?? "";
        const matches: string[] = [];

        for (const m of dict.data.mappings) {
          const hitMembers = m.members.filter(
            (mb) =>
              mb.key.toLowerCase().includes(q) ||
              mb.description.toLowerCase().includes(q) ||
              mb.note.toLowerCase().includes(q),
          );
          if (hitMembers.length > 0) {
            const prefix =
              m.table && m.table !== "Global" ? `${m.table}.${m.name}` : m.name;
            for (const mb of hitMembers) {
              const note = mb.note ? ` *(${mb.note})*` : "";
              matches.push(
                `• **${prefix}** → \`${mb.key}\` : ${mb.description}${note}`,
              );
            }
          }
        }

        if (matches.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No enum value matching '${a.query}' found in '${dict.label}'.`,
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text:
                `# Enum values matching "${a.query}" in ${dict.label}\n\n` +
                matches.join("\n"),
            },
          ],
        };
      }

      // ── describe_database ──────────────────────────────────────────────────
      case "describe_database": {
        const dict = findDictionary(dicts, a.dictionary);
        if (!dict)
          return {
            content: [
              { type: "text", text: `Dictionary '${a.dictionary}' not found.` },
            ],
          };

        const { data } = dict;
        const lines: string[] = [];

        lines.push(`# Database: ${dict.label}`);
        if (data.desc) lines.push(`\n${data.desc}`);

        lines.push(`\n## Overview`);
        lines.push(`- **${data.tables.length}** table(s)`);
        lines.push(`- **${data.links.length}** relationship(s)`);
        lines.push(`- **${data.mappings.length}** enum(s)`);

        lines.push(`\n## Tables`);
        for (const t of data.tables) {
          const pkVars = t.variables.filter((v) => v.cle).map((v) => v.name);
          lines.push(`\n### ${t.name}`);
          if (t.description) lines.push(`${t.description}`);
          lines.push(
            `${t.variables.length} variable(s)${pkVars.length ? `, primary key(s): ${pkVars.join(", ")}` : ""}`,
          );

          const enumVars = t.variables
            .filter((v) => v.hasMapping)
            .map((v) => v.name);
          if (enumVars.length)
            lines.push(
              `Variables with controlled values: ${enumVars.join(", ")}`,
            );
        }

        if (data.links.length > 0) {
          lines.push(`\n## Relationships`);
          for (const r of data.links) {
            lines.push(
              `- \`${r.left}\` **${relationshipLabel(r.relationship)}** \`${r.right}\``,
            );
          }
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      }

      // ── reload_dictionaries ────────────────────────────────────────────────
      case "reload_dictionaries": {
        dicts = await loadDictionaries(paths);
        if (dicts.length === 0) {
          return { content: [{ type: "text", text: "Reload complete — no dictionary found. Please add .rd files via the f4data extension." }] };
        }
        const kb = buildKnowledgeBase(dicts);
        return {
          content: [{
            type: "text",
            text: `Reload complete — ${dicts.length} dictionar${dicts.length === 1 ? "y" : "ies"} loaded.\n\nUpdated knowledge base:\n\n${kb}`,
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`f4data-mcp fatal error: ${err}\n`);
  process.exit(1);
});
