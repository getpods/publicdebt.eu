const GISCO_URL =
  "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2024_4326_LEVL_0.geojson";


const locale =
  "en-GB";


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


function trackEvent(
  name,
  data = {}
) {
  if (
    typeof window.umami?.track !==
    "function"
  ) {
    return;
  }


  window.umami.track(
    name,
    data
  );
}



/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function getDebtValue(
  country
) {
  return Number(
    country?.debt
      ?.percent_gdp
  );
}


function countryUrl(
  country
) {
  return `/en/countries/${country.slug_en}/`;
}


function getDebtLevel(
  value
) {
  if (
    value <
    40
  ) {
    return 1;
  }


  if (
    value <
    60
  ) {
    return 2;
  }


  if (
    value <
    80
  ) {
    return 3;
  }


  if (
    value <=
    100
  ) {
    return 4;
  }


  return 5;
}


/* ---------------------------------------------------------
   SNAPSHOT
--------------------------------------------------------- */

function renderSnapshot(
  data
) {
  const countries =
    data.countries
      .filter(
        country =>
          Number.isFinite(
            getDebtValue(
              country
            )
          )
      )
      .sort(
        (
          a,
          b
        ) =>
          getDebtValue(
            b
          ) -
          getDebtValue(
            a
          )
      );


  const highest =
    countries[0];


  const lowest =
    countries[
      countries.length -
      1
    ];


  const highestValue =
    document.querySelector(
      "#eu-home-highest-value"
    );


  const highestCountry =
    document.querySelector(
      "#eu-home-highest-country"
    );


  const lowestValue =
    document.querySelector(
      "#eu-home-lowest-value"
    );


  const lowestCountry =
    document.querySelector(
      "#eu-home-lowest-country"
    );


  const count =
    document.querySelector(
      "#eu-home-country-count"
    );


  const period =
    document.querySelector(
      "#eu-home-period"
    );


  if (
    highest &&
    highestValue
  ) {
    highestValue.textContent =
      `${formatNumber(
        getDebtValue(
          highest
        )
      )}%`;
  }


  if (
    highest &&
    highestCountry
  ) {
    highestCountry.textContent =
      highest.name;
  }


  if (
    lowest &&
    lowestValue
  ) {
    lowestValue.textContent =
      `${formatNumber(
        getDebtValue(
          lowest
        )
      )}%`;
  }


  if (
    lowest &&
    lowestCountry
  ) {
    lowestCountry.textContent =
      lowest.name;
  }


  if (
    count
  ) {
    count.textContent =
      formatInteger(
        data.count ??
        countries.length
      );
  }


  if (
    period
  ) {
    period.textContent =
      data.periods
        ?.debt
        ?.[0] ??
      countries[0]
        ?.debt
        ?.period ??
      "—";
  }
}


/* ---------------------------------------------------------
   RANKING PREVIEW
--------------------------------------------------------- */

function renderRanking(
  data
) {
  const container =
    document.querySelector(
      "#eu-home-ranking"
    );


  if (
    !container
  ) {
    return;
  }


  const countries =
    [...data.countries]
      .filter(
        country =>
          Number.isFinite(
            getDebtValue(
              country
            )
          )
      )
      .sort(
        (
          a,
          b
        ) =>
          a.rank
            .debt_percent_gdp -
          b.rank
            .debt_percent_gdp
      )
      .slice(
        0,
        6
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
      "eu-home-ranking-row";


    link.href =
      countryUrl(
        country
      );


    link.addEventListener(
      "click",
      () => {
        trackEvent(
          "country_open",
          {
            country: country.code,
            source: "homepage_ranking",
            language: "en"
          }
        );
      }
    );


    link.innerHTML = `
      <span class="eu-home-ranking-position">
        ${country.rank.debt_percent_gdp}.
      </span>

      <span class="eu-home-ranking-country">
        <strong>
          ${country.name}
        </strong>

        <small>
          ${country.code}
        </small>
      </span>

      <span class="eu-home-ranking-value">
        ${formatNumber(
          getDebtValue(
            country
          )
        )}%
      </span>
    `;


    container.appendChild(
      link
    );
  }
}


