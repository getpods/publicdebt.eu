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
    year:
      "Rok",

    noData:
      "Data nejsou k dispozici.",

    debtChartUnit:
      "mld. Kč",

    debtChartAxis:
      "Dluh (mld. Kč)",

    debtGdpUnit:
      "% HDP",

    debtGdpAxis:
      "Dluh / HDP (%)",

    yearPrefix:
      "rok",

    populationPrefix:
      "k",

    sourceLatestPrefix:
      "poslední údaj",

    processedPrefix:
      "Data zpracována",

    processedSourcesPrefix:
      "Výsledná data byla zpracována",

    copied:
      "Zkopírováno",

    copyCode:
      "Kopírovat kód",

    iframeTitle:
      "Veřejný dluh Česka – PublicDebt.eu",

    errorEyebrow:
      "CHYBA",

    errorTitle:
      "Data se nepodařilo načíst.",

    euPosition:
      (
        above,
        below
      ) =>
        `Vyšší dluh vůči HDP má ${above} zemí EU, nižší ${below}.`
  },


  en: {
    year:
      "Year",

    noData:
      "Data are not available.",

    debtChartUnit:
      "CZK bn",

    debtChartAxis:
      "Debt (CZK bn)",

    debtGdpUnit:
      "% of GDP",

    debtGdpAxis:
      "Debt / GDP (%)",

    yearPrefix:
      "year",

    populationPrefix:
      "as of",

    sourceLatestPrefix:
      "latest observation",

    processedPrefix:
      "Data processed",

    processedSourcesPrefix:
      "Final data processed",

    copied:
      "Copied",

    copyCode:
      "Copy code",

    iframeTitle:
      "Public debt of Czechia – PublicDebt.eu",

    errorEyebrow:
      "ERROR",

    errorTitle:
      "Data could not be loaded.",

    euPosition:
      (
        above,
        below
      ) =>
        `${above} EU countries have a higher debt-to-GDP ratio and ${below} have a lower one.`
  }
};


const t =
  text[language];



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
   FORMATTERS
--------------------------------------------------------- */

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


const formatPopulationDate = value =>
  new Intl.DateTimeFormat(
    locale,
    {
      day: "numeric",
      month: "numeric",
      year: "numeric"
    }
  ).format(
    new Date(
      `${value}T12:00:00`
    )
  );



/* ---------------------------------------------------------
   DATA
--------------------------------------------------------- */

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


function loadOverview() {
  return loadJSON(
    "/data/overview.json"
  );
}


function loadEU() {
  return loadJSON(
    "/data/eu.json"
  );
}



/* ---------------------------------------------------------
   DEBT CLOCK
--------------------------------------------------------- */

function startDebtClock(
  data
) {
  const rateElement =
    document.querySelector(
      "#debt-clock-rate"
    );


  const valueElement =
    document.querySelector(
      "#debt-clock-value"
    );


  const rate =
    Number(
      data?.debt_clock
        ?.czk_per_second
    );


  if (
    !rateElement ||
    !valueElement
  ) {
    return;
  }


  if (
    !Number.isFinite(
      rate
    )
  ) {
    rateElement.textContent =
      "—";

    valueElement.textContent =
      "0";

    return;
  }


  rateElement.textContent =
    formatInteger(
      rate
    );


  valueElement.textContent =
    "0";


  const startedAt =
    performance.now();


  function frame(
    now
  ) {
    const elapsedSeconds =
      (
        now -
        startedAt
      ) /
      1000;


    const accumulated =
      rate *
      elapsedSeconds;


    valueElement.textContent =
      formatInteger(
        accumulated
      );


    requestAnimationFrame(
      frame
    );
  }


  requestAnimationFrame(
    frame
  );
}



/* ---------------------------------------------------------
   HOMEPAGE EMBED BUILDER
--------------------------------------------------------- */

