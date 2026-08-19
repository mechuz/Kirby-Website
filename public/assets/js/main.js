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