/* ---------------------------------------------------------
   MAP GEOMETRY
--------------------------------------------------------- */

const MAP_BOUNDS = {
  minLon:
    -12,

  maxLon:
    36,

  minLat:
    34,

  maxLat:
    72
};


const MAP_WIDTH =
  920;


const MAP_HEIGHT =
  650;


const MAP_PADDING =
  8;


/*
 * Web Mercator projection.
 *
 * Both X and Y must use compatible projected
 * units before applying one common scale.
 */

function mercatorX(
  longitude
) {
  return (
    longitude *
    Math.PI /
    180
  );
}


function mercatorY(
  latitude
) {
  const clampedLatitude =
    Math.max(
      -85,
      Math.min(
        85,
        latitude
      )
    );


  const radians =
    clampedLatitude *
    Math.PI /
    180;


  return Math.log(
    Math.tan(
      Math.PI /
      4 +
      radians /
      2
    )
  );
}


const MAP_MIN_X =
  mercatorX(
    MAP_BOUNDS.minLon
  );


const MAP_MAX_X =
  mercatorX(
    MAP_BOUNDS.maxLon
  );


const MAP_MIN_Y =
  mercatorY(
    MAP_BOUNDS.minLat
  );


const MAP_MAX_Y =
  mercatorY(
    MAP_BOUNDS.maxLat
  );


const MAP_SOURCE_WIDTH =
  MAP_MAX_X -
  MAP_MIN_X;


const MAP_SOURCE_HEIGHT =
  MAP_MAX_Y -
  MAP_MIN_Y;


const MAP_AVAILABLE_WIDTH =
  MAP_WIDTH -
  MAP_PADDING *
  2;


const MAP_AVAILABLE_HEIGHT =
  MAP_HEIGHT -
  MAP_PADDING *
  2;


/*
 * One scale factor is used for both axes.
 * This preserves the Mercator proportions.
 */

const MAP_SCALE =
  Math.min(
    MAP_AVAILABLE_WIDTH /
      MAP_SOURCE_WIDTH,

    MAP_AVAILABLE_HEIGHT /
      MAP_SOURCE_HEIGHT
  );


const MAP_DRAW_WIDTH =
  MAP_SOURCE_WIDTH *
  MAP_SCALE;


const MAP_DRAW_HEIGHT =
  MAP_SOURCE_HEIGHT *
  MAP_SCALE;


const MAP_OFFSET_X =
  (
    MAP_WIDTH -
    MAP_DRAW_WIDTH
  ) /
  2;


const MAP_OFFSET_Y =
  (
    MAP_HEIGHT -
    MAP_DRAW_HEIGHT
  ) /
  2;


function projectPoint(
  coordinates
) {
  const [
    lon,
    lat
  ] =
    coordinates;


  const projectedX =
    mercatorX(
      lon
    );


  const projectedY =
    mercatorY(
      lat
    );


  const x =
    MAP_OFFSET_X +
    (
      projectedX -
      MAP_MIN_X
    ) *
    MAP_SCALE;


  const y =
    MAP_OFFSET_Y +
    (
      MAP_MAX_Y -
      projectedY
    ) *
    MAP_SCALE;


  return [
    x,
    y
  ];
}


function ringIntersectsEurope(
  ring
) {
  let minLon =
    Infinity;


  let maxLon =
    -Infinity;


  let minLat =
    Infinity;


  let maxLat =
    -Infinity;


  for (
    const [
      lon,
      lat
    ] of
    ring
  ) {
    minLon =
      Math.min(
        minLon,
        lon
      );


    maxLon =
      Math.max(
        maxLon,
        lon
      );


    minLat =
      Math.min(
        minLat,
        lat
      );


    maxLat =
      Math.max(
        maxLat,
        lat
      );
  }


  return !(
    maxLon <
      MAP_BOUNDS.minLon ||
    minLon >
      MAP_BOUNDS.maxLon ||
    maxLat <
      MAP_BOUNDS.minLat ||
    minLat >
      MAP_BOUNDS.maxLat
  );
}


