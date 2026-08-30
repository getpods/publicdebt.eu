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

import { renderHeader } from "../components/header.js";
import { renderCta } from "../components/cta.js";

function periodLabel(period) {
  if (!period) {
    return "";
  }

  const match = period.match(/^(\d{4})-Q([1-4])$/);

  if (!match) {
    return period;
  }

  return `Q${match[2]} ${match[1]}`;
}

function ordinalSuffix(number) {
  const mod100 = number % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return "th";
  }

  switch (number % 10) {
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
  if (!highlight || !rows.length) {
    return null;
  }

  const highlightInRanking = rows.some(
    (row) => row.code === highlight.code
  );

  if (highlightInRanking) {
    return null;
  }

  const values = rows.map(
    (row) => row.socialValue
  );

  const minDisplayed = Math.min(...values);
  const maxDisplayed = Math.max(...values);

  let direction = null;

  if (highlight.socialValue < minDisplayed) {
    direction = "Below";
  } else if (highlight.socialValue > maxDisplayed) {
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

export function renderRanking({
  theme,
  data,
  preset,
  period
}) {
  const { width, height } =
    theme.sizes[preset.platform];

  const order =
    preset.ranking?.order ?? "desc";

  const rows = getRanking({
    data,
    metric: preset.metric,
    order,
    limit: preset.ranking?.limit
  });

  const allRows = getRanking({
    data,
    metric: preset.metric,
    order
  });

  const scaleMax = Math.max(
    ...allRows.map((row) => row.socialValue)
  );

  let highlight = null;

  if (preset.highlight?.country) {
    const country = findCountry(
      data,
      preset.highlight.country
    );

    if (!country) {
      throw new Error(
        `Country ${preset.highlight.country} not found.`
      );
    }

    const rankedCountry = allRows.find(
      (row) => row.code === country.code
    );

    highlight = {
      ...country,
      socialRank: rankedCountry?.socialRank,
      socialValue: getMetricValue(
        country,
        preset.metric
      )
    };
  }

  const highlightInRanking =
    highlight &&
    rows.some(
      (row) => row.code === highlight.code
    );

  const comparisonSummary =
    getComparisonSummary({
      highlight,
      rows,
      order
    });

  const cardX = 70;
  const cardY = 280;
  const cardWidth = width - 140;

  const innerX = cardX + 55;
  const innerWidth = cardWidth - 110;

  const chartY = cardY + 105;
  const rowHeight = 62;

  const rankingBottom =
    chartY + rows.length * rowHeight;

  /*
   * If the highlighted country is outside the visible
   * ranking, the card needs room for its additional row
   * and comparison summary.
   *
   * Otherwise the card follows the actual ranking height
   * instead of leaving a large empty area.
   */
  const cardHeight =
    highlight && !highlightInRanking
      ? rankingBottom - cardY + 285
      : rankingBottom - cardY + 65;

  let highlightSvg = "";

  if (highlight && !highlightInRanking) {
    const dividerY =
      rankingBottom + 25;

    const highlightChartY =
      dividerY + 35;

    const captionY =
      highlightChartY + 105;

    highlightSvg = `
      ${line({
        x1: innerX,
        y1: dividerY,
        x2: innerX + innerWidth,
        y2: dividerY,
        stroke: theme.colors.line
      })}

      ${renderBarChart({
        theme,
        rows: [highlight],
        metric: preset.metric,
        x: innerX,
        y: highlightChartY,
        width: innerWidth,
        rowHeight,
        maxValue: scaleMax,
        showDividers: false
      })}

      ${comparisonSummary
        ? text({
            x: innerX + 52,
            y: captionY,
            value: comparisonSummary,
            size: 22,
            weight: 600,
            fill: theme.colors.text
          })
        : ""}

      ${text({
        x: innerX + 52,
        y: captionY + 38,
        value: `${highlight.socialRank}${ordinalSuffix(
          highlight.socialRank
        )} of ${allRows.length} EU countries`,
        size: 19,
        weight: 400,
        fill: theme.colors.muted
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
      <rect
        width="${width}"
        height="${height}"
        fill="${theme.colors.background}"
      />

      <g font-family="${theme.font.family}">
        ${renderHeader({
          theme,
          eyebrow: preset.eyebrow,
          title: preset.title,
          subtitle: preset.subtitle,
          period: periodLabel(period)
        })}

        ${roundedRect({
          x: cardX,
          y: cardY,
          width: cardWidth,
          height: cardHeight,
          radius: theme.radius,
          fill: theme.colors.card,
          stroke: theme.colors.line,
          strokeWidth: 1
        })}

        ${text({
          x: innerX,
          y: cardY + 60,
          value: getSectionTitle({
            rows,
            order
          }),
          size: 20,
          weight: 700,
          fill: theme.colors.muted,
          letterSpacing: 1.3
        })}

        ${renderBarChart({
          theme,
          rows,
          metric: preset.metric,
          x: innerX,
          y: chartY,
          width: innerWidth,
          rowHeight,
          maxValue: scaleMax,
          highlightCode:
            highlightInRanking
              ? highlight.code
              : null
        })}

        ${highlightSvg}

        ${renderCta({
          theme,
          width,
          y: height - 125,
          label:
            preset.cta?.label ??
            "Explore the data →",
          url:
            preset.cta?.url ??
            "PUBLICDEBT.EU"
        })}

        ${text({
          x: width / 2,
          y: height - 28,
          value: `Source: ${preset.source}`,
          size: 16,
          fill: theme.colors.muted,
          anchor: "middle"
        })}
      </g>
    </svg>
  `;
}
