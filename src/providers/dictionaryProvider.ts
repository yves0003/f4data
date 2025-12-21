import {
  EventEmitter,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  window,
  workspace,
  Event,
  env,
  Uri,
  TreeView,
} from "vscode";
import { directoryExists, validateNameIsUnique } from "../helpers/helpers";
import * as vscode from "vscode";
import {
  getAllGlobalState,
  updateGlobalState,
} from "../helpers/getAllGlobalKeys";

export class Dictionary extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly parent?: Dictionary
  ) {
    super(label);
  }
  iconPath = new ThemeIcon("database");
  command = {
    title: "selected dictionary clicked",
    command: "f4data.clickOnDicItem",
    arguments: [this],
  };
}

export class DictionaryProvider implements TreeDataProvider<Dictionary> {
  private view?: TreeView<Dictionary>;
  data: Dictionary[];
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    const dictionaries = this.getDictionaryInfos();
    if (dictionaries && dictionaries.length > 0) {
      this.data = dictionaries.map((dico) => new Dictionary(dico.name || ""));
    } else {
      this.data = [];
    }
  }

  private _onDidChangeTreeData: EventEmitter<
    Dictionary | undefined | null | void
  > = new EventEmitter<Dictionary | undefined | null | void>();
  readonly onDidChangeTreeData: Event<Dictionary | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private getDictionaryInfos() {
    //const config = workspace.getConfiguration("f4data");
    //const dictionaries: listDico | undefined = config.get("list");
    const dictionaries = getAllGlobalState(this.context)[
      "f4data.list"
    ] as listDico;
    return dictionaries;
  }
  getTreeItem(element: Dictionary): Dictionary {
    return element;
  }
  getChildren(element?: Dictionary): Thenable<Dictionary[]> {
    if (element) {
      return Promise.resolve([element]);
    } else {
      const dictionaries = this.getDictionaryInfos();
      if (dictionaries && dictionaries.length > 0) {
        const dictionariesName = dictionaries.map(
          (dico) => new Dictionary(dico.name || "")
        );
        return Promise.resolve(dictionariesName);
      } else {
        window.showInformationMessage("Workspace has no dictionary");
        return Promise.resolve([]);
      }
    }
  }
  getParent(element: Dictionary): Dictionary | undefined {
    return element.parent;
  }
  setData(data: Dictionary[] | undefined): void {
    if (data && data.length === 0) {
      this.data = [];
      this._onDidChangeTreeData.fire();
    } else {
      const dictionaries = this.getDictionaryInfos();
      if (dictionaries && dictionaries.length > 0) {
        let newData = dictionaries.map(
          (dico) => new Dictionary(dico.name || "")
        );
        if (newData.length !== this.data.length) {
          this.data = newData;
          this._onDidChangeTreeData.fire();
        }
      }
    }
  }
  setView(view: TreeView<Dictionary>) {
    this.view = view;
  }
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
  revealItem(name: string) {
    const item = this.data.find((i) => i.label === name);
    if (item && this.view) {
      const dic = new Dictionary(item.label);
      this.view.reveal(dic, { select: true, focus: true });
    }
  }
  on_item_clicked(item: Dictionary) {
    if (item?.label === undefined || "") {
      return;
    }
    const dictionaries = this.getDictionaryInfos();
    if (dictionaries && dictionaries.length > 0) {
      return dictionaries.find((dic) => dic.name === item.label)?.link;
    }
    return undefined;
  }
  async on_delete_item(item: TreeItem) {
    if (item.label === undefined || "") {
      return;
    }
    // const header = `Delete the dictionary ${item.label}?`;
    // const options: MessageOptions = {
    //   detail: "Are you sure you want to delete?",
    //   modal: true,
    // };
    //.showInformationMessage(header, options, ...["Ok"])
    const confirm = await window.showErrorMessage(
      `Are you sure you want to delete ${item.label}?`,
      "Yes",
      "No"
    );
    if (confirm === "Yes") {
      const dictionaries = getAllGlobalState(this.context)[
        "f4data.list"
      ] as listDico;

      //const config = workspace.getConfiguration("f4data");
      //const dictionaries = config.get("list") as listDico;
      const dictTokeep = dictionaries.filter(
        (dict) => dict.name !== item.label
      );
      // await config.update(
      //   "list",
      //   dictTokeep,
      //   vscode.ConfigurationTarget.Global
      // );
      const globalStateUpdate = updateGlobalState(this.context);
      await globalStateUpdate("f4data.list", dictTokeep);
    }
  }
  async on_rename_item(item: Dictionary) {
    if (item.label === undefined || "") {
      return;
    }
    const input = window.createInputBox();
    input.placeholder = `Modify the name`;
    input.prompt = `Modify the name`;
    input.value = item.label as string;

    input.show();

    try {
      await new Promise<string | undefined>((resolve) => {
        input.onDidChangeValue(async (text) => {
          const validationMessage = await validateNameIsUnique(this.context)(
            text
          );
          if (validationMessage !== undefined) {
            input.validationMessage = validationMessage;
          }
        });
        input.onDidAccept(async () => {
          const value = input.value;
          input.enabled = false;
          input.busy = true;
          const validationMessage = await validateNameIsUnique(this.context)(
            value
          );
          if (validationMessage !== undefined) {
            resolve(undefined);
            input.validationMessage = validationMessage;
            await new Promise((resolve) => setTimeout(resolve, 1000));
            //input.hide();
          } else {
            const dictionaries = getAllGlobalState(this.context)[
              "f4data.list"
            ] as listDico;
            //const config = workspace.getConfiguration("f4data");
            //const dictionaries = config.get("list") as listDico;
            const dictUpdated = dictionaries.map((dic) =>
              dic.name === item.label ? { ...dic, name: value } : dic
            );
            // await config.update(
            //   "list",
            //   dictUpdated,
            //   vscode.ConfigurationTarget.Global
            // );
            const globalStateUpdate = updateGlobalState(this.context);
            await globalStateUpdate("f4data.list", dictUpdated);
            resolve(value);
            input.hide();
          }
          input.enabled = true;
          input.busy = false;
        });
        input.onDidHide(() => {
          resolve(undefined);
          input.dispose();
        });
      });
    } catch (error) {}
  }
  async on_open_work_dir(item: Dictionary) {
    if (item.label === undefined || "") {
      window.showErrorMessage(`Error: Open Work Directory not defined`);
    }
    const dictionaries = getAllGlobalState(this.context)[
      "f4data.list"
    ] as listDico;
    //const config = workspace.getConfiguration("f4data");
    //const dictionaries = config.get("list") as listDico;
    const selected_config = dictionaries.find(
      (dict) => dict.name === item.label
    );
    if (selected_config?.work_dir) {
      const uri = Uri.file(selected_config.work_dir);
      await env.openExternal(uri);
    } else {
      await window.showErrorMessage(
        `Please add a working directory to open it.`
      );
    }
  }
  async on_update_work_dir(item: Dictionary) {
    if (item.label === undefined || "") {
      return;
    }
    const dictionaries = getAllGlobalState(this.context)[
      "f4data.list"
    ] as listDico;
    //const config = workspace.getConfiguration("f4data");
    //const dictionaries = config.get("list") as listDico;
    const selected_config = dictionaries.find(
      (dict) => dict.name === item.label
    );
    if (selected_config) {
      const input = window.createInputBox();
      input.placeholder = `Put/your/directory`;
      input.prompt = `Update your working directory`;
      input.value = selected_config.work_dir || "";

      input.show();

      try {
        await new Promise<string | undefined>((resolve) => {
          input.onDidChangeValue(async (text) => {
            const dirExist = await directoryExists(text);
            if (!dirExist) {
              input.validationMessage = `The directory does not exist`;
              //window.showErrorMessage(`The directory does not exist`);
            } else {
              input.validationMessage = "";
            }
          });
          input.onDidAccept(async () => {
            const value = input.value;
            input.enabled = false;
            input.busy = true;
            const dirExist = await directoryExists(value);
            if (!dirExist) {
              resolve(undefined);
              input.validationMessage = `The directory does not exist`;
              await new Promise((resolve) => setTimeout(resolve, 1000));
              //input.hide();
            } else {
              const dictUpdated = dictionaries.map((dic) =>
                dic.name === item.label ? { ...dic, work_dir: value } : dic
              );
              // await config.update(
              //   "list",
              //   dictUpdated,
              //   vscode.ConfigurationTarget.Global
              // );
              const globalStateUpdate = updateGlobalState(this.context);
              await globalStateUpdate("f4data.list", dictUpdated);

              resolve(value);
              input.hide();
            }
            input.enabled = true;
            input.busy = false;
          });
          input.onDidHide(() => {
            resolve(undefined);
            input.dispose();
          });
        });
      } catch (error) {
        window.showErrorMessage(`Error: Update Work Directory`);
      }
    }
  }
}
