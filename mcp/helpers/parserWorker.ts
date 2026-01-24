// @ts-check

import { createReadStream } from "fs";
import { createInterface } from "readline";
import { parentPort, workerData } from "worker_threads";
import { Parser } from "../helpers/Parser";
import { ast_to_data } from "../helpers/ast_to_data";

(async () => {
  const rl = createInterface({
    input: createReadStream(workerData.filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  const parser = new Parser();
  const lines = [];
  for await (const line of rl) {
    lines.push(line);
  }
  const textFile = lines.join("\n");
  const ast = parser.parse(textFile);
  const listTabsInfo = ast_to_data(ast.body, workerData.label);

  parentPort?.postMessage({ listTabsInfo });
})();
