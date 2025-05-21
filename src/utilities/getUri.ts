import { Uri, Webview } from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * A helper function which will get the webview URI of a given file or resource.
 *
 * @remarks This URI can be used within a webview's HTML as a link to the
 * given file/resource.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param pathList An array of strings representing the path to a file/resource
 * @returns A URI pointing to the file/resource
 */
export function getUri(
  webview: Webview,
  extensionUri: Uri,
  pathList: string[]
) {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

export function getUriWithHash(
  webview: Webview,
  extensionUri: Uri,
  pathList: string[]
): Uri {
  const fsPath = Uri.joinPath(extensionUri, ...pathList).fsPath;
  const dir = path.dirname(fsPath);
  const baseName = path.basename(fsPath);

  const hasExtension = path.extname(baseName) !== "";

  if (!hasExtension) {
    // No extension, just return as-is
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
  }

  // Extract file base name and extension
  const nameWithoutExt = path.basename(baseName, path.extname(baseName));
  const ext = path.extname(baseName);

  // Read all files in the target directory
  const files = fs.readdirSync(dir);
  const matched = files.find(
    (file) => file.startsWith(nameWithoutExt) && file.endsWith(ext)
  );

  if (!matched) {
    throw new Error(
      `Could not find file matching ${nameWithoutExt}*${ext} in ${dir}`
    );
  }

  const fullPathList = [...pathList.slice(0, -1), matched];
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...fullPathList));
}
