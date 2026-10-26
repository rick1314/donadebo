/* Pure calendar links for the wedding cabinet. No DOM. */
(function (root, factory) {
  root.WeddingCalendar = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function isDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    var parts = value.split("-").map(Number);
    var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return dt.getUTCFullYear() === parts[0] && dt.getUTCMonth() === parts[1] - 1 && dt.getUTCDate() === parts[2];
  }

  function isTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");
  }

  function isTimeZone(value) {
    try {
      Intl.DateTimeFormat("en-US", { timeZone: value });
      return true;
    } catch (err) {
      return false;
    }
  }

  function addDays(date, days) {
    var parts = date.split("-").map(Number);
    var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
    return dt.getUTCFullYear() + "-" + pad(dt.getUTCMonth() + 1) + "-" + pad(dt.getUTCDate());
  }

  function compactDate(date) {
    return date.replace(/-/g, "");
  }

  function sentenceDate(date) {
    return prettyDate(date).split(" ").map(function (word) {
      if (/^\d/.test(word)) return word;
      return word.charAt(0) + word.slice(1).toLowerCase();
    }).join(" ");
  }

  function prettyDate(date) {
    var parts = date.split("-").map(Number);
    var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }).format(dt).toUpperCase();
  }

  function wallParts(instant, timeZone) {
    var dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    var parts = {};
    dtf.formatToParts(instant).forEach(function (part) {
      if (part.type !== "literal") parts[part.type] = part.value;
    });
    var hour = Number(parts.hour);
    if (hour === 24) hour = 0;
    return {
      date: parts.year + "-" + parts.month + "-" + parts.day,
      hh: pad(hour),
      mm: parts.minute,
      ss: parts.second
    };
  }

  function wallAsUtcMillis(instant, timeZone) {
    var wall = wallParts(instant, timeZone);
    var date = wall.date.split("-").map(Number);
    return Date.UTC(date[0], date[1] - 1, date[2], Number(wall.hh), Number(wall.mm), Number(wall.ss));
  }

  function wallToUtc(date, time, timeZone) {
    var dateParts = date.split("-").map(Number);
    var timeParts = time.split(":").map(Number);
    var target = Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1], 0);
    var guess = target;
    for (var i = 0; i < 4; i++) {
      var diff = wallAsUtcMillis(new Date(guess), timeZone) - target;
      if (diff === 0) break;
      guess -= diff;
    }
    return new Date(guess);
  }

  function stampUtc(date) {
    return date.toISOString().replace(/\.\d{3}Z$/, "Z");
  }

  function compactUtc(date) {
    return stampUtc(date).replace(/[-:]/g, "");
  }

  function formatClock(date, timeZone) {
    var label = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(date);
    return label.replace(/\u202f/g, " ").replace(/\s?(am|pm)$/i, function (m) {
      return " " + m.trim().toUpperCase();
    });
  }

  function zoneAbbr(date, timeZone) {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      timeZoneName: "short"
    }).formatToParts(date);
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === "timeZoneName") return parts[i].value;
    }
    return timeZone;
  }

  function icsText(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\n|\r/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  }

  function foldLine(line) {
    var encoder = new TextEncoder();
    var lines = [];
    var buf = "";
    var size = 0;
    var limit = 75;
    Array.from(line).forEach(function (ch) {
      var n = encoder.encode(ch).length;
      if (buf && size + n > limit) {
        lines.push(buf);
        buf = ch;
        size = n;
        limit = 74;
      } else {
        buf += ch;
        size += n;
      }
    });
    if (buf) lines.push(buf);
    return lines.map(function (part, index) {
      return index === 0 ? part : " " + part;
    }).join("\r\n");
  }

  function slug(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "wedding";
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function addCocktail(lines, spec) {
    var title = spec.partner1 + " & " + spec.partner2 + "'s Cocktail Party";
    var description = [
      "Cocktail party on the evening of " + sentenceDate(spec.cocktailDate) + " for the wedding of " + spec.partner1 + " and " + spec.partner2 + ".",
      "Wedding day: " + spec.weddingSentence + "."
    ];
    if (spec.location) description.push(spec.location);
    if (spec.mapUrl) description.push(spec.mapUrl);
    if (spec.pageUrl) description.push(spec.pageUrl);
    var uid = "cocktail-" + slug(spec.partner1) + "-" + slug(spec.partner2) + "-" + compactDate(spec.cocktailDate) + "@save-the-date";
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTAMP:" + spec.dtStamp,
      "SUMMARY:" + icsText(title),
      "DESCRIPTION:" + icsText(description.join("\n"))
    );
    if (spec.location) lines.push("LOCATION:" + icsText(spec.location));
    if (spec.mapUrl) lines.push("URL:" + spec.mapUrl);
    lines.push(
      "DTSTART;VALUE=DATE:" + compactDate(spec.cocktailDate),
      "DTEND;VALUE=DATE:" + compactDate(addDays(spec.cocktailDate, 1)),
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:" + icsText(title),
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT"
    );
  }

  function build(input) {
    input = input || {};
    var partner1 = clean(input.partner1) || "Partner 1";
    var partner2 = clean(input.partner2) || "Partner 2";
    var date = clean(input.date);
    if (!isDate(date)) {
      return { ok: false, reason: "missing-date" };
    }

    var timeZone = clean(input.timeZone) || "UTC";
    if (!isTimeZone(timeZone)) timeZone = "UTC";

    var startTime = clean(input.startTime);
    var endTime = clean(input.endTime);
    var allDay = !isTime(startTime);
    if (!isTime(endTime)) endTime = "";

    var location = [clean(input.venue), clean(input.address) || clean(input.city)].filter(Boolean).join(", ");
    var title = partner1 + " & " + partner2 + "'s Wedding";
    var pageUrl = clean(input.pageUrl);
    var startUtc = null;
    var endUtc = null;
    var timeLabel = "";
    var whenLabel = prettyDate(date);

    if (!allDay) {
      var endDate = date;
      if (endTime && endTime <= startTime) endDate = addDays(date, 1);
      startUtc = wallToUtc(date, startTime, timeZone);
      endUtc = endTime ? wallToUtc(endDate, endTime, timeZone) : new Date(startUtc.getTime() + 6 * 60 * 60 * 1000);
      if (endUtc.getTime() <= startUtc.getTime()) {
        endUtc = new Date(startUtc.getTime() + 6 * 60 * 60 * 1000);
      }
      timeLabel = formatClock(startUtc, timeZone) + " – " + formatClock(endUtc, timeZone) + " " + zoneAbbr(startUtc, timeZone);
      whenLabel = prettyDate(date) + ", " + timeLabel;
    }

    var mapUrl = clean(input.mapUrl);
    if (!/^https?:\/\//i.test(mapUrl)) mapUrl = "";
    var cocktailDate = clean(input.cocktailDate);
    var cocktailLabel = isDate(cocktailDate) && cocktailDate !== date ? prettyDate(cocktailDate) : "";
    var includesCocktail = input.includeCocktail !== false && !!cocktailLabel;
    var descriptionLines = ["Wedding of " + partner1 + " and " + partner2 + "."];
    if (includesCocktail) descriptionLines.push("Cocktail party on the evening of " + sentenceDate(cocktailDate) + ".");
    if (timeLabel) descriptionLines.push(timeLabel);
    if (location) descriptionLines.push(location);
    if (mapUrl) descriptionLines.push(mapUrl);
    if (clean(input.dressCode)) descriptionLines.push("Dress: " + clean(input.dressCode));
    if (clean(input.note)) descriptionLines.push(clean(input.note));
    if (pageUrl) descriptionLines.push(pageUrl);
    var description = descriptionLines.join("\n");

    var googleDates = allDay
      ? compactDate(date) + "/" + compactDate(addDays(date, 1))
      : compactUtc(startUtc) + "/" + compactUtc(endUtc);
    var google = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: googleDates,
      details: description
    });
    if (location) google.set("location", location);
    if (!allDay) google.set("ctz", timeZone);

    var outlookStart = allDay ? date : stampUtc(startUtc);
    var outlookEnd = allDay ? date : stampUtc(endUtc);
    function outlookUrl(host) {
      var params = new URLSearchParams({
        path: "/calendar/action/compose",
        rru: "addevent",
        startdt: outlookStart,
        enddt: outlookEnd,
        subject: title,
        body: description
      });
      if (allDay) params.set("allday", "true");
      if (location) params.set("location", location);
      return host + "?" + params.toString();
    }

    var uid = "wedding-" + slug(partner1) + "-" + slug(partner2) + "-" + compactDate(date) + "@save-the-date";
    var dtStamp = stampUtc(new Date()).replace(/[-:]/g, "");
    var icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Chandrima and Debopriyo//Wedding//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTAMP:" + dtStamp,
      "SUMMARY:" + icsText(title),
      "DESCRIPTION:" + icsText(description)
    ];
    if (location) icsLines.push("LOCATION:" + icsText(location));
    if (mapUrl) icsLines.push("URL:" + mapUrl);
    if (allDay) {
      icsLines.push("DTSTART;VALUE=DATE:" + compactDate(date));
      icsLines.push("DTEND;VALUE=DATE:" + compactDate(addDays(date, 1)));
    } else {
      icsLines.push("DTSTART:" + compactUtc(startUtc));
      icsLines.push("DTEND:" + compactUtc(endUtc));
    }
    icsLines.push(
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:" + icsText(title),
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT"
    );
    if (includesCocktail) addCocktail(icsLines, {
      partner1: partner1,
      partner2: partner2,
      cocktailDate: cocktailDate,
      weddingSentence: sentenceDate(date),
      location: location,
      mapUrl: mapUrl,
      pageUrl: pageUrl,
      dtStamp: dtStamp
    });
    icsLines.push("END:VCALENDAR");

    return {
      ok: true,
      allDay: allDay,
      title: title,
      description: description,
      location: location,
      dateLabel: prettyDate(date),
      cocktailLabel: cocktailLabel,
      includesCocktail: includesCocktail,
      timeLabel: timeLabel,
      whenLabel: whenLabel,
      filename: slug(partner1) + "-" + slug(partner2) + "-wedding.ics",
      ics: icsLines.map(foldLine).join("\r\n") + "\r\n",
      googleUrl: "https://calendar.google.com/calendar/render?" + google.toString(),
      outlookUrl: outlookUrl("https://outlook.live.com/calendar/0/deeplink/compose"),
      outlookOfficeUrl: outlookUrl("https://outlook.office.com/calendar/0/deeplink/compose")
    };
  }

  return {
    build: build,
    sentenceDate: sentenceDate,
    isDate: isDate,
    isTimeZone: isTimeZone,
    wallToUtc: wallToUtc
  };
});
