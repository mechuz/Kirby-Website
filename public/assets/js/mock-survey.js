"use strict";
/* Brand: Kirby Gate by default; another deployment (e.g. SurveyPass) overrides
   these through window.KG_SURVEY.brand in its config script. */
const BRAND = Object.assign({
  product: "Daily Rounds", facility: "The Pointe at Kirby Gate", facilityShort: "Kirby Gate",
  address: "6480 Quince Rd, Memphis, TN 38119", fileSlug: "kirby-gate-daily-rounds"
}, (window.KG_SURVEY && window.KG_SURVEY.brand) || {});
/* ---------------------------------------------------------------------------
   Checklist definitions: transcribed from the Daily Departmental Compliance
   Checklist (scan of Nov 13, 2026). C = compliant, NC = needs correction,
   NA = not applicable. Every NC must be documented.
--------------------------------------------------------------------------- */
const DEPTS = [
  {id:"nursing", name:"Nursing & Memory Care", short:"Nursing", lead:"Director of Nursing (DON)", sections:[{title:"Clinical Services / Nursing", start:0}, {title:"Memory Care", start:12}], items:[
    "MAR/TAR records checked for omissions, missed doses, and discrepancies.",
    "Medication carts, refrigerators, rooms, and controlled drugs secured; required counts/temperatures logged.",
    "New and changed orders reconciled with EMR, prescriber and pharmacy.",
    "Falls, injuries, new admissions, antibiotics, transfers, and changes in condition documented.",
    "Required practitioner and resident-representative notifications completed.",
    "Skin findings, treatments, and overdue weekly skin assessments reviewed.",
    "Care plans/service plans updated when needs or condition change.",
    "High-risk residents, weights, intake, pain, infections, and refusals followed up.",
    "Shift report, staff assignments, care staffing, and supervision verified.",
    "ADL assistance, transfers, toileting, and infection-control practice observed.",
    "Missing charting, monthly summaries, and due quarterly reviews tracked.",
    "Needs beyond facility capacity promptly escalated and addressed.",
    "Resident whereabouts and supervision confirmed throughout shift.",
    "Doors, access controls, exits, and elopement alarms functioning.",
    "Individual elopement risk and prevention measures communicated to staff.",
    "Staff know usual cognition, behavior, and communication approaches.",
    "ADL, toileting, meals, fluids, and transfers assisted per plan.",
    "New behavior changes and distress assessed, documented, and escalated.",
    "Dignity, choice, and least-restrictive safe practices respected.",
    "Unsafe objects, chemicals, and unsecured areas addressed.",
    "Emergency evacuation assistance needs known to caregivers.",
    "Falls, wandering, and incidents reviewed with prevention steps.",
    "Admission and condition changes reviewed for safe ongoing placement."]},
  {id:"activities", name:"Activities", short:"Activities", lead:"Activities Director", sections:[{title:"Memory Care engagement", start:0}], items:[
    "Meaningful dementia-appropriate activities and engagement offered."]},
  {id:"dietary", name:"Dietary Services", short:"Dietary", lead:"Dietary Director / Lead Cook", sections:[{title:"Dietary Services", start:0}], items:[
    "Kitchen, dining areas, and equipment sanitary and free of pest evidence.",
    "Handwashing sinks supplied and appropriate employee hygiene observed.",
    "Staff illness and food-handler practices reviewed.",
    "Receiving, cook, cool, reheat, and holding temperatures recorded as applicable.",
    "Refrigerator and freezer temperatures documented; excursions addressed.",
    "Foods covered, dated, labeled, rotated, and separated to prevent cross-contamination.",
    "Expired, spoiled, and improperly stored food removed.",
    "Dishwashing/sanitizing process and test results verified.",
    "Current menu available; substitutions documented.",
    "Ordered therapeutic diets, allergies, textures, and swallowing precautions followed.",
    "Meals, fluids, snacks, and nutrition/intake concerns addressed with nursing.",
    "Emergency food supply and food stock sufficient.",
    "Floors, drains, trash, shelving, and storage areas clean.",
    "Meal-service staffing and closing cleaning logs verified."]},
  {id:"maint", name:"Maintenance & Housekeeping", short:"Maintenance", lead:"Maintenance Director", sections:[{title:"Maintenance / Life Safety", start:0}, {title:"Housekeeping / Environmental Services", start:14}], items:[
    "Exit doors, corridors, fire lanes, and evacuation routes kept clear.",
    "Fire/smoke doors unobstructed and functioning; not improperly propped open.",
    "Fire-alarm panel trouble/supervisory conditions promptly reported.",
    "Fire extinguishers accessible; visible damage or blockage addressed.",
    "Panels, cords, receptacles, and electrical equipment visibly safe.",
    "Sprinkler clearance maintained; ceiling hazards addressed.",
    "Exit signs and emergency lighting visually checked; defects reported.",
    "Resident call systems, room doors, locks, and safety devices working.",
    "Memory-care door controls and elopement alarms functioning.",
    "Mechanical, kitchen hood, laundry, and utility areas free of hazards.",
    "Hot-water, plumbing, HVAC, leaks, and comfort concerns addressed.",
    "Exterior paths, entrances, and grounds safe.",
    "Work orders prioritized, assigned, and tracked; urgent risks mitigated.",
    "Generator tests, fire drills, and inspections completed when due.",
    "Assigned rooms cleaned on the daily schedule.",
    "Bathrooms, toilets, showers, sinks, and touchpoints cleaned/disinfected.",
    "Hallways, dining areas, common spaces, offices, and entrances sanitary.",
    "Odors, spills, visible soil, and waste concerns addressed.",
    "Trash and soiled linen transported and stored appropriately.",
    "Clean laundry separated from soiled items; sufficient linen available.",
    "Chemicals labeled, secured, and inaccessible to residents.",
    "Safety Data Sheets available; protective equipment used as required.",
    "Cleaning tools maintained, cleaned, and appropriately stored.",
    "Wet floors and trip hazards mitigated with signage where needed.",
    "Assigned tasks on the 60-day deep-cleaning schedule documented.",
    "Leaks, moisture, suspected mold, and ventilation issues escalated promptly.",
    "High-touch disinfection and indicated infection precautions followed.",
    "Daily completion logs signed; missed assignments reported."]},
  {id:"admin", name:"Administration, Staffing/HR & Admissions", short:"Administration", lead:"Executive Director / AED / Administrative Designee", sections:[{title:"Administration / Business Office", start:0}, {title:"Staffing / Human Resources", start:13}, {title:"Resident Rights / Admissions", start:25}], items:[
    "Licenses, required notices, complaint process, and rights information posted.",
    "Manager coverage and daily operations reporting confirmed.",
    "Prior incidents, complaints, falls, medication events, and safety issues reviewed.",
    "Survey citations/plans of correction monitored; evidence retained.",
    "Prior-day corrective actions independently verified.",
    "Census, admissions, discharges, staffing, and licensed capacity reviewed.",
    "Resident/family concerns assigned and tracked.",
    "Safety, sanitation, environmental, and infection risks escalated promptly.",
    "Personnel, resident, and financial confidentiality maintained.",
    "Supply shortages, vendors, and service disruptions addressed.",
    "QAPI/CQI indicators and repeat findings tracked for trends.",
    "Serious matters reported to licensed administrator/authorities as indicated.",
    "Daily department checklists collected, checked, and signed off.",
    "All shifts covered with qualified staff, including memory care.",
    "Call-ins, absences, tardiness, and vacancies managed by Staffing.",
    "Agency/replacement staff qualified for assigned responsibilities.",
    "New hires cleared and authorized before beginning resident care.",
    "Licenses, certificates, registry/background clearances checked and monitored.",
    "Orientation, ongoing training, and competency needs identified.",
    "Timekeeping, missing punches, and staffing variances reviewed.",
    "Staffing assignments match resident needs and service plans.",
    "Infection control, medication safety, and dementia-care training needs flagged.",
    "Employee concerns, misconduct, and performance issues appropriately routed.",
    "Responsible on-site coverage and supervision maintained on all shifts.",
    "Confidential records and corrective-action documentation safeguarded.",
    "Prospective residents assessed before acceptance per facility policy.",
    "Admission agreements, disclosures, and required acknowledgments complete.",
    "Facility ability to meet resident needs verified.",
    "Contacts, representatives, directives, and consents recorded as applicable.",
    "Allergies, dietary, mobility, cognitive, and safety needs shared with staff.",
    "Privacy, dignity, autonomy, and choice upheld.",
    "Complaints/grievances logged and addressed without retaliation.",
    "Personal property, confidentiality, and possessions respected.",
    "Resident refusals/preferences documented without coercion.",
    "Hospital transfers, returns, and discharges documented and communicated.",
    "Changing service needs referred for reassessment and agreement review.",
    "Missing admissions-file elements identified and assigned for completion."]},
];
const DEPT = Object.fromEntries(DEPTS.map(d => [d.id, d]));
let TOTAL_ITEMS = DEPTS.reduce((n, d) => n + d.items.length, 0);
/* Department heads see only their own department(s); leadership and view-only accounts see
   every department. The database enforces the same rule; this keeps the screens consistent. */
const ALL_DEPTS = DEPTS.slice();
const canSeeDept = id => DEPTS.some(d => d.id === id);
function applyVisibility(p){
  const own = p && p.role === "director" ? ALL_DEPTS.filter(d => (p.depts || []).includes(d.id)) : ALL_DEPTS;
  DEPTS.splice(0, DEPTS.length, ...own);
  TOTAL_ITEMS = DEPTS.reduce((n, d) => n + d.items.length, 0);
}
const visibleAudits = () => AUDITS.filter(a => canSeeDept(a.dept));

/* Additional compliance checks by frequency (page 6 of the scan). */
const AUDITS = [
  {id:"shift-med", freq:"shift", label:"Every shift", dept:"nursing", text:"MAR/TAR omissions, medication security, narcotic counts, incident handoff"},
  {id:"wk-clin", freq:"week", label:"Weekly", dept:"nursing", text:"Skin assessments, fall follow-ups, infection tracking and outstanding clinical documentation"},
  {id:"mo-weights", freq:"month5", label:"By the 5th of each month", dept:"nursing", text:"Resident weights completed and entered into the EMR"},
  {id:"mo-summ", freq:"month", label:"Monthly", dept:"nursing", text:"Resident monthly summaries, medication audits and documentation reviews"},
  {id:"q-isp", freq:"quarter", label:"When due (quarterly)", dept:"nursing", text:"Quarterly individual service plan/care plan reviews"},
  {id:"wk-diet", freq:"week", label:"Weekly", dept:"dietary", text:"Dietary sanitation and food-storage inspection"},
  {id:"wk-evs", freq:"week", label:"Weekly", dept:"maint", text:"Deep-cleaning progress and room-quality inspection"},
  {id:"mo-maint", freq:"month", label:"When scheduled (logged monthly)", dept:"maint", text:"Fire drills, equipment testing and preventive maintenance"},
  {id:"mo-hr", freq:"month", label:"Monthly", dept:"admin", text:"Training, personnel-file and license-expiration audit"},
  {id:"mo-qapi", freq:"month", label:"Monthly", dept:"admin", text:"QAPI/CQI review, grievance trends and corrective-action effectiveness"},
];
const SHIFTS = [{k:"D", name:"Day", ends:15}, {k:"E", name:"Evening", ends:23}, {k:"N", name:"Night", ends:31}];
const STATUSES = ["Open", "In Progress", "Closed"];

/* ---------------------------------------------------------------- dates -- */
const TZ = "America/Chicago";
const fmtYMD = new Intl.DateTimeFormat("en-CA", {timeZone:TZ, year:"numeric", month:"2-digit", day:"2-digit"});
function today(){ return fmtYMD.format(new Date()); }
function hourNow(){ return +new Intl.DateTimeFormat("en-US", {timeZone:TZ, hour:"numeric", hourCycle:"h23"}).format(new Date()); }
function utc(s){ const [y,m,d] = s.split("-").map(Number); return new Date(Date.UTC(y, m-1, d)); }
function addDays(s, n){ const t = utc(s); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0,10); }
function dayDiff(a, b){ return Math.round((utc(b) - utc(a)) / 864e5); }
function fmtDay(s, opts){ return utc(s).toLocaleDateString("en-US", Object.assign({timeZone:"UTC", weekday:"short", month:"short", day:"numeric"}, opts||{})); }
function fmtShort(s){ return utc(s).toLocaleDateString("en-US", {timeZone:"UTC", month:"numeric", day:"numeric"}); }
function fmtTime(iso){ if(!iso) return ""; try { return new Date(iso).toLocaleTimeString("en-US", {timeZone:TZ, hour:"numeric", minute:"2-digit"}); } catch(e){ return ""; } }
function fmtStamp(iso){ if(!iso) return ""; try { return new Date(iso).toLocaleString("en-US", {timeZone:TZ, month:"short", day:"numeric", hour:"numeric", minute:"2-digit"}); } catch(e){ return ""; } }
function isoWeek(s){
  const t = utc(s); const dow = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - dow + 3);
  const fy = t.getUTCFullYear(); const j = new Date(Date.UTC(fy, 0, 4));
  const wk = 1 + Math.round(((t - j) / 864e5 - 3 + ((j.getUTCDay() + 6) % 7)) / 7);
  return fy + "-W" + String(wk).padStart(2, "0");
}
function weekEnd(s){ const dow = (utc(s).getUTCDay() + 6) % 7; return addDays(s, 6 - dow); }
function weekStart(s){ const dow = (utc(s).getUTCDay() + 6) % 7; return addDays(s, -dow); }
function monthKey(s){ return s.slice(0,7); }
function prevMonthKey(s){ const [y,m] = s.split("-").map(Number); return m === 1 ? (y-1)+"-12" : y+"-"+String(m-1).padStart(2,"0"); }
function quarterKey(s){ const [y,m] = s.split("-").map(Number); return y + "-Q" + (Math.floor((m-1)/3)+1); }
function prevQuarterKey(s){ const [y,q] = s.split("-Q").map(Number); return q === 1 ? (y-1)+"-Q4" : y+"-Q"+(q-1); }
function monthName(k){ const [y,m] = k.split("-").map(Number); return new Date(Date.UTC(y,m-1,1)).toLocaleDateString("en-US",{timeZone:"UTC",month:"long",year:"numeric"}); }
function periodKey(a, s){
  if (a.freq === "week") return isoWeek(s);
  if (a.freq === "month" || a.freq === "month5") return monthKey(s);
  if (a.freq === "quarter") return quarterKey(s);
  return s;
}
function prevPeriod(a, key){
  if (a.freq === "week") { return isoWeek(addDays(weekStartOfKey(key), -1)); }
  if (a.freq === "month" || a.freq === "month5") return prevMonthKey(key + "-01");
  if (a.freq === "quarter") return prevQuarterKey(key);
  return addDays(key, -1);
}
function weekStartOfKey(key){
  const [y, w] = key.split("-W").map(Number);
  const j4 = new Date(Date.UTC(y, 0, 4)); const dow = (j4.getUTCDay() + 6) % 7;
  j4.setUTCDate(j4.getUTCDate() - dow + (w - 1) * 7); return j4.toISOString().slice(0,10);
}
function periodLabel(a, key){
  if (a.freq === "week") { const s = weekStartOfKey(key); return "Week of " + fmtDay(s, {weekday:undefined}); }
  if (a.freq === "month" || a.freq === "month5") return monthName(key);
  if (a.freq === "quarter") return key.replace("-Q", " Q");
  return fmtDay(key);
}

