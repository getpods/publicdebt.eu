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
  dirname(
    fileURLToPath(
      import.meta.url
    )
  ),
  "../.."
);

const DATASET =
  "gov_10q_ggdebt";


const rawDir =
  resolve(
    ROOT,
    "data/raw"
  );

const outDir =
  resolve(
    ROOT,
    "data/processed"
  );

const countriesDir =
  resolve(
    outDir,
    "countries"
  );

const countriesFile =
  resolve(
    outDir,
    "countries.json"
  );

const czFile =
  resolve(
    outDir,
    "cz.json"
  );


/* ---------------------------------------------------------
   CONSTANTS
--------------------------------------------------------- */

/*
 * Průměrný gregoriánský rok.
 *
 * Debt clock je orientační přepočet meziroční
 * změny stejného kvartálu na jednu sekundu.
 */
const SECONDS_PER_YEAR =
  365.2425 *
  24 *
  60 *
  60;


/*
 * Země eurozóny k roku 2026.
 *
 * Pro jejich debt clock používáme MIO_EUR.
 *
 * U ostatních zemí používáme MIO_NAC,
 * tedy národní měnu.
 */
const EURO_AREA_CODES =
  new Set([
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "EE",
    "FI",
    "FR",
    "DE",
    "EL",
    "IE",
    "IT",
    "LV",
    "LT",
    "LU",
    "MT",
    "NL",
    "PT",
    "SK",
    "SI",
    "ES"
  ]);


/*
 * Metadata měn pro UI.
 *
 * value v Eurostatu je v milionech měny.
 */
const CURRENCIES = {
  AT: {
    code: "EUR",
    label: "€"
  },

  BE: {
    code: "EUR",
    label: "€"
  },

  BG: {
    code: "EUR",
    label: "€"
  },

  HR: {
    code: "EUR",
    label: "€"
  },

  CY: {
    code: "EUR",
    label: "€"
  },

  CZ: {
    code: "CZK",
    label: "Kč"
  },

  DK: {
    code: "DKK",
    label: "DKK"
  },

  EE: {
    code: "EUR",
    label: "€"
  },

  FI: {
    code: "EUR",
    label: "€"
  },

  FR: {
    code: "EUR",
    label: "€"
  },

  DE: {
    code: "EUR",
    label: "€"
  },

  EL: {
    code: "EUR",
    label: "€"
  },

  HU: {
    code: "HUF",
    label: "HUF"
  },

  IE: {
    code: "EUR",
    label: "€"
  },

  IT: {
    code: "EUR",
    label: "€"
  },

  LV: {
    code: "EUR",
    label: "€"
  },

  LT: {
    code: "EUR",
    label: "€"
  },

  LU: {
    code: "EUR",
    label: "€"
  },

  MT: {
    code: "EUR",
    label: "€"
  },

  NL: {
    code: "EUR",
    label: "€"
  },

  PL: {
    code: "PLN",
    label: "PLN"
  },

  PT: {
    code: "EUR",
    label: "€"
  },

  RO: {
    code: "RON",
    label: "RON"
  },

  SK: {
    code: "EUR",
    label: "€"
  },

  SI: {
    code: "EUR",
    label: "€"
  },

  ES: {
    code: "EUR",
    label: "€"
  },

  SE: {
    code: "SEK",
    label: "SEK"
  }
};


/* ---------------------------------------------------------
   COUNTRIES
--------------------------------------------------------- */

