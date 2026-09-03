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
    urlParam:
      "zeme",

    defaultCodes: [
      "CZ",
      "DE"
    ],

    countryName:
      country =>
        country.name_cs,

    countryUrl:
      country =>
        `/cs/zeme/${country.slug}/`,

    sortLocale:
      "cs",

    selectAtLeastTwo:
      "Vyberte alespoň dvě země pro zobrazení grafu.",

    selectOneMore:
      "Vyberte ještě jednu zemi pro zobrazení grafu.",

    selected:
      (count, maximum) =>
        `Vybrány ${count} ze ${maximum} možných zemí.`,

    selectedMaximum:
      maximum =>
        `Vybráno ${maximum} ze ${maximum} možných zemí.`,

    chartSelectTwo:
      "Vyberte alespoň dvě země.",

    chartNoData:
      "Pro porovnání nejsou k dispozici data.",

    year:
      "Rok",

    debtGdp:
      "Dluh / HDP (%)",

    euRank:
      rank =>
        `${rank}. místo v EU`,

    perCapita:
      value =>
        `${formatInteger(value)} € na obyvatele`,

    updated:
      value =>
        `Data zpracována ${value}`,

    errorEyebrow:
      "CHYBA",

    errorTitle:
      "Data se nepodařilo načíst."
  },


  en: {
    urlParam:
      "countries",

    defaultCodes: [
      "CZ",
      "DE"
    ],

    countryName:
      country =>
        country.name,

    countryUrl:
      country =>
        `/en/countries/${country.slug_en}/`,

    sortLocale:
      "en",

    selectAtLeastTwo:
      "Select at least two countries to display the chart.",

    selectOneMore:
      "Select one more country to display the chart.",

    selected:
      (count, maximum) =>
        `${count} of ${maximum} countries selected.`,

    selectedMaximum:
      maximum =>
        `${maximum} of ${maximum} countries selected.`,

    chartSelectTwo:
      "Select at least two countries.",

    chartNoData:
      "Data are not available for this comparison.",

    year:
      "Year",

    debtGdp:
      "Debt / GDP (%)",

    euRank:
      rank =>
        `No. ${rank} in the EU`,

    perCapita:
      value =>
        `€${formatInteger(value)} per capita`,

    updated:
      value =>
        `Data processed ${value}`,

    errorEyebrow:
      "ERROR",

    errorTitle:
      "Data could not be loaded."
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


async function loadJSON(
  url
) {
  const attempts =
    3;

  let lastError =
    null;


  for (
    let attempt = 1;
    attempt <= attempts;
    attempt += 1
  ) {
    try {
      const response =
        await fetch(
          url,
          {
            cache:
              "no-cache"
          }
        );


      if (
        !response.ok
      ) {
        throw new Error(
          `Data error ${response.status}: ${url}`
        );
      }


      return await response.json();
    } catch (
      error
    ) {
      lastError =
        error;


      if (
        attempt < attempts
      ) {
        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              450 * attempt
            )
        );
      }
    }
  }


  throw lastError;
}



/* ---------------------------------------------------------
   STATE
--------------------------------------------------------- */

let euData =
  null;


const MIN_COUNTRIES =
  2;


const MAX_COUNTRIES =
  6;


let selectedCodes =
  [];


const historyCache =
  new Map();



/* ---------------------------------------------------------
   URL STATE
--------------------------------------------------------- */

function hasCountriesInUrl() {
  const url =
    new URL(
      window.location.href
    );


  return url.searchParams.has(
    t.urlParam
  );
}


function readCountriesFromUrl() {
  const url =
    new URL(
      window.location.href
    );


  const value =
    url.searchParams.get(
      t.urlParam
    );


  if (
    value === null ||
    value.trim() ===
      ""
  ) {
    return [];
  }


  const codes =
    value
      .split(
        ","
      )
      .map(
        code =>
          code
            .trim()
            .toUpperCase()
      )
      .filter(
        Boolean
      );


  return [
    ...new Set(
      codes
    )
  ];
}


function normalizeSelectedCodes(
  codes
) {
  if (
    !euData
  ) {
    return [];
  }


  const validCodes =
    new Set(
      euData.countries.map(
        country =>
          country.code
      )
    );


  return codes
    .filter(
      code =>
        validCodes.has(
          code
        )
    )
    .slice(
      0,
      MAX_COUNTRIES
    );
}


