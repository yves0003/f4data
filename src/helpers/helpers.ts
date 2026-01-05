import * as fs from "fs";
import { TreeDataProvider, TreeView, window, workspace } from "vscode";
import path from "path";
import * as readline from "readline/promises";
import { EnumNode, OutputTable } from "./ast_to_data";
import { getAllGlobalState } from "./getAllGlobalKeys";
import * as vscode from "vscode";

interface FileInfo {
  directory: string;
  filePath: string;
  filename: string;
}

export async function extractTextFromFile(
  filePath: string | undefined
): Promise<string> {
  try {
    // Verify the path exists and is a file
    if (!filePath) {
      throw new Error(`Path is undefined`);
    }
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    // Use readline for efficient reading, especially for large files
    const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const lines: string[] = [];
    for await (const line of rl) {
      lines.push(line);
    }

    return lines.join("\n");
  } catch (error) {
    throw new Error(
      `Failed to read file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*\[\]]/g, "_").slice(0, 31);
}

/**
 * Reads and returns the contents of a file as text
 * @param filePath Full path to the file
 * @returns Promise with file contents as string
 * @throws Error if file cannot be read
 */
export async function extractTextFromFile_old(
  filePath: string | undefined
): Promise<string> {
  try {
    // Verify the path exists and is a file
    if (!filePath) {
      throw new Error(`Path is undefined`);
    }
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    // Read the file contents with UTF-8 encoding
    return await fs.promises.readFile(filePath, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to read file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function getFilesByExtension(
  dir: string,
  ext: string
): Promise<FileInfo[]> {
  let results: FileInfo[] = [];
  try {
    // Read the contents of the directory
    const extension = "." + ext;
    const list = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const file of list) {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        const nestedResults = await getFilesByExtension(filePath, ext);
        results = results.concat(nestedResults);
      } else if (file.isFile() && path.extname(file.name) === extension) {
        results.push({
          directory: dir, // Directory where the file is located
          /*filename: file.name, // The filename,*/
          filename: path.basename(file.name, extension),
          filePath: filePath,
        });
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }
  return results;
}

export const slugify = (str: string) => {
  str = str.replace(/^\s+|\s+$/g, ""); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  const from = "àáãäâèéëêìíïîòóöôùúüûñç";
  const to = "aaaaaeeeeiiiioooouuuunc";

  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
  }

  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-"); // collapse dashes

  return str;
};

export function validateNameIsUnique(context: vscode.ExtensionContext) {
  return async function (name: string) {
    if (name === "") {
      return "Empty value";
    }
    const dictionaries = getAllGlobalState(context)["f4data.list"] as listDico;
    //const config = workspace.getConfiguration("f4data");
    //const dictionaries = config.get("list") as listDico;
    const findDic = dictionaries.find((dict) => dict.name === name);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return findDic !== undefined ? "Name is already used" : undefined;
  };
}

export function validateLinkExistOrIsUnique(context: vscode.ExtensionContext) {
  return async function (link_sel: string) {
    const link = link_sel;
    const isUrl = isValidURL(link);
    if (!isUrl) {
      const existDir = await directoryExists(link);
      if (existDir) {
        //const config = workspace.getConfiguration("f4data");
        //const dictionaries = config.get("list") as listDico;
        const dictionaries = getAllGlobalState(context)[
          "f4data.list"
        ] as listDico;
        const findDic = dictionaries.find((dict) => dict.link === link);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return findDic !== undefined
          ? `Link is already assign to ${findDic.name}`
          : undefined;
      } else {
        return "The directory not exists toto";
      }
    } else {
      return "You entered an URL!!!";
    }
  };
}
export function shouldResume() {
  // Could show a notification with the option to resume.
  return new Promise<boolean>((resolve, reject) => {
    // noop
  });
}

export class InputFlowAction {
  static back = new InputFlowAction();
  static cancel = new InputFlowAction();
  static resume = new InputFlowAction();
}

export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.promises.stat(dirPath);
    return stats.isDirectory();
  } catch (err) {
    return false;
  }
}

export function checkFileExists(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
}

export function checkFileExistsSync(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export async function getAllMarkdownFiles(
  dir: string
): Promise<MarkdownFileInfo[]> {
  let results: MarkdownFileInfo[] = [];
  try {
    // Read the contents of the directory
    const list = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const file of list) {
      const filePath = path.join(dir, file.name);

      if (file.isDirectory()) {
        // If the file is a directory, recursively search it
        const nestedResults = await getAllMarkdownFiles(filePath);
        results = results.concat(nestedResults);
      } else if (file.isFile() && path.extname(file.name) === ".md") {
        // If the file is a Markdown file, add it to the results
        results.push({
          directory: dir, // Directory where the file is located
          filename: file.name, // The filename,
          filePath: filePath,
        });
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }

  return results;
}

export async function findAllLastUpdateFiles(
  directories: string[] = []
): Promise<string[]> {
  let results: string[] = [];
  try {
    // Read the contents of the directory
    for (const dir of directories) {
      const list = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const file of list) {
        const filePath = path.join(dir, file.name);
        if (file.isFile() && file.name === "last_update.csv") {
          // If the file is 'last_update.csv', add its path to the results
          results.push(filePath);
        }
      }
    }
  } catch (err) {
    window.showWarningMessage(`Error reading all directory : ${err}`);
  }
  return results;
}

export class AddInfoTitleView<T> {
  #myTreeView: TreeView<T>;
  constructor(id_view: string, dataProvider: TreeDataProvider<T>) {
    //in dataProvider i can put any Dataprovider. I will work
    //Most important is id_view
    this.#myTreeView = window.createTreeView(id_view, {
      treeDataProvider: dataProvider,
    });
  }
  setTitle = (title: string) => {
    this.#myTreeView.title = title;
  };
  setMessage = (message: string) => {
    this.#myTreeView.message = message;
  };
  setBadge = async (context: vscode.ExtensionContext) => {
    const config = workspace.getConfiguration("f4data");
    //const dictionaries= config.get("list");
    const dictionaries: listDico | undefined = getAllGlobalState(context)[
      "f4data.list"
    ] as listDico;
    const listLastUpdated = await findAllLastUpdateFiles(
      dictionaries?.map((dic) => dic.link || "")
    );
    if (listLastUpdated.length > 0) {
      const value = listLastUpdated.length;
      const tooltip = `${listLastUpdated.length} updates`;
      this.#myTreeView.badge = { value, tooltip };
    }
  };
  clearTitle = () => {
    this.#myTreeView.title = "";
  };
  clearMessage = () => {
    this.#myTreeView.message = "";
  };
  clearBadge = (value: number, tooltip: string) => {
    this.#myTreeView.badge = undefined;
  };
}

export function getHtmlForWeb(
  csvData: EnumNode["allEnum"][0]["members"],
  title?: string
): string {
  if (csvData.length === 0) {
    return `<p>No data to display. click on a variable with a map</p>`;
  }
  let tableRows = csvData
    .map((row) => {
      const cells = Object.values(row)
        .map((value) => `<td>${value}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const headers = Object.keys(csvData[0])
    .map((header) => `<th>${header}</th>`)
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          table {
              width: 100%;
              border-collapse: collapse;
              background-color: var(--vscode-editor-background);
          }
          input[type="text"] {
              width: calc(100% - 20px);
              margin-right: 20px;
              padding: 8px;
              margin-bottom: 10px;
              font-size: var(--vscode-font-size);
              font-family: var(--vscode-font-family);
              color: var(--vscode-input-foreground);
              background-color: var(--vscode-input-background);
              border: 1px solid var(--vscode-input-border);
              border-radius: 3px;
          }
          th, td {
              padding: 8px;
              text-align: left;
              border: 1px solid var(--vscode-editor-foreground);
          }
          th {
              background-color: var(--vscode-editorHoverWidget-background);
              font-weight: bold;
          }
          tr:nth-child(even) {
              background-color: var(--vscode-editorWidget-border);
          }
          tr:hover {
              background-color: var(--vscode-list-hoverBackground);
          }
      </style>
  </head>
  <body>
  ${
    title && `<h3 style="color: var(--vscode-editor-foreground);">${title}</h3>`
  }
      <input type="text" id="filterInput" placeholder="Filter Mapping..." onkeyup="filterTable()" autofocus>
      <table id="csvTable">
          <thead>
              <tr>${headers}</tr>
          </thead>
          <tbody>
              ${tableRows}
          </tbody>
      </table>
    <script>
      function filterTable() {
          const input = document.getElementById('filterInput');
          const filter = input.value.toLowerCase();
          const table = document.getElementById('csvTable');
          const rows = table.getElementsByTagName('tr');

          for (let i = 1; i < rows.length; i++) {
              const cells = rows[i].getElementsByTagName('td');
              let match = false;
              for (let j = 0; j < cells.length; j++) {
                  if (cells[j]) {
                      const cellValue = cells[j].textContent || cells[j].innerText;
                      if (cellValue.toLowerCase().indexOf(filter) > -1) {
                          match = true;
                          break;
                      }
                  }
              }
              rows[i].style.display = match ? '' : 'none';
          }
      }
  </script>
  </body>
  </html>
  `;
}

export function stringEscapeBack(s: string) {
  return s
    ? s
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t")
        .replace(/\v/g, "\\v")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/[\x00-\x1F\x80-\x9F]/g, hex)
    : s;
  function hex(c: string) {
    var v = "0" + c.charCodeAt(0).toString(16);
    return "\\x" + v.substr(v.length - 2);
  }
}

function findSeparator(line1: string, line2: string): string | null {
  // List of common delimiters
  const delimiters = [",", ";", "\t", "|"];

  // Test each delimiter on both lines
  for (const delimiter of delimiters) {
    const segments1 = splitCSVLine(line1, delimiter);
    const segments2 = splitCSVLine(line2, delimiter);
    if (segments1.length > 1 && segments1.length === segments2.length) {
      return delimiter; // Return the delimiter if both lines split into the same number of parts
    }
  }

  return null; // Return null if no consistent delimiter is found
}
function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let current = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
function cleanKeys(object: { [key: string]: any }) {
  Object.keys(object).forEach(function (key) {
    //delete space at the end and beginning of the key
    var newKey = key.trim();
    if (typeof object[key] === "string" || object[key] instanceof String) {
      object[key] = object[key].trim();
    }
    if (object[key] && typeof object[key] === "object") {
      cleanKeys(object[key]);
    }
    if (key !== newKey) {
      object[newKey] = object[key];
      delete object[key];
    }
  });
}

function isValidURL(string: string): boolean {
  const regex = new RegExp(
    "^((https?|ftp):\\/\\/)?" + // Protocol (optional)
      "((([a-zA-Z0-9\\-]+\\.)+[a-zA-Z]{2,})|" + // Domain name
      "localhost|" + // Localhost
      "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|" + // OR IPv4
      "\\[?[a-fA-F0-9]*:[a-fA-F0-9:]+\\]?)" + // OR IPv6
      "(\\:\\d+)?(\\/[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?" + // Port and path (optional)
      "(\\?[;&a-zA-Z0-9%_\\+.~#?&//=]*)?" + // Query string (optional)
      "(\\#[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?$", // Fragment (optional)
    "i"
  );

  return regex.test(string);
}

interface DirectoryMatchOptions {
  checkExistence?: boolean;
  caseSensitive?: boolean;
}

export function findMatchingDirectory(
  inputPath: string,
  targetVariations: string[],
  options: DirectoryMatchOptions = {}
): string | null {
  // Set default options
  const { caseSensitive = false, checkExistence = true } = options;

  // Step 1: Verify input path exists
  if (checkExistence) {
    try {
      const stats = fs.statSync(inputPath);
      if (!stats.isDirectory()) {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  // Step 2: Get all folders in the directory
  let subdirectories: string[];
  try {
    const entries = fs.readdirSync(inputPath, { withFileTypes: true });
    subdirectories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (error) {
    return null;
  }

  // Step 3: Check for matching variations
  const normalizedVariations = caseSensitive
    ? targetVariations
    : targetVariations.map((v) => v.toLowerCase());

  for (const dirName of subdirectories) {
    const normalizedDirName = caseSensitive ? dirName : dirName.toLowerCase();

    if (normalizedVariations.includes(normalizedDirName)) {
      const fullPath = path.join(inputPath, dirName);
      if (checkExistence) {
        try {
          if (!fs.statSync(fullPath).isDirectory()) {
            continue;
          }
        } catch (error) {
          continue;
        }
      }

      return fullPath;
    }
  }

  return null;
}

export const sortVars = (
  a: OutputTable["variables"][0],
  b: OutputTable["variables"][0]
) => {
  if (a.cle && !b.cle) {
    return -1;
  }
  if (!a.cle && b.cle) {
    return 1;
  }
  return a.name.localeCompare(b.name);
};

export function addUniqueToArr<T>(arr: T[], obj: T, keys: (keyof T)[]) {
  const exists = arr.some((item) => keys.every((k) => item[k] === obj[k]));
  if (!exists) {
    arr.push(obj);
  }
}