const COUNTRIES = [
  {
    code: "AT",
    name: "Austria",
    name_cs: "Rakousko",
    slug: "rakousko",
    slug_en: "austria"
  },
  {
    code: "BE",
    name: "Belgium",
    name_cs: "Belgie",
    slug: "belgie",
    slug_en: "belgium"
  },
  {
    code: "BG",
    name: "Bulgaria",
    name_cs: "Bulharsko",
    slug: "bulharsko",
    slug_en: "bulgaria"
  },
  {
    code: "HR",
    name: "Croatia",
    name_cs: "Chorvatsko",
    slug: "chorvatsko",
    slug_en: "croatia"
  },
  {
    code: "CY",
    name: "Cyprus",
    name_cs: "Kypr",
    slug: "kypr",
    slug_en: "cyprus"
  },
  {
    code: "CZ",
    name: "Czechia",
    name_cs: "Česko",
    slug: "cesko",
    slug_en: "czechia"
  },
  {
    code: "DK",
    name: "Denmark",
    name_cs: "Dánsko",
    slug: "dansko",
    slug_en: "denmark"
  },
  {
    code: "EE",
    name: "Estonia",
    name_cs: "Estonsko",
    slug: "estonsko",
    slug_en: "estonia"
  },
  {
    code: "FI",
    name: "Finland",
    name_cs: "Finsko",
    slug: "finsko",
    slug_en: "finland"
  },
  {
    code: "FR",
    name: "France",
    name_cs: "Francie",
    slug: "francie",
    slug_en: "france"
  },
  {
    code: "DE",
    name: "Germany",
    name_cs: "Německo",
    slug: "nemecko",
    slug_en: "germany"
  },
  {
    code: "EL",
    name: "Greece",
    name_cs: "Řecko",
    slug: "recko",
    slug_en: "greece"
  },
  {
    code: "HU",
    name: "Hungary",
    name_cs: "Maďarsko",
    slug: "madarsko",
    slug_en: "hungary"
  },
  {
    code: "IE",
    name: "Ireland",
    name_cs: "Irsko",
    slug: "irsko",
    slug_en: "ireland"
  },
  {
    code: "IT",
    name: "Italy",
    name_cs: "Itálie",
    slug: "italie",
    slug_en: "italy"
  },
  {
    code: "LV",
    name: "Latvia",
    name_cs: "Lotyšsko",
    slug: "lotyssko",
    slug_en: "latvia"
  },
  {
    code: "LT",
    name: "Lithuania",
    name_cs: "Litva",
    slug: "litva",
    slug_en: "lithuania"
  },
  {
    code: "LU",
    name: "Luxembourg",
    name_cs: "Lucembursko",
    slug: "lucembursko",
    slug_en: "luxembourg"
  },
  {
    code: "MT",
    name: "Malta",
    name_cs: "Malta",
    slug: "malta",
    slug_en: "malta"
  },
  {
    code: "NL",
    name: "Netherlands",
    name_cs: "Nizozemsko",
    slug: "nizozemsko",
    slug_en: "netherlands"
  },
  {
    code: "PL",
    name: "Poland",
    name_cs: "Polsko",
    slug: "polsko",
    slug_en: "poland"
  },
  {
    code: "PT",
    name: "Portugal",
    name_cs: "Portugalsko",
    slug: "portugalsko",
    slug_en: "portugal"
  },
  {
    code: "RO",
    name: "Romania",
    name_cs: "Rumunsko",
    slug: "rumunsko",
    slug_en: "romania"
  },
  {
    code: "SK",
    name: "Slovakia",
    name_cs: "Slovensko",
    slug: "slovensko",
    slug_en: "slovakia"
  },
  {
    code: "SI",
    name: "Slovenia",
    name_cs: "Slovinsko",
    slug: "slovinsko",
    slug_en: "slovenia"
  },
  {
    code: "ES",
    name: "Spain",
    name_cs: "Španělsko",
    slug: "spanelsko",
    slug_en: "spain"
  },
  {
    code: "SE",
    name: "Sweden",
    name_cs: "Švédsko",
    slug: "svedsko",
    slug_en: "sweden"
  }
];


/* ---------------------------------------------------------
   JSON-STAT HELPERS
--------------------------------------------------------- */

function categories(dim) {
  const cat =
    dim.category ?? {};

  const labels =
    cat.label ?? {};

  if (
    Array.isArray(
      cat.index
    )
  ) {
    return cat.index.map(
      id => ({
        id,
        label:
          labels[id] ?? id
      })
    );
  }

  return Object.entries(
    cat.index ?? {}
  )
    .sort(
      (a, b) =>
        a[1] - b[1]
    )
    .map(
      ([id]) => ({
        id,
        label:
          labels[id] ?? id
      })
    );
}


function flatIndex(
  coord,
  size
) {
  let n = 0;
  let multiplier = 1;

  for (
    let i =
      size.length - 1;

    i >= 0;

    i--
  ) {
    n +=
      coord[i] *
      multiplier;

    multiplier *=
      size[i];
  }

  return n;
}


