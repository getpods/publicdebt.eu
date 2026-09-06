const GISCO_URL =
  "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2024_4326_LEVL_0.geojson";

const MAP_BOUNDS = {
  minLon: -12,
  maxLon: 36,
  minLat: 34,
  maxLat: 72
};

const MAP_WIDTH = 920;
const MAP_HEIGHT = 650;
const MAP_PADDING = 8;

const LEVEL_COLORS = {
  1: "#e8f0ff",
  2: "#bed2ff",
  3: "#83a8fa",
  4: "#3f77ed",
  5: "#1648b8"
};

function escapeXml(
  value
) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function periodLabel(
  period
) {
  const match =
    String(period ?? "")
      .match(
        /^(\d{4})-Q([1-4])$/
      );

  if (!match) {
    return period ?? "";
  }

  return `Q${match[2]} ${match[1]}`;
}

function getDebtLevel(
  value
) {
  if (value < 40) {
    return 1;
  }

  if (value < 60) {
    return 2;
  }

  if (value < 80) {
    return 3;
  }

  if (value <= 100) {
    return 4;
  }

  return 5;
}

function mercatorX(
  longitude
) {
  return (
    longitude *
    Math.PI /
    180
  );
}

function mercatorY(
  latitude
) {
  const clamped =
    Math.max(
      -85,
      Math.min(
        85,
        latitude
      )
    );

  const radians =
    clamped *
    Math.PI /
    180;

  return Math.log(
    Math.tan(
      Math.PI / 4 +
      radians / 2
    )
  );
}

const MAP_MIN_X =
  mercatorX(
    MAP_BOUNDS.minLon
  );

const MAP_MAX_X =
  mercatorX(
    MAP_BOUNDS.maxLon
  );

const MAP_MIN_Y =
  mercatorY(
    MAP_BOUNDS.minLat
  );

const MAP_MAX_Y =
  mercatorY(
    MAP_BOUNDS.maxLat
  );

const MAP_SOURCE_WIDTH =
  MAP_MAX_X -
  MAP_MIN_X;

const MAP_SOURCE_HEIGHT =
  MAP_MAX_Y -
  MAP_MIN_Y;

const MAP_AVAILABLE_WIDTH =
  MAP_WIDTH -
  MAP_PADDING * 2;

const MAP_AVAILABLE_HEIGHT =
  MAP_HEIGHT -
  MAP_PADDING * 2;

const MAP_SCALE =
  Math.min(
    MAP_AVAILABLE_WIDTH /
      MAP_SOURCE_WIDTH,
    MAP_AVAILABLE_HEIGHT /
      MAP_SOURCE_HEIGHT
  );

const MAP_DRAW_WIDTH =
  MAP_SOURCE_WIDTH *
  MAP_SCALE;

const MAP_DRAW_HEIGHT =
  MAP_SOURCE_HEIGHT *
  MAP_SCALE;

const MAP_OFFSET_X =
  (
    MAP_WIDTH -
    MAP_DRAW_WIDTH
  ) / 2;

const MAP_OFFSET_Y =
  (
    MAP_HEIGHT -
    MAP_DRAW_HEIGHT
  ) / 2;

function projectPoint(
  coordinates
) {
  const [
    lon,
    lat
  ] = coordinates;

  const projectedX =
    mercatorX(
      lon
    );

  const projectedY =
    mercatorY(
      lat
    );

  const x =
    MAP_OFFSET_X +
    (
      projectedX -
      MAP_MIN_X
    ) *
    MAP_SCALE;

  const y =
    MAP_OFFSET_Y +
    (
      MAP_MAX_Y -
      projectedY
    ) *
    MAP_SCALE;

  return [
    x,
    y
  ];
}

function ringIntersectsEurope(
  ring
) {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (
    const [
      lon,
      lat
    ] of ring
  ) {
    minLon =
      Math.min(
        minLon,
        lon
      );

    maxLon =
      Math.max(
        maxLon,
        lon
      );

    minLat =
      Math.min(
        minLat,
        lat
      );

    maxLat =
      Math.max(
        maxLat,
        lat
      );
  }

  return !(
    maxLon <
      MAP_BOUNDS.minLon ||
    minLon >
      MAP_BOUNDS.maxLon ||
    maxLat <
      MAP_BOUNDS.minLat ||
    minLat >
      MAP_BOUNDS.maxLat
  );
}

