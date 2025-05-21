import * as vscode from "vscode";

let statusBarItem: vscode.StatusBarItem;
statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  1
);
statusBarItem.backgroundColor = new vscode.ThemeColor(
  "statusBarItem.warningBackground"
);

export function openDirectory(
  { label }: { label: string },
  selectDicLink: string | undefined
) {
  statusBarItem.text = `$(database) ${label || ""}`;
  statusBarItem.tooltip = `Click to open the work directory`;
  statusBarItem.command = {
    title: "Open a directory",
    command: "f4data.openDirectory",
    arguments: [{ label, selectDicLink }],
  };
  statusBarItem.show();
}
