import { text } from "./svg.js";

export function renderFooter({
  theme,
  width,
  height,
  source
}) {
  const y = height - 65;

  return `
    ${text({
      x: width / 2 - 15,
      y,
      value: "PUBLICDEBT.EU",
      size: 19,
      weight: 700,
      fill: theme.colors.text,
      anchor: "end",
      letterSpacing: 0.5
    })}

    ${text({
      x: width / 2 + 15,
      y,
      value: `Source: ${source}`,
      size: 17,
      fill: theme.colors.muted
    })}
  `;
}
