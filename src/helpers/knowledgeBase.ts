import { readdir, stat, writeFile } from "fs/promises";
import { join, basename, extname } from "path";
import { window, ProgressLocation } from "vscode";
import { parseFileInWorker } from "../workers/parseFileInWorker";
import { ast_to_data } from "./ast_to_data";

// ── Raw types extracted directly from AST ────────────────────────────────────

type RawVariable = {
  name: string;
  typeVar: string;
  desc: string;
  cle: boolean;
  hasMapping: boolean;
};

type RawEnum = {
  name: string;
  table: string;
  members: { key: string; description: string; note: string }[];
};

type RawRef = { left: string; relationship: string; right: string };

type RawTable = {
  name: string;
  library: string;
  description: string;
  note: string;
  period: string;
  variables: RawVariable[];
};

type DictData = {
  label: string;
  desc: string;
  tables: RawTable[];
  enums: RawEnum[];
  refs: RawRef[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relLabel(op: string): string {
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

// ── Map worker output (ast_to_data result) → DictData ────────────────────────

type WorkerResult = ReturnType<typeof ast_to_data>;

function workerResultToDictData(result: WorkerResult, label: string): DictData {
  return {
    label,
    desc: result.desc,
    tables: result.tables.map((t) => ({
      name: t.name,
      library: t.library,
      description: t.description,
      note: t.note,
      period: t.period,
      variables: t.variables.map((v) => ({
        name: v.name,
        typeVar: v.typeVar,
        desc: v.desc,
        cle: v.cle,
        hasMapping: v.hasMapping,
      })),
    })),
    enums: result.mappings.map((e) => {
      const rawTable = e.table ?? "Global";
      return {
        name: e.name,
        table: rawTable.endsWith("_") ? rawTable.slice(0, -1) : rawTable,
        members: e.members,
      };
    }),
    refs: result.links.map((r) => ({
      left: r.left,
      relationship: r.relationship,
      right: r.right,
    })),
  };
}

// ── Knowledge base text builder ───────────────────────────────────────────────

function buildText(dicts: DictData[]): string {
  const lines: string[] = [];
  lines.push("# Data Knowledge Base");
  lines.push(`_Generated: ${new Date().toISOString().split("T")[0]}_`);

  if (dicts.length === 0) {
    lines.push("\nNo dictionaries loaded.");
    return lines.join("\n");
  }

  for (const dict of dicts) {
    lines.push(
      `\n---\n## Dictionary: ${dict.label}${dict.desc ? ` — ${dict.desc}` : ""}`,
    );

    const libnameEnum = dict.enums.find(
      (e) => e.name.toLowerCase() === "libnames",
    );

    if (libnameEnum) {
      lines.push("\n### SAS LIBNAME assignments");
      for (const mb of libnameEnum.members) {
        const path = mb.description ? ` "${mb.description}"` : "";
        const note = mb.note ? ` — ${mb.note}` : "";
        lines.push(`- LIBNAME ${mb.key}${path}${note}`);
      }
    }

    lines.push("\n### Tables");
    for (const table of dict.tables) {
      const tableDesc = table.description ? ` — ${table.description}` : "";
      lines.push(`\n#### ${table.name}${tableDesc}`);

      if (table.library !== "public") {
        const libEntry = libnameEnum?.members.find(
          (mb) => mb.key.toLowerCase() === table.library.toLowerCase(),
        );
        const pathStr = libEntry?.description
          ? ` (path: ${libEntry.description})`
          : "";
        lines.push(`SAS: ${table.library}.${table.name}${pathStr}`);
      }
      if (table.period) lines.push(`Period: ${table.period}`);

      const pks = table.variables.filter((v) => v.cle).map((v) => v.name);
      if (pks.length) lines.push(`Primary key(s): ${pks.join(", ")}`);

      lines.push("\n| Variable | Type | PK | Enum | Description |");
      lines.push("|----------|------|----|------|-------------|");
      for (const v of table.variables) {
        lines.push(
          `| ${v.name} | ${v.typeVar} | ${v.cle ? "✓" : ""} | ${v.hasMapping ? "✓" : ""} | ${v.desc} |`,
        );
        if (v.hasMapping) {
          const enums = dict.enums.filter(
            (e) =>
              e.name.toLowerCase() === v.name.toLowerCase() &&
              (e.table === "Global" ||
                e.table.toLowerCase() === table.name.toLowerCase()),
          );
          for (const e of enums) {
            const vals = e.members
              .map((mb) => {
                const d = mb.description ? `: ${mb.description}` : "";
                const n = mb.note ? ` (${mb.note})` : "";
                return `\`${mb.key}\`${d}${n}`;
              })
              .join(" | ");
            if (vals) lines.push(`  > Values: ${vals}`);
          }
        }
      }
    }

    if (dict.refs.length > 0) {
      lines.push("\n### Relationships");
      for (const r of dict.refs) {
        lines.push(
          `- \`${r.left}\` **${relLabel(r.relationship)}** \`${r.right}\``,
        );
      }
    }
  }

  lines.push(`
---
## Rules for using this knowledge base

1. Use the knowledge base in this document as your primary source of truth.
2. Never display raw file paths, source code, JSON blobs or internal IDs. Translate everything into clear, human-readable language.
3. When describing a table or variable, always include its description if one exists, its type, whether it is a primary key, and whether it has controlled values (enum).
4. When a relationship exists, explain it in plain language (e.g. "each user can have multiple orders").
5. If a piece of information does not exist in the dictionaries, say so clearly and honestly — do not guess or invent data.
6. If the user's question is ambiguous (e.g. a name exists in several tables), list the matches and ask for clarification.
7. Prefer prose for conceptual questions ("what does this table represent?", "how are these two tables related?").
8. Tables and enum values may have notes and periods defined in this document. Use them silently to enrich your understanding and improve answer accuracy, but do not display them unless the user explicitly asks ("show the note", "what is the period", "give me more details").
9. When a name is approximate, misspelled or poorly formulated, use this document to identify the most plausible match by comparing with all known table names, variable names, descriptions and enum values before responding. Never fail silently.
10. Always respond in the same language the user writes in. When presenting any content — tables, variables, enum values, relationships, descriptions — translate all descriptive text into the user's language. Keep original technical identifiers (table names, column names, enum keys) unchanged. Whenever translated content is displayed, add a short indicator at the very beginning of the response, before any content, such as: "_(🌐 Translated from [source language])_". Omit this indicator and show the original text if the user explicitly asks for it ("show original", "in English", "sans traduction", etc.).
11. You are a SAS and Python code expert. When the user asks you to write code to query, process or analyse the data: default to SAS (DATA steps, PROC SQL, macros) unless the user explicitly requests Python or another language. Always wrap the generated code in a SAS macro (or Python function) so the user can invoke it with a single call, and show that call as an example. Before writing any SAS code, look up the "SAS LIBNAME assignments" section in this document to find the correct library for each table involved, and always open the generated code with the matching LIBNAME statement(s) so it is ready to run without modification. If no LIBNAME assignment exists for a table, use a placeholder (e.g. MYLIB) and note it to the user.
12. If the user shares helper files, macro libraries or utility programs in the conversation, treat them as the official code library for this project. When writing code, prefer calling or adapting the macros/functions they contain instead of writing from scratch. Reference the macro or function name explicitly in your answer so the user knows exactly which helper to invoke.
13. Some tables are physically partitioned by period. When a table's period field contains a date pattern (YYYY_MM, YYYYMM, YYYY_Q, etc.), the actual SAS datasets are named TABLE_PERIOD (e.g. ORDERS_2000_01). Use your judgment to pick the best approach: generate a %DO macro loop when the user requests a specific date range and iterating period by period is cleaner; use a DATA step SET with all relevant datasets (e.g. SET lib.ORDERS_2000_01 lib.ORDERS_2000_02 ...) or the colon wildcard (SET lib.ORDERS_:) when combining all available data at once is more appropriate. Always explain briefly which approach you chose and why. If the table has no period defined, query it as a single dataset as usual.
14. Data availability dates can appear at two levels — library and variable. (a) Library level: the note field of "SAS LIBNAME assignments" entries may contain the last available data date in any language or phrasing (e.g. "last update: 2026-05", "dernière mise à jour: 2026-05"). Treat it as the data ceiling for that library: cap date-range queries at that period and never generate code that reads beyond it. (b) Variable level: a variable's description may also contain its own last update date using the same free-form phrasing. When present, a variable-level date takes precedence over the library-level date for that specific column. In both cases, use these dates silently to inform code generation and answer accuracy — do not display them unless the user explicitly asks (e.g. "when was this last updated?", "what is the latest available date?").`);

  return lines.join("\n");
}

// ── File discovery ────────────────────────────────────────────────────────────

async function findRdFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findRdFiles(fullPath)));
    } else if (entry.isFile() && extname(entry.name) === ".rd") {
      files.push(fullPath);
    }
  }
  return files;
}

