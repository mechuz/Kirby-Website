# Daily Rounds (live mock survey): setup and account management

The staff app, called **Daily Rounds**, at **kirbygateliving.com/rounds/** (the old /mock-survey/ address forwards there) is a page on this website. Staff sign in with a username and password; no other app or account is needed. Accounts, permissions and survey data live in a Supabase project (a hosted Postgres database with sign-in built in). The website itself never stores passwords or survey data.

| Piece | Where |
|---|---|
| App page | `content/rounds.html` (layout `app`, built by `build.py`) |
| App code / styles | `public/assets/js/mock-survey.js`, `public/assets/css/mock-survey.css` |
| Sign-in library | `public/assets/js/vendor/supabase-2.119.2.js` (served from our own site) |
| Project address + public key | `public/assets/js/mock-survey-config.js` |
| Database, permissions, account tools | `docs/mock-survey/schema.sql` |
| 3:00 PM results email | `scripts/mock_survey_report.py`, `.github/workflows/mock-survey-report.yml` |
| Starting passwords | `team-private/` only (git-ignored, never committed) |

## One-time setup (about 15 minutes)

1. **Create the project.** Sign up at supabase.com, then **New project**. Name it `kirby-gate-mock-survey`, choose a US East region, and save the database password somewhere safe (you will not need it day to day).
2. **Turn off public sign-ups.** Authentication → Sign In / Providers → Email: switch off **Allow new users to sign up**. Only accounts made with `add_staff` can exist.
3. **Create the database.** SQL Editor → New query → paste all of `docs/mock-survey/schema.sql` → **Run**.
4. **Create the accounts.** SQL Editor → New query → paste the `add_staff` lines you were given (from `team-private/mock-survey-accounts.sql`) → **Run**. Each line prints `Created …`.
5. **Connect the website.** Project Settings → API Keys. Copy the **Project URL** and the **publishable** key (older projects call it the `anon` key) into `public/assets/js/mock-survey-config.js`. Both are meant to be public. **Never** put the `service_role`/secret key in the website.
6. **Publish** the site (push to `main`). Open the page on a phone and sign in.

## 3:00 PM results email

GitHub sends it from `.github/workflows/mock-survey-report.yml`. Add these under GitHub → repository **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | the Project URL from step 5 |
| `SUPABASE_SERVICE_KEY` | Project Settings → API Keys → **secret** (`service_role`) key. Only here, never in the website. |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `587` for Gmail or Google Workspace |
| `SMTP_USER` / `SMTP_PASSWORD` | the sending mailbox and a Google **app password** for it (Google Account → Security → 2-Step Verification → App passwords) |
| `REPORT_FROM` | the sending address (usually the same as `SMTP_USER`) |
| `REPORT_TO` | recipients, comma separated |

To test right away: GitHub → **Actions** → *Mock survey 3 PM results email* → **Run workflow** → tick **force**. GitHub's scheduler can start a few minutes late; the script sends once per day between 3:00 and 5:00 PM Central.

## Managing people (SQL Editor)

Department ids (5 checklists): `nursing` (Nursing + Memory Care), `activities`, `dietary`, `maint` (Maintenance + Housekeeping), `admin` (Administration + Staffing/HR + Resident Rights/Admissions).
Roles: `admin` (changes every department), `director` (changes only their departments), `viewer` (reads only).

```sql
-- add someone (they must change the password at first sign-in)
select add_staff('tasha', 'Tasha', 'director', array['maint'], 'Temporary-Pass-2468');
-- forgot password: set a new temporary one
select reset_staff_password('dion', 'Temporary-Pass-1357');
-- change role or departments
select set_staff_access('laketa', 'director', array['nursing']);
-- someone leaves: blocks sign-in and signs them out everywhere
select set_staff_active('dion', false);
```

## Rules the database enforces

- Nobody reads anything without signing in. A deactivated account cannot read or write.
- Directors change only their own departments, and only today's or yesterday's checklist. Leadership (`admin`) can change everything.
- A submitted checklist is locked until it is reopened. "Submitted at" is stamped by the server, so the 2:30 PM deadline cannot be faked.
- Every change is recorded in `change_log` (who, what, when). Leadership can read it.

## Privacy

Findings must use room numbers or initials, never resident names; the app says so on every finding form. Supabase's free plan does not include a HIPAA business associate agreement. If resident health information ever needs to be stored here, move to a plan that includes one first.
