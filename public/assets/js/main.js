// The Pointe at Kirby Gate — site JS

// Google Ads conversion label for form submissions.
// Create a "Submit lead form" conversion action in Google Ads (Goals > Conversions),
// copy its label, and paste it here (format: "AbC-D3fGhIjKlMnOp").
var FORM_CONVERSION_LABEL = "";

// Mobile nav toggle
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
})();

// Track phone-link clicks as a gtag event (calls from ads are already
// tracked via call reporting; this covers organic site visitors).
(function () {
  document.querySelectorAll('[data-track="phone"]').forEach(function (el) {
    el.addEventListener("click", function () {
      if (typeof gtag === "function") {
        gtag("event", "phone_click", { event_category: "engagement" });
        // Google Ads conversion "Website phone click" (ID 7872108647) — counts
        // tel: taps from ad visitors who call the main line instead of the ad number.
        gtag("event", "conversion", { send_to: "AW-18300279647/jhcdCOew26kdEN-2oJZE" });
      }
    });
  });
})();

// Track clicks out to review platforms (Google, Yelp) as a gtag event.
(function () {
  document.querySelectorAll('[data-track="review"]').forEach(function (el) {
    el.addEventListener("click", function () {
      if (typeof gtag === "function") {
        gtag("event", "review_click", {
          event_category: "engagement",
          event_label: el.dataset.platform || "unknown",
        });
      }
    });
  });
})();

// Fire the form-lead conversion on the thank-you page.
(function () {
  if (document.body.dataset.page === "thank-you" && FORM_CONVERSION_LABEL && typeof gtag === "function") {
    gtag("event", "conversion", { send_to: "AW-18300279647/" + FORM_CONVERSION_LABEL });
  }
})();

// Dropdown toggle for touch devices (hover handles pointer devices)
(function () {
  document.querySelectorAll(".has-sub > button").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var li = btn.parentElement;
      var open = li.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.querySelectorAll(".has-sub.open").forEach(function (o) { if (o !== li) o.classList.remove("open"); });
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".has-sub")) document.querySelectorAll(".has-sub.open").forEach(function (o) { o.classList.remove("open"); });
  });
})();

// Pre-select the "I'm interested in" field from ?interest= (used by ad sitelinks),
// e.g. /contact-us/?interest=memory-care
(function () {
  var sel = document.getElementById("interest");
  if (!sel) return;
  var v = (new URLSearchParams(location.search).get("interest") || "").toLowerCase();
  var map = { "memory-care": "Memory Care", "assisted-living": "Assisted Living", "tour": "Scheduling a Tour", "rates": "Rates & Availability", "respite": "Respite Care (Short-Term Stay)", "apply": "Applying / Reserving a Suite" };
  if (map[v]) sel.value = map[v];
})();

// Track clicks out to the DoorLoop rental application.
(function () {
  document.querySelectorAll('[data-track="apply"]').forEach(function (el) {
    el.addEventListener("click", function () {
      if (typeof gtag === "function") {
        gtag("event", "apply_click", { event_category: "engagement", event_label: el.dataset.plan || "general" });
      }
    });
  });
})();

// Image lightbox — click to expand photos and floor plans.
(function () {
  var targets = document.querySelectorAll(".two-col > img, .card > img, .fp-media img, [data-zoom]");
  if (!targets.length) return;
  var box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.innerHTML = '<button class="lightbox-close" aria-label="Close image">×</button><figure style="margin:0;display:contents"><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(box);
  var big = box.querySelector("img");
  var cap = box.querySelector("figcaption");
  var lastFocus = null;
  function close() {
    box.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  box.addEventListener("click", function (e) {
    if (e.target === box || e.target.classList.contains("lightbox-close") || e.target === big) close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && box.classList.contains("open")) close();
  });
  targets.forEach(function (img) {
    img.classList.add("zoomable");
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Expand image: " + (img.alt || "photo"));
    function open() {
      lastFocus = img;
      big.src = img.currentSrc || img.src;
      big.alt = img.alt || "";
      cap.textContent = img.alt || "";
      box.classList.add("open");
      document.body.style.overflow = "hidden";
      box.querySelector(".lightbox-close").focus();
    }
    img.addEventListener("click", open);
    img.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
})();

// Interactive floor plan tabs on /rates-floor-plans/.
(function () {
  var tabs = document.querySelectorAll(".fp-tabs button");
  if (!tabs.length) return;
  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabs.forEach(function (b) {
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      document.querySelectorAll(".fp-panel").forEach(function (p) {
        if (p.id === "fp-" + btn.dataset.fp) p.removeAttribute("hidden");
        else p.setAttribute("hidden", "");
      });
    });
  });
})();

