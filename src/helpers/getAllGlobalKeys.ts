import * as vscode from "vscode";
export function getAllGlobalState(context: vscode.ExtensionContext) {
  return Object.fromEntries(
    context.globalState.keys().map((key) => [key, context.globalState.get(key)])
  );
}
export function updateGlobalState(context: vscode.ExtensionContext) {
  return async <T>(valToUpdate: string, value: T) => {
    try {
      await context.globalState.update(valToUpdate, value);
      return true;
    } catch (error) {
      return false;
    }
  };
}
