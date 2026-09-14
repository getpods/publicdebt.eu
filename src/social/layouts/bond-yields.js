function escapeXml(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&apos;"
    );
}

function formatPercent(
  value
) {
  return Number(
    value
  ).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}

function formatMonth(
  period
) {
  const match =
    /^(\d{4})-(\d{2})$/.exec(
      String(
        period ?? ""
      )
    );

  if (!match) {
    return String(
      period ?? ""
    );
  }

  const date =
    new Date(
      Date.UTC(
        Number(
          match[1]
        ),
        Number(
          match[2]
        ) - 1,
        1
      )
    );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    }
  ).format(
    date
  );
}

function getCountryName(
  data,
  code
) {
  const country =
    data.countries?.find(
      item =>
        item.code === code
    );

  return (
    country?.name ??
    code
  );
}

function getSize(
  theme,
  platform
) {
  const configured =
    theme.sizes?.[
      platform
    ];

  if (
    configured?.width &&
    configured?.height
  ) {
    return configured;
  }

  if (
    platform === "og"
  ) {
    return {
      width: 1200,
      height: 630
    };
  }

  if (
    platform === "landscape"
  ) {
    return {
      width: 1536,
      height: 1024
    };
  }

  return {
    width: 1200,
    height: 1500
  };
}