function ringToPath(
  ring
) {
  if (
    !ring.length ||
    !ringIntersectsEurope(
      ring
    )
  ) {
    return "";
  }

  return (
    ring
      .map(
        (
          coordinates,
          index
        ) => {
          const [
            x,
            y
          ] =
            projectPoint(
              coordinates
            );

          return `${
            index === 0
              ? "M"
              : "L"
          } ${x.toFixed(2)} ${y.toFixed(2)}`;
        }
      )
      .join(" ") +
    " Z"
  );
}

function polygonToPath(
  polygon
) {
  return polygon
    .map(
      ring =>
        ringToPath(
          ring
        )
    )
    .filter(Boolean)
    .join(" ");
}

function geometryToPath(
  geometry
) {
  if (!geometry) {
    return "";
  }

  if (
    geometry.type ===
    "Polygon"
  ) {
    return polygonToPath(
      geometry.coordinates
    );
  }

  if (
    geometry.type ===
    "MultiPolygon"
  ) {
    return geometry.coordinates
      .map(
        polygon =>
          polygonToPath(
            polygon
          )
      )
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

export async function loadGeoJson() {
  const attempts = 3;
  let lastError = null;

  for (
    let attempt = 1;
    attempt <= attempts;
    attempt += 1
  ) {
    try {
      const response =
        await fetch(
          GISCO_URL
        );

      if (!response.ok) {
        throw new Error(
          `GISCO error ${response.status}`
        );
      }

      return await response.json();
    } catch (
      error
    ) {
      lastError = error;

      if (
        attempt <
        attempts
      ) {
        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              attempt * 450
            )
        );
      }
    }
  }

  throw lastError;
}

function featureCode(
  feature
) {
  return (
    feature.properties
      ?.NUTS_ID ??
    feature.properties
      ?.CNTR_CODE ??
    feature.properties
      ?.cntr_id ??
    null
  );
}

export function renderEuCountries(
  geo,
  countries
) {
  const byCode =
    new Map(
      countries.map(
        country => [
          country.code,
          country
        ]
      )
    );

  return (
    geo.features ??
    []
  )
    .map(
      feature => {
        const country =
          byCode.get(
            featureCode(
              feature
            )
          );

        if (!country) {
          return "";
        }

        const value =
          Number(
            country.debt
              ?.percent_gdp
          );

        if (
          !Number.isFinite(
            value
          )
        ) {
          return "";
        }

        const d =
          geometryToPath(
            feature.geometry
          );

        if (!d) {
          return "";
        }

        const fill =
          LEVEL_COLORS[
            getDebtLevel(
              value
            )
          ];

        return `
          <path
            d="${d}"
            fill="${fill}"
            fill-rule="evenodd"
            stroke="#ffffff"
            stroke-width="2"
            stroke-linejoin="round"
          />
        `;
      }
    )
    .join("");
}

function legendItem({
  x,
  color,
  label
}) {
  return `
    <rect
      x="${x}"
      y="844"
      width="64"
      height="48"
      rx="9"
      fill="${color}"
    />

    <text
      x="${x + 32}"
      y="934"
      text-anchor="middle"
      fill="#5f6f8d"
      font-size="22"
      font-weight="700"
    >${escapeXml(label)}</text>
  `;
}

