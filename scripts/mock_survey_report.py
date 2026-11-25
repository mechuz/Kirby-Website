#!/usr/bin/env python3
"""Daily 3:00 PM mock-survey results email for The Pointe at Kirby Gate.

Runs from .github/workflows/mock-survey-report.yml. Reads today's checklists,
corrective actions and audits from Supabase with the service key and emails a
summary to leadership. Sends at most once per day (report_log table), only
between 3:00 and 5:00 PM Central unless FORCE=1.

Environment (GitHub repository secrets):
  SUPABASE_URL           https://<project>.supabase.co
  SUPABASE_SERVICE_KEY   service_role / secret key (never put this in the website)
  SMTP_HOST, SMTP_PORT   e.g. smtp.gmail.com and 587
  SMTP_USER, SMTP_PASSWORD
  REPORT_FROM            sender address, e.g. the SMTP user
  REPORT_TO              comma-separated recipients
Optional: FORCE=1 (send now, even if already sent today), DRY_RUN=1 (print, don't send),
          FIXTURE=path.json (use saved data instead of Supabase, for testing).
Without the Supabase secrets the script exits quietly.
"""
import datetime
import email.message
import html
import json
import os
import pathlib
import re
import smtplib
import sys
import urllib.request
import zoneinfo

ROOT = pathlib.Path(__file__).resolve().parent.parent
CENTRAL = zoneinfo.ZoneInfo("America/Chicago")
APP_URL = "https://www.kirbygateliving.com/mock-survey/"
DEADLINE = datetime.time(14, 30)


def load_depts():
    """Read the department checklists from the app itself, so there is one source of truth."""
    js = (ROOT / "public" / "assets" / "js" / "mock-survey.js").read_text()
    block = js[js.index("const DEPTS = [") + len("const DEPTS = "): js.index("];\nconst DEPT =") + 1]
    block = re.sub(r"([{,]\s*)(id|name|short|lead|sections|title|start|items):", r'\1"\2":', block)
    block = re.sub(r",\s*([\]}])", r"\1", block)  # JS allows trailing commas; JSON does not
    return json.loads(block)


