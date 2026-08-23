import {
  access,
  readFile,
  readdir
} from "node:fs/promises";

import {
  resolve,
  dirname
} from "node:path";

import {
  fileURLToPath
} from "node:url";


const siteEnv =
  process.env.SITE_ENV ??
  "production";


const isStage =
  siteEnv ===
  "stage";


const ROOT =
  resolve(
    dirname(
      fileURLToPath(
        import.meta.url
      )
    ),
    "../.."
  );


const distDir =
  resolve(
    ROOT,
    "dist"
  );


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function assert(
  condition,
  message
) {
  if (
    !condition
  ) {
    throw new Error(
      message
    );
  }
}


async function exists(
  file
) {
  try {
    await access(
      file
    );

    return true;
  } catch {
    return false;
  }
}


async function assertFile(
  relativePath
) {
  const file =
    resolve(
      distDir,
      relativePath
    );


  assert(
    await exists(
      file
    ),
    `Missing dist/${relativePath}`
  );
}


async function readDist(
  relativePath
) {
  return readFile(
    resolve(
      distDir,
      relativePath
    ),
    "utf8"
  );
}


/* ---------------------------------------------------------
   CORE FILES
--------------------------------------------------------- */

const requiredFiles = [
  "index.html",

  /* CS */

  "cs/index.html",
  "cs/zebricek/index.html",
  "cs/porovnani/index.html",
  "cs/o-projektu/index.html",

  /* EN */

  "en/index.html",
  "en/ranking/index.html",
  "en/compare/index.html",
  "en/about/index.html",

  /* EMBEDS */

  "embed/cs/debt-clock/index.html",
  "embed/en/debt-clock/index.html",

  /* JS */

  "app.js",
  "ranking.js",
  "compare.js",
  "country.js",
  "embed-debt-clock.js",
  "home-en.js",

  /* ASSETS */

  "style.css",
  "embed.css",
  "favicon.svg",
  "favicon.ico",
  "og-image.png",

  /* SYSTEM */

  "robots.txt",

  /* DATA */

  "data/eu.json",
  "data/overview.json",

  ...(
    isStage
      ? []
      : [
          "sitemap.xml"
        ]
  )
];


console.log(
  "\n=== VALIDATE BUILD ===\n"
);


for (
  const file of
  requiredFiles
) {
  await assertFile(
    file
  );


  console.log(
    `OK  ${file}`
  );
}


/* ---------------------------------------------------------
   EU DATA
--------------------------------------------------------- */

const eu =
  JSON.parse(
    await readDist(
      "data/eu.json"
    )
  );


assert(
  Array.isArray(
    eu.countries
  ),
  "dist/data/eu.json does not contain countries"
);


assert(
  eu.countries.length ===
    27,
  `Expected 27 countries, found ${eu.countries.length}`
);


for (
  const country of
  eu.countries
) {
  assert(
    country.slug,
    `Missing Czech slug for ${country.code}`
  );


  assert(
    country.slug_en,
    `Missing English slug for ${country.code}`
  );


  assert(
    country.name_cs,
    `Missing Czech name for ${country.code}`
  );


  assert(
    country.name,
    `Missing English name for ${country.code}`
  );
}


/* ---------------------------------------------------------
   COUNTRY FILES + PAGES
--------------------------------------------------------- */

console.log(
  "\nCountry pages:"
);


for (
  const country of
  eu.countries
) {
  const code =
    country.code
      .toLowerCase();


  const pageCs =
    `cs/zeme/${country.slug}/index.html`;


  const pageEn =
    `en/countries/${country.slug_en}/index.html`;


  const data =
    `data/countries/${code}.json`;


  const population =
    `data/populations/${code}.json`;


  await assertFile(
    pageCs
  );


  await assertFile(
    pageEn
  );


  await assertFile(
    data
  );


  await assertFile(
    population
  );


  console.log(
    `OK  ${country.code}  /cs/zeme/${country.slug}/  ↔  /en/countries/${country.slug_en}/`
  );
}


/* ---------------------------------------------------------
   COUNTRY HREFLANG
--------------------------------------------------------- */

for (
  const country of
  eu.countries
) {
  const csHtml =
    await readDist(
      `cs/zeme/${country.slug}/index.html`
    );


  const enHtml =
    await readDist(
      `en/countries/${country.slug_en}/index.html`
    );


  const expectedCs =
    `https://publicdebt.eu/cs/zeme/${country.slug}/`;


  const expectedEn =
    `https://publicdebt.eu/en/countries/${country.slug_en}/`;


  if (
    !isStage
  ) {
    assert(
      csHtml.includes(
        expectedCs
      ),
      `Missing Czech canonical/alternate for ${country.code}`
    );


    assert(
      csHtml.includes(
        expectedEn
      ),
      `Missing English alternate on Czech page for ${country.code}`
    );


    assert(
      enHtml.includes(
        expectedEn
      ),
      `Missing English canonical/alternate for ${country.code}`
    );


    assert(
      enHtml.includes(
        expectedCs
      ),
      `Missing Czech alternate on English page for ${country.code}`
    );
  }


  assert(
    csHtml.includes(
      'lang="cs"'
    ),
    `Wrong language on Czech page for ${country.code}`
  );


  assert(
    enHtml.includes(
      'lang="en"'
    ),
    `Wrong language on English page for ${country.code}`
  );
}