function rowsFromJsonStat(
  data
) {
  const dims =
    data.id.map(
      id =>
        categories(
          data.dimension[id]
        )
    );

  const rows = [];

  function walk(
    depth,
    coord,
    selected
  ) {
    if (
      depth ===
      dims.length
    ) {
      const i =
        flatIndex(
          coord,
          data.size
        );

      rows.push({
        ...selected,

        value:
          data.value?.[i] ??
          null
      });

      return;
    }

    const dimId =
      data.id[depth];

    for (
      let i = 0;
      i < dims[depth].length;
      i++
    ) {
      const item =
        dims[depth][i];

      walk(
        depth + 1,

        [
          ...coord,
          i
        ],

        {
          ...selected,

          [dimId]:
            item.id,

          [`${dimId}_label`]:
            item.label
        }
      );
    }
  }

  walk(
    0,
    [],
    {}
  );

  return rows;
}


/* ---------------------------------------------------------
   PERIOD HELPERS
--------------------------------------------------------- */

function previousYearPeriod(
  period
) {
  const match =
    /^(\d{4})-Q([1-4])$/.exec(
      period
    );

  if (!match) {
    throw new Error(
      `Invalid period: ${period}`
    );
  }

  const year =
    Number(
      match[1]
    );

  const quarter =
    match[2];

  return `${year - 1}-Q${quarter}`;
}


/* ---------------------------------------------------------
   SERIES HELPERS
--------------------------------------------------------- */

function createSeries(
  rows,
  unit
) {
  return rows
    .filter(
      row =>
        row.unit === unit
    )
    .map(
      row => ({
        period:
          row.time,

        value:
          Number(
            row.value
          )
      })
    )
    .sort(
      (a, b) =>
        a.period.localeCompare(
          b.period
        )
    );
}


function findSeriesValue(
  series,
  period
) {
  const item =
    series.find(
      observation =>
        observation.period ===
        period
    );

  if (!item) {
    return null;
  }

  const value =
    Number(
      item.value
    );

  return Number.isFinite(value)
    ? value
    : null;
}


/* ---------------------------------------------------------
   SERIES VALIDATION
--------------------------------------------------------- */

function assertUniqueSeries(
  rows,
  unit,
  countryCode
) {
  const seen =
    new Set();

  for (
    const row of rows
  ) {
    if (
      row.unit !== unit
    ) {
      continue;
    }

    const period =
      row.time;

    if (!period) {
      continue;
    }

    if (
      seen.has(period)
    ) {
      throw new Error(
        `Duplicate ${unit} observation for ${countryCode} in ${period}`
      );
    }

    seen.add(
      period
    );
  }
}


/* ---------------------------------------------------------
   DEBT CLOCK
--------------------------------------------------------- */

function createDebtClock({
  countryCode,
  latestPeriod,
  nationalSeries,
  euroSeries
}) {
  const currency =
    CURRENCIES[
      countryCode
    ];

  if (!currency) {
    throw new Error(
      `Currency metadata missing for ${countryCode}`
    );
  }


  const periodFrom =
    previousYearPeriod(
      latestPeriod
    );

  const periodTo =
    latestPeriod;


  /*
   * Eurozóna:
   *   MIO_EUR
   *
   * Ostatní:
   *   MIO_NAC
   */
  const useEuro =
    EURO_AREA_CODES.has(
      countryCode
    );

  const sourceSeries =
    useEuro
      ? euroSeries
      : nationalSeries;

  const sourceUnit =
    useEuro
      ? "MIO_EUR"
      : "MIO_NAC";


  const valueFromMillion =
    findSeriesValue(
      sourceSeries,
      periodFrom
    );

  const valueToMillion =
    findSeriesValue(
      sourceSeries,
      periodTo
    );


  if (
    valueFromMillion === null ||
    valueToMillion === null
  ) {
    return {
      period_from:
        periodFrom,

      period_to:
        periodTo,

      currency:
        currency.code,

      currency_label:
        currency.label,

      source_unit:
        sourceUnit,

      value_from_million:
        valueFromMillion,

      value_to_million:
        valueToMillion,

      change:
        null,

      amount_per_second:
        null
    };
  }


  /*
   * Eurostat uvádí hodnoty v milionech.
   *
   * Např.:
   *
   * 10 MIO_NAC CZK
   * =
   * 10 000 000 Kč
   */
  const valueFrom =
    valueFromMillion *
    1_000_000;

  const valueTo =
    valueToMillion *
    1_000_000;


  const change =
    valueTo -
    valueFrom;


  const amountPerSecond =
    change /
    SECONDS_PER_YEAR;


  return {
    period_from:
      periodFrom,

    period_to:
      periodTo,

    currency:
      currency.code,

    currency_label:
      currency.label,

    source_unit:
      sourceUnit,

    value_from_million:
      valueFromMillion,

    value_to_million:
      valueToMillion,

    change:
      Math.round(
        change
      ),

    amount_per_second:
      Math.round(
        amountPerSecond
      )
  };
}


