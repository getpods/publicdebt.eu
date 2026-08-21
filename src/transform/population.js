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


const DATASET =
  "demo_gind";


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


const populationsDir =
  resolve(
    outDir,
    "populations"
  );


const populationsFile =
  resolve(
    outDir,
    "populations.json"
  );


const czFile =
  resolve(
    outDir,
    "population.json"
  );


/* ---------------------------------------------------------
   COUNTRIES
--------------------------------------------------------- */

const COUNTRIES = [
  {
    code: "AT",
    name: "Austria",
    name_cs: "Rakousko",
    slug: "rakousko"
  },
  {
    code: "BE",
    name: "Belgium",
    name_cs: "Belgie",
    slug: "belgie"
  },
  {
    code: "BG",
    name: "Bulgaria",
    name_cs: "Bulharsko",
    slug: "bulharsko"
  },
  {
    code: "HR",
    name: "Croatia",
    name_cs: "Chorvatsko",
    slug: "chorvatsko"
  },
  {
    code: "CY",
    name: "Cyprus",
    name_cs: "Kypr",
    slug: "kypr"
  },
  {
    code: "CZ",
    name: "Czechia",
    name_cs: "Česko",
    slug: "cesko"
  },
  {
    code: "DK",
    name: "Denmark",
    name_cs: "Dánsko",
    slug: "dansko"
  },
  {
    code: "EE",
    name: "Estonia",
    name_cs: "Estonsko",
    slug: "estonsko"
  },
  {
    code: "FI",
    name: "Finland",
    name_cs: "Finsko",
    slug: "finsko"
  },
  {
    code: "FR",
    name: "France",
    name_cs: "Francie",
    slug: "francie"
  },
  {
    code: "DE",
    name: "Germany",
    name_cs: "Německo",
    slug: "nemecko"
  },
  {
    code: "EL",
    name: "Greece",
    name_cs: "Řecko",
    slug: "recko"
  },
  {
    code: "HU",
    name: "Hungary",
    name_cs: "Maďarsko",
    slug: "madarsko"
  },
  {
    code: "IE",
    name: "Ireland",
    name_cs: "Irsko",
    slug: "irsko"
  },
  {
    code: "IT",
    name: "Italy",
    name_cs: "Itálie",
    slug: "italie"
  },
  {
    code: "LV",
    name: "Latvia",
    name_cs: "Lotyšsko",
    slug: "lotyssko"
  },
  {
    code: "LT",
    name: "Lithuania",
    name_cs: "Litva",
    slug: "litva"
  },
  {
    code: "LU",
    name: "Luxembourg",
    name_cs: "Lucembursko",
    slug: "lucembursko"
  },
  {
    code: "MT",
    name: "Malta",
    name_cs: "Malta",
    slug: "malta"
  },
  {
    code: "NL",
    name: "Netherlands",
    name_cs: "Nizozemsko",
    slug: "nizozemsko"
  },
  {
    code: "PL",
    name: "Poland",
    name_cs: "Polsko",
    slug: "polsko"
  },
  {
    code: "PT",
    name: "Portugal",
    name_cs: "Portugalsko",
    slug: "portugalsko"
  },
  {
    code: "RO",
    name: "Romania",
    name_cs: "Rumunsko",
    slug: "rumunsko"
  },
  {
    code: "SK",
    name: "Slovakia",
    name_cs: "Slovensko",
    slug: "slovensko"
  },
  {
    code: "SI",
    name: "Slovenia",
    name_cs: "Slovinsko",
    slug: "slovinsko"
  },
  {
    code: "ES",
    name: "Spain",
    name_cs: "Španělsko",
    slug: "spanelsko"
  },
  {
    code: "SE",
    name: "Sweden",
    name_cs: "Švédsko",
    slug: "svedsko"
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
   BUILD COUNTRY
--------------------------------------------------------- */

async function buildCountry(
  meta
) {
  const rawFile =
    resolve(
      rawDir,
      `population-${meta.code}.json`
    );


  const data =
    JSON.parse(
      await readFile(
        rawFile,
        "utf8"
      )
    );


  const rows =
    rowsFromJsonStat(data)
      .filter(
        row =>
          row.value !== null &&
          row.geo === meta.code &&
          row.indic_de === "JAN"
      )
      .map(
        row => ({
          year:
            Number(
              row.time
            ),

          date:
            `${row.time}-01-01`,

          value:
            Number(
              row.value
            )
        })
      )
      .filter(
        row =>
          Number.isFinite(
            row.year
          ) &&
          Number.isFinite(
            row.value
          )
      )
      .sort(
        (a, b) =>
          a.year - b.year
      );


  if (!rows.length) {
    throw new Error(
      `No JAN population observations found for ${meta.code}.`
    );
  }


  const latest =
    rows.at(-1);


  return {
    country: {
      code:
        meta.code,

      name:
        meta.name,

      name_cs:
        meta.name_cs,

      slug:
        meta.slug
    },


    dataset: {
      id:
        DATASET,

      source:
        "Eurostat",

      indicator:
        "JAN",

      indicator_label:
        "Population on 1 January - total",

      retrieved_at:
        new Date()
          .toISOString(),

      api_url:
        `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${DATASET}?lang=en&geo=${meta.code}`
    },


    latest,

    history:
      rows
  };
}


/* ---------------------------------------------------------
   GENERATE
--------------------------------------------------------- */

await mkdir(
  populationsDir,
  {
    recursive: true
  }
);


const countries = [];


console.log(
  "\n=== EUROSTAT EU27 POPULATION ===\n"
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


  const file =
    resolve(
      populationsDir,
      `${meta.code.toLowerCase()}.json`
    );


  await writeFile(
    file,
    JSON.stringify(
      country,
      null,
      2
    ) + "\n",
    "utf8"
  );


  console.log(
    `${meta.code.padEnd(2)}  ${country.latest.year}  ${country.latest.value.toLocaleString("cs-CZ")}`
  );
}


/* ---------------------------------------------------------
   SUMMARY
--------------------------------------------------------- */

const latestYears =
  [
    ...new Set(
      countries.map(
        item =>
          item.latest.year
      )
    )
  ].sort(
    (a, b) =>
      a - b
  );


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

        year:
          item.latest.year,

        date:
          item.latest.date,

        population:
          item.latest.value
      })
    )
    .sort(
      (a, b) =>
        b.population -
        a.population
    );


const populationsOutput = {
  dataset: {
    id:
      DATASET,

    source:
      "Eurostat",

    indicator:
      "JAN",

    indicator_label:
      "Population on 1 January - total",

    retrieved_at:
      new Date()
        .toISOString()
  },


  count:
    summary.length,


  latest_years:
    latestYears,


  countries:
    summary
};


await writeFile(
  populationsFile,

  JSON.stringify(
    populationsOutput,
    null,
    2
  ) + "\n",

  "utf8"
);


/* ---------------------------------------------------------
   BACKWARDS-COMPATIBLE population.json FOR CZ
--------------------------------------------------------- */

const cz =
  countries.find(
    item =>
      item.country.code ===
      "CZ"
  );


if (!cz) {
  throw new Error(
    "CZ population dataset was not generated."
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
    cz.history
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
  "Latest years:",
  latestYears.join(", ")
);

console.log(
  `\nSaved ${populationsFile}`
);

console.log(
  `Saved ${populationsDir}/`
);

console.log(
  `Saved compatibility file ${czFile}`
);