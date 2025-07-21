import path from "path";
import { window } from "vscode";
import { Worker } from "worker_threads";
import { ast_to_data } from "../helpers/ast_to_data";

export function parseFileInWorker(
  filePath: string | undefined,
  label: string
): Promise<ReturnType<typeof ast_to_data>> {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      window.showErrorMessage(`Path is undefined`);
    }

    const worker = new Worker(path.join(__dirname, "parserWorker.js"), {
      workerData: { filePath, label },
    });

    worker.on("message", ({ listTabsInfo }) => {
      resolve(listTabsInfo);
    });

    worker.on("error", (err) => {
      window.showErrorMessage(`Parsing failed: ${err.message}`);
      reject(err);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
