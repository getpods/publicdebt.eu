# PublicDebt.eu

PublicDebt.eu is an open-source data project focused on public debt in the European Union.

It presents public debt data for all 27 EU member states in a simple, comparable and accessible form, with a more detailed view of Czech public debt.

The project combines official public data, a Node.js data pipeline and a statically generated bilingual website.

**Live website:** https://publicdebt.eu

## Features

- public debt overview for all 27 EU member states
- Czech and English versions
- individual country profiles
- EU public debt rankings
- country comparison
- historical public debt development
- debt-to-GDP indicators
- public debt per capita
- public debt in national currency
- detailed Czech public debt overview
- Czech public debt and fiscal forecast
- estimated debt clocks for all 27 EU countries
- embeddable debt clock
- 10-year government bond yields for all 27 EU countries
- historical government bond yield development
- EU ranking by latest available 10-year government bond yield
- interactive EU debt map
- automated data fetching, transformation and validation
- static production and staging builds
- statically prerendered statistical values for important pages
- sitemap, canonical URLs and SEO metadata generation
- build and internal link validation
- optional privacy-friendly Umami analytics
- data-driven social media and Open Graph graphics

## Data sources

PublicDebt.eu uses official public data.

The main sources are:

- **Eurostat** — harmonised public debt and population data for EU countries
- **Ministry of Finance of the Czech Republic** — Czech public debt data and fiscal forecasts
- **European Central Bank (ECB)** — harmonised long-term interest rates based on government bonds with a residual maturity close to 10 years

Raw source data are downloaded by the project's import scripts and transformed into compact JSON files used by the website.

Generated data files preserve source metadata and reporting periods where appropriate so that the origin and reference period of displayed figures can be identified.

### 10-year government bond yields

PublicDebt.eu uses the ECB long-term interest rate dataset (`IRS`) for the 10-year government bond yield indicator.

The indicator represents long-term market borrowing conditions. It should not be interpreted as the average interest rate paid on a country's existing public debt.

ECB observations are monthly. Because individual country series may be updated at different times, each country uses its own latest available observation. Rankings therefore also use the latest available observation for each country rather than requiring a single common month across all 27 countries.

Historical monthly observations are retained for country charts.

## How it works

The project consists of four main stages.

### 1. Data fetching

Scripts in `src/fetch/` download source data from the original providers.

The fetch layer includes data imports for:

- Eurostat public debt data
- Eurostat population data
- Czech Ministry of Finance data
- Czech Ministry of Finance forecasts
- ECB long-term interest rates

For example:

```text
src/fetch/
├── ecb-interest-rates.js
├── eurostat.js
├── mfcr.js
├── mfcr-forecast.js
└── population.js
```

Downloaded source files are stored under:

```text
data/raw/
```

### 2. Data transformation

Scripts in `src/transform/` convert downloaded source data into the structures used by the website.

The transformation layer includes public debt, population, Czech forecast and ECB interest-rate processing.

For example:

```text
src/transform/
├── debt.js
├── eu.js
├── interest-rates.js
├── mfcr.js
├── mfcr-forecast.js
├── overview.js
└── population.js
```

Processed data are stored in:

```text
data/processed/
```

The generated EU dataset combines the indicators required for rankings, comparisons and country summaries.

ECB interest-rate history is also stored as a separate processed dataset for historical country charts.

### 3. Validation

Validation scripts in `src/validate/` check the processed datasets before deployment.

Validation covers, among other things:

- expected EU27 country coverage
- country codes and identifiers
- statistical values and periods
- population data
- ECB interest-rate series
- ECB latest observations
- interest-rate ranking consistency
- generated country data
- build output
- sitemap contents
- internal links

### 4. Static site generation

`src/build.js` generates the deployable website into:

```text
dist/
```

The resulting production site consists entirely of static files and can be served by a standard web server or CDN without a Node.js application running in production.

Important statistical values are prerendered into generated HTML where appropriate. JavaScript then provides interactive functionality such as charts, rankings, comparisons, maps and debt clocks.

Processed datasets required by the browser are published under:

```text
dist/data/
```

The frontend loads these static JSON files directly rather than depending on a production API server.

## Project structure

```text
.
├── data/
│   ├── processed/
│   └── raw/
│
├── src/
│   ├── fetch/
│   ├── server/
│   ├── social/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── presets/
│   │   ├── data.js
│   │   ├── generate.js
│   │   └── theme.js
│   ├── transform/
│   ├── validate/
│   └── build.js
│
├── web/
│   ├── app.js
│   ├── compare.js
│   ├── country.js
│   ├── home-en.js
│   ├── ranking.js
│   ├── style.css
│   └── *.html
│
├── social-output/
│
├── .env.example
├── .gitignore
├── LICENSE
├── package.json
├── package-lock.json
└── README.md
```

