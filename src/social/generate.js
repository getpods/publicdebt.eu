import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

import {
  getTheme
} from "./theme.js";

import {
  getPeriod,
  loadEuData,
  loadCountriesData,
  loadInterestRatesData
} from "./data.js";

import {
  renderRanking
} from "./layouts/ranking.js";

import {
  renderDebtClock
} from "./layouts/debt-clock.js";

import {
  renderEuMap
} from "./layouts/eu-map.js";

import {
  renderOgImage
} from "./layouts/og-image.js";

import {
  renderCzBudget
} from "./layouts/cz-budget.js";

import {
  renderBondYields
} from "./layouts/bond-yields.js";

const presetName =
  process.argv[2];

if (!presetName) {
  console.error(
    "Usage: npm run social -- <preset>"
  );

  console.error(
    "Example: npm run social -- ranking"
  );

  process.exit(1);
}

const presetPath =
  path.resolve(
    "src/social/presets",
    `${presetName}.json`
  );

if (
  !fs.existsSync(
    presetPath
  )
) {
  throw new Error(
    `Social preset not found: ${presetPath}`
  );
}

const preset =
  JSON.parse(
    fs.readFileSync(
      presetPath,
      "utf8"
    )
  );

const theme =
  getTheme();

const data =
  loadEuData();

const countriesData =
  loadCountriesData();

const interestRatesData =
  loadInterestRatesData();

const period =
  preset.period ===
  "latest"
    ? getPeriod(
        data,
        preset.metric
      )
    : preset.period;

let svg;

switch (
  preset.layout
) {
  case "ranking":
    svg =
      renderRanking({
        theme,
        data,
        preset,
        period
      });
    break;

  case "debt-clock":
    svg =
      renderDebtClock({
        theme,
        data,
        countriesData,
        preset
      });
    break;

  case "eu-map":
    svg =
      await renderEuMap({
        theme,
        data,
        preset,
        period
      });
    break;

  case "og-image":
    svg =
      await renderOgImage({
        theme,
        data,
        preset,
        period
      });
    break;

  case "cz-budget":
    svg =
      await renderCzBudget({
        theme,
        preset
      });
    break;

  case "bond-yields":
    svg =
      renderBondYields({
        theme,
        data,
        interestRatesData,
        preset
      });
    break;

  default:
    throw new Error(
      `Unsupported social layout: ${preset.layout}`
    );
}

const outputDir =
  path.resolve(
    "social-output"
  );

fs.mkdirSync(
  outputDir,
  {
    recursive: true
  }
);

const outputFile =
  path.join(
    outputDir,
    `${presetName}.png`
  );

await sharp(
  Buffer.from(svg)
)
  .png()
  .toFile(
    outputFile
  );

console.log(
  `Social graphic created: ${outputFile}`
);

console.log(
  `${theme.sizes[preset.platform].width} × ${theme.sizes[preset.platform].height}px`
);

if (period) {
  console.log(
    `Period: ${period}`
  );
}
