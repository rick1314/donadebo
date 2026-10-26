/**
 * Cocktail RSVP -> Google Sheet
 *
 * Sheet:
 * https://docs.google.com/spreadsheets/d/14ZOo55uOwUyEtT7S_NGhoMiTbKpQ3uy5K9rYnEut6sc/edit
 *
 * The sheet must have a header row containing:
 *   - Name
 *   - Total Number of Guests
 *
 * It may also have optional headers:
 *   - Attending  (Yes / No)
 *   - Message    (guest note)
 * If those optional headers exist, they are filled too.
 *
 * Deploy:
 *   1. Open the sheet above.
 *   2. Extensions -> Apps Script.
 *   3. Replace Code.gs with this file and save.
 *   4. Deploy -> New deployment -> Select type "Web app".
 *   5. Execute as: Me
 *      Who has access: Anyone
 *   6. Authorize, deploy, and copy the Web app URL ending in /exec.
 *   7. Paste that URL into config.js as rsvpSheetUrl.
 *
 * Verify: open the /exec URL in a browser. It should show
 *   {"ok":true,"ready":true,"found":true,"sheet":"..."}
 *
 * Note: this Web App writes only to the columns above. Keep its URL
 * unlisted. It can append rows, not read data.
 */

var SHEET_ID = "14ZOo55uOwUyEtT7S_NGhoMiTbKpQ3uy5K9rYnEut6sc";
var MAX_HEADER_ROWS = 15;
var NAME_HEADER = "name";
var COUNT_HEADER = "total number of guests";
var MESSAGE_HEADERS = ["message", "note", "notes"];
var ATTENDING_HEADERS = ["attending", "status", "rsvp"];

/* Set false to write only "I'm in" responses. */
var INCLUDE_DECLINES = true;

function doPost(e) {
  try {
    var params = (e && e.parameter) || {};
    var name = String(params.name || "").trim();
    if (!name) return json({ ok: false, error: "Missing name" });

    var attending = String(params.attending || "yes").toLowerCase() === "no" ? "no" : "yes";
    var guests = parseInt(params.count, 10);
    if (isNaN(guests)) guests = attending === "yes" ? 1 : 0;
    guests = Math.max(0, Math.min(30, guests));
    if (attending === "no") guests = 0;

    var message = String(params.message || "").trim().slice(0, 400);

    if (!INCLUDE_DECLINES && attending !== "yes") {
      return json({ ok: true, skipped: true });
    }

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var target = findTarget(ss);
    if (!target) {
      return json({ ok: false, error: "Could not find Name and Total Number of Guests headers" });
    }

    target.sheet.appendRow(target.row({
      name: name,
      guests: guests,
      attending: attending,
      message: message
    }));
    return json({ ok: true, name: name, guests: guests });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var target = findTarget(ss);
    return json({
      ok: true,
      ready: true,
      found: !!target,
      sheet: target ? target.sheet.getName() : ""
    });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function findTarget(ss) {
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var lastRow = Math.min(sheet.getLastRow(), MAX_HEADER_ROWS);
    var lastCol = Math.min(Math.max(sheet.getLastColumn(), 1), 40);
    if (lastRow < 1) continue;

    var values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
    for (var r = 0; r < values.length; r++) {
      var nameCol = -1;
      var countCol = -1;
      var messageCol = -1;
      var attendingCol = -1;

      for (var c = 0; c < values[r].length; c++) {
        var header = normalize(values[r][c]);
        if (header === NAME_HEADER) nameCol = c;
        if (header === COUNT_HEADER) countCol = c;
        if (MESSAGE_HEADERS.indexOf(header) >= 0) messageCol = c;
        if (ATTENDING_HEADERS.indexOf(header) >= 0) attendingCol = c;
      }

      if (nameCol >= 0 && countCol >= 0) {
        return {
          sheet: sheet,
          row: function (entry) {
            var width = Math.max(sheet.getLastColumn(), nameCol + 1, countCol + 1);
            var row = [];
            for (var i = 0; i < width; i++) row.push("");
            row[nameCol] = entry.name;
            row[countCol] = entry.guests;
            if (messageCol >= 0) row[messageCol] = entry.message;
            if (attendingCol >= 0) row[attendingCol] = entry.attending === "yes" ? "Yes" : "No";
            return row;
          }
        };
      }
    }
  }
  return null;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
