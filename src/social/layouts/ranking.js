import {
  findCountry,
  getMetricValue,
  getRanking
} from "../data.js";

import {
  roundedRect,
  text,
  line
} from "../components/svg.js";

import {
  renderBarChart
} from "../components/bar-chart.js";

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

function ordinalSuffix(number) {
  const mod100 =
    number % 100;

  if (
    mod100 >= 11 &&
    mod100 <= 13
  ) {
    return "th";
  }

  switch (
    number % 10
  ) {
    case 1:
      return "st";

    case 2:
      return "nd";

    case 3:
      return "rd";

    default:
      return "th";
  }
}

function getSectionTitle({
  rows,
  order
}) {
  return order === "asc"
    ? `${rows.length} LOWEST-DEBT EU COUNTRIES`
    : `${rows.length} HIGHEST-DEBT EU COUNTRIES`;
}

function getComparisonSummary({
  highlight,
  rows,
  order
}) {
  if (
    !highlight ||
    !rows.length
  ) {
    return null;
  }

  const highlightInRanking =
    rows.some(
      row =>
        row.code ===
        highlight.code
    );

  if (
    highlightInRanking
  ) {
    return null;
  }

  const values =
    rows.map(
      row =>
        row.socialValue
    );

  const minDisplayed =
    Math.min(
      ...values
    );

  const maxDisplayed =
    Math.max(
      ...values
    );

  let direction = null;

  if (
    highlight.socialValue <
    minDisplayed
  ) {
    direction = "Below";
  } else if (
    highlight.socialValue >
    maxDisplayed
  ) {
    direction = "Above";
  }

  if (!direction) {
    return null;
  }

  const group =
    order === "asc"
      ? "lowest-debt"
      : "highest-debt";

  return `${direction} the EU's ${rows.length} ${group} countries`;
}

function renderBrand({
  theme
}) {
  return `
    <text
      x="74"
      y="82"
      font-family="${theme.font.family}"
      font-size="38"
      font-weight="800"
    >
      <tspan
        fill="${theme.colors.text}"
      >Public</tspan><tspan
        fill="${theme.colors.blue}"
      >Debt.eu</tspan>
    </text>

    ${text({
      x: 76,
      y: 112,
      value:
        "EUROPEAN PUBLIC FINANCE DATA",
      size: 13,
      weight: 700,
      fill:
        theme.colors.muted,
      letterSpacing: 1.8
    })}
  `;
}

function renderFooter({
  theme,
  width,
  height,
  source
}) {
  return `
    ${text({
      x: 74,
      y: height - 48,
      value:
        "FACTS / DATA / CONTEXT / EUROPE",
      size: 14,
      weight: 700,
      fill:
        theme.colors.muted,
      letterSpacing: 1.5
    })}

    <text
      x="${width - 74}"
      y="${height - 48}"
      text-anchor="end"
      font-family="${theme.font.family}"
      font-size="18"
      font-weight="800"
      letter-spacing="0.4"
    >
      <tspan
        fill="${theme.colors.text}"
      >PUBLIC</tspan><tspan
        fill="${theme.colors.blue}"
      >DEBT.EU</tspan>
    </text>

    ${text({
      x: 74,
      y: height - 80,
      value:
        `Source: ${source}`,
      size: 14,
      fill:
        theme.colors.muted
    })}
  `;
}

