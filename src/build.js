import {
  mkdir,
  rm,
  copyFile,
  readFile,
  writeFile
} from "node:fs/promises";

import {
  existsSync
} from "node:fs";

import {
  loadEnvFile
} from "node:process";

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
    ".."
  );


/* ---------------------------------------------------------
   OPTIONAL .ENV
--------------------------------------------------------- */

const envFile =
  resolve(
    ROOT,
    ".env"
  );


if (
  existsSync(
    envFile
  )
) {
  loadEnvFile(
    envFile
  );
}


const webDir =
  resolve(
    ROOT,
    "web"
  );


const processedDir =
  resolve(
    ROOT,
    "data/processed"
  );


const processedCountriesDir =
  resolve(
    processedDir,
    "countries"
  );


const processedPopulationsDir =
  resolve(
    processedDir,
    "populations"
  );


const distDir =
  resolve(
    ROOT,
    "dist"
  );


const distDataDir =
  resolve(
    distDir,
    "data"
  );


const distCountriesDir =
  resolve(
    distDataDir,
    "countries"
  );


const distPopulationsDir =
  resolve(
    distDataDir,
    "populations"
  );


/* ---------------------------------------------------------
   CZECH SITE
--------------------------------------------------------- */

const csDir =
  resolve(
    distDir,
    "cs"
  );


const rankingDir =
  resolve(
    csDir,
    "zebricek"
  );


const compareDir =
  resolve(
    csDir,
    "porovnani"
  );


const aboutDir =
  resolve(
    csDir,
    "o-projektu"
  );


const countriesPagesDir =
  resolve(
    csDir,
    "zeme"
  );


/* ---------------------------------------------------------
   ENGLISH SITE
--------------------------------------------------------- */

const enDir =
  resolve(
    distDir,
    "en"
  );


const enRankingDir =
  resolve(
    enDir,
    "ranking"
  );


const enCompareDir =
  resolve(
    enDir,
    "compare"
  );


const enAboutDir =
  resolve(
    enDir,
    "about"
  );


const enCountriesPagesDir =
  resolve(
    enDir,
    "countries"
  );


/* ---------------------------------------------------------
   EMBEDS
--------------------------------------------------------- */

const embedDebtClockDir =
  resolve(
    distDir,
    "embed",
    "cs",
    "debt-clock"
  );


const embedDebtClockEnDir =
  resolve(
    distDir,
    "embed",
    "en",
    "debt-clock"
  );


/* ---------------------------------------------------------
   ENVIRONMENT
--------------------------------------------------------- */

const siteEnv =
  process.env.SITE_ENV ??
  "production";


const isStage =
  siteEnv ===
  "stage";


const siteUrl =
  isStage
    ? "http://prizemi.cz"
    : "https://publicdebt.eu";


/* ---------------------------------------------------------
   UMAMI
--------------------------------------------------------- */

const umamiWebsiteId =
  (
    process.env.UMAMI_WEBSITE_ID ??
    ""
  ).trim();


const umamiScriptUrl =
  (
    process.env.UMAMI_SCRIPT_URL ??
    ""
  ).trim();


const analyticsEnabled =
  !isStage &&
  Boolean(
    umamiWebsiteId
  ) &&
  Boolean(
    umamiScriptUrl
  );


function createUmamiScript() {
  if (
    !analyticsEnabled
  ) {
    return "";
  }


  return `
  <script
    defer
    src="${umamiScriptUrl}"
    data-website-id="${umamiWebsiteId}"
  ></script>
`;
}


/* ---------------------------------------------------------
   BUILD VERSION
--------------------------------------------------------- */

const buildVersion =
  Date.now()
    .toString();


console.log(
  "\n=== BUILD STATIC SITE ===\n"
);


console.log(
  `Environment: ${siteEnv}`
);


console.log(
  `Site URL:    ${siteUrl}`
);


console.log(
  "Languages:   cs, en"
);