/* Daily deadline: department heads finish and submit by 2:30 PM Central. */
const DEADLINE_MIN = 14*60 + 30;
function minsOf(iso){ try { const p = new Intl.DateTimeFormat("en-US", {timeZone:TZ, hour:"numeric", minute:"numeric", hourCycle:"h23"}).formatToParts(new Date(iso)); return +p.find(x => x.type === "hour").value * 60 + +p.find(x => x.type === "minute").value; } catch(e) { return 0; } }
function nowMins(){ return minsOf(new Date().toISOString()); }
function isLate(c, date){ if (!c || !c.submitted || !c.submittedAt) return false; const d = fmtYMD.format(new Date(c.submittedAt)); return d > date || (d === date && minsOf(c.submittedAt) > DEADLINE_MIN); }
function deadlineText(){ const m = DEADLINE_MIN - nowMins(); if (m > 0) { const hh = Math.floor(m / 60), mm = m % 60; return {over:false, text:"Due 2:30 PM · " + (hh ? hh + "h " : "") + mm + "m left"}; } return {over:true, text:"Past the 2:30 PM deadline"}; }

/* ---------------------------------------------------------------- state -- */
const S = {
  sb:null, profile:null, configured:true, authChecked:false, loadingProfile:false, people:new Map(),
  meId:null, meName:"", readOnly:false, offline:false,
  checks:new Map(), actions:new Map(), audits:new Map(),
  loaded:{checks:false, actions:false, audits:false}, stale:false, saving:0, dead:false,
  view:"dashboard", dept:null, date:today(),
  openFinding:null, drafts:{}, openAction:null, actFilter:"active", actDept:"all", newAction:null,
  auditDrafts:{}, binder:{from:addDays(today(), -29), to:today(), detail:false, extra:null, loading:false},
  errors:{}, dirty:false,
};
const WINDOW_DAYS = 45;
const COLL = {checks:S.checks, actions:S.actions, audits:S.audits};

function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function lsSet(k, v){ try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){} }
const homeDept = () => {
  const v = lsGet("kg-home-dept");
  if (v === "dashboard") return null;
  if (v && DEPT[v]) return v;
  const p = S.profile;
  return p && p.role === "director" && p.depts.length && DEPT[p.depts[0]] ? p.depts[0] : null;
};

/* -------------------------------------------------------------- helpers -- */
function h(tag, attrs, ...kids){
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "value") el.value = v;
    else if (k === "checked" || k === "disabled" || k === "selected") el[k] = !!v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; el.append(c instanceof Node ? c : document.createTextNode(String(c))); }
  return el;
}
function clone(o){ return o == null ? o : JSON.parse(JSON.stringify(o)); }
function merge(t, p){
  for (const [k, v] of Object.entries(p)) {
    if (v && typeof v === "object" && !Array.isArray(v)) { if (!t[k] || typeof t[k] !== "object") t[k] = {}; merge(t[k], v); }
    else t[k] = v;
  }
  return t;
}
const isEmpty = o => !o || Object.keys(o).length === 0;
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pct = (n, d) => d ? Math.round(n / d * 100) : 0;
function toast(msg){
  const t = document.getElementById("toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 3600);
}
// May the signed-in person change this department? (The database enforces the same rule.)
const canEditData = dept => !S.dead && !!S.profile && S.profile.role !== "viewer" &&
  (dept == null || S.profile.role === "admin" || (S.profile.depts || []).includes(dept));
const myDepts = () => DEPTS.filter(d => canEditData(d.id));

/* --------------------------------------------------- scoring & lookups -- */
function checkId(date, dept){ return date + "_" + dept; }
function countFor(dept, date){
  const c = S.checks.get(checkId(date, dept.id)) || null;
  const marks = (c && c.marks) || {};
  let C = 0, NC = 0, NA = 0;
  dept.items.forEach((_, i) => { const m = marks[i+1]; if (m === "C") C++; else if (m === "NC") NC++; else if (m === "NA") NA++; });
  const answered = C + NC + NA, total = dept.items.length;
  return {c, marks, C, NC, NA, answered, total, submitted: !!(c && c.submitted),
    status: c && c.submitted ? "submitted" : answered ? "progress" : "none"};
}
function dayTotals(date){
  let C=0, NC=0, NA=0, answered=0, submitted=0;
  for (const d of DEPTS){ const x = countFor(d, date); C+=x.C; NC+=x.NC; NA+=x.NA; answered+=x.answered; if (x.submitted) submitted++; }
  return {C, NC, NA, answered, submitted, total:TOTAL_ITEMS};
}
function readiness(t){ return pct(t.C + t.NA, t.total); }
function actionList(){ return [...S.actions.entries()].map(([id, a]) => Object.assign({id}, a)); }
function isOverdue(a){ return a.status !== "Closed" && a.targetDate && a.targetDate < today(); }
function actionSort(a, b){
  const ua = a.urgent && a.status !== "Closed", ub = b.urgent && b.status !== "Closed";
  if (ua !== ub) return ua ? -1 : 1;
  const oa = isOverdue(a), ob = isOverdue(b); if (oa !== ob) return oa ? -1 : 1;
  if ((a.status === "Closed") !== (b.status === "Closed")) return a.status === "Closed" ? 1 : -1;
  return String(a.targetDate || "9999").localeCompare(String(b.targetDate || "9999")) || String(b.date||"").localeCompare(String(a.date||""));
}
function openUrgent(){ return actionList().filter(a => a.urgent && a.status !== "Closed"); }
function auditDoc(a, key){ return S.audits.get(a.id + "_" + key) || null; }

/* --------------------------------------------------------------- writes -- */
// Every change goes through the save_doc() database function, which checks the
// person's role and department and stamps times on the server.
const W = {};
function deptOf(coll, id, patch){ return (patch && patch.dept) || ((COLL[coll].get(id) || {}).dept) || null; }
function writeDoc(coll, id, patch){
  const dep = deptOf(coll, id, patch);
  if (!canEditData(dep)) { toast(S.readOnly ? "Your account is view-only." : "Your account can't change this department."); return; }
  const map = COLL[coll];
  map.set(id, merge(clone(map.get(id) || {}), Object.assign({}, patch, {updatedAt: new Date().toISOString(), updatedBy: S.meId || null})));
  const key = coll + "/" + id;
  const w = W[key] || (W[key] = {coll, id, patch:{}, timer:0, busy:false, tries:0});
  merge(w.patch, clone(patch));
  clearTimeout(w.timer); w.timer = setTimeout(() => flush(key), 450);
  S.saving = 1; renderStatus(); render();
}
function isNetErr(err){ return !err || !err.code || /fetch|network|load failed|timed? ?out/i.test(err.message || ""); }
function isAuthErr(err){ return !!err && (err.code === "PGRST301" || err.code === "PGRST302" || /jwt/i.test(err.message || "")); }
async function flush(key){
  const w = W[key]; if (!w) return;
  if (w.busy) { clearTimeout(w.timer); w.timer = setTimeout(() => flush(key), 300); return; }
  if (isEmpty(w.patch)) { settle(); return; }
  const patch = w.patch; w.patch = {}; w.busy = true;
  let res;
  try { res = await S.sb.rpc("save_doc", {p_table: w.coll, p_id: w.id, p_patch: patch}); }
  catch (e) { res = {error: {message: String((e && e.message) || e)}}; }
  w.busy = false;
  let retryIn = 200;
  if (!res.error) {
    w.tries = 0; if (S.offline) { S.offline = false; }
    const saved = res.data || {};
    COLL[w.coll].set(w.id, isEmpty(w.patch) ? saved : merge(clone(saved), clone(w.patch)));
  } else {
    const err = res.error, code = err.code || "";
    if (isAuthErr(err)) {
      const r = await S.sb.auth.refreshSession().catch(() => ({error:true}));
      if (r && !r.error && w.tries++ < 2) { w.patch = merge(clone(patch), w.patch); retryIn = 300; }
      else { toast("Your sign-in expired. Please sign in again."); signOut(); return; }
    } else if (code === "28000") {
      toast("This account no longer has access."); signOut(); return;
    } else if (isNetErr(err)) {
      w.patch = merge(clone(patch), w.patch); S.offline = true;
      retryIn = Math.min(30000, 2000 * Math.pow(2, w.tries++));
    } else {
      toast(code === "42501" || code === "55000" ? err.message : "Couldn't save that change: " + err.message);
      loadAll();
    }
  }
  if (!isEmpty(w.patch)) { clearTimeout(w.timer); w.timer = setTimeout(() => flush(key), retryIn); }
  settle();
}
function settle(){
  S.saving = Object.values(W).some(w => w.busy || !isEmpty(w.patch)) ? 1 : 0;
  renderStatus(); render();
}

/* ------------------------------------------------------------ live sync -- */
function applyRows(coll, rows, full){
  const map = COLL[coll], seen = new Set();
  for (const r of rows) {
    if (!r || !r.id) continue;
    if (r.data && r.data.dept && !canSeeDept(r.data.dept)) continue;   // another department's record
    seen.add(r.id);
    const w = W[coll + "/" + r.id];
    if (w && w.busy) continue;              // the save result will land in a moment
    const data = clone(r.data) || {};
    if (w && !isEmpty(w.patch)) merge(data, clone(w.patch));
    map.set(r.id, data);
  }
  if (full) for (const id of [...map.keys()]) {
    if (seen.has(id)) continue;
    const w = W[coll + "/" + id];
    if (!(w && (w.busy || !isEmpty(w.patch)))) map.delete(id);
  }
}
async function loadAll(){
  if (!S.sb || !S.profile || S.profile.mustChangePassword || !S.profile.termsOk) return;
  const since = addDays(today(), -WINDOW_DAYS);
  let c, a, u, p;
  try {
    [c, a, u, p] = await Promise.all([
      S.sb.from("checks").select("id,data").gte("day", since).limit(1000),
      S.sb.from("actions").select("id,data").order("day", {ascending:false}).limit(1000),
      S.sb.from("audits").select("id,data").gte("day", addDays(today(), -200)).limit(1000),
      S.sb.from("staff").select("user_id,full_name")]);
  } catch (e) { c = {error:{message:String(e)}}; }
  const bad = [c, a, u].find(r => !r || r.error);
  if (bad) {
    const err = (bad && bad.error) || {};
    if (isAuthErr(err)) { const r = await S.sb.auth.refreshSession().catch(() => ({error:true})); if (r && !r.error) return loadAll(); signOut(); return; }
    if (isNetErr(err)) S.offline = true; else S.stale = true;
  } else {
    S.stale = false; S.offline = false; clearTimeout(S.loadTimer);
    applyRows("checks", c.data, true); applyRows("actions", a.data, true); applyRows("audits", u.data, true);
    S.loaded = {checks:true, actions:true, audits:true};
    if (p && p.data) S.people = new Map(p.data.map(x => [x.user_id, x.full_name]));
    if (S.profile.role === "admin") {
      try { const tm = await S.sb.rpc("team_status"); if (!tm.error && Array.isArray(tm.data)) S.team = tm.data; } catch (e) {}
    }
  }
  renderStatus(); render();
}
function startSync(){
  if (S.syncing) return; S.syncing = true;
  loadAll();
  S.loadTimer = setTimeout(() => { if (!S.loaded.checks) { S.stale = true; renderStatus(); render(); } }, 10000);
  try {
    S.channel = S.sb.channel("kg-mock-survey");
    for (const t of ["checks", "actions", "audits"]) {
      S.channel.on("postgres_changes", {event:"*", schema:"public", table:t}, msg => {
        if (msg.eventType === "DELETE") { if (msg.old && msg.old.id) COLL[t].delete(msg.old.id); }
        else if (msg.new && msg.new.id) applyRows(t, [{id:msg.new.id, data:msg.new.data}], false);
        renderStatus(); render();
      });
    }
    S.channel.subscribe();
  } catch (e) { /* polling below keeps phones current */ }
  clearInterval(S.poll);
  S.poll = setInterval(() => { if (document.visibilityState === "visible") loadAll(); }, 30000);
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.syncing) loadAll(); });

/* ------------------------------------------------------------- routing -- */
const VIEWS = ["dashboard", "checklists", "actions", "audits", "binder", "account", "privacy"];
function route(){
  const hash = (location.hash || "").slice(1);
  if (hash.startsWith("dept-") && DEPT[hash.slice(5)]) { S.view = "checklists"; S.dept = hash.slice(5); }
  else if (VIEWS.includes(hash)) { S.view = hash; if (hash === "checklists") S.dept = null; }
  else { const home = homeDept(); if (home) { S.view = "checklists"; S.dept = home; } else S.view = "dashboard"; }
  S.openFinding = null; render(true);
  logAccess("view", S.view + (S.view === "checklists" && S.dept ? ":" + S.dept : ""));
}
function go(hash){ if (location.hash === "#" + hash) route(); else location.hash = hash; }
window.addEventListener("hashchange", route);