export async function renderEuMap({
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

  const geo =
    await loadGeoJson();

  const euCountries =
    renderEuCountries(
      geo,
      data.countries ?? []
    );

  const latest =
    periodLabel(
      period
    );

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
    >
      <defs>
        <linearGradient
          id="page-bg"
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
            stop-color="#f9fbff"
          />
        </linearGradient>
      </defs>

      <rect
        width="${width}"
        height="${height}"
        fill="url(#page-bg)"
      />

      <g
        font-family="${theme.font.family}"
      >
        <!-- Brand -->
        <text
          x="96"
          y="116"
          fill="${theme.colors.text}"
          font-size="54"
          font-weight="800"
        >Public<tspan fill="${theme.colors.blue}">Debt.eu</tspan></text>

        <text
          x="98"
          y="157"
          fill="${theme.colors.muted}"
          font-size="18"
          font-weight="700"
          letter-spacing="2.6"
        >
          EUROPEAN PUBLIC FINANCE DATA
        </text>

        <!-- Right taxonomy -->
        <text
          x="${width - 163}"
          y="92"
          fill="#7789ad"
          font-size="18"
          font-weight="700"
          letter-spacing="1.4"
        >
          <tspan x="${width - 163}" dy="0">FACTS</tspan>
          <tspan x="${width - 163}" dy="30">DATA</tspan>
          <tspan x="${width - 163}" dy="30">CONTEXT</tspan>
          <tspan x="${width - 163}" dy="30">EUROPE</tspan>
        </text>

        <rect
          x="${width - 163}"
          y="188"
          width="58"
          height="4"
          rx="2"
          fill="${theme.colors.blue}"
        />

        <!-- Headline -->
        <text
          x="96"
          y="322"
          fill="${theme.colors.text}"
          font-size="96"
          font-weight="800"
          letter-spacing="-2.8"
        >
          Public debt
        </text>

        <text
          x="96"
          y="404"
          fill="${theme.colors.text}"
          font-size="96"
          font-weight="800"
          letter-spacing="-2.8"
        >
          at a glance
        </text>

        <!-- Description -->
        <text
          x="98"
          y="492"
          fill="${theme.colors.muted}"
          font-size="38"
          font-weight="400"
        >
          Explore the latest EU data on
        </text>

        <text
          x="98"
          y="540"
          fill="${theme.colors.muted}"
          font-size="38"
          font-weight="400"
        >
          public debt as % of GDP.
        </text>

        <!-- CTA -->
        <rect
          x="96"
          y="648"
          width="500"
          height="102"
          rx="14"
          fill="${theme.colors.blue}"
        />

        <text
          x="160"
          y="714"
          fill="#ffffff"
          font-size="37"
          font-weight="700"
        >
          Explore the data
        </text>

        <text
          x="514"
          y="714"
          fill="#ffffff"
          font-size="44"
          font-weight="400"
        >
          →
        </text>

        <!-- Map -->
        <g
          transform="translate(315 -48) scale(1.58)"
        >
          ${euCountries}
        </g>

        <!-- Legend -->
        <text
          x="98"
          y="812"
          fill="${theme.colors.muted}"
          font-size="24"
          font-weight="800"
          letter-spacing="2.6"
        >
          DEBT / GDP
        </text>

        ${legendItem({
          x: 98,
          color: LEVEL_COLORS[1],
          label: "< 40%"
        })}

        ${legendItem({
          x: 205,
          color: LEVEL_COLORS[2],
          label: "40–60%"
        })}

        ${legendItem({
          x: 312,
          color: LEVEL_COLORS[3],
          label: "60–80%"
        })}

        ${legendItem({
          x: 419,
          color: LEVEL_COLORS[4],
          label: "80–100%"
        })}

        ${legendItem({
          x: 526,
          color: LEVEL_COLORS[5],
          label: "> 100%"
        })}

        <!-- Footer -->
        <text
          x="98"
          y="${height - 50}"
          fill="${theme.colors.muted}"
          font-size="15"
          font-weight="500"
        >
          Source: ${escapeXml(
            preset.source ??
            "Eurostat"
          )} · ${escapeXml(
            latest
          )}
        </text>

        <text
          x="${width - 88}"
          y="${height - 50}"
          text-anchor="end"
          fill="#7789ad"
          font-size="18"
          font-weight="800"
          letter-spacing="2.3"
        >
          WWW.PUBLICDEBT.EU
        </text>
      </g>

      <!-- Social perimeter -->
      <rect
        x="14"
        y="14"
        width="${width - 28}"
        height="${height - 28}"
        rx="32"
        fill="none"
        stroke="${theme.colors.blue}"
        stroke-width="4"
      />
    </svg>
  `;
}
