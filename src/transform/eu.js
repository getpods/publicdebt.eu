import {
  readFile,
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


const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const processedDir = resolve(
  ROOT,
  "data/processed"
);

const countriesFile = resolve(
  processedDir,
  "countries.json"
);

const populationsFile = resolve(
  processedDir,
  "populations.json"
);


const interestRatesFile = resolve(
  processedDir,
  "interest-rates.json"
);
const outputFile = resolve(
  processedDir,
  "eu.json"
);


/* ---------------------------------------------------------
   LOAD
--------------------------------------------------------- */

const debtData = JSON.parse(
  await readFile(
    countriesFile,
    "utf8"
  )
);

const populationData = JSON.parse(
  await readFile(
    populationsFile,
    "utf8"
  )
);



const interestRateData = JSON.parse(
  await readFile(
    interestRatesFile,
    "utf8"
  )
);
if (
  debtData.count !== 27 ||
  populationData.count !== 27 ||
  interestRateData.count !== 27
) {
  throw new Error(
    `Expected 27 countries. Debt=${debtData.count}, population=${populationData.count}, interest rates=${interestRateData.count}`
  );
}


/* ---------------------------------------------------------
   INDEX POPULATION BY COUNTRY
--------------------------------------------------------- */

const populationByCode =
  new Map(
    populationData.countries.map(
      country => [
        country.code,
        country
      ]
    )
  );

const interestRateByCode =
  new Map(
    interestRateData.countries.map(
      country => [
        country.code,
        country
      ]
    )
  );


/* ---------------------------------------------------------
   MERGE
--------------------------------------------------------- */

const countries =
  debtData.countries.map(
    debtCountry => {
      const populationCountry =
        populationByCode.get(
          debtCountry.code
        );

      if (!populationCountry) {
        throw new Error(
          `Population data missing for ${debtCountry.code}`
        );
      }

      const interestRateCountry =
        interestRateByCode.get(
          debtCountry.code
        );

      if (!interestRateCountry) {
        throw new Error(
          `Interest-rate data missing for ${debtCountry.code}`
        );
      }


      const debtEuroMillion =
        Number(
          debtCountry.debt_euro_million
        );

      const population =
        Number(
          populationCountry.population
        );


      if (
        !Number.isFinite(debtEuroMillion) ||
        debtEuroMillion < 0
      ) {
        throw new Error(
          `Invalid euro debt for ${debtCountry.code}`
        );
      }


      if (
        !Number.isFinite(population) ||
        population <= 0
      ) {
        throw new Error(
          `Invalid population for ${debtCountry.code}`
        );
      }


      const debtEuro =
        debtEuroMillion *
        1_000_000;


      const debtPerCapitaEuro =
        debtEuro /
        population;


      return {
        code:
          debtCountry.code,

        name:
          debtCountry.name,

        name_cs:
          debtCountry.name_cs,

        slug:
          debtCountry.slug,

        slug_en:
          debtCountry.slug_en,


        debt: {
          period:
            debtCountry.period,

          percent_gdp:
            debtCountry.debt_percent_gdp,

          euro_million:
            debtEuroMillion,

          euro:
            debtEuro
        },


        population: {
          year:
            populationCountry.year,

          date:
            populationCountry.date,

          value:
            population
        },


        debt_per_capita: {
          eur:
            Math.round(
              debtPerCapitaEuro
            )
        },

        interest_rate: {
          period:
            interestRateCountry.latest.period,
          percent:
            interestRateCountry.latest.percent,
          currency:
            interestRateCountry.currency
        }
      };
    }
  );


/* ---------------------------------------------------------
   RANK HELPERS
--------------------------------------------------------- */

function createRankMap(
  items,
  getValue
) {
  const sorted =
    [...items]
      .filter(
        item =>
          Number.isFinite(
            Number(
              getValue(item)
            )
          )
      )
      .sort(
        (a, b) =>
          Number(
            getValue(b)
          ) -
          Number(
            getValue(a)
          )
      );


  return new Map(
    sorted.map(
      (item, index) => [
        item.code,
        index + 1
      ]
    )
  );
}


/* ---------------------------------------------------------
   RANKINGS
--------------------------------------------------------- */

const debtPercentRank =
  createRankMap(
    countries,
    item =>
      item.debt.percent_gdp
  );

const debtEuroRank =
  createRankMap(
    countries,
    item =>
      item.debt.euro
  );

const debtPerCapitaRank =
  createRankMap(
    countries,
    item =>
      item.debt_per_capita.eur
  );

const populationRank =
  createRankMap(
    countries,
    item =>
      item.population.value
  );

const interestRateRank =
  createRankMap(
    countries,
    item =>
      item.interest_rate.percent
  );


for (const country of countries) {
  country.rank = {
    debt_percent_gdp:
      debtPercentRank.get(
        country.code
      ) ?? null,

    debt_euro:
      debtEuroRank.get(
        country.code
      ) ?? null,

    debt_per_capita_eur:
      debtPerCapitaRank.get(
        country.code
      ) ?? null,

    population:
      populationRank.get(
        country.code
      ) ?? null,

    interest_rate:
      interestRateRank.get(
        country.code
      ) ?? null
  };
}


/* ---------------------------------------------------------
   SORT DEFAULT OUTPUT

   Hlavní pořadí podle dluhu / HDP.
--------------------------------------------------------- */

countries.sort(
  (a, b) =>
    a.rank.debt_percent_gdp -
    b.rank.debt_percent_gdp
);


/* ---------------------------------------------------------
   CONSISTENCY
--------------------------------------------------------- */

const debtPeriods =
  [
    ...new Set(
      countries.map(
        country =>
          country.debt.period
      )
    )
  ];


const populationYears =
  [
    ...new Set(
      countries.map(
        country =>
          country.population.year
      )
    )
  ].sort(
    (a, b) =>
      a - b
  );

const interestRatePeriods =
  [
    ...new Set(
      countries.map(
        country =>
          country.interest_rate.period
      )
    )
  ].sort();


/* ---------------------------------------------------------
   OUTPUT
--------------------------------------------------------- */

const output = {
  region: {
    code:
      "EU27",

    name:
      "European Union",

    name_cs:
      "Evropská unie"
  },


  dataset: {
    debt: {
      id:
        debtData.dataset.id,

      source:
        debtData.dataset.source,

      retrieved_at:
        debtData.dataset.retrieved_at
    },

    population: {
      id:
        populationData.dataset.id,

      source:
        populationData.dataset.source,

      indicator:
        populationData.dataset.indicator,

      retrieved_at:
        populationData.dataset.retrieved_at
    },

    interest_rate: {
      id:
        interestRateData.dataset,
      source:
        interestRateData.source,
      metric:
        interestRateData.metric,
      frequency:
        interestRateData.frequency
    }
  },


  count:
    countries.length,


  periods: {
    debt:
      debtPeriods,

    population:
      populationYears,

    interest_rate:
      interestRatePeriods
  },


  countries,


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
    output,
    null,
    2
  ) + "\n",

  "utf8"
);