/* ------------------------------------------------------- header/status -- */
function renderStatus(){
  const row = document.getElementById("statusRow"); row.replaceChildren();
  if (!S.profile) { renderTabs(); return; }
  let cls = "live", txt = "Live";
  if (S.offline) { cls = "off"; txt = "Offline · will save when back"; }
  else if (S.stale) { cls = "off"; txt = "Can't reach the server"; }
  else if (!S.profile.mustChangePassword && S.profile.termsOk && !(S.loaded.checks && S.loaded.actions && S.loaded.audits)) { cls = "saving"; txt = "Loading…"; }
  else if (S.saving) { cls = "saving"; txt = "Saving…"; }
  row.append(h("span", {class:"pill " + cls, title:"Sync status"}, h("span", {class:"dot"}), txt));
  if (IS_DEMO) row.append(h("span", {class:"pill demo-pill"}, "Demo · sample data"));
  const urg = openUrgent().length;
  if (urg) row.append(h("a", {class:"pill urgent-pill", href:"#actions", onclick:() => { S.actFilter = "active"; }}, urg + " urgent safety " + (urg === 1 ? "issue" : "issues")));
  if (S.readOnly) row.append(h("span", {class:"pill"}, "View only"));
  row.append(h("a", {class:"pill", href:"#account", title:"Your account"}, S.meName || "Account"));
  renderTabs();
}
function renderTabs(){
  const tabs = document.getElementById("tabs"); tabs.replaceChildren();
  if (!S.profile || S.profile.mustChangePassword || !S.profile.termsOk) return;
  const active = actionList().filter(a => a.status !== "Closed");
  const hot = active.some(a => a.urgent) || active.some(isOverdue);
  const defs = [["dashboard","Dashboard","Home"],["checklists","Daily checklists","Checklist"],["actions","Corrective actions","Actions", active.length, hot],["audits","Scheduled audits","Audits", auditsDueCount()],["binder","Survey binder","Binder"]];
  for (const [id, long, short, n, isHot] of defs) {
    tabs.append(h("a", {href:"#" + id, "aria-current": S.view === id ? "page" : null}, h("span", {class:"ico ico-" + id, "aria-hidden":"true"}), h("span", {class:"lf"}, long), h("span", {class:"ls"}, short), n ? h("span", {class:"count" + (isHot ? " hot" : "")}, n) : null));
  }
  requestAnimationFrame(() => { const b = document.getElementById("band"); document.documentElement.style.setProperty("--band-h", b.offsetHeight + "px"); });
}

/* ---------------------------------------------------------------- render -- */
function render(force){
  const main = document.getElementById("main");
  const ae = document.activeElement;
  if (!force && ae && main.contains(ae) && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.tagName === "SELECT") && ae.type !== "radio" && ae.type !== "checkbox") { S.dirty = true; return; }
  S.dirty = false;
  const y = window.scrollY;
  const view = !S.configured ? viewNotConfigured
    : !S.profile ? (S.view === "privacy" ? viewPrivacy : viewLogin)
    : !S.profile.termsOk ? viewTerms
    : S.profile.mustChangePassword ? () => viewChangePassword(true)
    : ({dashboard:viewDashboard, checklists:viewChecklists, actions:viewActions, audits:viewAudits, binder:viewBinder, account:viewAccount, privacy:viewPrivacy}[S.view] || viewDashboard);
  main.replaceChildren(view(), noticeFooter());
  if (!force) window.scrollTo(0, y); else window.scrollTo(0, 0);
  renderTabs();
}
document.addEventListener("focusout", () => setTimeout(() => { if (S.dirty) render(); }, 0));

function noDbNotice(){
  if (S.offline || S.stale) return h("div", {class:"panel"}, h("strong", {}, S.offline ? "You're offline. " : "Can't reach the server. "),
    h("span", {class:"note"}, "What you see may be out of date. Changes you make save automatically when the connection is back, as long as this page stays open."));
  return null;
}
function urgentBanner(){
  const list = openUrgent(); if (!list.length) return null;
  return h("div", {class:"urgent-banner", role:"alert"},
    h("h2", {}, list.length === 1 ? "1 immediate resident-safety finding is open" : list.length + " immediate resident-safety findings are open"),
    h("p", {style:"margin:0"}, "Escalate now to the Administrator and DON. These do not wait for the 9:00 AM meeting."),
    h("ul", {}, list.map(a => h("li", {}, h("strong", {}, (DEPT[a.dept] ? DEPT[a.dept].short : "") + ": "), a.deficiency || "(no description)", " · ", a.status, a.responsible ? " · " + a.responsible : ""))),
    h("div", {}, h("a", {class:"btn small danger", href:"#actions"}, "Open corrective actions")));
}

/* ------------------------------------------------------------ dashboard -- */
function viewDashboard(){
  const t = today(), y = addDays(t, -1);
  const tot = dayTotals(t), score = readiness(tot), dl = deadlineText(), pendingN = DEPTS.filter(d => !countFor(d, t).submitted).length;
  const acts = actionList(), active = acts.filter(a => a.status !== "Closed");
  const overdue = active.filter(isOverdue);
  const bars = [];
  for (const d of DEPTS) { const x = countFor(d, t); d.items.forEach((_, i) => bars.push(x.marks[i+1] || "")); }

  const hero = h("section", {class:"panel ready"},
    h("div", {class:"score"},
      h("span", {class:"eyebrow"}, "Survey readiness · " + fmtDay(t)),
      h("div", {class:"big num"}, score, h("small", {}, "%")),
      h("div", {class:"sub"}, (tot.C + tot.NA) + " of " + TOTAL_ITEMS + " survey line items verified compliant (or not applicable) today. Items not yet checked count against the score."),
      h("div", {class:"itembar", role:"img", "aria-label": tot.C + " compliant, " + tot.NC + " need correction, " + tot.NA + " not applicable, " + (TOTAL_ITEMS - tot.answered) + " not checked"}, bars.map(m => h("span", {class:m}))),
      h("div", {class:"legend"},
        h("span", {}, h("i", {style:"background:var(--ok)"}), tot.C + " compliant"),
        h("span", {}, h("i", {style:"background:var(--bad)"}), tot.NC + " need correction"),
        h("span", {}, h("i", {style:"background:var(--na)"}), tot.NA + " not applicable"),
        h("span", {}, h("i", {style:"background:var(--empty)"}), (TOTAL_ITEMS - tot.answered) + " not checked")),
      h("div", {class:"row"}, h("span", {class:"chip " + (dl.over && pendingN ? "bad" : "plain")}, dl.text),
        h("span", {class:"note"}, pendingN ? pendingN + " of " + DEPTS.length + " checklists not submitted yet" : (DEPTS.length === 1 ? "Checklist submitted" : "All " + DEPTS.length + " checklists submitted")))),
    h("div", {class:"kpis"},
      kpi(tot.submitted + "/" + DEPTS.length, "Departments submitted today"),
      kpi(tot.C + tot.NC ? pct(tot.C, tot.C + tot.NC) + "%" : "—", "Compliance rate of checked items"),
      kpi(active.length, "Open corrective actions", overdue.length > 0, overdue.length ? overdue.length + " overdue" : "none overdue"),
      kpi(auditsDueCount(), "Scheduled audits due or overdue", auditsOverdueCount() > 0, auditsOverdueCount() ? auditsOverdueCount() + " overdue" : "")));

  const board = h("section", {},
    h("div", {class:"section-h"}, h("h2", {}, "Departments today"), h("span", {class:"sub"}, "Tap a department to open its checklist")),
    h("div", {class:"depts"}, DEPTS.map(d => {
      const x = countFor(d, t);
      const openA = active.filter(a => a.dept === d.id).length;
      const late = x.submitted && isLate(x.c, t);
      const pill = x.status === "submitted" ? h("span", {class:"chip " + (late ? "warn" : "ok")}, (late ? "Late " : "Submitted ") + fmtTime(x.c.submittedAt))
        : dl.over ? h("span", {class:"chip bad"}, "Past due" + (x.answered ? " · " + x.answered + "/" + x.total : ""))
        : x.status === "progress" ? h("span", {class:"chip warn"}, "In progress " + x.answered + "/" + x.total)
        : h("span", {class:"chip plain"}, "Not started");
      return h("button", {class:"dept", type:"button", onclick:() => { S.date = t; go("dept-" + d.id); }},
        h("div", {class:"row"}, h("h3", {}, d.short), h("span", {class:"spacer"}), pill),
        h("div", {class:"mini"}, d.items.map((_, i) => h("span", {class: x.marks[i+1] || ""}))),
        h("div", {class:"meta"},
          x.answered ? h("span", {}, pct(x.C + x.NA, x.total) + "% ready") : h("span", {}, d.lead),
          x.NC ? h("span", {class:"chip bad"}, x.NC + " NC") : null,
          openA ? h("span", {class:"chip plain"}, openA + " open action" + (openA > 1 ? "s" : "")) : null,
          x.c && x.c.reviewer ? h("span", {}, "· " + x.c.reviewer) : null));
    })));

  return h("div", {class:"stack"}, noDbNotice(), urgentBanner(), hero, board, teamPanel(t), heatmap(t),
    h("div", {class:"two"}, meetingPanel(y, active, overdue), repeatPanel(t)));
}
/* Leadership only: who has signed in, when each person was last active, and how far
   their own checklists are today. */
function teamPanel(t){
  if (!S.profile || S.profile.role !== "admin" || !Array.isArray(S.team) || !S.team.length) return null;
  const last = {};
  for (const coll of [S.checks, S.actions, S.audits]) for (const d of coll.values()) {
    if (d && d.updatedBy && d.updatedAt && (!last[d.updatedBy] || d.updatedAt > last[d.updatedBy])) last[d.updatedBy] = d.updatedAt;
  }
  const notIn = S.team.filter(p => !p.set_password).length;
  return h("section", {},
    h("div", {class:"section-h"}, h("h2", {}, "Team"),
      h("span", {class:"sub"}, notIn ? notIn + " of " + S.team.length + " have not signed in yet" : "Everyone has signed in")),
    h("ul", {class:"list"}, S.team.map(p => {
      const depts = (p.depts || []).map(id => DEPT[id]).filter(Boolean);
      const seen = [p.last_sign_in, last[p.user_id]].filter(Boolean).sort().pop();
      const status = !p.active ? h("span", {class:"chip plain"}, "Deactivated")
        : !p.set_password ? h("span", {class:"chip bad"}, "Not signed in yet")
        : h("span", {class:"chip ok"}, "Active" + (seen ? " · " + (fmtYMD.format(new Date(seen)) === t ? fmtTime(seen) : fmtStamp(seen)) : ""));
      const today = depts.map(d => {
        const x = countFor(d, t);
        const txt = x.submitted ? (isLate(x.c, t) ? "Late " : "Submitted ") + fmtTime(x.c.submittedAt)
          : x.answered ? x.answered + "/" + x.total + " checked" : "Not started";
        const cls = x.submitted ? (isLate(x.c, t) ? "warn" : "ok") : (deadlineText().over ? "bad" : x.answered ? "warn" : "plain");
        return h("span", {class:"chip " + cls, title:d.name}, d.short + ": " + txt);
      });
      return h("li", {class:"li"},
        h("span", {class:"t"}, h("strong", {}, p.full_name), h("span", {class:"note"}, "  " + (p.role === "admin" ? "Leadership" : depts.map(d => d.short).join(", ") || "No department"))),
        status, today);
    })));
}
function kpi(v, k, alert, sub){ return h("div", {class:"kpi" + (alert ? " alert" : "")}, h("span", {class:"v"}, v), h("span", {class:"k"}, k), sub ? h("span", {class:"note"}, sub) : null); }