console.log(
  "OK  country hreflang pairs"
);


/* ---------------------------------------------------------
   LANGUAGE PAGES
--------------------------------------------------------- */

const languagePages = [
  {
    cs:
      "cs/index.html",

    en:
      "en/index.html",

    csUrl:
      "/cs/",

    enUrl:
      "/en/"
  },

  {
    cs:
      "cs/zebricek/index.html",

    en:
      "en/ranking/index.html",

    csUrl:
      "/cs/zebricek/",

    enUrl:
      "/en/ranking/"
  },

  {
    cs:
      "cs/porovnani/index.html",

    en:
      "en/compare/index.html",

    csUrl:
      "/cs/porovnani/",

    enUrl:
      "/en/compare/"
  },

  {
    cs:
      "cs/o-projektu/index.html",

    en:
      "en/about/index.html",

    csUrl:
      "/cs/o-projektu/",

    enUrl:
      "/en/about/"
  }
];


for (
  const pair of
  languagePages
) {
  const cs =
    await readDist(
      pair.cs
    );


  const en =
    await readDist(
      pair.en
    );


  assert(
    cs.includes(
      'lang="cs"'
    ),
    `Missing lang="cs" in ${pair.cs}`
  );


  assert(
    en.includes(
      'lang="en"'
    ),
    `Missing lang="en" in ${pair.en}`
  );


  assert(
    cs.includes(
      pair.enUrl
    ),
    `Missing EN language link in ${pair.cs}`
  );


  assert(
    en.includes(
      pair.csUrl
    ),
    `Missing CS language link in ${pair.en}`
  );
}


console.log(
  "OK  CS/EN page pairs"
);


/* ---------------------------------------------------------
   SITEMAP
--------------------------------------------------------- */

if (
  !isStage
) {
  const sitemap =
    await readDist(
      "sitemap.xml"
    );


  const expectedUrls = [
    /* CS */

    "https://publicdebt.eu/cs/",
    "https://publicdebt.eu/cs/zebricek/",
    "https://publicdebt.eu/cs/porovnani/",
    "https://publicdebt.eu/cs/o-projektu/",

    ...eu.countries.map(
      country =>
        `https://publicdebt.eu/cs/zeme/${country.slug}/`
    ),


    /* EN */

    "https://publicdebt.eu/en/",
    "https://publicdebt.eu/en/ranking/",
    "https://publicdebt.eu/en/compare/",
    "https://publicdebt.eu/en/about/",

    ...eu.countries.map(
      country =>
        `https://publicdebt.eu/en/countries/${country.slug_en}/`
    )
  ];


  for (
    const url of
    expectedUrls
  ) {
    assert(
      sitemap.includes(
        `<loc>${url}</loc>`
      ),
      `Missing sitemap URL: ${url}`
    );
  }


  const sitemapUrlCount =
    (
      sitemap.match(
        /<url>/g
      ) ??
      []
    ).length;


  assert(
    sitemapUrlCount ===
      62,
    `Expected 62 sitemap URLs, found ${sitemapUrlCount}`
  );


  console.log(
    `OK  sitemap contains ${sitemapUrlCount} URLs`
  );
} else {
  console.log(
    "OK  sitemap skipped on stage"
  );
}


/* ---------------------------------------------------------
   ROBOTS
--------------------------------------------------------- */

const robots =
  await readDist(
    "robots.txt"
  );


if (
  isStage
) {
  assert(
    robots.includes(
      "Disallow: /"
    ),
    "Stage robots.txt must disallow crawling"
  );


  console.log(
    "OK  stage robots.txt"
  );
} else {
  assert(
    robots.includes(
      "Allow: /"
    ),
    "robots.txt does not allow crawling"
  );


  assert(
    robots.includes(
      "https://publicdebt.eu/sitemap.xml"
    ),
    "robots.txt has incorrect sitemap URL"
  );


  console.log(
    "OK  robots.txt"
  );
}


/* ---------------------------------------------------------
   EMBEDS
--------------------------------------------------------- */

const embedCs =
  await readDist(
    "embed/cs/debt-clock/index.html"
  );


const embedEn =
  await readDist(
    "embed/en/debt-clock/index.html"
  );


