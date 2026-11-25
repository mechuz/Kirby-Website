# Daily Rounds: HIPAA checklist

Findings in Daily Rounds can mention residents (room numbers, initials, care
issues), so the system is treated as holding protected health information (PHI).
HIPAA compliance is part technology, part contracts and part written policy.
This page tracks all three.

## Built into the app and database (done)

| Safeguard | How |
|---|---|
| Unique sign-in per person | Supabase Auth, one username per staff member; no shared logins |
| Own password required | Nothing can be read or changed until the starting password is replaced (checked in the database) |
| Minimum necessary access | Department heads read only their own department; leadership reads all (row-level security) |
| Write controls | One write function checks role and department, stamps server time, keeps a change log |
| Audit controls | `change_log` (every edit) and `access_log` (open, screens viewed, print, export, auto sign-out), leadership-only, append-only |
| Automatic logoff | Signed out after 15 minutes without activity, also checked when the phone wakes or the app reopens |
| Nothing stored on the phone | Records live only in memory; the phone keeps just the sign-in token and preferences |
| Encryption | HTTPS/TLS in transit; Supabase encrypts data at rest (AES-256) |
| No PHI in email or GitHub | The 3:00 PM email and the GitHub Action request only codes, counts, dates and statuses, never the free-text finding fields |
| Disclosures | Sign-in warning (authorized use, monitoring); 11-point confidentiality and acceptable-use rules every person must agree to before anything opens, recorded with date, time and device (`staff_terms`); "Privacy & rules" page and a confidentiality notice under every screen; CONFIDENTIAL notices on printed packets (every page), CSV downloads and the 3:00 PM email |
| Demo is separate | /rounds/demo/ runs on sample data in the browser and never touches the database |

## Owner steps (Supabase dashboard and contracts, cannot be done in code)

1. Upgrade the **Kirby** organization to the **Team plan** or higher (Billing).
2. Request the **HIPAA add-on** (https://forms.supabase.com/hipaa2) and **sign the BAA**.
3. In project **kirby-gate-mock-survey**, Settings > General: mark it **High Compliance**.
4. Add at least the **Small compute add-on**, then turn on **Point-in-Time Recovery** (backups).
5. Turn on **SSL enforcement** and **Network restrictions** (Database settings). The app uses the API, so this does not affect staff.
6. Turn on **MFA** for every Supabase dashboard account and **enforce MFA** for the organization.
7. Authentication settings:
   - turn **off** "Allow new users to sign up";
   - set the minimum password length to **10**;
   - turn **on** leaked-password protection.
8. Re-run the Security Advisor and fix anything it flags under High Compliance.

## The in-app rules (disclosures)

The rules shown in the app (`disclosures()` in `public/assets/js/mock-survey.js`) cover:
1. authorized use only;
2. confidential resident information (PHI, minimum necessary);
3. what to write (room numbers or initials only);
4. monitoring and logging;
5. device security and auto sign-out;
6. reporting problems the same day;
7. records are official;
8. not for emergencies (call 911);
9. not the medical record;
10. consequences;
11. information kept about staff.

To change the wording, edit that list and raise `TERMS_VERSION`; everyone is then asked to agree again.
Have healthcare counsel review the wording once. Residents' own Notice of Privacy Practices is a facility
document given to residents; it is not part of this staff app.

To see who has agreed, run the query at the end of `schema.sql` in the Supabase SQL Editor.

## Policies and paperwork (administrative safeguards)

- Name a **Privacy Officer** and a **Security Officer** (can be the same person).
- Do a written **risk analysis** covering Daily Rounds, the website and email. Review it yearly.
- Keep a **BAA log**: Supabase (needed). Google Workspace (recommended for staff email; accept the HIPAA BAA in the Admin console under Account > Legal and compliance).
- GitHub and the website host need no BAA, because no PHI reaches them.
- **Workforce training** at hire and yearly. Staff sign that they:
  - use only their own login;
  - use room numbers or initials, never full names;
  - never screenshot or forward records.
- **Device rules**: a screen lock on any phone used for Daily Rounds; report lost phones the same day; deactivate the account with `select set_staff_active('username', false);`.
- **Access reviews**: monthly, leadership reviews `access_log`, and deactivates anyone who has left.
- **Breach response**: who to call, how to assess, and notification within 60 days.
- **Keep records 6 years**: policies, risk analyses, training sign-offs and BAAs.

Whether Kirby Gate is a HIPAA *covered entity* depends on how it bills
(electronic claims such as Medicaid waiver programs make it one). Following this
checklist is the right standard either way; confirm the covered-entity question
with healthcare counsel.
