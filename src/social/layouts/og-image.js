import {
  loadGeoJson,
  renderEuCountries
} from "./eu-map.js";

function feature({
  x,
  accent,
  icon,
  title,
  subtitle
}) {
  return `
    <circle
      cx="${x + 34}"
      cy="463"
      r="34"
      fill="${accent}"
      fill-opacity="0.10"
    />

    ${icon}

    <text
      x="${x + 34}"
      y="516"
      text-anchor="middle"
      fill="#0b1739"
      font-size="13"
      font-weight="800"
    >
      ${title}
    </text>

    <text
      x="${x + 34}"
      y="536"
      text-anchor="middle"
      fill="#5f6f8d"
      font-size="11"
      font-weight="600"
    >
      ${subtitle}
    </text>
  `;
}

function barsIcon({
  x,
  color
}) {
  return `
    <rect
      x="${x + 17}"
      y="466"
      width="7"
      height="15"
      rx="2"
      fill="${color}"
    />

    <rect
      x="${x + 29}"
      y="456"
      width="7"
      height="25"
      rx="2"
      fill="${color}"
    />

    <rect
      x="${x + 41}"
      y="445"
      width="7"
      height="36"
      rx="2"
      fill="${color}"
    />
  `;
}

function clockIcon({
  x,
  color
}) {
  return `
    <circle
      cx="${x + 34}"
      cy="463"
      r="19"
      fill="none"
      stroke="${color}"
      stroke-width="4"
    />

    <line
      x1="${x + 34}"
      y1="463"
      x2="${x + 34}"
      y2="451"
      stroke="${color}"
      stroke-width="4"
      stroke-linecap="round"
    />

    <line
      x1="${x + 34}"
      y1="463"
      x2="${x + 44}"
      y2="470"
      stroke="${color}"
      stroke-width="4"
      stroke-linecap="round"
    />
  `;
}

function shieldIcon({
  x,
  color
}) {
  return `
    <path
      d="
        M ${x + 34} 441
        L ${x + 52} 448
        V 461
        C ${x + 52} 474 ${x + 44} 483 ${x + 34} 489
        C ${x + 24} 483 ${x + 16} 474 ${x + 16} 461
        V 448
        Z
      "
      fill="none"
      stroke="${color}"
      stroke-width="3.5"
      stroke-linejoin="round"
    />

    <path
      d="
        M ${x + 26} 463
        L ${x + 32} 469
        L ${x + 43} 456
      "
      fill="none"
      stroke="${color}"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  `;
}

function compareIcon({
  x,
  color
}) {
  return `
    <rect
      x="${x + 15}"
      y="451"
      width="38"
      height="27"
      rx="7"
      fill="none"
      stroke="${color}"
      stroke-width="3"
    />

    <line
      x1="${x + 23}"
      y1="460"
      x2="${x + 45}"
      y2="460"
      stroke="${color}"
      stroke-width="3"
      stroke-linecap="round"
    />

    <line
      x1="${x + 23}"
      y1="469"
      x2="${x + 39}"
      y2="469"
      stroke="${color}"
      stroke-width="3"
      stroke-linecap="round"
    />
  `;
}

function currencyBubble({
  x,
  y,
  radius,
  label,
  fill,
  textColor
}) {
  return `
    <circle
      cx="${x}"
      cy="${y}"
      r="${radius}"
      fill="${fill}"
      fill-opacity="0.11"
    />

    <text
      x="${x}"
      y="${y + radius * 0.28}"
      text-anchor="middle"
      fill="${textColor}"
      font-size="${radius * 0.95}"
      font-weight="700"
    >
      ${label}
    </text>
  `;
}