function ringToPath(
  ring
) {
  if (
    !ring.length ||
    !ringIntersectsEurope(
      ring
    )
  ) {
    return "";
  }


  const points =
    ring.map(
      projectPoint
    );


  return (
    points
      .map(
        (
          point,
          index
        ) =>
          `${
            index ===
            0
              ? "M"
              : "L"
          } ${point[0].toFixed(
            2
          )} ${point[1].toFixed(
            2
          )}`
      )
      .join(
        " "
      ) +
    " Z"
  );
}


function polygonToPath(
  polygon
) {
  return polygon
    .map(
      ring =>
        ringToPath(
          ring
        )
    )
    .filter(
      Boolean
    )
    .join(
      " "
    );
}


function geometryToPath(
  geometry
) {
  if (
    !geometry
  ) {
    return "";
  }


  if (
    geometry.type ===
    "Polygon"
  ) {
    return polygonToPath(
      geometry.coordinates
    );
  }


  if (
    geometry.type ===
    "MultiPolygon"
  ) {
    return geometry.coordinates
      .map(
        polygon =>
          polygonToPath(
            polygon
          )
      )
      .filter(
        Boolean
      )
      .join(
        " "
      );
  }


  return "";
}


/* ---------------------------------------------------------
   MAP
--------------------------------------------------------- */

