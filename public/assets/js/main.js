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
  var map = { "memory-care": "Memory Care", "assisted-living": "Assisted Living", "tour": "Scheduling a Tour", "rates": "Rates & Availability" };
  if (map[v]) sel.value = map[v];
})();
