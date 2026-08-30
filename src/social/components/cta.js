import { text } from "./svg.js";

export function renderCta({
  theme,
  width,
  y,
  label,
  url
}) {
  return `
    ${text({
      x: width / 2,
      y,
      value: label,
      size: 20,
      weight: 500,
      fill: theme.colors.muted,
      anchor: "middle"
    })}

    ${text({
      x: width / 2,
      y: y + 42,
      value: url,
      size: 27,
      weight: 700,
      fill: theme.colors.text,
      anchor: "middle",
      letterSpacing: 0.4
    })}
  `;
}