/* ---------------------------------------------------------
   BUILD COUNTRY
--------------------------------------------------------- */

async function buildCountry(
  meta
) {
  const rawFile =
    resolve(
      rawDir,
      `${DATASET}-${meta.code}.json`
    );

  const ds =
    JSON.parse(
      await readFile(
        rawFile,
        "utf8"
      )
    );

  const rows =
    rowsFromJsonStat(ds)
      .filter(
        row =>
          row.value !== null
      );


  /*
   * Používáme pouze:
   *
   * GD  = government consolidated gross debt
   * S13 = general government
   */
  const debtRows =
    rows.filter(
      row =>
        row.na_item === "GD" &&
        row.sector === "S13"
    );


  if (!debtRows.length) {
    throw new Error(
      `No S13 gross debt observations found for ${meta.code}.`
    );
  }


  assertUniqueSeries(
    debtRows,
    "PC_GDP",
    meta.code
  );

  assertUniqueSeries(
    debtRows,
    "MIO_EUR",
    meta.code
  );

  assertUniqueSeries(
    debtRows,
    "MIO_NAC",
    meta.code
  );


  const periods =
    [
      ...new Set(
        debtRows
          .map(
            row =>
              row.time
          )
          .filter(Boolean)
      )
    ].sort();


  const latestPeriod =
    periods.at(-1);


  if (!latestPeriod) {
    throw new Error(
      `No latest period found for ${meta.code}.`
    );
  }


  const latestRows =
    debtRows.filter(
      row =>
        row.time ===
        latestPeriod
    );


  const national =
    latestRows.find(
      row =>
        row.unit ===
        "MIO_NAC"
    );


  const euro =
    latestRows.find(
      row =>
        row.unit ===
        "MIO_EUR"
    );


  const percentGdp =
    latestRows.find(
      row =>
        row.unit ===
        "PC_GDP"
    );


  const debtPercentGdp =
    createSeries(
      debtRows,
      "PC_GDP"
    );


  const debtEuroMillion =
    createSeries(
      debtRows,
      "MIO_EUR"
    );


  const debtNationalCurrencyMillion =
    createSeries(
      debtRows,
      "MIO_NAC"
    );


  const debtClock =
    createDebtClock({
      countryCode:
        meta.code,

      latestPeriod,

      nationalSeries:
        debtNationalCurrencyMillion,

      euroSeries:
        debtEuroMillion
    });


  const currency =
    CURRENCIES[
      meta.code
    ];


  return {
    country: {
      code:
        meta.code,

      name:
        meta.name,

      name_cs:
        meta.name_cs,

      slug:
        meta.slug,

      slug_en:
        meta.slug_en,

      currency: {
        code:
          currency.code,

        label:
          currency.label
      }
    },

    dataset: {
      id:
        DATASET,

      source:
        "Eurostat",

      retrieved_at:
        new Date()
          .toISOString(),

      api_url:
        `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${DATASET}?lang=en&geo=${meta.code}`
    },

    latest: {
      period:
        latestPeriod,

      debt: {
        national_currency:
          national
            ? Number(
                national.value
              )
            : null,

        national_currency_unit:
          national?.unit ??
          null,

        euro:
          euro
            ? Number(
                euro.value
              )
            : null,

        euro_unit:
          euro?.unit ??
          null,

        percent_gdp:
          percentGdp
            ? Number(
                percentGdp.value
              )
            : null,

        percent_gdp_unit:
          percentGdp?.unit ??
          null
      }
    },

    debt_clock:
      debtClock,

    history: {
      debt_percent_gdp:
        debtPercentGdp,

      debt_euro_million:
        debtEuroMillion,

      debt_national_currency_million:
        debtNationalCurrencyMillion
    },

    /*
     * Potřebujeme ještě plochou historii
     * pro starý český overview pipeline.
     */
    _legacy_history:
      debtRows
        .map(
          row => ({
            period:
              row.time,

            value:
              Number(
                row.value
              ),

            unit:
              row.unit ??
              null,

            unit_label:
              row.unit_label ??
              null
          })
        )
        .sort(
          (a, b) =>
            a.period.localeCompare(
              b.period
            )
        )
  };
}


