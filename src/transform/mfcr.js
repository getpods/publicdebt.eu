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
    "data/raw/SDDS-Plus_GGD.xlsx"
  );


const outputDir =
  resolve(
    ROOT,
    "data/processed"
  );


const output =
  resolve(
    outputDir,
    "mfcr-ggd.json"
  );


const rows =
  await readSheet(
    input,
    "GGD"
  );


// List GGD obsahuje prázdný první sloupec A.
//
// Data tedy vypadají:
//
// [null, rok, čtvrtletí, celkový dluh, ...]
//
// Data začínají na řádku 6.
// slice(4) je v pořádku, protože řádek 5
// se následně přeskočí jako neplatný datový řádek.

const dataRows =
  rows.slice(
    4
  );


let currentYear =
  null;


const history =
  [];


const quarterMap = {
  "I.": 1,
  "II.": 2,
  "III.": 3,
  "IV.": 4
};


for (
  const row of
  dataRows
) {
  const year =
    row[1];


  const quarter =
    row[2];


  const debt =
    row[3];


  // Prázdné řádky ignorujeme.

  if (
    quarter === null ||
    quarter === undefined ||
    debt === null ||
    debt === undefined
  ) {
    continue;
  }


  // Rok je uveden pouze u prvního čtvrtletí.

  if (
    typeof year ===
    "number"
  ) {
    currentYear =
      year;
  }


  if (
    !currentYear
  ) {
    continue;
  }


  const quarterNumber =
    quarterMap[
      quarter
    ];


  if (
    !quarterNumber
  ) {
    continue;
  }


  const debtNumber =
    Number(
      debt
    );


  if (
    !Number.isFinite(
      debtNumber
    )
  ) {
    continue;
  }


  history.push({
    period:
      `${currentYear}-Q${quarterNumber}`,

    year:
      currentYear,

    quarter:
      quarterNumber,

    debt_czk_billion:
      debtNumber,

    debt_czk:
      debtNumber *
      1_000_000_000
  });
}


if (
  history.length ===
  0
) {
  throw new Error(
    "No GGD observations were found."
  );
}


history.sort(
  (
    a,
    b
  ) =>
    a.period.localeCompare(
      b.period
    )
);


const latest =
  history.at(
    -1
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
      "SDDS-Plus_GGD",

    title:
      "Hrubý dluh sektoru vládních institucí - čtvrtletní",

    source:
      "Ministerstvo financí České republiky",

    unit:
      "mld. Kč",

    source_file:
      "SDDS-Plus_GGD.xlsx",

    retrieved_at:
      new Date()
        .toISOString()
  },

  latest,

  history
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
  "\n=== MF ČR GGD ===\n"
);


console.log(
  `Observations: ${history.length}`
);


console.log(
  `First:        ${history[0].period}`
);


console.log(
  `Latest:       ${latest.period}`
);


console.log(
  `Latest debt:  ${latest.debt_czk_billion.toLocaleString(
    "cs-CZ"
  )} mld. Kč`
);


console.log(
  `\nSaved: ${output}`
);