function heatmap(t){
  const days = []; for (let i = 13; i >= 0; i--) days.push(addDays(t, -i));
  const dayScore = days.map(d => readiness(dayTotals(d)));
  return h("section", {},
    h("div", {class:"section-h"}, h("h2", {}, "Last 14 days"), h("span", {class:"sub"}, "Percent of each checklist verified compliant or N/A · red number = items needing correction · dashed = not submitted")),
    h("div", {class:"panel heat-wrap"}, h("table", {class:"heat"},
      h("thead", {}, h("tr", {}, h("th", {}), days.map(d => h("th", {scope:"col", title:fmtDay(d)}, fmtShort(d))))),
      h("tbody", {},
        DEPTS.map(dep => h("tr", {}, h("th", {class:"rowh", scope:"row"}, dep.short), days.map(d => {
          const x = countFor(dep, d);
          if (!x.answered) return h("td", {title: dep.short + " · " + fmtDay(d) + " · not done"}, "–");
          const s = (x.C + x.NA) / x.total;
          const cls = (s === 1 ? "s4" : s >= .9 ? "s3" : s >= .75 ? "s2" : "s1") + (x.submitted ? "" : " open");
          return h("td", {class:cls, title: dep.short + " · " + fmtDay(d) + " · " + x.C + " C, " + x.NC + " NC, " + x.NA + " NA" + (x.submitted ? " · submitted" : " · not submitted")}, Math.round(s*100), x.NC ? h("sup", {}, x.NC) : null);
        }))),
        h("tr", {}, h("th", {class:"rowh", scope:"row"}, "Whole building"), dayScore.map((s, i) => {
          const tt = dayTotals(days[i]);
          if (!tt.answered) return h("td", {}, "–");
          return h("td", {class: s === 100 ? "s4" : s >= 90 ? "s3" : s >= 75 ? "s2" : "s1"}, s);
        }))))));
}
function meetingPanel(y, active, overdue){
  const missing = DEPTS.filter(d => !countFor(d, y).submitted);
  const lateY = DEPTS.filter(d => { const x = countFor(d, y); return x.submitted && isLate(x.c, y); });
  const yFindings = actionList().filter(a => a.date === y);
  const dueToday = active.filter(a => a.targetDate === today());
  return h("section", {},
    h("div", {class:"section-h"}, h("h2", {}, "For the 9:00 AM meeting"), h("span", {class:"sub"}, "Yesterday, " + fmtDay(y))),
    h("div", {class:"panel stack", style:"gap:14px"},
      h("div", {}, h("div", {class:"lbl"}, "Checklists not submitted yesterday"),
        missing.length ? h("div", {class:"row", style:"margin-top:6px"}, missing.map(d => h("span", {class:"chip bad"}, d.short))) : h("div", {class:"chip ok", style:"margin-top:6px"}, (DEPTS.length === 1 ? "Submitted" : "All " + DEPTS.length + " submitted"))),
      h("div", {}, h("div", {class:"lbl"}, "Submitted after the 2:30 PM deadline yesterday"),
        lateY.length ? h("div", {class:"row", style:"margin-top:6px"}, lateY.map(d => h("span", {class:"chip warn"}, d.short))) : h("div", {class:"chip ok", style:"margin-top:6px"}, "None")),
      listBlock("Findings logged yesterday", yFindings),
      listBlock("Overdue corrective actions", overdue),
      listBlock("Corrective actions due today", dueToday)));
}
function listBlock(title, arr){
  return h("div", {}, h("div", {class:"lbl"}, title + " (" + arr.length + ")"),
    arr.length ? h("ul", {class:"list", style:"margin-top:6px"}, arr.sort(actionSort).slice(0, 8).map(a => h("li", {class:"li"},
      h("span", {class:"t"}, h("strong", {}, (DEPT[a.dept] ? DEPT[a.dept].short : "") + ": "), a.deficiency || "(no description)"),
      a.urgent && a.status !== "Closed" ? h("span", {class:"chip urgent"}, "Urgent") : null,
      h("span", {class:"chip " + (a.status === "Closed" ? "ok" : isOverdue(a) ? "bad" : "warn")}, a.status + (a.targetDate ? " · due " + fmtShort(a.targetDate) : ""))))) : h("div", {class:"note", style:"margin-top:4px"}, "None"));
}
function repeatPanel(t){
  const since = addDays(t, -29), tally = {};
  for (const [id, c] of S.checks) {
    if (!c.date || c.date < since || c.date > t) continue;
    for (const [n, m] of Object.entries(c.marks || {})) if (m === "NC") { const k = c.dept + "." + n; tally[k] = (tally[k] || 0) + 1; }
  }
  const rows = Object.entries(tally).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return h("section", {},
    h("div", {class:"section-h"}, h("h2", {}, "Repeat findings"), h("span", {class:"sub"}, "Items marked NC on 2 or more days in the last 30 (QAPI trend)")),
    rows.length ? h("ul", {class:"list"}, rows.map(([k, n]) => {
      const [dep, num] = k.split("."); const d = DEPT[dep]; const text = d ? d.items[+num - 1] : k;
      return h("li", {class:"li"}, h("span", {class:"t"}, h("strong", {}, (d ? d.short : dep) + " #" + num + " "), text), h("span", {class:"chip bad"}, n + " days"));
    })) : h("div", {class:"empty"}, "No repeat findings in the last 30 days."));
}

/* ----------------------------------------------------------- checklists -- */
function viewChecklists(){
  if (!S.dept) return deptPicker();
  const dept = DEPT[S.dept], date = S.date, id = checkId(date, dept.id);
  const x = countFor(dept, date), c = x.c || {};
  const locked = !canEditData(dept.id) || x.submitted;
  const t = today();

  const head = h("section", {class:"ck-head"},
    h("div", {class:"stack", style:"gap:4px"},
      h("a", {href:"#checklists", class:"btn back"}, "‹ All departments"),
      h("h2", {}, dept.name),
      h("div", {class:"sub"}, "Responsible lead: " + dept.lead)),
    h("div", {class:"datenav"},
      h("button", {class:"btn small", type:"button", "aria-label":"Previous day", onclick:() => { S.date = addDays(S.date, -1); S.openFinding = null; render(); }}, "‹"),
      h("span", {class:"d"}, date === t ? "Today · " + fmtDay(date) : fmtDay(date, {year:"numeric"})),
      h("button", {class:"btn small", type:"button", "aria-label":"Next day", disabled: date >= t, onclick:() => { S.date = addDays(S.date, 1); S.openFinding = null; render(); }}, "›"),
      date !== t ? h("button", {class:"btn small", type:"button", onclick:() => { S.date = t; render(); }}, "Today") : null));

  const meta = h("section", {class:"grid2"},
    h("div", {class:"field"}, h("label", {for:"ck-reviewer"}, "Reviewer"),
      h("input", {class:"input", id:"ck-reviewer", value:c.reviewer || "", placeholder:"Name of the person doing the rounds", disabled:locked, autocomplete:"name",
        onchange:e => writeDoc("checks", id, baseFields(date, dept.id, {reviewer:e.target.value.trim()}))})),
    h("div", {class:"note", style:"align-self:end"}, "Tap one answer for each item: Compliant, Needs fix (NC) or N/A. Every \"Needs fix\" asks you to write down what you found and goes to the corrective-action list."));

  const prog = h("div", {class:"progress"},
    h("div", {class:"row"}, h("strong", {class:"num"}, x.answered + " of " + x.total + " checked"),
      x.NC ? h("span", {class:"chip bad"}, x.NC + " NC") : null, h("span", {class:"spacer"}),
      x.submitted ? h("span", {class:"chip " + (isLate(c, date) ? "warn" : "ok")}, (isLate(c, date) ? "Submitted late " : "Submitted ") + fmtTime(c.submittedAt)) : (date === t ? h("span", {class:"chip " + (deadlineText().over ? "bad" : "plain")}, deadlineText().text) : h("span", {class:"note"}, "Not submitted"))),
    h("div", {class:"mini", style:"height:10px"}, dept.items.map((_, i) => h("span", {class:x.marks[i+1] || ""}))));

  const items = h("section", {class:"items"}, dept.items.map((text, i) => [secHead(dept, i), itemRow(dept, date, id, i + 1, text, x.marks[i+1], locked)]));

  const viewOnly = !canEditData(dept.id) ? h("div", {class:"panel note"}, "View only. Your account can fill in: " + (myDepts().map(d => d.short).join(", ") || "no departments") + ".") : null;
  return h("div", {class:"stack"}, noDbNotice(), urgentBanner(), head, viewOnly,
    x.submitted ? submittedBanner(c, dept, date, id) : null, meta, prog, items, signoff(dept, date, id, x, c, locked));
}
// Section heading (the original paper form) before the first item of each section
function secOf(dept, i){ let s = null; for (const x of dept.sections || []) if (i >= x.start) s = x; return s; }
function secHead(dept, i){ const s = (dept.sections || []).find(x => x.start === i); return s && dept.sections.length > 1 ? h("h3", {class:"sec-h"}, s.title) : null; }
function baseFields(date, dept, extra){ return Object.assign({date, dept}, extra); }
function itemRow(dept, date, cid, n, text, mark, locked){
  const key = dept.id + "." + n, aid = date + "_" + dept.id + "_" + n, act = S.actions.get(aid);
  const setMark = m => {
    if (locked) return;
    const next = mark === m ? null : m;
    const cur = S.checks.get(cid);
    writeDoc("checks", cid, baseFields(date, dept.id, Object.assign({marks:{[n]: next}}, (!(cur && cur.reviewer) && S.meName) ? {reviewer:S.meName, reviewerId:S.meId || null} : {})));
    if (next === "NC" && !act) S.openFinding = key;
    else if (S.openFinding === key && next !== "NC") S.openFinding = null;
    render();
  };
  const row = h("article", {class:"item" + (mark ? " mark-" + mark : ""), id:"item-" + n},
    h("div", {class:"item-top"},
      h("div", {class:"item-text"}, h("span", {class:"n num"}, n + "."), h("span", {}, text)),
      h("div", {class:"seg", role:"group", "aria-label":"Item " + n + " result"},
        ["C","NC","NA"].map(m => h("button", {type:"button", class:m, "aria-pressed": mark === m ? "true" : "false", disabled:locked && mark !== m, onclick:() => setMark(m), title:{C:"Compliant", NC:"Needs correction", NA:"Not applicable"}[m]}, {C:"Compliant", NC:"Needs fix", NA:"N/A"}[m])))));
  if (mark === "NC" || act) row.append(findingBlock(dept, date, n, text, aid, act, locked && !canEditData(dept.id)));
  return row;
}
function findingBlock(dept, date, n, text, aid, act, readonly){
  const key = dept.id + "." + n;
  if (act && S.openFinding !== key) {
    return h("div", {class:"finding"},
      h("div", {class:"row"},
        h("span", {class:"chip " + (act.status === "Closed" ? "ok" : isOverdue(act) ? "bad" : "warn")}, "Finding · " + act.status),
        act.urgent ? h("span", {class:"chip urgent"}, "Resident safety") : null,
        h("span", {class:"t", style:"flex:1 1 200px"}, act.deficiency || ""),
        h("button", {class:"btn small", type:"button", onclick:() => { S.openAction = aid; S.actFilter = "all"; go("actions"); }}, "Open in tracker")),
      h("div", {class:"note"}, [act.responsible ? "Responsible: " + act.responsible : null, act.targetDate ? "Target " + fmtDay(act.targetDate) : null].filter(Boolean).join(" · ")));
  }
  if (readonly) return h("div", {class:"finding"}, h("span", {class:"note"}, "Needs correction. No finding has been logged yet."));
  const d = S.drafts[aid] || (S.drafts[aid] = act ? {deficiency:act.deficiency||"", safety:act.safety||"", corrective:act.corrective||"", responsible:act.responsible||"", targetDate:act.targetDate||"", urgent:!!act.urgent} : {deficiency:"", safety:"", corrective:"", responsible:"", targetDate:addDays(today(), 1), urgent:false});
  const inp = (f, label, ph, ta) => h("div", {class:"field"}, h("label", {for:"f-" + aid + "-" + f}, label),
    h(ta ? "textarea" : "input", {class:"input", id:"f-" + aid + "-" + f, value:d[f], placeholder:ph, type: f === "targetDate" ? "date" : null, oninput:e => { d[f] = e.target.value; }}));
  const err = S.errors[aid];
  return h("div", {class:"finding"},
    h("div", {class:"row"}, h("strong", {}, "Document this finding"), h("span", {class:"spacer"}), h("span", {class:"phi"}, "Use room numbers or initials, not resident names.")),
    inp("deficiency", "Deficiency identified", "What did you find? Where?", true),
    h("label", {class:"check"}, h("input", {type:"checkbox", checked:d.urgent, onchange:e => { d.urgent = e.target.checked; }}),
      h("span", {}, "Immediate resident-safety concern", h("br"), h("span", {class:"note", style:"font-weight:400"}, "Escalate to the Administrator and DON now. Do not hold it for the morning meeting."))),
    h("div", {class:"grid2"}, inp("safety", "Immediate safety measures", "What was done right away?", true), inp("corrective", "Corrective action required", "What will fix it for good?", true)),
    h("div", {class:"grid2"}, inp("responsible", "Person responsible", "Name or role"), inp("targetDate", "Target completion date", "")),
    err ? h("div", {class:"err"}, err) : null,
    h("div", {class:"row"},
      h("button", {class:"btn primary", type:"button", onclick:() => {
        if (!d.deficiency.trim()) { S.errors[aid] = "Describe the deficiency before saving."; render(true); return; }
        delete S.errors[aid];
        const base = act ? {} : {dept:dept.id, date, item:n, itemText:text, status:"Open", createdAt:new Date().toISOString(), createdBy:S.meId || null, source:"checklist"};
        writeDoc("actions", aid, Object.assign(base, {deficiency:d.deficiency.trim(), safety:d.safety.trim(), corrective:d.corrective.trim(), responsible:d.responsible.trim(), targetDate:d.targetDate || "", urgent:!!d.urgent}));
        delete S.drafts[aid]; S.openFinding = null;
        toast(d.urgent ? "Finding logged as urgent. Escalate it now." : "Finding logged to corrective actions.");
        render();
      }}, act ? "Update finding" : "Log finding"),
      act ? h("button", {class:"btn", type:"button", onclick:() => { S.openFinding = null; delete S.drafts[aid]; render(); }}, "Cancel") : null));
}
function submittedBanner(c, dept, date, id){
  return h("div", {class:"submitted"},
    h("strong", {}, "Submitted " + fmtStamp(c.submittedAt) + (c.submittedBy && S.people.get(c.submittedBy) ? " by " + S.people.get(c.submittedBy) : "")), isLate(c, date) ? h("span", {class:"chip warn"}, "After the 2:30 PM deadline") : null,
    h("span", {}, "Signed: " + (c.signature || "—")),
    h("span", {class:"spacer"}),
    canEditData(dept.id) ? h("button", {class:"btn small", type:"button", onclick:() => writeDoc("checks", id, baseFields(date, dept.id, {submitted:false, reopenedAt:new Date().toISOString()}))}, "Reopen to correct") : null);
}
function signoff(dept, date, id, x, c, locked){
  const ncIds = dept.items.map((_, i) => i + 1).filter(n => x.marks[n] === "NC");
  const undocumented = ncIds.filter(n => !S.actions.get(date + "_" + dept.id + "_" + n));
  const findings = dept.items.map((_, i) => i + 1).map(n => S.actions.get(date + "_" + dept.id + "_" + n)).filter(Boolean);
  const anyUrgent = findings.some(a => a.urgent);
  const err = S.errors["submit-" + id];
  const box = h("section", {class:"panel signoff"},
    h("h2", {style:"font-size:16px"}, "Findings / corrective actions / responsible person / target date"),
    findings.length ? h("div", {class:"tbl-wrap"}, h("table", {class:"tbl"},
      h("thead", {}, h("tr", {}, ["#","Finding","Corrective action","Responsible","Target","Status"].map(t => h("th", {}, t)))),
      h("tbody", {}, findings.map(a => h("tr", {}, h("td", {}, a.item), h("td", {}, a.deficiency || "", a.urgent ? h("span", {class:"chip urgent", style:"margin-left:6px"}, "Safety") : null), h("td", {}, a.corrective || ""), h("td", {}, a.responsible || ""), h("td", {}, a.targetDate ? fmtShort(a.targetDate) : ""), h("td", {}, a.status))))))
      : h("div", {class:"note"}, "No findings on this checklist."),
    h("div", {class:"row", style:"gap:18px"},
      h("span", {}, "Checklist completed: ", h("strong", {}, x.answered === x.total ? "Yes" : "Partial")),
      h("span", {}, "Issues identified: ", h("strong", {class:"num"}, x.NC))),
    h("div", {class:"field"}, h("span", {class:"lbl"}, "Urgent issue escalated"),
      h("div", {class:"radios", role:"radiogroup"}, ["Yes","No","N/A"].map(v => h("label", {}, h("input", {type:"radio", name:"esc-" + id, value:v, checked:c.urgentEscalated === v, disabled:locked,
        onchange:() => writeDoc("checks", id, baseFields(date, dept.id, {urgentEscalated:v}))}), v)))),
    h("div", {class:"grid2"},
      h("div", {class:"field"}, h("label", {for:"ck-sign"}, "Department head signature (type full name)"),
        h("input", {class:"input", id:"ck-sign", value:c.signature || "", disabled:locked, autocomplete:"name", onchange:e => writeDoc("checks", id, baseFields(date, dept.id, {signature:e.target.value.trim()}))})),
      h("div", {class:"field", style:"justify-content:end"}, h("span", {class:"lbl"}, "Time submitted"), h("strong", {}, c.submittedAt ? fmtStamp(c.submittedAt) : "Not yet submitted"))),
    err ? h("div", {class:"err"}, err) : null,
    !locked ? h("div", {class:"row"}, h("button", {class:"btn primary", type:"button", onclick:() => {
      const problems = [];
      if (undocumented.length) problems.push("Log a finding for NC item" + (undocumented.length > 1 ? "s " : " ") + undocumented.join(", ") + ".");
      if (!(c.reviewer || "").trim()) problems.push("Enter the reviewer's name.");
      if (!(c.signature || "").trim()) problems.push("Type the department head's name to sign.");
      if (!c.urgentEscalated) problems.push("Answer \"Urgent issue escalated\".");
      if (anyUrgent && c.urgentEscalated !== "Yes") problems.push("A resident-safety finding is on this checklist, so it must be escalated (answer Yes).");
      if (problems.length) { S.errors["submit-" + id] = problems.join(" "); render(true); document.getElementById("ck-sign")?.scrollIntoView({block:"center"}); return; }
      delete S.errors["submit-" + id];
      writeDoc("checks", id, baseFields(date, dept.id, {submitted:true, submittedAt:new Date().toISOString(), submittedBy:S.meId || null, completed: x.answered === x.total ? "Yes" : "Partial", issues:x.NC}));
      toast(dept.short + " checklist submitted.");
    }}, x.answered === x.total ? "Sign and submit checklist" : "Submit as partial (" + (x.total - x.answered) + " unchecked)")) : null,
    h("p", {class:"paper-rule", style:"margin:0"}, "Discuss unresolved findings and assigned follow-up at the next 9:00 AM manager meeting. Immediate resident-safety concerns must be escalated at once, not held for the morning meeting."));
  return box;
}
function deptPicker(){
  const t = today();
  return h("div", {class:"stack"}, noDbNotice(),
    h("div", {class:"section-h"}, h("h2", {}, "Daily departmental compliance checklists"), h("span", {class:"sub"}, fmtDay(t, {year:"numeric"}) + " · " + TOTAL_ITEMS + " line items across " + DEPTS.length + (DEPTS.length === 1 ? " department" : " departments"))),
    h("div", {class:"dept-pick"}, DEPTS.map(d => { const x = countFor(d, t);
      return h("button", {class:"dept", type:"button", onclick:() => { S.date = t; go("dept-" + d.id); }},
        h("h3", {}, d.short), h("span", {class:"lead"}, d.items.length + " items · " + d.lead),
        x.submitted ? h("span", {class:"chip ok"}, "Submitted") : x.answered ? h("span", {class:"chip warn"}, x.answered + "/" + x.total + " checked") : h("span", {class:"chip plain"}, "Not started")); })),
    null);
}
function setupPanel(){
  const home = homeDept();
  return h("section", {class:"panel stack", style:"gap:10px"},
    h("h2", {style:"font-size:16px"}, "Set up this phone"),
    h("p", {class:"note", style:"margin:0"}, "Choose what this phone opens to. Directors open to their own checklist unless you change it here. This is saved on this phone only."),
    h("div", {class:"setup"},
      h("select", {class:"input", id:"home-dept", style:"max-width:320px", onchange:e => { lsSet("kg-home-dept", e.target.value || "dashboard"); renderStatus(); toast(e.target.value ? "This phone now opens to " + DEPT[e.target.value].short + "." : "This phone now opens to the dashboard."); }},
        h("option", {value:"", selected:!home}, "Dashboard (overview)"),
        DEPTS.map(d => h("option", {value:d.id, selected:home === d.id}, d.short)))));
}

