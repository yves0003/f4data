import * as vscode from "vscode";
import { addAllDictionaries } from "./commands/addDictionaries";
import {
  AddInfoTitleView,
  findMatchingDirectory,
  getAllMarkdownFiles,
  getFilesByExtension,
  sortVars,
} from "./helpers/helpers";
import { find, indexOf as lodashIndexOf } from "lodash";
import { Dictionary, DictionaryProvider } from "./providers/dictionaryProvider";
import path from "path";
import { EnumNode, EnumNodeElt, RefNode } from "./helpers/ast_to_data";
import { DicTabProvider } from "./providers/dicTabProvider";
import { DicTabVarProvider } from "./providers/dicTabVarProvider";
import { OutputTable } from "./helpers/ast_to_data";
import { DocProvider } from "./providers/docProvider";
import { MapProvider } from "./providers/mapProvider";
import { MapPanelDiag } from "./panels/mapPanel";
import { completionItemProvider } from "./providers/completionItemProvider";
import { SearchPanelDiag } from "./panels/searchPanel";
import { updateContextBasedOnConfig } from "./utilities/updateContextBasedOnConfig";
import { parseFileInWorker } from "./workers/parseFileInWorker";
import { jsonToExcelTable } from "./helpers/jsonToExcelTable";
import { refreshDictsDir } from "./commands/refreshDictsDir";
import {
  getAllGlobalState,
  updateGlobalState,
} from "./helpers/getAllGlobalKeys";
import { exportToExcel } from "./commands/exportToExcel";

interface State {
  title: string;
  name: string;
  link: string;
}
type keytouse = "name" | "link";
const upsert = function (
  arr: listDico,
  keyToUse: keytouse,
  newval: Partial<listDico[0]>
) {
  let key: { [x: string]: string } = {};
  if (newval[keyToUse] !== undefined) {
    key[keyToUse] = newval[keyToUse];
    const match = find(arr, key);
    if (match) {
      const index = lodashIndexOf(arr, find(arr, key));
      arr.splice(index, 1, newval);
    } else {
      arr.push(newval);
    }
  }
  return arr.sort((a, b) => {
    if ((a.name || "") < (b.name || "")) {
      return -1;
    } else {
      return 1;
    }
  });
};

