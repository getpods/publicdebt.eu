import { createHash } from "node:crypto";

// Fetch/processing timestamps change on every update, even when observations do not.
export function semanticData(value) {
  if (Array.isArray(value)) return value.map(semanticData);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort()
    .filter(key => !["generated_at", "retrieved_at"].includes(key))
    .map(key => [key, semanticData(value[key])]));
}

export function pageFingerprint(html, data) {
  const content = html
    .replace(/([?&]v=)\d+/g, "$1VERSION")
    .replace(/(<([a-z][a-z0-9:-]*)[^>]*\bid=["'](?:updated|eu-home-footer-updated|country-updated|ranking-updated|compare-updated)["'][^>]*>)[\s\S]*?(<\/\2>)/gi,
      "$1PROCESSING_DATE$3");
  return createHash("sha256").update(content)
    .update(JSON.stringify(semanticData(data))).digest("hex");
}

export function buildSitemap(pages, previous = {}, modifiedAt = new Date().toISOString()) {
  const oldPages = previous.version === 1 ? previous.pages ?? {} : {};
  const state = { version: 1, pages: {} };
  const escape = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const entries = pages.map(({ url, html, data }) => {
    const hash = pageFingerprint(html, data);
    const old = oldPages[url];
    // Without a previous snapshot, the actual modification date is unknown.
    const lastmod = old ? (old.hash === hash ? old.lastmod : modifiedAt) : null;
    state.pages[url] = { hash, lastmod };
    return `  <url>\n    <loc>${escape(url)}</loc>${lastmod ? `\n    <lastmod>${escape(lastmod)}</lastmod>` : ""}\n  </url>`;
  });
  return {
    state,
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`
  };
}