`social-output/` contains generated social media images and is excluded from Git.

Raw downloaded datasets and local verification files can also be excluded from Git and recreated or supplied locally when needed.

## Requirements

- Node.js 20+
- npm

## Installation

Install dependencies:

```bash
npm install
```

## Local development

Start the local development server:

```bash
npm start
```

The development server serves the frontend together with locally processed data.

Production does not require this server. The production build uses static files generated into `dist/`.

## Updating data

Run the complete data update pipeline:

```bash
npm run update
```

The update process consists of:

```text
fetch
  ↓
transform
  ↓
validate
```

The individual stages can also be run separately.

### Fetch source data

```bash
npm run fetch
```

This includes the ECB interest-rate import.

The ECB import can also be run separately:

```bash
npm run fetch:interest-rates
```

### Transform data

```bash
npm run transform
```

The ECB interest-rate transformation can also be run separately:

```bash
npm run transform:interest-rates
```

### Validate processed data

```bash
npm run validate:all
```

The ECB interest-rate validation can also be run separately:

```bash
npm run validate:interest-rates
```

## Production build

Create the static production site:

```bash
npm run build
```

The generated website is written to:

```text
dist/
```

The production build uses `https://publicdebt.eu` as the canonical site URL.

The build generates or copies the required HTML, CSS, JavaScript, processed JSON data, country pages, embeds, SEO files and other static assets.

## Staging build

Generate the staging version with:

```bash
npm run build:stage
```

The staging build uses restrictive robots directives so that it is not indexed by search engines.

## Release

Run the complete production pipeline with:

```bash
npm run release
```

This performs:

```text
fetch
  ↓
transform
  ↓
data validation
  ↓
production build
  ↓
build validation
  ↓
internal link validation
```

A staging release is available as:

```bash
npm run release:stage
```

## Validation

Several validation tools are included in the project.

### Data validation

```bash
npm run validate:all
```

### ECB interest-rate validation

```bash
npm run validate:interest-rates
```

### Country data audit

```bash
npm run audit:countries
```

### Production build validation

```bash
npm run validate:build
```

### Internal link validation

```bash
npm run validate:links
```

The validators check processed data, generated country pages, language relationships, statistical rankings, sitemap contents, metadata, expected output structure and internal links.

## Static data

The browser-facing production datasets are generated into:

```text
dist/data/
```

They include:

```text
dist/data/
├── overview.json
├── eu.json
├── interest-rates.json
├── countries/
└── populations/
```

Using static data files keeps the production architecture simple and avoids a runtime dependency on external statistical APIs.

External data providers are contacted during the data pipeline rather than during normal visits to the production website.

## SEO and static rendering

PublicDebt.eu is generated as a static bilingual website.

Country pages are generated for all 27 EU member states in both Czech and English.

Important statistical values are included directly in generated HTML rather than existing only after client-side JavaScript execution.

The production build also generates:

- canonical URLs
- language relationships
- metadata
- `robots.txt`
- `sitemap.xml`

This keeps the website usable as a static site while making important page content available directly in the generated HTML.

## Site verification files

Local webmaster verification files beginning with:

```text
web/seznam-*
```

are copied automatically to the root of `dist/` during the build when present.

These files are intentionally excluded from Git because they are local site-verification credentials.

If no matching file exists locally, the build continues normally.

## Analytics

Analytics are optional.

PublicDebt.eu supports a self-hosted Umami instance through environment variables.

Create a local `.env` file:

```env
UMAMI_WEBSITE_ID=
UMAMI_SCRIPT_URL=
```

When both values are present, the production build injects the Umami tracking script into generated HTML pages.

If either value is missing, analytics are not included.

Analytics are disabled in the staging build.

The `.env` file is excluded from Git and should never be committed. See `.env.example` for the expected configuration.

The frontend can also record selected interaction events, such as changes to ranking metrics and country chart metrics.

## Raw and processed data

Downloaded source files are stored under:

```text
data/raw/
```

Raw datasets are intentionally excluded from Git and can be recreated using the fetch scripts:

```bash
npm run fetch
```

Processed data used by the project are stored under:

```text
data/processed/
```

Keeping processed data in the repository provides a reproducible snapshot of the data used by the generated site.

## Languages

The website supports:

- Czech (`/cs/`)
- English (`/en/`)

Country pages are generated for all 27 EU member states in both languages.

Shared processed datasets are used by both language versions so that the underlying statistical values remain consistent.

## Country pages

Each EU country has a dedicated profile.

Depending on the available data, country pages include:

- total public debt
- public debt as a percentage of GDP
- public debt per capita
- population
- EU rankings
- historical public debt as a percentage of GDP
- historical total public debt in national currency
- latest 10-year government bond yield
- historical 10-year government bond yield
- estimated debt clock
- source and reporting-period information

Historical public debt can be switched between debt-to-GDP and total public debt views.

Total public debt is displayed in the country's national currency rather than being automatically converted to euros.

## Rankings

The EU ranking page supports multiple indicators, including:

- public debt as a percentage of GDP
- total public debt
- public debt per capita
- population
- 10-year government bond yield

For the bond-yield ranking, each country uses its own latest available ECB monthly observation.

## Country comparison

The comparison tool allows multiple EU countries to be viewed together.

Historical comparison charts use a common starting period and stable country colours so that series remain visually consistent while the selected countries change.

## Debt clocks

PublicDebt.eu includes estimated debt clocks for all 27 EU countries.

The debt-clock rate is derived from the change in public debt between reporting periods. It is an estimate of the rate at which public debt changed over that period, not a live feed of government borrowing transactions.

The clock shown to a visitor starts when the page is loaded and accumulates the estimated change from that point.

Negative values are supported when public debt decreased over the reference period.

## Embeds

The project includes standalone debt-clock embeds:

```text
/embed/cs/debt-clock/
/embed/en/debt-clock/
```

These can be embedded independently of the main website.

The embed supports multiple visual themes, including the PublicDebt.eu Blue & Gold theme, a dark theme and a light theme.

## Interactive EU map

The website includes an interactive EU map based on GISCO geographic data.

The map visualises public debt as a percentage of GDP and provides direct access to individual country profiles.

Only EU member states represented in the PublicDebt.eu dataset are rendered as data regions.

## Social graphics

The project includes a data-driven generator for creating consistent social media and Open Graph graphics directly from processed datasets.

Generate graphics using:

```bash
npm run social -- <preset>
```

Generated images are written to:

```text
social-output/
```

This directory is intentionally excluded from Git.

The graphics use the same visual language as the website and are rendered deterministically from SVG to PNG.

Statistical values, rankings, reporting periods and debt-clock rates are read from processed data rather than entered manually.

### Ranking graphic

Generate a public-debt ranking graphic with:

```bash
npm run social -- ranking
```

The ranking generator derives positions, values and reporting periods directly from processed EU data.

A selected country can be highlighted in place or displayed separately when it falls outside the visible ranking range.

### Debt-clock graphic

Generate a debt-clock graphic with:

```bash
npm run social -- debt-clock
```

The graphic uses the processed `debt_clock` data for the selected country.

The per-second rate is based on the change in public debt between two reporting periods rather than a live borrowing feed.

### EU map graphic

The social generator includes an EU map layout using geographic data to create a data-driven choropleth of EU member states.

The map intentionally renders EU countries represented in the dataset rather than using a generic Europe basemap.

### Open Graph image

The project includes a generated Open Graph image used for link previews and other metadata-driven sharing contexts.

### Czech budget graphic

A dedicated Czech budget layout is also available for presenting Czech fiscal data using the same design system as the rest of the project.

### Social graphics architecture

Social graphics are assembled from reusable components, layouts and presets:

```text
src/social/
├── components/
│   ├── bar-chart.js
│   ├── cta.js
│   ├── footer.js
│   ├── header.js
│   └── svg.js
├── layouts/
│   ├── cz-budget.js
│   ├── debt-clock.js
│   ├── eu-map.js
│   ├── og-image.js
│   └── ranking.js
├── presets/
├── data.js
├── generate.js
└── theme.js
```

The theme reads the main design variables from `web/style.css`, keeping generated graphics visually consistent with the website.

## Technology

The project intentionally uses a small technology stack:

- Node.js
- JavaScript
- HTML
- CSS
- JSON
- `read-excel-file` for processing Excel source data
- `sharp` for rendering generated social graphics

There is no frontend framework and no production application server is required.

The final website is generated as static files.

## Design goals

PublicDebt.eu is built around a few principles:

- use official and traceable data sources
- keep the presentation understandable for non-specialists
- make all EU countries directly comparable
- clearly distinguish observed data from forecasts and estimates
- clearly identify statistical reporting periods
- keep the production architecture simple
- minimise runtime dependencies
- avoid unnecessary live dependencies on external statistical APIs
- make data processing reproducible
- validate processed and generated output before deployment
- keep generated visual content consistent with the website
- derive published statistical graphics from processed source data rather than manually entering values

## License

The source code of PublicDebt.eu is licensed under the MIT License. See `LICENSE`.

Public-sector data used by the project is provided by its respective original sources and remains subject to their applicable terms and licences.