// Respite booking calendar — pick check-in and check-out like a stay request.
(function () {
  var root = document.getElementById("book-cal");
  if (!root) return;
  var MIN_NIGHTS = 5;
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var WDS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  var today = new Date(); today.setHours(0,0,0,0);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var maxView = new Date(today.getFullYear(), today.getMonth() + 11, 1);
  var start = null, end = null;
  var fmt = function (d) {
    return MONTHS[d.getMonth()].slice(0,3) + " " + d.getDate() + ", " + d.getFullYear();
  };
  var iso = function (d) {
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  };
  function monthHTML(base, first) {
    var y = base.getFullYear(), m = base.getMonth();
    var firstDow = new Date(y, m, 1).getDay();
    var days = new Date(y, m + 1, 0).getDate();
    var h = '<div class="bc-month"><div class="bc-head">';
    if (first) h += '<button type="button" class="bc-nav" data-nav="-1" aria-label="Previous month">‹</button>';
    h += '<span class="bc-title">' + MONTHS[m] + " " + y + "</span>";
    if (first) h += '<button type="button" class="bc-nav" data-nav="1" aria-label="Next month">›</button>';
    else h += "<span></span>";
    h += '</div><div class="bc-grid">';
    WDS.forEach(function (w) { h += '<span class="bc-wd">' + w + "</span>"; });
    for (var i = 0; i < firstDow; i++) h += "<span></span>";
    for (var d = 1; d <= days; d++) {
      var dt = new Date(y, m, d);
      var cls = [];
      var dis = dt < today ? " disabled" : "";
      if (start && !end && dt.getTime() === start.getTime()) cls.push("sel", "only");
      if (start && end) {
        if (dt.getTime() === start.getTime()) cls.push("sel", "start");
        else if (dt.getTime() === end.getTime()) cls.push("sel", "end");
        else if (dt > start && dt < end) cls.push("in-range");
      }
      h += '<button type="button" class="bc-day' + (cls.length ? " " + cls.join(" ") : "") + '" data-date="' + iso(dt) + '"' + dis + ">" + d + "</button>";
    }
    h += "</div></div>";
    return h;
  }
  function render() {
    var second = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    root.innerHTML = '<div class="bc-months">' + monthHTML(view, true) + monthHTML(second, false) + "</div>";
    var prev = root.querySelector('[data-nav="-1"]');
    if (prev) prev.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    var next = root.querySelector('[data-nav="1"]');
    if (next) next.disabled = view >= maxView;
    update();
  }
  function update() {
    var inEl = document.getElementById("bk-checkin");
    var outEl = document.getElementById("bk-checkout");
    var nEl = document.getElementById("bk-nights");
    var sIn = document.getElementById("bks-in"), sOut = document.getElementById("bks-out"), sN = document.getElementById("bks-n");
    var btn = document.getElementById("bk-submit");
    var hint = document.getElementById("bk-hint");
    var nights = start && end ? Math.round((end - start) / 86400000) : 0;
    if (inEl) inEl.value = start ? iso(start) : "";
    if (outEl) outEl.value = end ? iso(end) : "";
    if (nEl) nEl.value = nights || "";
    if (sIn) sIn.textContent = start ? fmt(start) : "—";
    if (sOut) sOut.textContent = end ? fmt(end) : "—";
    if (sN) sN.textContent = nights ? nights + " nights" : "—";
    if (btn) btn.disabled = !(start && end);
    if (hint) {
      if (!start) hint.textContent = "Select your check-in date.";
      else if (!end) hint.textContent = "Now select a check-out date at least " + MIN_NIGHTS + " nights later.";
      else hint.textContent = "Dates look good — fill in your details below and send the request.";
    }
  }
  root.addEventListener("click", function (e) {
    var nav = e.target.closest(".bc-nav");
    if (nav) {
      view = new Date(view.getFullYear(), view.getMonth() + parseInt(nav.dataset.nav, 10), 1);
      render();
      return;
    }
    var day = e.target.closest(".bc-day");
    if (!day || day.disabled) return;
    var parts = day.dataset.date.split("-");
    var dt = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    if (!start || end) { start = dt; end = null; }
    else if (dt.getTime() === start.getTime()) { start = null; }
    else if (dt < start) { start = dt; }
    else {
      var nights = Math.round((dt - start) / 86400000);
      if (nights < MIN_NIGHTS) {
        start = dt; end = null;
        var hint = document.getElementById("bk-hint");
        render();
        if (hint) hint.textContent = "Respite stays start at " + MIN_NIGHTS + " nights — check-in moved to the date you tapped; now pick a check-out at least " + MIN_NIGHTS + " nights later.";
        return;
      }
      end = dt;
    }
    render();
  });
  var form = document.getElementById("bk-form");
  if (form) form.addEventListener("submit", function (e) {
    if (!start || !end) {
      e.preventDefault();
      var hint = document.getElementById("bk-hint");
      if (hint) hint.textContent = "Please select your dates on the calendar first.";
      root.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (typeof gtag === "function") {
      gtag("event", "respite_booking_request", { event_category: "engagement" });
    }
  });
  render();
})();

// Reservation wizard on /rates-floor-plans/#reserve.
(function () {
  var root = document.getElementById("reserve");
  if (!root) return;
  var state = { stay: null, type: "", price: "", apply: "" };
  function show(step) {
    [1, 2, 3].forEach(function (n) {
      var pane = document.getElementById("wiz-" + n);
      if (pane) { if (n === step) pane.removeAttribute("hidden"); else pane.setAttribute("hidden", ""); }
      var dot = root.querySelector('[data-step-dot="' + n + '"]');
      if (dot) dot.classList.toggle("on", n <= step);
    });
  }
  root.querySelectorAll("[data-pick-stay]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.stay = btn.dataset.pickStay;
      var any = false;
      root.querySelectorAll("#wiz-2 .wiz-card").forEach(function (c) {
        var match = c.dataset.stay === state.stay;
        c.style.display = match ? "" : "none";
        if (match) any = true;
      });
      show(2);
      if (!any) {
        document.getElementById("wiz-2").insertAdjacentHTML("afterbegin",
          '<p class="center">Every suite of this kind is spoken for right now &mdash; <a href="/contact-us/?interest=apply">join the waitlist</a> or call (901) 247-5835.</p>');
      }
      if (typeof gtag === "function") gtag("event", "reserve_step", { event_label: "stay_" + state.stay });
    });
  });
  root.addEventListener("click", function (e) {
    var card = e.target.closest("#wiz-2 .wiz-card");
    if (card) {
      state.type = card.dataset.type; state.price = card.dataset.price; state.apply = card.dataset.apply;
      if (state.stay === "respite") { window.location.href = card.dataset.apply; return; }
      document.getElementById("wiz-sum-type").textContent = state.type;
      document.getElementById("wiz-sum-price").textContent = state.price;
      document.getElementById("wiz-checkout").href = state.apply;
      show(3);
      if (typeof gtag === "function") gtag("event", "reserve_step", { event_label: "suite_" + state.type });
      return;
    }
    var back = e.target.closest("[data-wiz-back]");
    if (back) show(parseInt(back.dataset.wizBack, 10));
  });
})();
