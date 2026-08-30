export function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function text({
  x,
  y,
  value,
  size,
  weight = 400,
  fill,
  anchor = "start",
  letterSpacing = 0
}) {
  return `
    <text
      x="${x}"
      y="${y}"
      fill="${fill}"
      font-size="${size}"
      font-weight="${weight}"
      text-anchor="${anchor}"
      letter-spacing="${letterSpacing}"
    >${escapeXml(value)}</text>
  `;
}

export function roundedRect({
  x,
  y,
  width,
  height,
  radius,
  fill,
  stroke = "none",
  strokeWidth = 0
}) {
  return `
    <rect
      x="${x}"
      y="${y}"
      width="${width}"
      height="${height}"
      rx="${radius}"
      fill="${fill}"
      stroke="${stroke}"
      stroke-width="${strokeWidth}"
    />
  `;
}

export function line({
  x1,
  y1,
  x2,
  y2,
  stroke,
  strokeWidth = 1
}) {
  return `
    <line
      x1="${x1}"
      y1="${y1}"
      x2="${x2}"
      y2="${y2}"
      stroke="${stroke}"
      stroke-width="${strokeWidth}"
    />
  `;
}
