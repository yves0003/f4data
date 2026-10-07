import { writeFile, mkdir } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export async function syncSharedFile(list: listDico): Promise<void> {
  try {
    const dir = join(homedir(), ".f4data");
    await mkdir(dir, { recursive: true });
    const active = (list || [])
      .filter((d) => d.link && !d.disable)
      .map((d) => ({ label: d.name || "", path: d.link! }));
    await writeFile(
      join(dir, "dictionaries.json"),
      JSON.stringify({ version: 1, dictionaries: active }, null, 2),
      "utf-8",
    );
  } catch {
    // silent — don't break the extension if sync fails
  }
}
