const language =
  document.body.dataset
    .language === "en"
    ? "en"
    : "cs";


const locale =
  language === "en"
    ? "en-GB"
    : "cs-CZ";


const text = {
  cs: {
    rank:
      "Pořadí",

    country:
      "Země",

    debtPeriod:
      (
        debt,
        population
      ) =>
        `Dluh: ${debt} · populace: ${population}`,

    updated:
      value =>
        `Data zpracována ${value}`,

    error:
      "Data se nepodařilo načíst.",

    countryName:
      country =>
        country.name_cs,

    countryUrl:
      country =>
        `/cs/zeme/${country.slug}/`,

    sortLocale:
      "cs",

    billionEuro:
      value =>
        `${formatNumber(value)} mld. €`,

    metrics: {
      gdp: {
        label:
          "Dluh / HDP",

        description:
          "Země jsou seřazeny podle výše veřejného dluhu vůči HDP."
      },

      total: {
        label:
          "Celkový dluh",

        description:
          "Země jsou seřazeny podle celkového veřejného dluhu v eurech."
      },

      population: {
        label:
          "Počet obyvatel",

        description:
          "Země jsou seřazeny podle počtu obyvatel."
      },

      "per-capita": {
        label:
          "Dluh na obyvatele",

        description:
          "Statistický přepočet veřejného dluhu na jednoho obyvatele."
      }
    }
  },


  en: {
    rank:
      "Rank",

    country:
      "Country",

    debtPeriod:
      (
        debt,
        population
      ) =>
        `Debt: ${debt} · population: ${population}`,

    updated:
      value =>
        `Data processed ${value}`,

    error:
      "Data could not be loaded.",

    countryName:
      country =>
        country.name,

    countryUrl:
      country =>
        `/en/countries/${country.slug_en}/`,

    sortLocale:
      "en",

    billionEuro:
      value =>
        `€${formatNumber(value)} bn`,

    metrics: {
      gdp: {
        label:
          "Debt / GDP",

        description:
          "Countries are ranked by their public debt-to-GDP ratio."
      },

      total: {
        label:
          "Total debt",

        description:
          "Countries are ranked by total public debt in euros."
      },

      population: {
        label:
          "Population",

        description:
          "Countries are ranked by population."
      },

      "per-capita": {
        label:
          "Debt per capita",

        description:
          "Statistical calculation of public debt per resident."
      }
    }
  }
};


const t =
  text[language];


const formatNumber = value =>
  new Intl.NumberFormat(
    locale,
    {
      maximumFractionDigits: 1
    }
  ).format(
    value
  );


const formatInteger = value =>
  new Intl.NumberFormat(
    locale,
    {
      maximumFractionDigits: 0
    }
  ).format(
    Math.round(
      value
    )
  );


const formatDate = value =>
  new Intl.DateTimeFormat(
    locale,
    {
      dateStyle: "medium"
    }
  ).format(
    new Date(
      value
    )
  );


async function loadEU() {
  const response =
    await fetch(
      "/api/eu",
      {
        cache:
          "no-store"
      }
    );


  if (
    !response.ok
  ) {
    throw new Error(
      `Data error: ${response.status}`
    );
  }


  return response.json();
}


/* ---------------------------------------------------------
   METRICS
--------------------------------------------------------- */

const metrics = {
  gdp: {
    get label() {
      return t.metrics
        .gdp
        .label;
    },

    get description() {
      return t.metrics
        .gdp
        .description;
    },

    getValue:
      country =>
        country.debt
          .percent_gdp,

    format:
      value =>
        `${formatNumber(
          value
        )} %`,

    rank:
      country =>
        country.rank
          .debt_percent_gdp
  },


  total: {
    get label() {
      return t.metrics
        .total
        .label;
    },

    get description() {
      return t.metrics
        .total
        .description;
    },

    getValue:
      country =>
        country.debt.euro /
        1_000_000_000,

    format:
      value =>
        t.billionEuro(
          value
        ),

    rank:
      country =>
        country.rank
          .debt_euro
  },


  population: {
    get label() {
      return t.metrics
        .population
        .label;
    },

    get description() {
      return t.metrics
        .population
        .description;
    },

    getValue:
      country =>
        country.population
          .value,

    format:
      value =>
        formatInteger(
          value
        ),

    rank:
      country =>
        country.rank
          .population
  },


  "per-capita": {
    get label() {
      return t.metrics[
        "per-capita"
      ].label;
    },

    get description() {
      return t.metrics[
        "per-capita"
      ].description;
    },

    getValue:
      country =>
        country.debt_per_capita
          .eur,

    format:
      value =>
        language === "en"
          ? `€${formatInteger(
              value
            )}`
          : `${formatInteger(
              value
            )} €`,

    rank:
      country =>
        country.rank
          .debt_per_capita_eur
  }
};