def rest(base, key, path):
    req = urllib.request.Request(f"{base}/rest/v1/{path}", headers={
        "apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def mark_sent(base, key, day):
    req = urllib.request.Request(f"{base}/rest/v1/report_log", method="POST",
        data=json.dumps({"day": day}).encode(), headers={
            "apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates,return=minimal"})
    urllib.request.urlopen(req, timeout=30).read()


def fetch(base, key, day):
    since = (datetime.date.fromisoformat(day) - datetime.timedelta(days=180)).isoformat()
    return {
        "checks": rest(base, key, f"checks?select=id,data&day=eq.{day}"),
        "actions": rest(base, key, f"actions?select=id,data&day=gte.{since}&order=day.desc&limit=1000"),
        "audits": rest(base, key, f"audits?select=id,data&day=eq.{day}"),
        "staff": rest(base, key, "staff?select=user_id,full_name"),
        "sent": rest(base, key, f"report_log?select=day&day=eq.{day}"),
    }


def central(iso):
    if not iso:
        return None
    return datetime.datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(CENTRAL)


def fmt_time(iso):
    t = central(iso)
    return t.strftime("%-I:%M %p") if t else ""


def build(data, day, depts):
    people = {p["user_id"]: p["full_name"] for p in data.get("staff", [])}
    checks = {r["id"]: r["data"] for r in data["checks"]}
    actions = [dict(r["data"], id=r["id"]) for r in data["actions"]]
    total = sum(len(d["items"]) for d in depts)
    rows, C, NC, NA, submitted, late = [], 0, 0, 0, 0, 0
    for d in depts:
        c = checks.get(f"{day}_{d['id']}") or {}
        marks = c.get("marks") or {}
        cc = sum(1 for i in range(1, len(d["items"]) + 1) if marks.get(str(i)) == "C")
        nc = sum(1 for i in range(1, len(d["items"]) + 1) if marks.get(str(i)) == "NC")
        na = sum(1 for i in range(1, len(d["items"]) + 1) if marks.get(str(i)) == "NA")
        C, NC, NA = C + cc, NC + nc, NA + na
        st = central(c.get("submittedAt")) if c.get("submitted") else None
        is_late = bool(st and (st.date().isoformat() > day or st.time() > DEADLINE))
        if st:
            submitted += 1
            late += is_late
            status = ("LATE " if is_late else "Submitted ") + fmt_time(c.get("submittedAt"))
        else:
            status = "NOT SUBMITTED" + (f" ({cc + nc + na}/{len(d['items'])} checked)" if cc + nc + na else "")
        who = c.get("signature") or people.get(c.get("submittedBy")) or c.get("reviewer") or ""
        rows.append({"dept": d["name"], "status": status, "ok": bool(st) and not is_late, "missing": not st,
                     "C": cc, "NC": nc, "NA": na, "open": len(d["items"]) - cc - nc - na, "who": who})
    ready = round((C + NA) / total * 100) if total else 0
    names = {d["id"]: d["short"] for d in depts}
    today_findings = [a for a in actions if a.get("date") == day]
    urgent = [a for a in actions if a.get("urgent") and a.get("status") != "Closed"]
    overdue = [a for a in actions if a.get("status") != "Closed" and a.get("targetDate") and a["targetDate"] < day]
    open_count = sum(1 for a in actions if a.get("status") != "Closed")
    pretty_day = datetime.date.fromisoformat(day).strftime("%a, %b %-d")
    subject = f"Mock survey 3:00 PM results · {pretty_day} · {ready}% ready · {submitted}/{len(depts)} submitted"
    if urgent:
        subject += f" · {len(urgent)} URGENT"

    def act_line(a):
        bits = [names.get(a.get("dept"), a.get("dept", "")) + (f" #{a['item']}" if a.get("item") else ""), a.get("deficiency") or "(no description)"]
        tail = [x for x in [a.get("corrective") and "Fix: " + a["corrective"], a.get("responsible") and "Owner: " + a["responsible"],
                            a.get("targetDate") and "Due " + a["targetDate"], a.get("status")] if x]
        return bits, tail

    # plain text
    t = [f"THE POINTE AT KIRBY GATE: MOCK SURVEY RESULTS, {pretty_day.upper()}", "",
         f"Survey readiness: {ready}% ({C + NA} of {total} items verified compliant or N/A)",
         f"Checklists submitted: {submitted} of {len(depts)} ({late} after the 2:30 PM deadline)",
         f"Items needing correction today: {NC} · Open corrective actions: {open_count} ({len(overdue)} overdue)", ""]
    if urgent:
        t.append("URGENT RESIDENT-SAFETY FINDINGS STILL OPEN:")
        for a in urgent:
            b, tail = act_line(a); t.append(f"  - {b[0]}: {b[1]} [{'; '.join(tail)}]")
        t.append("")
    t.append("BY DEPARTMENT")
    for r in rows:
        t.append(f"  {r['dept']}: {r['status']} · C {r['C']} / NC {r['NC']} / NA {r['NA']}" + (f" / unchecked {r['open']}" if r["open"] else "") + (f" · {r['who']}" if r["who"] else ""))
    t.append("")
    for title, lst in (("FINDINGS LOGGED TODAY", today_findings), ("OVERDUE CORRECTIVE ACTIONS", overdue)):
        t.append(f"{title} ({len(lst)})")
        for a in lst:
            b, tail = act_line(a); t.append(f"  - {b[0]}: {b[1]} [{'; '.join(tail)}]")
        t.append("")
    t.append(f"Live dashboard: {APP_URL}")
    text = "\n".join(t)

    # HTML
    e = html.escape
    def table(lst):
        if not lst:
            return "<p style='margin:4px 0 14px;color:#56675a'>None.</p>"
        out = "<table cellpadding='6' style='border-collapse:collapse;width:100%;font-size:13px;margin-bottom:14px'>"
        for a in lst:
            b, tail = act_line(a)
            out += (f"<tr style='border-top:1px solid #d3ddd2'><td style='white-space:nowrap;vertical-align:top'><b>{e(b[0])}</b></td>"
                    f"<td>{'<b style=\"color:#b91c1c\">SAFETY</b> ' if a.get('urgent') else ''}{e(b[1])}<br><span style='color:#56675a'>{e(' · '.join(tail))}</span></td></tr>")
        return out + "</table>"
    dept_rows = "".join(
        f"<tr style='border-top:1px solid #d3ddd2'><td>{e(r['dept'])}</td>"
        f"<td style='color:{'#2b7a3c' if r['ok'] else '#b91c1c'};font-weight:bold;white-space:nowrap'>{e(r['status'])}</td>"
        f"<td align='center'>{r['C']}</td><td align='center' style='{'color:#c2410c;font-weight:bold' if r['NC'] else ''}'>{r['NC']}</td>"
        f"<td align='center'>{r['NA']}</td><td align='center'>{r['open'] or ''}</td><td>{e(r['who'])}</td></tr>" for r in rows)
    urgent_html = ("<div style='background:#fde0e0;border-left:5px solid #b91c1c;padding:10px 12px;margin:12px 0'>"
                   f"<b style='color:#b91c1c'>{len(urgent)} urgent resident-safety finding{'s' if len(urgent) != 1 else ''} still open</b>{table(urgent)}</div>") if urgent else ""
    body = f"""<div style="font-family:Arial,Helvetica,sans-serif;color:#16221a;max-width:760px">
<div style="background:#121c15;color:#eef4ed;padding:14px 16px"><div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.75">The Pointe at Kirby Gate</div>
<div style="font-size:20px;font-weight:bold">Mock survey results · {e(pretty_day)}</div></div>
<p style="font-size:15px;margin:14px 0 4px"><b style="font-size:28px">{ready}%</b> survey ready ({C + NA} of {total} items verified compliant or N/A)</p>
<p style="margin:0 0 12px;color:#56675a">{submitted} of {len(depts)} checklists submitted · {late} after the 2:30 PM deadline · {NC} items need correction · {open_count} open corrective actions ({len(overdue)} overdue)</p>
{urgent_html}
<h3 style="margin:16px 0 6px">By department</h3>
<table cellpadding="6" style="border-collapse:collapse;width:100%;font-size:13px">
<tr style="background:#e8eee7;text-align:left"><th>Department</th><th>Status</th><th>C</th><th>NC</th><th>NA</th><th>Unchecked</th><th>Signed</th></tr>{dept_rows}</table>
<h3 style="margin:18px 0 6px">Findings logged today ({len(today_findings)})</h3>{table(today_findings)}
<h3 style="margin:18px 0 6px">Overdue corrective actions ({len(overdue)})</h3>{table(overdue)}
<p><a href="{APP_URL}" style="display:inline-block;background:#2c6a37;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">Open the live dashboard</a></p>
<p style="font-size:12px;color:#56675a">Sent automatically at 3:00 PM Central from the Kirby Gate mock survey.</p></div>"""
    return subject, text, body


def main():
    now = datetime.datetime.now(CENTRAL)
    day = os.environ.get("REPORT_DAY") or now.date().isoformat()
    force = os.environ.get("FORCE") == "1"
    dry = os.environ.get("DRY_RUN") == "1"
    fixture = os.environ.get("FIXTURE")
    if not force and not fixture and not (15 <= now.hour < 17):
        print(f"Not report time ({now:%H:%M} Central); nothing to do.")
        return
    base, key = os.environ.get("SUPABASE_URL", "").rstrip("/"), os.environ.get("SUPABASE_SERVICE_KEY", "")
    if fixture:
        data = json.loads(pathlib.Path(fixture).read_text())
    elif not base or not key:
        print("SUPABASE_URL / SUPABASE_SERVICE_KEY not set; skipping.")
        return
    else:
        data = fetch(base, key, day)
        if data["sent"] and not force:
            print(f"Report for {day} already sent; skipping.")
            return
    subject, text, body = build(data, day, load_depts())
    to = [a.strip() for a in os.environ.get("REPORT_TO", "").split(",") if a.strip()]
    if dry or not to:
        print(subject); print(); print(text)
        if not to and not dry:
            print("\nREPORT_TO not set; nothing sent.")
        return
    msg = email.message.EmailMessage()
    msg["Subject"], msg["From"], msg["To"] = subject, os.environ.get("REPORT_FROM") or os.environ["SMTP_USER"], ", ".join(to)
    msg.set_content(text)
    msg.add_alternative(body, subtype="html")
    port = int(os.environ.get("SMTP_PORT") or 587)
    if port == 465:
        smtp = smtplib.SMTP_SSL(os.environ["SMTP_HOST"], port, timeout=30)
    else:
        smtp = smtplib.SMTP(os.environ["SMTP_HOST"], port, timeout=30); smtp.starttls()
    with smtp:
        smtp.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
        smtp.send_message(msg)
    print(f"Sent: {subject} -> {len(to)} recipient(s)")
    if not fixture:
        mark_sent(base, key, day)


if __name__ == "__main__":
    try:
        main()
    except Exception as ex:  # make the failure visible in the Actions log
        print(f"Mock survey report failed: {ex}", file=sys.stderr)
        sys.exit(1)
