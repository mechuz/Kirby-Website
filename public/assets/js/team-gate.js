// Team Login: decrypts the staff page in the browser after a correct sign-in.
// The page content is AES-256-GCM ciphertext built by scripts/team-gate.mjs;
// nothing readable is published until the right username and password are given.
(function () {
  "use strict";
  var dataEl = document.getElementById("kg-gate-data");
  var form = document.getElementById("kg-gate-form");
  if (!dataEl || !form) return;

  var gate = document.getElementById("kg-gate");
  var team = document.getElementById("kg-team");
  var fields = document.getElementById("kg-gate-fields");
  var userEl = document.getElementById("kg-user");
  var passEl = document.getElementById("kg-pass");
  var rememberEl = document.getElementById("kg-remember");
  var submitEl = document.getElementById("kg-submit");
  var msgEl = document.getElementById("kg-gate-msg");

  function msg(t) { msgEl.textContent = t || ""; }

  var D;
  try { D = JSON.parse(dataEl.textContent); } catch (e) { msg("This page did not load correctly. Refresh and try again."); return; }
  var subtle = window.crypto && window.crypto.subtle;
  if (!subtle || !window.TextEncoder) {
    msg("This browser can't open the secure page. Please use an up-to-date Chrome, Safari or Edge.");
    return;
  }

  var STORE = "kg_team_" + D.id;
  function store(get, val) {
    try {
      if (get) return window.localStorage.getItem(STORE);
      if (val === null) window.localStorage.removeItem(STORE);
      else window.localStorage.setItem(STORE, val);
    } catch (e) { /* private mode or storage blocked: stay signed in for this visit only */ }
    return null;
  }
  // Forget keys from older versions of this page.
  try {
    for (var i = window.localStorage.length - 1; i >= 0; i--) {
      var k = window.localStorage.key(i);
      if (k && k.indexOf("kg_team_") === 0 && k !== STORE) window.localStorage.removeItem(k);
    }
  } catch (e) {}

  function b64d(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function b64e(u) { var s = ""; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  // Must match scripts/team-gate.mjs. Passwords ignore case, spaces and dashes.
  function normUser(u) { return String(u).trim().toLowerCase(); }
  function normPass(p) { return String(p).toUpperCase().replace(/[^A-Z0-9]/g, ""); }

  function openWith(raw) {
    return subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]).then(function (key) {
      return subtle.decrypt({ name: "AES-GCM", iv: b64d(D.iv) }, key, b64d(D.ct));
    }).then(function (pt) {
      team.innerHTML = new TextDecoder().decode(pt);
      gate.hidden = true;
      team.hidden = false;
      var out = document.getElementById("kg-signout");
      if (out) out.addEventListener("click", function () {
        store(false, null);
        team.innerHTML = "";
        location.replace(location.pathname);
      });
    });
  }

  function tryKeys(kek, idx) {
    if (idx >= D.keys.length) return Promise.reject(new Error("no match"));
    var e = D.keys[idx];
    return subtle.decrypt({ name: "AES-GCM", iv: b64d(e.iv) }, kek, b64d(e.ct)).then(
      function (raw) { return new Uint8Array(raw); },
      function () { return tryKeys(kek, idx + 1); }
    );
  }

  var fails = 0;
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var u = normUser(userEl.value), p = normPass(passEl.value);
    if (!u || !p) { msg("Enter your username and password."); return; }
    fields.disabled = true;
    submitEl.textContent = "Checking…";
    msg("");
    var enc = new TextEncoder();
    subtle.importKey("raw", enc.encode(u + "\n" + p), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return subtle.deriveKey({ name: "PBKDF2", salt: b64d(D.salt), iterations: D.iter, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    }).then(function (kek) {
      return tryKeys(kek, 0);
    }).then(function (raw) {
      passEl.value = "";
      if (rememberEl.checked) store(false, b64e(raw));
      return openWith(raw);
    }).catch(function () {
      fails++;
      passEl.value = "";
      var wait = fails >= 3 ? Math.min(30, (fails - 2) * 5) : 0;
      msg(wait ? "That username or password is not right. Try again in " + wait + " seconds, or ask ownership."
               : "That username or password is not right. Try again, or ask ownership.");
      setTimeout(function () {
        fields.disabled = false;
        submitEl.textContent = "Sign in";
        passEl.focus();
      }, wait * 1000);
    });
  });

  var saved = store(true);
  if (saved) {
    var raw;
    try { raw = b64d(saved); } catch (e) { raw = null; }
    if (raw) {
      openWith(raw).catch(function () { store(false, null); fields.disabled = false; });
      return;
    }
    store(false, null);
  }
  fields.disabled = false;
})();
