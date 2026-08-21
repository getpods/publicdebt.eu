import {
  access,
  readFile,
  readdir
} from "node:fs/promises";

import {
  resolve,
  relative,
  dirname
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


const distDir =
  resolve(
    ROOT,
    "dist"
  );


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function assert(
  condition,
  message
) {
  if (
    !condition
  ) {
    throw new Error(
      message
    );
  }
}


async function exists(
  file
) {
  try {
    await access(
      file
    );

    return true;
  } catch {
    return false;
  }
}


function normalizeRelativePath(
  file
) {
  return relative(
    distDir,
    file
  )
    .split("\\")
    .join("/");
}


function stripHtml(
  value
) {
  return value
    .replace(
      /<[^>]+>/g,
      ""
    )
    .replace(
      /&nbsp;/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function stripQueryAndHash(
  href
) {
  return href
    .split("#")[0]
    .split("?")[0];
}


function getHash(
  href
) {
  const index =
    href.indexOf(
      "#"
    );


  if (
    index === -1
  ) {
    return null;
  }


  return decodeURIComponent(
    href.slice(
      index + 1
    )
  );
}


/* ---------------------------------------------------------
   HTML FILE DISCOVERY
--------------------------------------------------------- */

async function findHtmlFiles(
  dir
) {
  const result =
    [];


  const entries =
    await readdir(
      dir,
      {
        withFileTypes: true
      }
    );


  for (
    const entry of
    entries
  ) {
    const file =
      resolve(
        dir,
        entry.name
      );


    if (
      entry.isDirectory()
    ) {
      result.push(
        ...await findHtmlFiles(
          file
        )
      );

      continue;
    }


    if (
      entry.isFile() &&
      entry.name.endsWith(
        ".html"
      )
    ) {
      result.push(
        file
      );
    }
  }


  return result;
}


/* ---------------------------------------------------------
   INTERNAL URL → DIST FILE
--------------------------------------------------------- */

function internalUrlToFile(
  href
) {
  const clean =
    stripQueryAndHash(
      href
    );


  if (
    !clean ||
    clean === "/"
  ) {
    return resolve(
      distDir,
      "index.html"
    );
  }


  const relativeUrl =
    clean.replace(
      /^\/+/,
      ""
    );


  if (
    clean.endsWith(
      "/"
    )
  ) {
    return resolve(
      distDir,
      relativeUrl,
      "index.html"
    );
  }


  return resolve(
    distDir,
    relativeUrl
  );
}


/* ---------------------------------------------------------
   ANCHORS
--------------------------------------------------------- */

function extractAnchors(
  html
) {
  const anchors =
    [];


  const pattern =
    /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;


  let match;


  while (
    (
      match =
        pattern.exec(
          html
        )
    )
  ) {
    const attributes =
      match[1];


    const innerHtml =
      match[2];


    const hrefMatch =
      /\bhref\s*=\s*["']([^"']+)["']/i.exec(
        attributes
      );


    if (
      !hrefMatch
    ) {
      continue;
    }


    anchors.push({
      href:
        hrefMatch[1],

      text:
        stripHtml(
          innerHtml
        )
    });
  }


  return anchors;
}


/* ---------------------------------------------------------
   IDS
--------------------------------------------------------- */

function hasId(
  html,
  id
) {
  if (
    !id
  ) {
    return true;
  }


  const escaped =
    id.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );


  const pattern =
    new RegExp(
      `\\bid=["']${escaped}["']`,
      "i"
    );


  return pattern.test(
    html
  );
}


/* ---------------------------------------------------------
   LANGUAGE HELPERS
--------------------------------------------------------- */

function pageLanguage(
  relativePath
) {
  if (
    relativePath.startsWith(
      "cs/"
    )
  ) {
    return "cs";
  }


  if (
    relativePath.startsWith(
      "en/"
    )
  ) {
    return "en";
  }


  return null;
}


function isLanguageSwitch(
  anchor,
  pageLang
) {
  const text =
    anchor.text
      .trim()
      .toUpperCase();


  if (
    pageLang === "cs" &&
    text === "EN"
  ) {
    return true;
  }


  if (
    pageLang === "en" &&
    text === "CS"
  ) {
    return true;
  }


  return false;
}


/* ---------------------------------------------------------
   CZECH TEXT HEURISTIC
--------------------------------------------------------- */

const suspiciousCzechPhrases = [
  "Domů",
  "Žebříček",
  "Porovnání",
  "O projektu",
  "Počet obyvatel",
  "Dluh na obyvatele",
  "Veřejný dluh",
  "Načítám",
  "Data se nepodařilo načíst",
  "Zobrazit celý žebříček",
  "Vyberte",
  "Pořadí v EU",
  "Celkový dluh",
  "Zdroje a metodika",
  "Napište nám",
  "Kontaktovat nás můžete",
  "Od chvíle, kdy jste přišli"
];


/* ---------------------------------------------------------
   VALIDATION
--------------------------------------------------------- */

console.log(
  "\n=== VALIDATE LINKS ===\n"
);


assert(
  await exists(
    distDir
  ),
  "Missing dist directory. Run build first."
);


const htmlFiles =
  await findHtmlFiles(
    distDir
  );


assert(
  htmlFiles.length >
    0,
  "No HTML files found in dist."
);


let checkedLinks =
  0;


let checkedHtmlFiles =
  0;


const errors =
  [];


const warnings =
  [];


/* ---------------------------------------------------------
   SCAN FILES
--------------------------------------------------------- */

for (
  const file of
  htmlFiles
) {
  const relativePath =
    normalizeRelativePath(
      file
    );


  const html =
    await readFile(
      file,
      "utf8"
    );


  const language =
    pageLanguage(
      relativePath
    );


  checkedHtmlFiles++;


  /* -------------------------------------------------------
     ENGLISH PAGE TEXT CHECK
  ------------------------------------------------------- */

  if (
    language === "en"
  ) {
    for (
      const phrase of
      suspiciousCzechPhrases
    ) {
      if (
        html.includes(
          phrase
        )
      ) {
        warnings.push(
          `${relativePath}: suspicious Czech text "${phrase}"`
        );
      }
    }
  }


  /* -------------------------------------------------------
     LINKS
  ------------------------------------------------------- */

  const anchors =
    extractAnchors(
      html
    );


  for (
    const anchor of
    anchors
  ) {
    const href =
      anchor.href.trim();


    checkedLinks++;


    /* external / special protocols */

    if (
      href.startsWith(
        "mailto:"
      ) ||
      href.startsWith(
        "tel:"
      ) ||
      href.startsWith(
        "javascript:"
      )
    ) {
      continue;
    }


    if (
      href.startsWith(
        "http://"
      ) ||
      href.startsWith(
        "https://"
      )
    ) {
      /*
       * Absolute PublicDebt.eu links used by the language
       * switch on generated country pages are allowed.
       */
      if (
        href.startsWith(
          "https://publicdebt.eu/"
        ) ||
        href.startsWith(
          "http://prizemi.cz/"
        )
      ) {
        if (
          language &&
          !isLanguageSwitch(
            anchor,
            language
          )
        ) {
          warnings.push(
            `${relativePath}: absolute internal link "${href}" with text "${anchor.text}"`
          );
        }
      }


      continue;
    }


    /* only internal root-relative and hash links */

    if (
      !href.startsWith(
        "/"
      ) &&
      !href.startsWith(
        "#"
      )
    ) {
      warnings.push(
        `${relativePath}: relative href "${href}"`
      );

      continue;
    }


    /* -----------------------------------------------------
       SAME-PAGE HASH
    ----------------------------------------------------- */

    if (
      href.startsWith(
        "#"
      )
    ) {
      const id =
        getHash(
          href
        );


      if (
        id &&
        !hasId(
          html,
          id
        )
      ) {
        errors.push(
          `${relativePath}: missing fragment target #${id}`
        );
      }


      continue;
    }


    /* -----------------------------------------------------
       LANGUAGE LEAKS
    ----------------------------------------------------- */

    if (
      language === "en" &&
      href.startsWith(
        "/cs/"
      ) &&
      !isLanguageSwitch(
        anchor,
        language
      )
    ) {
      errors.push(
        `${relativePath}: EN page links to CS "${href}" via "${anchor.text}"`
      );
    }


    if (
      language === "cs" &&
      href.startsWith(
        "/en/"
      ) &&
      !isLanguageSwitch(
        anchor,
        language
      )
    ) {
      errors.push(
        `${relativePath}: CS page links to EN "${href}" via "${anchor.text}"`
      );
    }


    /* -----------------------------------------------------
       TARGET EXISTS
    ----------------------------------------------------- */

    const targetFile =
      internalUrlToFile(
        href
      );


    if (
      !targetFile.startsWith(
        distDir
      )
    ) {
      errors.push(
        `${relativePath}: unsafe internal link "${href}"`
      );

      continue;
    }


    if (
      !await exists(
        targetFile
      )
    ) {
      errors.push(
        `${relativePath}: broken link "${href}" → ${normalizeRelativePath(
          targetFile
        )}`
      );

      continue;
    }


    /* -----------------------------------------------------
       TARGET HASH EXISTS
    ----------------------------------------------------- */

    const id =
      getHash(
        href
      );


    if (
      id &&
      targetFile.endsWith(
        ".html"
      )
    ) {
      const targetHtml =
        await readFile(
          targetFile,
          "utf8"
        );


      if (
        !hasId(
          targetHtml,
          id
        )
      ) {
        errors.push(
          `${relativePath}: "${href}" points to missing #${id}`
        );
      }
    }
  }
}


/* ---------------------------------------------------------
   WARNINGS
--------------------------------------------------------- */

if (
  warnings.length
) {
  console.log(
    "Warnings:\n"
  );


  for (
    const warning of
    warnings
  ) {
    console.log(
      `WARN  ${warning}`
    );
  }


  console.log();
}


/* ---------------------------------------------------------
   ERRORS
--------------------------------------------------------- */

if (
  errors.length
) {
  console.error(
    "Errors:\n"
  );


  for (
    const error of
    errors
  ) {
    console.error(
      `ERROR  ${error}`
    );
  }


  console.error(
    `\n✗ Link validation failed with ${errors.length} error(s).\n`
  );


  process.exitCode =
    1;
} else {
  console.log(
    `OK  ${checkedHtmlFiles} HTML files checked`
  );


  console.log(
    `OK  ${checkedLinks} links checked`
  );


  console.log(
    "OK  no broken internal links"
  );


  console.log(
    "OK  no unintended CS/EN cross-links"
  );


  console.log(
    "\n✓ Link validation completed.\n"
  );
}