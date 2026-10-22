import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDataConsistency } from "../lib/data-consistency.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
await validateDataConsistency(resolve(process.env.PUBLICDEBT_DATA_DIR ?? resolve(root, "data"), "processed"));
console.log("✓ EU, overview and country datasets are consistent.");
