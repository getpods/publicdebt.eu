import {
  readFile,
  readdir
} from "node:fs/promises";

import {
  resolve,
  dirname,
  extname
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


const countriesDir =
  resolve(
    ROOT,
    "data/processed/countries"
  );


/* ---------------------------------------------------------
   FORMAT
--------------------------------------------------------- */

const integerFormatter =
  new Intl.NumberFormat(
    "cs-CZ",
    {
      maximumFractionDigits: 0
    }
  );


const decimalFormatter =
  new Intl.NumberFormat(
    "cs-CZ",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }
  );


function formatInteger(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return integerFormatter.format(
    Math.round(number)
  );
}


function formatDecimal(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return decimalFormatter.format(
    number
  );
}


function formatClock(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  if (number < 0) {
    return `−${formatInteger(
      Math.abs(number)
    )}`;
  }

  return formatInteger(
    number
  );
}


function pad(value, length) {
  return String(value)
    .padEnd(
      length,
      " "
    );
}


function padStart(value, length) {
  return String(value)
    .padStart(
      length,
      " "
    );
}


/* ---------------------------------------------------------
   LOAD
--------------------------------------------------------- */

const files =
  (
    await readdir(
      countriesDir
    )
  )
    .filter(
      fileName =>
        extname(fileName) ===
        ".json"
    )
    .sort();


if (
  files.length !== 27
) {
  throw new Error(
    `Expected 27 country files, found ${files.length}`
  );
}


/* ---------------------------------------------------------
   AUDIT
--------------------------------------------------------- */

const rows =
  [];


for (
  const fileName of files
) {
  const file =
    resolve(
      countriesDir,
      fileName
    );


  const data =
    JSON.parse(
      await readFile(
        file,
        "utf8"
      )
    );


  const code =
    data?.country?.code ??
    "??";


  const name =
    data?.country?.name_cs ??
    data?.country?.name ??
    "?";


  const currency =
    data?.country?.currency
      ?.label ??
    data?.country?.currency
      ?.code ??
    "?";


  const currencyCode =
    data?.country?.currency
      ?.code ??
    "?";


  const latestPeriod =
    data?.latest?.period ??
    "?";


  const nationalMillion =
    Number(
      data?.latest?.debt
        ?.national_currency
    );


  const nationalBillion =
    Number.isFinite(
      nationalMillion
    )
      ? nationalMillion /
        1000
      : NaN;


  const percentGdp =
    Number(
      data?.latest?.debt
        ?.percent_gdp
    );


  const clock =
    data?.debt_clock;


  const clockRate =
    Number(
      clock?.amount_per_second
    );


  let trend =
    "?";


  if (
    Number.isFinite(
      clockRate
    )
  ) {
    if (clockRate > 0) {
      trend =
        "ROSTE";
    } else if (
      clockRate < 0
    ) {
      trend =
        "KLESA";
    } else {
      trend =
        "STEJNE";
    }
  }


  rows.push({
    code,
    name,
    currency,
    currencyCode,
    latestPeriod,
    nationalBillion,
    percentGdp,

    clockFrom:
      clock?.period_from ??
      "?",

    clockTo:
      clock?.period_to ??
      "?",

    clockRate,

    trend,

    sourceUnit:
      clock?.source_unit ??
      "?"
  });
}


/* ---------------------------------------------------------
   OUTPUT
--------------------------------------------------------- */

console.log(
  "\n=== PUBLICDEBT.EU — COUNTRY AUDIT ===\n"
);


console.log(
  [
    pad("ST", 3),
    pad("ZEMĚ", 15),
    pad("MĚNA", 6),
    padStart("DLUH mld.", 16),
    padStart("% HDP", 8),
    pad("SMĚR", 7),
    padStart("ZA SEKUNDU", 16),
    pad("OBDOBÍ", 19),
    "ZDROJ"
  ].join("  ")
);


console.log(
  "-".repeat(
    118
  )
);


for (
  const row of rows
) {
  const debt =
    `${formatDecimal(
      row.nationalBillion
    )} ${row.currency}`;


  const clock =
    `${formatClock(
      row.clockRate
    )} ${row.currency}/s`;


  const periods =
    `${row.clockFrom} → ${row.clockTo}`;


  console.log(
    [
      pad(row.code, 3),

      pad(
        row.name.slice(
          0,
          15
        ),
        15
      ),

      pad(
        row.currencyCode,
        6
      ),

      padStart(
        debt,
        16
      ),

      padStart(
        formatDecimal(
          row.percentGdp
        ),
        8
      ),

      pad(
        row.trend,
        7
      ),

      padStart(
        clock,
        16
      ),

      pad(
        periods,
        19
      ),

      row.sourceUnit
    ].join("  ")
  );
}


/* ---------------------------------------------------------
   SUMMARY
--------------------------------------------------------- */

const growing =
  rows.filter(
    row =>
      row.clockRate > 0
  );


const falling =
  rows.filter(
    row =>
      row.clockRate < 0
  );


const unchanged =
  rows.filter(
    row =>
      row.clockRate === 0
  );


const invalidClock =
  rows.filter(
    row =>
      !Number.isFinite(
        row.clockRate
      )
  );


console.log(
  "\n=== SUMMARY ===\n"
);


console.log(
  `Dluh roste:      ${growing.length}`
);

console.log(
  `Dluh klesá:      ${falling.length}`
);

console.log(
  `Beze změny:      ${unchanged.length}`
);

console.log(
  `Chybný clock:    ${invalidClock.length}`
);


if (
  invalidClock.length
) {
  console.log(
    "\nCountries with invalid clock:"
  );

  for (
    const row of invalidClock
  ) {
    console.log(
      `- ${row.code} ${row.name}`
    );
  }

  process.exitCode =
    1;
}


console.log(
  "\n✓ Audit completed.\n"
);