console.log(
  `Assets:      ${buildVersion}`
);


console.log(
  `Analytics:   ${
    analyticsEnabled
      ? "Umami enabled"
      : "disabled"
  }\n`
);


/* ---------------------------------------------------------
   HTML PREPARATION
--------------------------------------------------------- */

function prepareHtml(
  html,
  {
    analytics = true
  } = {}
) {
  let result =
    html;


  /* CACHE BUSTING */

  result =
    result
      .replaceAll(
        'href="/style.css"',
        `href="/style.css?v=${buildVersion}"`
      )
      .replaceAll(
        'src="/home-en.js"',
        `src="/home-en.js?v=${buildVersion}"`
      )
      .replaceAll(
        'href="/embed.css"',
        `href="/embed.css?v=${buildVersion}"`
      )
      .replaceAll(
        'src="/app.js"',
        `src="/app.js?v=${buildVersion}"`
      )
      .replaceAll(
        'src="/ranking.js"',
        `src="/ranking.js?v=${buildVersion}"`
      )
      .replaceAll(
        'src="/country.js"',
        `src="/country.js?v=${buildVersion}"`
      )
      .replaceAll(
        'src="/compare.js"',
        `src="/compare.js?v=${buildVersion}"`
      )
      .replaceAll(
        'src="/embed-debt-clock.js"',
        `src="/embed-debt-clock.js?v=${buildVersion}"`
      );


  /* STAGE DOMAIN */

  if (
    isStage
  ) {
    result =
      result.replaceAll(
        "https://publicdebt.eu",
        siteUrl
      );
  }


  /* STAGE NOINDEX */

  if (
    isStage
  ) {
    const robotsTag =
      '<meta name="robots" content="noindex,nofollow,noarchive">';


    const robotsPattern =
      /<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/i;


    if (
      robotsPattern.test(
        result
      )
    ) {
      result =
        result.replace(
          robotsPattern,
          robotsTag
        );
    } else {
      result =
        result.replace(
          "</head>",
          `  ${robotsTag}\n</head>`
        );
    }
  }


  /*
   * Umami is injected only:
   *
   * - into production
   * - when both Umami variables are configured
   * - when analytics are enabled for this page
   */

  if (
    analytics &&
    analyticsEnabled
  ) {
    result =
      result.replace(
        "</head>",
        `${createUmamiScript()}</head>`
      );
  }


  return result;
}


/* ---------------------------------------------------------
   ROOT LANGUAGE REDIRECT
--------------------------------------------------------- */

function createRootRedirect() {
  const robots =
    isStage
      ? "noindex,nofollow,noarchive"
      : "noindex,follow";


  return `<!doctype html>
<html lang="cs">
<head>

  <meta charset="utf-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

  <meta
    name="robots"
    content="${robots}"
  >

  <meta
    http-equiv="refresh"
    content="0; url=/cs/"
  >

  <link
    rel="canonical"
    href="${siteUrl}/cs/"
  >

  <title>
    PublicDebt.eu
  </title>

  <script>
    window.location.replace("/cs/");
  </script>

</head>

<body>

  <p>
    <a href="/cs/">
      Pokračovat na českou verzi
    </a>
  </p>

</body>
</html>
`;
}


/* ---------------------------------------------------------
   LOAD EU DATA
--------------------------------------------------------- */

const eu =
  JSON.parse(
    await readFile(
      resolve(
        processedDir,
        "eu.json"
      ),
      "utf8"
    )
  );


if (
  !Array.isArray(
    eu.countries
  ) ||
  eu.countries.length !==
    27
) {
  throw new Error(
    "EU dataset does not contain 27 countries."
  );
}


for (
  const country of
  eu.countries
) {
  if (
    !country.name
  ) {
    throw new Error(
      `Missing English country name for ${country.code}.`
    );
  }


  if (
    !country.slug_en
  ) {
    throw new Error(
      `Missing English slug for ${country.code}.`
    );
  }
}


