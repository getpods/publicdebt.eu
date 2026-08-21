const language =
  document.documentElement.lang ===
  "en"
    ? "en"
    : "cs";


const locale =
  language === "en"
    ? "en-GB"
    : "cs-CZ";


const text = {
  cs: {
    perSecond:
      currency =>
        `${currency} / sekundu`,

    rising:
      "Dluh meziročně roste.",

    falling:
      "Dluh meziročně klesá.",

    unchanged:
      "Dluh je meziročně beze změny.",

    method:
      (
        from,
        to
      ) =>
        `Orientační průměr podle meziroční změny mezi ${from} a ${to}.`,

    title:
      country =>
        `Změna veřejného dluhu – ${country} | PublicDebt.eu`,

    error:
      "Data se nepodařilo načíst.",

    home:
      "/cs/",

    countryPath:
      country =>
        `/cs/zeme/${country.slug}/`
  },


  en: {
    perSecond:
      currency =>
        `${currency} / second`,

    rising:
      "Public debt is rising year on year.",

    falling:
      "Public debt is falling year on year.",

    unchanged:
      "Public debt is unchanged year on year.",

    method:
      (
        from,
        to
      ) =>
        `Approximate average based on the year-on-year change between ${from} and ${to}.`,

    title:
      country =>
        `Public debt change – ${country} | PublicDebt.eu`,

    error:
      "Data could not be loaded.",

    home:
      "/en/",

    countryPath:
      country =>
        `/en/countries/${country.slug_en}/`
  }
};


const t =
  text[language];


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


function formatSignedInteger(
  value
) {
  const rounded =
    Math.round(
      value
    );


  /*
   * Při růstu nezobrazujeme plus.
   * Při poklesu zachováváme minus.
   */

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


async function loadJSON(
  url
) {
  const response =
    await fetch(
      url,
      {
        cache: "no-store"
      }
    );


  if (
    !response.ok
  ) {
    throw new Error(
      `Data error ${response.status}: ${url}`
    );
  }


  return response.json();
}



/* ---------------------------------------------------------
   QUERY PARAMETERS
--------------------------------------------------------- */

const params =
  new URLSearchParams(
    window.location.search
  );


/* ---------------------------------------------------------
   COUNTRY
--------------------------------------------------------- */

const countryCode =
  (
    params.get(
      "country"
    ) ??
    "CZ"
  )
    .trim()
    .toUpperCase();


const COUNTRY_CODES =
  new Set([
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EE",
    "FI",
    "FR",
    "DE",
    "EL",
    "HU",
    "IE",
    "IT",
    "LV",
    "LT",
    "LU",
    "MT",
    "NL",
    "PL",
    "PT",
    "RO",
    "SK",
    "SI",
    "ES",
    "SE"
  ]);


if (
  !COUNTRY_CODES.has(
    countryCode
  )
) {
  throw new Error(
    `Unsupported country: ${countryCode}`
  );
}



/* ---------------------------------------------------------
   THEME
--------------------------------------------------------- */

const requestedTheme =
  (
    params.get(
      "theme"
    ) ??
    "dark"
  )
    .trim()
    .toLowerCase();


const allowedThemes =
  new Set([
    "dark",
    "light",
    "auto"
  ]);


const theme =
  allowedThemes.has(
    requestedTheme
  )
    ? requestedTheme
    : "dark";


document.body.dataset.theme =
  theme;



/* ---------------------------------------------------------
   CLOCK
--------------------------------------------------------- */

function startDebtClock(
  data
) {
  const country =
    data?.country;


  const clock =
    data?.debt_clock;


  if (
    !country ||
    !clock
  ) {
    throw new Error(
      "Debt clock data are missing."
    );
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
    throw new Error(
      "Debt clock rate is missing."
    );
  }


  const currencyLabel =
    language === "en"
      ? (
          clock.currency ??
          clock.currency_label
        )
      : (
          clock.currency_label ??
          clock.currency
        );


  const countryName =
    language === "en"
      ? country.name
      : country.name_cs;


  const countryElement =
    document.querySelector(
      "#embed-country"
    );


  const rateElement =
    document.querySelector(
      "#embed-debt-rate"
    );


  const rateUnitElement =
    document.querySelector(
      "#embed-debt-rate-unit"
    );


  const valueElement =
    document.querySelector(
      "#embed-debt-value"
    );


  const methodElement =
    document.querySelector(
      "#embed-debt-method"
    );


  const trendElement =
    document.querySelector(
      "#embed-debt-trend"
    );


  const sourceLink =
    document.querySelector(
      "#embed-source-link"
    );


  if (
    !countryElement ||
    !rateElement ||
    !rateUnitElement ||
    !valueElement ||
    !methodElement ||
    !trendElement ||
    !sourceLink
  ) {
    throw new Error(
      "Debt clock elements are missing."
    );
  }


  countryElement.textContent =
    countryName;


  rateElement.textContent =
    formatSignedInteger(
      rate
    );


  rateUnitElement.textContent =
    t.perSecond(
      currencyLabel
    );


  valueElement.textContent =
    `0 ${currencyLabel}`;


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
    t.method(
      clock.period_from,
      clock.period_to
    );


  if (
    language === "en" &&
    country.slug_en
  ) {
    sourceLink.href =
      t.countryPath(
        country
      );
  } else if (
    language === "cs" &&
    country.slug
  ) {
    sourceLink.href =
      t.countryPath(
        country
      );
  } else {
    sourceLink.href =
      t.home;
  }


  document.title =
    t.title(
      countryName
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
      `${formatSignedInteger(
        accumulated
      )} ${currencyLabel}`;


    requestAnimationFrame(
      frame
    );
  }


  requestAnimationFrame(
    frame
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


  document.body.innerHTML = `
    <main class="debt-clock-embed debt-clock-embed-error">

      <p>
        ${t.error}
      </p>

      <a
        href="${t.home}"
        target="_blank"
        rel="noopener noreferrer"
      >
        PublicDebt.eu ↗
      </a>

    </main>
  `;
}



/* ---------------------------------------------------------
   START
--------------------------------------------------------- */

loadJSON(
  `/data/countries/${countryCode.toLowerCase()}.json`
)
  .then(
    startDebtClock
  )
  .catch(
    renderError
  );