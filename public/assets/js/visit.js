// Book Your Visit (/visit/): pick a day and time in three taps.
// Email links add ?r=<lead id>&n=<first name>, so a known family never retypes
// their name or phone. Without r, the page also asks for name and phone.
// Bookings go to the website's lead workflow, which alerts the team and logs
// the visit on the family's lead. Since 2026-11-20 a marked backup copy also goes to
// FormSubmit, and FormSubmit is the fallback when the workflow cannot be reached: the
// workflow's hook answers "success" even when it accepts a booking and then holds it.
(function () {
  "use strict";
  var HOOK = "https://hooks.zapier.com/hooks/catch/27563206/EsZUwGqBy3rIA0Lc/";
  var FS_AJAX = ["https://formsubmit.co/ajax/", "mechuz", "@", "medhcp.com"].join("");
  var FS_TEAM = "mechuz@kirbygateliving.com,community@kirbygateliving.com,reception@kirbygateliving.com,info@kirbygateliving.com";
  var TRACKER = "https://airtable.com/appZ2xOP1HzOWjug7/tbl4VEuo6ByyJAaXm/";
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

  function booked(name, label, at) {
    $("kv-form-wrap").hidden = true;
    $("kv-done").hidden = false;
    $("kv-done-title").textContent = (first || name.split(" ")[0] || "Thank you") + ", you're booked!";
    $("kv-done-text").textContent = "We'll see you " + (label || dayLabel) + " at " + (at || time) + ".";
    window.scrollTo(0, 0);
  }

  $("kv-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!day) { msg("Please pick a day."); return; }
    if (!time) { msg("Please pick a time."); return; }
    var name = leadId ? first : $("kv-name").value.trim();
    var phone = leadId ? "" : $("kv-phone").value.trim();
    if (!leadId) {
      // A name in any alphabet is welcome. The phone rule is the one the other forms and
      // the lead workflow use, so a mistyped number is fixed here instead of being dropped.
      if (!name) { msg("Please enter your name."); return; }
      var badPhone = window.kgSpam && window.kgSpam.badPhone ? window.kgSpam.badPhone(phone) : phone.replace(/\D/g, "").length < 10;
      if (badPhone) { msg("Please enter a 10-digit phone number so we can confirm."); return; }
    }
    // The day and time as they are now: the chips stay tappable while the booking is sent.
    var sDay = day, sLabel = dayLabel, sTime = time;
    // Spam filter (2026-11-11): bots fill the hidden honeypot fields, submit within
    // seconds of loading, or type links and spam words. They see the normal
    // confirmation, but nothing is sent. A family opening our email link (r=) can tap
    // through quickly, so for them a too-fast tap just asks them to tap again.
    var fast = Date.now() - loaded < 3000;
    if (fast && leadId) { msg("Please check your day and time, then tap Book my visit again."); loaded = Date.now() - 3000; return; }
    var bot = $("kv-hp").value || ($("kv-hp2") && $("kv-hp2").value) ? "honeypot" : (fast ? "fast" : "");
    if (!bot && window.kgSpam) bot = window.kgSpam.check(name, name);
    if (bot) {
      if (typeof gtag === "function") gtag("event", "lead_screened_out", { event_category: "lead", reason: bot, form: "visit" });
      booked(name, sLabel, sTime);
      return;
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
    body.set("visit_date", sDay);
    body.set("visit_time", sTime);
    body.set("page", location.pathname);
    ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) { if (q.get(k)) body.set(k, q.get(k)); });
    body.set("hp", $("kv-hp").value);
    body.set("el", String(Date.now() - loaded));
    // The same booking for FormSubmit. A name counts as a test exactly as in the lead
    // workflow (letters only, then "test" as the first word): tests reach ownership only.
    function fsBooking(mark) {
      var test = /^test\b/i.test(name.trim().replace(/[^A-Za-z .'-]/g, ""));
      var f = new FormData();
      f.set("_subject", (test ? "TEST (ignore) \u2014 " : "") + "TOUR BOOKED \u2014 " + sLabel + " at " + sTime + " \u2014 " + (name || "A family") + mark);
      if (!test) f.set("_cc", FS_TEAM);
      f.set("_template", "table");
      f.set("_captcha", "false");
      f.set("_honey", "");
      f.set("name", name || "(a family from our emails)");
      if (phone) f.set("phone", phone);
      f.set("visit_date", sDay);
      f.set("visit_time", sTime);
      if (leadId) f.set("lead_in_tracker", TRACKER + leadId);
      f.set("page", location.pathname);
      f.set("please", "Call to confirm and add it to the calendar.");
      return f;
    }
    var started = Date.now();
    var settled = false;
    // zap: "pending" until the workflow's hook answers, then "ok" or "bad".
    // fsFail: set when the FormSubmit fallback failed while the hook had not answered yet.
    var zap = "pending", fsFail = false, t3 = null;
    function done(via) {
      if (settled) return; settled = true;
      clearTimeout(t3);
      if (typeof gtag === "function") {
        gtag("event", "generate_lead", { event_category: "lead", lead_source: "visit_booking" });
        // Google Ads conversion "Tour booking (/visit/ page)" (ID 7898949491), added 2026-11-11.
        gtag("event", "conversion", { send_to: "AW-18300279647/YoG6CPPOwbYdEN-2oJZE" });
        if (via !== "zapier") gtag("event", "lead_sent_backup", { event_category: "lead", via: via, form: "visit" });
      }
      booked(name, sLabel, sTime);
    }
    function fail() {
      if (settled) return; settled = true;
      clearTimeout(t3);
      btn.disabled = false;
      btn.textContent = "Book my visit";
      msg("Sorry, that didn't go through. Please call or text (901) 247-5835 and we'll book it for you.");
      if (typeof gtag === "function") gtag("event", "lead_send_failed", { event_category: "lead", reason: "visit", form: "visit" });
    }
    // The fallback failed. If the hook has not answered yet it may still take the booking,
    // so wait for it (never past 22 seconds from the start) before showing the error.
    function fsFailed() {
      if (settled) return;
      if (zap !== "pending") { fail(); return; }
      fsFail = true;
      clearTimeout(t3);
      t3 = setTimeout(fail, Math.max(22000 - (Date.now() - started), 0));
    }
    var tried = false;
    function fallback(why) {
      if (settled || tried) return; tried = true;
      if (typeof gtag === "function") gtag("event", "lead_primary_failed", { event_category: "lead", reason: why, form: "visit" });
      var t2 = setTimeout(fsFailed, 12000);
      var fsBody;
      try { fsBody = fsBooking(" (sent by website)"); } catch (err) { clearTimeout(t2); fsFailed(); return; }
      fetch(FS_AJAX, { method: "POST", body: fsBody, headers: { Accept: "application/json" } })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, j: j }; });
        }).then(function (r) {
          clearTimeout(t2);
          if (r.ok && String(r.j.success) === "true") done("formsubmit"); else fsFailed();
        }).catch(function () { clearTimeout(t2); fsFailed(); });
    }
    var t1 = setTimeout(function () { fallback("timeout"); }, 10000);
    function zapBad(why) {
      clearTimeout(t1);
      zap = "bad";
      if (fsFail) fail(); else fallback(why);
    }
    fetch(HOOK, { method: "POST", body: body }).then(function (r) {
      if (!r.ok) { zapBad("status_" + r.status); return; }
      clearTimeout(t1);
      zap = "ok";
      if (settled) return;
      // During a hold this copy is the only notice the team gets, so its subject says so.
      if (!tried) {
        try {
          fetch(FS_AJAX, { method: "POST", body: fsBooking(" (website copy: act on it if no other email came for this booking)"), headers: { Accept: "application/json" }, keepalive: true }).catch(function () {});
        } catch (err) {}
      }
      done("zapier");
    }, function () { zapBad("network"); });
  });
})();
