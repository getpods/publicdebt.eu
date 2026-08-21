import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const processedDir = resolve(
  ROOT,
  "data/processed"
);

const eurostatFile = resolve(
  processedDir,
  "cz.json"
);

const mfcrFile = resolve(
  processedDir,
  "mfcr-ggd.json"
);

const forecastFile = resolve(
  processedDir,
  "mfcr-forecast.json"
);

const populationFile = resolve(
  processedDir,
  "population.json"
);

const outputFile = resolve(
  processedDir,
  "overview.json"
);


/* ---------------------------------------------------------
   LOAD DATA
--------------------------------------------------------- */

const eurostat = JSON.parse(
  await readFile(
    eurostatFile,
    "utf8"
  )
);

const mfcr = JSON.parse(
  await readFile(
    mfcrFile,
    "utf8"
  )
);

const forecast = JSON.parse(
  await readFile(
    forecastFile,
    "utf8"
  )
);

const population = JSON.parse(
  await readFile(
    populationFile,
    "utf8"
  )
);


/* ---------------------------------------------------------
   LATEST DATA
--------------------------------------------------------- */

const latestEurostat =
  eurostat.latest;

const latestMfcr =
  mfcr.latest;

const latestPopulation =
  population.latest;


if (
  latestEurostat.period !==
  latestMfcr.period
) {
  throw new Error(
    `Latest periods do not match: Eurostat=${latestEurostat.period}, MFCR=${latestMfcr.period}`
  );
}

const latestPeriod =
  latestMfcr.period;


if (
  !latestPopulation ||
  !Number.isFinite(
    latestPopulation.value
  ) ||
  latestPopulation.value <= 0
) {
  throw new Error(
    "Latest population value is missing or invalid."
  );
}


/* ---------------------------------------------------------
   DLUH / HDP — JEDNA HODNOTA NA KVARTÁL
--------------------------------------------------------- */

const debtPercentGdpByPeriod =
  new Map();

for (const item of eurostat.history) {
  const isPercentGdp =
    item.unit === "PC_GDP" ||
    /percentage of gross domestic product/i.test(
      item.unit_label ?? ""
    ) ||
    /% of GDP/i.test(
      item.unit_label ?? ""
    );

  if (!isPercentGdp) {
    continue;
  }

  /*
   * Eurostat obsahuje více řad s jednotkou PC_GDP.
   * První řada pro dané období odpovídá agregátu
   * celkového hrubého dluhu, který používáme
   * také v eurostat.latest.
   */
  if (
    !debtPercentGdpByPeriod.has(
      item.period
    )
  ) {
    debtPercentGdpByPeriod.set(
      item.period,
      Number(item.value)
    );
  }
}


const debtPercentGdpHistory =
  Array.from(
    debtPercentGdpByPeriod,
    ([period, value]) => ({
      period,
      value
    })
  ).sort(
    (a, b) =>
      a.period.localeCompare(
        b.period
      )
  );


/* ---------------------------------------------------------
   DLUHOVÉ POČÍTADLO

   Porovnáváme aktuální kvartál se stejným
   kvartálem předchozího roku.

   Např.:
   2025-Q1 -> 2026-Q1
--------------------------------------------------------- */

const previousYearItem =
  mfcr.history.find(
    item =>
      item.year ===
        latestMfcr.year - 1 &&
      item.quarter ===
        latestMfcr.quarter
  );


if (!previousYearItem) {
  throw new Error(
    `No MFCR observation found for ${latestMfcr.year - 1}-Q${latestMfcr.quarter}`
  );
}


const debtChangeCzk =
  latestMfcr.debt_czk -
  previousYearItem.debt_czk;


const secondsPerYear =
  365.25 *
  24 *
  60 *
  60;


const debtPerSecond =
  debtChangeCzk /
  secondsPerYear;


/* ---------------------------------------------------------
   DLUH NA OBYVATELE
--------------------------------------------------------- */

