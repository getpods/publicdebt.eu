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

    billion:
      currency =>
        `mld. ${currency}`,

    perSecond:
      currency =>
        `${currency} / sekundu`,

    rising:
      "Dluh meziročně roste.",

    falling:
      "Dluh meziročně klesá.",

    unchanged:
      "Dluh je meziročně beze změny.",

    clockMethod:
      (
        from,
        to
      ) =>
        `Orientační průměr podle meziroční změny veřejného dluhu mezi ${from} a ${to}.`,

    title:
      country =>
        `Veřejný dluh – ${country} | PublicDebt.eu`,

    intro:
      country =>
        `Aktuální veřejný dluh země ${country}, jeho podíl na HDP a historický vývoj.`,

    chartDescription:
      country =>
        `Historický vývoj veřejného dluhu země ${country} vůči HDP.`,

    chartUnit:
      "% HDP",

    chartAxis:
      "Dluh / HDP (%)",

    populationDate:
      value =>
        `k ${value}`,

    populationSource:
      year =>
        `k 1. 1. ${year}`,

    updated:
      value =>
        `Data zpracována ${value}`,

    copied:
      "Zkopírováno",

    copyCode:
      "Kopírovat kód",

    iframeTitle:
      "Veřejný dluh – PublicDebt.eu",

    embedPath:
      "/embed/cs/debt-clock/",

    errorEyebrow:
      "CHYBA",

    errorTitle:
      "Data se nepodařilo načíst."
  },


  en: {
    year:
      "Year",

    noData:
      "Data are not available.",

    billion:
      currency =>
        `${currency} bn`,

    perSecond:
      currency =>
        `${currency} / second`,

    rising:
      "Public debt is rising year on year.",

    falling:
      "Public debt is falling year on year.",

    unchanged:
      "Public debt is unchanged year on year.",

    clockMethod:
      (
        from,
        to
      ) =>
        `Approximate average based on the year-on-year change in public debt between ${from} and ${to}.`,

    title:
      country =>
        `Public debt – ${country} | PublicDebt.eu`,

    intro:
      country =>
        `Current public debt of ${country}, its debt-to-GDP ratio and historical development.`,

    chartDescription:
      country =>
        `Historical development of public debt in ${country} relative to GDP.`,

    chartUnit:
      "% of GDP",

    chartAxis:
      "Debt / GDP (%)",

    populationDate:
      value =>
        `as of ${value}`,

    populationSource:
      year =>
        `1 January ${year}`,

    updated:
      value =>
        `Data processed ${value}`,

    copied:
      "Copied",

    copyCode:
      "Copy code",

    iframeTitle:
      "Public debt – PublicDebt.eu",

    embedPath:
      "/embed/en/debt-clock/",

    errorEyebrow:
      "ERROR",

    errorTitle:
      "Data could not be loaded."
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


function formatSignedInteger(
  value
) {
  const rounded =
    Math.round(
      value
    );


  if (
    rounded > 0
  ) {
    return formatInteger(
      rounded
    );
  }


  if (
    rounded < 0
  ) {
    return `−${formatInteger(
      Math.abs(
        rounded
      )
    )}`;
  }


  return "0";
}



/* ---------------------------------------------------------
   COUNTRY
--------------------------------------------------------- */

const countryCode =
  document.body.dataset
    .countryCode;


if (
  !countryCode
) {
  throw new Error(
    "Missing country code."
  );
}


const fileCode =
  countryCode
    .toLowerCase();



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



/* ---------------------------------------------------------
   EMBED BUILDER
--------------------------------------------------------- */

function setupEmbedBuilder() {
  const toggle =
    document.querySelector(
      "#country-embed-toggle"
    );


  const panel =
    document.querySelector(
      "#country-embed-panel"
    );


  const themeSelect =
    document.querySelector(
      "#country-embed-theme"
    );


  const widthSelect =
    document.querySelector(
      "#country-embed-width"
    );


  const previewWrapper =
    document.querySelector(
      "#country-embed-preview-wrapper"
    );


  const preview =
    document.querySelector(
      "#country-embed-preview"
    );


  const codeElement =
    document.querySelector(
      "#country-embed-code"
    );


  const copyButton =
    document.querySelector(
      "#country-embed-copy"
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


  function getPublicEmbedUrl() {
    const theme =
      themeSelect.value;


    return (
      "https://publicdebt.eu" +
      t.embedPath +
      `?country=${countryCode}` +
      `&theme=${theme}`
    );
  }


  function getPreviewUrl() {
    const theme =
      themeSelect.value;


    return (
      window.location.origin +
      t.embedPath +
      `?country=${countryCode}` +
      `&theme=${theme}`
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


      if (
        icon
      ) {
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
    `country-area-${Math.random()
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


  const area =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );


  const commands = [
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


  area.setAttribute(
    "d",
    commands.join(
      " "
    )
  );


  area.setAttribute(
    "fill",
    `url(#${gradientId})`
  );


  area.classList.add(
    "chart-area"
  );


  svg.appendChild(
    area
  );


  /* LINE */

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


  /* HOVER */

  const tooltip =
    document.createElement(
      "div"
    );


  tooltip.className =
    "chart-tooltip";


  tooltip.hidden =
    true;


  let hideTimer =
    null;


  let activePoint =
    null;


  let activeGuide =
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


    hideTimer =
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
          `${
            (
              pointX /
              width
            ) *
            rect.width
          }px`;


        tooltip.style.top =
          `${
            (
              pointY /
              height
            ) *
            rect.height
          }px`;


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
   DEBT CLOCK
--------------------------------------------------------- */

function startDebtClock(
  debtHistory
) {
  const clock =
    debtHistory?.debt_clock;


  if (
    !clock
  ) {
    return;
  }


  const rate =
    Number(
      clock.amount_per_second
    );


  if (
    !Number.isFinite(
      rate
    )
  ) {
    return;
  }


  const currency =
    language === "en"
      ? (
          clock.currency ??
          clock.currency_label
        )
      : (
          clock.currency_label ??
          clock.currency
        );


  const rateElement =
    document.querySelector(
      "#country-debt-clock-rate"
    );


  const rateUnitElement =
    document.querySelector(
      "#country-debt-clock-rate-unit"
    );


  const valueElement =
    document.querySelector(
      "#country-debt-clock-value"
    );


  const valueUnitElement =
    document.querySelector(
      "#country-debt-clock-value-unit"
    );


  const trendElement =
    document.querySelector(
      "#country-debt-clock-trend"
    );


  const methodElement =
    document.querySelector(
      "#country-debt-clock-method"
    );


  if (
    !rateElement ||
    !rateUnitElement ||
    !valueElement ||
    !valueUnitElement ||
    !trendElement ||
    !methodElement
  ) {
    return;
  }


  rateElement.textContent =
    formatSignedInteger(
      rate
    );


  rateUnitElement.textContent =
    t.perSecond(
      currency
    );


  valueElement.textContent =
    "0";


  valueUnitElement.textContent =
    currency;


  if (
    rate > 0
  ) {
    trendElement.textContent =
      t.rising;
  } else if (
    rate < 0
  ) {
    trendElement.textContent =
      t.falling;
  } else {
    trendElement.textContent =
      t.unchanged;
  }


  methodElement.textContent =
    t.clockMethod(
      clock.period_from,
      clock.period_to
    );


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
      formatSignedInteger(
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
   RENDER
--------------------------------------------------------- */

function render(
  eu,
  debtHistory,
  populationHistory
) {
  const country =
    eu.countries.find(
      item =>
        item.code ===
        countryCode
    );


  if (
    !country
  ) {
    throw new Error(
      `Country ${countryCode} was not found.`
    );
  }


  const detailedCountry =
    debtHistory?.country;


  const latestDebt =
    debtHistory?.latest
      ?.debt;


  const currency =
    detailedCountry
      ?.currency;


  if (
    !latestDebt ||
    !currency
  ) {
    throw new Error(
      `Detailed debt data are missing for ${countryCode}.`
    );
  }


  const countryName =
    language === "en"
      ? country.name
      : country.name_cs;


  document.title =
    t.title(
      countryName
    );


  document.querySelector(
    "#country-title"
  ).textContent =
    countryName;


  document.querySelector(
    "#country-intro"
  ).textContent =
    t.intro(
      countryName
    );


  /* TOTAL DEBT */

  const nationalDebtMillion =
    Number(
      latestDebt
        .national_currency
    );


  if (
    !Number.isFinite(
      nationalDebtMillion
    )
  ) {
    throw new Error(
      `Invalid national currency debt for ${countryCode}.`
    );
  }


  const nationalDebtBillion =
    nationalDebtMillion /
    1000;


  document.querySelector(
    "#country-total-debt"
  ).textContent =
    formatNumber(
      nationalDebtBillion
    );


  const currencyLabel =
    language === "en"
      ? (
          currency.code ??
          currency.label
        )
      : currency.label;


  document.querySelector(
    "#country-total-debt-unit"
  ).textContent =
    t.billion(
      currencyLabel
    );


  /* DEBT / GDP */

  document.querySelector(
    "#country-debt-gdp"
  ).textContent =
    formatNumber(
      country.debt
        .percent_gdp
    );


  document.querySelector(
    "#country-period"
  ).textContent =
    country.debt
      .period;


  /* RANK */

  document.querySelector(
    "#country-rank"
  ).textContent =
    `${country.rank.debt_percent_gdp}.`;


  /* POPULATION */

  document.querySelector(
    "#country-population"
  ).textContent =
    formatInteger(
      country.population
        .value
    );


  document.querySelector(
    "#country-population-date"
  ).textContent =
    t.populationDate(
      formatPopulationDate(
        country.population
          .date
      )
    );


  /* DEBT PER CAPITA */

  document.querySelector(
    "#country-debt-per-capita"
  ).textContent =
    formatInteger(
      country.debt_per_capita
        .eur
    );


  /* EU RANKINGS */

  document.querySelector(
    "#rank-gdp"
  ).textContent =
    `${country.rank.debt_percent_gdp}.`;


  document.querySelector(
    "#rank-total"
  ).textContent =
    `${country.rank.debt_euro}.`;


  document.querySelector(
    "#rank-per-capita"
  ).textContent =
    `${country.rank.debt_per_capita_eur}.`;


  /* CHART */

  document.querySelector(
    "#country-chart-description"
  ).textContent =
    t.chartDescription(
      countryName
    );


  /* SOURCES */

  document.querySelector(
    "#country-source-period"
  ).textContent =
    country.debt
      .period;


  document.querySelector(
    "#country-source-population"
  ).textContent =
    t.populationSource(
      country.population
        .year
    );


  document.querySelector(
    "#country-updated"
  ).textContent =
    t.updated(
      formatDate(
        eu.generated_at
      )
    );


  /* DEBT CLOCK */

  startDebtClock(
    debtHistory
  );


  /* EMBED */

  setupEmbedBuilder();


  /* HISTORY */

  createChart({
    container:
      document.querySelector(
        "#country-chart"
      ),

    series:
      debtHistory.history
        .debt_percent_gdp,

    unit:
      t.chartUnit,

    xAxisLabel:
      t.year,

    yAxisLabel:
      t.chartAxis
  });
}



/* ---------------------------------------------------------
   START
--------------------------------------------------------- */

Promise.all([
  loadJSON(
    "/data/eu.json"
  ),

  loadJSON(
    `/data/countries/${fileCode}.json`
  ),

  loadJSON(
    `/data/populations/${fileCode}.json`
  )
])
  .then(
    ([
      eu,
      debtHistory,
      populationHistory
    ]) => {
      render(
        eu,
        debtHistory,
        populationHistory
      );
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