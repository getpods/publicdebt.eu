import { calculateDebtClock } from "../lib/debt-clock.js";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const processedDir = resolve(
  process.env.PUBLICDEBT_DATA_DIR ?? resolve(ROOT, "data"),
  "processed"
);

const eurostatFile = resolve(
  processedDir,
  "cz.json"
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

const latestPopulation =
  population.latest;

const latestPeriod =
  latestEurostat.period;

// Eurostat MIO_NAC is expressed in millions of Czech crowns.
const debtCzkHistory = eurostat.history
  .filter(item => item.unit === "MIO_NAC")
  .map(item => ({
    period: item.period,
    year: Number(item.period.slice(0, 4)),
    quarter: Number(item.period.at(-1)),
    debt_czk_billion: Number(item.value) / 1_000,
    debt_czk: Number(item.value) * 1_000_000
  }))
  .sort((a, b) => a.period.localeCompare(b.period));

const latestDebt = debtCzkHistory.find(item => item.period === latestPeriod);

if (!latestDebt || !Number.isFinite(latestDebt.debt_czk) || latestDebt.debt_czk <= 0) {
  throw new Error(`No valid Eurostat CZK debt observation found for ${latestPeriod}`);
}

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
  debtCzkHistory.find(
    item =>
      item.year ===
        latestDebt.year - 1 &&
      item.quarter ===
        latestDebt.quarter
  );


if (!previousYearItem) {
  throw new Error(
    `No Eurostat CZK observation found for ${latestDebt.year - 1}-Q${latestDebt.quarter}`
  );
}


const {
  change: debtChangeCzk,
  amount_per_second: debtPerSecond
} = calculateDebtClock(previousYearItem.debt_czk, latestDebt.debt_czk);


/* ---------------------------------------------------------
   DLUH NA OBYVATELE
--------------------------------------------------------- */

const debtPerCapitaCzk =
  latestDebt.debt_czk /
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
        latestDebt.debt_czk_billion,

      czk:
        latestDebt.debt_czk,

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
      debtPerSecond,

    period_from:
      previousYearItem.period,

    period_to:
      latestPeriod,

    change_czk:
      debtChangeCzk
  },


  history: {
    debt_czk:
      debtCzkHistory
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
  `Debt:        ${latestDebt.debt_czk_billion.toLocaleString("cs-CZ")} mld. Kč`
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
  `\nSaved: ${outputFile}`
);
