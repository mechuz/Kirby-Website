// {{FACILITY_NAME}} Lead Tracker - after a call is logged.
// Portable copy for new facilities: uses field and choice NAMES, so it works in a duplicated base without editing IDs.
// (The Kirby Gate base runs the same logic with field IDs; see docs/lead-tracker-playbook.md.)
// Facility time zone below is America/Chicago (US Central). For another US zone change the two offsets in chicago().
// Runs when "What happened on the call?", "What's next?" or "Notes (optional)" changes. Writes only to the lead that triggered it.
// 1) What happened is picked: log the call (Contacted, Last Touch Date, Touch Count, Last call result, a dated Call history
//    line, Call back on, Status), then clear What happened so the same answer can be picked next time.
// 2) What happened is blank but a call was logged in the last 20 minutes: add the What's next answer / note to that same
//    history line (staff often pick What's next or type the note a few seconds after What happened).
// 3) What's next = "Close lead": closes the lead (Status Lost) unless it already moved in / passed away.
const LEADS = 'Leads';
const F = {
  outcome: "What happened on the call?",
  next: "What's next?",
  notes: "Notes (optional)",
  bgNotes: "notes",
  contacted: "Contacted",
  lastTouch: "Last Touch Date",
  touchCount: "Touch Count",
  lastResult: "Last call result",
  history: "Call history",
  callBack: "Call back on",
  status: "Status",
  tourDate: "Tour Date",
  moveInDate: "Move-in Date",
  priority: "call_priority",
  email: "Family Email",
  email2: "contact_email"
};
const ST = {
  firstTouch: 'First Touch Sent', engaged: 'Family Engaged', tourScheduled: 'Tour Scheduled',
  movedIn: 'Moved In', lost: 'Lost', notReady: 'Not Ready'
};
const ATTEMPTS = ['Left voicemail', 'No answer', 'Texted', 'Emailed'];
const KEEP_CLOSED = ['Moved In', 'Closed - Deceased'];
const AMEND_MINUTES = 20;

function chicago(date) {
  const t = date.getTime();
  const y = date.getUTCFullYear();
  const firstSunday = (month) => { const dow = new Date(Date.UTC(y, month, 1)).getUTCDay(); return 1 + ((7 - dow) % 7); };
  const dstStart = Date.UTC(y, 2, firstSunday(2) + 7, 8);
  const dstEnd = Date.UTC(y, 10, firstSunday(10), 7);
  const offsetHours = (t >= dstStart && t < dstEnd) ? -5 : -6;
  const l = new Date(t + offsetHours * 3600000);
  return { y: l.getUTCFullYear(), m: l.getUTCMonth() + 1, d: l.getUTCDate(), h: l.getUTCHours(), min: l.getUTCMinutes() };
}
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (p) => p.y + '-' + pad(p.m) + '-' + pad(p.d);
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const stampOf = (date) => { const l = chicago(date); const h12 = l.h % 12 === 0 ? 12 : l.h % 12; return l.m + '/' + l.d + ' ' + h12 + ':' + pad(l.min) + (l.h < 12 ? 'am' : 'pm'); };

