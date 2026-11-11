# Lead Tracker Playbook (replication kit)

How the senior-living lead tracker at The Pointe at Kirby Gate is built, and how to set up the same thing for another facility in about two hours. Written 2026-11-11. This repo is public: staff names, email addresses and passwords are deliberately not in this file; ownership keeps them in the private config.

The design goal: a Senior Advisor who is not comfortable with technology, working mostly from a phone, opens **one** page, sees only the families to call today, taps a name, calls, and picks two dropdowns. Everything else (call history, call-back dates, status, reports) is done for them.

---

## 1. How it fits together

```
Lead emails (website forms, A Place for Mom, Caring.com, other agencies, Yelp)
        |  "Lead intake" routine, every 2 hours (Claude scheduled task)
        v
Airtable base: Leads table  <---  "after a call is logged" automation (Airtable)
        |                                   ^
        |  interface "{{FACILITY_SHORT}} Calls" (staff)          | advisor picks "What happened?" / "What's next?"
        v                                   |
My Calls Today  ->  tap a family  ->  "Call a Family" detail page
Find a Family   (someone calls in)
Referral Partners

"Daily call list" routine, weekdays 7:43am: emails the advisor a numbered list with a button to /team/
Website /team/ page: per-person sign-in, remembers the phone for 180 days, big buttons into Airtable
```

Who sees what:

| Person | Airtable access | Website /team/ login |
|---|---|---|
| Senior Advisor (makes the calls) | Interface "{{FACILITY_SHORT}} Calls", **Editor**, interface only | yes |
| Managers / overseers (no calling) | Both lead interfaces, **Read only**, interface only | yes |
| Ownership | Base owner/creator | yes |

Interface-only collaborators never see tables, other interfaces (for example a content/marketing interface) or the base itself.

---

## 2. Facility config table

Fill this in first. Every `{{PLACEHOLDER}}` in this document, the routines and the automation refers to a row here.

| Placeholder | Kirby Gate value | What it is |
|---|---|---|
| `{{FACILITY_NAME}}` | The Pointe at Kirby Gate | Full name used in emails |
| `{{FACILITY_SHORT}}` | Kirby Gate | Short name for interface titles |
| `{{FACILITY_TYPE}}` | private-pay assisted living and memory care | One line, used in routine prompts |
| `{{ADDRESS}}` | 6480 Quince Rd, Memphis, TN 38119 | Street address |
| `{{MAIN_PHONE}}` | (901) 753-3449 | Main line |
| `{{SALES_PHONE}}` | (901) 247-5835 | Sales line |
| `{{TIME_ZONE}}` | America/Chicago | IANA time zone (filters, formulas, script) |
| `{{SITE_DOMAIN}}` | www.kirbygateliving.com | Website with the /team/ page |
| `{{ADVISOR_NAME}}` | the Senior Advisor (first name kept out of this public repo) | The person who makes calls |
| `{{ADVISOR_EMAIL}}` | the front-desk / reception mailbox | Gets the daily call list, Airtable Editor |
| `{{OVERSEER_EMAILS}}` | two manager mailboxes (kept out of this public repo) | Read-only interface access, no call list |
| `{{OWNER_CC}}` | ownership's mailbox (kept out of this public repo) | CC on the daily call list |
| `{{LEAD_INBOX}}` | the Gmail account the routines read | Where lead emails arrive |
| `{{BASE_ID}}` | appZ2xOP1HzOWjug7 | Airtable base |
| `{{LEADS_TABLE_ID}}` | tbl4VEuo6ByyJAaXm | Leads table |
| `{{PARTNERS_TABLE_ID}}` | tblbQ6kBH1Y49tiYL | Referral Sources table |
| `{{STAFF_INTERFACE_ID}}` | pbdivDLsJ4wxCSOkS ("Kirby Gate Calls") | Interface the advisor is invited to |
| `{{OVERVIEW_INTERFACE_ID}}` | pbdicsnAZ4OsQMD7e ("Kirby Gate Lead Tracker") | Managers' overview (Results, All Leads, ...) |
| `{{CALLS_PAGE_ID}}` | pagXuzQ5WSZsiZPYT | My Calls Today |
| `{{FIND_PAGE_ID}}` | pagtODUbDn63PNtQn | Find a Family |
| `{{PARTNERS_PAGE_ID}}` | pagSI0iQZr3xkm7kT | Referral Partners |
| `{{DETAIL_PAGE_ID}}` | pag0OLKSAKRTj1vbI | "Call a Family" record detail page |
| `{{PARTNER_DETAIL_PAGE_ID}}` | pag9m0Wu5bdt7vqzf | Partner Detail page |
| `{{RESULTS_PAGE_ID}}` | pag6rlUwocLnaVliG | Results dashboard (owners) |
| `{{AFTER_CALL_AUTOMATION_ID}}` | wfl9uRVVg5sC8GMkP | After-call automation |
| `{{REFERRAL_AGENCIES}}` | A Place for Mom, Caring.com, Oasis Senior Advisors, Owl Be There | Choices of the `source` field |
| `{{STAFF_NAMES}}` | the advisor's and managers' first names | Choices of "Assigned To" |

