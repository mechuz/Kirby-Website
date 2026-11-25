// Daily Rounds DEMO backend (kirbygateliving.com/rounds/demo/).
// Stands in for the Supabase client the real app uses, so the demo runs the
// real app code with sample data that lives only in this browser
// (localStorage). Nothing here talks to a server or touches real records.
(function () {
  "use strict";
  window.KG_SURVEY = { url: "demo", anonKey: "demo", demo: true };

  var DB_KEY = "kg-rounds-demo-db-v2", AUTH_KEY = "kg-rounds-demo-auth", OUT_KEY = "kg-rounds-demo-signedout";
  var TZ = "America/Chicago";
  var ITEMS = { nursing: 23, activities: 1, dietary: 14, maint: 28, admin: 37 };
  var USERS = {
    "partner@staff.kirbygateliving.com": { pw: "demo", id: "demo-partner", username: "partner", name: "Partner (demo)", role: "admin", depts: [] },
    "don@staff.kirbygateliving.com": { pw: "demo", id: "demo-don", username: "don", name: "Director of Nursing (demo)", role: "director", depts: ["nursing"] },
    "dietary@staff.kirbygateliving.com": { pw: "demo", id: "demo-dietary", username: "dietary", name: "Dietary Director (demo)", role: "director", depts: ["dietary"] }
  };

  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  var fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  function today() { return fmt.format(new Date()); }
  function addDays(s, n) { var p = s.split("-").map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10); }
  // UTC timestamp for a Central-time clock reading on a given date
  function centralISO(day, h, m) {
    var p = day.split("-").map(Number), t = Date.UTC(p[0], p[1] - 1, p[2], h + 6, m);
    var shown = +new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(new Date(t));
    return new Date(t - (shown - h) * 3600000).toISOString();
  }
  var seed = 20261125;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

  function makeSample() {
    var db = { checks: {}, actions: {}, audits: {} }, t = today();
    var who = { nursing: "DON (sample)", activities: "Activities Director (sample)", dietary: "Dietary Director (sample)", maint: "Maintenance Director (sample)", admin: "Administrator (sample)" };
    for (var back = 13; back >= 0; back--) {
      var d = addDays(t, -back);
      Object.keys(ITEMS).forEach(function (dept, di) {
        if (back === 0 && (dept === "admin" || dept === "activities")) return;           // not started yet today
        var marks = {}, n = ITEMS[dept], upto = (back === 0 && dept === "maint") ? 17 : n; // in progress today
        for (var i = 1; i <= upto; i++) { var r = rnd(); marks[i] = r < 0.05 ? "NC" : r < 0.12 ? "NA" : "C"; }
        var doc = { date: d, dept: dept, marks: marks, reviewer: who[dept], updatedAt: centralISO(d, 13, 0) };
        if (upto === n) {
          var late = rnd() < 0.15, hh = late ? 14 : 13, mm = late ? 35 + Math.floor(rnd() * 20) : 10 + Math.floor(rnd() * 45);
          doc.submitted = true; doc.submittedAt = centralISO(d, hh, mm); doc.signature = who[dept]; doc.urgentEscalated = "N/A";
        }
        db.checks[d + "_" + dept] = { id: d + "_" + dept, dept: dept, day: d, data: doc };
      });
    }
    function act(id, dept, day, item, text, deficiency, corrective, responsible, target, status, urgent) {
      db.actions[id] = { id: id, dept: dept, day: day, data: { dept: dept, date: day, item: item, itemText: text, deficiency: deficiency, safety: urgent ? "Door closed and staff posted until repaired" : "", corrective: corrective, responsible: responsible, targetDate: target, status: status, urgent: !!urgent, createdAt: centralISO(day, 11, 20), source: "checklist" } };
      db.checks[day + "_" + dept] && (db.checks[day + "_" + dept].data.marks[item] = "NC");
    }
    act("a1", "maint", t, 2, "Fire/smoke doors unobstructed and functioning; not improperly propped open.", "Courtyard fire door found propped open with a wedge (sample)", "Remove wedge, install magnetic hold-open tied to alarm", "Maintenance Director", addDays(t, 2), "In Progress", true);
    act("a2", "dietary", addDays(t, -4), 5, "Refrigerator and freezer temperatures documented; excursions addressed.", "Walk-in freezer log missing two evening readings (sample)", "Re-train evening cook; add log check to closing duties", "Dietary Director", addDays(t, -1), "Open", false);
    act("a3", "nursing", addDays(t, -6), 6, "Skin findings, treatments, and overdue weekly skin assessments reviewed.", "Two weekly skin assessments overdue, Rooms 112 and 118 (sample)", "Complete assessments; add weekly reminder to shift report", "DON", addDays(t, -3), "Closed", false);
    db.actions.a3.data.verifiedBy = "Administrator (sample)"; db.actions.a3.data.actualDate = addDays(t, -4);
    act("a4", "admin", addDays(t, -2), 7, "Resident/family concerns assigned and tracked.", "Family concern from Room 204 not logged in the grievance binder (sample)", "Log concern, assign owner, call family back", "Administrator", addDays(t, 1), "Open", false);
    var wk = function (d) { return d; };
    db.audits["mo-maint_" + t.slice(0, 7)] = { id: "mo-maint_" + t.slice(0, 7), dept: "maint", day: addDays(t, -9), data: { audit: "mo-maint", period: t.slice(0, 7), dept: "maint", doneBy: "Maintenance Director (sample)", result: "No issues", note: "Fire drill, all shifts", doneAt: centralISO(addDays(t, -9), 10, 5), doneDate: addDays(t, -9) } };
    db.audits["shift-med_" + t + "-D"] = { id: "shift-med_" + t + "-D", dept: "nursing", day: t, data: { audit: "shift-med", period: t + "-D", dept: "nursing", doneBy: "Charge nurse (sample)", result: "No issues", note: "", doneAt: centralISO(t, 14, 40), doneDate: t } };
    return db;
  }

  var db = ls(DB_KEY);
  if (!db || db.seededFor !== today()) { db = makeSample(); db.seededFor = today(); ls(DB_KEY, db); }
  function persist() { ls(DB_KEY, db); }

  var session = ls(AUTH_KEY);
  if (!session && !ls(OUT_KEY)) { session = { access_token: "demo", user: { id: "demo-partner" } }; ls(AUTH_KEY, session); }
  function me() { if (!session) return null; for (var k in USERS) if (USERS[k].id === session.user.id) return USERS[k]; return null; }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function merge(t, p) { t = (t && typeof t === "object") ? t : {}; Object.keys(p).forEach(function (k) { var v = p[k]; if (v === null) delete t[k]; else if (v && typeof v === "object" && !Array.isArray(v) && t[k] && typeof t[k] === "object") t[k] = merge(t[k], v); else t[k] = clone(v); }); return t; }
  function err(code, message) { return { data: null, error: { code: code, message: message } }; }

  function saveDoc(a) {
    var u = me(); if (!u) return err("28000", "Not signed in");
    var table = a.p_table, id = a.p_id, patch = clone(a.p_patch), cur = db[table] && db[table][id];
    if (!db[table]) return err("22023", "Unknown table");
    var dept = cur ? cur.dept : patch.dept;
    if (u.role === "director" && u.depts.indexOf(dept) < 0) return err("42501", "Your account cannot change this department");
    ["updatedAt", "updatedBy", "submittedAt", "submittedBy", "createdAt", "createdBy", "doneAt", "closedAt"].forEach(function (k) { delete patch[k]; });
    var stamp = new Date().toISOString(); patch.updatedAt = stamp; patch.updatedBy = u.id;
    if (table === "checks") {
      if (cur && cur.data.submitted && !("submitted" in patch)) return err("55000", "This checklist is already submitted. Reopen it to make changes.");
      if (patch.submitted === true) { patch.submittedAt = stamp; patch.submittedBy = u.id; }
    } else if (table === "actions") {
      if (!cur) { patch.createdAt = stamp; patch.createdBy = u.id; }
      if (patch.status === "Closed" && (!cur || cur.data.status !== "Closed")) patch.closedAt = stamp;
    } else if (table === "audits") {
      if (cur) return err("55000", "This audit is already logged");
      patch.doneAt = stamp; patch.doneDate = today();
    }
    var data = merge(cur ? clone(cur.data) : {}, patch);
    db[table][id] = { id: id, dept: dept, day: data.date || data.doneDate, data: data };
    persist();
    return { data: data, error: null };
  }

  function query(table) {
    var filters = [], lim = 1000, ord = null;
    var q = {
      select: function () { return q; },
      gte: function (c, v) { filters.push(function (r) { return String(r[c] || "") >= v; }); return q; },
      lte: function (c, v) { filters.push(function (r) { return String(r[c] || "") <= v; }); return q; },
      order: function (c, o) { ord = [c, o && o.ascending === false ? -1 : 1]; return q; },
      limit: function (n) { lim = n; return q; },
      then: function (res, rej) {
        var out;
        if (!me()) out = err("42501", "permission denied");
        else if (table === "staff") out = { data: Object.keys(USERS).map(function (k) { return { user_id: USERS[k].id, full_name: USERS[k].name }; }), error: null };
        else {
          var rows = Object.keys(db[table] || {}).map(function (k) { return db[table][k]; }).filter(function (r) { return filters.every(function (f) { return f(r); }); });
          if (ord) rows.sort(function (a, b) { return String(a[ord[0]]).localeCompare(String(b[ord[0]])) * ord[1]; });
          out = { data: clone(rows.slice(0, lim)), error: null };
        }
        return Promise.resolve(out).then(res, rej);
      }
    };
    return q;
  }

  var listeners = [];
  function emit(ev) { listeners.forEach(function (fn) { try { fn(ev, session); } catch (e) {} }); }
  window.supabase = {
    createClient: function () {
      return {
        auth: {
          getSession: function () { return Promise.resolve({ data: { session: session } }); },
          onAuthStateChange: function (fn) { listeners.push(fn); return { data: { subscription: { unsubscribe: function () {} } } }; },
          signInWithPassword: function (c) {
            var u = USERS[c.email];
            if (!u || u.pw !== c.password) return Promise.resolve({ data: {}, error: { message: "Invalid login credentials", status: 400 } });
            session = { access_token: "demo", user: { id: u.id } }; ls(AUTH_KEY, session); ls(OUT_KEY, null); emit("SIGNED_IN");
            return Promise.resolve({ data: { session: session }, error: null });
          },
          updateUser: function () { return Promise.resolve({ data: {}, error: null }); },
          refreshSession: function () { return Promise.resolve(session ? { data: { session: session }, error: null } : { error: { message: "no session" } }); },
          signOut: function () { session = null; ls(AUTH_KEY, null); ls(OUT_KEY, true); emit("SIGNED_OUT"); return Promise.resolve({ error: null }); }
        },
        rpc: function (name, args) {
          var u = me();
          if (name === "my_profile") return Promise.resolve({ data: u ? { id: u.id, username: u.username, name: u.name, role: u.role, depts: u.depts, mustChangePassword: false } : null, error: null });
          if (name === "password_changed") return Promise.resolve({ data: null, error: null });
          if (name === "save_doc") return Promise.resolve(saveDoc(args));
          return Promise.resolve(err("22023", "Unknown function"));
        },
        from: query,
        channel: function () { var c = { on: function () { return c; }, subscribe: function () { return c; } }; return c; }
      };
    }
  };
  window.KG_DEMO_RESET = function () { ls(DB_KEY, null); ls(AUTH_KEY, null); ls(OUT_KEY, null); location.replace("/rounds/demo/"); };
})();
