import * as vscode from "vscode";
import * as fs from "fs";
import { getAllGlobalState } from "../helpers/getAllGlobalKeys";
import { parseFileInWorker } from "../workers/parseFileInWorker";
import ExcelJS from "exceljs";
import { addSlashEnd } from "../helpers/helpers";
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

  //   const dirWithLink = dictionaries.filter(async (dic) => {
  //     if (dic.link && dic.link !== "") {
  //       const fileExist = await fs.promises
  //         .access(dic.link, fs.constants.F_OK)
  //         .then(() => true)
  //         .catch(() => false);
  //       return fileExist;
  //     } else {
  //       return false;
  //     }
  //   });
  if (dirWithLink.length === 0) {
    vscode.window.showErrorMessage(
      //"error.exportToExcel: File are not available"
      "No valid files to export"
    );
    return undefined;
  }
  const start = Date.now();
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Generating Excel file",
      cancellable: true,
    },
    async (progress, token) => {
      const totalSteps = dirWithLink.length;
      let step = 0;
      const report = (message: string) => {
        progress.report({
          message,
          increment: (1 / totalSteps) * 100,
        });
      };
      // Reading in sequence
      //   for (const dirInfo of dirWithLink) {
      //     const listTabsInfo = await parseFileInWorker(dirInfo.link, dirInfo.name!);
      //     console.log(listTabsInfo);
      //   }

      // Reading in Parallel
      try {
        await Promise.all(
          dirWithLink.map(async (dirInfo) => {
            const workbook = new ExcelJS.Workbook();
            const listTabsInfo = await parseFileInWorker(
              dirInfo.link,
              dirInfo.name!
            );

            //tab-contents
            const summarySheet = workbook.addWorksheet("Summary");
            summarySheet.addRow(["Name", "Type", "Description"]);
            summarySheet.views = [{ state: "frozen", ySplit: 1 }];
            autoSizeColumn(summarySheet, 1, 10, 50);
            autoSizeColumn(summarySheet, 2, 10, 50);
            autoSizeColumn(summarySheet, 3, 10, 50);
            styleHeaderRowByTable(summarySheet, 1, "Default");

            //table
            report(`Processing dic: ${dirInfo.name}`);

            for (const table of listTabsInfo.tables) {
              if (token.isCancellationRequested) {
                throw new Error("Export cancelled");
              }
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

            //Mapping
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
            await workbook.xlsx.writeFile(
              `${addSlashEnd(selectedDir)}${listTabsInfo.name + ".xlsx"}`
            );
            step++;
            //console.log(listTabsInfo);
            //console.log("copy end");
          })
        );
        //   for (let i = 0; i < dirWithLink.length; i++) {
        //     const dirInfo = dirWithLink[i];
        //     const listTabsInfo = await parseFileInWorker(dirInfo.link, dirInfo.name!);
        //     console.log(listTabsInfo, i);
        //   }
        //console.log(dictionaries);
        //console.log(`${addSlashEnd(selectedDir)}${"test.xlsx"}`);
      } catch (error) {
        vscode.window.showErrorMessage("error.exportToExcel: Parse file error");
        return undefined;
      }
      progress.report({ message: "Done ✔" });
      const duration = Date.now() - start;
      if (duration < 1000) {
        await delay(1000 - duration);
        vscode.window.showInformationMessage("File saved");
      }
    }
  );
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