Page links are `https://airtable.com/{{BASE_ID}}/{{PAGE_ID}}`.

---

## 3. Duplicate the Airtable base

1. In Airtable, open the Kirby Gate base, click the base name (top left) > **Duplicate base**.
2. Pick the new facility's workspace. Tick **Duplicate records** only if you want sample rows to train with; for a real facility leave it **unticked** (empty tables, all fields, formulas, interfaces and automations are copied). Never copy Kirby Gate family records into another facility's base.
3. Rename the base "{{FACILITY_SHORT}} Lead Tracker".
4. Delete nothing you are unsure about, but you can clear the content-engine tables (Content Items, Content Topics, GBP ..., News Items, Guest Post Targets, Manual Post Queue, Marketing Contacts) if the new facility does not use them. They are not part of the lead tracker.
5. Write the new base, table, page and automation IDs into the config table (open each page; the ID is in the address bar, `pag...`).

Duplicated automations come over **turned off**. Duplicated interfaces come over **unpublished drafts** for the new base; publish them (section 5).

### Fields to rename or re-point for the new facility

| Table / field | Change |
|---|---|
| Leads > `source` (single select) | Replace choices with `{{REFERRAL_AGENCIES}}` |
| Leads > `Assigned To` | Replace choices with `{{STAFF_NAMES}}` |
| Leads > `Lead Channel` | Keep: Referral agency, Website, Walk-in, Phone, Yelp, Chat |
| Leads > every formula using `'America/Chicago'` (Reminder, Call order) | Change to `{{TIME_ZONE}}` |
| Referral Sources > `Assigned To`, `Reminder`, `Visit order` | Same: staff names and time zone |
| Field descriptions that mention the old advisor or facility name | Update the names (cosmetic) |

### Required select choices (keep these spellings exactly; the automation matches them)

**Leads > What happened on the call?** (short, plain; the automation reads the exact text)
Reached - interested, Reached - tour booked, Reached - not ready yet, Reached - not interested, Left voicemail, No answer, Wrong number, Texted, Emailed, Moved in, Chose another community, Do not contact

**Leads > What's next?**
Call again, Book tour, Tour follow-up, Send information, Collect application, Assessment, Set move-in date, Update agency, Close lead

**Leads > Status**
New, First Touch Sent, Family Engaged, Tour Scheduled, Toured, Moved In, Lost, Closed - Deceased, Not Ready, No Response

**Leads > priority**: Hot, Warm, Nurture

**Referral Sources > Relationship**: New, Contacted, Visited, Active partner, Not a fit
**Referral Sources > Visit Outcome**: Met the right person, Left information, Scheduled a presentation, Asked to follow up, Not interested, Sent us a referral (no gift/meal options: nothing of value is given for referrals)

### Key computed fields (copied with the base; listed so you know what each does)

