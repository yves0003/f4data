import * as vscode from "vscode";
import { getAllGlobalState } from "../helpers/getAllGlobalKeys";

export class DictionaryPrivDec implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<
    vscode.Uri | vscode.Uri[]
  >();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  constructor(private context: vscode.ExtensionContext) {}

  refresh(uri?: vscode.Uri) {
    if (uri) {
      this._onDidChangeFileDecorations.fire(uri);
    }
  }

  provideFileDecoration(
    uri: vscode.Uri
  ): vscode.ProviderResult<vscode.FileDecoration> {
    if (uri.scheme !== "f4data-dictionary") {
      return;
    }

    const dictionaries = getAllGlobalState(this.context)[
      "f4data.list"
    ] as listDico;

    const dict = dictionaries?.find((d) => d.name === uri.path.slice(1));

    if (dict && dict?.disable === true) {
      return {
        badge: "D",
        //tooltip: "Disableg",
        color: new vscode.ThemeColor("activityBar.inactiveForeground"),
      };
    }
    return;
  }
}