/* ---------------------------------------------------------
   RANKING
--------------------------------------------------------- */

function renderRanking(
  data,
  metricId
) {
  const metric =
    metrics[
      metricId
    ];


  const countries =
    [
      ...data.countries
    ]
      .sort(
        (
          a,
          b
        ) =>
          metric.rank(
            a
          ) -
          metric.rank(
            b
          )
      );


  const table =
    document.querySelector(
      "#ranking-table"
    );


  const description =
    document.querySelector(
      "#ranking-description"
    );


  if (
    !table ||
    !description
  ) {
    return;
  }


  description.textContent =
    metric.description;


  table.innerHTML =
    "";


  const header =
    document.createElement(
      "div"
    );


  header.className =
    "ranking-row ranking-row-header";


  header.innerHTML = `
    <span>
      ${t.rank}
    </span>

    <span>
      ${t.country}
    </span>

    <span>
      ${metric.label}
    </span>
  `;


  table.appendChild(
    header
  );


  for (
    const country of
    countries
  ) {
    const row =
      document.createElement(
        "a"
      );


    row.className =
      "ranking-row";


    if (
      language === "cs" &&
      country.code === "CZ"
    ) {
      row.classList.add(
        "is-czechia"
      );
    }


    row.href =
      t.countryUrl(
        country
      );


    const rank =
      metric.rank(
        country
      );


    const value =
      metric.getValue(
        country
      );


    row.innerHTML = `
      <span class="ranking-position">
        ${rank}.
      </span>

      <span class="ranking-country">

        <strong>
          ${t.countryName(
            country
          )}
        </strong>

        <small>
          ${country.code}
        </small>

      </span>

      <span class="ranking-value">
        ${metric.format(
          value
        )}
      </span>
    `;


    table.appendChild(
      row
    );
  }
}


/* ---------------------------------------------------------
   COUNTRY DIRECTORY
--------------------------------------------------------- */

function renderCountriesDirectory(
  data
) {
  const container =
    document.querySelector(
      "#countries-directory"
    );


  if (
    !container
  ) {
    return;
  }


  const countries =
    [
      ...data.countries
    ]
      .sort(
        (
          a,
          b
        ) =>
          t.countryName(
            a
          ).localeCompare(
            t.countryName(
              b
            ),
            t.sortLocale
          )
      );


  container.innerHTML =
    "";


  for (
    const country of
    countries
  ) {
    const link =
      document.createElement(
        "a"
      );


    link.className =
      "country-directory-link";


    link.href =
      t.countryUrl(
        country
      );


    link.innerHTML = `
      <span>
        ${t.countryName(
          country
        )}
      </span>

      <small>
        ${country.code}
      </small>

      <strong aria-hidden="true">
        →
      </strong>
    `;


    container.appendChild(
      link
    );
  }
}


/* ---------------------------------------------------------
   START
--------------------------------------------------------- */

loadEU()
  .then(
    data => {
      const period =
        data.periods.debt.length ===
        1
          ? data.periods
              .debt[0]
          : data.periods
              .debt
              .join(
                ", "
              );


      const populationPeriod =
        data.periods.population
          .join(
            ", "
          );


      const periodElement =
        document.querySelector(
          "#ranking-period"
        );


      const updatedElement =
        document.querySelector(
          "#ranking-updated"
        );


      if (
        periodElement
      ) {
        periodElement.textContent =
          t.debtPeriod(
            period,
            populationPeriod
          );
      }


      if (
        updatedElement
      ) {
        updatedElement.textContent =
          t.updated(
            formatDate(
              data.generated_at
            )
          );
      }


      let currentMetric =
        "gdp";


      renderRanking(
        data,
        currentMetric
      );


      renderCountriesDirectory(
        data
      );


      document
        .querySelectorAll(
          ".ranking-control"
        )
        .forEach(
          button => {
            button.addEventListener(
              "click",
              () => {
                currentMetric =
                  button.dataset
                    .ranking;


                document
                  .querySelectorAll(
                    ".ranking-control"
                  )
                  .forEach(
                    item =>
                      item.classList
                        .remove(
                          "is-active"
                        )
                  );


                button.classList.add(
                  "is-active"
                );


                renderRanking(
                  data,
                  currentMetric
                );
              }
            );
          }
        );
    }
  )
  .catch(
    error => {
      console.error(
        error
      );


      const table =
        document.querySelector(
          "#ranking-table"
        );


      if (
        table
      ) {
        table.innerHTML = `
          <p class="loading">
            ${t.error}
          </p>
        `;
      }
    }
  );