import { fetchSource } from "../lib/fetch-source.js";
import {
  mkdir,
  writeFile
} from "node:fs/promises";

import {
  resolve,
  dirname
} from "node:path";

import {
  fileURLToPath
} from "node:url";


const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const DATASET =
  "demo_gind";


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


const outDir =
  resolve(
    process.env.PUBLICDEBT_DATA_DIR ?? resolve(ROOT, "data"),
    "raw"
  );


await mkdir(
  outDir,
  {
    recursive: true
  }
);


/* ---------------------------------------------------------
   FETCH
--------------------------------------------------------- */

async function fetchCountry(
  countryCode
) {
  const url =
    `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${DATASET}` +
    `?lang=en&geo=${encodeURIComponent(countryCode)}`;

  console.log(
    `Fetching ${countryCode}...`
  );

  const json = JSON.parse(await fetchSource(url));

  if (
    !Array.isArray(json.id) ||
    !Array.isArray(json.size) ||
    !json.dimension
  ) {
    throw new Error(
      `Eurostat population response for ${countryCode} is not valid JSON-stat.`
    );
  }


  return json;
}


/* ---------------------------------------------------------
   DOWNLOAD
--------------------------------------------------------- */

console.log(
  "\n=== FETCH EUROSTAT EU27 POPULATION ===\n"
);


for (const countryCode of EU27) {
  const json =
    await fetchCountry(
      countryCode
    );


  const outFile =
    resolve(
      outDir,
      `population-${countryCode}.json`
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


  await new Promise(
    resolvePromise =>
      setTimeout(
        resolvePromise,
        100
      )
  );
}


console.log(
  `\n✓ Downloaded population data for ${EU27.length} countries.\n`
);