/* -------------------------------------------------- corrective actions -- */
function viewActions(){
  const all = actionList();
  let list = all;
  if (S.actFilter === "active") list = list.filter(a => a.status !== "Closed");
  else if (S.actFilter === "overdue") list = list.filter(isOverdue);
  else if (S.actFilter === "closed") list = list.filter(a => a.status === "Closed");
  if (S.actDept !== "all") list = list.filter(a => a.dept === S.actDept);
  list.sort(actionSort);
  const counts = {active: all.filter(a => a.status !== "Closed").length, overdue: all.filter(isOverdue).length, closed: all.filter(a => a.status === "Closed").length, all: all.length};
  const f = (k, label) => h("button", {type:"button", "aria-pressed": S.actFilter === k ? "true" : "false", onclick:() => { S.actFilter = k; render(); }}, label + " (" + counts[k] + ")");
  return h("div", {class:"stack"}, noDbNotice(), urgentBanner(),
    h("div", {class:"section-h"}, h("h2", {}, "Daily corrective-action tracking"), h("span", {class:"sub"}, "Every NC from a checklist lands here. Close an item only after someone else verifies the fix.")),
    h("div", {class:"filters"},
      h("div", {class:"seg-f", role:"group", "aria-label":"Status filter"}, f("active", "Open"), f("overdue", "Overdue"), f("closed", "Closed"), f("all", "All")),
      h("select", {class:"input", style:"width:auto;min-height:40px", "aria-label":"Department", onchange:e => { S.actDept = e.target.value; render(true); }},
        h("option", {value:"all", selected:S.actDept === "all"}, "All departments"), DEPTS.map(d => h("option", {value:d.id, selected:S.actDept === d.id}, d.short))),
      h("span", {class:"spacer"}),
      myDepts().length ? h("button", {class:"btn primary", type:"button", onclick:() => { S.newAction = {dept: (S.actDept !== "all" && canEditData(S.actDept)) ? S.actDept : (homeDept() && canEditData(homeDept()) ? homeDept() : myDepts()[0].id), deficiency:"", safety:"", corrective:"", responsible:"", targetDate:addDays(today(), 1), urgent:false}; render(); }}, "New corrective action") : null),
    S.newAction ? newActionForm() : null,
    list.length ? h("div", {class:"stack", style:"gap:8px"}, list.map(actionCard)) : h("div", {class:"empty"}, S.actFilter === "active" ? "No open corrective actions. Findings marked NC on a checklist appear here automatically." : "Nothing matches this filter."));
}
function newActionForm(){
  const d = S.newAction, err = S.errors["new-action"];
  const inp = (fld, label, ta, type) => h("div", {class:"field"}, h("label", {for:"na-" + fld}, label), h(ta ? "textarea" : "input", {class:"input", id:"na-" + fld, type:type || null, value:d[fld], oninput:e => { d[fld] = e.target.value; }}));
  return h("section", {class:"panel stack", style:"gap:12px"},
    h("h2", {style:"font-size:16px"}, "New corrective action"),
    h("p", {class:"note", style:"margin:0"}, "For findings that did not come from a daily checklist (a family concern, a walk-through, an incident review). Use room numbers or initials, not resident names."),
    h("div", {class:"grid2"},
      h("div", {class:"field"}, h("label", {for:"na-dept"}, "Department"), h("select", {class:"input", id:"na-dept", onchange:e => { d.dept = e.target.value; }}, myDepts().map(x => h("option", {value:x.id, selected:d.dept === x.id}, x.short)))),
      inp("responsible", "Person responsible")),
    inp("deficiency", "Deficiency identified", true),
    h("label", {class:"check"}, h("input", {type:"checkbox", checked:d.urgent, onchange:e => { d.urgent = e.target.checked; }}), "Immediate resident-safety concern (escalate now)"),
    h("div", {class:"grid2"}, inp("safety", "Immediate safety measures", true), inp("corrective", "Corrective action required", true)),
    h("div", {class:"grid2"}, inp("targetDate", "Target completion date", false, "date")),
    err ? h("div", {class:"err"}, err) : null,
    h("div", {class:"row"},
      h("button", {class:"btn primary", type:"button", onclick:() => {
        if (!d.deficiency.trim()) { S.errors["new-action"] = "Describe the deficiency."; render(true); return; }
        delete S.errors["new-action"];
        const id = today() + "_" + d.dept + "_m" + Math.random().toString(36).slice(2, 8);
        writeDoc("actions", id, {dept:d.dept, date:today(), item:null, itemText:"", status:"Open", createdAt:new Date().toISOString(), createdBy:S.meId || null, source:"manual",
          deficiency:d.deficiency.trim(), safety:d.safety.trim(), corrective:d.corrective.trim(), responsible:d.responsible.trim(), targetDate:d.targetDate || "", urgent:!!d.urgent});
        S.newAction = null; toast("Corrective action added."); render();
      }}, "Add corrective action"),
      h("button", {class:"btn", type:"button", onclick:() => { S.newAction = null; render(); }}, "Cancel")));
}
function actionCard(a){
  const open = S.openAction === a.id, dep = DEPT[a.dept];
  const ro = !canEditData(a.dept);
  const card = h("article", {class:"act" + (a.urgent && a.status !== "Closed" ? " urgent" : ""), id:"act-" + a.id},
    h("button", {class:"act-sum", type:"button", "aria-expanded": open ? "true" : "false", onclick:() => { S.openAction = open ? null : a.id; render(); }},
      h("span", {class:"chip " + (a.status === "Closed" ? "ok" : a.status === "In Progress" ? "warn" : "bad")}, a.status || "Open"),
      a.urgent && a.status !== "Closed" ? h("span", {class:"chip urgent"}, "Resident safety") : null,
      h("span", {class:"t"}, a.deficiency || "(no description)"),
      h("span", {class:"note"}, (dep ? dep.short : a.dept) + (a.item ? " #" + a.item : "") + " · found " + (a.date ? fmtShort(a.date) : "")),
      a.targetDate ? h("span", {class:"chip " + (isOverdue(a) ? "bad" : "plain")}, (isOverdue(a) ? "Overdue · " : "Due ") + fmtShort(a.targetDate)) : null,
      a.responsible ? h("span", {class:"note"}, a.responsible) : null));
  if (!open) return card;
  const set = (fld, val) => writeDoc("actions", a.id, {[fld]: val});
  const inp = (fld, label, ta, type) => h("div", {class:"field"}, h("label", {for:"a-" + a.id + "-" + fld}, label),
    h(ta ? "textarea" : "input", {class:"input", id:"a-" + a.id + "-" + fld, type:type || null, value:a[fld] || "", disabled:ro, onchange:e => set(fld, e.target.value.trim())}));
  const err = S.errors["act-" + a.id];
  card.append(h("div", {class:"act-body"},
    a.itemText ? h("div", {class:"note"}, "Checklist item: " + a.itemText) : null,
    h("div", {class:"grid2"},
      h("div", {class:"field"}, h("label", {}, "Department"), h("strong", {}, dep ? dep.name : a.dept)),
      h("div", {class:"field"}, h("label", {for:"a-" + a.id + "-status"}, "Status"),
        h("select", {class:"input", id:"a-" + a.id + "-status", disabled:ro, onchange:e => {
          const v = e.target.value;
          if (v === "Closed" && !(a.verifiedBy || "").trim()) { S.errors["act-" + a.id] = "Enter who verified the fix before closing."; e.target.value = a.status || "Open"; render(true); return; }
          delete S.errors["act-" + a.id];
          writeDoc("actions", a.id, v === "Closed" ? {status:v, closedAt:new Date().toISOString(), actualDate:a.actualDate || today()} : {status:v});
        }}, STATUSES.map(s => h("option", {value:s, selected:(a.status || "Open") === s}, s))))),
    inp("deficiency", "Deficiency identified", true),
    h("label", {class:"check"}, h("input", {type:"checkbox", checked:!!a.urgent, disabled:ro, onchange:e => set("urgent", e.target.checked)}), "Immediate resident-safety concern"),
    h("div", {class:"grid2"}, inp("safety", "Immediate safety measures", true), inp("corrective", "Corrective action required", true)),
    h("div", {class:"grid2"}, inp("responsible", "Person responsible"), inp("targetDate", "Target completion date", false, "date")),
    h("div", {class:"grid2"}, inp("actualDate", "Actual completion date", false, "date"), inp("verifiedBy", "Verified by")),
    err ? h("div", {class:"err"}, err) : null,
    h("div", {class:"note"}, "Logged " + fmtStamp(a.createdAt) + (a.updatedAt ? " · last change " + fmtStamp(a.updatedAt) : "") + (a.closedAt ? " · closed " + fmtStamp(a.closedAt) : ""))));
  return card;
}

