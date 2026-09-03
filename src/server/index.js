import http from "node:http";

import {
  readFile
} from "node:fs/promises";

import {
  resolve,
  dirname,
  extname
} from "node:path";

import {
  fileURLToPath
} from "node:url";


const ROOT =
  resolve(
    dirname(
      fileURLToPath(
        import.meta.url
      )
    ),
    "../.."
  );


const PORT =
  3000;


const webDir =
  resolve(
    ROOT,
    "web"
  );


const processedDir =
  resolve(
    ROOT,
    "data/processed"
  );


const overviewFile =
  resolve(
    processedDir,
    "overview.json"
  );


const euFile =
  resolve(
    processedDir,
    "eu.json"
  );


const countriesDir =
  resolve(
    processedDir,
    "countries"
  );


const populationsDir =
  resolve(
    processedDir,
    "populations"
  );


const contentTypes = {
  ".html":
    "text/html; charset=utf-8",

  ".css":
    "text/css; charset=utf-8",

  ".js":
    "text/javascript; charset=utf-8",

  ".json":
    "application/json; charset=utf-8",

  ".svg":
    "image/svg+xml",

  ".png":
    "image/png",

  ".jpg":
    "image/jpeg",

  ".jpeg":
    "image/jpeg",

  ".ico":
    "image/x-icon",

  ".txt":
    "text/plain; charset=utf-8",

  ".xml":
    "application/xml; charset=utf-8"
};


/* ---------------------------------------------------------
   RESPONSE HELPERS
--------------------------------------------------------- */

function send404(
  res
) {
  res.writeHead(
    404,
    {
      "Content-Type":
        "text/plain; charset=utf-8"
    }
  );

  res.end(
    "Not found"
  );
}


function redirect(
  res,
  location
) {
  res.writeHead(
    302,
    {
      Location:
        location,

      "Cache-Control":
        "no-cache"
    }
  );

  res.end();
}


function sendHtml(
  res,
  html
) {
  res.writeHead(
    200,
    {
      "Content-Type":
        "text/html; charset=utf-8",

      "Cache-Control":
        "no-cache"
    }
  );

  res.end(
    html
  );
}


function sendJson(
  res,
  json
) {
  res.writeHead(
    200,
    {
      "Content-Type":
        "application/json; charset=utf-8",

      "Cache-Control":
        "no-cache"
    }
  );

  res.end(
    json
  );
}


/* ---------------------------------------------------------
   DATA HELPERS
--------------------------------------------------------- */

async function loadEU() {
  return JSON.parse(
    await readFile(
      euFile,
      "utf8"
    )
  );
}


/* ---------------------------------------------------------
   CZECH COUNTRY PAGE
--------------------------------------------------------- */

async function renderCountryPage(
  slug
) {
  const eu =
    await loadEU();


  const country =
    eu.countries.find(
      item =>
        item.slug ===
        slug
    );


  if (
    !country
  ) {
    return null;
  }


  const template =
    await readFile(
      resolve(
        webDir,
        "country.html"
      ),
      "utf8"
    );


  const canonical =
    `https://publicdebt.eu/cs/zeme/${country.slug}/`;


  const alternateEn =
    `/en/countries/${country.slug_en}/`;


  return template
    .replaceAll(
      "__COUNTRY_CODE__",
      country.code
    )
    .replaceAll(
      "__COUNTRY_NAME__",
      country.name_cs
    )
    .replaceAll(
      "__CANONICAL__",
      canonical
    )
    .replaceAll(
      "__ALTERNATE_EN__",
      alternateEn
    );
}


/* ---------------------------------------------------------
   ENGLISH COUNTRY PAGE
--------------------------------------------------------- */

