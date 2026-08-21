import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const DATASET = "gov_10q_ggdebt";

const EU27 = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "EL",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE"
];

const outDir = resolve(
  ROOT,
  "data/raw"
);

await mkdir(
  outDir,
  {
    recursive: true
  }
);


/* ---------------------------------------------------------
   FETCH HELPER
--------------------------------------------------------- */

async function fetchCountry(countryCode) {
  const url =
    `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${DATASET}` +
    `?lang=en&geo=${encodeURIComponent(countryCode)}`;

  console.log(
    `Fetching ${countryCode}...`
  );

  const response = await fetch(
    url,
    {
      headers: {
        "User-Agent":
          "PublicDebt.eu/0.2 data importer"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `Eurostat API ${countryCode}: ${response.status} ${response.statusText}`
    );
  }

  const json =
    await response.json();

  if (
    !Array.isArray(json.id) ||
    !Array.isArray(json.size) ||
    !json.dimension
  ) {
    throw new Error(
      `Eurostat response for ${countryCode} is not a valid JSON-stat dataset.`
    );
  }

  return {
    url,
    json
  };
}


/* ---------------------------------------------------------
   DOWNLOAD EU27
--------------------------------------------------------- */

console.log(
  "\n=== FETCH EUROSTAT EU27 DEBT ===\n"
);

for (const countryCode of EU27) {
  const {
    url,
    json
  } = await fetchCountry(
    countryCode
  );

  const outFile =
    resolve(
      outDir,
      `${DATASET}-${countryCode}.json`
    );

  await writeFile(
    outFile,
    JSON.stringify(
      json,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    `  ${countryCode}: ${json.size.join(" × ")}`
  );

  console.log(
    `  Saved ${outFile}`
  );

  /*
   * Krátká pauza mezi požadavky.
   * Není nezbytná, ale je ohleduplná vůči API.
   */
  await new Promise(
    resolvePromise =>
      setTimeout(
        resolvePromise,
        100
      )
  );
}


console.log(
  `\n✓ Downloaded ${EU27.length} countries.\n`
);