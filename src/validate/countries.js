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
   CONSTANTS
--------------------------------------------------------- */

const SECONDS_PER_YEAR =
  365.2425 *
  24 *
  60 *
  60;


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
   HELPERS
--------------------------------------------------------- */

function periodToNumber(period) {
  const match =
    /^(\d{4})-Q([1-4])$/.exec(
      period
    );

  if (!match) {
    return NaN;
  }

  return (
    Number(match[1]) +
    (
      Number(match[2]) - 1
    ) /
    4
  );
}


function previousYearPeriod(
  period
) {
  const match =
    /^(\d{4})-Q([1-4])$/.exec(
      period
    );

  if (!match) {
    return null;
  }

  return `${
    Number(match[1]) - 1
  }-Q${match[2]}`;
}


function assert(
  condition,
  message
) {
  if (!condition) {
    throw new Error(
      message
    );
  }
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

function validateSeries(
  countryCode,
  seriesName,
  series,
  {
    allowZero = true,
    allowNegative = false
  } = {}
) {
  assert(
    Array.isArray(series),
    `${countryCode}: ${seriesName} must be an array`
  );

  assert(
    series.length > 0,
    `${countryCode}: ${seriesName} is empty`
  );


  const seenPeriods =
    new Set();

  let previousTime =
    -Infinity;


  for (
    let index = 0;
    index < series.length;
    index++
  ) {
    const item =
      series[index];

    assert(
      item &&
      typeof item === "object",
      `${countryCode}: invalid ${seriesName} item at index ${index}`
    );


    const period =
      item.period;

    const value =
      Number(
        item.value
      );

    const time =
      periodToNumber(
        period
      );


    assert(
      Number.isFinite(time),
      `${countryCode}: invalid period "${period}" in ${seriesName}`
    );


    assert(
      !seenPeriods.has(
        period
      ),
      `${countryCode}: duplicate period ${period} in ${seriesName}`
    );


    assert(
      Number.isFinite(value),
      `${countryCode}: invalid value in ${seriesName} for ${period}`
    );


    if (!allowNegative) {
      assert(
        value >= 0,
        `${countryCode}: negative value ${value} in ${seriesName} for ${period}`
      );
    }


    if (
      !allowZero &&
      value === 0
    ) {
      throw new Error(
        `${countryCode}: zero value in ${seriesName} for ${period}`
      );
    }


    if (
      value === 0
    ) {
      console.warn(
        `WARN ${countryCode}: zero value in ${seriesName} for ${period}`
      );
    }


    assert(
      time >= previousTime,
      `${countryCode}: ${seriesName} is not sorted chronologically at ${period}`
    );


    seenPeriods.add(
      period
    );

    previousTime =
      time;
  }
}


/* ---------------------------------------------------------
   DEBT CLOCK VALIDATION
--------------------------------------------------------- */

function validateDebtClock(
  code,
  data,
  debtEuroMillion,
  debtNationalCurrencyMillion
) {
  const clock =
    data?.debt_clock;


  assert(
    clock &&
    typeof clock === "object",
    `${code}: missing debt_clock`
  );


  const expectedCurrency =
    CURRENCIES[code];


  assert(
    expectedCurrency,
    `${code}: missing expected currency metadata`
  );


  /*
   * Country metadata musí odpovídat
   * našemu měnovému kontraktu.
   */
  assert(
    data?.country?.currency?.code ===
      expectedCurrency.code,
    `${code}: invalid country.currency.code`
  );


  assert(
    data?.country?.currency?.label ===
      expectedCurrency.label,
    `${code}: invalid country.currency.label`
  );


  /*
   * Clock musí končit přesně v latest.period.
   */
  assert(
    clock.period_to ===
      data.latest.period,
    `${code}: debt_clock.period_to does not match latest.period`
  );


  const expectedPeriodFrom =
    previousYearPeriod(
      data.latest.period
    );


  assert(
    expectedPeriodFrom,
    `${code}: cannot determine previous-year debt clock period`
  );


  /*
   * Musí jít o stejný kvartál
   * předchozího roku.
   */
  assert(
    clock.period_from ===
      expectedPeriodFrom,
    `${code}: debt_clock.period_from should be ${expectedPeriodFrom}, got ${clock.period_from}`
  );


  /*
   * Měna.
   */
  assert(
    clock.currency ===
      expectedCurrency.code,
    `${code}: debt_clock.currency should be ${expectedCurrency.code}, got ${clock.currency}`
  );


  assert(
    clock.currency_label ===
      expectedCurrency.label,
    `${code}: invalid debt_clock.currency_label`
  );


  /*
   * Eurozóna používá MIO_EUR,
   * ostatní MIO_NAC.
   */
  const usesEuro =
    EURO_AREA_CODES.has(
      code
    );


  const expectedSourceUnit =
    usesEuro
      ? "MIO_EUR"
      : "MIO_NAC";


  assert(
    clock.source_unit ===
      expectedSourceUnit,
    `${code}: debt_clock.source_unit should be ${expectedSourceUnit}, got ${clock.source_unit}`
  );


  const sourceSeries =
    usesEuro
      ? debtEuroMillion
      : debtNationalCurrencyMillion;


  const expectedFromMillion =
    findSeriesValue(
      sourceSeries,
      clock.period_from
    );


  const expectedToMillion =
    findSeriesValue(
      sourceSeries,
      clock.period_to
    );


  /*
   * Pro současný dataset očekáváme,
   * že oba kvartály existují.
   *
   * Pokud by Eurostat někdy vydal neúplnou
   * řadu, release zde raději skončí.
   */
  assert(
    expectedFromMillion !== null,
    `${code}: source debt value missing for debt clock period ${clock.period_from}`
  );


  assert(
    expectedToMillion !== null,
    `${code}: source debt value missing for debt clock period ${clock.period_to}`
  );


  assert(
    Number.isFinite(
      Number(
        clock.value_from_million
      )
    ),
    `${code}: invalid debt_clock.value_from_million`
  );


  assert(
    Number.isFinite(
      Number(
        clock.value_to_million
      )
    ),
    `${code}: invalid debt_clock.value_to_million`
  );


  assert(
    Number(
      clock.value_from_million
    ) ===
      expectedFromMillion,
    `${code}: debt_clock.value_from_million does not match source history`
  );


  assert(
    Number(
      clock.value_to_million
    ) ===
      expectedToMillion,
    `${code}: debt_clock.value_to_million does not match source history`
  );


  /*
   * Eurostat hodnoty jsou v milionech.
   */
  const expectedChange =
    Math.round(
      (
        expectedToMillion -
        expectedFromMillion
      ) *
      1_000_000
    );


  const expectedAmountPerSecond =
    Math.round(
      expectedChange /
      SECONDS_PER_YEAR
    );


  assert(
    Number.isFinite(
      Number(
        clock.change
      )
    ),
    `${code}: invalid debt_clock.change`
  );


  assert(
    Number.isFinite(
      Number(
        clock.amount_per_second
      )
    ),
    `${code}: invalid debt_clock.amount_per_second`
  );


  assert(
    Number(
      clock.change
    ) ===
      expectedChange,
    `${code}: debt_clock.change mismatch; expected ${expectedChange}, got ${clock.change}`
  );


  assert(
    Number(
      clock.amount_per_second
    ) ===
      expectedAmountPerSecond,
    `${code}: debt_clock.amount_per_second mismatch; expected ${expectedAmountPerSecond}, got ${clock.amount_per_second}`
  );
}


/* ---------------------------------------------------------
   COUNTRY VALIDATION
--------------------------------------------------------- */

async function validateCountry(
  fileName
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
    data?.country?.code;


  assert(
    typeof code === "string" &&
    code.length === 2,
    `${fileName}: invalid country.code`
  );


  assert(
    typeof data?.country?.name ===
      "string",
    `${code}: missing country.name`
  );


  assert(
    typeof data?.country?.name_cs ===
      "string",
    `${code}: missing country.name_cs`
  );


  assert(
    typeof data?.country?.slug ===
      "string",
    `${code}: missing country.slug`
  );


  assert(
    data?.dataset?.id ===
      "gov_10q_ggdebt",
    `${code}: unexpected dataset id`
  );


  assert(
    typeof data?.latest?.period ===
      "string" &&
    Number.isFinite(
      periodToNumber(
        data.latest.period
      )
    ),
    `${code}: invalid latest.period`
  );


  assert(
    Number.isFinite(
      Number(
        data?.latest?.debt
          ?.percent_gdp
      )
    ),
    `${code}: invalid latest debt percent GDP`
  );


  assert(
    Number.isFinite(
      Number(
        data?.latest?.debt
          ?.euro
      )
    ),
    `${code}: invalid latest euro debt`
  );


  assert(
    Number.isFinite(
      Number(
        data?.latest?.debt
          ?.national_currency
      )
    ),
    `${code}: invalid latest national currency debt`
  );


  const debtPercentGdp =
    data?.history
      ?.debt_percent_gdp;

  const debtEuroMillion =
    data?.history
      ?.debt_euro_million;

  const debtNationalCurrencyMillion =
    data?.history
      ?.debt_national_currency_million;


  validateSeries(
    code,
    "history.debt_percent_gdp",
    debtPercentGdp,
    {
      allowZero: true,
      allowNegative: false
    }
  );


  validateSeries(
    code,
    "history.debt_euro_million",
    debtEuroMillion,
    {
      allowZero: true,
      allowNegative: false
    }
  );


  validateSeries(
    code,
    "history.debt_national_currency_million",
    debtNationalCurrencyMillion,
    {
      allowZero: true,
      allowNegative: false
    }
  );


  const percentLatest =
    debtPercentGdp.at(-1);

  const euroLatest =
    debtEuroMillion.at(-1);

  const nationalLatest =
    debtNationalCurrencyMillion.at(-1);


  assert(
    percentLatest.period ===
      data.latest.period,
    `${code}: latest.period does not match debt_percent_gdp history`
  );


  assert(
    euroLatest.period ===
      data.latest.period,
    `${code}: latest.period does not match debt_euro_million history`
  );


  assert(
    nationalLatest.period ===
      data.latest.period,
    `${code}: latest.period does not match debt_national_currency_million history`
  );


  assert(
    Number(
      percentLatest.value
    ) ===
      Number(
        data.latest.debt
          .percent_gdp
      ),
    `${code}: latest percent GDP does not match history`
  );


  assert(
    Number(
      euroLatest.value
    ) ===
      Number(
        data.latest.debt
          .euro
      ),
    `${code}: latest euro debt does not match history`
  );


  assert(
    Number(
      nationalLatest.value
    ) ===
      Number(
        data.latest.debt
          .national_currency
      ),
    `${code}: latest national currency debt does not match history`
  );


  validateDebtClock(
    code,
    data,
    debtEuroMillion,
    debtNationalCurrencyMillion
  );


  return {
    code,

    periods:
      debtPercentGdp.length,

    latest:
      data.latest.period,

    clock:
      data.debt_clock
        .amount_per_second,

    currency:
      data.debt_clock
        .currency_label
  };
}


/* ---------------------------------------------------------
   RUN
--------------------------------------------------------- */

const files =
  (
    await readdir(
      countriesDir
    )
  )
    .filter(
      fileName =>
        extname(
          fileName
        ) === ".json"
    )
    .sort();


assert(
  files.length === 27,
  `Expected 27 country files, found ${files.length}`
);


console.log(
  "\n=== VALIDATE COUNTRY DATA ===\n"
);


const results =
  [];


for (
  const fileName of files
) {
  const result =
    await validateCountry(
      fileName
    );

  results.push(
    result
  );


  const signedClock =
    result.clock > 0
      ? `+${result.clock}`
      : String(
          result.clock
        );


  console.log(
    `${result.code}  ${String(
      result.periods
    ).padStart(3)} observations  latest ${result.latest}  clock ${signedClock} ${result.currency}/s`
  );
}


assert(
  results.length === 27,
  `Expected 27 validated countries, got ${results.length}`
);


console.log(
  `\n✓ All ${results.length} country datasets are valid.\n`
);