async function renderEnglishCountryPage(
  slug
) {
  const eu =
    await loadEU();


  const country =
    eu.countries.find(
      item =>
        item.slug_en ===
        slug
    );


  if (
    !country
  ) {
    return null;
  }


  const template =
    await readFile(
      resolve(
        webDir,
        "country-en.html"
      ),
      "utf8"
    );


  const canonical =
    `https://publicdebt.eu/en/countries/${country.slug_en}/`;


  const alternateCs =
    `/cs/zeme/${country.slug}/`;


  return template
    .replaceAll(
      "__COUNTRY_CODE__",
      country.code
    )
    .replaceAll(
      "__COUNTRY_NAME__",
      country.name
    )
    .replaceAll(
      "__CANONICAL__",
      canonical
    )
    .replaceAll(
      "__ALTERNATE_CS__",
      alternateCs
    );
}


/* ---------------------------------------------------------
   SERVER
--------------------------------------------------------- */

const server =
  http.createServer(
    async (
      req,
      res
    ) => {
      try {
        const url =
          new URL(
            req.url,
            `http://${req.headers.host}`
          );


        const pathname =
          decodeURIComponent(
            url.pathname
          );


        /* -------------------------------------------------
           LEGACY / ROOT REDIRECTS
        ------------------------------------------------- */

        if (
          pathname ===
          "/"
        ) {
          redirect(
            res,
            "/cs/"
          );

          return;
        }


        if (
          pathname ===
            "/zebricek" ||
          pathname ===
            "/zebricek/"
        ) {
          redirect(
            res,
            "/cs/zebricek/"
          );

          return;
        }


        if (
          pathname ===
            "/porovnani" ||
          pathname ===
            "/porovnani/"
        ) {
          redirect(
            res,
            "/cs/porovnani/"
          );

          return;
        }


        if (
          pathname ===
            "/o-projektu" ||
          pathname ===
            "/o-projektu/"
        ) {
          redirect(
            res,
            "/cs/o-projektu/"
          );

          return;
        }


        const oldCountryMatch =
          /^\/zeme\/([^/]+)\/?$/.exec(
            pathname
          );


        if (
          oldCountryMatch
        ) {
          redirect(
            res,
            `/cs/zeme/${oldCountryMatch[1]}/`
          );

          return;
        }


        /* -------------------------------------------------
           API
        ------------------------------------------------- */

        if (
          pathname ===
          "/api/overview"
        ) {
          const data =
            await readFile(
              overviewFile,
              "utf8"
            );


          sendJson(
            res,
            data
          );

          return;
        }


        if (
          pathname ===
          "/api/eu"
        ) {
          const data =
            await readFile(
              euFile,
              "utf8"
            );


          sendJson(
            res,
            data
          );

          return;
        }


        /* -------------------------------------------------
           DATA
        ------------------------------------------------- */

        if (
          pathname ===
          "/data/eu.json"
        ) {
          const data =
            await readFile(
              euFile,
              "utf8"
            );


          sendJson(
            res,
            data
          );

          return;
        }


        if (
          pathname ===
          "/data/overview.json"
        ) {
          const data =
            await readFile(
              overviewFile,
              "utf8"
            );


          sendJson(
            res,
            data
          );

          return;
        }


        const countryDataMatch =
          /^\/data\/countries\/([a-z]{2})\.json$/i.exec(
            pathname
          );


        if (
          countryDataMatch
        ) {
          const code =
            countryDataMatch[1]
              .toLowerCase();


          try {
            const data =
              await readFile(
                resolve(
                  countriesDir,
                  `${code}.json`
                ),
                "utf8"
              );


            sendJson(
              res,
              data
            );
          } catch (
            error
          ) {
            if (
              error.code ===
              "ENOENT"
            ) {
              send404(
                res
              );

              return;
            }


            throw error;
          }


          return;
        }


        const populationDataMatch =
          /^\/data\/populations\/([a-z]{2})\.json$/i.exec(
            pathname
          );


        if (
          populationDataMatch
        ) {
          const code =
            populationDataMatch[1]
              .toLowerCase();


          try {
            const data =
              await readFile(
                resolve(
                  populationsDir,
                  `${code}.json`
                ),
                "utf8"
              );


            sendJson(
              res,
              data
            );
          } catch (
            error
          ) {
            if (
              error.code ===
              "ENOENT"
            ) {
              send404(
                res
              );

              return;
            }


            throw error;
          }


          return;
        }


        /* -------------------------------------------------
           CZECH HOMEPAGE
        ------------------------------------------------- */

        if (
          pathname ===
            "/cs" ||
          pathname ===
            "/cs/"
        ) {
          const html =
            await readFile(
              resolve(
                webDir,
                "index.html"
              ),
              "utf8"
            );


          sendHtml(
            res,
            html
          );

          return;
        }


        /* -------------------------------------------------
           ENGLISH HOMEPAGE
        ------------------------------------------------- */

        if (
          pathname ===
            "/en" ||
          pathname ===
            "/en/"
        ) {
          const html =
            await readFile(
              resolve(
                webDir,
                "index-en.html"
              ),
              "utf8"
            );


          sendHtml(
            res,
            html
          );

          return;
        }


        /* -------------------------------------------------
           CZECH RANKING
        ------------------------------------------------- */

        if (
          pathname ===
            "/cs/zebricek" ||
          pathname ===
            "/cs/zebricek/"
        ) {
          const html =
            await readFile(
              resolve(
                webDir,
                "zebricek.html"
              ),
              "utf8"
            );


          sendHtml(
            res,
            html
          );

          return;
        }


        /* -------------------------------------------------
           ENGLISH RANKING
        ------------------------------------------------- */

        if (
          pathname ===
            "/en/ranking" ||
          pathname ===
            "/en/ranking/"
        ) {
          const html =
            await readFile(
              resolve(
                webDir,
                "zebricek-en.html"
              ),
              "utf8"
            );


          sendHtml(
            res,
            html
          );

          return;
        }


        /* -------------------------------------------------
           CZECH COMPARE
        ------------------------------------------------- */

        if (
          pathname ===
            "/cs/porovnani" ||
          pathname ===
            "/cs/porovnani/"
        ) {
          const html =
            await readFile(
              resolve(
                webDir,
                "porovnani.html"
              ),
              "utf8"
            );


          sendHtml(
            res,
            html
          );

          return;
        }


        /* -------------------------------------------------
           ENGLISH COMPARE
        ------------------------------------------------- */

        if (
          pathname ===
            "/en/compare" ||
          pathname ===
            "/en/compare/"
        ) {
          const html =
            await readFile(
              resolve(
                webDir,
                "porovnani-en.html"
              ),
              "utf8"
            );


          sendHtml(
            res,
            html
          );

          return;
        }


        /* -------------------------------------------------
           CZECH ABOUT
        ------------------------------------------------- */

        if (
          pathname ===
            "/cs/o-projektu" ||
          pathname ===
            "/cs/o-projektu/"
        ) {
          const html =
            await readFile(
              resolve(
                webDir,
                "o-projektu.html"
              ),
              "utf8"
            );


          sendHtml(
            res,
            html
          );

          return;
        }


        /* -------------------------------------------------
           ENGLISH ABOUT
        ------------------------------------------------- */

        if (
          pathname ===
            "/en/about" ||
          pathname ===
            "/en/about/"
        ) {
          const html =
            await readFile(
              resolve(
                webDir,
                "o-projektu-en.html"
              ),
              "utf8"
            );


          sendHtml(
            res,
            html
          );

          return;
        }


        /* -------------------------------------------------
           CZECH COUNTRY
        ------------------------------------------------- */

        const countryPageMatch =
          /^\/cs\/zeme\/([^/]+)\/?$/.exec(
            pathname
          );


        if (
          countryPageMatch
        ) {
          const html =
            await renderCountryPage(
              countryPageMatch[1]
            );


          if (
            !html
          ) {
            send404(
              res
            );

            return;
          }


          sendHtml(
            res,
            html
          );

          return;
        }


        /* -------------------------------------------------
           ENGLISH COUNTRY
        ------------------------------------------------- */

        const englishCountryPageMatch =
          /^\/en\/countries\/([^/]+)\/?$/.exec(
            pathname
          );


        if (
          englishCountryPageMatch
        ) {
          const html =
            await renderEnglishCountryPage(
              englishCountryPageMatch[1]
            );


          if (
            !html
          ) {
            send404(
              res
            );

            return;
          }


          sendHtml(
            res,
            html
          );

          return;
        }


        /* -------------------------------------------------
           DEVELOPMENT CZECH DEBT CLOCK EMBED
        ------------------------------------------------- */

        if (
          pathname ===
            "/embed/cs/debt-clock" ||
          pathname ===
            "/embed/cs/debt-clock/"
        ) {
          const data =
            await readFile(
              resolve(
                webDir,
                "embed-debt-clock.html"
              )
            );


          res.writeHead(
            200,
            {
              "Content-Type":
                "text/html; charset=utf-8",

              "Cache-Control":
                "no-cache"
            }
          );


          res.end(
            data
          );

          return;
        }


        /* -------------------------------------------------
           DEVELOPMENT ENGLISH DEBT CLOCK EMBED
        ------------------------------------------------- */

        if (
          pathname ===
            "/embed/en/debt-clock" ||
          pathname ===
            "/embed/en/debt-clock/"
        ) {
          const data =
            await readFile(
              resolve(
                webDir,
                "embed-debt-clock-en.html"
              )
            );


          res.writeHead(
            200,
            {
              "Content-Type":
                "text/html; charset=utf-8",

              "Cache-Control":
                "no-cache"
            }
          );


          res.end(
            data
          );

          return;
        }


        /* -------------------------------------------------
           CHROME DEVTOOLS
        ------------------------------------------------- */

        if (
          pathname.startsWith(
            "/.well-known/"
          )
        ) {
          send404(
            res
          );

          return;
        }


        /* -------------------------------------------------
           STATIC ASSETS
        ------------------------------------------------- */

        const relativePath =
          pathname.replace(
            /^\/+/,
            ""
          );


        const filePath =
          resolve(
            webDir,
            relativePath
          );


        if (
          !filePath.startsWith(
            webDir
          )
        ) {
          send404(
            res
          );

          return;
        }


        let data;


        try {
          data =
            await readFile(
              filePath
            );
        } catch (
          error
        ) {
          if (
            error.code ===
              "ENOENT" ||
            error.code ===
              "EISDIR"
          ) {
            send404(
              res
            );

            return;
          }


          throw error;
        }


        const extension =
          extname(
            filePath
          ).toLowerCase();


        const contentType =
          contentTypes[
            extension
          ] ??
          "application/octet-stream";


        res.writeHead(
          200,
          {
            "Content-Type":
              contentType,

            "Cache-Control":
              "no-cache"
          }
        );


        res.end(
          data
        );
      } catch (
        error
      ) {
        console.error(
          error
        );


        res.writeHead(
          500,
          {
            "Content-Type":
              "application/json; charset=utf-8"
          }
        );


        res.end(
          JSON.stringify({
            error:
              "Internal server error"
          })
        );
      }
    }
  );


/* ---------------------------------------------------------
   START
--------------------------------------------------------- */

server.listen(
  PORT,
  () => {
    console.log(
      `Server running at http://localhost:${PORT}`
    );


    console.log(
      `Czech site: http://localhost:${PORT}/cs/`
    );


    console.log(
      `English site: http://localhost:${PORT}/en/`
    );


    console.log(
      `English ranking: http://localhost:${PORT}/en/ranking/`
    );


    console.log(
      `English compare: http://localhost:${PORT}/en/compare/`
    );


    console.log(
      `English about: http://localhost:${PORT}/en/about/`
    );
  }
);