function setupHomepageEmbedBuilder() {
  const toggle =
    document.querySelector(
      "#homepage-embed-toggle"
    );


  const panel =
    document.querySelector(
      "#homepage-embed-panel"
    );


  const themeSelect =
    document.querySelector(
      "#homepage-embed-theme"
    );


  const widthSelect =
    document.querySelector(
      "#homepage-embed-width"
    );


  const previewWrapper =
    document.querySelector(
      "#homepage-embed-preview-wrapper"
    );


  const preview =
    document.querySelector(
      "#homepage-embed-preview"
    );


  const codeElement =
    document.querySelector(
      "#homepage-embed-code"
    );


  const copyButton =
    document.querySelector(
      "#homepage-embed-copy"
    );


  if (
    !toggle ||
    !panel ||
    !themeSelect ||
    !widthSelect ||
    !previewWrapper ||
    !preview ||
    !codeElement ||
    !copyButton
  ) {
    return;
  }


  function getEmbedLanguage() {
    return language === "en"
      ? "en"
      : "cs";
  }


  function getPublicEmbedUrl() {
    const theme =
      themeSelect.value;


    return (
      "https://publicdebt.eu" +
      `/embed/${getEmbedLanguage()}/debt-clock/` +
      `?country=CZ&theme=${theme}`
    );
  }


  function getPreviewUrl() {
    const theme =
      themeSelect.value;


    return (
      window.location.origin +
      `/embed/${getEmbedLanguage()}/debt-clock/` +
      `?country=CZ&theme=${theme}`
    );
  }


  function getIframeCode() {
    const publicUrl =
      getPublicEmbedUrl();


    const width =
      widthSelect.value;


    if (
      width ===
      "responsive"
    ) {
      return (
        `<iframe src="${publicUrl}" ` +
        `title="${t.iframeTitle}" ` +
        `height="380" ` +
        `loading="lazy" ` +
        `style="width:100%;border:0;" ` +
        `referrerpolicy="strict-origin-when-cross-origin">` +
        `</iframe>`
      );
    }


    return (
      `<iframe src="${publicUrl}" ` +
      `title="${t.iframeTitle}" ` +
      `width="${width}" ` +
      `height="380" ` +
      `loading="lazy" ` +
      `style="max-width:100%;border:0;" ` +
      `referrerpolicy="strict-origin-when-cross-origin">` +
      `</iframe>`
    );
  }


  function updateEmbed() {
    const width =
      widthSelect.value;


    preview.src =
      getPreviewUrl();


    preview.style.width =
      "100%";


    preview.style.height =
      "380px";


    preview.style.border =
      "0";


    if (
      width ===
      "responsive"
    ) {
      previewWrapper.style.width =
        "100%";

      previewWrapper.style.maxWidth =
        "100%";
    } else {
      previewWrapper.style.width =
        `${width}px`;

      previewWrapper.style.maxWidth =
        "100%";
    }


    codeElement.value =
      getIframeCode();
  }


  toggle.addEventListener(
    "click",
    () => {
      const willOpen =
        panel.hidden;


      panel.hidden =
        !willOpen;


      toggle.setAttribute(
        "aria-expanded",
        String(
          willOpen
        )
      );


      const icon =
        toggle.querySelector(
          "strong"
        );


      if (icon) {
        icon.textContent =
          willOpen
            ? "−"
            : "+";
      }


      if (
        willOpen
      ) {
        trackEvent(
          "embed_open",
          {
            country: "CZ",
            location: "homepage",
            language
          }
        );


        updateEmbed();
      }
    }
  );


  themeSelect.addEventListener(
    "change",
    updateEmbed
  );


  widthSelect.addEventListener(
    "change",
    updateEmbed
  );


  copyButton.addEventListener(
    "click",
    async () => {
      const code =
        codeElement.value;


      try {
        await navigator.clipboard
          .writeText(
            code
          );
      } catch {
        codeElement.focus();

        codeElement.select();

        document.execCommand(
          "copy"
        );
      }


      trackEvent(
        "embed_copy",
        {
          country: "CZ",
          location: "homepage",
          theme: themeSelect.value,
          width: widthSelect.value,
          language
        }
      );


      copyButton.textContent =
        t.copied;


      window.setTimeout(
        () => {
          copyButton.textContent =
            t.copyCode;
        },
        1600
      );
    }
  );


  updateEmbed();
}



/* ---------------------------------------------------------
   CHART HELPERS
--------------------------------------------------------- */