/* ------------------------------------------------------ scheduled audits -- */
function auditState(a){
  const t = today(), key = periodKey(a, t), doc = auditDoc(a, key);
  if (a.freq === "shift") return null;
  let due = "", overdue = false;
  if (a.freq === "week") due = "Due by " + fmtDay(weekEnd(t));
  if (a.freq === "month") due = "Due by end of " + monthName(key).split(" ")[0];
  if (a.freq === "quarter") due = "Due by end of " + key.replace("-Q", " Q");
  if (a.freq === "month5") { const day = +t.slice(8); due = "Due by the 5th"; overdue = !doc && day > 5; }
  const prev = prevPeriod(a, key), prevDoc = auditDoc(a, prev);
  const prevMissed = a.freq !== "month5" && !prevDoc && S.loaded.audits;
  return {key, doc, due, overdue, prev, prevMissed};
}
function auditsDueCount(){
  let n = 0;
  for (const a of visibleAudits()) {
    if (a.freq === "shift") { n += shiftSlots(a).filter(s => !s.doc && s.started).length; continue; }
    const st = auditState(a); if (!st.doc) n++;
  }
  return n;
}
function auditsOverdueCount(){
  let n = 0;
  for (const a of visibleAudits()) {
    if (a.freq === "shift") { n += shiftSlots(a).filter(s => !s.doc && s.ended).length; continue; }
    if (auditState(a).overdue) n++;
  }
  return n;
}
function shiftSlots(a){
  const t = today(), hr = hourNow(), y = addDays(t, -1);
  // Night shift runs 11 PM to 7 AM. Before 7 AM the open night shift belongs to yesterday's date.
  const slots = [];
  if (hr < 7) slots.push({date:y, sh:SHIFTS[2], started:true, ended:false});
  for (const sh of SHIFTS) {
    if (hr < 7 && sh.k === "N") continue;
    const startH = sh.k === "D" ? 7 : sh.k === "E" ? 15 : 23;
    slots.push({date:t, sh, started: hr >= startH, ended: hr >= sh.ends});
  }
  return slots.map(s => Object.assign(s, {doc: S.audits.get(a.id + "_" + s.date + "-" + s.sh.k) || null}));
}
function viewAudits(){
  return h("div", {class:"stack"}, noDbNotice(),
    h("div", {class:"section-h"}, h("h2", {}, "Additional compliance checks by frequency"), h("span", {class:"sub"}, "Scheduled audits that supplement the daily checklists so responsibilities do not get overlooked.")),
    h("div", {class:"audits"}, visibleAudits().map(auditCard)),
    h("p", {class:"note"}, "These are a combination of regulatory obligations, documentation reviews, and The Pointe's internal quality expectations. Not every item is required by Tennessee law at the listed frequency."));
}
function auditCard(a){
  const dep = DEPT[a.dept];
  const card = h("article", {class:"audit"},
    h("div", {class:"row"}, h("span", {class:"eyebrow"}, a.label), h("span", {class:"spacer"}), h("span", {class:"chip plain"}, dep.short)),
    h("h3", {}, a.text));
  if (a.freq === "shift") {
    card.append(h("div", {class:"slots"}, shiftSlots(a).map(s => {
      const slotKey = s.date + "-" + s.sh.k;
      return h("div", {class:"slot"},
        h("strong", {}, s.sh.name + (s.date !== today() ? " (" + fmtShort(s.date) + ")" : "")),
        s.doc ? h("span", {class:"chip " + (s.doc.result === "Issues found" ? "bad" : "ok")}, s.doc.result === "Issues found" ? "Issues found" : "Done") : !s.started ? h("span", {class:"chip plain"}, "Later") : s.ended ? h("span", {class:"chip bad"}, "Missed") : h("span", {class:"chip warn"}, "Due now"),
        s.doc ? h("span", {class:"note"}, (s.doc.doneBy || "") + " · " + fmtTime(s.doc.doneAt)) : (s.started && canEditData(a.dept) ? auditForm(a, slotKey, s.date, true) : null));
    })));
    return card;
  }
  const st = auditState(a);
  // native append() would print empty slots as the text "null", so drop them first
  card.append(...[h("div", {class:"row"},
    h("strong", {}, periodLabel(a, st.key)),
    st.doc ? h("span", {class:"chip " + (st.doc.result === "Issues found" ? "bad" : "ok")}, (st.doc.result || "Done") + " · " + (st.doc.doneBy || "") + " · " + fmtShort(st.doc.doneDate || today()))
      : h("span", {class:"chip " + (st.overdue ? "bad" : "warn")}, st.overdue ? "Overdue" : st.due)),
    st.doc && st.doc.note ? h("div", {class:"note"}, st.doc.note) : null,
    !st.doc && st.prevMissed ? h("div", {class:"err"}, periodLabel(a, st.prev) + " was not logged.") : null,
    !st.doc && canEditData(a.dept) ? auditForm(a, st.key, today(), false) : null,
    history(a, st.key)].filter(Boolean));
  return card;
}
function auditForm(a, key, date, compact){
  const did = a.id + "_" + key;
  const d = S.auditDrafts[did] || (S.auditDrafts[did] = {doneBy:"", result:"No issues", note:""});
  const err = S.errors["aud-" + did];
  return h("div", {class:"stack", style:"gap:8px"},
    h("input", {class:"input", placeholder:"Completed by (name)", "aria-label":"Completed by", value:d.doneBy, oninput:e => { d.doneBy = e.target.value; }}),
    compact ? null : h("select", {class:"input", "aria-label":"Result", onchange:e => { d.result = e.target.value; }}, ["No issues", "Issues found"].map(v => h("option", {value:v, selected:d.result === v}, v))),
    compact ? null : h("input", {class:"input", placeholder:"Note (optional)", "aria-label":"Note", value:d.note, oninput:e => { d.note = e.target.value; }}),
    err ? h("div", {class:"err"}, err) : null,
    h("div", {class:"row"},
      h("button", {class:"btn small primary", type:"button", onclick:() => {
        if (!d.doneBy.trim()) { S.errors["aud-" + did] = "Enter who completed it."; render(true); return; }
        delete S.errors["aud-" + did];
        writeDoc("audits", did, {audit:a.id, period:key, dept:a.dept, doneBy:d.doneBy.trim(), result:d.result, note:d.note.trim(), doneAt:new Date().toISOString(), doneDate:today(), userId:S.meId || null});
        delete S.auditDrafts[did]; toast("Logged: " + a.text.split(",")[0] + ".");
      }}, "Mark complete"),
      compact ? h("button", {class:"btn small", type:"button", onclick:() => {
        if (!d.doneBy.trim()) { S.errors["aud-" + did] = "Enter who completed it."; render(true); return; }
        writeDoc("audits", did, {audit:a.id, period:key, dept:a.dept, doneBy:d.doneBy.trim(), result:"Issues found", note:"", doneAt:new Date().toISOString(), doneDate:today(), userId:S.meId || null});
        delete S.auditDrafts[did]; toast("Logged with issues. Add a corrective action for each one.");
      }}, "Issues found") : null));
}
function history(a, key){
  const keys = []; let k = key; for (let i = 0; i < 6; i++) { k = prevPeriod(a, k); keys.unshift(k); }
  return h("div", {class:"hist", title:"Previous periods, oldest first"}, h("span", {}, "Last 6:"),
    keys.map(k2 => { const d = auditDoc(a, k2); return h("i", {class: d ? (d.result === "Issues found" ? "issue" : "done") : "miss", title: periodLabel(a, k2) + (d ? " · " + (d.result || "Done") + " · " + (d.doneBy || "") : " · not logged")}); }));
}