/* ---------------------------------------------------------
   GENERATE
--------------------------------------------------------- */

await mkdir(
  countriesDir,
  {
    recursive: true
  }
);


const countries = [];


console.log(
  "\n=== EUROSTAT EU27 DEBT ===\n"
);


for (
  const meta of COUNTRIES
) {
  const country =
    await buildCountry(
      meta
    );

  countries.push(
    country
  );


  const countryFile =
    resolve(
      countriesDir,
      `${meta.code.toLowerCase()}.json`
    );


  const publicCountry = {
    ...country
  };

  delete publicCountry
    ._legacy_history;


  await writeFile(
    countryFile,

    JSON.stringify(
      publicCountry,
      null,
      2
    ) + "\n",

    "utf8"
  );


  const clock =
    country.debt_clock;

  const clockText =
    Number.isFinite(
      clock.amount_per_second
    )
      ? `${clock.amount_per_second.toLocaleString(
          "cs-CZ"
        )} ${clock.currency_label}/s`
      : "clock unavailable";


  console.log(
    `${meta.code.padEnd(2)}  ${country.latest.period}  ${String(
      country.latest.debt.percent_gdp
    ).padStart(6)} % HDP  ${clockText}`
  );
}


/* ---------------------------------------------------------
   SUMMARY
--------------------------------------------------------- */

const latestPeriods =
  [
    ...new Set(
      countries.map(
        item =>
          item.latest.period
      )
    )
  ];


const summary =
  countries
    .map(
      item => ({
        code:
          item.country.code,

        name:
          item.country.name,

        name_cs:
          item.country.name_cs,

        slug:
          item.country.slug,

        slug_en:
          item.country.slug_en,

        currency:
          item.country.currency,

        period:
          item.latest.period,

        debt_percent_gdp:
          item.latest.debt
            .percent_gdp,

        debt_euro_million:
          item.latest.debt
            .euro,

        debt_national_currency_million:
          item.latest.debt
            .national_currency,

        debt_clock:
          item.debt_clock
      })
    )
    .sort(
      (a, b) =>
        (
          b.debt_percent_gdp ??
          -Infinity
        ) -
        (
          a.debt_percent_gdp ??
          -Infinity
        )
    );


const countriesOutput = {
  dataset: {
    id:
      DATASET,

    source:
      "Eurostat",

    retrieved_at:
      new Date()
        .toISOString()
  },

  count:
    summary.length,

  latest_periods:
    latestPeriods,

  countries:
    summary
};


await writeFile(
  countriesFile,

  JSON.stringify(
    countriesOutput,
    null,
    2
  ) + "\n",

  "utf8"
);


/* ---------------------------------------------------------
   CZ BACKWARDS COMPATIBILITY
--------------------------------------------------------- */

const cz =
  countries.find(
    item =>
      item.country.code ===
      "CZ"
  );


if (!cz) {
  throw new Error(
    "CZ country dataset was not generated."
  );
}


const czOutput = {
  country: {
    code:
      "CZ",

    name:
      "Czechia"
  },

  dataset:
    cz.dataset,

  latest:
    cz.latest,

  history:
    cz._legacy_history
};


await writeFile(
  czFile,

  JSON.stringify(
    czOutput,
    null,
    2
  ) + "\n",

  "utf8"
);


/* ---------------------------------------------------------
   DONE
--------------------------------------------------------- */

console.log(
  "\nCountries:",
  countries.length
);

console.log(
  "Latest periods:",
  latestPeriods.join(", ")
);

console.log(
  `\nSaved ${countriesFile}`
);

console.log(
  `Saved ${countriesDir}/`
);

console.log(
  `Saved compatibility file ${czFile}`
);