function periodToNumber(
  period
) {
  const match =
    /^(\d{4})-Q([1-4])$/.exec(
      period
    );


  if (!match) {
    return NaN;
  }


  const year =
    Number(
      match[1]
    );


  const quarter =
    Number(
      match[2]
    );


  return (
    year +
    (
      quarter -
      1
    ) /
    4
  );
}


function cleanSeries(
  items
) {
  const map =
    new Map();


  for (
    const item of
    items ?? []
  ) {
    const time =
      periodToNumber(
        item?.period
      );


    const value =
      Number(
        item?.value
      );


    if (
      !Number.isFinite(
        time
      ) ||
      !Number.isFinite(
        value
      )
    ) {
      continue;
    }


    if (
      !map.has(
        item.period
      )
    ) {
      map.set(
        item.period,
        {
          period:
            item.period,

          value,

          time
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


function getYearTicks(
  data
) {
  if (
    !data.length
  ) {
    return [];
  }


  const firstYear =
    Math.ceil(
      data[0].time
    );


  const lastYear =
    Math.floor(
      data[
        data.length -
        1
      ].time
    );


  const result =
    [];


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
    result.push(
      year
    );
  }


  return result;
}



/* ---------------------------------------------------------
   CHART
--------------------------------------------------------- */

function createChart({
  container,
  series,
  unit,
  xAxisLabel = t.year,
  yAxisLabel = ""
}) {
  if (!container) {
    return;
  }


  const data =
    cleanSeries(
      series
    );


  container.innerHTML =
    "";


  if (
    !data.length
  ) {
    container.innerHTML = `
      <p class="loading">
        ${t.noData}
      </p>
    `;

    return;
  }


  const width =
    1000;


  const height =
    420;


  const margin = {
    top: 25,
    right: 30,
    bottom: 72,
    left: 88
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
    data[0].time;


  const lastTime =
    data[
      data.length -
      1
    ].time;


  const timeRange =
    lastTime -
    firstTime ||
    1;


  const values =
    data.map(
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


  minValue -=
    rawRange *
    0.1;


  maxValue +=
    rawRange *
    0.1;


  const xForTime =
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


  const x =
    item =>
      xForTime(
        item.time
      );


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


  /* GRADIENT */

  const defs =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "defs"
    );


  const gradient =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "linearGradient"
    );


  const gradientId =
    `chart-area-${Math.random()
      .toString(36)
      .slice(2)}`;


  gradient.setAttribute(
    "id",
    gradientId
  );


  gradient.setAttribute(
    "x1",
    "0"
  );


  gradient.setAttribute(
    "x2",
    "0"
  );


  gradient.setAttribute(
    "y1",
    "0"
  );


  gradient.setAttribute(
    "y2",
    "1"
  );


  const stops = [
    [
      "0%",
      "chart-area-stop-top"
    ],
    [
      "55%",
      "chart-area-stop-middle"
    ],
    [
      "100%",
      "chart-area-stop-bottom"
    ]
  ];


  for (
    const [
      offset,
      className
    ] of stops
  ) {
    const stop =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );


    stop.setAttribute(
      "offset",
      offset
    );


    stop.classList.add(
      className
    );


    gradient.appendChild(
      stop
    );
  }


  defs.appendChild(
    gradient
  );


  svg.appendChild(
    defs
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


    const line =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );


    line.setAttribute(
      "x1",
      margin.left
    );


    line.setAttribute(
      "x2",
      width -
      margin.right
    );


    line.setAttribute(
      "y1",
      yy
    );


    line.setAttribute(
      "y2",
      yy
    );


    line.classList.add(
      "chart-grid"
    );


    svg.appendChild(
      line
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

  const axisY =
    height -
    margin.bottom;


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


  /* X LABELS */

  for (
    const year of
    getYearTicks(
      data
    )
  ) {
    const xx =
      xForTime(
        year
      );


    const tick =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );


    tick.setAttribute(
      "x1",
      xx
    );


    tick.setAttribute(
      "x2",
      xx
    );


    tick.setAttribute(
      "y1",
      axisY
    );


    tick.setAttribute(
      "y2",
      axisY +
      6
    );


    tick.classList.add(
      "chart-axis"
    );


    svg.appendChild(
      tick
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
    xAxisLabel;


  svg.appendChild(
    xTitle
  );


  if (
    yAxisLabel
  ) {
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
      yAxisLabel;


    svg.appendChild(
      yTitle
    );
  }


  /* AREA */

  const linePoints =
    data.map(
      item => ({
        x:
          x(
            item
          ),

        y:
          y(
            item.value
          )
      })
    );


  const firstPoint =
    linePoints[0];


  const lastPoint =
    linePoints[
      linePoints.length -
      1
    ];


  const areaPath =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );


  const areaCommands = [
    `M ${firstPoint.x} ${axisY}`,

    `L ${firstPoint.x} ${firstPoint.y}`,

    ...linePoints
      .slice(
        1
      )
      .map(
        point =>
          `L ${point.x} ${point.y}`
      ),

    `L ${lastPoint.x} ${axisY}`,

    "Z"
  ];


  areaPath.setAttribute(
    "d",
    areaCommands.join(
      " "
    )
  );


  areaPath.setAttribute(
    "fill",
    `url(#${gradientId})`
  );


  areaPath.classList.add(
    "chart-area"
  );


  svg.appendChild(
    areaPath
  );


  /* MAIN LINE */

  const polyline =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polyline"
    );


  polyline.setAttribute(
    "points",
    linePoints
      .map(
        point =>
          `${point.x},${point.y}`
      )
      .join(
        " "
      )
  );


  polyline.classList.add(
    "chart-line"
  );


  svg.appendChild(
    polyline
  );


  /* TOOLTIP */

  const tooltip =
    document.createElement(
      "div"
    );


  tooltip.className =
    "chart-tooltip";


  tooltip.hidden =
    true;


  let hideTooltipTimer =
    null;


  let activePoint =
    null;


  let activeGuide =
    null;


  function cancelHide() {
    if (
      hideTooltipTimer
    ) {
      clearTimeout(
        hideTooltipTimer
      );


      hideTooltipTimer =
        null;
    }
  }


  function hideTooltip() {
    tooltip.hidden =
      true;


    if (
      activePoint
    ) {
      activePoint.classList.remove(
        "is-active"
      );
    }


    if (
      activeGuide
    ) {
      activeGuide.classList.remove(
        "is-active"
      );
    }


    activePoint =
      null;


    activeGuide =
      null;
  }


  function scheduleHide() {
    cancelHide();


    hideTooltipTimer =
      setTimeout(
        hideTooltip,
        250
      );
  }


  data.forEach(
    (
      item,
      index
    ) => {
      const pointX =
        x(
          item
        );


      const pointY =
        y(
          item.value
        );


      const previousX =
        index >
        0
          ? x(
              data[
                index -
                1
              ]
            )
          : pointX;


      const nextX =
        index <
        data.length -
        1
          ? x(
              data[
                index +
                1
              ]
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
        data.length -
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


      const point =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );


      point.setAttribute(
        "cx",
        pointX
      );


      point.setAttribute(
        "cy",
        pointY
      );


      point.setAttribute(
        "r",
        5
      );


      point.classList.add(
        "chart-point-visible"
      );


      svg.appendChild(
        point
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


      function showTooltip() {
        cancelHide();


        if (
          activePoint &&
          activePoint !==
            point
        ) {
          activePoint.classList.remove(
            "is-active"
          );
        }


        if (
          activeGuide &&
          activeGuide !==
            guide
        ) {
          activeGuide.classList.remove(
            "is-active"
          );
        }


        activePoint =
          point;


        activeGuide =
          guide;


        point.classList.add(
          "is-active"
        );


        guide.classList.add(
          "is-active"
        );


        const rect =
          svg.getBoundingClientRect();


        const left =
          (
            pointX /
            width
          ) *
          rect.width;


        const top =
          (
            pointY /
            height
          ) *
          rect.height;


        tooltip.innerHTML = `
          <strong>
            ${item.period}
          </strong>

          <span>
            ${formatNumber(
              item.value
            )} ${unit}
          </span>
        `;


        tooltip.style.left =
          `${left}px`;


        tooltip.style.top =
          `${top}px`;


        tooltip.hidden =
          false;
      }


      hitArea.addEventListener(
        "mouseenter",
        showTooltip
      );


      hitArea.addEventListener(
        "mousemove",
        showTooltip
      );


      hitArea.addEventListener(
        "mouseleave",
        scheduleHide
      );


      svg.appendChild(
        hitArea
      );
    }
  );


  tooltip.addEventListener(
    "mouseenter",
    cancelHide
  );


  tooltip.addEventListener(
    "mouseleave",
    scheduleHide
  );


  container.appendChild(
    svg
  );


  container.appendChild(
    tooltip
  );
}



/* ---------------------------------------------------------
   CZECHIA IN THE EU
--------------------------------------------------------- */

function renderEUPosition(
  data
) {
  const czechia =
    data.countries?.find(
      country =>
        country.code ===
        "CZ"
    );


  if (!czechia) {
    return;
  }


  const rankElement =
    document.querySelector(
      "#eu-rank"
    );


  const debtElement =
    document.querySelector(
      "#eu-debt-gdp"
    );


  const textElement =
    document.querySelector(
      "#eu-position-text"
    );


  const rank =
    Number(
      czechia.rank
        ?.debt_percent_gdp
    );


  const debt =
    Number(
      czechia.debt
        ?.percent_gdp
    );


  if (
    rankElement &&
    Number.isFinite(
      rank
    )
  ) {
    rankElement.textContent =
      `${rank}.`;
  }


  if (
    debtElement &&
    Number.isFinite(
      debt
    )
  ) {
    debtElement.textContent =
      formatNumber(
        debt
      );
  }


  if (
    textElement &&
    Number.isFinite(
      rank
    )
  ) {
    const above =
      rank -
      1;


    const below =
      data.count -
      rank;


    textElement.textContent =
      t.euPosition(
        above,
        below
      );
  }
}



/* ---------------------------------------------------------
   METHODOLOGY + SOURCES
--------------------------------------------------------- */

function renderMethodology(
  data
) {
  const clock =
    data.debt_clock;


  const clockPeriodFrom =
    document.querySelector(
      "#clock-period-from"
    );


  const clockPeriodTo =
    document.querySelector(
      "#clock-period-to"
    );


  if (
    clockPeriodFrom &&
    clock?.period_from
  ) {
    clockPeriodFrom.textContent =
      clock.period_from;
  }


  if (
    clockPeriodTo &&
    clock?.period_to
  ) {
    clockPeriodTo.textContent =
      clock.period_to;
  }


  const mfcrPeriod =
    document.querySelector(
      "#source-mfcr-period"
    );


  const eurostatPeriod =
    document.querySelector(
      "#source-eurostat-period"
    );


  const ecbPeriod =
    document.querySelector(
      "#source-ecb-period"
    );


  const populationYear =
    document.querySelector(
      "#source-population-year"
    );


  const forecastYear =
    document.querySelector(
      "#source-forecast-year"
    );


  const sourcesUpdated =
    document.querySelector(
      "#sources-updated"
    );


  if (
    mfcrPeriod
  ) {
    mfcrPeriod.textContent =
      `${t.sourceLatestPrefix} ${data.latest.period}`;
  }


  if (
    eurostatPeriod
  ) {
    eurostatPeriod.textContent =
      `${t.sourceLatestPrefix} ${data.latest.period}`;
  }


  if (
    populationYear &&
    data.population?.year
  ) {
    populationYear.textContent =
      language === "en"
        ? `1 January ${data.population.year}`
        : `k 1. 1. ${data.population.year}`;
  }


  if (
    forecastYear
  ) {
    forecastYear.textContent =
      `${t.yearPrefix} ${data.forecast.year}`;
  }


  const homepageForecastYear =
    document.querySelector(
      "#homepage-forecast-year"
    );

  const methodologyForecastYear =
    document.querySelector(
      "#methodology-forecast-year"
    );


  if (
    homepageForecastYear &&
    data.forecast?.year
  ) {
    homepageForecastYear.textContent =
      data.forecast.year;
  }


  if (
    methodologyForecastYear &&
    data.forecast?.year
  ) {
    methodologyForecastYear.textContent =
      data.forecast.year;
  }


  if (
    sourcesUpdated
  ) {
    sourcesUpdated.textContent =
      `${t.processedSourcesPrefix} ${formatDate(
        data.generated_at
      )}.`;
  }
}



function renderHomepageInterestRate(
  eu
) {
  const valueElement =
    document.querySelector(
      "#home-interest-rate"
    );

  const periodElement =
    document.querySelector(
      "#home-interest-rate-period"
    );


  if (
    !valueElement ||
    !periodElement
  ) {
    return;
  }


  const czechia =
    eu.countries?.find(
      country =>
        country.code === "CZ"
    );


  const interestRate =
    czechia?.interest_rate;


  if (
    !interestRate ||
    !Number.isFinite(
      Number(
        interestRate.percent
      )
    ) ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(
      interestRate.period ?? ""
    )
  ) {
    valueElement.textContent =
      "—";

    periodElement.textContent =
      "—";

    return;
  }


  const formattedRate =
    new Intl.NumberFormat(
      "cs-CZ",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    ).format(
      interestRate.percent
    );


  const [
    year,
    month
  ] =
    interestRate.period
      .split("-")
      .map(Number);


  const formattedPeriod =
    new Intl.DateTimeFormat(
      "cs-CZ",
      {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      }
    ).format(
      new Date(
        Date.UTC(
          year,
          month - 1,
          1
        )
      )
    );


  valueElement.textContent =
    `${formattedRate} %`;


  periodElement.textContent =
    `${formattedPeriod} · ECB`;


  const sourceEcbPeriod =
    document.querySelector(
      "#source-ecb-period"
    );


  if (
    sourceEcbPeriod
  ) {
    sourceEcbPeriod.textContent =
      formattedPeriod;
  }
}


/* ---------------------------------------------------------
   RENDER
--------------------------------------------------------- */

function render(
  data
) {
  const latest =
    data.latest;


  const forecast =
    data.forecast;


  document.querySelector(
    "#debt"
  ).textContent =
    formatNumber(
      latest.debt
        .czk_billion
    );


  document.querySelector(
    "#period"
  ).textContent =
    latest.period;


  document.querySelector(
    "#debt-gdp"
  ).textContent =
    formatNumber(
      latest.debt
        .percent_gdp
    );


  document.querySelector(
    "#period-gdp"
  ).textContent =
    latest.period;


  const forecastElement =
    document.querySelector(
      "#forecast"
    );

  const forecastYearElement =
    document.querySelector(
      "#forecast-year"
    );

  if (
    forecastElement
  ) {
    forecastElement.textContent =
      formatNumber(
        forecast
          .debt_percent_gdp
      );
  }

  if (
    forecastYearElement
  ) {
    forecastYearElement.textContent =
      `${t.yearPrefix} ${forecast.year}`;
  }


  const populationElement =
    document.querySelector(
      "#population"
    );


  const populationDateElement =
    document.querySelector(
      "#population-date"
    );


  const debtPerCapitaElement =
    document.querySelector(
      "#debt-per-capita"
    );


  if (
    populationElement &&
    Number.isFinite(
      Number(
        data.population
          ?.value
      )
    )
  ) {
    populationElement.textContent =
      formatInteger(
        data.population
          .value
      );
  }


  if (
    populationDateElement &&
    data.population?.date
  ) {
    populationDateElement.textContent =
      language === "en"
        ? `as of ${formatPopulationDate(
            data.population.date
          )}`
        : `k ${formatPopulationDate(
            data.population.date
          )}`;
  }


  if (
    debtPerCapitaElement &&
    Number.isFinite(
      Number(
        data.debt_per_capita
          ?.czk
      )
    )
  ) {
    debtPerCapitaElement.textContent =
      `${formatInteger(
        data.debt_per_capita
          .czk
      )} ${
        language === "en"
          ? "CZK"
          : "Kč"
      }`;
  }


  document.querySelector(
    "#forecast-debt"
  ).textContent =
    formatNumber(
      forecast
        .debt_percent_gdp
    );


  document.querySelector(
    "#forecast-balance"
  ).textContent =
    formatNumber(
      forecast
        .balance_percent_gdp
    );


  const difference =
    data.comparison
      .forecast_debt_minus_latest_actual;


  document.querySelector(
    "#forecast-difference"
  ).textContent =
    `${
      difference >
      0
        ? "+"
        : ""
    }${formatNumber(
      difference
    )}`;


  document.querySelector(
    "#updated"
  ).textContent =
    `${t.processedPrefix} ${formatDate(
      data.generated_at
    )}`;


  createChart({
    container:
      document.querySelector(
        "#debt-chart"
      ),

    series:
      data.history
        .debt_czk,

    unit:
      t.debtChartUnit,

    xAxisLabel:
      t.year,

    yAxisLabel:
      t.debtChartAxis
  });


  createChart({
    container:
      document.querySelector(
        "#debt-gdp-chart"
      ),

    series:
      data.history
        .debt_percent_gdp,

    unit:
      t.debtGdpUnit,

    xAxisLabel:
      t.year,

    yAxisLabel:
      t.debtGdpAxis
  });


  renderMethodology(
    data
  );


  startDebtClock(
    data
  );
}



/* ---------------------------------------------------------
   ERROR
--------------------------------------------------------- */

function renderError(
  error
) {
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




/* ---------------------------------------------------------
   CS HOMEPAGE EU MAP
--------------------------------------------------------- */

(() => {

const GISCO_URL =
  "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2024_4326_LEVL_0.geojson";


const locale = "cs-CZ";


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

function getCountryName(
  country
) {
  return (
    country.name_cs ??
    country.name_cz ??
    getCountryName(country) ??
    country.code
  );
}


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
  const slug =
    country.slug ??
    country.slug_cs;

  return `/cs/zeme/${slug}/`;
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
            language: "cs"
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
          ${getCountryName(country)}
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
    "Mapa Evropské unie zobrazující veřejný dluh jako procento HDP"
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
        getCountryName(country);
    }


    if (
      selectedValue
    ) {
      selectedValue.textContent =
        `${formatNumber(
          value
        )} % HDP · No. ${country.rank.debt_percent_gdp} in the EU`;
    }


    if (
      selectedLink
    ) {
      selectedLink.href =
        countryUrl(
          country
        );


      selectedLink.innerHTML = `
        Zobrazit ${getCountryName(country)}
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
        getCountryName(country);
    }


    if (
      tooltipDebt
    ) {
      tooltipDebt.textContent =
        `${formatNumber(
          getDebtValue(
            country
          )
        )} % HDP`;
    }


    if (
      tooltipRank
    ) {
      tooltipRank.textContent =
        `Pořadí v EU: ${country.rank.debt_percent_gdp} z 27`;
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
      `${getCountryName(country)}: ${formatNumber(
        getDebtValue(
          country
        )
      )} % HDP`
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
            language: "cs"
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
      `${getCountryName(country)}: ${formatNumber(
        getDebtValue(
          country
        )
      )} % HDP`
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
            language: "cs"
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




window.renderCzechHomepageMap =
  async function renderCzechHomepageMap(
    eu
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
      console.error(
        error
      );

      container.innerHTML = `
        <div class="eu-map-error">

          <p>
            Interaktivní mapu se nepodařilo načíst.
          </p>

          <a href="/cs/zebricek/#zeme">
            Zobrazit všech 27 zemí →
          </a>

        </div>
      `;
    }
  };

})();


/* ---------------------------------------------------------
   START
--------------------------------------------------------- */

Promise.all([
  loadOverview(),
  loadEU()
])
  .then(
    ([
      overview,
      eu
    ]) => {
      render(
        overview
      );


      renderEUPosition(
        eu
      );


      if (
        typeof window.renderCzechHomepageMap ===
        "function"
      ) {
        window.renderCzechHomepageMap(
          eu
        );
      }


      renderHomepageInterestRate(
        eu
      );


      setupHomepageEmbedBuilder();
    }
  )
  .catch(
    renderError
  );