const debtPerCapitaCzk =
  latestMfcr.debt_czk /
  latestPopulation.value;


/* ---------------------------------------------------------
   OVERVIEW
--------------------------------------------------------- */

const overview = {
  country: {
    code: "CZ",
    name: "Czechia"
  },


  latest: {
    period:
      latestPeriod,

    debt: {
      czk_billion:
        latestMfcr.debt_czk_billion,

      czk:
        latestMfcr.debt_czk,

      percent_gdp:
        latestEurostat.debt.percent_gdp,

      euro_million:
        latestEurostat.debt.euro,

      euro_unit:
        latestEurostat.debt.euro_unit
    }
  },


  population: {
    year:
      latestPopulation.year,

    date:
      latestPopulation.date,

    value:
      latestPopulation.value
  },


  debt_per_capita: {
    czk:
      Math.round(
        debtPerCapitaCzk
      )
  },


  debt_clock: {
    czk_per_second:
      Number(
        debtPerSecond.toFixed(2)
      ),

    period_from:
      previousYearItem.period,

    period_to:
      latestPeriod,

    change_czk:
      debtChangeCzk
  },


  forecast: {
    year:
      forecast.forecast.year,

    balance_percent_gdp:
      forecast.forecast
        .balance_percent_gdp,

    debt_percent_gdp:
      forecast.forecast
        .debt_percent_gdp
  },


  comparison: {
    forecast_debt_minus_latest_actual:
      Number(
        (
          forecast.forecast
            .debt_percent_gdp -
          latestEurostat.debt
            .percent_gdp
        ).toFixed(1)
      )
  },


  history: {
    debt_czk:
      mfcr.history
        .map(item => ({
          period:
            item.period,

          year:
            item.year,

          quarter:
            item.quarter,

          value:
            item.debt_czk_billion
        }))
        .sort(
          (a, b) =>
            a.period.localeCompare(
              b.period
            )
        ),

    debt_percent_gdp:
      debtPercentGdpHistory,

    population:
      population.history
        .map(item => ({
          year:
            item.year,

          date:
            item.date,

          value:
            item.value
        }))
        .sort(
          (a, b) =>
            a.year - b.year
        )
  },


  sources: {
    eurostat:
      eurostat.dataset,

    mfcr:
      mfcr.dataset,

    forecast:
      forecast.dataset,

    population:
      population.dataset
  },


  generated_at:
    new Date().toISOString()
};


/* ---------------------------------------------------------
   SAVE
--------------------------------------------------------- */

await mkdir(
  processedDir,
  {
    recursive: true
  }
);


await writeFile(
  outputFile,
  JSON.stringify(
    overview,
    null,
    2
  ) + "\n",
  "utf8"
);


/* ---------------------------------------------------------
   OUTPUT
--------------------------------------------------------- */

console.log(
  "\n=== CZ DEBT OVERVIEW ===\n"
);

console.log(
  `Latest:      ${latestPeriod}`
);

console.log(
  `Debt:        ${latestMfcr.debt_czk_billion.toLocaleString("cs-CZ")} mld. Kč`
);

console.log(
  `Debt/GDP:    ${latestEurostat.debt.percent_gdp}%`
);

console.log(
  `Population:  ${latestPopulation.value.toLocaleString("cs-CZ")}`
);

console.log(
  `Per capita:  ${Math.round(
    debtPerCapitaCzk
  ).toLocaleString("cs-CZ")} Kč`
);

console.log(
  `Debt speed:  ${debtPerSecond.toLocaleString(
    "cs-CZ",
    {
      maximumFractionDigits: 2
    }
  )} Kč/s`
);

console.log(
  `Clock from:  ${previousYearItem.period}`
);

console.log(
  `Clock to:    ${latestPeriod}`
);

console.log(
  `Forecast:    ${forecast.forecast.debt_percent_gdp}% HDP`
);

console.log(
  `\nSaved: ${outputFile}`
);