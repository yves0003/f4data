import * as vscode from "vscode";
import { getFilesByExtension } from "../helpers/helpers";
import { upsert } from "./addDictionaries";
import {
  getAllGlobalState,
  updateGlobalState,
} from "../helpers/getAllGlobalKeys";

export async function refreshDictsDir(context: vscode.ExtensionContext) {
  try {
    const savedDictionaries = getAllGlobalState(context)[
      "f4data.list"
    ] as listDico;
    //const config = vscode.workspace.getConfiguration("f4data");
    //const savedDictionaries = (config.get("list") as listDico) || [];
    const dictDirs = [
      ...new Set(
        savedDictionaries.map((dir) => {
          const parts = (dir.link ? dir.link : "").split("/");
          return parts.slice(0, -2).join("/");
        })
      ),
    ];

    const rdDirFiles = (
      await Promise.all(dictDirs.map((dir) => getFilesByExtension(dir, "rd")))
    )
      .flat()
      .map((file) => ({
        name: file.filename,
        link: file.filePath,
      }));

    const updatedDictionaries = rdDirFiles.reduce(
      (acc, dict) => upsert(acc, "name", dict),
      savedDictionaries
    );
    //console.log(updatedDictionaries, "updatedDictionaries");
    //await config.update("list", rdDirFiles, vscode.ConfigurationTarget.Global);
    const globalStateUpdate = updateGlobalState(context);
    await globalStateUpdate("f4data.list", updatedDictionaries);
    return dictDirs;
  } catch (error) {
    return [];
  }
}
