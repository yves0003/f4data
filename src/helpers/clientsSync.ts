import * as vscode from "vscode";
import { readFile, writeFile, access } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// ── Continue : config.json ────────────────────────────────────────────────────
async function syncContinueJson(serverPath: string): Promise<void> {
  const configPath = join(homedir(), ".continue", "config.json");
  if (!(await fileExists(configPath))) {
    return;
  }
  const raw = await readFile(configPath, "utf-8");
  const config = JSON.parse(raw) as { mcpServers?: { name: string; command: string; args: string[] }[] };
  if (!config.mcpServers) {
    config.mcpServers = [];
  }
  const idx = config.mcpServers.findIndex((s) => s.name === "f4data");
  const entry = { name: "f4data", command: "node", args: [serverPath] };
  if (idx >= 0) {
    config.mcpServers[idx] = entry;
  } else {
    config.mcpServers.push(entry);
  }
  await writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
}

// ── Continue : config.yaml ────────────────────────────────────────────────────
async function syncContinueYaml(serverPath: string): Promise<void> {
  const configPath = join(homedir(), ".continue", "config.yaml");
  if (!(await fileExists(configPath))) {
    return;
  }
  let content = await readFile(configPath, "utf-8");
  const alreadyConfigured =
    content.includes("name: f4data") ||
    content.includes('name: "f4data"') ||
    content.includes("name: 'f4data'");
  if (alreadyConfigured) {
    return;
  }
  const entry = `  - name: f4data\n    command: node\n    args:\n      - "${serverPath}"`;
  if (content.includes("mcpServers:")) {
    content = content.replace("mcpServers:", `mcpServers:\n${entry}`);
  } else {
    content = content.trimEnd() + `\n\nmcpServers:\n${entry}\n`;
  }
  await writeFile(configPath, content, "utf-8");
}

// ── VS Code Copilot : user settings ──────────────────────────────────────────
async function syncCopilot(serverPath: string): Promise<void> {
  const mcpConfig = vscode.workspace.getConfiguration("mcp");
  const servers = mcpConfig.get<Record<string, unknown>>("servers") ?? {};
  if (servers["f4data"]) {
    return;
  }
  servers["f4data"] = { type: "stdio", command: "node", args: [serverPath] };
  await mcpConfig.update("servers", servers, vscode.ConfigurationTarget.Global);
}

// ── Entry point ───────────────────────────────────────────────────────────────
export async function syncClientsConfig(extensionPath: string): Promise<void> {
  const serverPath = join(
    extensionPath,
    "packages",
    "mcp-server",
    "dist",
    "index.js"
  );
  await Promise.allSettled([
    syncContinueJson(serverPath).catch(() => {}),
    syncContinueYaml(serverPath).catch(() => {}),
    syncCopilot(serverPath).catch(() => {}),
  ]);
}