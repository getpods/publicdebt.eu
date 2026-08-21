import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const rawDir = resolve(ROOT, "data/raw");
const output = resolve(rawDir, "SDDS-Plus_GGD.xlsx");

const url =
  "https://www.mfcr.cz/assets/attachments/SDDS-Plus_GGD.xlsx";

await mkdir(rawDir, { recursive: true });

console.log("Fetching MF ČR GGD data...");
console.log(url);

const response = await fetch(url, {
  headers: {
    "User-Agent": "PublicDebt.eu/0.2 data importer"
  }
});

if (!response.ok) {
  throw new Error(
    `MF ČR returned ${response.status} ${response.statusText}`
  );
}

const buffer = Buffer.from(await response.arrayBuffer());

await writeFile(output, buffer);

console.log(`Saved ${output}`);
console.log(`Downloaded ${(buffer.length / 1024).toFixed(1)} kB`);
