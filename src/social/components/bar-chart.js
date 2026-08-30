import { line, text } from "./svg.js";

function formatValue(value, metric) {
  switch (metric) {
    case "debt_percent_gdp":
      return `${value.toFixed(1)}%`;

    case "debt_euro":
    case "debt_per_capita":
      return `€${Math.round(value).toLocaleString("en-US")}`;

    case "population":
      return Math.round(value).toLocaleString("en-US");

    default:
      return String(value);
  }
}

export function renderBarChart({
  theme,
  rows,
  metric,
  x,
  y,
  width,
  rowHeight = 62,
  maxValue = null,
  showDividers = true,
  highlightCode = null
}) {
  if (!rows.length) {
    return "";
  }

  const scaleMax =
    maxValue ??
    Math.max(...rows.map((row) => row.socialValue));

  const rankWidth = 52;
  const labelWidth = 190;
  const valueWidth = 100;
  const gap = 28;

  const barX = x + rankWidth + labelWidth;
  const barWidth =
    width - rankWidth - labelWidth - valueWidth - gap;

  const parts = [];

  rows.forEach((row, index) => {
    const rowY = y + index * rowHeight;
    const centerY = rowY + rowHeight / 2;

    const renderedBarWidth = Math.max(
      2,
      (row.socialValue / scaleMax) * barWidth
    );

    const isHighlighted =
      highlightCode && row.code === highlightCode;

    if (isHighlighted) {
      parts.push(`
        <rect
          x="${x - 18}"
          y="${rowY + 4}"
          width="${width + 36}"
          height="${rowHeight - 8}"
          rx="12"
          fill="${theme.colors.background}"
        />
      `);
    }

    parts.push(
      text({
        x,
        y: centerY + 8,
        value: `${row.socialRank}.`,
        size: 22,
        weight: 600,
        fill: isHighlighted
          ? theme.colors.text
          : theme.colors.muted
      })
    );

    parts.push(
      text({
        x: x + rankWidth,
        y: centerY + 8,
        value: row.name,
        size: 24,
        weight: isHighlighted ? 700 : 600,
        fill: theme.colors.text
      })
    );

    parts.push(`
      <rect
        x="${barX}"
        y="${centerY - 11}"
        width="${barWidth}"
        height="22"
        rx="11"
        fill="${theme.colors.grid}"
      />
    `);

    parts.push(`
      <rect
        x="${barX}"
        y="${centerY - 11}"
        width="${renderedBarWidth}"
        height="22"
        rx="11"
        fill="${theme.colors.text}"
      />
    `);

    parts.push(
      text({
        x: x + width,
        y: centerY + 8,
        value: formatValue(row.socialValue, metric),
        size: 23,
        weight: 700,
        fill: theme.colors.text,
        anchor: "end"
      })
    );

    if (showDividers && index < rows.length - 1) {
      parts.push(
        line({
          x1: x + rankWidth,
          y1: rowY + rowHeight,
          x2: x + width,
          y2: rowY + rowHeight,
          stroke: theme.colors.grid
        })
      );
    }
  });

  return parts.join("\n");
}
