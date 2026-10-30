// The Pointe at Kirby Gate — "Ask us" chat assistant.
// Answers common questions from the facts published on this site (no AI service,
// nothing sent anywhere until a visitor chooses to leave their number), and points
// every conversation toward reserving a suite, booking a tour or a callback.
// Callback requests post to FormSubmit like the contact form, so they arrive as
// form leads and land on /thank-you/ (one Google Ads form conversion).
(function () {
  if (window.kgChat) return;
  window.kgChat = true;

  var MAIN = '<a href="tel:9017533449" data-track="phone">(901) 753-3449</a>';
  var RESV = '<a href="tel:9012475835" data-track="phone">(901) 247-5835</a>';
  var RESERVE = { label: "Reserve a suite", href: "/reserve/" };
  var TOUR = { label: "Schedule a tour", href: "/contact-us/" };
  var CALLBACK = { label: "Have someone call me", action: "callback" };

  // Each entry: words that suggest the topic, the answer, and follow-up buttons.
  var KB = [
    { k: ["price", "cost", "rate", "rates", "how much", "fee", "fees", "expensive", "afford", "monthly", "pricing", "charge"],
      a: 'Our current rates are published on our <a href="/rates-floor-plans/">Rates &amp; Floor Plans</a> page. One monthly rate covers your suite, meals, housekeeping, activities and 24-hour care access, and memory care is all-inclusive of care.',
      b: [RESERVE, TOUR] },
    { k: ["medicaid", "tenncare", "choices", "insurance", "long-term care insurance", "ltc", " va ", "veteran", "aid and attendance", "pay for", "private pay", "accept"],
      a: 'The Pointe is a private-pay community. We do not bill or accept payment from Medicaid, TennCare, VA or insurance companies; families pay the community directly. Our guide to <a href="/paying-for-senior-living/">paying for senior living</a> explains the options families commonly look into.',
      b: [TOUR, CALLBACK] },
    { k: ["medicare"],
      a: 'Medicare does not pay for room and board or custodial care in assisted living. It still covers doctor visits, therapy and prescriptions. More in our guide to <a href="/paying-for-senior-living/">paying for senior living</a>. The Pointe is private pay.',
      b: [TOUR, CALLBACK] },
    { k: ["available", "availability", "opening", "openings", "vacancy", "vacancies", "room open", "space", "waitlist", "waiting list"],
      a: 'You can see the suites open today on our <a href="/reserve/">Reserve</a> page; it updates automatically as suites are leased. Availability changes, so for today&rsquo;s openings call reservations at ' + RESV + '. Companion suites currently have a waiting list.',
      b: [RESERVE, CALLBACK] },
    { k: ["reserve", "reservation", "apply", "application", "deposit", "sign up", "hold a", "move in", "move-in", "lease"],
      a: 'You can reserve online in three steps: choose the type of care, pick a suite open today, then complete the application in our secure resident portal. A deposit holds the suite, and residency is confirmed after a nurse health assessment and a signed residency agreement.',
      b: [RESERVE, CALLBACK] },
    { k: ["tour", "visit us", "see the", "come by", "stop by", "look around", "appointment", "lunch"],
      a: 'Private tours are available daily by appointment, and you are welcome to stay for lunch. Book online or call ' + MAIN + '.',
      b: [TOUR, CALLBACK] },
    { k: ["memory", "dementia", "alzheimer", "alzheimers", "confused", "wander", "forget"],
      a: 'Our dedicated <a href="/memory-care/">memory care</a> neighborhood is secured for safety, with dementia-trained caregivers, familiar daily routines and a renovated private suite for each resident. Assisted living and memory care are under one roof, so a move between them stays close to home.',
      b: [RESERVE, TOUR] },
    { k: ["assisted living", "help with", "bathing", "dressing", "daily living", "personal care", "independent"],
      a: '<a href="/assisted-living/">Assisted living</a> here is for seniors who want their independence plus daily support: medications managed, help with personal care when needed, and a care team on site 24 hours a day.',
      b: [RESERVE, TOUR] },
    { k: ["respite", "short term", "short-term", "short stay", "temporary", "trial", "after surgery", "after a hospital", "recover", "caregiver break", "vacation"],
      a: '<a href="/respite-care/">Respite stays</a> run from a 5-night minimum up to about 30 days (longer by arrangement) in a furnished suite, with meals, housekeeping and 24-hour care. They are billed by the day with no long-term contract, and a short nurse assessment comes first.',
      b: [{ label: "Pick respite dates", href: "/respite-care/#book" }, CALLBACK] },
    { k: ["assessment", "qualify", "eligible", "eligibility", "approved", "approval", "requirements", "accept my"],
      a: 'Before anyone is approved for residency or a respite stay, they complete a health assessment with our nursing team. Approval is based on that assessment and a signed residency agreement.',
      b: [CALLBACK, TOUR] },
    { k: ["nursing home", "skilled nursing", "rehab", "hospital"],
      a: 'The Pointe is a licensed Assisted Care Living Facility in Tennessee offering assisted living, memory care and respite stays. It is not a nursing home or skilled nursing facility.',
      b: [TOUR, CALLBACK] },
    { k: ["nurse", "staff", "24 hour", "24-hour", "caregiver", "medication", "medications", "pills", "care team"],
      a: 'Our care team is on site 24 hours a day. Medications are managed and administered on schedule, and each resident has a personalized care plan that is reviewed regularly.',
      b: [TOUR, CALLBACK] },
    { k: ["food", "meal", "meals", "dining", "eat", "menu", "diet", "diabetic", "kosher", "chef"],
      a: 'Three chef-prepared meals a day are served restaurant-style in the dining room, plus snacks. Special diets such as diabetic, low-sodium and soft are handled by the kitchen. Meals are not kosher.',
      b: [TOUR, RESERVE] },
    { k: ["pet", "pets", "dog", "cat"],
      a: 'Pets are not permitted at The Pointe.',
      b: [TOUR, CALLBACK] },
    { k: ["visiting", "visit my", "visitors", "family visit", "visit hours", "visiting hours", "grandkids"],
      a: 'Families are welcome to visit, share a meal and join activities. Guest meals are available for visiting family, and there is resident and visitor parking.',
      b: [TOUR, CALLBACK] },
    { k: ["activity", "activities", "calendar", "events", "bingo", "music", "things to do", "outing", "outings", "church", "faith", "bible"],
      a: 'There is something on the <a href="/activities-calendar/">activities calendar</a> every day: live music, bingo and cards, chair fitness, devotionals and Bible study, arts and crafts, movies, celebrations and outings around Memphis. Joining in is always a choice.',
      b: [TOUR, RESERVE] },
    { k: ["transport", "transportation", "ride", "rides", "doctor appointment", "drive", "shuttle"],
      a: 'Complimentary transportation is provided to medical appointments, errands and group outings.',
      b: [TOUR, CALLBACK] },
    { k: ["laundry", "housekeeping", "clean", "wifi", "wi-fi", "utilities", "included", "amenities", "salon", "barber", "hair"],
      a: 'Housekeeping, linen and personal laundry, all utilities and Wi-Fi are included. There is also an on-site beauty salon and barber shop, a fireplace lounge and library, and 3.5 landscaped acres. See all <a href="/amenities/">amenities &amp; services</a>.',
      b: [TOUR, RESERVE] },
    { k: ["suite", "suites", "room", "rooms", "floor plan", "floor plans", "studio", "one bedroom", "one-bedroom", "size", "square feet", "couple", "couples", "husband", "wife"],
      a: 'We offer standard studios (298 sq ft), large studios (373 sq ft) and one-bedroom suites (431 sq ft), each with an accessible private bathroom; the one-bedroom is ideal for couples. Companion suites currently have a waiting list. See <a href="/rates-floor-plans/">floor plans</a>.',
      b: [RESERVE, TOUR] },
    { k: ["where", "address", "location", "located", "directions", "parking", "germantown", "east memphis"],
      a: 'We are at 6480 Quince Rd, Memphis, TN 38119, in an established East Memphis neighborhood minutes from the Baptist and Methodist medical campuses. <a href="https://www.google.com/maps/dir/?api=1&amp;destination=6480+Quince+Rd+Memphis+TN+38119" target="_blank" rel="noopener">Get directions</a>.',
      b: [TOUR, RESERVE] },
    { k: ["job", "jobs", "career", "careers", "hiring", "employment", "work there", "apply for a job", "vendor"],
      a: 'For employment, vendor and current-resident questions, please call our main line at ' + MAIN + '.',
      b: [] },
    { k: ["portal", "rent", "pay my", "resident account", "doorloop", "maintenance"],
      a: 'Current residents can sign in to the <a href="https://app.doorloop.com/tenant-portal/login" target="_blank" rel="noopener">Resident Portal</a>. For anything else, call ' + MAIN + '.',
      b: [] },
    { k: ["phone", "call", "number", "contact", "email", "talk to someone", "speak", "human", "person"],
      a: 'Main line (visits, tours and questions): ' + MAIN + '. Reservations only: ' + RESV + '. Email: <a href="mailto:community@kirbygateliving.com">community@kirbygateliving.com</a>.',
      b: [CALLBACK, TOUR] },
    { k: ["smoke", "smoking"],
      a: 'Please call ' + MAIN + ' and our team will go over community policies with you.',
      b: [CALLBACK] }
  ];

  var GREETING = 'Hi! I can answer questions about care, suites, availability, respite stays and life at The Pointe. What would you like to know?';
  var CHIPS = ["Pricing", "Availability", "Reserve a suite", "Memory care", "Respite stays", "Schedule a tour"];
  var FALLBACK = { a: 'I don&rsquo;t have a good answer for that one. Leave your number and our team will call you back, or call ' + MAIN + '.', b: [CALLBACK, TOUR] };

  function track(name, label) {
    if (typeof gtag === "function") gtag("event", name, { event_category: "chat", event_label: label || "" });
  }

  function find(text) {
    var t = " " + text.toLowerCase().replace(/[^a-z0-9' -]/g, " ") + " ";
    var best = null, score = 0;
    KB.forEach(function (e) {
      var s = 0;
      e.k.forEach(function (w) { if (t.indexOf(w.indexOf(" ") > -1 ? w : " " + w) > -1 || t.indexOf(w + " ") > -1) s += w.length; });
      if (s > score) { score = s; best = e; }
    });
    return best || FALLBACK;
  }

  var css = document.createElement("link");
  css.rel = "stylesheet"; css.href = "/assets/css/chat.css?v=1";
  document.head.appendChild(css);

  var launcher = document.createElement("button");
  launcher.type = "button"; launcher.className = "kgc-launch"; launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "kgc-panel");
  launcher.innerHTML = '<span aria-hidden="true">&#128172;</span> Questions? Ask us';

  var panel = document.createElement("section");
  panel.id = "kgc-panel"; panel.className = "kgc-panel"; panel.hidden = true;
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Ask The Pointe at Kirby Gate");
  panel.innerHTML =
    '<header class="kgc-head"><strong>Ask The Pointe</strong><button type="button" class="kgc-close" aria-label="Close chat">&times;</button></header>' +
    '<div class="kgc-log" aria-live="polite"></div>' +
    '<form class="kgc-input"><label class="kgc-sr" for="kgc-q">Your question</label>' +
    '<input id="kgc-q" type="text" autocomplete="off" placeholder="Type your question" maxlength="200">' +
    '<button type="submit">Send</button></form>' +
    '<p class="kgc-note">Automated answers from our website. For anything personal or medical, talk with our team.</p>';

  document.body.appendChild(launcher);
  document.body.appendChild(panel);
  var log = panel.querySelector(".kgc-log");
  var started = false;

  function bubble(html, who) {
    var d = document.createElement("div");
    d.className = "kgc-msg kgc-" + who;
    if (who === "user") d.textContent = html; else d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function buttons(list) {
    if (!list || !list.length) return;
    var row = document.createElement("div");
    row.className = "kgc-actions";
    list.forEach(function (b) {
      var el;
      if (b.href) {
        el = document.createElement("a"); el.href = b.href; el.className = "kgc-btn";
        el.addEventListener("click", function () { track("chat_cta", b.label); });
      } else {
        el = document.createElement("button"); el.type = "button"; el.className = "kgc-btn";
        el.addEventListener("click", function () { track("chat_cta", b.label); callbackForm(); });
      }
      el.textContent = b.label;
      row.appendChild(el);
    });
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function chips() {
    var row = document.createElement("div");
    row.className = "kgc-chips";
    CHIPS.forEach(function (c) {
      var el = document.createElement("button");
      el.type = "button"; el.className = "kgc-chip"; el.textContent = c;
      el.addEventListener("click", function () { ask(c); });
      row.appendChild(el);
    });
    log.appendChild(row);
  }

  function ask(q) {
    q = (q || "").trim();
    if (!q) return;
    bubble(q, "user");
    var hit = find(q === "Pricing" ? "price" : q);
    track("chat_question", hit === FALLBACK ? "unanswered" : hit.k[0]);
    setTimeout(function () { bubble(hit.a, "bot"); buttons(hit.b); }, 250);
  }

  function callbackForm() {
    if (log.querySelector(".kgc-form")) { log.querySelector(".kgc-form input").focus(); return; }
    bubble("Leave your name and number and our team will call you, usually the same day.", "bot");
    var f = document.createElement("form");
    f.className = "kgc-form"; f.method = "POST"; f.action = "https://formsubmit.co/mechuz@medhcp.com";
    f.innerHTML =
      '<input type="hidden" name="_cc" value="community@kirbygateliving.com,reception@kirbygateliving.com">' +
      '<input type="hidden" name="_subject" value="NEW LEAD — kirbygateliving.com chat callback">' +
      '<input type="hidden" name="_template" value="table">' +
      '<input type="hidden" name="_next" value="https://www.kirbygateliving.com/thank-you/">' +
      '<input type="hidden" name="_captcha" value="false">' +
      '<input type="text" name="_honey" class="kgc-sr" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<input type="hidden" name="page" value="' + location.pathname.replace(/"/g, "") + '">' +
      '<input type="hidden" name="chat_question" value="">' +
      '<label class="kgc-sr" for="kgc-name">Name</label><input id="kgc-name" name="name" required autocomplete="name" placeholder="Your name">' +
      '<label class="kgc-sr" for="kgc-phone">Phone</label><input id="kgc-phone" name="phone" type="tel" required autocomplete="tel" placeholder="Phone number">' +
      '<select name="interest" aria-label="Interested in"><option>Assisted Living</option><option>Memory Care</option><option>Respite Care (Short-Term Stay)</option><option>Rates &amp; Availability</option><option>Scheduling a Tour</option></select>' +
      '<button type="submit" class="kgc-btn">Request a call</button>';
    f.addEventListener("submit", function () {
      var qs = Array.prototype.map.call(log.querySelectorAll(".kgc-user"), function (n) { return n.textContent; });
      f.querySelector('[name="chat_question"]').value = qs.join(" | ").slice(0, 500);
      track("chat_callback_submit", location.pathname);
    });
    log.appendChild(f);
    log.scrollTop = log.scrollHeight;
    f.querySelector("#kgc-name").focus();
  }

  function open() {
    panel.hidden = false; launcher.setAttribute("aria-expanded", "true"); launcher.classList.add("kgc-open");
    if (!started) { started = true; bubble(GREETING, "bot"); chips(); track("chat_open", location.pathname); }
    setTimeout(function () { panel.querySelector("#kgc-q").focus(); }, 50);
  }
  function close() {
    panel.hidden = true; launcher.setAttribute("aria-expanded", "false"); launcher.classList.remove("kgc-open");
    launcher.focus();
  }

  launcher.addEventListener("click", function () { panel.hidden ? open() : close(); });
  panel.querySelector(".kgc-close").addEventListener("click", close);
  panel.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  panel.querySelector(".kgc-input").addEventListener("submit", function (e) {
    e.preventDefault();
    var i = panel.querySelector("#kgc-q");
    ask(i.value); i.value = "";
  });
})();
