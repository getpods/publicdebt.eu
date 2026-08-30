import fs from "node:fs";
import path from "node:path";

const CSS_PATH = path.resolve("web/style.css");

function readCssVariable(css, name) {
  const pattern = new RegExp(
    `--${name}\\s*:\\s*([^;]+);`,
    "i"
  );

  const match = css.match(pattern);

  if (!match) {
    throw new Error(
      `CSS variable --${name} not found in ${CSS_PATH}`
    );
  }

  return match[1].trim();
}

export function getTheme() {
  const css = fs.readFileSync(CSS_PATH, "utf8");

  return {
    colors: {
      background: readCssVariable(css, "bg"),
      card: readCssVariable(css, "card"),
      text: readCssVariable(css, "text"),
      muted: readCssVariable(css, "muted"),
      line: readCssVariable(css, "line"),

      // Chart-specific values from the website.
      grid: "#e6e6e1",
      axis: "#bdbdb7"
    },

    radius: Number.parseFloat(
      readCssVariable(css, "radius")
    ),

    font: {
      family: "Inter, Arial, sans-serif"
    },

    sizes: {
      linkedin: {
        width: 1200,
        height: 1500
      },

      reddit: {
        width: 1200,
        height: 1500
      }
    }
  };
}