assert(
  embedCs.includes(
    "noindex,follow"
  ) ||
  (
    isStage &&
    embedCs.includes(
      "noindex,nofollow,noarchive"
    )
  ),
  "Czech embed has incorrect robots policy"
);


assert(
  embedEn.includes(
    "noindex,follow"
  ) ||
  (
    isStage &&
    embedEn.includes(
      "noindex,nofollow,noarchive"
    )
  ),
  "English embed has incorrect robots policy"
);


console.log(
  "OK  embeds are non-indexable"
);


/* ---------------------------------------------------------
   DIRECTORY COUNTS
--------------------------------------------------------- */

const countryPageDirectoriesCs =
  await readdir(
    resolve(
      distDir,
      "cs/zeme"
    )
  );


const countryPageDirectoriesEn =
  await readdir(
    resolve(
      distDir,
      "en/countries"
    )
  );


assert(
  countryPageDirectoriesCs.length ===
    27,
  `Expected 27 Czech country directories, found ${countryPageDirectoriesCs.length}`
);


assert(
  countryPageDirectoriesEn.length ===
    27,
  `Expected 27 English country directories, found ${countryPageDirectoriesEn.length}`
);


console.log(
  "OK  27 CS + 27 EN country directories"
);


/* ---------------------------------------------------------
   DATA FRESHNESS
--------------------------------------------------------- */

const overview =
  JSON.parse(
    await readDist(
      "data/overview.json"
    )
  );


assert(
  eu.generated_at,
  "dist/data/eu.json does not contain generated_at"
);


assert(
  overview.generated_at,
  "dist/data/overview.json does not contain generated_at"
);


const euGeneratedAt =
  new Date(
    eu.generated_at
  );


const overviewGeneratedAt =
  new Date(
    overview.generated_at
  );


assert(
  !Number.isNaN(
    euGeneratedAt.getTime()
  ),
  `Invalid generated_at in eu.json: ${eu.generated_at}`
);


assert(
  !Number.isNaN(
    overviewGeneratedAt.getTime()
  ),
  `Invalid generated_at in overview.json: ${overview.generated_at}`
);


const euGeneratedDay =
  euGeneratedAt
    .toISOString()
    .slice(
      0,
      10
    );


const overviewGeneratedDay =
  overviewGeneratedAt
    .toISOString()
    .slice(
      0,
      10
    );


assert(
  euGeneratedDay ===
    overviewGeneratedDay,
  `Data freshness mismatch: eu.json=${euGeneratedDay}, overview.json=${overviewGeneratedDay}`
);


console.log(
  `OK  data freshness ${euGeneratedDay}`
);


/* ---------------------------------------------------------
   COUNTRY DATA COUNT
--------------------------------------------------------- */

const countryDataFiles =
  (
    await readdir(
      resolve(
        distDir,
        "data/countries"
      )
    )
  )
    .filter(
      file =>
        file.endsWith(
          ".json"
        )
    );


assert(
  countryDataFiles.length ===
    27,
  `Expected 27 country data files, found ${countryDataFiles.length}`
);


/* ---------------------------------------------------------
   POPULATION DATA COUNT
--------------------------------------------------------- */

const populationDataFiles =
  (
    await readdir(
      resolve(
        distDir,
        "data/populations"
      )
    )
  )
    .filter(
      file =>
        file.endsWith(
          ".json"
        )
    );


assert(
  populationDataFiles.length ===
    27,
  `Expected 27 population data files, found ${populationDataFiles.length}`
);


/* ---------------------------------------------------------
   PLACEHOLDERS
--------------------------------------------------------- */

const generatedHtmlFiles = [
  "cs/index.html",
  "cs/zebricek/index.html",
  "cs/porovnani/index.html",
  "cs/o-projektu/index.html",

  "en/index.html",
  "en/ranking/index.html",
  "en/compare/index.html",
  "en/about/index.html",

  ...eu.countries.flatMap(
    country => [
      `cs/zeme/${country.slug}/index.html`,
      `en/countries/${country.slug_en}/index.html`
    ]
  )
];


for (
  const relativePath of
  generatedHtmlFiles
) {
  const html =
    await readDist(
      relativePath
    );


  assert(
    !html.includes(
      "__COUNTRY_"
    ),
    `Unresolved country placeholder in ${relativePath}`
  );


  assert(
    !html.includes(
      "__CANONICAL__"
    ),
    `Unresolved canonical placeholder in ${relativePath}`
  );


  assert(
    !html.includes(
      "__ALTERNATE_"
    ),
    `Unresolved alternate placeholder in ${relativePath}`
  );
}


console.log(
  "OK  no unresolved HTML placeholders"
);


/* ---------------------------------------------------------
   COMPLETE
--------------------------------------------------------- */

console.log(
  "\n✓ Production build is structurally valid.\n"
);