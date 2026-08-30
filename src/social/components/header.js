import { text } from "./svg.js";

export function renderHeader({
  theme,
  eyebrow,
  title,
  subtitle,
  period
}) {
  const { text: primary, muted } = theme.colors;

  return `
    ${text({
      x: 90,
      y: 105,
      value: eyebrow,
      size: 22,
      weight: 700,
      fill: muted,
      letterSpacing: 2
    })}

    ${text({
      x: 90,
      y: 175,
      value: title,
      size: 58,
      weight: 700,
      fill: primary
    })}

    ${text({
      x: 90,
      y: 220,
      value: `${subtitle} · ${period}`,
      size: 23,
      fill: muted
    })}
  `;
}
