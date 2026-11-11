// Book Your Visit (/visit/): pick a day and time in three taps.
// Email links add ?r=<lead id>&n=<first name>, so a known family never retypes
// their name or phone. Without r, the page also asks for name and phone.
// Bookings go to the website's lead workflow, which alerts the team and logs
// the visit on the family's lead.
(function () {
  "use strict";
  var HOOK = "https://hooks.zapier.com/hooks/catch/27563206/EsZUwGqBy3rIA0Lc/";
  var TIMES = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];
  var CLOSED = { "2026-11-26": 1, "2026-12-25": 1, "2027-01-01": 1 }; // holidays: no tours
  var DAYS_AHEAD = 10;

  var q = new URLSearchParams(location.search);
  var leadId = /^rec[A-Za-z0-9]{14}$/.test(q.get("r") || "") ? q.get("r") : "";
  var first = (q.get("n") || "").replace(/[^A-Za-z .'-]/g, "").trim().slice(0, 30);
  var loaded = Date.now();
  var day = "", time = "";

  var $ = function (id) { return document.getElementById(id); };
  if (first) $("kv-title").textContent = first + ", book your visit";
  if (!leadId) $("kv-contact").hidden = false;

  function chip(label, value, group, onPick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "kv-chip";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", "false");
    b.textContent = label;
    b.addEventListener("click", function () {
      Array.prototype.forEach.call(group.children, function (c) {
        c.setAttribute("aria-checked", "false");
      });
      b.setAttribute("aria-checked", "true");
      onPick(value, label);
    });
    group.appendChild(b);
  }

  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  var dayLabel = "";
  var days = $("kv-days");
  var d = new Date();
  d.setHours(12, 0, 0, 0);
  var added = 0;
  for (var i = 1; added < DAYS_AHEAD && i < 30; i++) {
    var dd = new Date(d.getTime() + i * 864e5);
    if (CLOSED[iso(dd)]) continue;
    var label = dd.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    chip(label, iso(dd), days, function (v, l) { day = v; dayLabel = l; });
    added++;
  }
  var times = $("kv-times");
  TIMES.forEach(function (t) { chip(t, t, times, function (v) { time = v; }); });

  function msg(t) { $("kv-msg").textContent = t || ""; }

  $("kv-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!day) { msg("Please pick a day."); return; }
    if (!time) { msg("Please pick a time."); return; }
    var name = leadId ? first : $("kv-name").value.trim();
    var phone = leadId ? "" : $("kv-phone").value.trim();
    if (!leadId) {
      if (!name) { msg("Please enter your name."); return; }
      if (phone.replace(/\D/g, "").length < 10) { msg("Please enter a phone number so we can confirm."); return; }
    }
    var btn = $("kv-submit");
    btn.disabled = true;
    btn.textContent = "Booking…";
    msg("");
    var body = new URLSearchParams();
    body.set("kg_src", "kirbygateliving");
    body.set("kg_form", "visit_booking");
    body.set("source", "VISIT BOOKING");
    body.set("lead_id", leadId);
    body.set("name", name);
    body.set("phone", phone);
    body.set("visit_date", day);
    body.set("visit_time", time);
    body.set("page", location.pathname);
    ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) { if (q.get(k)) body.set(k, q.get(k)); });
    body.set("hp", $("kv-hp").value);
    body.set("el", String(Date.now() - loaded));
    fetch(HOOK, { method: "POST", body: body }).then(function (r) {
      if (!r.ok) throw new Error("status " + r.status);
      if (typeof gtag === "function") gtag("event", "generate_lead", { event_category: "lead", lead_source: "visit_booking" });
      $("kv-form-wrap").hidden = true;
      $("kv-done").hidden = false;
      $("kv-done-title").textContent = (first || name.split(" ")[0] || "Thank you") + ", you're booked!";
      $("kv-done-text").textContent = "We'll see you " + dayLabel + " at " + time + ".";
      window.scrollTo(0, 0);
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = "Book my visit";
      msg("Sorry, that didn't go through. Please call or text (901) 247-5835 and we'll book it for you.");
    });
  });
})();
