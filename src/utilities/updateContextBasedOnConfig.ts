import { commands, WorkspaceConfiguration } from "vscode";

export function updateContextBasedOnConfig(config: WorkspaceConfiguration) {
  const list = config.get<any[]>("list");
  const isEmptyOrMissing = !list || list.length === 0;
  commands.executeCommand("setContext", "config.listEmpty", isEmptyOrMissing);
}
