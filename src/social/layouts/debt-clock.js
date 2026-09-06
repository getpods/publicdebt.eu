import {
  roundedRect,
  text,
  line
} from "../components/svg.js";

import {
  findCountry,
  findCountryDetails
} from "../data.js";

import {
  renderCta
} from "../components/cta.js";

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

function formatInteger(value) {
  return Math.round(
    value
  ).toLocaleString(
    "en-US"
  );
}

function getSign(value) {
  if (value < 0) {
    return "−";
  }

  return "";
}

function getDirectionWord(value) {
  if (value > 0) {
    return "increase";
  }

  if (value < 0) {
    return "decrease";
  }

  return "change";
}

export function renderDebtClock({
  theme,
  data,
  countriesData,
  preset
}) {
  const {
    width,
    height
  } =
    theme.sizes[
      preset.platform
    ];

  const country =
    findCountry(
      data,
      preset.country
    );

  if (!country) {
    throw new Error(
      `Country ${preset.country} not found.`
    );
  }

  const details =
    findCountryDetails(
      countriesData,
      country.code
    );

  if (!details) {
    throw new Error(
      `Country details for ${country.code} not found.`
    );
  }

  const clock =
    details.debt_clock;

  if (!clock) {
    throw new Error(
      `Country ${country.code} does not contain debt_clock data.`
    );
  }

  const rate =
    Number(
      clock.amount_per_second
    );

  if (
    !Number.isFinite(rate)
  ) {
    throw new Error(
      `Invalid debt clock rate for ${country.code}.`
    );
  }

  const currencyLabel =
    clock.currency_label ??
    clock.currency ??
    "";

  const from =
    periodLabel(
      clock.period_from
    );

  const to =
    periodLabel(
      clock.period_to
    );

  const sign =
    getSign(rate);

  const absoluteRate =
    Math.abs(rate);

  const amount60 =
    absoluteRate * 60;

  const rateLabel =
    `${sign}${formatInteger(
      absoluteRate
    )} ${currencyLabel}`;

  const minuteLabel =
    `${sign}${formatInteger(
      amount60
    )} ${currencyLabel}`;

  const direction =
    getDirectionWord(
      rate
    );

  const cardX = 70;
  const cardY = 365;
  const cardWidth =
    width - 140;
  const cardHeight = 595;

  const innerX =
    cardX + 60;

  const innerWidth =
    cardWidth - 120;

  const ctaBlockY = 1065;

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

      <g
        font-family="${theme.font.family}"
      >
        ${text({
          x: 90,
          y: 110,
          value:
            country.name.toUpperCase(),
          size: 38,
          weight: 700,
          fill:
            theme.colors.text,
          letterSpacing: 1.2
        })}

        ${text({
          x: 90,
          y: 190,
          value:
            "HOW MUCH PUBLIC DEBT",
          size: 50,
          weight: 700,
          fill:
            theme.colors.text
        })}

        ${text({
          x: 90,
          y: 255,
          value:
            "CAN ADD UP IN 60 SECONDS?",
          size: 50,
          weight: 700,
          fill:
            theme.colors.text
        })}

        ${roundedRect({
          x: cardX,
          y: cardY,
          width:
            cardWidth,
          height:
            cardHeight,
          radius:
            theme.radius,
          fill:
            "#f7faff",
          stroke:
            theme.colors.blue,
          strokeWidth: 1
        })}

        ${text({
          x: innerX,
          y: cardY + 62,
          value:
            `ESTIMATED ${direction.toUpperCase()} RATE`,
          size: 18,
          weight: 700,
          fill:
            theme.colors.muted,
          letterSpacing: 1.4
        })}

        ${text({
          x: innerX,
          y: cardY + 170,
          value:
            rateLabel,
          size: 76,
          weight: 700,
          fill:
            theme.colors.blueDark
        })}

        ${text({
          x: innerX,
          y: cardY + 215,
          value:
            "PER SECOND",
          size: 23,
          weight: 700,
          fill:
            theme.colors.muted,
          letterSpacing: 1.6
        })}

        ${line({
          x1: innerX,
          y1:
            cardY + 275,
          x2:
            innerX +
            innerWidth,
          y2:
            cardY + 275,
          stroke:
            theme.colors.line
        })}

        ${text({
          x: innerX,
          y: cardY + 330,
          value:
            "IN 60 SECONDS",
          size: 18,
          weight: 700,
          fill:
            theme.colors.muted,
          letterSpacing: 1.4
        })}

        ${text({
          x: innerX,
          y: cardY + 420,
          value:
            `≈ ${minuteLabel}`,
          size: 58,
          weight: 700,
          fill:
            theme.colors.goldDark
        })}

        ${line({
          x1: innerX,
          y1:
            cardY + 470,
          x2:
            innerX +
            innerWidth,
          y2:
            cardY + 470,
          stroke:
            theme.colors.line
        })}

        ${text({
          x: innerX,
          y: cardY + 520,
          value:
            `Estimated from the ${direction} in public debt`,
          size: 19,
          weight: 400,
          fill:
            theme.colors.muted
        })}

        ${text({
          x: innerX,
          y: cardY + 553,
          value:
            `between ${from} and ${to}.`,
          size: 19,
          weight: 400,
          fill:
            theme.colors.muted
        })}

        ${text({
          x:
            width / 2,
          y:
            ctaBlockY,
          value:
            "DEBT CLOCKS FOR ALL 27 EU COUNTRIES",
          size: 23,
          weight: 700,
          fill:
            theme.colors.muted,
          anchor:
            "middle",
          letterSpacing: 1.2
        })}

        ${renderCta({
          theme,
          width,
          y:
            ctaBlockY + 82,
          label:
            preset.cta
              ?.label ??
            "Start the debt clock →",
          url:
            preset.cta
              ?.url ??
            "PUBLICDEBT.EU"
        })}

        ${text({
          x:
            width / 2,
          y:
            ctaBlockY + 210,
          value:
            `Source: ${preset.source}`,
          size: 16,
          fill:
            theme.colors.muted,
          anchor:
            "middle"
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
