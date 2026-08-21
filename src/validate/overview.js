import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const overviewFile = resolve(
  ROOT,
  "data/processed/overview.json"
);

const overview = JSON.parse(
  await readFile(overviewFile, "utf8")
);

const errors = [];
const warnings = [];


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function warn(condition, message) {
  if (!condition) {
    warnings.push(message);
  }
}

function isFiniteNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function periodToNumber(period) {
  const match =
    /^(\d{4})-Q([1-4])$/.exec(period ?? "");

  if (!match) {
    return null;
  }

  return (
    Number(match[1]) +
    (Number(match[2]) - 1) / 4
  );
}


/* ---------------------------------------------------------
   BASIC STRUCTURE
--------------------------------------------------------- */

assert(
  overview.country?.code === "CZ",
  "country.code must be CZ"
);

assert(
  overview.latest,
  "latest is missing"
);

assert(
  overview.forecast,
  "forecast is missing"
);

assert(
  overview.history,
  "history is missing"
);

assert(
  overview.debt_clock,
  "debt_clock is missing"
);


/* ---------------------------------------------------------
   LATEST DEBT
--------------------------------------------------------- */

const latest =
  overview.latest ?? {};

const debt =
  latest.debt ?? {};

assert(
  periodToNumber(latest.period) !== null,
  `Invalid latest period: ${latest.period}`
);

assert(
  isFiniteNumber(debt.czk_billion) &&
  debt.czk_billion > 0,
  "latest.debt.czk_billion must be a positive number"
);

assert(
  isFiniteNumber(debt.czk) &&
  debt.czk > 0,
  "latest.debt.czk must be a positive number"
);

assert(
  isFiniteNumber(debt.percent_gdp) &&
  debt.percent_gdp > 0 &&
  debt.percent_gdp < 200,
  "latest.debt.percent_gdp looks invalid"
);


/* ---------------------------------------------------------
   DEBT CLOCK
--------------------------------------------------------- */

const clock =
  overview.debt_clock ?? {};

assert(
  isFiniteNumber(clock.czk_per_second),
  "debt_clock.czk_per_second must be a number"
);

warn(
  clock.czk_per_second > 0,
  `Debt clock is not growing: ${clock.czk_per_second} Kč/s`
);

warn(
  Math.abs(clock.czk_per_second) < 1_000_000,
  `Debt clock looks unusually large: ${clock.czk_per_second} Kč/s`
);

assert(
  periodToNumber(clock.period_from) !== null,
  `Invalid debt_clock.period_from: ${clock.period_from}`
);

assert(
  periodToNumber(clock.period_to) !== null,
  `Invalid debt_clock.period_to: ${clock.period_to}`
);


/* ---------------------------------------------------------
   FORECAST
--------------------------------------------------------- */

const forecast =
  overview.forecast ?? {};

assert(
  Number.isInteger(forecast.year),
  "forecast.year must be an integer"
);

assert(
  isFiniteNumber(
    forecast.debt_percent_gdp
  ),
  "forecast.debt_percent_gdp must be a number"
);

assert(
  isFiniteNumber(
    forecast.balance_percent_gdp
  ),
  "forecast.balance_percent_gdp must be a number"
);


/* ---------------------------------------------------------
   CZK HISTORY
--------------------------------------------------------- */

const debtCzk =
  overview.history?.debt_czk ?? [];

assert(
  Array.isArray(debtCzk),
  "history.debt_czk must be an array"
);

assert(
  debtCzk.length > 10,
  "history.debt_czk contains too few observations"
);

const debtCzkPeriods =
  new Set();

for (const item of debtCzk) {
  assert(
    periodToNumber(item.period) !== null,
    `Invalid debt_czk period: ${item.period}`
  );

  assert(
    isFiniteNumber(item.value),
    `Invalid debt_czk value in ${item.period}`
  );

  if (debtCzkPeriods.has(item.period)) {
    errors.push(
      `Duplicate debt_czk period: ${item.period}`
    );
  }

  debtCzkPeriods.add(item.period);
}


/* ---------------------------------------------------------
   GDP HISTORY
--------------------------------------------------------- */

const debtGdp =
  overview.history?.debt_percent_gdp ?? [];

assert(
  Array.isArray(debtGdp),
  "history.debt_percent_gdp must be an array"
);

