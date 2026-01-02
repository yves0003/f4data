import * as vscode from "vscode";
import * as fs from "fs";
import { getAllGlobalState } from "../helpers/getAllGlobalKeys";
import { parseFileInWorker } from "../workers/parseFileInWorker";
import { EnumNodeElt, OutputTable, RefNode } from "../helpers/ast_to_data";
import path from "path";
import * as XLSX from "xlsx-js-style";
const TABLE_HEADER_COLORS = {
  default: "4F81BD", // blue
  Tables: "F79646", // orange
  Mapp: "9BBB59", // green
};
export async function exportToExcel(context: vscode.ExtensionContext) {
  let selectedDir: string;
  try {
    const dir = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: "Sélectionner",
    });
    if (dir) {
      selectedDir = dir[0].fsPath;
    } else {
      vscode.window.showErrorMessage("error.exportToExcel : no dir");
      return undefined;
    }
  } catch (error) {
    vscode.window.showErrorMessage("error.exportToExcel: catch error");
    return undefined;
  }

  const dictionaries = getAllGlobalState(context)["f4data.list"] as listDico;
  const dirWithLink = await filterExistingFiles(dictionaries);

  if (dirWithLink.length === 0) {
    vscode.window.showErrorMessage("No valid files to export");
    return undefined;
  }
  const start = Date.now();
  const errors: any[] = [];
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Generating Excel file",
      cancellable: true,
    },
    async (progress, token) => {
      const totalSteps = dirWithLink.length;
      let step = 0;

      await runWithConcurrency(dirWithLink, 3, async (dirInfo) => {
        if (token.isCancellationRequested) {
          return;
        }
        const result = await exportOneFile(
          dirInfo,
          selectedDir,
          progress,
          token
        );
        step++;
        progress.report({ increment: (1 / totalSteps) * 100 });
        if (!result.success) {
          errors.push(result);
        }
      });
      progress.report({ message: "Done ✔" });
    }
  );
  if (errors.length) {
    vscode.window.showWarningMessage(
      `Export completed with ${errors.length} error(s). Check logs.`
    );
  } else {
    const duration = Date.now() - start;
    if (duration < 1000) {
      await delay(1000 - duration);
      vscode.window.showInformationMessage(
        "All Excel files exported successfully ✔"
      );
    }
  }
}
async function filterExistingFiles(dictionaries: listDico) {
  const checks = await Promise.all(
    dictionaries.map(async (dic) => {
      if (!dic.link) {
        return null;
      }
      try {
        await fs.promises.access(dic.link, fs.constants.F_OK);
        return dic;
      } catch {
        return null;
      }
    })
  );

  return checks.filter(Boolean) as listDico;
}
function addBackToSummary(rows: any[][]) {
  rows.unshift([]); // spacer row
  rows.unshift([
    {
      v: "⬅ Back to Summary",
      l: { Target: "#'Summary'!A1" },
    },
  ]);
}
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function getHeaderColor(type: "Tables" | "Mapp" | "Default"): string {
  if (type === "Tables") {
    return TABLE_HEADER_COLORS.Tables;
  }
  if (type === "Mapp") {
    return TABLE_HEADER_COLORS.Mapp;
  }
  return TABLE_HEADER_COLORS.default;
}
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
) {
  const queue = [...items];
  const workers = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) {
        return;
      }
      await worker(item);
    }
  });

  await Promise.all(workers);
}
async function exportOneFile(
  dirInfo: listDico[0],
  selectedDir: string,
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  token: vscode.CancellationToken
) {
  try {
    if (token.isCancellationRequested) {
      throw new Error("Cancelled");
    }
    progress.report({ message: `Parsing ${dirInfo.name}` });
    const listTabsInfo = await parseFileInWorker(dirInfo.link!, dirInfo.name!);
    const workbook = XLSX.utils.book_new();

    createSummarySheet(workbook, listTabsInfo);
    createTablesSheet(workbook, listTabsInfo);
    createMappingsSheet(workbook, listTabsInfo);

    const outputPath = path.join(selectedDir, `${listTabsInfo.name}.xlsx`);
    XLSX.writeFile(workbook, outputPath);

    progress.report({ message: `Saved ${listTabsInfo.name}` });
    return { success: true };
  } catch (error) {
    vscode.window.showErrorMessage(`Export failed for ${dirInfo.name}`);
    return { success: false, name: dirInfo.name, error };
  }
}
function createSummarySheet(
  workbook: XLSX.WorkBook,
  listTabsInfo: {
    name: string;
    tables: OutputTable[];
    mappings: EnumNodeElt[];
    links: RefNode[];
  }
) {
  const color = getHeaderColor("Default");
  //tab-contents
  const rows: any[][] = [
    [
      { v: "Name", t: "s", s: { fill: { fgColor: { rgb: color } } } },
      { v: "Type", t: "s", s: { fill: { fgColor: { rgb: color } } } },
      { v: "Description", t: "s", s: { fill: { fgColor: { rgb: color } } } },
    ],
  ];
  for (const table of listTabsInfo.tables) {
    rows.push([
      {
        v: table.name,
        l: { Target: `#'${table.name}'!A1` },
      },
      "Table",
      table.description,
    ]);
  }
  for (const mapping of listTabsInfo.mappings) {
    rows.push([
      {
        v: mapping.name,
        l: { Target: `#'${mapping.name}'!A1` },
      },
      "Mapping",
      mapping.table,
    ]);
  }
  const summarySheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
}
function createTablesSheet(
  workbook: XLSX.WorkBook,
  listTabsInfo: {
    name: string;
    tables: OutputTable[];
    mappings: EnumNodeElt[];
    links: RefNode[];
  }
) {
  const color = getHeaderColor("Tables");
  for (const table of listTabsInfo.tables) {
    const rows: any[][] = [
      [
        {
          v: "Column Name",
          t: "s",
          s: { fill: { fgColor: { rgb: color } } },
        },
        { v: "Type", t: "s", s: { fill: { fgColor: { rgb: color } } } },
        {
          v: "Primary Key",
          t: "s",
          s: { fill: { fgColor: { rgb: color } } },
        },
        {
          v: "Description",
          t: "s",
          s: { fill: { fgColor: { rgb: color } } },
        },
        {
          v: "Has Mapping",
          t: "s",
          s: { fill: { fgColor: { rgb: color } } },
        },
      ],
    ];
    table.variables.forEach((v) => {
      rows.push([
        v.hasMapping
          ? {
              v: v.name,
              l: { Target: `#'${v.name}'!A1` },
              t: "s",
              s: { font: { underline: true } },
            }
          : {
              v: v.name,
              t: "s",
              s: { font: { underline: false } },
            },
        { v: v.typeVar || "" },
        v.cle ? { v: "X" } : { v: "" },
        { v: v.desc || "" },
        v.hasMapping ? { v: "X" } : { v: "" },
      ]);
    });

    addBackToSummary(rows);

    const tableSheet = XLSX.utils.aoa_to_sheet(rows);

    XLSX.utils.book_append_sheet(workbook, tableSheet, table.name);
  }
}
function createMappingsSheet(
  workbook: XLSX.WorkBook,
  listTabsInfo: {
    name: string;
    tables: OutputTable[];
    mappings: EnumNodeElt[];
    links: RefNode[];
  }
) {
  const color = getHeaderColor("Mapp");
  for (const mapping of listTabsInfo.mappings) {
    const rows: any[][] = [
      [
        { v: "Modalities", t: "s", s: { fill: { fgColor: { rgb: color } } } },
        { v: "Descriptions", t: "s", s: { fill: { fgColor: { rgb: color } } } },
        { v: "Notes", t: "s", s: { fill: { fgColor: { rgb: color } } } },
      ],
    ];

    for (const m of mapping.members) {
      rows.push([m.key, m.description, m.note]);
    }

    addBackToSummary(rows);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, ws, mapping.name);
  }
}