| Field | What it does |
|---|---|
| Open? | 1 while the lead is open; 0 for Moved In, Lost, Closed - Deceased |
| Who to call | "Contact name (relationship) - phone" in one line; title of each row |
| Heads up | Reads the background notes and the call note: DO NOT CALL, EMAIL OR TEXT ONLY, CALL AFTER 5PM, WRONG NUMBER, CALL AGENCY FIRST |
| Reminder | One-line to-do: heads-up first, then OVERDUE - call now / CALL TODAY / New lead - call within the hour / After tour - check in / Follow up on Thu 11/12 / Not called yet |
| Call order | 10s overdue call-back, 20s due today, 25 after-tour check-in, 30s new uncalled, 50s other, 90 closed, 95 do not call; last digit Hot 1 / Warm 2 / Nurture 3 / unrated 4 |
| Today order | `IF({priority}='Hot', 0, 100) + {Call order}`: puts Hot families first |
| Lead Received | Source Email Date, or the date the row was created |
| Toured?, Moved In?, Tour rate %, Move-in rate % | Feed the Results dashboard |
| Referral Sources > Reminder / Visit order | "VISIT DUE" etc. and the sort key for partners |

---

## 4. The staff interface: "{{FACILITY_SHORT}} Calls"

Create a new interface with **only** these three pages, in this order. Keep managers' pages (Results, All Leads, Closed & Moved In, Tours & Applications) in a separate overview interface so the advisor's menu stays short. Content/marketing pages live in their own interface ("Content Engine") and are never shared with staff.

### Page 1: My Calls Today (list)

- Type: List. Table: Leads. Row height: Large.
- Fields shown (only two): **Who to call**, **Reminder**.
- Sort: Today order (ascending), then Call back on (ascending: oldest overdue first), then Lead Received (descending: newest new lead first).
- No filter tabs, no dropdowns (there is no "Whose calls?" picker: every lead belongs to the one advisor).
- Clicking a record opens: **Call a Family**.
- Page filter (fixed, staff cannot change it), all must be true:
  1. Open? = 1
  2. Heads up is not "DO NOT CALL"
  3. call_priority is empty **or** call_priority > 0 (agent/opt-out rows get -50 / -100)
  4. Has a way to reach them: Family Phone, contact_phone, Family Email or contact_email is not empty
  5. Any of:
     - Call back on is on or before today ({{TIME_ZONE}})
     - Status = New **and** Contacted is unticked **and** Lead Received is within the past 21 days
     - Reminder contains "After tour"
- Page settings > User actions (in the interface editor): Search **on**; Filter, Sort, Group, Row height **off**.

At Kirby Gate this showed 19 families on 2026-11-11 (out of 285 open). Old uncalled leads are worked by separate email campaigns, not this list; to add a batch of old leads to the list, set their Call back on to the day you want them called.

### Page 2: Find a Family (list)

- Type: List. Table: Leads. No page filter (open and closed leads, so returning families are found).
- Fields: Who to call, Prospect Name, Reminder. Sort: Lead Received, newest first.
- Clicking a record opens: **Call a Family**.
- User actions: **Search on** (staff type a name or the last 4 digits of the phone, e.g. 3433), everything else off.

### Page 3: Referral Partners (list)

- Type: List. Table: Referral Sources.
- Fields: Org Name, Reminder, Phone. Sort: Visit order ascending, then Next Visit / Call ascending (visits due first).
- Page filter: Relationship is not "Not a fit" and Status is not "Do Not Contact".
- Clicking a record opens: **Partner Detail** (who to contact; Visited?, Visit Outcome, Next Visit / Call, Visit Notes editable).

### Record detail page: "Call a Family" (full screen)

Title: **Who to call** (extra large). Page is read-only except the fields marked *editable*.

