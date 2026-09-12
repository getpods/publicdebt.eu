import {
  readFile,
  mkdir,
  writeFile
} from "node:fs/promises";
import {
  dirname,
  resolve
} from "node:path";
import {
  fileURLToPath
} from "node:url";

const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const rawDir = resolve(
  ROOT,
  "data/raw"
);

const processedDir = resolve(
  ROOT,
  "data/processed"
);

const outputFile = resolve(
  processedDir,
  "interest-rates.json"
);

const ECB_CODES = [
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
  "GR",
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

/*
 * PublicDebt.eu otherwise follows Eurostat country codes.
 * Eurostat uses EL for Greece, while ECB IRS uses GR.
 */
function publicDebtCode(ecbCode) {
  return ecbCode === "GR"
    ? "EL"
    : ecbCode;
}

/* ---------------------------------------------------------
   CSV PARSER
--------------------------------------------------------- */

/*
 * Small RFC-4180-style parser.
 *
 * We intentionally do not split rows on commas because ECB
 * metadata contains quoted fields with commas.
 */
function parseCsv(input) {
  const rows = [];

  let row = [];
  let field = "";
  let quoted = false;

  for (
    let index = 0;
    index < input.length;
    index += 1
  ) {
    const char = input[index];

    if (quoted) {
      if (char === '"') {
        if (
          input[index + 1] === '"'
        ) {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }

      continue;
    }

    if (char === '"') {
      quoted = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(
        field.endsWith("\r")
          ? field.slice(0, -1)
          : field
      );

      rows.push(row);

      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (
    field.length > 0 ||
    row.length > 0
  ) {
    row.push(
      field.endsWith("\r")
        ? field.slice(0, -1)
        : field
    );

    rows.push(row);
  }

  return rows;
}

/* ---------------------------------------------------------
   TRANSFORM ONE COUNTRY
--------------------------------------------------------- */

async function transformCountry(
  ecbCode
) {
  const file = resolve(
    rawDir,
    `ecb-irs-${ecbCode}.csv`
  );

  const csv = await readFile(
    file,
    "utf8"
  );

  const rows = parseCsv(csv);

  if (rows.length < 2) {
    throw new Error(
      `ECB CSV contains no data: ${ecbCode}`
    );
  }

  const header = rows[0];

  const index = new Map(
    header.map(
      (name, columnIndex) => [
        name,
        columnIndex
      ]
    )
  );

  const requiredColumns = [
    "KEY",
    "REF_AREA",
    "CURRENCY_TRANS",
    "TIME_PERIOD",
    "OBS_VALUE"
  ];

  for (
    const column
    of requiredColumns
  ) {
    if (!index.has(column)) {
      throw new Error(
        `ECB ${ecbCode}: missing CSV column ${column}`
      );
    }
  }

  const observations =
    rows
      .slice(1)
      .filter(
        row =>
          row.length > 1
      )
      .map(
        row => {
          const period =
            row[
              index.get(
                "TIME_PERIOD"
              )
            ];

          const value =
            Number(
              row[
                index.get(
                  "OBS_VALUE"
                )
              ]
            );

          if (
            !/^\d{4}-\d{2}$/.test(
              period
            )
          ) {
            return null;
          }

          if (
            !Number.isFinite(value)
          ) {
            return null;
          }

          return {
            period,
            value
          };
        }
      )
      .filter(Boolean)
      .sort(
        (a, b) =>
          a.period.localeCompare(
            b.period
          )
      );

  if (
    observations.length === 0
  ) {
    throw new Error(
      `ECB ${ecbCode}: no valid observations`
    );
  }

  const firstRow =
    rows
      .slice(1)
      .find(
        row =>
          row.length > 1
      );

  const series =
    firstRow[
      index.get("KEY")
    ];

  const refArea =
    firstRow[
      index.get("REF_AREA")
    ];

  const currency =
    firstRow[
      index.get("CURRENCY_TRANS")
    ];

  if (
    refArea !== ecbCode
  ) {
    throw new Error(
      `ECB ${ecbCode}: REF_AREA is ${refArea}`
    );
  }

  if (
    !series ||
    !series.startsWith(
      `IRS.M.${ecbCode}.`
    )
  ) {
    throw new Error(
      `ECB ${ecbCode}: unexpected series ${series}`
    );
  }

  const latest =
    observations[
      observations.length - 1
    ];

  return {
    code:
      publicDebtCode(
        ecbCode
      ),

    ecb_code:
      ecbCode,

    series,

    currency,

    latest: {
      period:
        latest.period,
      percent:
        latest.value
    },

    first_period:
      observations[0].period,

    history:
      observations
  };
}

/* ---------------------------------------------------------
   EU27
--------------------------------------------------------- */

console.log(
  "\n=== TRANSFORM ECB EU27 10Y GOVERNMENT BOND YIELDS ===\n"
);

const countries = [];

for (
  const ecbCode
  of ECB_CODES
) {
  const country =
    await transformCountry(
      ecbCode
    );

  countries.push(
    country
  );

  console.log(
    `${country.code}: ` +
    `${country.latest.percent}% ` +
    `(${country.latest.period}) · ` +
    `${country.history.length} observations · ` +
    `from ${country.first_period}`
  );
}

if (
  countries.length !== 27
) {
  throw new Error(
    `Expected 27 ECB countries, got ${countries.length}`
  );
}

const codes =
  new Set(
    countries.map(
      country =>
        country.code
    )
  );

if (
  codes.size !== 27
) {
  throw new Error(
    "Duplicate country codes in ECB transformed data."
  );
}

const output = {
  source: "ECB",
  dataset: "IRS",
  metric:
    "long_term_interest_rate",

  description:
    "Long-term interest rate for convergence purposes, 10-year government bond yield.",

  unit:
    "percent_per_annum",

  frequency:
    "monthly",

  count:
    countries.length,

  countries
};

await mkdir(
  processedDir,
  {
    recursive: true
  }
);

await writeFile(
  outputFile,
  JSON.stringify(
    output,
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(
  `\nCountries: ${countries.length}`
);

console.log(
  `Saved ${outputFile}`
);

console.log(
  "\n✓ ECB interest rates transformed.\n"
);
