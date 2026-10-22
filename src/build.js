import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { replaceDirectory, runScript } from "./lib/transaction.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await replaceDirectory(root, join(root, "dist"), "build", async staged => {
  const env = { PUBLICDEBT_DIST_DIR: staged };
  await runScript(root, "src/build-site.js", env);
  await runScript(root, "src/validate/build.js", env);
  await runScript(root, "src/validate/links.js", env);
});
console.log("✓ Validated build published to dist.");
