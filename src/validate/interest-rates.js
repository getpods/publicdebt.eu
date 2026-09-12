import {
  readFile
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

const interestRatesFile =
  resolve(
    ROOT,
    "data/processed/interest-rates.json"
  );

const euFile =
  resolve(
    ROOT,
    "data/processed/eu.json"
  );


const interestRates =
  JSON.parse(
    await readFile(
      interestRatesFile,
      "utf8"
    )
  );

const eu =
  JSON.parse(
    await readFile(
      euFile,
      "utf8"
    )
  );


const errors = [];
const warnings = [];


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function assert(
  condition,
  message
) {
  if (!condition) {
    errors.push(message);
  }
}


function warn(
  condition,
  message
) {
  if (!condition) {
    warnings.push(message);
  }
}


function isFiniteNumber(
  value
) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}


function isMonthPeriod(
  period
) {
  return (
    typeof period === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(
      period
    )
  );
}


/* ---------------------------------------------------------
   BASIC STRUCTURE
--------------------------------------------------------- */

assert(
  interestRates.source === "ECB",
  `Unexpected source: ${interestRates.source}`
);

assert(
  interestRates.dataset === "IRS",
  `Unexpected ECB dataset: ${interestRates.dataset}`
);

assert(
  interestRates.frequency === "monthly",
  `Unexpected frequency: ${interestRates.frequency}`
);

assert(
  interestRates.count === 27,
  `Expected 27 countries, got ${interestRates.count}`
);

assert(
  Array.isArray(
    interestRates.countries
  ),
  "interest-rates.countries must be an array"
);

assert(
  interestRates.countries?.length === 27,
  `Expected 27 country entries, got ${interestRates.countries?.length}`
);


/* ---------------------------------------------------------
   COUNTRY SERIES
--------------------------------------------------------- */

const seenCodes =
  new Set();


for (
  const country of
  interestRates.countries ?? []
) {
  const code =
    country.code;

  assert(
    typeof code === "string" &&
    /^[A-Z]{2}$/.test(code),
    `Invalid country code: ${code}`
  );

  assert(
    !seenCodes.has(code),
    `Duplicate country code: ${code}`
  );

  seenCodes.add(code);


  assert(
    typeof country.series === "string" &&
    country.series.length > 0,
    `${code}: missing ECB series`
  );

  assert(
    typeof country.currency === "string" &&
    country.currency.length === 3,
    `${code}: invalid currency ${country.currency}`
  );

  assert(
    country.latest &&
    isMonthPeriod(
      country.latest.period
    ),
    `${code}: invalid latest period ${country.latest?.period}`
  );

  assert(
    isFiniteNumber(
      country.latest?.percent
    ),
    `${code}: latest percent must be finite`
  );

  if (
    isFiniteNumber(
      country.latest?.percent
    )
  ) {
    warn(
      country.latest.percent > -5 &&
      country.latest.percent < 25,
      `${code}: unusual 10Y yield ${country.latest.percent}%`
    );
  }


  assert(
    Array.isArray(
      country.history
    ),
    `${code}: history must be an array`
  );

  assert(
    country.history?.length > 0,
    `${code}: history is empty`
  );


  const seenPeriods =
    new Set();

  let previousPeriod =
    null;


  for (
    const observation of
    country.history ?? []
  ) {
    assert(
      isMonthPeriod(
        observation.period
      ),
      `${code}: invalid period ${observation.period}`
    );

    assert(
      isFiniteNumber(
        observation.value
      ),
      `${code}: invalid value in ${observation.period}`
    );

    assert(
      !seenPeriods.has(
        observation.period
      ),
      `${code}: duplicate period ${observation.period}`
    );

    seenPeriods.add(
      observation.period
    );


    if (
      previousPeriod !== null
    ) {
      assert(
        observation.period >
        previousPeriod,
        `${code}: history is not sorted at ${observation.period}`
      );
    }

    previousPeriod =
      observation.period;
  }


  const latestHistory =
    country.history?.at(-1);

  assert(
    latestHistory?.period ===
    country.latest?.period,
    `${code}: latest period does not match final history observation`
  );

  if (
    latestHistory &&
    isFiniteNumber(
      country.latest?.percent
    )
  ) {
    assert(
      Math.abs(
        latestHistory.value -
        country.latest.percent
      ) < 1e-12,
      `${code}: latest value does not match final history observation`
    );
  }
}