function updateUrl() {
  const url =
    new URL(
      window.location.href
    );


  const countries =
    selectedCodes.join(
      ","
    );


  const nextUrl =
    `${url.pathname}?${t.urlParam}=${countries}${url.hash}`;


  window.history.replaceState(
    {},
    "",
    nextUrl
  );
}



/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function periodToNumber(
  period
) {
  const match =
    /^(\d{4})-Q([1-4])$/.exec(
      period
    );


  if (
    !match
  ) {
    return NaN;
  }


  return (
    Number(
      match[1]
    ) +
    (
      Number(
        match[2]
      ) -
      1
    ) /
    4
  );
}


const COMPARE_START_PERIOD =
  "2000-Q1";

const COMPARE_START_TIME =
  periodToNumber(
    COMPARE_START_PERIOD
  );


function cleanSeries(
  items
) {
  const map =
    new Map();


  for (
    const item of
    items ?? []
  ) {
    const period =
      item?.period;


    const time =
      periodToNumber(
        period
      );


    const value =
      Number(
        item?.value
      );


    if (
      !period ||
      !Number.isFinite(
        time
      ) ||
      !Number.isFinite(
        value
      ) ||
      time <
        COMPARE_START_TIME
    ) {
      continue;
    }


    if (
      !map.has(
        period
      )
    ) {
      map.set(
        period,
        {
          period,
          time,
          value
        }
      );
    }
  }


  return Array
    .from(
      map.values()
    )
    .sort(
      (
        a,
        b
      ) =>
        a.time -
        b.time
    );
}


function countryByCode(
  code
) {
  return euData.countries.find(
    country =>
      country.code ===
      code
  );
}


function countryFileCode(
  code
) {
  return code
    .toLowerCase();
}


async function loadCountryHistory(
  code
) {
  if (
    historyCache.has(
      code
    )
  ) {
    return historyCache.get(
      code
    );
  }


  const data =
    await loadJSON(
      `/data/countries/${countryFileCode(
        code
      )}.json`
    );


  historyCache.set(
    code,
    data
  );


  return data;
}



/* ---------------------------------------------------------
   COLORS
--------------------------------------------------------- */

const seriesColors = [
  "#155eef", // PublicDebt blue
  "#35a99d", // teal
  "#d99a00", // accessible gold
  "#7a5af8", // violet
  "#e05a47", // coral
  "#0f8a5f"  // emerald
];

const seriesColorAssignments =
  new Map();


function syncSeriesColorAssignments() {
  const usedColors =
    new Set();

  /*
   * Preserve colors of countries that are already selected.
   * If an old stored assignment now conflicts with another
   * active country, the later/newer country gets reassigned.
   */
  for (
    const code of
    selectedCodes
  ) {
    const color =
      seriesColorAssignments.get(
        code
      );

    if (
      color &&
      seriesColors.includes(
        color
      ) &&
      !usedColors.has(
        color
      )
    ) {
      usedColors.add(
        color
      );
    } else {
      seriesColorAssignments.delete(
        code
      );
    }
  }

  /*
   * Assign the first currently unused color to countries
   * that do not yet have a valid active assignment.
   */
  for (
    const code of
    selectedCodes
  ) {
    if (
      seriesColorAssignments.has(
        code
      )
    ) {
      continue;
    }

    const color =
      seriesColors.find(
        candidate =>
          !usedColors.has(
            candidate
          )
      );

    if (
      !color
    ) {
      continue;
    }

    seriesColorAssignments.set(
      code,
      color
    );

    usedColors.add(
      color
    );
  }
}


function getSeriesColor(
  code
) {
  return (
    seriesColorAssignments.get(
      code
    ) ??
    seriesColors[0]
  );
}


function getSeriesTextColor(
  code
) {
  return getSeriesColor(
    code
  ) === "#d99a00"
    ? "#071731"
    : "#ffffff";
}



/* ---------------------------------------------------------
   COUNTRY SELECTOR
--------------------------------------------------------- */

