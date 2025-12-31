import * as vscode from "vscode";
import * as fs from "fs";
import { getAllGlobalState } from "../helpers/getAllGlobalKeys";
import { parseFileInWorker } from "../workers/parseFileInWorker";
import ExcelJS from "exceljs";
import { addSlashEnd } from "../helpers/helpers";
import { EnumNodeElt, OutputTable, RefNode } from "../helpers/ast_to_data";

const TABLE_HEADER_COLORS = {
  default: "FF4F81BD", // blue
  Tables: "FFF79646", // orange
  Mapp: "FF9BBB59", // green
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
function addBackToSummary(sheet: ExcelJS.Worksheet) {
  const cell = sheet.getCell("A1");

  cell.value = {
    text: "⬅ Back to Summary",
    hyperlink: "#'Summary'!A1",
  };

  cell.font = {
    color: { argb: "FF0000FF" },
    bold: true,
    underline: true,
  };

  sheet.mergeCells("A1:C1");

  sheet.addRow([]);
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
function styleHeaderRowByTable(
  sheet: ExcelJS.Worksheet,
  headerRowIndex: number,
  type: "Tables" | "Mapp" | "Default"
) {
  const color = getHeaderColor(type);
  const row = sheet.getRow(headerRowIndex);

  row.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: color },
    };

    cell.alignment = { horizontal: "left" };
  });
}
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
function autoSizeColumn(
  sheet: ExcelJS.Worksheet,
  columnIndex: number,
  min = 10,
  max = 40
) {
  let maxLength = 0;

  sheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, (cell) => {
    const value = cell.value ? cell.value.toString() : "";
    maxLength = Math.max(maxLength, value.length);
  });

  sheet.getColumn(columnIndex).width = clamp(maxLength + 2, min, max);
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
    const workbook = new ExcelJS.Workbook();
    createSummarySheet(workbook, listTabsInfo);
    createTablesSheet(workbook, listTabsInfo);
    createMappingsSheet(workbook, listTabsInfo);
    const outputPath = addSlashEnd(selectedDir) + `${listTabsInfo.name}.xlsx`;

    await workbook.xlsx.writeFile(outputPath);
    progress.report({ message: `Saved ${listTabsInfo.name}` });
    return { success: true };
  } catch (error) {
    console.error(`Export failed for ${dirInfo.name}`, error);
    return { success: false, name: dirInfo.name, error };
  }
}
function createSummarySheet(
  workbook: ExcelJS.Workbook,
  listTabsInfo: {
    name: string;
    tables: OutputTable[];
    mappings: EnumNodeElt[];
    links: RefNode[];
  }
) {
  //tab-contents
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.addRow(["Name", "Type", "Description"]);
  summarySheet.views = [{ state: "frozen", ySplit: 1 }];
  autoSizeColumn(summarySheet, 1, 10, 50);
  autoSizeColumn(summarySheet, 2, 10, 50);
  autoSizeColumn(summarySheet, 3, 10, 50);
  styleHeaderRowByTable(summarySheet, 1, "Default");
  for (const table of listTabsInfo.tables) {
    const summaryRow = summarySheet.addRow([
      table.name,
      "Tables",
      table.description,
    ]);
    summaryRow.getCell(1).value = {
      text: table.name,
      hyperlink: `#'${table.name}'!A1`,
    };
    summaryRow.getCell(1).font = { underline: true };
  }
  for (const mapping of listTabsInfo.mappings) {
    const summaryRow = summarySheet.addRow([
      mapping.name,
      "Mapping",
      mapping.table,
    ]);
    summaryRow.getCell(1).value = {
      text: mapping.name,
      hyperlink: `#'${mapping.name}'!A1`,
    };
    summaryRow.getCell(1).font = { underline: true };
  }
}
function createTablesSheet(
  workbook: ExcelJS.Workbook,
  listTabsInfo: {
    name: string;
    tables: OutputTable[];
    mappings: EnumNodeElt[];
    links: RefNode[];
  }
) {
  for (const table of listTabsInfo.tables) {
    const sheet = workbook.addWorksheet(table.name);
    addBackToSummary(sheet);
    sheet.addRow([
      "Column Name",
      "Type",
      "Primary Key",
      "Description",
      "Has Mapping",
    ]);
    styleHeaderRowByTable(sheet, 3, "Tables");
    table.variables.forEach((v) => {
      const row = sheet.addRow([
        v.name,
        v.typeVar,
        v.cle ? "X" : "",
        v.desc,
        v.hasMapping ? "X" : "",
      ]);
      if (v.hasMapping) {
        const cell = row.getCell(1);
        cell.value = {
          text: v.name,
          hyperlink: `#'${v.name}'!A1`,
        };
        cell.font = {
          underline: true,
        };
      }
    });
    sheet.views = [{ state: "frozen", ySplit: 3 }];
    autoSizeColumn(sheet, 1, 10, 50);
  }
}
function createMappingsSheet(
  workbook: ExcelJS.Workbook,
  listTabsInfo: {
    name: string;
    tables: OutputTable[];
    mappings: EnumNodeElt[];
    links: RefNode[];
  }
) {
  for (const mapping of listTabsInfo.mappings) {
    const mapSheet = workbook.addWorksheet(mapping.name);
    addBackToSummary(mapSheet);
    mapSheet.addRow(["Modalities", "Descriptions", "Notes"]);
    styleHeaderRowByTable(mapSheet, 3, "Mapp");
    mapping.members.forEach((mm) => {
      mapSheet.addRow([mm.key, mm.description, mm.note]);
    });
    mapSheet.views = [{ state: "frozen", ySplit: 3 }];
    autoSizeColumn(mapSheet, 1, 10, 50);
    autoSizeColumn(mapSheet, 2, 10, 50);
    autoSizeColumn(mapSheet, 3, 10, 50);
  }
}