/* ---------------------------------------------------------
   EU.JSON INTEGRATION
--------------------------------------------------------- */

assert(
  eu.count === 27,
  `eu.json must contain 27 countries, got ${eu.count}`
);


const euByCode =
  new Map(
    (eu.countries ?? []).map(
      country => [
        country.code,
        country
      ]
    )
  );


for (
  const rateCountry of
  interestRates.countries ?? []
) {
  const code =
    rateCountry.code;

  const euCountry =
    euByCode.get(code);

  assert(
    Boolean(euCountry),
    `${code}: missing from eu.json`
  );

  if (!euCountry) {
    continue;
  }


  assert(
    euCountry.interest_rate?.period ===
    rateCountry.latest.period,
    `${code}: eu.json latest period does not match ECB data`
  );

  assert(
    euCountry.interest_rate?.percent ===
    rateCountry.latest.percent,
    `${code}: eu.json latest value does not match ECB data`
  );

  assert(
    euCountry.interest_rate?.currency ===
    rateCountry.currency,
    `${code}: eu.json currency does not match ECB data`
  );

  assert(
    Number.isInteger(
      euCountry.rank?.interest_rate
    ) &&
    euCountry.rank.interest_rate >= 1 &&
    euCountry.rank.interest_rate <= 27,
    `${code}: invalid rank ${euCountry.rank?.interest_rate}`
  );
}


/* ---------------------------------------------------------
   PERIOD SUMMARY
--------------------------------------------------------- */

const expectedPeriods =
  [
    ...new Set(
      (interestRates.countries ?? []).map(
        country =>
          country.latest.period
      )
    )
  ].sort();

const actualPeriods =
  Array.isArray(
    eu.periods?.interest_rate
  )
    ? [...eu.periods.interest_rate].sort()
    : [];


assert(
  JSON.stringify(
    actualPeriods
  ) ===
  JSON.stringify(
    expectedPeriods
  ),
  `eu.json interest-rate periods do not match ECB latest periods`
);


/* ---------------------------------------------------------
   RANKING

   Ranking intentionally uses each country's latest
   available ECB observation. Latest months may differ
   temporarily while ECB updates the dataset.
--------------------------------------------------------- */

const rankedCountries =
  [...(eu.countries ?? [])]
    .sort(
      (a, b) =>
        a.rank.interest_rate -
        b.rank.interest_rate
    );


assert(
  rankedCountries.length === 27,
  `Expected 27 ranked countries, got ${rankedCountries.length}`
);


const seenRanks =
  new Set();


for (
  let index = 0;
  index < rankedCountries.length;
  index += 1
) {
  const country =
    rankedCountries[index];

  const expectedRank =
    index + 1;

  assert(
    country.rank.interest_rate ===
    expectedRank,
    `${country.code}: expected rank ${expectedRank}, got ${country.rank.interest_rate}`
  );

  assert(
    !seenRanks.has(
      country.rank.interest_rate
    ),
    `${country.code}: duplicate rank ${country.rank.interest_rate}`
  );

  seenRanks.add(
    country.rank.interest_rate
  );


  if (index > 0) {
    const previous =
      rankedCountries[index - 1];

    assert(
      previous.interest_rate.percent >=
      country.interest_rate.percent,
      `${country.code}: ranking order does not match latest yield values`
    );
  }
}


/* ---------------------------------------------------------
   RESULT
--------------------------------------------------------- */

if (
  warnings.length > 0
) {
  console.log(
    "\nWarnings:"
  );

  for (
    const warning of
    warnings
  ) {
    console.log(
      `- ${warning}`
    );
  }
}


if (
  errors.length > 0
) {
  console.error(
    "\nECB interest-rate validation failed:\n"
  );

  for (
    const error of
    errors
  ) {
    console.error(
      `- ${error}`
    );
  }

  process.exit(1);
}


console.log(
  "✓ ECB interest rates valid"
);

console.log(
  `✓ Countries: ${interestRates.count}`
);

console.log(
  `✓ Latest periods: ${expectedPeriods.join(", ")}`
);

console.log(
  "✓ eu.json integration valid"
);

console.log(
  "✓ Latest-value ranking valid"
);