function renderCountrySelector() {
  syncSeriesColorAssignments();

  const container =
    document.querySelector(
      "#compare-country-grid"
    );


  if (
    !container
  ) {
    return;
  }


  container.innerHTML =
    "";


  const countries =
    [
      ...euData.countries
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


  for (
    const country of
    countries
  ) {
    const label =
      document.createElement(
        "label"
      );


    label.className =
      "compare-country-option";


    const input =
      document.createElement(
        "input"
      );


    input.type =
      "checkbox";


    input.value =
      country.code;


    input.checked =
      selectedCodes.includes(
        country.code
      );


    input.disabled =
      selectedCodes.length >=
        MAX_COUNTRIES &&
      !input.checked;


    input.addEventListener(
      "change",
      () => {
        toggleCountry(
          country.code,
          input.checked
        );
      }
    );


    const content =
      document.createElement(
        "span"
      );


    content.className =
      "compare-country-option-content";

    if (
      input.checked
    ) {
      content.style.setProperty(
        "--compare-series-color",
        getSeriesColor(
          country.code
        )
      );

      content.style.setProperty(
        "--compare-series-text",
        getSeriesTextColor(
          country.code
        )
      );
    }


    content.innerHTML = `
      <strong>
        ${t.countryName(
          country
        )}
      </strong>

      <small>
        ${country.code}
      </small>
    `;


    label.appendChild(
      input
    );


    label.appendChild(
      content
    );


    container.appendChild(
      label
    );
  }


  updateSelectionNote();
}


function toggleCountry(
  code,
  checked
) {
  if (
    checked
  ) {
    if (
      selectedCodes.length >=
      MAX_COUNTRIES
    ) {
      renderCountrySelector();

      return;
    }


    if (
      !selectedCodes.includes(
        code
      )
    ) {
      selectedCodes.push(
        code
      );
    }
  } else {
    selectedCodes =
      selectedCodes.filter(
        item =>
          item !==
          code
      );
  }


  updateUrl();


  renderCountrySelector();


  renderComparison();
}


function updateSelectionNote() {
  const element =
    document.querySelector(
      "#compare-selection-note"
    );


  if (
    !element
  ) {
    return;
  }


  if (
    selectedCodes.length ===
    0
  ) {
    element.textContent =
      t.selectAtLeastTwo;

    return;
  }


  if (
    selectedCodes.length ===
    1
  ) {
    element.textContent =
      t.selectOneMore;

    return;
  }


  if (
    selectedCodes.length ===
    MAX_COUNTRIES
  ) {
    element.textContent =
      t.selectedMaximum(
        MAX_COUNTRIES
      );

    return;
  }


  element.textContent =
    t.selected(
      selectedCodes.length,
      MAX_COUNTRIES
    );
}



/* ---------------------------------------------------------
   LEGEND
--------------------------------------------------------- */

function renderLegend() {
  const container =
    document.querySelector(
      "#compare-legend"
    );


  if (
    !container
  ) {
    return;
  }


  container.innerHTML =
    "";


  selectedCodes.forEach(
    code => {
      const country =
        countryByCode(
          code
        );


      if (
        !country
      ) {
        return;
      }


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "compare-legend-item";


      const line =
        document.createElement(
          "span"
        );


      line.className =
        "compare-legend-line";


      line.style.backgroundColor =
        getSeriesColor(
          code
        );


      const textElement =
        document.createElement(
          "span"
        );


      textElement.textContent =
        t.countryName(
          country
        );


      item.appendChild(
        line
      );


      item.appendChild(
        textElement
      );


      container.appendChild(
        item
      );
    }
  );
}



/* ---------------------------------------------------------
   SUMMARY
--------------------------------------------------------- */

function renderSummary() {
  const container =
    document.querySelector(
      "#compare-summary-grid"
    );


  if (
    !container
  ) {
    return;
  }


  container.innerHTML =
    "";


  for (
    const code of
    selectedCodes
  ) {
    const country =
      countryByCode(
        code
      );


    if (
      !country
    ) {
      continue;
    }


    const card =
      document.createElement(
        "a"
      );


    card.className =
      "compare-summary-card";

    card.style.setProperty(
      "--compare-series-color",
      getSeriesColor(
        code
      )
    );


    card.href =
      t.countryUrl(
        country
      );


    card.innerHTML = `
      <span class="compare-summary-country">
        ${t.countryName(
          country
        )}
      </span>

      <strong>
        ${formatNumber(
          country.debt
            .percent_gdp
        )} %
      </strong>

      <p>
        ${t.euRank(
          country.rank
            .debt_percent_gdp
        )}
      </p>

      <small>
        ${t.perCapita(
          country.debt_per_capita
            .eur
        )}
      </small>
    `;


    container.appendChild(
      card
    );
  }
}



/* ---------------------------------------------------------
   MULTI SERIES CHART
--------------------------------------------------------- */

function createComparisonChart(
  seriesList
) {
  const container =
    document.querySelector(
      "#compare-chart"
    );


  if (
    !container
  ) {
    return;
  }


  container.innerHTML =
    "";


  if (
    seriesList.length <
    MIN_COUNTRIES
  ) {
    container.innerHTML = `
      <p class="loading">
        ${t.chartSelectTwo}
      </p>
    `;

    return;
  }


  const normalized =
    seriesList
      .map(
        series => ({
          ...series,

          data:
            cleanSeries(
              series.data
            )
        })
      )
      .filter(
        series =>
          series.data.length
      );


  if (
    normalized.length <
    MIN_COUNTRIES
  ) {
    container.innerHTML = `
      <p class="loading">
        ${t.chartNoData}
      </p>
    `;

    return;
  }


  const allPoints =
    normalized.flatMap(
      series =>
        series.data
    );


  const width =
    1000;


  const height =
    455;


  const margin = {
    top: 30,
    right: 30,
    bottom: 75,
    left: 90
  };


  const chartWidth =
    width -
    margin.left -
    margin.right;


  const chartHeight =
    height -
    margin.top -
    margin.bottom;


  const firstTime =
    COMPARE_START_TIME;


  const lastTime =
    Math.max(
      ...allPoints.map(
        item =>
          item.time
      )
    );


  const timeRange =
    lastTime -
    firstTime ||
    1;


  const values =
    allPoints.map(
      item =>
        item.value
    );


  let minValue =
    Math.min(
      ...values
    );


  let maxValue =
    Math.max(
      ...values
    );


  const rawRange =
    maxValue -
    minValue ||
    1;


  minValue =
    Math.max(
      0,
      minValue -
      rawRange *
      0.10
    );


  maxValue +=
    rawRange *
    0.10;


  const x =
    time =>
      margin.left +
      (
        (
          time -
          firstTime
        ) /
        timeRange
      ) *
      chartWidth;


  const y =
    value =>
      margin.top +
      (
        1 -
        (
          (
            value -
            minValue
          ) /
          (
            maxValue -
            minValue
          )
        )
      ) *
      chartHeight;


  const axisY =
    height -
    margin.bottom;


  const svg =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );


  svg.setAttribute(
    "viewBox",
    `0 0 ${width} ${height}`
  );


  svg.setAttribute(
    "preserveAspectRatio",
    "xMidYMid meet"
  );


  svg.classList.add(
    "chart-svg"
  );


  /* Y GRID */

  const yTickCount =
    5;


  for (
    let i = 0;
    i <= yTickCount;
    i++
  ) {
    const value =
      minValue +
      (
        (
          maxValue -
          minValue
        ) /
        yTickCount
      ) *
      i;


    const yy =
      y(
        value
      );


    const grid =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );


    grid.setAttribute(
      "x1",
      margin.left
    );


    grid.setAttribute(
      "x2",
      width -
      margin.right
    );


    grid.setAttribute(
      "y1",
      yy
    );


    grid.setAttribute(
      "y2",
      yy
    );


    grid.classList.add(
      "chart-grid"
    );


    svg.appendChild(
      grid
    );


    const label =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );


    label.setAttribute(
      "x",
      margin.left -
      12
    );


    label.setAttribute(
      "y",
      yy +
      4
    );


    label.setAttribute(
      "text-anchor",
      "end"
    );


    label.classList.add(
      "chart-axis-label"
    );


    label.textContent =
      formatNumber(
        value
      );


    svg.appendChild(
      label
    );
  }


  /* X AXIS */

  const axis =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );


  axis.setAttribute(
    "x1",
    margin.left
  );


  axis.setAttribute(
    "x2",
    width -
    margin.right
  );


  axis.setAttribute(
    "y1",
    axisY
  );


  axis.setAttribute(
    "y2",
    axisY
  );


  axis.classList.add(
    "chart-axis"
  );


  svg.appendChild(
    axis
  );


  const firstYear =
    Math.ceil(
      firstTime
    );


  const lastYear =
    Math.floor(
      lastTime
    );


  for (
    let year =
      Math.ceil(
        firstYear /
        5
      ) *
      5;

    year <=
    lastYear;

    year +=
    5
  ) {
    const xx =
      x(
        year
      );


    const label =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );


    label.setAttribute(
      "x",
      xx
    );


    label.setAttribute(
      "y",
      axisY +
      28
    );


    label.setAttribute(
      "text-anchor",
      "middle"
    );


    label.classList.add(
      "chart-axis-label"
    );


    label.textContent =
      String(
        year
      );


    svg.appendChild(
      label
    );
  }


  /* AXIS TITLES */

  const xTitle =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );


  xTitle.setAttribute(
    "x",
    margin.left +
    chartWidth /
    2
  );


  xTitle.setAttribute(
    "y",
    height -
    12
  );


  xTitle.setAttribute(
    "text-anchor",
    "middle"
  );


  xTitle.classList.add(
    "chart-axis-title"
  );


  xTitle.textContent =
    t.year;


  svg.appendChild(
    xTitle
  );


  const yTitle =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );


  yTitle.setAttribute(
    "x",
    -(
      margin.top +
      chartHeight /
      2
    )
  );


  yTitle.setAttribute(
    "y",
    18
  );


  yTitle.setAttribute(
    "text-anchor",
    "middle"
  );


  yTitle.setAttribute(
    "transform",
    "rotate(-90)"
  );


  yTitle.classList.add(
    "chart-axis-title"
  );


  yTitle.textContent =
    t.debtGdp;


  svg.appendChild(
    yTitle
  );


  /* LINES */

  normalized.forEach(
    series => {
      const polyline =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polyline"
        );


      polyline.setAttribute(
        "points",
        series.data
          .map(
            item =>
              `${x(
                item.time
              )},${y(
                item.value
              )}`
          )
          .join(
            " "
          )
      );


      polyline.classList.add(
        "compare-chart-line"
      );


      polyline.style.stroke =
        getSeriesColor(
          series.code
        );


      svg.appendChild(
        polyline
      );
    }
  );


  /* HOVER */

  const tooltip =
    document.createElement(
      "div"
    );


  tooltip.className =
    "chart-tooltip compare-tooltip";


  tooltip.hidden =
    true;


  const periodSet =
    new Set(
      allPoints.map(
        item =>
          item.period
      )
    );


  const periods =
    [
      ...periodSet
    ]
      .map(
        period => ({
          period,

          time:
            periodToNumber(
              period
            )
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          a.time -
          b.time
      );


  let hideTimer =
    null;


  function cancelHide() {
    if (
      hideTimer
    ) {
      clearTimeout(
        hideTimer
      );


      hideTimer =
        null;
    }
  }


  function scheduleHide(
    guide
  ) {
    cancelHide();


    hideTimer =
      setTimeout(
        () => {
          tooltip.hidden =
            true;


          guide.classList.remove(
            "is-active"
          );
        },
        220
      );
  }


  periods.forEach(
    (
      periodItem,
      index
    ) => {
      const pointX =
        x(
          periodItem.time
        );


      const previousX =
        index >
        0
          ? x(
              periods[
                index -
                1
              ].time
            )
          : pointX;


      const nextX =
        index <
        periods.length -
        1
          ? x(
              periods[
                index +
                1
              ].time
            )
          : pointX;


      const leftBoundary =
        index ===
        0
          ? margin.left
          : (
              previousX +
              pointX
            ) /
            2;


      const rightBoundary =
        index ===
        periods.length -
        1
          ? width -
            margin.right
          : (
              pointX +
              nextX
            ) /
            2;


      const guide =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );


      guide.setAttribute(
        "x1",
        pointX
      );


      guide.setAttribute(
        "x2",
        pointX
      );


      guide.setAttribute(
        "y1",
        margin.top
      );


      guide.setAttribute(
        "y2",
        axisY
      );


      guide.classList.add(
        "chart-hover-guide"
      );


      svg.appendChild(
        guide
      );


      const hitArea =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );


      hitArea.setAttribute(
        "x",
        leftBoundary
      );


      hitArea.setAttribute(
        "y",
        margin.top
      );


      hitArea.setAttribute(
        "width",
        Math.max(
          rightBoundary -
          leftBoundary,
          1
        )
      );


      hitArea.setAttribute(
        "height",
        chartHeight
      );


      hitArea.classList.add(
        "chart-hit-zone"
      );


      const show =
        () => {
          cancelHide();


          svg
            .querySelectorAll(
              ".chart-hover-guide.is-active"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "is-active"
                )
            );


          guide.classList.add(
            "is-active"
          );


          const valuesAtPeriod =
            normalized
              .map(
                series => {
                  const observation =
                    series.data.find(
                      item =>
                        item.period ===
                        periodItem.period
                    );


                  if (
                    !observation
                  ) {
                    return null;
                  }


                  return {
                    ...series,

                    value:
                      observation.value,

                    color:
                      getSeriesColor(
                        series.code
                      )
                  };
                }
              )
              .filter(
                Boolean
              );


          tooltip.innerHTML = `
            <strong>
              ${periodItem.period}
            </strong>

            ${valuesAtPeriod
              .map(
                item => `
                  <span class="compare-tooltip-row">

                    <i
                      style="background:${item.color}"
                    ></i>

                    ${item.name}:
                    ${formatNumber(
                      item.value
                    )} %

                  </span>
                `
              )
              .join(
                ""
              )}
          `;


          const rect =
            svg.getBoundingClientRect();


          tooltip.style.left =
            `${
              (
                pointX /
                width
              ) *
              rect.width
            }px`;


          tooltip.style.top =
            "20px";


          tooltip.hidden =
            false;
        };


      hitArea.addEventListener(
        "mouseenter",
        show
      );


      hitArea.addEventListener(
        "mousemove",
        show
      );


      hitArea.addEventListener(
        "mouseleave",
        () => {
          scheduleHide(
            guide
          );
        }
      );


      svg.appendChild(
        hitArea
      );
    }
  );


  svg.addEventListener(
    "mouseleave",
    () => {
      cancelHide();

      tooltip.hidden =
        true;

      svg
        .querySelectorAll(
          ".chart-hover-guide.is-active"
        )
        .forEach(
          item =>
            item.classList.remove(
              "is-active"
            )
        );
    }
  );


  container.appendChild(
    svg
  );


  container.appendChild(
    tooltip
  );
}



