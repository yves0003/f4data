import { QuickInputButtons, window } from "vscode";
import {
  getFilesByExtension,
  InputFlowAction,
  shouldResume,
  validateLinkExistOrIsUnique,
} from "../helpers/helpers";
import * as vscode from "vscode";
import { find, indexOf } from "lodash";

interface State {
  title: string;
  name: string;
  link: string;
}
type keytouse = "name" | "link";

export function addDictionariesn(state: Partial<State>): Promise<string> {
  const config = vscode.workspace.getConfiguration("f4data");
  return new Promise(async (resolve, reject) => {
    state.link = await addDictionaries({
      title: "Create a new dictionary",
      value: "",
      placeholder: "Choose a link",
      prompt: "Choose a link",
      validate: validateLinkExistOrIsUnique,
      shouldResume: shouldResume,
    });
    vscode.window.showInformationMessage(`${state.link}`);
    if (!state.link) {
      return;
    }
    const list_dics = await getFilesByExtension(state.link, "rd");
    const savedDictionaries = config.get("list") as listDico;

    for (const dict of list_dics) {
      const dictToAdd = { name: dict.filename, link: dict.filePath };
      await config.update(
        "list",
        upsert(savedDictionaries, "name", dictToAdd),
        true
      );
    }
  });
}

export async function addAllDictionaries() {
  try {
    const dir = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: "Sélectionner",
    });
    if (dir) {
      return dir[0].path;
    } else {
      return undefined;
    }
  } catch (error) {
    window.showErrorMessage("error.addDictionaries");
  }
}

export async function addDictionaries<P extends InputBoxParameters>({
  title,
  value,
  prompt,
  validate,
  ignoreFocusOut,
  placeholder,
}: Partial<P>) {
  try {
    const input = window.createInputBox();
    return new Promise<string | never>((resolve, reject) => {
      input.title = title;
      input.value = value || "";
      input.prompt = prompt;
      input.ignoreFocusOut = ignoreFocusOut ?? false;
      input.placeholder = placeholder;
      let validating = validate!("");
      input.onDidTriggerButton((item) => {
        if (item === QuickInputButtons.Back) {
          reject(InputFlowAction.back);
        } else {
          resolve(<any>item);
        }
      });
      input.onDidAccept(async () => {
        const value = input.value;
        input.enabled = false;
        input.busy = true;
        if (!(await validate!(value))) {
          resolve(value);
        }
        input.enabled = true;
        input.busy = false;
        input.dispose();
      });
      input.onDidChangeValue(async (text) => {
        const current = validate!(text);
        validating = current;
        const validationMessage = await current;
        if (current === validating) {
          input.validationMessage = validationMessage;
        }
      });
      input.onDidHide(() => input.dispose());
      input.show();
    });
  } catch (error) {
    window.showErrorMessage("error.addDictionaries");
  }
}
function upsert(
  arr: listDico,
  keyToUse: keytouse,
  newval: Partial<listDico[0]>
) {
  let key: { [x: string]: string } = {};
  if (newval[keyToUse] !== undefined) {
    key[keyToUse] = newval[keyToUse];
    const match = find(arr, key);
    if (match) {
      const index = indexOf(arr, find(arr, key));
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
}
