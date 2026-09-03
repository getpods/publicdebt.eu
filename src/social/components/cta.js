import {
  text
} from "./svg.js";

export function renderCta({
  theme,
  width,
  y,
  label,
  url
}) {
  return `
    ${text({
      x:
        width / 2,
      y,
      value:
        label,
      size: 24,
      weight: 500,
      fill:
        theme.colors.muted,
      anchor:
        "middle"
    })}

    ${text({
      x:
        width / 2,
      y:
        y + 48,
      value:
        url,
      size: 34,
      weight: 700,
      fill:
        theme.colors.blueDark,
      anchor:
        "middle",
      letterSpacing: 0.4
    })}
  `;
}
