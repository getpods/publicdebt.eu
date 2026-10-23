import { rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { replaceDirectory, runScript } from "./lib/transaction.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await replaceDirectory(root, join(root, "dist"), "build", async staged => {
  const env = {
    PUBLICDEBT_DIST_DIR: staged,
    PUBLICDEBT_SITEMAP_STATE: join(root, ".publicdebt-tmp", "sitemap-state.json"),
    PUBLICDEBT_SITEMAP_NEXT_STATE: join(dirname(staged), "sitemap-state.json")
  };
  await runScript(root, "src/build-site.js", env);
  await runScript(root, "src/validate/build.js", env);
  await runScript(root, "src/validate/links.js", env);
}, async work => {
  // Cache only successfully published production snapshots; stage builds do not change it.
  try {
    await rename(join(work, "sitemap-state.json"), join(root, ".publicdebt-tmp", "sitemap-state.json"));
  } catch (error) {
    if (error.code !== "ENOENT") console.warn(`Sitemap history could not be saved: ${error.message}`);
  }
});
console.log("✓ Validated build published to dist.");