/* ---------------------------------------------------------
   CLEAN DIST
--------------------------------------------------------- */

await rm(
  distDir,
  {
    recursive: true,
    force: true
  }
);


/* ---------------------------------------------------------
   DIRECTORIES
--------------------------------------------------------- */

for (
  const dir of [
    distDataDir,
    distCountriesDir,
    distPopulationsDir,

    csDir,
    rankingDir,
    compareDir,
    aboutDir,
    countriesPagesDir,

    enDir,
    enRankingDir,
    enCompareDir,
    enAboutDir,
    enCountriesPagesDir,

    embedDebtClockDir,
    embedDebtClockEnDir
  ]
) {
  await mkdir(
    dir,
    {
      recursive: true
    }
  );
}


/* ---------------------------------------------------------
   ROOT
--------------------------------------------------------- */

await writeFile(
  resolve(
    distDir,
    "index.html"
  ),

  createRootRedirect(),

  "utf8"
);


/* ---------------------------------------------------------
   CZECH HOMEPAGE
--------------------------------------------------------- */

const homepageSource =
  await readFile(
    resolve(
      webDir,
      "index.html"
    ),
    "utf8"
  );


await writeFile(
  resolve(
    csDir,
    "index.html"
  ),

  prepareHtml(
    homepageSource
  ),

  "utf8"
);


/* ---------------------------------------------------------
   ENGLISH HOMEPAGE
--------------------------------------------------------- */

const englishHomepageSource =
  await readFile(
    resolve(
      webDir,
      "index-en.html"
    ),
    "utf8"
  );


await writeFile(
  resolve(
    enDir,
    "index.html"
  ),

  prepareHtml(
    englishHomepageSource
  ),

  "utf8"
);


/* ---------------------------------------------------------
   SHARED ASSETS
--------------------------------------------------------- */

for (
  const file of [
    "style.css",
    "embed.css",
    "favicon.svg",
    "og-image.png"
  ]
) {
  await copyFile(
    resolve(
      webDir,
      file
    ),

    resolve(
      distDir,
      file
    )
  );
}


/* ---------------------------------------------------------
   HOMEPAGE APP
--------------------------------------------------------- */

const appSource =
  await readFile(
    resolve(
      webDir,
      "app.js"
    ),
    "utf8"
  );


const productionApp =
  appSource
    .replace(
      '"/api/overview",',
      '"/data/overview.json",'
    )
    .replace(
      '"/api/eu",',
      '"/data/eu.json",'
    );


if (
  productionApp.includes(
    "/api/overview"
  ) ||
  productionApp.includes(
    "/api/eu"
  )
) {
  throw new Error(
    "Could not replace development API URLs in app.js"
  );
}


await writeFile(
  resolve(
    distDir,
    "app.js"
  ),

  productionApp,

  "utf8"
);


/* ---------------------------------------------------------
   RANKING JS
--------------------------------------------------------- */

const rankingSource =
  await readFile(
    resolve(
      webDir,
      "ranking.js"
    ),
    "utf8"
  );


const productionRanking =
  rankingSource.replace(
    '"/api/eu",',
    '"/data/eu.json",'
  );


if (
  productionRanking.includes(
    "/api/eu"
  )
) {
  throw new Error(
    "Could not replace /api/eu in ranking.js"
  );
}


await writeFile(
  resolve(
    distDir,
    "ranking.js"
  ),

  productionRanking,

  "utf8"
);


/* ---------------------------------------------------------
   CZECH RANKING PAGE
--------------------------------------------------------- */

const rankingHtmlSource =
  await readFile(
    resolve(
      webDir,
      "zebricek.html"
    ),
    "utf8"
  );


await writeFile(
  resolve(
    rankingDir,
    "index.html"
  ),

  prepareHtml(
    rankingHtmlSource
  ),

  "utf8"
);


