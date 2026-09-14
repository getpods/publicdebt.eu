import fs from "node:fs";
import path from "node:path";

const EU_DATA_PATH =
  path.resolve(
    "data/processed/eu.json"
  );

const COUNTRIES_DATA_PATH =
  path.resolve(
    "data/processed/countries.json"
  );

const INTEREST_RATES_DATA_PATH =
  path.resolve(
    "data/processed/interest-rates.json"
  );

const COUNTRY_CODE_ALIASES = {
  GR: "EL"
};

function normalizeCountryCode(
  code
) {
  if (!code) {
    return null;
  }

  const requestedCode =
    String(code)
      .toUpperCase();

  return (
    COUNTRY_CODE_ALIASES[
      requestedCode
    ] ??
    requestedCode
  );
}

export function loadEuData() {
  return JSON.parse(
    fs.readFileSync(
      EU_DATA_PATH,
      "utf8"
    )
  );
}

export function loadCountriesData() {
  return JSON.parse(
    fs.readFileSync(
      COUNTRIES_DATA_PATH,
      "utf8"
    )
  );
}

export function loadInterestRatesData() {
  return JSON.parse(
    fs.readFileSync(
      INTEREST_RATES_DATA_PATH,
      "utf8"
    )
  );
}

export function getCountries(
  data
) {
  if (
    !Array.isArray(
      data.countries
    )
  ) {
    throw new Error(
      "eu.json does not contain countries."
    );
  }

  return data.countries;
}

export function getMetricValue(
  country,
  metric
) {
  switch (metric) {
    case "debt_percent_gdp":
      return country.debt
        ?.percent_gdp;

    case "debt_euro":
      return country.debt
        ?.euro;

    case "debt_per_capita":
      return country
        .debt_per_capita;

    case "population":
      return (
        country.population
          ?.value ??
        country.population
      );

    default:
      throw new Error(
        `Unknown social metric: ${metric}`
      );
  }
}

export function getPeriod(
  data,
  metric
) {
  if (
    metric ===
      "debt_percent_gdp" ||
    metric ===
      "debt_euro" ||
    metric ===
      "debt_per_capita"
  ) {
    return (
      data.periods
        ?.debt
        ?.at(-1) ??
      null
    );
  }

  if (
    metric ===
    "population"
  ) {
    return String(
      data.periods
        ?.population
        ?.at(-1) ??
      ""
    );
  }

  return null;
}

export function getRanking({
  data,
  metric,
  order = "desc",
  limit
}) {
  const countries =
    getCountries(data)
      .map(
        country => ({
          ...country,
          socialValue:
            getMetricValue(
              country,
              metric
            )
        })
      )
      .filter(
        country =>
          Number.isFinite(
            country.socialValue
          )
      )
      .sort(
        (a, b) =>
          order === "asc"
            ? a.socialValue -
              b.socialValue
            : b.socialValue -
              a.socialValue
      )
      .map(
        (
          country,
          index
        ) => ({
          ...country,
          socialRank:
            index + 1
        })
      );

  if (
    limit == null
  ) {
    return countries;
  }

  return countries.slice(
    0,
    limit
  );
}

export function findCountry(
  data,
  code
) {
  const normalizedCode =
    normalizeCountryCode(
      code
    );

  if (!normalizedCode) {
    return null;
  }

  return getCountries(
    data
  ).find(
    country =>
      country.code ===
      normalizedCode
  );
}

export function findCountryDetails(
  countriesData,
  code
) {
  const normalizedCode =
    normalizeCountryCode(
      code
    );

  if (!normalizedCode) {
    return null;
  }

  const countries =
    Array.isArray(
      countriesData
    )
      ? countriesData
      : countriesData
          ?.countries;

  if (
    !Array.isArray(
      countries
    )
  ) {
    throw new Error(
      "countries.json does not contain a country array."
    );
  }

  return (
    countries.find(
      country =>
        country.code ===
        normalizedCode
    ) ??
    null
  );
}
