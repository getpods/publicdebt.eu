function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function daysInYear(year) {
  return new Date(year, 1, 29).getDate() === 29
    ? 366
    : 365;
}

function formatCzechNumber(
  value,
  maximumFractionDigits = 1
) {
  return new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(value);
}

function formatDeficitBillions(value) {
  const billions =
    value / 1_000_000_000;

  return `${formatCzechNumber(
    billions,
    Number.isInteger(billions)
      ? 0
      : 1
  )} mld. Kč`;
}

function formatRate(value) {
  if (value >= 1_000_000_000) {
    return {
      value: formatCzechNumber(
        value / 1_000_000_000,
        2
      ),
      unit: "mld. Kč"
    };
  }

  if (value >= 1_000_000) {
    return {
      value: formatCzechNumber(
        value / 1_000_000,
        1
      ),
      unit: "mil. Kč"
    };
  }

  return {
    value: formatCzechNumber(
      Math.round(value),
      0
    ),
    unit: "Kč"
  };
}

function calendarIcon({
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

    <circle
      cx="${cx - 13}"
      cy="${cy + 4}"
      r="3.5"
      fill="${color}"
    />

    <circle
      cx="${cx}"
      cy="${cy + 4}"
      r="3.5"
      fill="${color}"
    />

    <circle
      cx="${cx + 13}"
      cy="${cy + 4}"
      r="3.5"
      fill="${color}"
    />

    <circle
      cx="${cx - 13}"
      cy="${cy + 17}"
      r="3.5"
      fill="${color}"
    />

    <circle
      cx="${cx}"
      cy="${cy + 17}"
      r="3.5"
      fill="${color}"
    />

    <circle
      cx="${cx + 13}"
      cy="${cy + 17}"
      r="3.5"
      fill="${color}"
    />
  `;
}

function clockIcon({
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

function stopwatchIcon({
  cx,
  cy,
  color
}) {
  return `
    <circle
      cx="${cx}"
      cy="${cy + 4}"
      r="29"
      fill="none"
      stroke="${color}"
      stroke-width="5"
    />

    <line
      x1="${cx}"
      y1="${cy - 25}"
      x2="${cx}"
      y2="${cy - 37}"
      stroke="${color}"
      stroke-width="5"
      stroke-linecap="round"
    />

    <line
      x1="${cx - 10}"
      y1="${cy - 37}"
      x2="${cx + 10}"
      y2="${cy - 37}"
      stroke="${color}"
      stroke-width="5"
      stroke-linecap="round"
    />

    <line
      x1="${cx + 22}"
      y1="${cy - 18}"
      x2="${cx + 31}"
      y2="${cy - 27}"
      stroke="${color}"
      stroke-width="5"
      stroke-linecap="round"
    />

    <line
      x1="${cx}"
      y1="${cy + 4}"
      x2="${cx + 10}"
      y2="${cy - 9}"
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
      font-size="54"
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
      font-size="32"
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

export async function renderCzBudget({
  theme,
  preset
}) {
  const {
    width,
    height
  } =
    theme.sizes[
      preset.platform
    ];

  const year =
    Number(preset.year);

  const deficit =
    Number(preset.deficit_czk);

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2200
  ) {
    throw new Error(
      `Invalid cz-budget year: ${preset.year}`
    );
  }

  if (
    !Number.isFinite(deficit) ||
    deficit <= 0
  ) {
    throw new Error(
      `Invalid cz-budget deficit_czk: ${preset.deficit_czk}`
    );
  }

  const days =
    daysInYear(year);

  const perDay =
    deficit / days;

  const perHour =
    perDay / 24;

  const perSecond =
    perHour / 3600;

  const day =
    formatRate(perDay);

  const hour =
    formatRate(perHour);

  const second =
    formatRate(perSecond);

  const source =
    preset.source ||
    "Ministerstvo financí ČR";

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
    >
      <defs>
        <linearGradient
          id="budget-bg"
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
          id="budget-hero"
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
          id="budget-shadow"
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
        fill="url(#budget-bg)"
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

        <!-- Czech marker -->
        <text
          x="${width - 74}"
          y="82"
          text-anchor="end"
          fill="${theme.colors.muted}"
          font-size="17"
          font-weight="800"
          letter-spacing="3"
        >
          ČESKO
        </text>

        <!-- Czech flag -->
        <g
          transform="translate(${width - 168} 101)"
        >
          <rect
            x="0"
            y="0"
            width="94"
            height="54"
            rx="4"
            fill="#ffffff"
            stroke="${theme.colors.line}"
            stroke-width="1"
          />

          <path
            d="M 0 27 L 94 27 L 94 54 L 0 54 Z"
            fill="#d7141a"
          />

          <path
            d="M 0 0 L 45 27 L 0 54 Z"
            fill="#11457e"
          />
        </g>

        <!-- Headline -->
        <text
          x="72"
          y="250"
          fill="${theme.colors.text}"
          font-size="64"
          font-weight="800"
          letter-spacing="-1.8"
        >
          Navrhovaný schodek
        </text>

        <text
          x="72"
          y="316"
          fill="${theme.colors.text}"
          font-size="64"
          font-weight="800"
          letter-spacing="-1.8"
        >
          státního rozpočtu
        </text>

        <text
          x="72"
          y="382"
          fill="${theme.colors.text}"
          font-size="64"
          font-weight="800"
          letter-spacing="-1.8"
        >
          pro rok ${year}
        </text>

        <text
          x="74"
          y="438"
          fill="${theme.colors.muted}"
          font-size="26"
          font-weight="400"
        >
          Ministerstvo financí navrhuje schodek ve výši
        </text>

        <text
          x="74"
          y="476"
          fill="${theme.colors.muted}"
          font-size="26"
          font-weight="400"
        >
          ${escapeXml(formatDeficitBillions(deficit))}.
        </text>

        <!-- PublicDebt-style hero -->
        <g
          filter="url(#budget-shadow)"
        >
          <rect
            x="60"
            y="535"
            width="${width - 120}"
            height="315"
            rx="28"
            fill="url(#budget-hero)"
            stroke="${theme.colors.line}"
            stroke-width="1.5"
          />

          <!-- Gold top accent -->
          <path
            d="
              M 88 535
              H ${width - 88}
            "
            fill="none"
            stroke="${theme.colors.gold}"
            stroke-width="5"
            stroke-linecap="round"
          />

          <text
            x="100"
            y="610"
            fill="${theme.colors.blue}"
            font-size="18"
            font-weight="800"
            letter-spacing="4"
          >
            NAVRHOVANÝ SCHODEK
          </text>

          <text
            x="100"
            y="760"
            fill="${theme.colors.text}"
            font-size="132"
            font-weight="800"
            letter-spacing="-4"
          >
            ${escapeXml(formatDeficitBillions(deficit))}
          </text>

          <!-- Gold clock -->
          <circle
            cx="${width - 175}"
            cy="688"
            r="82"
            fill="${theme.colors.gold}"
            fill-opacity="0.13"
          />

          <circle
            cx="${width - 175}"
            cy="688"
            r="50"
            fill="none"
            stroke="${theme.colors.goldDark}"
            stroke-width="7"
          />

          <line
            x1="${width - 175}"
            y1="688"
            x2="${width - 175}"
            y2="652"
            stroke="${theme.colors.goldDark}"
            stroke-width="7"
            stroke-linecap="round"
          />

          <line
            x1="${width - 175}"
            y1="688"
            x2="${width - 142}"
            y2="711"
            stroke="${theme.colors.goldDark}"
            stroke-width="7"
            stroke-linecap="round"
          />
        </g>

        <!-- Rate cards -->
        ${rateCard({
          x: 60,
          y: 890,
          width: 340,
          height: 335,
          value: day.value,
          unit: day.unit,
          label: "ZA DEN",
          icon: calendarIcon,
          accent: theme.colors.blue,
          theme
        })}

        ${rateCard({
          x: 430,
          y: 890,
          width: 340,
          height: 335,
          value: hour.value,
          unit: hour.unit,
          label: "ZA HODINU",
          icon: clockIcon,
          accent: theme.colors.tealDark,
          theme
        })}

        ${rateCard({
          x: 800,
          y: 890,
          width: 340,
          height: 335,
          value: second.value,
          unit: second.unit,
          label: "ZA SEKUNDU",
          icon: stopwatchIcon,
          accent: theme.colors.goldDark,
          theme
        })}

        <!-- Methodology -->
        <text
          x="72"
          y="1296"
          fill="${theme.colors.muted}"
          font-size="17"
          font-weight="500"
        >
          Přepočet ročního schodku na konstantní tempo pro ilustraci.
        </text>

        <text
          x="72"
          y="1325"
          fill="${theme.colors.muted}"
          font-size="17"
          font-weight="500"
        >
          Nejde o skutečný průběžný tok zadlužování.
        </text>

        <text
          x="72"
          y="1367"
          fill="${theme.colors.text}"
          font-size="16"
          font-weight="700"
        >
          Zdroj:
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
          fill="${theme.colors.text}"
          font-size="19"
          font-weight="800"
          letter-spacing="1.6"
        >
          PUBLICDEBT.EU
        </text>
      </g>

      <!-- Same perimeter as other social graphics -->
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