/* ---------------------------------------------------------
   ENGLISH RANKING PAGE
--------------------------------------------------------- */

const englishRankingHtmlSource =
  await readFile(
    resolve(
      webDir,
      "zebricek-en.html"
    ),
    "utf8"
  );


await writeFile(
  resolve(
    enRankingDir,
    "index.html"
  ),

  prepareHtml(
    englishRankingHtmlSource
  ),

  "utf8"
);


/* ---------------------------------------------------------
   COMPARE JS
--------------------------------------------------------- */

const compareSource =
  await readFile(
    resolve(
      webDir,
      "compare.js"
    ),
    "utf8"
  );


const productionCompare =
  compareSource.replace(
    '"/api/eu"',
    '"/data/eu.json"'
  );


if (
  productionCompare.includes(
    "/api/eu"
  )
) {
  throw new Error(
    "Could not replace /api/eu in compare.js"
  );
}


await writeFile(
  resolve(
    distDir,
    "compare.js"
  ),

  productionCompare,

  "utf8"
);


/* ---------------------------------------------------------
   CZECH COMPARE PAGE
--------------------------------------------------------- */

const compareHtmlSource =
  await readFile(
    resolve(
      webDir,
      "porovnani.html"
    ),
    "utf8"
  );


await writeFile(
  resolve(
    compareDir,
    "index.html"
  ),

  prepareHtml(
    compareHtmlSource
  ),

  "utf8"
);


/* ---------------------------------------------------------
   ENGLISH COMPARE PAGE
--------------------------------------------------------- */

const englishCompareHtmlSource =
  await readFile(
    resolve(
      webDir,
      "porovnani-en.html"
    ),
    "utf8"
  );


await writeFile(
  resolve(
    enCompareDir,
    "index.html"
  ),

  prepareHtml(
    englishCompareHtmlSource
  ),

  "utf8"
);


/* ---------------------------------------------------------
   CZECH ABOUT PAGE
--------------------------------------------------------- */

const aboutHtmlSource =
  await readFile(
    resolve(
      webDir,
      "o-projektu.html"
    ),
    "utf8"
  );


await writeFile(
  resolve(
    aboutDir,
    "index.html"
  ),

  prepareHtml(
    aboutHtmlSource
  ),

  "utf8"
);


/* ---------------------------------------------------------
   ENGLISH ABOUT PAGE
--------------------------------------------------------- */

const englishAboutHtmlSource =
  await readFile(
    resolve(
      webDir,
      "o-projektu-en.html"
    ),
    "utf8"
  );


await writeFile(
  resolve(
    enAboutDir,
    "index.html"
  ),

  prepareHtml(
    englishAboutHtmlSource
  ),

  "utf8"
);


/* ---------------------------------------------------------
   COUNTRY JS
--------------------------------------------------------- */

await copyFile(
  resolve(
    webDir,
    "country.js"
  ),

  resolve(
    distDir,
    "country.js"
  )
);


/* ---------------------------------------------------------
   EN HOMEPAGE JS
--------------------------------------------------------- */

await copyFile(
  resolve(
    webDir,
    "home-en.js"
  ),

  resolve(
    distDir,
    "home-en.js"
  )
);


/* ---------------------------------------------------------
   CZECH DEBT CLOCK EMBED
--------------------------------------------------------- */

const embedDebtClockHtmlSource =
  await readFile(
    resolve(
      webDir,
      "embed-debt-clock.html"
    ),
    "utf8"
  );


await writeFile(
  resolve(
    embedDebtClockDir,
    "index.html"
  ),

  prepareHtml(
    embedDebtClockHtmlSource,
    {
      analytics:
        false
    }
  ),

  "utf8"
);


/* ---------------------------------------------------------
   ENGLISH DEBT CLOCK EMBED
--------------------------------------------------------- */

const embedDebtClockEnHtmlSource =
  await readFile(
    resolve(
      webDir,
      "embed-debt-clock-en.html"
    ),
    "utf8"
  );


