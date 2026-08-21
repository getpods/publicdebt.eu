import readExcelFile from "read-excel-file/node";

import {
  resolve,
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


const input =
  resolve(
    ROOT,
    "data/raw/MFCR-Makroekonomicka-predikce-duben-2026.xlsx"
  );


const sheets =
  await readExcelFile(
    input
  );


console.log(
  "\n=== MF ČR — DUBEN 2026 ===\n"
);


console.log(
  `Sheets: ${sheets.length}`
);


const relevantSheets =
  [];


for (
  const sheet of
  sheets
) {
  const sheetName =
    sheet.sheet;


  const rows =
    sheet.data;


  console.log(
    `\n=== ${sheetName} ===`
  );


  console.log(
    `Rows: ${rows.length}`
  );


  // Hledáme řádky, které mohou souviset
  // s dluhem, deficitem nebo veřejnými financemi.

  const matches =
    rows
      .map(
        (
          row,
          index
        ) => ({
          rowNumber:
            index +
            1,

          row
        })
      )
      .filter(
        ({
          row
        }) =>
          row.some(
            cell =>
              typeof cell ===
                "string" &&
              /dluh|dluhu|saldo|deficit|vl[aá]dn|veřejn|public|debt/i.test(
                cell
              )
          )
      );


  if (
    !matches.length
  ) {
    continue;
  }


  relevantSheets.push({
    sheetName,

    count:
      matches.length
  });


  console.log(
    `Relevant rows: ${matches.length}`
  );


  for (
    const {
      rowNumber,
      row
    } of
    matches.slice(
      0,
      30
    )
  ) {
    console.log(
      `\nRow ${rowNumber}:`
    );


    console.log(
      row
    );
  }
}


console.log(
  "\n=== SUMMARY ==="
);


console.log(
  `Sheets: ${sheets.length}`
);


console.log(
  `Sheets with matches: ${relevantSheets.length}`
);


for (
  const {
    sheetName,
    count
  } of
  relevantSheets
) {
  console.log(
    `- ${sheetName}: ${count} relevant rows`
  );
}