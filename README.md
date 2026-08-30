# PublicDebt.eu

PublicDebt.eu is an open-source data project focused on public debt in the European Union.

It presents public debt data for all 27 EU member states in a simple, comparable and accessible form, with a more detailed view of Czech public debt.

The project combines official public data, a Node.js data pipeline and a statically generated bilingual website.

**Live website:** https://publicdebt.eu

## Features

- public debt overview for all 27 EU member states
- Czech and English versions
- individual country pages
- EU debt ranking
- country comparison
- historical debt development
- debt-to-GDP indicators
- debt per capita
- detailed Czech public debt dashboard
- Czech debt forecast
- embeddable debt clock
- automated data fetching and transformation
- production and staging builds
- data, build and link validation
- sitemap and SEO metadata generation
- optional privacy-friendly Umami analytics
- data-driven social media graphics

## Data sources

PublicDebt.eu uses official public data.

The main sources are:

- **Eurostat** — harmonised public debt and population data for EU countries
- **Ministry of Finance of the Czech Republic** — Czech government debt data and forecasts

Raw source data are downloaded by the project's import scripts and transformed into compact JSON files used by the website.

Generated data files preserve source metadata where appropriate so that the origin and reference period of the displayed figures can be identified.

## How it works

The project consists of three main stages:

### 1. Data fetching

Scripts in `src/fetch/` download source data from the original providers.

```text
src/fetch/
├── eurostat.js
├── mfcr.js
├── mfcr-forecast.js
└── population.js
```

### 2. Data transformation

Scripts in `src/transform/` convert downloaded source data into the structures used by the website.

```text
src/transform/
├── debt.js
├── eu.js
├── inspect-forecast.js
├── mfcr.js
├── mfcr-forecast.js
├── overview.js
└── population.js
```

Processed data are stored in:

```text
data/processed/
```

### 3. Static site generation

`src/build.js` generates the deployable website into:

```text
dist/
```

The resulting site consists entirely of static files and can therefore be served by a standard web server or CDN without a Node.js application running in production.

Social media graphics are generated separately from the same processed data using the tools in `src/social/`.

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

The development server uses local API endpoints consumed by the frontend source files.

## Updating data

Run the complete data update pipeline:

```bash
npm run update
```

This performs:

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

### Transform data

```bash
npm run transform
```

### Validate processed data

```bash
npm run validate:all
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

The validators check processed data, generated country pages, language relationships, sitemap contents, metadata, expected output structure and internal links.

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

Keeping the processed data in the repository provides a reproducible snapshot of the data used by the generated site.

## Languages

The website supports:

- Czech (`/cs/`)
- English (`/en/`)

Country pages are generated for all 27 EU member states in both languages.

## Embeds

The project includes standalone debt-clock embeds:

```text
/embed/cs/debt-clock/
/embed/en/debt-clock/
```

These can be embedded independently of the main website.

## Social graphics

The project includes a data-driven generator for creating consistent social media graphics directly from the processed datasets.

The graphics use the same visual language as the website and are rendered deterministically from SVG to PNG. Statistical values, rankings and reporting periods are read from the processed data rather than entered manually.

### Generate a graphic

Social graphics are generated from presets stored in:

```text
src/social/presets/
```

For example, generate the Czechia-focused LinkedIn graphic with:

```bash
npm run social -- linkedin-czechia
```

The resulting PNG is written to:

```text
social-output/linkedin-czechia.png
```

A neutral EU ranking can be generated with:

```bash
npm run social -- reddit-ranking
```

which produces:

```text
social-output/reddit-ranking.png
```

### Presets

Presets define what a graphic should show while the layout and components control how it is presented.

A ranking preset can specify the metric, reporting period, number of countries, sort order and an optional highlighted country.

For example:

```json
{
  "layout": "ranking",
  "platform": "linkedin",
  "eyebrow": "EUROPEAN UNION",
  "title": "Public debt ranking",
  "subtitle": "Public debt as % of GDP",
  "metric": "debt_percent_gdp",
  "period": "latest",
  "ranking": {
    "limit": 10,
    "order": "desc"
  },
  "highlight": {
    "country": "CZ"
  },
  "cta": {
    "label": "Explore all 27 EU countries →",
    "url": "PUBLICDEBT.EU"
  },
  "source": "Eurostat"
}
```

The generator automatically derives the current statistical values, country ranks, reporting period, ranking labels and the position of the highlighted country from the processed data.

If the highlighted country is part of the displayed ranking, it is highlighted directly in the ranking. If it falls outside the displayed range, it is shown separately for context.

To create another ranking graphic, add a new JSON preset to `src/social/presets/` and run:

```bash
npm run social -- <preset-name>
```

Generated graphics are written to `social-output/` and are intentionally excluded from Git.

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
- make EU countries directly comparable
- keep the production architecture simple
- minimise runtime dependencies
- make data processing reproducible
- validate generated output before deployment
- keep generated visual content consistent with the website
- derive published statistical graphics from source data rather than manually entering values

## License

The source code of PublicDebt.eu is licensed under the MIT License. See `LICENSE`.

Public-sector data used by the project is provided by its respective original sources and remains subject to their applicable terms and licences.