import {
  findCountry,
  findCountryDetails
} from "../data.js";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function periodLabel(period) {
  if (!period) {
    return "";
  }

  const match =
    period.match(
      /^(\d{4})-Q([1-4])$/
    );

  if (!match) {
    return period;
  }

  return `Q${match[2]} ${match[1]}`;
}

function formatNumber(
  value,
  maximumFractionDigits = 1
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits,
      minimumFractionDigits: 0
    }
  ).format(value);
}

function formatRate(
  value,
  currency
) {
  const absolute =
    Math.abs(value);

  const sign =
    value < 0
      ? "−"
      : "";

  if (
    absolute >=
    1_000_000_000
  ) {
    return {
      value:
        `${sign}${formatNumber(
          absolute /
            1_000_000_000,
          2
        )}`,
      unit:
        `bn ${currency}`
    };
  }

  if (
    absolute >=
    1_000_000
  ) {
    return {
      value:
        `${sign}${formatNumber(
          absolute /
            1_000_000,
          1
        )}`,
      unit:
        `m ${currency}`
    };
  }

  return {
    value:
      `${sign}${formatNumber(
        absolute,
        0
      )}`,
    unit:
      currency
  };
}

function getDirectionWord(
  value
) {
  if (value > 0) {
    return "increase";
  }

  if (value < 0) {
    return "decrease";
  }

  return "change";
}

function minuteIcon({
  cx,
  cy,
  color
}) {
  return `
    <circle
      cx="${cx}"
      cy="${cy}"
      r="31"
      fill="none"
      stroke="${color}"
      stroke-width="5"
    />

    <line
      x1="${cx}"
      y1="${cy}"
      x2="${cx}"
      y2="${cy - 19}"
      stroke="${color}"
      stroke-width="5"
      stroke-linecap="round"
    />

    <line
      x1="${cx}"
      y1="${cy}"
      x2="${cx + 15}"
      y2="${cy + 10}"
      stroke="${color}"
      stroke-width="5"
      stroke-linecap="round"
    />
  `;
}

function hourIcon({
  cx,
  cy,
  color
}) {
  return `
    <circle
      cx="${cx}"
      cy="${cy}"
      r="31"
      fill="none"
      stroke="${color}"
      stroke-width="5"
    />

    <line
      x1="${cx}"
      y1="${cy}"
      x2="${cx}"
      y2="${cy - 18}"
      stroke="${color}"
      stroke-width="5"
      stroke-linecap="round"
    />

    <line
      x1="${cx}"
      y1="${cy}"
      x2="${cx + 18}"
      y2="${cy + 7}"
      stroke="${color}"
      stroke-width="5"
      stroke-linecap="round"
    />
  `;
}

function dayIcon({
  cx,
  cy,
  color
}) {
  return `
    <rect
      x="${cx - 27}"
      y="${cy - 22}"
      width="54"
      height="48"
      rx="8"
      fill="none"
      stroke="${color}"
      stroke-width="5"
    />

    <line
      x1="${cx - 27}"
      y1="${cy - 8}"
      x2="${cx + 27}"
      y2="${cy - 8}"
      stroke="${color}"
      stroke-width="5"
    />

    <line
      x1="${cx - 14}"
      y1="${cy - 31}"
      x2="${cx - 14}"
      y2="${cy - 17}"
      stroke="${color}"
      stroke-width="5"
      stroke-linecap="round"
    />

    <line
      x1="${cx + 14}"
      y1="${cy - 31}"
      x2="${cx + 14}"
      y2="${cy - 17}"
      stroke="${color}"
      stroke-width="5"
      stroke-linecap="round"
    />
  `;
}

function rateCard({
  x,
  y,
  width,
  height,
  value,
  unit,
  label,
  icon,
  accent,
  theme
}) {
  const cx =
    x + width / 2;

  return `
    <rect
      x="${x}"
      y="${y}"
      width="${width}"
      height="${height}"
      rx="24"
      fill="#ffffff"
      stroke="${theme.colors.line}"
      stroke-width="1.5"
    />

    <circle
      cx="${cx}"
      cy="${y + 75}"
      r="48"
      fill="${accent}"
      fill-opacity="0.10"
    />

    ${icon({
      cx,
      cy: y + 75,
      color: accent
    })}

    <text
      x="${cx}"
      y="${y + 178}"
      text-anchor="middle"
      fill="${theme.colors.text}"
      font-size="52"
      font-weight="800"
      letter-spacing="-1.5"
    >
      ${escapeXml(value)}
    </text>

    <text
      x="${cx}"
      y="${y + 225}"
      text-anchor="middle"
      fill="${theme.colors.text}"
      font-size="30"
      font-weight="800"
    >
      ${escapeXml(unit)}
    </text>

    <text
      x="${cx}"
      y="${y + 275}"
      text-anchor="middle"
      fill="${theme.colors.muted}"
      font-size="18"
      font-weight="800"
      letter-spacing="2"
    >
      ${escapeXml(label)}
    </text>
  `;
}

