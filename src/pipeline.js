import { cp } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { replaceDirectory, runScript } from "./lib/transaction.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mode = process.argv[2];
const fetchSteps = ["src/fetch/eurostat.js", "src/fetch/population.js", "src/fetch/ecb-interest-rates.js"];
const transformSteps = ["src/transform/debt.js", "src/transform/population.js", "src/transform/interest-rates.js", "src/transform/eu.js", "src/transform/overview.js"];
const validateSteps = ["src/validate/overview.js", "src/validate/countries.js", "src/validate/interest-rates.js", "src/validate/consistency.js"];
const steps = {
  fetch: fetchSteps,
  transform: [...transformSteps, ...validateSteps],
  update: [...fetchSteps, ...transformSteps, ...validateSteps],
  "fetch:eurostat": [fetchSteps[0]],
  "fetch:population": [fetchSteps[1]],
  "fetch:interest-rates": [fetchSteps[2]]
}[mode];
if (!steps) throw new Error(`Unknown pipeline mode: ${mode}`);

await replaceDirectory(root, join(root, "data"), "data", async staged => {
  await cp(join(root, "data"), staged, { recursive: true });
  for (const step of steps) {
    await runScript(root, step, { PUBLICDEBT_DATA_DIR: staged });
  }
});
console.log(`✓ ${mode}: data published after all steps completed.`);
