import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const outDir = resolve(
  ROOT,
  "data/raw"
);

const SERIES = {
  AT: "M.AT.L.L40.CI.0000.EUR.N.Z",
  BE: "M.BE.L.L40.CI.0000.EUR.N.Z",
  BG: "M.BG.L.L40.CI.0000.EUR.N.Z",
  HR: "M.HR.L.L40.CI.0000.EUR.N.Z",
  CY: "M.CY.L.L40.CI.0000.EUR.N.Z",
  CZ: "M.CZ.L.L40.CI.0000.CZK.N.Z",
  DK: "M.DK.L.L40.CI.0000.DKK.N.Z",
  EE: "M.EE.L.L40.CI.0000.EUR.N.Z",
  FI: "M.FI.L.L40.CI.0000.EUR.N.Z",
  FR: "M.FR.L.L40.CI.0000.EUR.N.Z",
  DE: "M.DE.L.L40.CI.0000.EUR.N.Z",
  GR: "M.GR.L.L40.CI.0000.EUR.N.Z",
  HU: "M.HU.L.L40.CI.0000.HUF.N.Z",
  IE: "M.IE.L.L40.CI.0000.EUR.N.Z",
  IT: "M.IT.L.L40.CI.0000.EUR.N.Z",
  LV: "M.LV.L.L40.CI.0000.EUR.N.Z",
  LT: "M.LT.L.L40.CI.0000.EUR.N.Z",
  LU: "M.LU.L.L40.CI.0000.EUR.N.Z",
  MT: "M.MT.L.L40.CI.0000.EUR.N.Z",
  NL: "M.NL.L.L40.CI.0000.EUR.N.Z",
  PL: "M.PL.L.L40.CI.0000.PLN.N.Z",
  PT: "M.PT.L.L40.CI.0000.EUR.N.Z",
  RO: "M.RO.L.L40.CI.0000.RON.N.Z",
  SK: "M.SK.L.L40.CI.0000.EUR.N.Z",
  SI: "M.SI.L.L40.CI.0000.EUR.N.Z",
  ES: "M.ES.L.L40.CI.0000.EUR.N.Z",
  SE: "M.SE.L.L40.CI.0000.SEK.N.Z"
};

await mkdir(
  outDir,
  {
    recursive: true
  }
);

async function fetchCountry(
  countryCode,
  seriesKey
) {
  const url =
    `https://data-api.ecb.europa.eu/service/data/IRS/${seriesKey}` +
    "?format=csvdata";

  console.log(
    `Fetching ${countryCode}...`
  );

  const response = await fetch(
    url,
    {
      headers: {
        "User-Agent":
          "PublicDebt.eu/0.2 data importer",
        Accept: "text/csv"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `ECB API ${countryCode}: ${response.status} ${response.statusText}`
    );
  }

  const csv =
    await response.text();

  if (
    !csv ||
    !csv.includes("TIME_PERIOD") ||
    !csv.includes("OBS_VALUE")
  ) {
    throw new Error(
      `ECB response for ${countryCode} does not look like expected CSV data.`
    );
  }

  return {
    url,
    csv
  };
}

console.log(
  "\n=== FETCH ECB EU27 10Y GOVERNMENT BOND YIELDS ===\n"
);

for (
  const [countryCode, seriesKey]
  of Object.entries(SERIES)
) {
  const {
    url,
    csv
  } = await fetchCountry(
    countryCode,
    seriesKey
  );

  const outFile =
    resolve(
      outDir,
      `ecb-irs-${countryCode}.csv`
    );

  await writeFile(
    outFile,
    csv,
    "utf8"
  );

  const rows =
    csv
      .trim()
      .split(/\r?\n/)
      .length - 1;

  console.log(
    `  ${countryCode}: ${rows} observations`
  );
  console.log(
    `  Series: IRS.${seriesKey}`
  );
  console.log(
    `  Saved ${outFile}`
  );
  console.log(
    `  ${url}`
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
  `\n✓ Downloaded ${Object.keys(SERIES).length} ECB series.\n`
);
