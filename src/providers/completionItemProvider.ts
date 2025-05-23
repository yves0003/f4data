import * as vscode from "vscode";
import * as fs from "fs";

type Snippet = {
  [x: string]: {
    prefix: string;
    body: string[];
    description: string;
  };
};

export const completionItemProvider = (context: vscode.ExtensionContext) => {
  const config = vscode.workspace.getConfiguration("f4data");
  const snippetPath = config.get<string>("snippetPath");
  let snippets: Snippet = {};

  try {
    if (snippetPath && fs.existsSync(snippetPath ? snippetPath : "")) {
      const content = fs.readFileSync(snippetPath, "utf8");
      snippets = JSON.parse(content);
    } else {
      vscode.window.showErrorMessage(
        `SAS snippet file not found: ${snippetPath}`
      );
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to load SAS snippets: ${error}`);
    console.error(error);
  }

  return vscode.languages.registerCompletionItemProvider("sas", {
    provideCompletionItems() {
      const items: vscode.CompletionItem[] = [];
      if (Object.keys(snippets).length !== 0) {
        for (const [label, snippet] of Object.entries(snippets)) {
          const item = new vscode.CompletionItem(
            snippet.prefix,
            vscode.CompletionItemKind.Snippet
          );
          const body = Array.isArray(snippet.body)
            ? snippet.body.join("\n")
            : snippet.body;

          item.insertText = new vscode.SnippetString(body);
          item.detail = label;
          item.documentation = snippet.description || "";

          items.push(item);
        }
        return items;
      }
    },
  });
};