/* --------------------------------------------------------- survey binder -- */
function binderData(){
  const b = S.binder;
  const checks = new Map(S.checks);
  if (b.extra) for (const [id, c] of b.extra) if (!checks.has(id)) checks.set(id, c);
  const days = []; for (let d = b.from; d <= b.to; d = addDays(d, 1)) days.push(d);
  const rows = [];
  for (const d of days) for (const dep of DEPTS) {
    const c = checks.get(checkId(d, dep.id));
    const marks = (c && c.marks) || {};
    let C=0, NC=0, NA=0; dep.items.forEach((_, i) => { const m = marks[i+1]; if (m==="C") C++; else if (m==="NC") NC++; else if (m==="NA") NA++; });
    rows.push({date:d, dept:dep, c, marks, C, NC, NA, answered:C+NC+NA});
  }
  const acts = actionList().filter(a => (a.date >= b.from && a.date <= b.to) || (a.status !== "Closed" && a.date < b.from)).sort((x, y) => String(x.date).localeCompare(String(y.date)));
  const auds = [...S.audits.values()].filter(x => x.doneDate >= b.from && x.doneDate <= b.to).sort((x, y) => String(x.doneAt).localeCompare(String(y.doneAt)));
  return {days, rows, acts, auds};
}
async function loadBinderRange(){
  const b = S.binder, since = addDays(today(), -WINDOW_DAYS);
  if (!S.sb || b.from >= since) { b.extra = null; render(); return; }
  b.loading = true; render();
  try {
    const {data, error} = await S.sb.from("checks").select("id,data").gte("day", b.from).lte("day", b.to).limit(1000);
    if (error) throw error;
    b.extra = new Map(data.map(r => [r.id, clone(r.data)]));
  } catch (e) { toast("Couldn't load older records. Try a shorter range."); }
  b.loading = false; render();
}
function viewBinder(){
  const b = S.binder, t = today();
  const {days, rows, acts, auds} = binderData();
  const done = rows.filter(r => r.c && r.c.submitted).length;
  const C = rows.reduce((n, r) => n + r.C, 0), NC = rows.reduce((n, r) => n + r.NC, 0), NA = rows.reduce((n, r) => n + r.NA, 0);
  const preset = (label, n) => h("button", {class:"btn small", type:"button", onclick:() => { b.from = addDays(t, -(n - 1)); b.to = t; loadBinderRange(); }}, label);
  return h("div", {class:"stack"}, noDbNotice(),
    h("div", {class:"section-h"}, h("h2", {}, "Survey binder"), h("span", {class:"sub"}, "Show this to surveyors on your phone, or download a printable packet.")),
    h("section", {class:"panel stack", style:"gap:12px"},
      h("div", {class:"row"}, preset("Today", 1), preset("Last 7 days", 7), preset("Last 30 days", 30), preset("Last 90 days", 90)),
      h("div", {class:"grid2"},
        h("div", {class:"field"}, h("label", {for:"b-from"}, "From"), h("input", {class:"input", id:"b-from", type:"date", value:b.from, max:t, onchange:e => { if (e.target.value) { b.from = e.target.value; if (b.from > b.to) b.to = b.from; loadBinderRange(); } }})),
        h("div", {class:"field"}, h("label", {for:"b-to"}, "To"), h("input", {class:"input", id:"b-to", type:"date", value:b.to, max:t, onchange:e => { if (e.target.value) { b.to = e.target.value; if (b.to < b.from) b.from = b.to; render(true); } }}))),
      h("label", {class:"check", style:"font-weight:500"}, h("input", {type:"checkbox", checked:b.detail, onchange:e => { b.detail = e.target.checked; }}), "Include every checklist item-by-item in the packet (one page per department per day)"),
      h("div", {class:"row"},
        h("button", {class:"btn primary", type:"button", onclick:downloadPacket}, "Download surveyor packet (.html, printable)"),
        h("button", {class:"btn", type:"button", onclick:downloadChecksCsv}, "Checklist data (.csv)"),
        h("button", {class:"btn", type:"button", onclick:downloadActionsCsv}, "Corrective actions (.csv)")),
      h("p", {class:"note", style:"margin:0"}, "To print from a phone: open the downloaded packet, tap Share, then Print. On a computer, open it in a browser and print or save as PDF."),
      b.loading ? h("div", {class:"note"}, "Loading older records…") : null),
    h("section", {class:"kpis k4"},
      kpi(done + "/" + rows.length, "Checklists submitted"),
      kpi(C + NC ? pct(C, C + NC) + "%" : "—", "Compliance rate"),
      kpi(NC, "Items needing correction"),
      kpi(acts.filter(a => a.status === "Closed").length + "/" + acts.length, "Corrective actions closed")),
    h("section", {},
      h("div", {class:"section-h"}, h("h2", {}, "Checklist completion log"), h("span", {class:"sub"}, fmtDay(b.from, {year:"numeric"}) + " to " + fmtDay(b.to, {year:"numeric"}))),
      h("div", {class:"tbl-wrap"}, h("table", {class:"tbl"},
        h("thead", {}, h("tr", {}, ["Date","Department","Reviewer","C","NC","NA","Completed","Urgent escalated","Signed","Submitted"].map(x => h("th", {}, x)))),
        h("tbody", {}, rows.slice().reverse().filter(r => r.answered || r.c).map(r => h("tr", {},
          h("td", {}, fmtShort(r.date)), h("td", {}, r.dept.short), h("td", {}, (r.c && r.c.reviewer) || ""),
          h("td", {class:"c num"}, r.C), h("td", {class:"c num"}, r.NC), h("td", {class:"c num"}, r.NA),
          h("td", {}, r.answered === r.dept.items.length ? "Yes" : "Partial"), h("td", {}, (r.c && r.c.urgentEscalated) || ""),
          h("td", {}, (r.c && r.c.signature) || ""), h("td", {}, r.c && r.c.submitted ? fmtStamp(r.c.submittedAt) + (isLate(r.c, r.date) ? " (late)" : "") : "Not submitted"))))))),
    h("section", {},
      h("div", {class:"section-h"}, h("h2", {}, "Corrective-action log"), h("span", {class:"sub"}, "Found in this range, plus anything older still open")),
      acts.length ? h("div", {class:"tbl-wrap"}, h("table", {class:"tbl"},
        h("thead", {}, h("tr", {}, ["Found","Department","Deficiency","Immediate safety measures","Corrective action","Responsible","Target","Actual","Verified by","Status"].map(x => h("th", {}, x)))),
        h("tbody", {}, acts.map(a => h("tr", {}, h("td", {}, fmtShort(a.date)), h("td", {}, DEPT[a.dept] ? DEPT[a.dept].short : a.dept), h("td", {}, a.deficiency || ""), h("td", {}, a.safety || ""), h("td", {}, a.corrective || ""), h("td", {}, a.responsible || ""), h("td", {}, a.targetDate ? fmtShort(a.targetDate) : ""), h("td", {}, a.actualDate ? fmtShort(a.actualDate) : ""), h("td", {}, a.verifiedBy || ""), h("td", {}, a.status || "Open"))))))
        : h("div", {class:"empty"}, "No corrective actions in this range.")),
    h("section", {},
      h("div", {class:"section-h"}, h("h2", {}, "Scheduled audit log")),
      auds.length ? h("div", {class:"tbl-wrap"}, h("table", {class:"tbl"},
        h("thead", {}, h("tr", {}, ["Completed","Audit","Period","Department","By","Result","Note"].map(x => h("th", {}, x)))),
        h("tbody", {}, auds.map(x => { const a = AUDITS.find(y => y.id === x.audit) || {text:x.audit, freq:"day"}; return h("tr", {}, h("td", {}, fmtStamp(x.doneAt)), h("td", {}, a.text), h("td", {}, a.freq === "shift" ? x.period : periodLabel(a, x.period)), h("td", {}, DEPT[x.dept] ? DEPT[x.dept].short : ""), h("td", {}, x.doneBy || ""), h("td", {}, x.result || ""), h("td", {}, x.note || "")); }))))
        : h("div", {class:"empty"}, "No scheduled audits logged in this range.")));
}
function save(filename, data){
  try {
    const type = filename.endsWith(".csv") ? "text/csv" : "text/html";
    const url = URL.createObjectURL(new Blob([data], {type: type + ";charset=utf-8"}));
    const a = document.createElement("a"); a.href = url; a.download = filename; a.rel = "noopener";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    toast("Downloaded " + filename);
  } catch (e) { toast("Couldn't create the file on this device."); }
}
const CONF_NOTICE = "CONFIDENTIAL: contains protected health information (PHI). For authorized quality-improvement and survey use only. Do not copy, forward or leave unattended. Store securely and destroy by shredding.";
function csv(rows){ return rows.map(r => r.map(v => { const s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(",")).join("\r\n"); }
function downloadChecksCsv(){
  const {rows} = binderData(); const out = [["Date","Department","Section","Item #","Item","Result","Reviewer","Signed","Submitted"]];
  for (const r of rows) { if (!r.c) continue; r.dept.items.forEach((text, i) => out.push([r.date, r.dept.name, (secOf(r.dept, i) || {}).title || "", i+1, text, r.marks[i+1] || "", r.c.reviewer || "", r.c.signature || "", r.c.submitted ? fmtStamp(r.c.submittedAt) : ""])); }
  save("kirby-gate-checklists_" + S.binder.from + "_to_" + S.binder.to + ".csv", csv([[CONF_NOTICE]].concat(out)));
  logAccess("export", "checklists CSV " + S.binder.from + " to " + S.binder.to);
}
function downloadActionsCsv(){
  const {acts} = binderData(); const out = [["Found","Department","Checklist item","Deficiency identified","Immediate safety measures","Corrective action required","Person responsible","Target completion date","Actual completion date","Verified by","Status","Resident safety"]];
  for (const a of acts) out.push([a.date, DEPT[a.dept] ? DEPT[a.dept].name : a.dept, a.item ? "#" + a.item + " " + (a.itemText || "") : "", a.deficiency, a.safety, a.corrective, a.responsible, a.targetDate, a.actualDate, a.verifiedBy, a.status, a.urgent ? "Yes" : "No"]);
  save("kirby-gate-corrective-actions_" + S.binder.from + "_to_" + S.binder.to + ".csv", csv([[CONF_NOTICE]].concat(out)));
  logAccess("export", "corrective actions CSV " + S.binder.from + " to " + S.binder.to);
}
function downloadPacket(){
  const b = S.binder, {rows, acts, auds} = binderData();
  logAccess("print", "survey packet " + b.from + " to " + b.to);
  const C = rows.reduce((n, r) => n + r.C, 0), NC = rows.reduce((n, r) => n + r.NC, 0), NA = rows.reduce((n, r) => n + r.NA, 0);
  const done = rows.filter(r => r.c && r.c.submitted).length;
  const range = fmtDay(b.from, {year:"numeric"}) + " – " + fmtDay(b.to, {year:"numeric"});
  const td = v => "<td>" + esc(v) + "</td>";
  let html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(BRAND.product) + ' Packet — ' + esc(BRAND.facility) + '</title><style>' +
    'body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;font-size:12px}h1{font-size:20px;margin:0}h2{font-size:15px;margin:22px 0 8px;border-bottom:2px solid #111;padding-bottom:3px}' +
    '.band{background:#111;color:#fff;padding:14px 18px;margin-bottom:14px}.band .s{font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.8}' +
    'table{border-collapse:collapse;width:100%;margin-bottom:8px}th,td{border:1px solid #999;padding:4px 6px;text-align:left;vertical-align:top}th{background:#eee;font-size:11px}' +
    '.kp{display:flex;gap:12px;flex-wrap:wrap}.kp div{border:1px solid #999;padding:8px 12px}.kp b{display:block;font-size:18px}.c{text-align:center}.nc{background:#fde4d4;font-weight:bold}' +
    '.pg{page-break-before:always}.small{font-size:10.5px;color:#444}.conf{border:2px solid #111;padding:6px 10px;margin:0 0 12px;font-size:11px;font-weight:bold}@media print{body{margin:0}.band{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>';
  html += '<div class="conf">' + esc(CONF_NOTICE) + '</div>';
  html += '<div class="band"><div class="s">' + esc(BRAND.facility + (BRAND.address ? " · " + BRAND.address : "")) + '</div><h1>' + esc(BRAND.product) + ' Packet</h1><div>' + esc(range) + '</div></div>';
  html += '<p class="small">Generated ' + esc(fmtStamp(new Date().toISOString())) + ' (Central) from the ' + esc(BRAND.product) + ' system. Daily Departmental Compliance Checklists: C = compliant, NC = needs correction, NA = not applicable. Every NC is documented in the corrective-action log.</p>';
  html += '<div class="kp"><div><b>' + done + '/' + rows.length + '</b>checklists submitted</div><div><b>' + (C + NC ? pct(C, C + NC) + '%' : '—') + '</b>compliance rate</div><div><b>' + C + ' / ' + NC + ' / ' + NA + '</b>C / NC / NA</div><div><b>' + acts.filter(a => a.status === "Closed").length + '/' + acts.length + '</b>corrective actions closed</div></div>';
  html += '<h2>Checklist completion log</h2><table><tr><th>Date</th><th>Department</th><th>Reviewer</th><th>C</th><th>NC</th><th>NA</th><th>Completed</th><th>Urgent escalated</th><th>Department head signature</th><th>Time submitted</th></tr>';
  for (const r of rows) if (r.c || r.answered) html += '<tr>' + td(fmtDay(r.date)) + td(r.dept.name) + td(r.c && r.c.reviewer) + '<td class="c">' + r.C + '</td><td class="c' + (r.NC ? ' nc' : '') + '">' + r.NC + '</td><td class="c">' + r.NA + '</td>' + td(r.answered === r.dept.items.length ? "Yes" : "Partial") + td(r.c && r.c.urgentEscalated) + td(r.c && r.c.signature) + td(r.c && r.c.submitted ? fmtStamp(r.c.submittedAt) + (isLate(r.c, r.date) ? " (late)" : "") : "Not submitted") + '</tr>';
  html += '</table>';
  html += '<h2>Daily corrective-action tracking</h2>';
  if (acts.length) {
    html += '<table><tr><th>Found</th><th>Department</th><th>Deficiency identified</th><th>Immediate safety measures</th><th>Corrective action required</th><th>Person responsible</th><th>Target</th><th>Actual</th><th>Verified by</th><th>Status</th></tr>';
    for (const a of acts) html += '<tr>' + td(fmtShort(a.date)) + td((DEPT[a.dept] ? DEPT[a.dept].short : a.dept) + (a.item ? " #" + a.item : "")) + td((a.urgent ? "[RESIDENT SAFETY] " : "") + (a.deficiency || "")) + td(a.safety) + td(a.corrective) + td(a.responsible) + td(a.targetDate ? fmtShort(a.targetDate) : "") + td(a.actualDate ? fmtShort(a.actualDate) : "") + td(a.verifiedBy) + td(a.status || "Open") + '</tr>';
    html += '</table>';
  } else html += '<p>No corrective actions in this range.</p>';
  html += '<h2>Additional compliance checks by frequency</h2>';
  if (auds.length) {
    html += '<table><tr><th>Completed</th><th>Required review</th><th>Period</th><th>Department</th><th>By</th><th>Result</th><th>Note</th></tr>';
    for (const x of auds) { const a = AUDITS.find(y => y.id === x.audit) || {text:x.audit, freq:"day"}; html += '<tr>' + td(fmtStamp(x.doneAt)) + td(a.text) + td(a.freq === "shift" ? x.period : periodLabel(a, x.period)) + td(DEPT[x.dept] ? DEPT[x.dept].short : "") + td(x.doneBy) + td(x.result) + td(x.note) + '</tr>'; }
    html += '</table>';
  } else html += '<p>No scheduled audits logged in this range.</p>';
  if (b.detail) {
    for (const r of rows) {
      if (!r.c) continue;
      html += '<div class="pg"><div class="conf">' + esc(CONF_NOTICE) + '</div><div class="band"><div class="s">' + esc(BRAND.facility) + ' · Daily Departmental Compliance Checklist</div><h1>' + esc(r.dept.name) + '</h1><div>Responsible lead: ' + esc(r.dept.lead) + '</div></div>';
      html += '<p>Date: <b>' + esc(fmtDay(r.date, {year:"numeric"})) + '</b> &nbsp; Reviewer: <b>' + esc(r.c.reviewer || "") + '</b></p><table><tr><th>#</th><th>Compliance item</th><th>C</th><th>NC</th><th>NA</th></tr>';
      r.dept.items.forEach((text, i) => { const m = r.marks[i+1]; const sh = (r.dept.sections || []).find(x => x.start === i); if (sh && r.dept.sections.length > 1) html += '<tr><th colspan="5">' + esc(sh.title) + '</th></tr>'; html += '<tr><td>' + (i+1) + '</td>' + td(text) + '<td class="c">' + (m === "C" ? "X" : "") + '</td><td class="c' + (m === "NC" ? " nc" : "") + '">' + (m === "NC" ? "X" : "") + '</td><td class="c">' + (m === "NA" ? "X" : "") + '</td></tr>'; });
      html += '</table>';
      const f = acts.filter(a => a.date === r.date && a.dept === r.dept.id);
      html += '<p><b>Findings / corrective actions / responsible person / target date</b></p>' + (f.length ? '<table>' + f.map(a => '<tr>' + td(a.item ? "#" + a.item : "") + td(a.deficiency) + td(a.corrective) + td(a.responsible) + td(a.targetDate ? fmtShort(a.targetDate) : "") + td(a.status) + '</tr>').join("") + '</table>' : '<p>None.</p>');
      html += '<p>Checklist completed: <b>' + (r.answered === r.dept.items.length ? "Yes" : "Partial") + '</b> &nbsp; Issues identified: <b>' + r.NC + '</b> &nbsp; Urgent issue escalated: <b>' + esc(r.c.urgentEscalated || "") + '</b></p>';
      html += '<p>Department head signature: <b>' + esc(r.c.signature || "") + '</b> &nbsp; Time submitted: <b>' + esc(r.c.submitted ? fmtStamp(r.c.submittedAt) : "Not submitted") + '</b></p></div>';
    }
  }
  html += '<p class="conf">' + esc(CONF_NOTICE) + ' Printed by ' + esc(S.meName || "") + ' on ' + esc(fmtStamp(new Date().toISOString())) + ' (Central).</p>';
  html += '</body></html>';
  save(BRAND.fileSlug + "_" + b.from + "_to_" + b.to + ".html", html);
}

/* ---------------------------------------------------------------- boot -- */
let wake = null;
async function keepAwake(){ try { if (navigator.wakeLock && document.visibilityState === "visible" && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); } } catch(e) { wake = null; } }
document.addEventListener("visibilitychange", keepAwake);
setInterval(() => { if (S.lastDay !== today()) { const old = S.lastDay; S.lastDay = today(); if (old && S.date === old) S.date = S.lastDay; render(); } else render(); }, 60000);
S.lastDay = today();

/* ------------------------------------------------------------- sign-in -- */
const STAFF_DOMAIN = (window.KG_SURVEY && window.KG_SURVEY.staffDomain) || "@staff.kirbygateliving.com";
const IS_DEMO = !!(window.KG_SURVEY && window.KG_SURVEY.demo);
const HOME_PATH = (window.KG_SURVEY && window.KG_SURVEY.homePath) || (IS_DEMO ? "/rounds/demo/" : "/rounds/");
/* HIPAA safeguards (not in the demo):
   - access log: opening the app, each screen viewed, and every print/export are recorded
     in the database (log_access), readable by leadership only;
   - automatic sign-out after 15 minutes without a tap or keypress, also checked when the
     phone wakes up or the app is reopened. */
const IDLE_LIMIT_MS = 15 * 60 * 1000;
function logAccess(event, detail){
  if (IS_DEMO || !S.sb || !S.profile || S.profile.mustChangePassword) return Promise.resolve();
  return S.sb.rpc("log_access", {p_event: event, p_detail: detail || null, p_user_agent: (navigator.userAgent || "").slice(0, 300)}).then(() => {}, () => {});
}
let lastMark = 0;
function markActive(force){ const n = Date.now(); if (force === true || n - lastMark > 15000) { lastMark = n; lsSet("kg-last-active", String(n)); } }
function idleTooLong(){ const t = Number(lsGet("kg-last-active") || 0); return !!t && Date.now() - t > IDLE_LIMIT_MS; }
async function autoLock(){
  if (IS_DEMO || S.locking) return; S.locking = true;
  try { await S.sb.rpc("log_access", {p_event:"auto_lock", p_detail:null, p_user_agent:null}); } catch (e) {}
  lsSet("kg-locked", "1"); lsSet("kg-last-active", null);
  try { await S.sb.auth.signOut(); } catch (e) {}
  location.replace(HOME_PATH);
}
function checkIdle(){ if (!IS_DEMO && S.profile && idleTooLong()) autoLock(); }
if (!IS_DEMO) {
  ["pointerdown", "keydown", "touchstart", "wheel"].forEach(t => window.addEventListener(t, markActive, {passive:true, capture:true}));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkIdle(); });
  window.addEventListener("pageshow", checkIdle);
  setInterval(checkIdle, 30000);
}
function loginEmail(u){ u = u.trim().toLowerCase(); return u.includes("@") ? u : u + STAFF_DOMAIN; }
function field(id, label, attrs){ return h("div", {class:"field"}, h("label", {for:id}, label), h("input", Object.assign({class:"input", id}, attrs))); }
function showPw(ids){ return h("label", {class:"check", style:"font-weight:500"}, h("input", {type:"checkbox", onchange:e => ids.forEach(i => { const el = document.getElementById(i); if (el) el.type = e.target.checked ? "text" : "password"; })}), "Show password"); }