| Group (title shown to staff) | Fields, top to bottom |
|---|---|
| **1. Call** — "Tap the phone number to call. Read the reminder first." | Family Phone (read-only, so a tap dials), Reminder, Heads up |
| **2. After the call** — "Pick what happened and what's next. Add a short note if you like. It saves by itself. In a few seconds your answer moves down to Last call result and the next call date is set for you. Then tap Back for the next family." | What happened on the call? *editable*, What's next? *editable*, Notes (optional) *editable*, Last call result |
| **Optional: change the call-back day, or add a tour date** | Call back on *editable*, Tour Date *editable* |
| **More details (only if you need them)** | Call history, notes (background), Prospect Name, Family Email *editable*, Status *editable*, Care Type, timeframe, Lead Channel, source, advisor_name, Agency Updated *editable*, Referred By (partner), Application Status *editable*, Move-in Date *editable*, Lead Received, Assigned To |

There is no Save button in Airtable: every pick saves immediately. "Back" closes the record.

Publish the interface after any change (interface editor > **Publish**).

### Managers' overview interface (read-only for overseers)

Keep the original "Lead Tracker" interface for owners and managers: Results (dashboard), My Calls Today (same filter as above), All Leads, New Website & Walk-in Leads, Referrals, Tours & Applications, Closed & Moved In, Referral Partners. Its records open "Call a Family" or the older detail pages.

---

## 5. Automation: "Lead Tracker: after a call is logged"

- Trigger: **When a record is updated**, table Leads, watching **What happened on the call?**, **What's next?** and **Notes (optional)**.
- Action: **Run a script**, input variable `recordId` = the trigger record's ID.
- Script: `docs/lead-tracker/after-call-automation.js` (uses field names, so it works in a duplicated base as-is; Kirby Gate runs the same logic with field IDs).
- After pasting the script: **Test** with a TEST record (below), then switch the automation **On** (toggle at the top of the automation). Turning automations on/off can only be done by a person in Airtable.

What it does, in plain words:

1. When "What happened on the call?" is picked: ticks Contacted, stamps Last Touch Date, adds 1 to Touch Count, copies the answer to Last call result, adds a line like `11/11 2:05pm: Left voicemail - Call again - spoke to daughter` to the top of Call history, then clears the dropdown so the same answer can be picked on the next call.
2. Sets **Call back on** when it is empty or already due: voicemail / no answer / texted / emailed = tomorrow; interested = in 2 days; not ready = in 14 days; tour booked = the Tour Date (or tomorrow if none). A date the advisor typed for the future is kept.
3. Moves **Status**: first attempt > First Touch Sent; interested > Family Engaged; not ready > Not Ready; tour booked > Tour Scheduled; not interested or chose another community > Lost; do not contact > Lost and call_priority -100; moved in > Moved In (+ Move-in Date today); wrong number > Lost only when there is no email on file (otherwise call back tomorrow so the advisor can email, plus a dated "wrong number" line in background notes).
4. If What's next or the note is filled in **after** What happened (up to 20 minutes later), it is added to that same history line.
5. What's next = **Close lead** closes the lead (Lost), never for Moved In / Closed - Deceased, and never re-closes a lead someone reopened.

Test procedure (5 minutes):
1. Create a lead named "TEST - delete me", Family Phone (555) 555-0100, Status New, Call back on today.
2. Open it from My Calls Today; pick What happened = Left voicemail.
3. Within ~10 seconds: What happened is blank again, Last call result = Left voicemail, Call history has a dated line, Contacted ticked, Call back on = tomorrow, Status = First Touch Sent, and the family has left today's list.
4. Pick What's next = Close lead: Status becomes Lost and the history line ends "- Close lead".
5. Delete the TEST record.

Keep the old Airtable "8 AM daily call list email" automation **off**; the Claude routine below replaced it.

---

## 6. Website /team/ launcher (per-person sign-in, remembered 180 days)

The facility website gets a `/team/` page (noindex, not in the sitemap, no analytics) with big buttons: **My Calls Today**, **Find a family**, **Referral Partners**, plus small manager links (Results, All leads, Full tracker), "Every day" steps, "First time" steps and a **Make the phone icon** button.

