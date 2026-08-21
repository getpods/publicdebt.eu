import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const rawDir = resolve(ROOT, "data/raw");

const output = resolve(
  rawDir,
  "MFCR-Makroekonomicka-predikce-duben-2026.xlsx"
);

const url =
  "https://www.mfcr.cz/assets/attachments/" +
  "2026-04-09_Makroekonomicka-predikce-duben-2026-Tabulky-a-grafy.xlsx";

await mkdir(rawDir, {
  recursive: true
});

console.log("Fetching MF ČR April 2026 forecast tables...");
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

const buffer = Buffer.from(
  await response.arrayBuffer()
);

await writeFile(output, buffer);

console.log(`Saved ${output}`);
console.log(
  `Downloaded ${(buffer.length / 1024).toFixed(1)} kB`
);