function viewNotConfigured(){
  return h("section", {class:"panel stack auth"},
    h("h2", {}, BRAND.product + " isn't connected yet"),
    h("p", {class:"note", style:"margin:0"}, "Ownership still needs to connect the database. If you see this after setup, reload the page."));
}
function viewLogin(){
  if (!S.authChecked) return h("section", {class:"panel auth"}, h("p", {class:"note", style:"margin:0"}, "Checking your sign-in…"));
  const err = h("div", {class:"err", id:"li-err", role:"alert"}, S.errors.login || "");
  const btn = h("button", {class:"btn primary", type:"submit", style:"width:100%"}, "Sign in");
  const form = h("form", {class:"panel stack auth", novalidate:true, onsubmit: async e => {
    e.preventDefault();
    const u = document.getElementById("li-user").value, p = document.getElementById("li-pass").value;
    if (!u.trim() || !p) { err.textContent = "Enter your username and password."; return; }
    btn.disabled = true; btn.textContent = "Signing in…"; err.textContent = "";
    let res;
    try { res = await S.sb.auth.signInWithPassword({email: loginEmail(u), password: p}); }
    catch (ex) { res = {error: {message: String(ex)}}; }
    if (res.error) {
      btn.disabled = false; btn.textContent = "Sign in";
      err.textContent = /invalid/i.test(res.error.message || "") ? "That username and password don't match. Check them and try again."
        : /rate|too many/i.test(res.error.message || "") ? "Too many tries. Wait a few minutes, then try again."
        : isNetErr(res.error) ? "Can't reach the server. Check your connection and try again." : res.error.message;
      return;
    }
    delete S.errors.login;
    lsSet("kg-last-user", u.trim().toLowerCase());
    await loadProfile();
  }},
    h("h2", {}, "Sign in"),
    !IS_DEMO && lsGet("kg-locked") ? h("div", {class:"submitted", role:"status"}, "For privacy, you were signed out after 15 minutes without activity. Sign in again to continue.") : null,
    h("p", {class:"note", style:"margin:0"}, "For " + BRAND.facilityShort + " department heads and leadership. Use the username and password you were given."),
    IS_DEMO ? h("div", {class:"panel note"}, "Demo logins (password demo for each): partner (leadership view), don (Director of Nursing), dietary (Dietary Director).") : null,
    field("li-user", "Username", {type:"text", name:"username", value: IS_DEMO ? "" : (lsGet("kg-last-user") || ""), autocomplete:"username", autocapitalize:"none", autocorrect:"off", spellcheck:"false", required:true}),
    field("li-pass", "Password", {type:"password", name:"password", autocomplete:"current-password", required:true}),
    showPw(["li-pass"]), err, btn,
    h("p", {class:"auth-warning", role:"note"}, "Authorized " + BRAND.facilityShort + " staff only. This system contains confidential resident health information. Use is monitored and recorded. Unauthorized access is prohibited and may be reported."),
    h("p", {class:"note", style:"margin:0"}, IS_DEMO ? "Forgot your password? Ask ownership to reset it." : "Forgot your password? Ask ownership to reset it. For privacy, Daily Rounds signs you out after 15 minutes without activity."));
  return form;
}
function passwordForm(forced){
  const err = h("div", {class:"err", role:"alert"});
  const btn = h("button", {class:"btn primary", type:"submit"}, forced ? "Save my new password" : "Change password");
  return h("form", {class:"stack", style:"gap:12px", novalidate:true, onsubmit: async e => {
    e.preventDefault();
    const a = document.getElementById("pw-new").value, b = document.getElementById("pw-again").value;
    if (a.length < 8) { err.textContent = "Use at least 8 characters."; return; }
    if (a !== b) { err.textContent = "The two passwords don't match."; return; }
    btn.disabled = true; err.textContent = "";
    const {error} = await S.sb.auth.updateUser({password: a}).catch(ex => ({error: {message: String(ex)}}));
    if (error) {
      btn.disabled = false;
      err.textContent = /different/i.test(error.message || "") ? "Choose a password different from the one you were given." : isNetErr(error) ? "Can't reach the server. Try again." : error.message;
      return;
    }
    await S.sb.rpc("password_changed");
    S.profile.mustChangePassword = false;
    toast("Password saved.");
    if (forced) { route(); startSync(); } else render(true);
  }},
    h("input", {type:"text", name:"username", autocomplete:"username", value:S.profile ? S.profile.username : "", hidden:true, readonly:true}),
    field("pw-new", "New password", {type:"password", autocomplete:"new-password", minlength:"8"}),
    field("pw-again", "Type it again", {type:"password", autocomplete:"new-password", minlength:"8"}),
    showPw(["pw-new", "pw-again"]), err, btn);
}
/* ---------------------------------------------------------- disclosures -- */
/* Shown in full once to every person (they must agree before anything opens), again
   whenever TERMS_VERSION changes, and any time from the "Privacy & rules" link.
   Acceptance is recorded in the database (staff_terms) with date, time and device. */
const TERMS_VERSION = "2026-11-25";
const NOTICE_LINE = "Confidential: contains resident health information. Authorized staff only. Activity is logged.";
function disclosures(){
  const f = BRAND.facilityShort;
  return [
    ["Authorized use only", "Daily Rounds is for " + f + " staff who have been given access. Use only your own username. Never share your password or let anyone use the app while you are signed in. Leadership can turn off access at any time."],
    ["Confidential resident information", "Daily Rounds can contain protected health information (PHI) about residents, which is protected by HIPAA and Tennessee law. Look at and use it only to do your job, and only as much as you need. Do not copy, screenshot, photograph, forward, post or talk about it outside of work needs."],
    ["What to write", "Use room numbers or initials. Never write a resident's full name, date of birth or Social Security number, and do not add photos. Describe the problem and the fix, not the person."],
    ["Everything is recorded", "Daily Rounds records who signs in, which screens they open, every change they make, and every print or download, with the date, time and device. Leadership reviews these records. You should have no expectation of privacy when using this system."],
    ["Keep your device safe", "For privacy, Daily Rounds signs you out after 15 minutes without activity. Keep a passcode or screen lock on your phone, do not use public or shared computers, and report a lost or stolen phone the same day."],
    ["Report problems right away", "If you see information you should not see, send something to the wrong person, or think someone used your login, tell the Administrator or your supervisor the same day. Reporting quickly protects residents and you."],
    ["Records are official", "Entries are time-stamped by the server and cannot be backdated. Enter only what you actually checked. Making false entries is prohibited."],
    ["Not for emergencies", "Daily Rounds does not replace emergency procedures. If anyone is in danger, call 911 and follow the facility's emergency plan. Report urgent safety issues in person to the Administrator and the Director of Nursing; logging them here is not enough."],
    ["Not the medical record", "Daily Rounds is a compliance and quality-improvement tool. It is not a resident's medical record. Document resident care in the medical record system."],
    ["Consequences", "Breaking these rules can lead to discipline, up to and including losing your job, and may be reported to the authorities. HIPAA violations can carry civil and criminal penalties."],
    ["Information about you", "Daily Rounds keeps your name, username, role, departments and activity records to run the system and to show compliance. Compliance records are kept for at least six years."]
  ];
}
function disclosureList(){
  return h("ol", {class:"terms"}, disclosures().map(([t, b]) => h("li", {}, h("strong", {}, t), h("span", {}, b))));
}
function viewTerms(){
  const box = h("input", {type:"checkbox", id:"terms-ok"});
  const err = h("div", {class:"err", role:"alert"});
  const btn = h("button", {class:"btn primary", type:"button", style:"width:100%", onclick: async () => {
    if (!box.checked) { err.textContent = "Tick the box to show you have read and agree to these rules."; return; }
    btn.disabled = true; btn.textContent = "Saving…"; err.textContent = "";
    let res;
    try { res = await S.sb.rpc("accept_terms", {p_version: TERMS_VERSION, p_user_agent: (navigator.userAgent || "").slice(0, 300)}); }
    catch (ex) { res = {error: {message: String(ex)}}; }
    if (res.error) { btn.disabled = false; btn.textContent = "I agree"; err.textContent = isNetErr(res.error) ? "Can't reach the server. Try again." : res.error.message; return; }
    S.profile.termsAcceptedAt = res.data || new Date().toISOString(); S.profile.termsOk = true;
    logAccess("view", "agreed to rules " + TERMS_VERSION);
    route(); renderStatus();
    if (!S.profile.mustChangePassword) startSync();
  }}, "I agree");
  return h("section", {class:"panel stack terms-gate"},
    h("h2", {}, "Before you start: privacy and confidentiality"),
    h("p", {class:"note", style:"margin:0"}, "Welcome, " + (S.meName || "") + ". Please read these rules. You need to agree to them once before using " + BRAND.product + "."),
    disclosureList(),
    h("label", {class:"check agree", for:"terms-ok"}, box, "I have read these rules and I agree to follow them."),
    err, btn,
    h("button", {class:"btn", type:"button", style:"width:100%", onclick:signOut}, "Not now, sign me out"));
}
function viewPrivacy(){
  const p = S.profile || {};
  return h("div", {class:"stack"},
    !S.profile ? h("a", {href:"#", class:"btn back"}, "‹ Back to sign in") : null,
    h("div", {class:"section-h"}, h("h2", {}, "Privacy & rules"), h("span", {class:"sub"}, "Version " + TERMS_VERSION)),
    h("section", {class:"panel stack"},
      p.termsAcceptedAt ? h("div", {class:"submitted"}, "You agreed to these rules on " + new Date(p.termsAcceptedAt).toLocaleString("en-US", {timeZone:"America/Chicago", dateStyle:"medium", timeStyle:"short"}) + " (Central).") : null,
      disclosureList(),
      h("p", {class:"note", style:"margin:0"}, "Questions about privacy? Ask the Administrator. " + BRAND.facility + (BRAND.address ? ", " + BRAND.address : "") + ".")));
}
function noticeFooter(){
  return h("footer", {class:"notice-foot", role:"note"},
    h("span", {}, NOTICE_LINE + " In an emergency, call 911."),
    h("a", {href:"#privacy"}, "Privacy & rules"));
}

function viewChangePassword(){
  return h("section", {class:"panel stack auth"},
    h("h2", {}, "Choose your own password"),
    h("p", {class:"note", style:"margin:0"}, "Welcome, " + (S.meName || "") + ". Replace the starting password with one only you know. At least 8 characters."),
    passwordForm(true));
}
const ROLE_LABEL = {admin:"Leadership (can change every department)", director:"Department head", viewer:"View only"};
function viewAccount(){
  const p = S.profile;
  return h("div", {class:"stack"},
    h("section", {class:"panel stack", style:"gap:8px"},
      h("h2", {style:"font-size:18px"}, p.name),
      h("div", {class:"note"}, "Username: " + p.username),
      h("div", {class:"note"}, ROLE_LABEL[p.role] || p.role),
      h("div", {class:"note"}, "Can fill in: " + (p.role === "admin" ? "every department" : (myDepts().map(d => d.name).join(", ") || "nothing (view only)"))),
      h("a", {href:"#privacy", class:"note"}, "Privacy & rules you agreed to"),
      h("div", {class:"row"}, h("button", {class:"btn", type:"button", onclick:signOut}, "Sign out of this phone"),
        IS_DEMO ? h("button", {class:"btn", type:"button", onclick:() => window.KG_DEMO_RESET && window.KG_DEMO_RESET()}, "Reset demo data") : null)),
    h("section", {class:"panel stack", style:"gap:10px"}, h("h2", {style:"font-size:16px"}, "Change password"), passwordForm(false)),
    setupPanel());
}
async function loadProfile(){
  if (S.loadingProfile) return; S.loadingProfile = true;
  let res;
  try { res = await S.sb.rpc("my_profile"); } catch (e) { res = {error: {message: String(e)}}; }
  S.loadingProfile = false; S.authChecked = true;
  if (res.error) {
    S.errors.login = isNetErr(res.error) ? "Can't reach the server. Check your connection, then reload this page." : res.error.message;
    if (isAuthErr(res.error)) await S.sb.auth.signOut().catch(() => {});
    render(true); renderStatus(); return;
  }
  if (!res.data) {
    await S.sb.auth.signOut().catch(() => {});
    S.errors.login = "This account doesn't have access to " + BRAND.product + ". Ask ownership to check it.";
    render(true); renderStatus(); return;
  }
  const d = res.data;
  S.profile = {id:d.id, username:d.username, name:d.name || d.username, role:d.role, depts:d.depts || [], mustChangePassword:!!d.mustChangePassword};
  applyVisibility(S.profile);
  if (IS_DEMO) S.profile.termsOk = true;
  else {
    markActive(true); lsSet("kg-locked", null);
    let t = null;
    try { t = await S.sb.from("staff_terms").select("accepted_at").eq("user_id", d.id).eq("version", TERMS_VERSION).maybeSingle(); } catch (e) {}
    S.profile.termsAcceptedAt = t && t.data ? t.data.accepted_at : null;
    S.profile.termsOk = !!S.profile.termsAcceptedAt;
  }
  S.meId = d.id; S.meName = S.profile.name; S.readOnly = d.role === "viewer";
  logAccess("open", S.profile.role);
  route(); renderStatus();
  if (!S.profile.mustChangePassword && S.profile.termsOk) startSync();
}
async function signOut(){
  await logAccess("sign_out");
  lsSet("kg-last-active", null);
  try { await S.sb.auth.signOut(); } catch (e) {}
  location.replace(HOME_PATH);
}

route(); renderStatus();
(async () => {
  keepAwake();
  const cfg = window.KG_SURVEY || {};
  if (!cfg.url || !cfg.anonKey || !window.supabase) { S.configured = false; S.authChecked = true; render(true); renderStatus(); return; }
  S.sb = window.supabase.createClient(cfg.url, cfg.anonKey, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:false, storageKey:"kg-mock-survey-auth"}});
  S.sb.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT" && S.profile) location.replace(HOME_PATH);
  });
  let session = null;
  try { session = (await S.sb.auth.getSession()).data.session; } catch (e) {}
  if (session && !IS_DEMO && idleTooLong()) { await autoLock(); return; }
  if (session) await loadProfile();
  else { S.authChecked = true; render(true); renderStatus(); }
})();