async function main() {
  const cfg = input.config();
  const table = base.getTable(LEADS);
  const rec = await table.selectRecordAsync(cfg.recordId, { fields: Object.values(F) });
  if (!rec) { output.set('result', 'record not found'); return; }

  const now = new Date();
  const today = isoDate(chicago(now));
  const outcome = rec.getCellValueAsString(F.outcome);
  const next = rec.getCellValueAsString(F.next).trim();
  const notes = rec.getCellValueAsString(F.notes).replace(/\s*[\r\n]+\s*/g, ' / ').trim();
  const oldHistory = rec.getCellValueAsString(F.history);
  const historyLines = oldHistory ? oldHistory.split('\n') : [];
  const statusCell = rec.getCellValue(F.status);
  const status = statusCell ? statusCell.name : '';
  const canClose = !KEEP_CLOSED.includes(status);
  const fields = {};

  if (!outcome) {
    // No new call picked. Add a late What's next / note to the call logged a moment ago, and honour "Close lead".
    const lastTouch = rec.getCellValue(F.lastTouch);
    const lastResult = rec.getCellValueAsString(F.lastResult);
    const recent = !!lastTouch && !!lastResult && (now.getTime() - new Date(lastTouch).getTime()) <= AMEND_MINUTES * 60000;
    const prefix = recent ? stampOf(new Date(lastTouch)) + ': ' + lastResult : null;
    if (recent && historyLines.length && historyLines[0].startsWith(prefix)) {
      const older = historyLines.slice(1);
      const notesInOlder = !!notes && older.some((l) => l.trim().endsWith(' - ' + notes));
      const parts = [lastResult];
      if (next) parts.push(next);
      if (notes && !notesInOlder) parts.push(notes);
      const line = stampOf(new Date(lastTouch)) + ': ' + parts.join(' - ');
      if (line !== historyLines[0]) fields[F.history] = [line].concat(older).join('\n');
    }
    const alreadyClosedByUs = historyLines.length > 0 && /(: | - )Close lead( - |$)/.test(historyLines[0]);
    if (next === 'Close lead' && canClose && status !== 'Lost' && (recent || !alreadyClosedByUs)) {
      fields[F.status] = { name: ST.lost };
      if (!recent) {
        const line = stampOf(now) + ': Close lead' + (notes ? ' - ' + notes : '');
        fields[F.history] = oldHistory ? line + '\n' + oldHistory : line;
      }
    }
    if (Object.keys(fields).length) {
      await table.updateRecordAsync(rec.id, fields);
      output.set('result', 'updated without a new call: ' + Object.keys(fields).length + ' field(s)');
    } else {
      output.set('result', 'nothing to log');
    }
    return;
  }

  const stamp = stampOf(now);
  const notesAlreadyLogged = !!notes && historyLines.some((l) => l.trim().endsWith(' - ' + notes));
  const parts = [outcome];
  if (next) parts.push(next);
  if (notes && !notesAlreadyLogged) parts.push(notes);
  const line = stamp + ': ' + parts.join(' - ');

  fields[F.contacted] = true;
  fields[F.lastTouch] = now.toISOString();
  fields[F.touchCount] = (Number(rec.getCellValue(F.touchCount)) || 0) + 1;
  fields[F.lastResult] = outcome;
  fields[F.history] = oldHistory ? line + '\n' + oldHistory : line;

  const early = ['', 'New', 'First Touch Sent', 'No Response'].includes(status);
  const closing = next === 'Close lead' && outcome !== 'Moved in';

  const callBack = rec.getCellValue(F.callBack);
  if (!closing && (!callBack || callBack <= today)) {
    let nextDate = null;
    if (ATTEMPTS.includes(outcome)) nextDate = addDays(today, 1);
    else if (outcome === 'Reached - interested') nextDate = addDays(today, 2);
    else if (outcome === 'Reached - not ready yet') nextDate = addDays(today, 14);
    else if (outcome === 'Reached - tour booked') {
      const tour = rec.getCellValue(F.tourDate);
      const tourDay = tour ? isoDate(chicago(new Date(tour))) : null;
      nextDate = (tourDay && tourDay >= today) ? tourDay : addDays(today, 1);
    }
    if (nextDate) fields[F.callBack] = nextDate;
  }

  let newStatus = null;
  if (ATTEMPTS.includes(outcome)) { if (early) newStatus = ST.firstTouch; }
  else if (outcome === 'Reached - interested') { if (early || status === 'Not Ready') newStatus = ST.engaged; }
  else if (outcome === 'Reached - not ready yet') { if (early) newStatus = ST.notReady; }
  else if (outcome === 'Reached - tour booked') { if (status !== 'Toured' && status !== 'Moved In') newStatus = ST.tourScheduled; }
  else if (outcome === 'Reached - not interested' || outcome === 'Chose another community') { if (canClose) newStatus = ST.lost; }
  else if (outcome === 'Do not contact') { fields[F.priority] = -100; if (canClose) newStatus = ST.lost; }
  else if (outcome === 'Wrong number') {
    const hasEmail = /@/.test(rec.getCellValueAsString(F.email) + rec.getCellValueAsString(F.email2));
    if (!hasEmail && canClose) newStatus = ST.lost;
    if (hasEmail && !closing) fields[F.callBack] = addDays(today, 1);
    const oldBg = rec.getCellValueAsString(F.bgNotes);
    const bgLine = today + ': wrong number';
    if (!oldBg.includes(bgLine)) fields[F.bgNotes] = oldBg.trim() ? oldBg.replace(/\s+$/, '') + '\n' + bgLine : bgLine;
  }
  else if (outcome === 'Moved in') {
    newStatus = ST.movedIn;
    if (!rec.getCellValue(F.moveInDate)) fields[F.moveInDate] = today;
  }
  if (closing && canClose) newStatus = ST.lost;
  if (newStatus && (!statusCell || statusCell.name !== newStatus)) fields[F.status] = { name: newStatus };

  fields[F.outcome] = null;
  await table.updateRecordAsync(rec.id, fields);
  output.set('result', 'logged: ' + outcome + (closing && canClose ? ' (closed)' : ''));
}
await main();