function renderMap(
  eu,
  geo
) {
  const container =
    document.querySelector(
      "#eu-debt-map"
    );


  if (
    !container
  ) {
    return;
  }


  const countriesByCode =
    new Map(
      eu.countries.map(
        country => [
          country.code,
          country
        ]
      )
    );


  const svg =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );


  svg.setAttribute(
    "viewBox",
    `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`
  );


  svg.setAttribute(
    "preserveAspectRatio",
    "xMidYMid meet"
  );


  svg.setAttribute(
    "role",
    "img"
  );


  svg.setAttribute(
    "aria-label",
    "Map of the European Union showing public debt as a percentage of GDP"
  );


  svg.classList.add(
    "eu-map-svg"
  );


  const tooltip =
    document.querySelector(
      "#eu-map-tooltip"
    );


  const tooltipCountry =
    document.querySelector(
      "#eu-map-tooltip-country"
    );


  const tooltipDebt =
    document.querySelector(
      "#eu-map-tooltip-debt"
    );


  const tooltipRank =
    document.querySelector(
      "#eu-map-tooltip-rank"
    );


  const selectedCountry =
    document.querySelector(
      "#eu-map-selected-country"
    );


  const selectedValue =
    document.querySelector(
      "#eu-map-selected-value"
    );


  const selectedLink =
    document.querySelector(
      "#eu-map-selected-link"
    );


  function updateSelected(
    country
  ) {
    const value =
      getDebtValue(
        country
      );


    if (
      selectedCountry
    ) {
      selectedCountry.textContent =
        country.name;
    }


    if (
      selectedValue
    ) {
      selectedValue.textContent =
        `${formatNumber(
          value
        )}% of GDP · No. ${country.rank.debt_percent_gdp} in the EU`;
    }


    if (
      selectedLink
    ) {
      selectedLink.href =
        countryUrl(
          country
        );


      selectedLink.innerHTML = `
        View ${country.name}
        <span aria-hidden="true">→</span>
      `;
    }
  }


  function showTooltip(
    event,
    country
  ) {
    if (
      !tooltip
    ) {
      return;
    }


    const card =
      container.closest(
        ".eu-map-card"
      );


    if (
      !card
    ) {
      return;
    }


    const rect =
      card.getBoundingClientRect();


    const x =
      event.clientX -
      rect.left;


    const y =
      event.clientY -
      rect.top;


    if (
      tooltipCountry
    ) {
      tooltipCountry.textContent =
        country.name;
    }


    if (
      tooltipDebt
    ) {
      tooltipDebt.textContent =
        `${formatNumber(
          getDebtValue(
            country
          )
        )}% of GDP`;
    }


    if (
      tooltipRank
    ) {
      tooltipRank.textContent =
        `EU rank: ${country.rank.debt_percent_gdp} of 27`;
    }


    tooltip.style.left =
      `${x}px`;


    tooltip.style.top =
      `${y}px`;


    tooltip.hidden =
      false;


    updateSelected(
      country
    );
  }


  function hideTooltip() {
    if (
      tooltip
    ) {
      tooltip.hidden =
        true;
    }
  }


  const features =
    geo.features ??
    [];


  for (
    const feature of
    features
  ) {
    const code =
      feature.properties
        ?.NUTS_ID ??
      feature.properties
        ?.CNTR_CODE ??
      feature.properties
        ?.cntr_id;


    const country =
      countriesByCode.get(
        code
      );


    if (
      !country
    ) {
      continue;
    }


    const pathData =
      geometryToPath(
        feature.geometry
      );


    if (
      !pathData
    ) {
      continue;
    }


    const path =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );


    path.setAttribute(
      "d",
      pathData
    );


    path.setAttribute(
      "fill-rule",
      "evenodd"
    );


    path.setAttribute(
      "tabindex",
      "0"
    );


    path.setAttribute(
      "role",
      "link"
    );


    path.setAttribute(
      "aria-label",
      `${country.name}: ${formatNumber(
        getDebtValue(
          country
        )
      )}% of GDP`
    );


    path.dataset.country =
      country.code;


    path.classList.add(
      "eu-map-country",
      `eu-map-country-level-${getDebtLevel(
        getDebtValue(
          country
        )
      )}`
    );


    path.addEventListener(
      "mouseenter",
      event => {
        showTooltip(
          event,
          country
        );
      }
    );


    path.addEventListener(
      "mousemove",
      event => {
        showTooltip(
          event,
          country
        );
      }
    );


    path.addEventListener(
      "mouseleave",
      hideTooltip
    );


    path.addEventListener(
      "focus",
      () => {
        updateSelected(
          country
        );
      }
    );


    path.addEventListener(
      "click",
      () => {
        trackEvent(
          "country_open",
          {
            country: country.code,
            source: "eu_map",
            language: "en"
          }
        );


        window.location.href =
          countryUrl(
            country
          );
      }
    );


    path.addEventListener(
      "keydown",
      event => {
        if (
          event.key ===
            "Enter" ||
          event.key ===
            " "
        ) {
          event.preventDefault();


          window.location.href =
            countryUrl(
              country
            );
        }
      }
    );


    svg.appendChild(
      path
    );
  }


  /*
   * Luxembourg and Malta are difficult to click
   * on a geographic map, so larger markers are
   * added over them.
   */

  const markerPositions = {
    LU: [
      6.13,
      49.81
    ],

    MT: [
      14.38,
      35.94
    ]
  };


  for (
    const [
      code,
      coordinates
    ] of
    Object.entries(
      markerPositions
    )
  ) {
    const country =
      countriesByCode.get(
        code
      );


    if (
      !country
    ) {
      continue;
    }


    const [
      x,
      y
    ] =
      projectPoint(
        coordinates
      );


    const marker =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );


    marker.setAttribute(
      "cx",
      x
    );


    marker.setAttribute(
      "cy",
      y
    );


    marker.setAttribute(
      "r",
      8
    );


    marker.setAttribute(
      "tabindex",
      "0"
    );


    marker.setAttribute(
      "role",
      "link"
    );


    marker.setAttribute(
      "aria-label",
      `${country.name}: ${formatNumber(
        getDebtValue(
          country
        )
      )}% of GDP`
    );


    marker.classList.add(
      "eu-map-country-marker",
      `eu-map-country-level-${getDebtLevel(
        getDebtValue(
          country
        )
      )}`
    );


    marker.addEventListener(
      "mouseenter",
      event => {
        showTooltip(
          event,
          country
        );
      }
    );


    marker.addEventListener(
      "mousemove",
      event => {
        showTooltip(
          event,
          country
        );
      }
    );


    marker.addEventListener(
      "mouseleave",
      hideTooltip
    );


    marker.addEventListener(
      "focus",
      () => {
        updateSelected(
          country
        );
      }
    );


    marker.addEventListener(
      "click",
      () => {
        trackEvent(
          "country_open",
          {
            country: country.code,
            source: "eu_map",
            language: "en"
          }
        );


        window.location.href =
          countryUrl(
            country
          );
      }
    );


    marker.addEventListener(
      "keydown",
      event => {
        if (
          event.key ===
            "Enter" ||
          event.key ===
            " "
        ) {
          event.preventDefault();


          window.location.href =
            countryUrl(
              country
            );
        }
      }
    );


    svg.appendChild(
      marker
    );
  }


  container.innerHTML =
    "";


  container.appendChild(
    svg
  );
}


