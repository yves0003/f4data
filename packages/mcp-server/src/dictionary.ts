import { readFile, readdir, stat } from "fs/promises";
import { join, basename, extname } from "path";
import { homedir } from "os";
import { Parser } from "./parser/Parser.js";
import { ast_to_data, type DictionaryData } from "./parser/ast_to_data.js";

export interface LoadedDictionary {
  label: string;
  filePath: string;
  data: DictionaryData;
}

async function findRdFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findRdFiles(fullPath)));
    } else if (entry.isFile() && extname(entry.name) === ".rd") {
      files.push(fullPath);
    }
  }
  return files;
}

async function parseRdFile(filePath: string): Promise<DictionaryData> {
  const content = await readFile(filePath, "utf-8");
  const label = basename(filePath, ".rd");
  const ast = new Parser().parse(content);
  return ast_to_data(ast.body, label);
}

async function loadSharedPaths(): Promise<string[]> {
  try {
    const filePath = join(homedir(), ".f4data", "dictionaries.json");
    const content = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(content) as {
      version: number;
      dictionaries: { label: string; path: string }[];
    };
    return parsed.dictionaries.map((d) => d.path).filter(Boolean);
  } catch {
    return [];
  }
}

export async function loadDictionaries(paths: string[]): Promise<LoadedDictionary[]> {
  const sharedPaths = await loadSharedPaths();
  const allPaths = [...new Set([...sharedPaths, ...paths])];
  const result: LoadedDictionary[] = [];

  for (const p of allPaths) {
    const info = await stat(p).catch(() => null);
    if (!info) continue;

    if (info.isDirectory()) {
      const rdFiles = await findRdFiles(p);
      for (const filePath of rdFiles) {
        const data = await parseRdFile(filePath);
        result.push({ label: data.name, filePath, data });
      }
    } else if (info.isFile() && extname(p) === ".rd") {
      const data = await parseRdFile(p);
      result.push({ label: data.name, filePath: p, data });
    }
  }

  return result;
}