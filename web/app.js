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

async function loadOverview() {
  const response =
    await fetch(
      "/api/overview",
      {
        cache: "no-store"
      }
    );


  if (!response.ok) {
    throw new Error(
      `API error: ${response.status}`
    );
  }


  return response.json();
}


async function loadEU() {
  const response =
    await fetch(
      "/api/eu",
      {
        cache: "no-store"
      }
    );


  if (!response.ok) {
    throw new Error(
      `EU API error: ${response.status}`
    );
  }


  return response.json();
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


  if (
    sourcesUpdated
  ) {
    sourcesUpdated.textContent =
      `${t.processedSourcesPrefix} ${formatDate(
        data.generated_at
      )}.`;
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


  document.querySelector(
    "#forecast"
  ).textContent =
    formatNumber(
      forecast
        .debt_percent_gdp
    );


  document.querySelector(
    "#forecast-year"
  ).textContent =
    `${t.yearPrefix} ${forecast.year}`;


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


      setupHomepageEmbedBuilder();
    }
  )
  .catch(
    renderError
  );