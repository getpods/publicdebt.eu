import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function validateDataConsistency(directory) {
  const read = async file => JSON.parse(await readFile(join(directory, file), "utf8"));
  const [eu, overview] = await Promise.all([read("eu.json"), read("overview.json")]);
  assert.equal(eu.count, 27, "EU dataset must contain 27 countries");
  assert.equal(eu.countries.length, 27, "EU dataset must contain 27 countries");
  assert.equal(new Set(eu.countries.map(country => country.code)).size, 27,
    "EU dataset contains duplicate countries");

  for (const country of eu.countries) {
    assert.match(country.code, /^[A-Z]{2}$/, "Invalid country code");
    const code = country.code.toLowerCase();
    const [debt, population] = await Promise.all([
      read(`countries/${code}.json`), read(`populations/${code}.json`)
    ]);
    const same = (actual, expected, field) => assert.deepEqual(actual, expected,
      `${country.code}: EU and country datasets differ (${field})`);
    same(debt.country.code, country.code, "country code");
    same(population.country.code, country.code, "population country code");
    same(country.debt.period, debt.latest.period, "debt period");
    same(country.debt.percent_gdp, debt.latest.debt.percent_gdp, "debt/GDP");
    same(country.debt.euro_million, debt.latest.debt.euro, "euro debt");
    same(country.debt.euro, debt.latest.debt.euro * 1_000_000, "euro debt units");
    same(country.population, population.latest, "population");
    same(country.debt_per_capita.eur,
      Math.round(country.debt.euro / population.latest.value), "debt per capita");

    if (country.code === "CZ") {
      same(overview.latest.period, debt.latest.period, "overview period");
      same(overview.latest.debt.czk, debt.latest.debt.national_currency * 1_000_000,
        "overview CZK debt");
      same(overview.latest.debt.percent_gdp, debt.latest.debt.percent_gdp,
        "overview debt/GDP");
      same(overview.population, population.latest, "overview population");
      same(overview.debt_clock.period_from, debt.debt_clock.period_from,
        "overview clock period_from");
      same(overview.debt_clock.period_to, debt.debt_clock.period_to,
        "overview clock period_to");
      same(overview.debt_clock.change_czk, debt.debt_clock.change,
        "overview clock change");
      same(overview.debt_clock.czk_per_second, debt.debt_clock.amount_per_second,
        "overview clock rate");
    }
  }

  const unique = values => [...new Set(values)].sort();
  assert.deepEqual(unique(eu.periods.debt), unique(eu.countries.map(c => c.debt.period)),
    "EU debt periods do not match country data");
  assert.deepEqual(unique(eu.periods.population), unique(eu.countries.map(c => c.population.year)),
    "EU population years do not match country data");
  assert.deepEqual(unique(eu.periods.interest_rate), unique(eu.countries.map(c => c.interest_rate.period)),
    "EU interest-rate periods do not match country data");
}
