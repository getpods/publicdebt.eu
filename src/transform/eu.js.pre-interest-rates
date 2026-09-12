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


if (
  debtData.count !== 27 ||
  populationData.count !== 27
) {
  throw new Error(
    `Expected 27 countries. Debt=${debtData.count}, population=${populationData.count}`
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
    }
  },


  count:
    countries.length,


  periods: {
    debt:
      debtPeriods,

    population:
      populationYears
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