await writeFile(
  resolve(
    embedDebtClockEnDir,
    "index.html"
  ),

  prepareHtml(
    embedDebtClockEnHtmlSource,
    {
      analytics:
        false
    }
  ),

  "utf8"
);


/* ---------------------------------------------------------
   EMBED JS
--------------------------------------------------------- */

const embedDebtClockSource =
  await readFile(
    resolve(
      webDir,
      "embed-debt-clock.js"
    ),
    "utf8"
  );


const productionEmbedDebtClock =
  embedDebtClockSource.replace(
    '"/api/overview"',
    '"/data/overview.json"'
  );


if (
  productionEmbedDebtClock.includes(
    "/api/overview"
  )
) {
  throw new Error(
    "Could not replace /api/overview in embed-debt-clock.js"
  );
}


await writeFile(
  resolve(
    distDir,
    "embed-debt-clock.js"
  ),

  productionEmbedDebtClock,

  "utf8"
);


/* ---------------------------------------------------------
   DATA
--------------------------------------------------------- */

await copyFile(
  resolve(
    processedDir,
    "overview.json"
  ),

  resolve(
    distDataDir,
    "overview.json"
  )
);


await copyFile(
  resolve(
    processedDir,
    "eu.json"
  ),

  resolve(
    distDataDir,
    "eu.json"
  )
);


/* ---------------------------------------------------------
   COUNTRY DATA
--------------------------------------------------------- */

for (
  const country of
  eu.countries
) {
  const code =
    country.code
      .toLowerCase();


  await copyFile(
    resolve(
      processedCountriesDir,
      `${code}.json`
    ),

    resolve(
      distCountriesDir,
      `${code}.json`
    )
  );


  await copyFile(
    resolve(
      processedPopulationsDir,
      `${code}.json`
    ),

    resolve(
      distPopulationsDir,
      `${code}.json`
    )
  );
}


/* ---------------------------------------------------------
   COUNTRY TEMPLATES
--------------------------------------------------------- */

const countryTemplateCs =
  await readFile(
    resolve(
      webDir,
      "country.html"
    ),
    "utf8"
  );


const countryTemplateEn =
  await readFile(
    resolve(
      webDir,
      "country-en.html"
    ),
    "utf8"
  );


/* ---------------------------------------------------------
   CZECH COUNTRY PAGES
--------------------------------------------------------- */

for (
  const country of
  eu.countries
) {
  const countryDir =
    resolve(
      countriesPagesDir,
      country.slug
    );


  await mkdir(
    countryDir,
    {
      recursive: true
    }
  );


  const canonicalCs =
    `${siteUrl}/cs/zeme/${country.slug}/`;


  const alternateEn =
    `${siteUrl}/en/countries/${country.slug_en}/`;


  let html =
    countryTemplateCs
      .replaceAll(
        "__COUNTRY_CODE__",
        country.code
      )
      .replaceAll(
        "__COUNTRY_NAME__",
        country.name_cs
      )
      .replaceAll(
        "__CANONICAL__",
        canonicalCs
      )
      .replaceAll(
        "__ALTERNATE_EN__",
        alternateEn
      );


  html =
    prepareHtml(
      html
    );


  await writeFile(
    resolve(
      countryDir,
      "index.html"
    ),

    html,

    "utf8"
  );
}


/* ---------------------------------------------------------
   ENGLISH COUNTRY PAGES
--------------------------------------------------------- */