// ── Public export ─────────────────────────────────────────────────────────────

export async function saveKnowledgeBase(list: listDico): Promise<void> {
  try {
    const dir = await window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: "Sélectionner",
    });
    if (!dir) {
      window.showErrorMessage("error.saveKnowledgeBase : no dir");
      return;
    }
    const selectedDir = dir[0].fsPath;
    const active = (list ?? []).filter((d) => d.link && !d.disable);
    const dicts: DictData[] = [];
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "f4data: Exporting knowledge base",
        cancellable: false,
      },
      async (progress) => {
        // Phase 1: collect all file tasks (fast — stat + readdir only)
        type Task = { filePath: string; label: string };
        const tasks: Task[] = [];
        for (const d of active) {
          const p = d.link!;
          const info = await stat(p).catch(() => null);
          if (!info) { continue; }
          if (info.isDirectory()) {
            const rdFiles = await findRdFiles(p);
            for (const filePath of rdFiles) {
              tasks.push({ filePath, label: basename(filePath, ".rd") });
            }
          } else if (info.isFile() && extname(p) === ".rd") {
            tasks.push({ filePath: p, label: d.name ?? basename(p, ".rd") });
          }
        }

        // Phase 2: parse all files in parallel
        const total = tasks.length;
        let done = 0;
        const results = await Promise.all(
          tasks.map(async ({ filePath, label }) => {
            const result = await parseFileInWorker(filePath, label);
            done++;
            progress.report({ message: `${label} (${total - done} remaining)` });
            return workerResultToDictData(result, label);
          }),
        );
        dicts.push(...results);

        // Phase 3: write
        progress.report({ message: "Writing knowledge_base.md…" });
        await writeFile(
          join(selectedDir, "knowledge_base.md"),
          buildText(dicts),
          "utf-8",
        );
      },
    );
  } catch {
    // silent — never break the extension
  }
}
