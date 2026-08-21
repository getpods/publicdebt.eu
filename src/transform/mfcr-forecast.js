import {
  readSheet
} from "read-excel-file/node";

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


const ROOT =
  resolve(
    dirname(
      fileURLToPath(
        import.meta.url
      )
    ),
    "../.."
  );


const input =
  resolve(
    ROOT,
    "data/raw/MFCR-Makroekonomicka-predikce-duben-2026.xlsx"
  );


const outputDir =
  resolve(
    ROOT,
    "data/processed"
  );


const output =
  resolve(
    outputDir,
    "mfcr-forecast.json"
  );


const rows =
  await readSheet(
    input,
    "T 1.3.1"
  );


// Roky jsou v řádku 7, tedy index 6.
// Sloupce 5–14 odpovídají rokům 2017–2026.

const yearRow =
  rows[6];


if (
  !yearRow
) {
  throw new Error(
    "Forecast year row was not found."
  );
}


const years =
  yearRow
    .map(
      (
        value,
        index
      ) => ({
        year:
          Number(
            value
          ),

        column:
          index
      })
    )
    .filter(
      item =>
        Number.isInteger(
          item.year
        ) &&
        item.year >=
          2000 &&
        item.year <=
          2100
    );


if (
  !years.length
) {
  throw new Error(
    "No forecast years were found."
  );
}


function findRow(
  label
) {
  const index =
    rows.findIndex(
      row =>
        row[0] ===
        label
    );


  if (
    index ===
    -1
  ) {
    throw new Error(
      `Row '${label}' was not found.`
    );
  }


  return rows[
    index
  ];
}


function extractSeries(
  row
) {
  return years.map(
    ({
      year,
      column
    }) => ({
      year,

      value:
        typeof row[
          column
        ] ===
        "number"
          ? row[
              column
            ]
          : null
    })
  );
}


const balanceRow =
  findRow(
    "Saldo sektoru vládních institucí"
  );


const debtRow =
  findRow(
    "Dluh sektoru vládních institucí"
  );


const balance =
  extractSeries(
    balanceRow
  );


const debt =
  extractSeries(
    debtRow
  );


const forecastYear =
  years
    .filter(
      item =>
        item.year >=
        2026
    )
    .at(
      -1
    )
    ?.year;


if (
  !forecastYear
) {
  throw new Error(
    "No forecast year was found."
  );
}


const historyBalance =
  balance.filter(
    item =>
      item.year <
      forecastYear
  );


const historyDebt =
  debt.filter(
    item =>
      item.year <
      forecastYear
  );


const result = {
  country: {
    code:
      "CZ",

    name:
      "Czechia"
  },

  dataset: {
    id:
      "MFCR-Makroekonomicka-predikce-duben-2026",

    title:
      "Makroekonomická predikce České republiky — duben 2026",

    source:
      "Ministerstvo financí České republiky",

    source_file:
      "MFCR-Makroekonomicka-predikce-duben-2026.xlsx",

    table:
      "T 1.3.1",

    unit:
      "% HDP",

    retrieved_at:
      new Date()
        .toISOString()
  },

  forecast: {
    year:
      forecastYear,

    balance_percent_gdp:
      balance.find(
        item =>
          item.year ===
          forecastYear
      )
        ?.value ??
      null,

    debt_percent_gdp:
      debt.find(
        item =>
          item.year ===
          forecastYear
      )
        ?.value ??
      null
  },

  history: {
    balance_percent_gdp:
      historyBalance,

    debt_percent_gdp:
      historyDebt
  }
};


await mkdir(
  outputDir,
  {
    recursive:
      true
  }
);


await writeFile(
  output,

  JSON.stringify(
    result,
    null,
    2
  ) +
  "\n",

  "utf8"
);


console.log(
  "\n=== MF ČR — FORECAST DUBEN 2026 ===\n"
);


console.log(
  `Years:       ${years
    .map(
      item =>
        item.year
    )
    .join(
      ", "
    )}`
);


console.log(
  `Forecast:    ${forecastYear}`
);


console.log(
  `Balance:     ${result.forecast.balance_percent_gdp}% HDP`
);


console.log(
  `Debt:        ${result.forecast.debt_percent_gdp}% HDP`
);


console.log(
  `\nSaved: ${output}`
);