export function renderRanking({
  theme,
  data,
  preset,
  period
}) {
  const {
    width,
    height
  } =
    theme.sizes[
      preset.platform
    ];

  const order =
    preset.ranking?.order ??
    "desc";

  const rows =
    getRanking({
      data,
      metric:
        preset.metric,
      order,
      limit:
        preset.ranking?.limit
    });

  const allRows =
    getRanking({
      data,
      metric:
        preset.metric,
      order
    });

  const scaleMax =
    Math.max(
      ...allRows.map(
        row =>
          row.socialValue
      )
    );

  let highlight = null;

  if (
    preset.highlight
      ?.country
  ) {
    const country =
      findCountry(
        data,
        preset.highlight
          .country
      );

    if (!country) {
      throw new Error(
        `Country ${preset.highlight.country} not found.`
      );
    }

    const rankedCountry =
      allRows.find(
        row =>
          row.code ===
          country.code
      );

    highlight = {
      ...country,

      socialRank:
        rankedCountry
          ?.socialRank,

      socialValue:
        getMetricValue(
          country,
          preset.metric
        )
    };
  }

  const highlightInRanking =
    highlight &&
    rows.some(
      row =>
        row.code ===
        highlight.code
    );

  const comparisonSummary =
    getComparisonSummary({
      highlight,
      rows,
      order
    });

  const cardX = 68;
  const cardY = 330;

  const cardWidth =
    width - 136;

  const innerX =
    cardX + 52;

  const innerWidth =
    cardWidth - 104;

  const chartY =
    cardY + 112;

  const rowHeight = 61;

  const rankingBottom =
    chartY +
    rows.length *
      rowHeight;

  const hasExternalHighlight =
    Boolean(
      highlight &&
      !highlightInRanking
    );

  const cardHeight =
    hasExternalHighlight
      ? (
          rankingBottom -
          cardY +
          270
        )
      : (
          rankingBottom -
          cardY +
          78
        );

  let highlightSvg = "";

  if (
    hasExternalHighlight
  ) {
    const dividerY =
      rankingBottom + 18;

    const highlightY =
      dividerY + 30;

    const captionY =
      highlightY + 102;

    highlightSvg = `
      ${line({
        x1: innerX,
        y1: dividerY,
        x2:
          innerX +
          innerWidth,
        y2: dividerY,
        stroke:
          theme.colors.line
      })}

      ${roundedRect({
        x: innerX - 18,
        y: highlightY - 16,
        width:
          innerWidth + 36,
        height: 86,
        radius: 16,
        fill:
          theme.colors.blueSoft,
        stroke:
          theme.colors.line,
        strokeWidth: 1
      })}

      ${renderBarChart({
        theme,
        rows: [
          highlight
        ],
        metric:
          preset.metric,
        x: innerX,
        y: highlightY,
        width:
          innerWidth,
        rowHeight,
        maxValue:
          scaleMax,
        showDividers:
          false
      })}

      ${
        comparisonSummary
          ? text({
              x:
                innerX +
                52,

              y:
                captionY,

              value:
                comparisonSummary,

              size: 21,

              weight: 700,

              fill:
                theme.colors.text
            })
          : ""
      }

      ${text({
        x:
          innerX +
          52,

        y:
          captionY +
          36,

        value:
          `${highlight.socialRank}${ordinalSuffix(
            highlight.socialRank
          )} of ${allRows.length} EU countries`,

        size: 18,

        fill:
          theme.colors.muted
      })}
    `;
  }

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
    >

      <defs>
        <linearGradient
          id="ranking-bg"
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
            offset="68%"
            stop-color="#f8fbff"
          />

          <stop
            offset="100%"
            stop-color="#fffaf0"
          />
        </linearGradient>

        <linearGradient
          id="ranking-card"
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
      </defs>

      <rect
        width="${width}"
        height="${height}"
        fill="url(#ranking-bg)"
      />

      <g
        font-family="${theme.font.family}"
      >
        ${renderBrand({
          theme
        })}

        ${text({
          x: 74,
          y: 190,
          value:
            preset.eyebrow,
          size: 18,
          weight: 800,
          fill:
            theme.colors.blueDark,
          letterSpacing: 1.6
        })}

        ${text({
          x: 74,
          y: 250,
          value:
            preset.title,
          size: 53,
          weight: 800,
          fill:
            theme.colors.text
        })}

        ${text({
          x: 74,
          y: 294,
          value:
            `${preset.subtitle} · ${periodLabel(
              period
            )}`,
          size: 22,
          fill:
            theme.colors.muted
        })}

        ${roundedRect({
          x: cardX,
          y: cardY,
          width:
            cardWidth,
          height:
            cardHeight,
          radius: 22,
          fill:
            "url(#ranking-card)",
          stroke:
            theme.colors.line,
          strokeWidth: 1
        })}

        <rect
          x="${cardX + 18}"
          y="${cardY}"
          width="${cardWidth - 36}"
          height="4"
          rx="2"
          fill="${theme.colors.gold}"
        />

        ${text({
          x: innerX,
          y: cardY + 67,
          value:
            getSectionTitle({
              rows,
              order
            }),
          size: 19,
          weight: 800,
          fill:
            theme.colors.muted,
          letterSpacing: 1.25
        })}

        ${renderBarChart({
          theme,
          rows,
          metric:
            preset.metric,
          x: innerX,
          y: chartY,
          width:
            innerWidth,
          rowHeight,
          maxValue:
            scaleMax,
          highlightCode:
            highlightInRanking
              ? highlight.code
              : null
        })}

        ${highlightSvg}

        ${text({
          x: width / 2,
          y:
            Math.min(
              cardY +
                cardHeight +
                76,
              height - 170
            ),
          value:
            preset.cta
              ?.label ??
            "Explore all 27 EU countries →",
          size: 19,
          weight: 600,
          fill:
            theme.colors.muted,
          anchor:
            "middle"
        })}

        ${renderFooter({
          theme,
          width,
          height,
          source:
            preset.source
        })}
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