for (
  const country of
  eu.countries
) {
  const countryDir =
    resolve(
      enCountriesPagesDir,
      country.slug_en
    );


  await mkdir(
    countryDir,
    {
      recursive: true
    }
  );


  const canonicalEn =
    `${siteUrl}/en/countries/${country.slug_en}/`;


  const alternateCs =
    `${siteUrl}/cs/zeme/${country.slug}/`;


  let html =
    countryTemplateEn
      .replaceAll(
        "__COUNTRY_CODE__",
        country.code
      )
      .replaceAll(
        "__COUNTRY_NAME__",
        country.name
      )
      .replaceAll(
        "__CANONICAL__",
        canonicalEn
      )
      .replaceAll(
        "__ALTERNATE_CS__",
        alternateCs
      );


  html =
    prepareHtml(
      html
    );


  await writeFile(
    resolve(
      countryDir,
      "index.html"
    ),

    html,

    "utf8"
  );
}


/* ---------------------------------------------------------
   ROBOTS.TXT
--------------------------------------------------------- */

const robots =
  isStage
    ? `User-agent: *
Disallow: /
`
    : `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;


await writeFile(
  resolve(
    distDir,
    "robots.txt"
  ),

  robots,

  "utf8"
);


/* ---------------------------------------------------------
   SITEMAP.XML
--------------------------------------------------------- */

if (
  !isStage
) {
  const now =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );


  const urls = [
    /* CZECH */

    `${siteUrl}/cs/`,
    `${siteUrl}/cs/zebricek/`,
    `${siteUrl}/cs/porovnani/`,
    `${siteUrl}/cs/o-projektu/`,

    ...eu.countries.map(
      country =>
        `${siteUrl}/cs/zeme/${country.slug}/`
    ),


    /* ENGLISH */

    `${siteUrl}/en/`,
    `${siteUrl}/en/ranking/`,
    `${siteUrl}/en/compare/`,
    `${siteUrl}/en/about/`,

    ...eu.countries.map(
      country =>
        `${siteUrl}/en/countries/${country.slug_en}/`
    )
  ];


  const sitemapUrls =
    urls
      .map(
        url => `
  <url>
    <loc>${url}</loc>
    <lastmod>${now}</lastmod>
  </url>`
      )
      .join(
        ""
      );


  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>${sitemapUrls}
</urlset>
`;


  await writeFile(
    resolve(
      distDir,
      "sitemap.xml"
    ),

    sitemap,

    "utf8"
  );
}


/* ---------------------------------------------------------
   COMPLETE
--------------------------------------------------------- */

console.log(
  "Created:"
);


console.log(
  "  dist/index.html → /cs/"
);


console.log(
  "  dist/cs/index.html"
);


console.log(
  "  dist/en/index.html"
);


console.log(
  "  dist/cs/zebricek/index.html"
);


console.log(
  "  dist/en/ranking/index.html"
);


console.log(
  "  dist/cs/porovnani/index.html"
);


console.log(
  "  dist/en/compare/index.html"
);


console.log(
  "  dist/cs/o-projektu/index.html"
);


console.log(
  "  dist/en/about/index.html"
);


console.log(
  `  dist/cs/zeme/* (${eu.countries.length} country pages)`
);


console.log(
  `  dist/en/countries/* (${eu.countries.length} country pages)`
);


console.log(
  "  dist/embed/cs/debt-clock/index.html"
);


console.log(
  "  dist/embed/en/debt-clock/index.html"
);


console.log(
  "  dist/app.js"
);


console.log(
  "  dist/ranking.js"
);


console.log(
  "  dist/compare.js"
);


console.log(
  "  dist/country.js"
);


console.log(
  "  dist/home-en.js"
);


console.log(
  "  dist/embed-debt-clock.js"
);


console.log(
  "  dist/style.css"
);


console.log(
  "  dist/embed.css"
);


console.log(
  "  dist/data/overview.json"
);


console.log(
  "  dist/data/eu.json"
);


console.log(
  `  dist/data/countries/* (${eu.countries.length})`
);


console.log(
  `  dist/data/populations/* (${eu.countries.length})`
);


console.log(
  "  dist/robots.txt"
);


if (
  !isStage
) {
  console.log(
    "  dist/sitemap.xml"
  );
}


console.log(
  `\n✓ Static site build completed (${siteEnv}).\n`
);