export async function activate(context: vscode.ExtensionContext) {
  //const config = vscode.workspace.getConfiguration("f4data");
  //await config.update("snippetPath", null);
  //console.log(config, "config.f4data");
  const alldict = context.globalState.get("f4data.list") as
    | listDico
    | undefined;
  const snipDir = context.globalState.get("f4data.snippetPath") as
    | string
    | undefined;
  //updateContextBasedOnConfig(config);
  //console.log(config.get("list"), "extension config");
  //console.log(getAllGlobalState(context), "extension context");

  let selectedDic: OutputTable[] = [];
  let selectedTab: string = "";
  let allMappDic: EnumNodeElt[];
  let listTabsInfo: {
    name: string;
    tables: OutputTable[];
    mappings: EnumNodeElt[];
    links: RefNode[];
  } = { name: "", tables: [], mappings: [], links: [] };
  let listVarTabsInfo: OutputTable | undefined;
  const dictionaryProvider = new DictionaryProvider(context);
  const dicListView = vscode.window.createTreeView("dic-list", {
    treeDataProvider: dictionaryProvider,
  });
  dictionaryProvider.setView(dicListView);
  const dicTabProvider = new DicTabProvider();
  const dicTabVarProvider = new DicTabVarProvider();
  const docProvider = new DocProvider();
  const mapProvider = new MapProvider();
  const title_tab = new AddInfoTitleView("dic-tabs", dicTabProvider);
  const title_var = new AddInfoTitleView("dic-vars", dicTabVarProvider);

  const displayMapOnView = vscode.window.registerWebviewViewProvider(
    mapProvider.viewType,
    mapProvider
  );
  const refreshAll = vscode.commands.registerCommand(
    "f4data.refreshAll",
    async () => {
      const listDict = await refreshDictsDir(context);
      if (listDict) {
        dictionaryProvider.setData([]);
        dicTabProvider.setData([]);
        dicTabVarProvider.setData([]);
        docProvider.setData([]);
        mapProvider.setDataAndUpdateContent([], "");
        title_tab.setTitle("Tables");
        title_var.setTitle(`Variables`);
        selectedDic = [];
        selectedTab = "";
        listVarTabsInfo = undefined;
        listTabsInfo = { name: "", tables: [], mappings: [], links: [] };
        vscode.window.showInformationMessage("Actualisé !!!!");
        vscode.commands.executeCommand(
          "workbench.action.focusActiveEditorGroup"
        );
        //dictionaryProvider.refresh();
      } else {
        vscode.window.showErrorMessage("Error : Actualisation!!!!");
      }
    }
  );
  const commandExportToExcel = vscode.commands.registerCommand(
    "f4data.exportToExcel",
    async () => {
      await exportToExcel(context);
    }
  );
  const commandAddDictionaries = vscode.commands.registerCommand(
    "f4data.addDictionaries",
    async () => {
      const state = {} as Partial<State>;
      state.link = await addAllDictionaries();
      if (!state.link) {
        return;
      }
      const list_dics = await getFilesByExtension(state.link, "rd");
      const list_snippet = await getFilesByExtension(state.link, "json");
      const snippetlink = list_snippet.find((e) =>
        e.filename.toLowerCase().includes("sas")
      );
      //const savedDictionaries = config.get("list") as listDico;
      const savedDictionaries = (getAllGlobalState(context)["f4data.list"] ||
        []) as listDico;
      for (const dict of list_dics) {
        const dictToAdd = { name: dict.filename, link: dict.filePath };
        // await config.update(
        //   "list",
        //   upsert(savedDictionaries, "name", dictToAdd),
        //   vscode.ConfigurationTarget.Global
        // );
        const globalStateUpdate = updateGlobalState(context);
        await globalStateUpdate(
          "f4data.list",
          upsert(savedDictionaries, "name", dictToAdd)
        );
      }
      if (snippetlink) {
        // await config.update(
        //   "snippetPath",
        //   snippetlink.filePath,
        //   vscode.ConfigurationTarget.Global
        // );
        const globalStateUpdate = updateGlobalState(context);
        await globalStateUpdate("f4data.snippetPath", snippetlink.filePath);
        vscode.window.showInformationMessage(
          "SAS snippet path updated. Please reload the window to apply."
        );
      }
      dictionaryProvider.refresh();
    }
  );
  const commandClickOnDicItem = vscode.commands.registerCommand(
    "f4data.clickOnDicItem",
    async (dicItem: Dictionary) => {
      //vscode.commands.executeCommand("f4data.refreshAll");
      if (listTabsInfo.name !== dicItem.label) {
        dicTabProvider.setData([]);
        dicTabVarProvider.setData([]);
        docProvider.setData([]);
        mapProvider.setDataAndUpdateContent([], "");
        const selectDicLink = dictionaryProvider.on_item_clicked(dicItem);
        listTabsInfo = await parseFileInWorker(selectDicLink, dicItem.label);
        dicTabProvider.setLink(path.dirname(selectDicLink || ""));
        dicTabProvider.setData(
          listTabsInfo.tables.sort((a, b) => a.name.localeCompare(b.name))
        );
        title_tab.setTitle(
          `Tables${
            listTabsInfo.tables.length > 0
              ? ` (${listTabsInfo.tables.length})`
              : ""
          }`
        );
        title_var.setTitle(`Variables`);
        listVarTabsInfo = undefined;
        selectedDic = listTabsInfo.tables;
        allMappDic = listTabsInfo.mappings;

        const docFolder = findMatchingDirectory(
          path.dirname(selectDicLink || ""),
          ["documents", "docs", "doc", "document"],
          { caseSensitive: false }
        );
        if (docFolder) {
          const listDocs = await getAllMarkdownFiles(docFolder);
          docProvider.setData(
            listDocs.sort((a, b) => a.filename.localeCompare(b.filename))
          );
        } else {
          docProvider.setData([]);
        }
        dictionaryProvider.revealItem(dicItem.label);
      }
    }
  );
  const commandClickOnTable = vscode.commands.registerCommand(
    "f4data.clickOnTable",
    async (item) => {
      if (selectedDic.length > 0) {
        listVarTabsInfo = selectedDic.find((dict) => dict.name === item.label);
        if (listVarTabsInfo) {
          selectedTab = item.label;
          dicTabVarProvider.setData(listVarTabsInfo.variables.sort(sortVars));
          title_var.setTitle(
            `Variables${
              listVarTabsInfo.variables.length > 0
                ? ` (${listVarTabsInfo.variables.length})`
                : ""
            }`
          );
        } else {
          selectedTab = "";
          dicTabVarProvider.setData([]);
          vscode.window.showWarningMessage(`No vars for : ${item.label}`);
        }
      }
    }
  );
  const displayDoc = vscode.commands.registerCommand(
    "f4data.clickOnDoc",
    async (item) => {
      if (item.filePath) {
        const markdownUri = vscode.Uri.file(item.filePath);
        //await vscode.commands.executeCommand("vscode.open", markdownUri);
        await vscode.commands.executeCommand(
          "markdown.showPreview",
          markdownUri
        );
      } else {
        vscode.window.showWarningMessage(
          "No markdown file associated with this item."
        );
      }
    }
  );
  const copyVarVal = vscode.commands.registerCommand(
    "f4data.copyVarVal",
    (item) => {
      if (item && item.label) {
        vscode.env.clipboard.writeText(item.valName);
        vscode.window.showInformationMessage(`Copied`);
      } else {
        vscode.window.showWarningMessage("No label to copy.");
      }
    }
  );
  const deleteDictionary = vscode.commands.registerCommand(
    "f4data.deleteAdict",
    async (item) => {
      await dictionaryProvider.on_delete_item(item);
      dictionaryProvider.refresh();
      //statusBarItem.hide();
      dicTabProvider.setData([]);
      dicTabVarProvider.setData([]);
      docProvider.setData([]);
      title_var.setTitle(`Variables`);
      title_tab.setTitle("Tables");
      selectedTab = "";
      if (MapPanelDiag.currentPanel?.getTitle() === `graph : ${item.label}`) {
        MapPanelDiag.currentPanel?.dispose();
      }
      if (
        SearchPanelDiag.currentPanel?.getTitle() === `search : ${item.label}`
      ) {
        SearchPanelDiag.currentPanel?.dispose();
      }

      //mapProvider.updateContent([], "");
    }
  );
  const openWorkDir = vscode.commands.registerCommand(
    "f4data.openWorkDir",
    async (item) => {
      await dictionaryProvider.on_open_work_dir(item);
      dictionaryProvider.refresh();
    }
  );
  const displayMapOnClick = vscode.commands.registerCommand(
    "f4data.displayMap",
    async (item) => {
      if (selectedDic.length > 0 && allMappDic.length > 0) {
        const selectedMapp = allMappDic.find(
          (e) => e.name.toLowerCase() === item.valName.toLowerCase()
        );
        if (selectedMapp && selectedMapp.members.length > 0) {
          mapProvider.setDataAndUpdateContent(
            selectedMapp.members,
            item.valName
          );
        } else {
          vscode.window.showErrorMessage(`Mapping Values are not defined`);
        }
        vscode.commands.executeCommand("mappingApanel.focus");
      } else {
        vscode.window.showErrorMessage(`Dictionay not defined`);
      }
    }
  );
  const updateWorkDir = vscode.commands.registerCommand(
    "f4data.updateWorkDir",
    async (item) => {
      await dictionaryProvider.on_update_work_dir(item);
      dictionaryProvider.refresh();
    }
  );
  const clickOnVar = vscode.commands.registerCommand(
    "f4data.clickOnVar",
    () => {
      mapProvider.setDataAndUpdateContent([], "");
    }
  );
  const displayDiagramPage = vscode.commands.registerCommand(
    "f4data.mapWebview",
    async (dicItem: Dictionary) => {
      if (listTabsInfo.name !== dicItem.label) {
        await vscode.commands.executeCommand(dicItem.command.command, dicItem);
      }
      if (
        MapPanelDiag.currentPanel?.getTitle() !== `graph : ${dicItem.label}`
      ) {
        listTabsInfo.tables.sort((a, b) => a.name.localeCompare(b.name));
      }
      MapPanelDiag.render(context.extensionUri, dicItem, listTabsInfo);
    }
  );
  const displaySearchPage = vscode.commands.registerCommand(
    "f4data.searchWebview",
    async (dicItem: Dictionary) => {
      if (listTabsInfo.name !== dicItem.label) {
        await vscode.commands.executeCommand(dicItem.command.command, dicItem);
      }
      if (
        SearchPanelDiag.currentPanel?.getTitle() !== `search : ${dicItem.label}`
      ) {
        listTabsInfo.tables.sort((a, b) => a.name.localeCompare(b.name));
      }
      SearchPanelDiag.render(context.extensionUri, dicItem, listTabsInfo);
    }
  );
  const copyTableToCSV = vscode.commands.registerCommand(
    "f4data.copyTableToCSV",
    async () => {
      const tableToCopy = listTabsInfo.tables.map((table) => ({
        name: table.name,
        description: table.description,
      }));
      const table = jsonToExcelTable(tableToCopy);
      try {
        if (table === "") {
          vscode.window.showErrorMessage(`Failed to copy : No tabs`);
        } else {
          await vscode.env.clipboard.writeText(table);
          vscode.window.showInformationMessage(`Copied`);
        }
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to copy : ${err}`);
      }
    }
  );
  const copyVarsToCSV = vscode.commands.registerCommand(
    "f4data.copyVarsToCSV",
    async () => {
      if (listVarTabsInfo !== undefined) {
        const tableToCopy = listVarTabsInfo.variables.map((val) => ({
          name: val.name,
          description: val.desc,
        }));
        const table = jsonToExcelTable(tableToCopy);
        try {
          await vscode.env.clipboard.writeText(table);
          vscode.window.showInformationMessage(`Copied`);
        } catch (err) {
          vscode.window.showErrorMessage(`Failed to copy : ${err}`);
        }
      } else {
        vscode.window.showErrorMessage(`Failed to copy : No vars`);
      }
    }
  );
  const viewDocOnTable = vscode.commands.registerCommand(
    "f4data.viewDocOnTable",
    async (item) => {
      vscode.window.showInformationMessage(item.label);
      const markdownUri = vscode.Uri.file(item.docLink);
      await vscode.commands.executeCommand("markdown.showPreview", markdownUri);
    }
  );
  context.subscriptions.push(copyVarVal);
  context.subscriptions.push(displayDoc);
  context.subscriptions.push(refreshAll);
  context.subscriptions.push(clickOnVar);
  context.subscriptions.push(openWorkDir);
  context.subscriptions.push(updateWorkDir);
  context.subscriptions.push(deleteDictionary);
  context.subscriptions.push(commandAddDictionaries);
  context.subscriptions.push(commandClickOnDicItem);
  context.subscriptions.push(commandClickOnTable);
  context.subscriptions.push(displayMapOnClick);
  context.subscriptions.push(displayMapOnView);
  context.subscriptions.push(displayDiagramPage);
  context.subscriptions.push(displaySearchPage);
  context.subscriptions.push(copyTableToCSV);
  context.subscriptions.push(copyVarsToCSV);
  context.subscriptions.push(viewDocOnTable);
  context.subscriptions.push(commandExportToExcel);
  context.subscriptions.push(completionItemProvider(context));

  vscode.window.registerTreeDataProvider("dic-list", dictionaryProvider);
  vscode.window.registerTreeDataProvider("dic-tabs", dicTabProvider);
  vscode.window.registerTreeDataProvider("dic-vars", dicTabVarProvider);
  vscode.window.registerTreeDataProvider("dic-docs", docProvider);

  // vscode.workspace.onDidChangeConfiguration((e) => {
  //   if (e.affectsConfiguration("f4data.snippetPath")) {
  //     vscode.window.showInformationMessage(
  //       "SAS snippet path updated. Please reload the window to apply."
  //     );
  //   }
  //   if (e.affectsConfiguration("f4data.list")) {
  //     updateContextBasedOnConfig(config);
  //   }
  // });

  return {
    extendMarkdownIt(md: any) {
      return md
        .use(require("markdown-it-collapsible"))
        .use(require("markdown-it-highlightjs"));
    },
  };
}

// This method is called when your extension is deactivated
export async function deactivate(): Promise<void> {
  const config = vscode.workspace.getConfiguration("f4data");
  await config.update("list", [], vscode.ConfigurationTarget.Global);
}