export function renderDebtClock({
  theme,
  data,
  countriesData,
  preset
}) {
  const {
    width,
    height
  } =
    theme.sizes[
      preset.platform
    ];

  const country =
    findCountry(
      data,
      preset.country
    );

  if (!country) {
    throw new Error(
      `Country ${preset.country} not found.`
    );
  }

  const details =
    findCountryDetails(
      countriesData,
      country.code
    );

  if (!details) {
    throw new Error(
      `Country details for ${country.code} not found.`
    );
  }

  const clock =
    details.debt_clock;

  if (!clock) {
    throw new Error(
      `Country ${country.code} does not contain debt_clock data.`
    );
  }

  const rate =
    Number(
      clock.amount_per_second
    );

  if (
    !Number.isFinite(rate)
  ) {
    throw new Error(
      `Invalid debt clock rate for ${country.code}.`
    );
  }

  const currency =
    clock.currency_label ??
    clock.currency ??
    "";

  const direction =
    getDirectionWord(
      rate
    );

  const from =
    periodLabel(
      clock.period_from
    );

  const to =
    periodLabel(
      clock.period_to
    );

  const perMinute =
    rate * 60;

  const perHour =
    rate * 3600;

  const perDay =
    rate * 86400;

  const minute =
    formatRate(
      perMinute,
      currency
    );

  const hour =
    formatRate(
      perHour,
      currency
    );

  const day =
    formatRate(
      perDay,
      currency
    );

  const heroRate =
    formatRate(
      rate,
      currency
    );

  const source =
    preset.source ||
    "Eurostat";

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
    >

      <defs>

        <linearGradient
          id="clock-bg"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#ffffff"
          />

          <stop
            offset="100%"
            stop-color="#f7faff"
          />
        </linearGradient>

        <linearGradient
          id="clock-hero"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="#eef4ff"
          />

          <stop
            offset="58%"
            stop-color="#ffffff"
          />

          <stop
            offset="100%"
            stop-color="#fff9e8"
          />
        </linearGradient>

        <filter
          id="clock-shadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="150%"
        >
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="20"
            flood-color="#155eef"
            flood-opacity="0.08"
          />
        </filter>

      </defs>

      <rect
        width="${width}"
        height="${height}"
        fill="url(#clock-bg)"
      />

      <g
        font-family="${theme.font.family}"
      >

        <!-- Brand -->

        <text
          x="72"
          y="90"
          fill="${theme.colors.text}"
          font-size="44"
          font-weight="800"
        >Public<tspan fill="${theme.colors.blue}">Debt.eu</tspan></text>

        <text
          x="74"
          y="122"
          fill="${theme.colors.muted}"
          font-size="14"
          font-weight="700"
          letter-spacing="2.2"
        >
          EUROPEAN PUBLIC FINANCE DATA
        </text>

        <!-- Country identity -->

        <rect
          x="${width - 240}"
          y="54"
          width="166"
          height="76"
          rx="18"
          fill="${theme.colors.blueSoft}"
          stroke="${theme.colors.line}"
          stroke-width="1"
        />

        <text
          x="${width - 218}"
          y="84"
          fill="${theme.colors.blue}"
          font-size="15"
          font-weight="800"
          letter-spacing="2"
        >
          ${escapeXml(country.code)}
        </text>

        <text
          x="${width - 218}"
          y="111"
          fill="${theme.colors.text}"
          font-size="18"
          font-weight="800"
          letter-spacing="1.2"
        >
          ${escapeXml(
            country.name.toUpperCase()
          )}
        </text>

        <!-- Headline -->

        <text
          x="72"
          y="230"
          fill="${theme.colors.text}"
          font-size="58"
          font-weight="800"
          letter-spacing="-1.5"
        >
          HOW MUCH PUBLIC DEBT
        </text>

        <text
          x="72"
          y="296"
          fill="${theme.colors.text}"
          font-size="58"
          font-weight="800"
          letter-spacing="-1.5"
        >
          CAN ADD UP IN 60 SECONDS?
        </text>

        <text
          x="74"
          y="352"
          fill="${theme.colors.muted}"
          font-size="24"
          font-weight="400"
        >
          Estimated ${escapeXml(direction)} in public debt
        </text>

        <text
          x="74"
          y="388"
          fill="${theme.colors.muted}"
          font-size="24"
          font-weight="400"
        >
          between ${escapeXml(from)} and ${escapeXml(to)}.
        </text>

        <!-- Hero card -->

        <g
          filter="url(#clock-shadow)"
        >
          <rect
            x="60"
            y="455"
            width="${width - 120}"
            height="315"
            rx="28"
            fill="url(#clock-hero)"
            stroke="${theme.colors.line}"
            stroke-width="1.5"
          />

          <path
            d="
              M 88 485
              H ${width - 88}
            "
            fill="none"
            stroke="${theme.colors.gold}"
            stroke-width="5"
            stroke-linecap="round"
          />

          <text
            x="100"
            y="530"
            fill="${theme.colors.blue}"
            font-size="18"
            font-weight="800"
            letter-spacing="4"
          >
            ${escapeXml(country.name.toUpperCase())} · ESTIMATED ${direction.toUpperCase()} RATE
          </text>

          <text
            x="100"
            y="680"
            fill="${theme.colors.text}"
            font-size="118"
            font-weight="800"
            letter-spacing="-4"
          >
            ${escapeXml(
              heroRate.value
            )}
            <tspan
              font-size="58"
              letter-spacing="-1"
            >
              ${escapeXml(
                heroRate.unit
              )}
            </tspan>
          </text>

          <text
            x="104"
            y="725"
            fill="${theme.colors.muted}"
            font-size="21"
            font-weight="800"
            letter-spacing="2.2"
          >
            PER SECOND
          </text>

          <!-- Clock icon -->

          <circle
            cx="${width - 175}"
            cy="608"
            r="82"
            fill="${theme.colors.gold}"
            fill-opacity="0.13"
          />

          <circle
            cx="${width - 175}"
            cy="608"
            r="50"
            fill="none"
            stroke="${theme.colors.goldDark}"
            stroke-width="7"
          />

          <line
            x1="${width - 175}"
            y1="608"
            x2="${width - 175}"
            y2="572"
            stroke="${theme.colors.goldDark}"
            stroke-width="7"
            stroke-linecap="round"
          />

          <line
            x1="${width - 175}"
            y1="608"
            x2="${width - 142}"
            y2="631"
            stroke="${theme.colors.goldDark}"
            stroke-width="7"
            stroke-linecap="round"
          />

        </g>

        <!-- Rate cards -->

        ${rateCard({
          x: 60,
          y: 840,
          width: 340,
          height: 335,
          value:
            minute.value,
          unit:
            minute.unit,
          label:
            "IN 60 SECONDS",
          icon:
            minuteIcon,
          accent:
            theme.colors.blue,
          theme
        })}

        ${rateCard({
          x: 430,
          y: 840,
          width: 340,
          height: 335,
          value:
            hour.value,
          unit:
            hour.unit,
          label:
            "IN ONE HOUR",
          icon:
            hourIcon,
          accent:
            theme.colors.tealDark,
          theme
        })}

        ${rateCard({
          x: 800,
          y: 840,
          width: 340,
          height: 335,
          value:
            day.value,
          unit:
            day.unit,
          label:
            "IN ONE DAY",
          icon:
            dayIcon,
          accent:
            theme.colors.goldDark,
          theme
        })}

        <!-- Methodology -->

        <text
          x="72"
          y="1255"
          fill="${theme.colors.muted}"
          font-size="17"
          font-weight="500"
        >
          Constant-rate illustration based on the change in public debt
        </text>

        <text
          x="72"
          y="1284"
          fill="${theme.colors.muted}"
          font-size="17"
          font-weight="500"
        >
          between ${escapeXml(from)} and ${escapeXml(to)}.
          It is not a literal real-time borrowing flow.
        </text>

        <text
          x="72"
          y="1330"
          fill="${theme.colors.text}"
          font-size="16"
          font-weight="700"
        >
          Source:
          <tspan
            fill="${theme.colors.muted}"
            font-weight="500"
          > ${escapeXml(source)}</tspan>
        </text>

        <!-- Footer -->

        <text
          x="72"
          y="${height - 52}"
          fill="${theme.colors.muted}"
          font-size="14"
          font-weight="700"
          letter-spacing="2"
        >
          FACTS / DATA / CONTEXT / EUROPE
        </text>

        <text
          x="${width - 70}"
          y="${height - 52}"
          text-anchor="end"
          font-size="19"
          font-weight="800"
          letter-spacing="1.1"
        >
          <tspan
            fill="${theme.colors.text}"
          >PUBLIC</tspan><tspan
            fill="${theme.colors.blue}"
          >DEBT.EU</tspan>
        </text>

      </g>

      <rect
        x="14"
        y="14"
        width="${width - 28}"
        height="${height - 28}"
        rx="16"
        fill="none"
        stroke="${theme.colors.blue}"
        stroke-width="2"
      />

    </svg>
  `;
}
