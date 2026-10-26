(function () {
  var STAGES = ["title", "story", "party", "rsvp"];
  var STAGE_NAMES = ["Play", "Invite", "Days", "RSVP"];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var index = 0;
  var audioCtx = null;
  var alertTimer = 0;
  var saveLock = false;
  var playApi = null;
  var revealed = false;

  var stagesEl = document.getElementById("stages");
  var screenEl = document.getElementById("screen");

  function $(id) { return document.getElementById(id); }

  function prefersSound() {
    try {
      return localStorage.getItem("arcade-sound") === "on";
    } catch (err) {
      return false;
    }
  }

  function rememberSound(on) {
    try {
      localStorage.setItem("arcade-sound", on ? "on" : "off");
    } catch (err) {}
  }

  function rsvpAttending() {
    try {
      return localStorage.getItem("unite-rsvp") === "yes";
    } catch (err) {
      return false;
    }
  }

  function rememberRsvp(going) {
    try {
      localStorage.setItem("unite-rsvp", going ? "yes" : "no");
    } catch (err) {}
    updateSaveHint();
  }

  function updateSaveHint() {
    var hint = $("save-hint");
    if (!hint) return;
    hint.textContent = rsvpAttending()
      ? "Adds both days to your calendar"
      : "Adds the wedding to your calendar";
  }

  function setSoundButton() {
    var on = prefersSound();
    var button = $("sound");
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.setAttribute("aria-label", on ? "Sound on" : "Sound off");
    button.textContent = on ? "SFX" : "OFF";
  }

  function tone(freq, dur, type, slide) {
    if (!prefersSound()) return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    var t = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq + slide), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.07, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function coin() {
    tone(880, 0.07, "square", 220);
    setTimeout(function () { tone(1320, 0.1, "square", 0); }, 70);
  }

  function roar() {
    tone(72, 0.42, "sawtooth", 48);
    setTimeout(function () { tone(108, 0.32, "square", -36); }, 90);
  }

  function snatch() {
    tone(640, 0.14, "square", -380);
    setTimeout(function () { tone(150, 0.28, "sawtooth", -60); }, 100);
  }

  function breath() {
    tone(190, 0.16, "sawtooth", 210);
    tone(460, 0.07, "square", 70);
  }

  function fanfare() {
    tone(523, 0.12, "square", 0);
    setTimeout(function () { tone(659, 0.12, "square", 0); }, 140);
    setTimeout(function () { tone(784, 0.14, "square", 0); }, 280);
    setTimeout(function () { tone(1046, 0.32, "square", 30); }, 430);
  }

  function buzz() {
    tone(110, 0.18, "sawtooth", -40);
  }

  function showAlert(message) {
    $("alert-text").textContent = message;
    $("alert").classList.add("show");
    clearTimeout(alertTimer);
    alertTimer = setTimeout(function () {
      $("alert").classList.remove("show");
    }, 2800);
  }

  function updateNav() {
    $("nav-index").textContent = (index + 1) + "/4";
    $("nav-name").textContent = STAGE_NAMES[index];
    Array.prototype.forEach.call(document.querySelectorAll(".dot"), function (dot, i) {
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    $("prev").disabled = index === 0;
    $("next").disabled = !revealed || index === STAGES.length - 1;
    $("stage-announcer").textContent = STAGE_NAMES[index];
  }

  function goTo(next, behavior) {
    if (!revealed) next = 0;
    index = Math.max(0, Math.min(STAGES.length - 1, next));
    stagesEl.scrollTo({
      left: stagesEl.clientWidth * index,
      behavior: behavior || (reduceMotion ? "auto" : "smooth")
    });
    updateNav();
    syncPlay();
    if (revealed && location.hash !== "#" + STAGES[index]) {
      try { history.replaceState(null, "", "#" + STAGES[index]); } catch (err) {}
    }
  }

  function syncPlay() {
    if (playApi) playApi.setActive(index === 0);
  }

  function handlePlayEvent(name) {
    if (name === "jump") tone(640, 0.06, "square", 180);
    if (name === "fire") tone(480, 0.05, "square", 140);
    if (name === "hit") tone(760, 0.06, "square", 180);
    if (name === "roar") roar();
    if (name === "boss") {
      tone(98, 0.28, "sawtooth", 30);
      setTimeout(function () { tone(147, 0.2, "square", -20); }, 150);
    }
    if (name === "kidnap") snatch();
    if (name === "breath") breath();
    if (name === "learn") tone(880, 0.09, "square", 150);
    if (name === "spark") tone(990, 0.04, "square", 90);
    if (name === "kindle") {
      tone(660, 0.09, "square", 120);
      setTimeout(function () { tone(880, 0.09, "square", 120); }, 90);
      setTimeout(function () { tone(1174, 0.18, "square", 60); }, 180);
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    }
    if (name === "reunion") {
      tone(523, 0.1, "square", 0);
      setTimeout(function () { tone(659, 0.12, "square", 0); }, 100);
    }
    if (name === "hurt" || name === "lose") buzz();
    if (name === "win") {
      fanfare();
      reveal();
      if (navigator.vibrate) navigator.vibrate([12, 40, 18]);
    }
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    document.documentElement.classList.add("is-revealed");
    try { sessionStorage.setItem("unite-revealed", "1"); } catch (err) {}
    try { localStorage.setItem("unite-revealed", "1"); } catch (err) {}
    fillNames();
    renderDate();
    updateNav();
    if (playApi) playApi.resize();
    $("stage-announcer").textContent = "The invitation is unlocked.";
  }

  function fillNames() {
    var a = WEDDING.partner1 || "Chandrima";
    var b = WEDDING.partner2 || "Debopriyo";
    $("name1").textContent = a;
    $("name2").textContent = b;
    document.title = revealed ? a + " & " + b + " — Save the Date" : "Dragon Slayer: D2";
  }

  function renderDate() {
    var built = WeddingCalendar.build(pageInput());
    var tag = $("tagline");
    if (!built.ok) {
      tag.textContent = revealed ? "DATE COMING SOON" : "";
      if (playApi) playApi.setDate("");
      return built;
    }
    if (playApi) playApi.setDate(built.dateLabel);
    if (!revealed) {
      tag.textContent = "";
      return built;
    }
    tag.textContent = built.dateLabel;
    return built;
  }

  function pageInput() {
    var pageUrl = "";
    if (location.protocol.indexOf("http") === 0) {
      pageUrl = location.origin + location.pathname;
    }
    return {
      partner1: WEDDING.partner1,
      partner2: WEDDING.partner2,
      date: WEDDING.date,
      startTime: WEDDING.startTime,
      endTime: WEDDING.endTime,
      timeZone: WEDDING.timeZone,
      venue: WEDDING.venue,
      city: WEDDING.city,
      address: WEDDING.address,
      dressCode: WEDDING.dressCode,
      note: WEDDING.note,
      mapUrl: WEDDING.mapUrl,
      cocktailDate: WEDDING.cocktailDate,
      pageUrl: pageUrl
    };
  }

  function safeHttpUrl(value) {
    var raw = (value || "").trim();
    return /^https?:\/\//i.test(raw) ? raw : "";
  }

  function sheetRsvpEndpoint() {
    return safeHttpUrl(WEDDING.rsvpSheetUrl);
  }

  function rsvpOpen() {
    return !!(
      safeHttpUrl(WEDDING.rsvpUrl) ||
      formspreeEndpoint(WEDDING.formspreeId) ||
      rsvpMail(WEDDING.rsvpEmail) ||
      sheetRsvpEndpoint()
    );
  }

  function defaultInvite() {
    var built = WeddingCalendar.build(pageInput());
    if (!built.ok) return ["The date will show up here soon."];
    var lines = [
      "The wedding is on " + WeddingCalendar.sentenceDate(WEDDING.date) + " at " + built.location + "."
    ];
    if (built.cocktailLabel) {
      lines.push(
        "We will have a cocktail party on the evening of " +
        WeddingCalendar.sentenceDate(WEDDING.cocktailDate) + "." +
        (rsvpOpen() ? " You can RSVP for it." : " RSVP details will follow.")
      );
    }
    return lines;
  }

  function fillStory() {
    var root = $("story-copy");
    root.replaceChildren();
    var custom = (WEDDING.story || "").trim();
    var paragraphs = custom
      ? custom.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean)
      : defaultInvite();
    paragraphs.forEach(function (text) {
      var p = document.createElement("p");
      p.className = "body";
      p.textContent = text;
      root.appendChild(p);
    });
  }

  function addFact(dl, term, value) {
    var wrap = document.createElement("div");
    wrap.className = "fact";
    var dt = document.createElement("dt");
    dt.textContent = term;
    var dd = document.createElement("dd");
    dd.textContent = value;
    wrap.append(dt, dd);
    dl.appendChild(wrap);
  }

  function fillParty() {
    var dl = $("party-facts");
    dl.replaceChildren();
    var built = WeddingCalendar.build(pageInput());
    if (!built.ok) addFact(dl, "WEDDING", "COMING SOON");
    else {
      if (built.cocktailLabel) addFact(dl, "COCKTAIL", built.cocktailLabel + "\nEVENING");
      addFact(dl, "WEDDING", built.dateLabel + (built.timeLabel ? "\n" + built.timeLabel : "\nALL DAY"));
    }
    addFact(dl, "WHERE", built.ok && built.location ? built.location : "COMING SOON");
    if ((WEDDING.dressCode || "").trim()) addFact(dl, "GEAR", WEDDING.dressCode.trim());
    if ((WEDDING.note || "").trim()) addFact(dl, "NOTE", WEDDING.note.trim());

    var map = $("map-link");
    var mapHref = safeHttpUrl(WEDDING.mapUrl);
    if (!mapHref && built.ok && built.location) {
      mapHref = "https://maps.google.com/?q=" + encodeURIComponent(built.location);
    }
    if (mapHref) {
      map.hidden = false;
      map.href = mapHref;
    } else {
      map.hidden = true;
    }

    var note = $("party-note");
    if (!built.ok) {
      note.hidden = false;
      note.textContent = "The date will show up on this screen first.";
    } else {
      note.hidden = true;
      note.textContent = "";
    }
  }

  function formspreeEndpoint(id) {
    var raw = String(id || "").trim();
    var match = raw.match(/formspree\.io\/f\/([A-Za-z0-9]+)/);
    if (match) raw = match[1];
    return /^[A-Za-z0-9]+$/.test(raw) ? "https://formspree.io/f/" + raw : "";
  }

  function rsvpMail(email) {
    var clean = String(email || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? clean : "";
  }

  function fillRsvp() {
    var slot = $("rsvp-slot");
    slot.replaceChildren();
    var url = safeHttpUrl(WEDDING.rsvpUrl);
    if (url) {
      var lead = document.createElement("p");
      lead.className = "body";
      lead.textContent = "The RSVP desk is open.";
      var link = document.createElement("a");
      link.className = "big-link";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "OPEN RSVP DESK";
      slot.append(lead, link);
      return;
    }

    var sheet = sheetRsvpEndpoint();
    if (!formspreeEndpoint(WEDDING.formspreeId) && !rsvpMail(WEDDING.rsvpEmail) && !sheet) {
      var closed = document.createElement("p");
      closed.className = "body";
      closed.textContent = "RSVP opens here soon.";
      var soon = document.createElement("p");
      soon.className = "body";
      soon.textContent = "It will ask for your name and how many people are coming with you.";
      slot.append(closed, soon);
      return;
    }

    if (sheet) {
      var kicker = document.querySelector("#rsvp .plate-kicker");
      if (kicker) kicker.textContent = "COCKTAIL RSVP";
      var sheetLead = document.createElement("p");
      sheetLead.className = "body rsvp-lead";
      sheetLead.textContent = "Cocktail party" +
        (WeddingCalendar.isDate(WEDDING.cocktailDate) ? " on " + WeddingCalendar.sentenceDate(WEDDING.cocktailDate) : "") +
        ". Please RSVP below.";
      slot.appendChild(sheetLead);
    }

    var form = document.createElement("form");
    form.id = "rsvp-form";
    form.noValidate = true;
    form.innerHTML =
      '<div class="rsvp-fields">' +
      '<label class="field"><span class="field-label">YOUR NAME</span><input name="name" required maxlength="80" autocomplete="name"></label>' +
      '<div class="field" role="radiogroup" aria-label="Your move"><span class="field-label">YOUR MOVE</span><div class="choice">' +
      '<label class="choice-btn"><input type="radio" name="attending" value="yes" required><span>I\'M IN</span></label>' +
      '<label class="choice-btn"><input type="radio" name="attending" value="no"><span>I\'M OUT</span></label>' +
      "</div></div>" +
      '<label class="field" id="count-field"><span class="field-label">PARTY SIZE</span><input name="count" type="number" min="1" max="8" value="1" inputmode="numeric"></label>' +
      '<label class="field"><span class="field-label">MESSAGE</span><textarea name="message" rows="2" maxlength="400"></textarea></label>' +
      '<input class="hp" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      "</div>" +
      '<button class="send-btn" type="submit">SEND RSVP</button>';
    slot.appendChild(form);

    form.addEventListener("change", function () {
      var picked = form.querySelector('input[name="attending"]:checked');
      $("count-field").hidden = picked && picked.value === "no";
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitRsvp(form);
    });
  }

  function submitRsvp(form) {
    var data = new FormData(form);
    if ((data.get("_gotcha") || "").trim()) return;
    var name = String(data.get("name") || "").trim();
    var attending = String(data.get("attending") || "");
    var message = String(data.get("message") || "").trim();
    var parsedCount = parseInt(data.get("count"), 10);
    var count = isNaN(parsedCount) ? 1 : Math.max(1, Math.min(8, parsedCount));
    if (!name) {
      showAlert("Add your name.");
      buzz();
      form.querySelector("[name=name]").focus();
      return;
    }
    if (attending !== "yes" && attending !== "no") {
      showAlert("Pick I'm in or I'm out.");
      buzz();
      var firstChoice = form.querySelector('input[name="attending"]');
      if (firstChoice) firstChoice.focus();
      return;
    }
    var going = attending === "yes";
    var countInput = form.querySelector('[name="count"]');
    if (countInput) countInput.value = String(count);
    var summary = name + " is " + (going ? "IN" : "OUT") + (going ? " · party of " + count : "");
    if (message) summary += "\n" + message;

    var sheet = sheetRsvpEndpoint();
    var formspree = formspreeEndpoint(WEDDING.formspreeId);
    var email = rsvpMail(WEDDING.rsvpEmail);
    var button = form.querySelector(".send-btn");
    button.disabled = true;
    button.textContent = "SENDING...";

    if (sheet) {
      var sheetData = new URLSearchParams();
      sheetData.set("name", name);
      sheetData.set("attending", going ? "yes" : "no");
      sheetData.set("count", going ? String(count) : "0");
      if (message) sheetData.set("message", message);
      fetch(sheet, {
        method: "POST",
        mode: "no-cors",
        body: sheetData
      }).then(function () {
        rememberRsvp(going);
        coin();
        form.reset();
        $("count-field").hidden = false;
        var sheetFields = form.querySelector(".rsvp-fields");
        if (sheetFields) sheetFields.scrollTop = 0;
        showAlert(going ? "RSVP saved. See you there." : "RSVP saved. You will be missed.");
      }).catch(function () {
        buzz();
        showAlert("The desk did not answer. Try again.");
      }).then(function () {
        button.disabled = false;
        button.textContent = "SEND RSVP";
      });
      return;
    }

    if (formspree) {
      data.set("attending", going ? "yes" : "no");
      data.set("count", going ? String(count) : "0");
      data.set("_subject", "RSVP: " + name);
      fetch(formspree, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (!res.ok) throw new Error("bad status");
        rememberRsvp(going);
        coin();
        form.reset();
        $("count-field").hidden = false;
        var fields = form.querySelector(".rsvp-fields");
        if (fields) fields.scrollTop = 0;
        showAlert(going ? "RSVP saved. See you there." : "RSVP saved. You will be missed.");
      }).catch(function () {
        buzz();
        showAlert("The desk did not answer. Try again.");
      }).then(function () {
        button.disabled = false;
        button.textContent = "SEND RSVP";
      });
      return;
    }

    if (!email) {
      buzz();
      showAlert("The RSVP desk is not set up yet.");
      button.disabled = false;
      button.textContent = "SEND RSVP";
      return;
    }

    var subject = encodeURIComponent("RSVP: " + name);
    var body = encodeURIComponent(summary);
    window.location.href = "mailto:" + email + "?subject=" + subject + "&body=" + body;
    rememberRsvp(going);
    showAlert("Your mail app is open. Hit send there.");
    coin();
    button.disabled = false;
    button.textContent = "SEND RSVP";
  }

  function isIos() {
    var ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent || "");
  }

  function isInAppBrowser() {
    return /Instagram|FBAN|FBAV|FB_IAB|TikTok|Snapchat|Twitter/i.test(navigator.userAgent || "");
  }

  function openUrl(url) {
    var a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function openIcs(ics, filename) {
    var file = new File([ics], filename, { type: "text/calendar" });
    var url = URL.createObjectURL(file);
    var a = document.createElement("a");
    a.href = url;
    if (!isIos()) a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 20000);
  }

  function flashScreen() {
    if (reduceMotion) return;
    screenEl.classList.add("flash");
    setTimeout(function () { screenEl.classList.remove("flash"); }, 140);
  }

  function saveDate(which) {
    if (saveLock) return;
    var input = pageInput();
    input.includeCocktail = rsvpAttending();
    var built = WeddingCalendar.build(input);
    var button = $("save");
    if (!built.ok) {
      buzz();
      button.classList.remove("shake");
      void button.offsetWidth;
      button.classList.add("shake");
      showAlert("The date is not set yet. Check back soon.");
      return;
    }

    saveLock = true;
    setTimeout(function () { saveLock = false; }, 700);
    coin();
    flashScreen();
    if (navigator.vibrate) navigator.vibrate(12);

    var target = which || "auto";
    if (target === "auto") {
      if (built.includesCocktail) target = "apple";
      else if (isInAppBrowser() || isAndroid()) target = "google";
      else target = "apple";
    }

    if (target === "google") {
      openUrl(built.googleUrl);
      showAlert("Google Calendar is open. Save the event.");
      return;
    }
    if (target === "outlook") {
      openUrl(built.outlookUrl);
      showAlert("Outlook is open. Save the event.");
      return;
    }
    openIcs(built.ics, built.filename);
    if (built.includesCocktail) {
      showAlert(isIos() ? "Tap Add. The file has the cocktail and the wedding." : "Calendar file ready. It includes both days.");
    } else {
      showAlert(isIos() ? "Tap Add to drop this day in your calendar." : "Calendar file ready. Open it to save the day.");
    }
  }

  function bind() {
    $("prev").addEventListener("click", function () {
      tone(440, 0.05, "square", 80);
      goTo(index - 1);
    });
    $("next").addEventListener("click", function () {
      tone(660, 0.05, "square", 80);
      goTo(index + 1);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".dot"), function (dot) {
      dot.addEventListener("click", function () {
        tone(520, 0.04, "square", 0);
        goTo(Number(dot.getAttribute("data-stage")));
      });
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) return;
          if (!revealed) return;
          var next = STAGES.indexOf(entry.target.id);
          if (next < 0 || next === index) return;
          index = next;
          updateNav();
          syncPlay();
          if (location.hash !== "#" + STAGES[index]) {
            try { history.replaceState(null, "", "#" + STAGES[index]); } catch (err) {}
          }
        });
      }, { root: stagesEl, threshold: [0.6] });
      Array.prototype.forEach.call(stagesEl.children, function (stage) { observer.observe(stage); });
    }

    document.addEventListener("keydown", function (event) {
      var target = event.target;
      var tag = target && target.tagName ? target.tagName : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      var onControl = tag === "BUTTON" || tag === "A";
      var onPad = onControl && /^pad-/.test(target.id || "");
      var nativeActivation = event.key === " " || event.key === "Enter";
      if (index === 0 && playApi && (!onControl || onPad || !nativeActivation)) {
        if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
          event.preventDefault();
          playApi.setKey("left", true);
          return;
        }
        if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
          event.preventDefault();
          playApi.setKey("right", true);
          return;
        }
        if (event.key === " " || event.key === "ArrowUp" || event.key === "w" || event.key === "W" || event.key === "z" || event.key === "Z") {
          event.preventDefault();
          if (!event.repeat) playApi.pressJump();
          return;
        }
        if (event.key === "f" || event.key === "F" || event.key === "j" || event.key === "J") {
          event.preventDefault();
          if (!event.repeat) playApi.setKey("fire", true);
          return;
        }
      }
      if (onControl) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
      }
    });
    document.addEventListener("keyup", function (event) {
      if (!playApi) return;
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") playApi.setKey("left", false);
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") playApi.setKey("right", false);
      if (event.key === "f" || event.key === "F" || event.key === "j" || event.key === "J") playApi.setKey("fire", false);
    });

    function releaseKeys() {
      if (!playApi) return;
      playApi.setKey("left", false);
      playApi.setKey("right", false);
      playApi.setKey("fire", false);
    }
    window.addEventListener("blur", releaseKeys);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) releaseKeys();
    });

    $("open-invite").addEventListener("click", function () {
      coin();
      goTo(1);
    });

    $("repent").addEventListener("click", function () {
      tone(420, 0.08, "square", 120);
      reveal();
      showAlert("The invite is open. The game can wait.");
      goTo(1);
    });

    $("save").addEventListener("click", function () { saveDate("auto"); });

    $("sound").addEventListener("click", function () {
      var next = !prefersSound();
      rememberSound(next);
      setSoundButton();
      if (next) coin();
    });

    window.addEventListener("resize", function () {
      stagesEl.scrollTo({ left: stagesEl.clientWidth * index, behavior: "auto" });
      if (playApi) playApi.resize();
    });
  }

  function boot() {
    revealed = document.documentElement.classList.contains("is-revealed");
    if (!reduceMotion) screenEl.classList.add("power-on");
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    setSoundButton();
    fillNames();
    updateSaveHint();
    playApi = WeddingPlay.mount({
      canvas: $("scene"),
      field: $("play-field"),
      left: $("pad-left"),
      right: $("pad-right"),
      jump: $("pad-jump"),
      fire: $("pad-fire"),
      tryAgain: $("try-again"),
      openInvite: $("open-invite"),
      repent: $("repent"),
      endings: $("endings"),
      status: $("play-status"),
      onEvent: handlePlayEvent
    });
    renderDate();
    fillStory();
    fillParty();
    fillRsvp();
    bind();
    var start = 0;
    if (revealed) {
      var hash = (location.hash || "").replace("#", "");
      var hashed = STAGES.indexOf(hash);
      start = hashed >= 0 ? hashed : 1;
    }
    goTo(start, "auto");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