/* ---------------------------------------------------------
   STATUS
--------------------------------------------------------- */

function renderStatus(
  data
) {
  const debtPeriods =
    data.periods
      ?.debt ??
    [];


  const populationPeriods =
    data.periods
      ?.population ??
    [];


  const periodElement =
    document.querySelector(
      "#eu-home-source-period"
    );


  const populationElement =
    document.querySelector(
      "#eu-home-population-period"
    );


  const updatedElement =
    document.querySelector(
      "#eu-home-updated"
    );


  const footerUpdated =
    document.querySelector(
      "#eu-home-footer-updated"
    );


  if (
    periodElement
  ) {
    periodElement.textContent =
      debtPeriods.length ===
        1
        ? debtPeriods[0]
        : debtPeriods.join(
            ", "
          );
  }


  if (
    populationElement
  ) {
    populationElement.textContent =
      populationPeriods.join(
        ", "
      ) ||
      "—";
  }


  const updated =
    `Data processed ${formatDate(
      data.generated_at
    )}`;


  if (
    updatedElement
  ) {
    updatedElement.textContent =
      `${updated}.`;
  }


  if (
    footerUpdated
  ) {
    footerUpdated.textContent =
      updated;
  }
}


/* ---------------------------------------------------------
   MAP ERROR
--------------------------------------------------------- */

function renderMapError(
  error
) {
  console.error(
    error
  );


  const container =
    document.querySelector(
      "#eu-debt-map"
    );


  if (
    container
  ) {
    container.innerHTML = `
      <div class="eu-map-error">

        <p>
          The interactive map could not be loaded.
        </p>

        <a href="/en/ranking/#countries">
          Browse all 27 countries →
        </a>

      </div>
    `;
  }
}


/* ---------------------------------------------------------
   PAGE ERROR
--------------------------------------------------------- */

function renderError(
  error
) {
  console.error(
    error
  );


  const ranking =
    document.querySelector(
      "#eu-home-ranking"
    );


  if (
    ranking
  ) {
    ranking.innerHTML = `
      <p class="loading">
        Data could not be loaded.
      </p>
    `;
  }


  const map =
    document.querySelector(
      "#eu-debt-map"
    );


  if (
    map
  ) {
    map.innerHTML = `
      <div class="eu-map-error">

        <p>
          Data could not be loaded.
        </p>

        <a href="/en/ranking/">
          View EU ranking →
        </a>

      </div>
    `;
  }
}


/* ---------------------------------------------------------
   START
--------------------------------------------------------- */

loadJSON(
  "/data/eu.json"
)
  .then(
    async eu => {
      renderSnapshot(
        eu
      );


      renderRanking(
        eu
      );


      renderStatus(
        eu
      );


      try {
        const geo =
          await loadJSON(
            GISCO_URL
          );


        renderMap(
          eu,
          geo
        );
      } catch (
        error
      ) {
        renderMapError(
          error
        );
      }
    }
  )
  .catch(
    renderError
  );