- The readable page and the passwords are never committed. `scripts/team-gate.mjs` encrypts the page (AES-256-GCM, key wrapped per person with PBKDF2-SHA256, 600,000 rounds). `public/assets/js/team-gate.js` decrypts it in the browser.
- Private inputs live **outside** the repo: `content.html` (the launcher HTML, with the Airtable page links) and `users.json` (`[{"username":"firstname","password":"XXXX-XXXX-XXXX"}, ...]`; 12 random characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`; dashes and case are ignored when typing).
- Build: `node scripts/team-gate.mjs <content.html> <users.json>` then `python3 build.py`, commit, push. Re-running rotates the page key, which signs everyone out once.
- "Keep me signed in" is ticked by default and lasts **180 days** on that phone or browser. Sign out is always on the page.
- **Phone icon**: the "Make the phone icon" button changes the address to `/team/#calls` and shows the steps (iPhone: Share > Add to Home Screen > Add; Android: menu > Add to Home screen > Add). Opening `/team/#calls` signs in from memory and jumps straight to My Calls Today. The home-screen label is "My Calls" (`content/team.head.html`).
- Security note: the website login only hides the links. The family data lives in Airtable and is protected by each person's Airtable account; removing a person = re-run the gate without them **and** remove them from the Airtable interface.

For another facility's website, copy `scripts/team-gate.mjs`, `public/assets/js/team-gate.js`, `content/team.head.html` and the build hooks (`analytics: no` meta, `.head.html` sibling files), then write that facility's `content.html` with its page links.

---

## 7. Invite staff to "this interface only"

1. Open the base > **Interfaces** > "{{FACILITY_SHORT}} Calls" > **Share** (top right).
2. Type `{{ADVISOR_EMAIL}}`, permission **Editor**, click **Send invite**. (Editor is needed to pick the dropdowns.)
3. For each overseer in `{{OVERSEER_EMAILS}}`: same Share box, permission **Read only**. Then open the overview interface ("{{FACILITY_SHORT}} Lead Tracker") > Share > same emails, **Read only**.
4. Do **not** use "Invite to base" or "Share workspace" for staff: that would show them every table and the content interfaces. Interface-only people see nothing else in the base.
5. Billing: on Team plans, interface **Editors and Commenters are paid seats**; **Read only is free** (Business plan: only Editors are billed). So one advisor = one seat; overseers read-only = free. Check Account > Billing > Collaborators after inviting.
6. The advisor accepts the Airtable email, signs in with their work email (Airtable keeps phones signed in), then uses the website /team/ page or the phone icon.

---

## 8. Routine prompts (Claude scheduled tasks)

Both run in a cloud session with Gmail and Airtable connected. Replace the placeholders and field IDs (IDs come from the new base's schema).

### 8a. Lead intake (every 2 hours, `49 */2 * * *`)

```
Scheduled run: {{FACILITY_SHORT}} Lead Intake. Ownership wants every lead that arrives by email to land automatically in the Airtable Leads CRM, which the Senior Advisor ({{ADVISOR_NAME}}) works from: website forms, A Place for Mom, Caring.com, other referral agencies, and Yelp. {{FACILITY_NAME}} is a {{FACILITY_TYPE}} community, {{ADDRESS}}. Sales line {{SALES_PHONE}}; main line {{MAIN_PHONE}}. Nobody is watching this run.

DO NOT send any email, text or message to families, agencies or anyone else. Read Gmail, write Airtable, notify ownership only.

TOOLS: Gmail search/get_thread, Airtable list/create/update records and get_table_schema, PushNotification. Airtable base {{BASE_ID}}, Leads table {{LEADS_TABLE_ID}}. Use field IDs from the schema for: Prospect Name, APFM ID, Family Contact Name, Family Email, Family Phone, Care Type, Urgency, location, Source Email Date, Source Email ID, Status, stage, notes (background), Call history, referral_id (dedupe key), source, contact_name, contact_relationship, contact_phone, contact_email, care_level, timeframe, advisor_name, advisor_email, priority, call_priority, Assigned To ("{{ADVISOR_NAME}}"), Call back on, Contacted, Lead Channel (Website, Referral agency, Walk-in, Phone, Yelp, Chat). Call get_table_schema once per run; use existing choices only. List records without a sort parameter.

STEPS
1. Gmail search newer_than:3d and read each thread in full: website lead emails (Lead Channel Website, Chat for chat callbacks; skip subjects starting "TEST"); A Place for Mom new referrals (source A Place for Mom, Referral agency, APFM ID); Caring.com leads (referral_id = Caring lead ID); other agencies ({{REFERRAL_AGENCIES}}); Yelp lead notifications; family replies to our check-in emails (opt-outs: prepend "EMAIL OPT-OUT <date>" to background notes and never email again; closed/elsewhere/passed away: Call history line and Status Lost or Closed - Deceased; interested: Call history line, Call back on today, priority Hot, call_priority 90, one push notification). Ignore marketing, billing, vendors, job seekers and our own internal emails.
2. Dedupe on APFM ID / referral_id, then 10-digit phone (Family Phone and contact_phone), then email, then name + date. Never duplicate a row; append a dated note only when the email adds news.
3. New lead: Status New, stage NEW, Assigned To {{ADVISOR_NAME}}, Call back on = today ({{TIME_ZONE}}), Contacted false, Lead Channel, priority Hot if they ask for a tour/availability/respite or the timeframe is within 30 days, else Warm; call_priority 90 Hot / 60 Warm. Always fill Family Phone (it is the tap-to-call number). notes: "<Channel> lead received <date>; added automatically. <one-line ask>". Never store health details beyond the care type. If they want no calls / email only, put "NO CALLS" / "EMAIL ONLY" first in notes (call_priority -100 for no contact).
4. Agency status requests: append "<date>: <agency> advisor asked for an update"; 2+ waiting = one push notification.
5. Closures from agencies: dated note; if still New, Status Lost (or Closed - Deceased), stage CLOSED.
6. One push notification per new Hot lead: "New <channel> lead: <first name>, <care type>, <timeframe>. In {{ADVISOR_NAME}}'s tracker." Report in 3 lines, or "no new leads".
```

### 8b. Daily call list email (weekdays 7:43am, `CRON_TZ={{TIME_ZONE}} 43 7 * * 1-5`)

```
Scheduled run: {{FACILITY_SHORT}} Daily Call List. Ownership wants ONE simple daily "who to call today" email to the Senior Advisor {{ADVISOR_NAME}} ({{ADVISOR_EMAIL}}), built from the Airtable Leads CRM, linking to https://{{SITE_DOMAIN}}/team/#calls (opens My Calls Today; the website remembers the phone for 180 days). Overseers ({{OVERSEER_EMAILS}}) make no calls and never get this email. The advisor is not comfortable with technology: keep it short, big and plain. {{FACILITY_NAME}}, {{FACILITY_TYPE}}, {{ADDRESS}}; main line {{MAIN_PHONE}}, sales line {{SALES_PHONE}}. Nobody is watching this run.

INTERNAL email to staff only. Never email, text or call families or agencies. Never include health or medical details (care type is fine). Never put passwords in these emails.

TOOLS: Airtable list/update records, Gmail search/get_thread/send_message. Base {{BASE_ID}}, Leads {{LEADS_TABLE_ID}}, Referral Sources {{PARTNERS_TABLE_ID}} (field IDs from the schema).

STEPS
1. LOG EMAIL REPLIES (backup path): replies from {{ADVISOR_EMAIL}} in the last 3 days to "Call list for" emails. For each outcome (by name or list number) set "What happened on the call?" to the closest choice and "What's next?" if stated, and append "<date> (by email): <outcome as written>" to Notes (optional). The after-call automation records the rest. Re-read the lead a minute later; only if Contacted is still unticked (automation off), do the same updates by hand (Contacted, Call back on, Last Touch Date, Touch Count, Status). Skip anything already in Call history.
2. BUILD the list with EXACTLY the My Calls Today page rule: Open? = 1; Heads up is not DO NOT CALL; call_priority empty or > 0; has a phone or email; and (Call back on <= today, or Status New + Contacted unticked + Lead Received within 21 days, or Reminder contains "After tour"). Also exclude names on an active lease if a resident list is available. Order: Hot first, then oldest Call back on, then newest new lead. Max 12; if more, say "+N more in the app". Add "Partner visits due" (Referral Sources with Next Visit / Call <= today).
3. EMAIL the advisor only if the list has at least one item (to {{ADVISOR_EMAIL}}, cc {{OWNER_CC}}; subject "Call list for <Weekday, Mon D>: <N> families"). HTML, max 600px, 17px text, white background: a big button "Open My Calls Today" to https://{{SITE_DOMAIN}}/team/#calls at the top and bottom; numbered list, one line each: Reminder in bold, Who to call, source/channel, What's next?. Close: "Tap a name, call, then pick what happened and what's next. That's it. You can also reply to this email (for example: 1 reached, tour Thu 2pm / 2 voicemail) and it will be saved for you." Plain-text alternative. Send once per day (skip if today's email is already in Sent).
4. Report in 2 lines: replies logged, number of families (first names only).
```

---

## 9. Ten-minute training script for a new advisor

Do this sitting next to them, on **their** phone.

**Minute 0-2: get in once.**
- "Open the email from Airtable and tap Accept. Sign in with your work email." (Make sure "keep me signed in" is on.)
- "Now open {{SITE_DOMAIN}}/team/ in Safari/Chrome. Type your username and password from ownership. Leave 'Keep me signed in' ticked."
- Tap **Make the phone icon** and follow the two steps on screen. Close the browser and tap the new **My Calls** icon: it opens today's list. "From now on, this icon is all you need."

**Minute 2-5: the list.**
- "This is My Calls Today. Only the families you should call today are here. The most important one is at the top."
- "The grey line under the name tells you why: CALL TODAY, OVERDUE, New lead. If it starts with EMAIL OR TEXT ONLY or CALL AFTER 5PM, do that instead of calling now."
- "You don't need to search or filter anything. When you finish a family, it disappears from today's list by itself."

**Minute 5-8: one practice call (use the TEST record or a real family together).**
- Tap the name. "Step 1: tap the phone number. Your phone dials."
- "Step 2: after the call, pick What happened. Then pick What's next. Type a short note only if it helps, like 'call after 3, daughter works days'."
- "Wait a few seconds: your answer moves down to Last call result and the next call date is filled in. That means it's saved. There is no Save button."
- "Tap Back. Next family."
- "If the family asked for a certain day, change Call back on. If you booked a tour, put the day and time in Tour Date."

**Minute 8-10: two more things.**
- "Someone calls in? Open **Find a family** from the menu (or the website), type their name or the last 4 digits of their phone, tap them, and log the call the same way."
- "Every weekday at about 7:45 you get an email with today's list. The button opens the same page. You can also just reply to that email, for example '1 reached, tour Thu 2pm, 2 voicemail', and it is saved for you."
- "Stuck or something looks wrong? Call ownership. You can't break anything: every call is kept in Call history."

---

## 10. Kirby Gate state as of 2026-11-11 (reference)

- Interfaces: **Kirby Gate Calls** (staff: My Calls Today, Find a Family, Referral Partners), **Kirby Gate Lead Tracker** (managers: Results, Closed & Moved In, Referrals, New Website & Walk-in Leads, Referral Partners, Tours & Applications, All Leads, My Calls Today), **Content Engine** (owner only: News, Approvals). Standalone form "Share an article" (content, owner only).
- Record detail pages: Call a Family (new), Lead Detail (Referrals), Lead Detail, Lead Detail (read only), Partner Detail.
- New field: Leads > Today order. Changed: Leads > Reminder now starts with the Heads up warning on open leads, and ends "Open - no call date set" instead of blank.
- After-call automation revised and tested; it must be switched on in Airtable by a person.