/* ---------------------------------------------------------
   RENDER COMPARISON
--------------------------------------------------------- */

async function renderComparison() {
  updateSelectionNote();


  renderLegend();


  renderSummary();


  if (
    selectedCodes.length <
    MIN_COUNTRIES
  ) {
    createComparisonChart(
      []
    );

    return;
  }


  const histories =
    await Promise.all(
      selectedCodes.map(
        async code => {
          const country =
            countryByCode(
              code
            );


          const history =
            await loadCountryHistory(
              code
            );


          return {
            code,

            name:
              t.countryName(
                country
              ),

            data:
              history.history
                .debt_percent_gdp
          };
        }
      )
    );


  createComparisonChart(
    histories
  );
}



/* ---------------------------------------------------------
   START
--------------------------------------------------------- */

loadJSON(
  "/data/eu.json"
)
  .then(
    async data => {
      euData =
        data;


      if (
        hasCountriesInUrl()
      ) {
        selectedCodes =
          normalizeSelectedCodes(
            readCountriesFromUrl()
          );
      } else {
        selectedCodes =
          normalizeSelectedCodes(
            t.defaultCodes
          );
      }


      updateUrl();


      const updatedElement =
        document.querySelector(
          "#compare-updated"
        );


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


      renderCountrySelector();


      await renderComparison();
    }
  )
  .catch(
    error => {
      console.error(
        error
      );


      document.querySelector(
        ".container"
      ).innerHTML = `
        <header class="header">

          <p class="eyebrow">
            ${t.errorEyebrow}
          </p>

          <h1>
            ${t.errorTitle}
          </h1>

          <p class="intro">
            ${error.message}
          </p>

        </header>
      `;
    }
  );