export function renderBondYields({
  theme,
  data,
  interestRatesData,
  preset
}) {
  const {
    width,
    height
  } =
    getSize(
      theme,
      preset.platform
    );

  const rates =
    interestRatesData
      ?.countries;

  if (
    !Array.isArray(
      rates
    ) ||
    rates.length === 0
  ) {
    throw new Error(
      "interest-rates.json does not contain countries."
    );
  }

  const selectedCode =
    String(
      preset.highlight
        ?.country ??
      "CZ"
    ).toUpperCase();

  const selected =
    rates.find(
      country =>
        country.code ===
        selectedCode
    );

  if (!selected) {
    throw new Error(
      `Interest-rate data for ${selectedCode} not found.`
    );
  }

  const selectedName =
    getCountryName(
      data,
      selected.code
    );

  const order =
    preset.ranking
      ?.order ===
      "asc"
      ? "asc"
      : "desc";

  const limit =
    Number.isInteger(
      preset.ranking
        ?.limit
    )
      ? preset.ranking.limit
      : 8;

  const ranked =
    rates
      .filter(
        country =>
          Number.isFinite(
            country.latest
              ?.percent
          )
      )
      .sort(
        (a, b) =>
          order === "asc"
            ? a.latest.percent -
              b.latest.percent
            : b.latest.percent -
              a.latest.percent
      )
      .map(
        (
          country,
          index
        ) => ({
          ...country,
          rank: index + 1,
          name:
            getCountryName(
              data,
              country.code
            )
        })
      );

  const topRows =
    ranked.slice(
      0,
      limit
    );

  const selectedRanked =
    ranked.find(
      country =>
        country.code ===
        selected.code
    );

  const rows =
    selectedRanked &&
    !topRows.some(
      country =>
        country.code ===
        selected.code
    )
      ? [
          ...topRows,
          selectedRanked
        ]
      : topRows;

  const selectedRank =
    ranked.find(
      country =>
        country.code ===
        selected.code
    )?.rank;

  const title =
    preset.title ??
    "10-year government bond yields";

  const subtitle =
    preset.subtitle ??
    "Latest available monthly averages";

  const source =
    preset.source ??
    "ECB";

  const colors =
    theme.colors;

  const rowX = 72;
  const rowWidth =
    width - 144;

  const heroY = 332;
  const heroHeight = 286;

  const listY = 688;
  const rowHeight = 72;

  const listHeight =
    rows.length *
      rowHeight +
    42;

  const noteY =
    height - 238;

  const rankRows =
    rows
      .map(
        (
          country,
          index
        ) => {
          const y =
            listY +
            20 +
            index *
              rowHeight;

          const isSelected =
            country.code ===
            selected.code;

          const fill =
            isSelected
              ? colors.blueSoft
              : "#ffffff";

          const stroke =
            isSelected
              ? colors.blue
              : colors.line;

          const nameFill =
            isSelected
              ? colors.blue
              : colors.text;

          return `
            <g>
              <rect
                x="${rowX}"
                y="${y}"
                width="${rowWidth}"
                height="58"
                rx="14"
                fill="${fill}"
                stroke="${stroke}"
                stroke-width="${isSelected ? 1.5 : 1}"
              />

              ${
                isSelected
                  ? `
                    <rect
                      x="${rowX}"
                      y="${y}"
                      width="5"
                      height="58"
                      rx="2.5"
                      fill="${colors.blue}"
                    />
                  `
                  : ""
              }

              <text
                x="${rowX + 24}"
                y="${y + 37}"
                fill="${colors.muted}"
                font-size="17"
                font-weight="700"
              >
                ${country.rank}.
              </text>

              <text
                x="${rowX + 70}"
                y="${y + 37}"
                fill="${nameFill}"
                font-size="21"
                font-weight="${isSelected ? 800 : 700}"
              >
                ${escapeXml(country.name)}
              </text>

              <text
                x="${width - 345}"
                y="${y + 36}"
                fill="${colors.muted}"
                font-size="16"
                font-weight="600"
                text-anchor="end"
              >
                ${escapeXml(formatMonth(country.latest.period))}
              </text>

              <text
                x="${width - 98}"
                y="${y + 38}"
                fill="${isSelected ? colors.blue : colors.text}"
                font-size="25"
                font-weight="800"
                text-anchor="end"
              >
                ${formatPercent(country.latest.percent)} %
              </text>
            </g>
          `;
        }
      )
      .join("");

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
    >
      <defs>
        <linearGradient
          id="bond-bg"
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
          id="bond-hero"
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
          id="bond-shadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="22"
            flood-color="${colors.blue}"
            flood-opacity="0.08"
          />
        </filter>
      </defs>

      <rect
        width="${width}"
        height="${height}"
        fill="url(#bond-bg)"
      />

      <!-- Brand -->
      <text
        x="72"
        y="90"
        fill="${colors.text}"
        font-family="${theme.fontFamily}"
        font-size="44"
        font-weight="800"
      >
        Public<tspan fill="${colors.blue}">Debt.eu</tspan>
      </text>

      <text
        x="74"
        y="122"
        fill="${colors.muted}"
        font-family="${theme.fontFamily}"
        font-size="15"
        font-weight="700"
        letter-spacing="2.5"
      >
        EUROPEAN PUBLIC FINANCE DATA
      </text>

      <!-- Selected country -->
      <text
        x="${width - 72}"
        y="82"
        text-anchor="end"
        fill="${colors.blue}"
        font-family="${theme.fontFamily}"
        font-size="17"
        font-weight="800"
        letter-spacing="2"
      >
        ${escapeXml(selected.code)}
      </text>

      <text
        x="${width - 72}"
        y="111"
        text-anchor="end"
        fill="${colors.text}"
        font-family="${theme.fontFamily}"
        font-size="20"
        font-weight="800"
      >
        ${escapeXml(selectedName.toUpperCase())}
      </text>

      <!-- Heading -->
      <text
        x="72"
        y="205"
        fill="${colors.blue}"
        font-family="${theme.fontFamily}"
        font-size="17"
        font-weight="800"
        letter-spacing="2.2"
      >
        EUROPEAN UNION
      </text>

      <text
        x="72"
        y="255"
        fill="${colors.text}"
        font-family="${theme.fontFamily}"
        font-size="48"
        font-weight="800"
      >
        ${escapeXml(title)}
      </text>

      <text
        x="72"
        y="294"
        fill="${colors.muted}"
        font-family="${theme.fontFamily}"
        font-size="21"
        font-weight="500"
      >
        ${escapeXml(subtitle)}
      </text>

      <!-- Hero -->
      <g
        filter="url(#bond-shadow)"
      >
        <rect
          x="60"
          y="${heroY}"
          width="${width - 120}"
          height="${heroHeight}"
          rx="22"
          fill="url(#bond-hero)"
          stroke="${colors.line}"
        />

        <rect
          x="60"
          y="${heroY}"
          width="${width - 120}"
          height="5"
          rx="2.5"
          fill="${colors.gold}"
        />
      </g>

      <text
        x="94"
        y="${heroY + 58}"
        fill="${colors.blue}"
        font-family="${theme.fontFamily}"
        font-size="17"
        font-weight="800"
        letter-spacing="2"
      >
        ${escapeXml(selectedName.toUpperCase())}
      </text>

      <text
        x="94"
        y="${heroY + 101}"
        fill="${colors.muted}"
        font-family="${theme.fontFamily}"
        font-size="18"
        font-weight="600"
      >
        10-YEAR GOVERNMENT BOND YIELD
      </text>

      <text
        x="94"
        y="${heroY + 196}"
        fill="${colors.text}"
        font-family="${theme.fontFamily}"
        font-size="86"
        font-weight="800"
      >
        ${formatPercent(selected.latest.percent)} %
      </text>

      <text
        x="98"
        y="${heroY + 242}"
        fill="${colors.muted}"
        font-family="${theme.fontFamily}"
        font-size="18"
        font-weight="600"
      >
        Monthly average · ${escapeXml(formatMonth(selected.latest.period))}
      </text>

      ${
        selectedRank
          ? `
            <text
              x="${width - 94}"
              y="${heroY + 72}"
              text-anchor="end"
              fill="${colors.muted}"
              font-family="${theme.fontFamily}"
              font-size="17"
              font-weight="700"
            >
              EU RANK
            </text>

            <text
              x="${width - 94}"
              y="${heroY + 127}"
              text-anchor="end"
              fill="${colors.blue}"
              font-family="${theme.fontFamily}"
              font-size="42"
              font-weight="800"
            >
              #${selectedRank}
            </text>
          `
          : ""
      }

      <!-- Ranking -->
      <text
        x="72"
        y="${listY - 20}"
        fill="${colors.text}"
        font-family="${theme.fontFamily}"
        font-size="25"
        font-weight="800"
      >
        Highest current yields in the EU
      </text>

      <text
        x="${width - 72}"
        y="${listY - 20}"
        text-anchor="end"
        fill="${colors.muted}"
        font-family="${theme.fontFamily}"
        font-size="15"
        font-weight="700"
        letter-spacing="1.4"
      >
        LATEST AVAILABLE MONTH
      </text>

      <g
        font-family="${theme.fontFamily}"
      >
        ${rankRows}
      </g>

      <!-- Context / CTA -->
      <line
        x1="72"
        y1="${noteY - 34}"
        x2="${width - 72}"
        y2="${noteY - 34}"
        stroke="${colors.line}"
        stroke-width="1"
      />

      <text
        x="72"
        y="${noteY}"
        fill="${colors.blue}"
        font-family="${theme.fontFamily}"
        font-size="21"
        font-weight="800"
      >
        Explore historical yields for all 27 EU countries →
      </text>

      <text
        x="72"
        y="${noteY + 36}"
        fill="${colors.muted}"
        font-family="${theme.fontFamily}"
        font-size="16"
        font-weight="500"
      >
        Monthly 10-year government bond yield history at PublicDebt.eu
      </text>

      <text
        x="72"
        y="${noteY + 82}"
        fill="${colors.muted}"
        font-family="${theme.fontFamily}"
        font-size="14"
        font-weight="500"
      >
        ECB harmonised long-term interest rates · Latest month may differ by country
      </text>

      <text
        x="72"
        y="${noteY + 108}"
        fill="${colors.muted}"
        font-family="${theme.fontFamily}"
        font-size="14"
        font-weight="700"
      >
        Source: ${escapeXml(source)}
      </text>

      <!-- Footer -->
      <text
        x="72"
        y="${height - 57}"
        fill="${colors.muted}"
        font-family="${theme.fontFamily}"
        font-size="14"
        font-weight="800"
        letter-spacing="2"
      >
        FACTS / DATA / CONTEXT / EUROPE
      </text>

      <text
        x="${width - 72}"
        y="${height - 57}"
        text-anchor="end"
        fill="${colors.text}"
        font-family="${theme.fontFamily}"
        font-size="18"
        font-weight="800"
      >
        PUBLIC<tspan fill="${colors.blue}">DEBT.EU</tspan>
      </text>

      <!-- Outer frame -->
      <rect
        x="14"
        y="14"
        width="${width - 28}"
        height="${height - 28}"
        rx="16"
        fill="none"
        stroke="${colors.blue}"
        stroke-width="2"
      />
    </svg>
  `;
}