assert(
  debtGdp.length > 10,
  "history.debt_percent_gdp contains too few observations"
);

const debtGdpPeriods =
  new Set();

for (const item of debtGdp) {
  assert(
    periodToNumber(item.period) !== null,
    `Invalid debt_percent_gdp period: ${item.period}`
  );

  assert(
    isFiniteNumber(item.value),
    `Invalid debt_percent_gdp value in ${item.period}`
  );

  assert(
    item.value >= 0 &&
    item.value < 200,
    `Suspicious debt/GDP value in ${item.period}: ${item.value}`
  );

  if (debtGdpPeriods.has(item.period)) {
    errors.push(
      `Duplicate debt_percent_gdp period: ${item.period}`
    );
  }

  debtGdpPeriods.add(item.period);
}


/* ---------------------------------------------------------
   LATEST HISTORY VS LATEST VALUE
--------------------------------------------------------- */

const latestDebtCzk =
  debtCzk.at(-1);

const latestDebtGdp =
  debtGdp.at(-1);

assert(
  latestDebtCzk?.period === latest.period,
  `Latest MFCR history period (${latestDebtCzk?.period}) does not match overview.latest (${latest.period})`
);

assert(
  latestDebtGdp?.period === latest.period,
  `Latest Eurostat history period (${latestDebtGdp?.period}) does not match overview.latest (${latest.period})`
);

if (
  latestDebtGdp &&
  isFiniteNumber(debt.percent_gdp)
) {
  assert(
    Math.abs(
      latestDebtGdp.value -
      debt.percent_gdp
    ) < 0.01,
    `Latest debt/GDP mismatch: history=${latestDebtGdp.value}, latest=${debt.percent_gdp}`
  );
}

/* ---------------------------------------------------------
   POPULATION
--------------------------------------------------------- */

const population =
  overview.population ?? {};

assert(
  Number.isInteger(population.year),
  "population.year must be an integer"
);

assert(
  typeof population.date === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(population.date),
  "population.date must be YYYY-MM-DD"
);

assert(
  isFiniteNumber(population.value) &&
  population.value > 1_000_000 &&
  population.value < 30_000_000,
  "population.value looks invalid"
);


/* ---------------------------------------------------------
   DEBT PER CAPITA
--------------------------------------------------------- */

const debtPerCapita =
  overview.debt_per_capita ?? {};

assert(
  isFiniteNumber(debtPerCapita.czk) &&
  debtPerCapita.czk > 0,
  "debt_per_capita.czk must be a positive number"
);

if (
  isFiniteNumber(overview.latest?.debt?.czk) &&
  isFiniteNumber(population.value) &&
  population.value > 0 &&
  isFiniteNumber(debtPerCapita.czk)
) {
  const expected =
    Math.round(
      overview.latest.debt.czk /
      population.value
    );

  assert(
    Math.abs(
      expected -
      debtPerCapita.czk
    ) <= 1,
    `Debt per capita mismatch: expected=${expected}, actual=${debtPerCapita.czk}`
  );
}


/* ---------------------------------------------------------
   OUTPUT
--------------------------------------------------------- */

console.log("\n=== DATA VALIDATION ===\n");

console.log(
  `Latest period:      ${latest.period}`
);

console.log(
  `Debt:               ${debt.czk_billion?.toLocaleString("cs-CZ")} mld. Kč`
);

console.log(
  `Debt / GDP:         ${debt.percent_gdp}%`
);

console.log(
  `Debt clock:         ${clock.czk_per_second?.toLocaleString("cs-CZ")} Kč/s`
);

console.log(
  `CZK observations:   ${debtCzk.length}`
);

console.log(
  `GDP observations:   ${debtGdp.length}`
);

console.log(
  `Population:         ${population.value?.toLocaleString("cs-CZ")}`
);

console.log(
  `Debt per capita:    ${debtPerCapita.czk?.toLocaleString("cs-CZ")} Kč`
);


if (warnings.length) {
  console.log("\nWarnings:");

  for (const warning of warnings) {
    console.log(`⚠ ${warning}`);
  }
}


if (errors.length) {
  console.error("\nValidation failed:\n");

  for (const error of errors) {
    console.error(`✗ ${error}`);
  }

  console.error(
    `\n${errors.length} validation error(s).\n`
  );

  process.exit(1);
}


console.log(
  "\n✓ All validation checks passed.\n"
);