/* ---------------------------------------------------------
   CONSOLE
--------------------------------------------------------- */

console.log(
  "\n=== EU27 OVERVIEW ===\n"
);

console.log(
  `Countries:          ${countries.length}`
);

console.log(
  `Debt periods:       ${debtPeriods.join(", ")}`
);

console.log(
  `Population years:   ${populationYears.join(", ")}`
);

console.log(
  `Interest-rate periods: ${interestRatePeriods.join(", ")}`
);


console.log(
  "\nTop 5 — debt / GDP:"
);

for (
  const country of
  countries.slice(0, 5)
) {
  console.log(
    `${country.rank.debt_percent_gdp}. ${country.name_cs}: ${country.debt.percent_gdp}%`
  );
}


const perCapitaTop =
  [...countries]
    .sort(
      (a, b) =>
        a.rank.debt_per_capita_eur -
        b.rank.debt_per_capita_eur
    )
    .slice(
      0,
      5
    );


console.log(
  "\nTop 5 — debt per capita:"
);

for (
  const country of
  perCapitaTop
) {
  console.log(
    `${country.rank.debt_per_capita_eur}. ${country.name_cs}: ${country.debt_per_capita.eur.toLocaleString("cs-CZ")} EUR`
  );
}


console.log(
  `\nSaved: ${outputFile}`
);