export async function renderOgImage({
  theme,
  data,
  preset
}) {
  const {
    width,
    height
  } =
    theme.sizes[
      preset.platform
    ];

  const geo =
    await loadGeoJson();

  const euCountries =
    renderEuCountries(
      geo,
      data.countries ?? []
    );

  const realDataX = 70;
  const clocksX = 205;
  const openX = 340;
  const compareX = 475;

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
    >
      <defs>
        <linearGradient
          id="og-bg"
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

        <radialGradient
          id="map-glow"
          cx="50%"
          cy="50%"
          r="50%"
        >
          <stop
            offset="0%"
            stop-color="${theme.colors.blue}"
            stop-opacity="0.10"
          />

          <stop
            offset="100%"
            stop-color="${theme.colors.blue}"
            stop-opacity="0"
          />
        </radialGradient>

        <filter
          id="card-shadow"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="13"
            flood-color="#155eef"
            flood-opacity="0.10"
          />
        </filter>
      </defs>

      <rect
        width="${width}"
        height="${height}"
        fill="url(#og-bg)"
      />

      <!-- Map-side background atmosphere -->
      <circle
        cx="890"
        cy="320"
        r="305"
        fill="url(#map-glow)"
      />

      <path
        d="
          M 780 92
          C 910 20 1085 70 1142 206
        "
        fill="none"
        stroke="${theme.colors.blue}"
        stroke-opacity="0.20"
        stroke-width="2"
        stroke-dasharray="4 9"
      />

      <path
        d="
          M 1005 503
          C 1100 477 1154 416 1168 338
        "
        fill="none"
        stroke="${theme.colors.blue}"
        stroke-opacity="0.18"
        stroke-width="2"
        stroke-dasharray="4 9"
      />

      <g
        font-family="${theme.font.family}"
      >
        <!-- Brand -->
        <text
          x="70"
          y="82"
          fill="${theme.colors.text}"
          font-size="42"
          font-weight="800"
        >Public<tspan fill="${theme.colors.blue}">Debt.eu</tspan></text>

        <text
          x="72"
          y="113"
          fill="${theme.colors.muted}"
          font-size="13"
          font-weight="700"
          letter-spacing="2.1"
        >
          EUROPEAN PUBLIC FINANCE DATA
        </text>

        <!-- Headline -->
        <text
          x="70"
          y="242"
          fill="${theme.colors.text}"
          font-size="68"
          font-weight="800"
          letter-spacing="-2"
        >
          Public debt
        </text>

        <text
          x="70"
          y="308"
          fill="${theme.colors.text}"
          font-size="68"
          font-weight="800"
          letter-spacing="-2"
        >
          across the EU
        </text>

        <!-- Supporting copy -->
        <text
          x="72"
          y="362"
          fill="${theme.colors.muted}"
          font-size="24"
          font-weight="400"
        >
          Reliable data. Meaningful comparisons.
        </text>

        <text
          x="72"
          y="399"
          fill="${theme.colors.muted}"
          font-size="24"
          font-weight="400"
        >
          Debt clocks for all 27 EU countries.
        </text>

        <!-- Feature strip -->
        ${feature({
          x: realDataX,
          accent: theme.colors.blue,
          icon: barsIcon({
            x: realDataX,
            color: theme.colors.blue
          }),
          title: "REAL DATA",
          subtitle: "EUROSTAT"
        })}

        <line
          x1="188"
          y1="437"
          x2="188"
          y2="537"
          stroke="${theme.colors.line}"
          stroke-width="1"
        />

        ${feature({
          x: clocksX,
          accent: theme.colors.gold,
          icon: clockIcon({
            x: clocksX,
            color: theme.colors.goldDark
          }),
          title: "DEBT CLOCKS",
          subtitle: "27 COUNTRIES"
        })}

        <line
          x1="323"
          y1="437"
          x2="323"
          y2="537"
          stroke="${theme.colors.line}"
          stroke-width="1"
        />

        ${feature({
          x: openX,
          accent: theme.colors.teal,
          icon: shieldIcon({
            x: openX,
            color: theme.colors.tealDark
          }),
          title: "TRANSPARENT",
          subtitle: "OPEN SOURCE"
        })}

        <line
          x1="458"
          y1="437"
          x2="458"
          y2="537"
          stroke="${theme.colors.line}"
          stroke-width="1"
        />

        ${feature({
          x: compareX,
          accent: theme.colors.blue,
          icon: compareIcon({
            x: compareX,
            color: theme.colors.blueDark
          }),
          title: "COMPARABLE",
          subtitle: "EU DATA"
        })}

        <!-- EU27 map -->
        <g
          transform="translate(415 20) scale(0.80)"
        >
          ${euCountries}
        </g>

        <!-- Debt-clock feature card -->
        <g
          filter="url(#card-shadow)"
          transform="rotate(-1 1025 185)"
        >
          <rect
            x="880"
            y="66"
            width="292"
            height="238"
            rx="22"
            fill="#ffffff"
            stroke="${theme.colors.line}"
            stroke-width="1"
          />

          <!-- Card eyebrow -->
          <text
            x="908"
            y="105"
            fill="${theme.colors.muted}"
            font-size="13"
            font-weight="800"
            letter-spacing="1.3"
          >
            PUBLIC DEBT CLOCKS
          </text>

          <!-- Clock icon -->
          <circle
            cx="1130"
            cy="101"
            r="30"
            fill="${theme.colors.gold}"
            fill-opacity="0.15"
          />

          <circle
            cx="1130"
            cy="101"
            r="18"
            fill="none"
            stroke="${theme.colors.goldDark}"
            stroke-width="3"
          />

          <line
            x1="1130"
            y1="101"
            x2="1130"
            y2="88"
            stroke="${theme.colors.goldDark}"
            stroke-width="3.5"
            stroke-linecap="round"
          />

          <line
            x1="1130"
            y1="101"
            x2="1140"
            y2="109"
            stroke="${theme.colors.goldDark}"
            stroke-width="3.5"
            stroke-linecap="round"
          />

          <!-- Main card message -->
          <text
            x="908"
            y="154"
            fill="${theme.colors.text}"
            font-size="25"
            font-weight="800"
          >
            Estimated change
          </text>

          <text
            x="908"
            y="184"
            fill="${theme.colors.text}"
            font-size="25"
            font-weight="800"
          >
            in public debt
          </text>

          <rect
            x="908"
            y="204"
            width="62"
            height="4"
            rx="2"
            fill="${theme.colors.gold}"
          />

          <!-- Explanation -->
          <text
            x="908"
            y="238"
            fill="${theme.colors.muted}"
            font-size="14"
            font-weight="500"
          >
            See how public debt is
          </text>

          <text
            x="908"
            y="259"
            fill="${theme.colors.muted}"
            font-size="14"
            font-weight="500"
          >
            estimated to change in each
          </text>

          <text
            x="908"
            y="280"
            fill="${theme.colors.muted}"
            font-size="14"
            font-weight="500"
          >
            country, in its own currency.
          </text>
        </g>

        <!-- Currency bubbles -->
        ${currencyBubble({
          x: 1030,
          y: 356,
          radius: 34,
          label: "€",
          fill: theme.colors.blue,
          textColor: theme.colors.blue
        })}

        ${currencyBubble({
          x: 930,
          y: 405,
          radius: 31,
          label: "Kč",
          fill: theme.colors.teal,
          textColor: theme.colors.tealDark
        })}

        ${currencyBubble({
          x: 1105,
          y: 432,
          radius: 30,
          label: "zł",
          fill: theme.colors.gold,
          textColor: theme.colors.goldDark
        })}

        ${currencyBubble({
          x: 1058,
          y: 500,
          radius: 27,
          label: "kr",
          fill: theme.colors.blue,
          textColor: theme.colors.blueDark
        })}

        <!-- Footer -->
        <text
          x="72"
          y="${height - 38}"
          fill="${theme.colors.muted}"
          font-size="13"
          font-weight="700"
          letter-spacing="1.5"
        >
          FACTS / DATA / CONTEXT / EUROPE
        </text>

        <text
          x="${width - 68}"
          y="${height - 38}"
          text-anchor="end"
          fill="${theme.colors.text}"
          font-size="16"
          font-weight="800"
          letter-spacing="1.5"
        >
          PUBLICDEBT.EU
        </text>
      </g>

      <rect
        x="12"
        y="12"
        width="${width - 24}"
        height="${height - 24}"
        rx="24"
        fill="none"
        stroke="${theme.colors.blue}"
        stroke-width="3"
      />
    </svg>
  `;
}
