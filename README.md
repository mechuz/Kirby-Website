# kirbygateliving.com — The Pointe at Kirby Gate

Static website for The Pointe at Kirby Gate (assisted living & memory care, 6480 Quince Rd, Memphis, TN 38119). Replaces the WordPress site hosted by BigRig/Get Indio ($200/mo) with a self-owned site on Cloudflare Pages ($0/mo).

## How it works

- `content/*.html` — one file per page (body only, with a `<!--meta -->` block for title/description/URL)
- `templates/base.html` — shared header, footer, Google Ads tag
- `build.py` — assembles `public/` from the above; also generates `sitemap.xml` + `robots.txt`
- `public/` — the deployable site (never edit by hand; edit `content/` and rebuild)

```bash
python3 build.py
```

Preview locally:

```bash
cd public && python3 -m http.server 8741
```

## Blog (Family Resources)

- One file per post in `content/blog/<slug>.html`. Same `<!--meta -->` block as a page, plus `date` (YYYY-MM-DD, required), `headline`, `excerpt`, `image` (a `/assets/img/...` path), `image_alt`, `author`, `tags` (comma separated), `keyword`, `updated`, and `status` (`published` or `draft`; drafts are skipped).
- The body is HTML (paragraphs, `h2`/`h3`, lists). `{{phone_fmt}}` and `{{phone_tel}}` work inside posts. A sibling `content/blog/<slug>.head.html` is injected into `<head>` (for FAQ schema, etc.).
- The build writes `/blog/<slug>/`, the `/blog/` index, `/feed.xml` (RSS) and sitemap entries, with Article and BreadcrumbList schema on every post.
- To publish: add the file, `python3 build.py`, commit, push. Post images go in `public/assets/img/blog/` (under ~300KB, 1600px wide).

## Senior Care News

- `/news/` is a curated page of short summaries that link out to other publishers' articles (paying for care, health research, caregiving, policy, local news) plus our own community updates. One file per item in `content/news/<slug>.html`; the file name is the slug (lowercase letters, digits and hyphens) and the item's anchor on the page (`/news/#<slug>`).
- Each file is a `<!--meta -->` block followed by a short HTML body:

  ```
  <!--meta
  title: Headline, plain text
  source: Publisher name
  source_url: https://... (for category community, a path on this site such as /blog/ also works)
  date: 2026-10-28       (the day we posted it; items are listed newest first)
  published: 2026-10-01  (the article's own date, optional)
  category: finance | health | caregiving | policy | local | community
  status: published      (optional; draft files are skipped)
  -->
  <p>Two or three sentence summary in our own words.</p>
  <p class="why">Why it matters: one line for families (optional).</p>
  ```
- Categories and their labels: `finance` = Paying for care, `health` = Health & research, `caregiving` = Caregiving & family, `policy` = Policy & benefits, `local` = Memphis & Mid-South, `community` = Community update.
- The body may only use `p`, `a`, `strong`, `em`, `ul`, `ol` and `li`. The build stops with a clear message on a bad slug; a missing title, source_url, date or category; an unknown category; a source_url that is not http(s); or a body containing script, iframe, style, object, embed, form or `on*` attributes. Everything from the meta block is HTML-escaped on output.
- The build writes `/news/` (the newest 60 items under month headings, with topic filter chips), `/news/archive/<year>/` for anything older, `/news/feed.xml` (RSS, newest 20) and sitemap entries, with CollectionPage, ItemList and BreadcrumbList schema. External links open in a new tab. Write summaries in our own words and keep any quotation to a few words.

## To update content

Edit the relevant file in `content/`, run `python3 build.py`, commit, push. Cloudflare Pages redeploys automatically on push (~30 seconds). Photos go in `public/assets/img/` (keep them under ~700KB; `sips -s format jpeg -s formatOptions 65 --resampleWidth 1800 in.jpg --out out.jpg`).

## Go-live checklist (one-time) — GoDaddy DNS + GitHub Pages (free)

DNS and the domain stay fully in GoDaddy; the files are hosted free on GitHub Pages. `.github/workflows/deploy.yml` rebuilds and redeploys the site automatically on every push.

1. **Publish the repo** (GitHub Desktop): Add Local Repository → this folder → Publish repository. Name it `kirbygateliving`, **uncheck "Keep this code private"** (free GitHub Pages requires a public repo).
2. **Enable Pages**: on github.com → the repo → Settings → Pages → Source: **GitHub Actions**. The deploy workflow will run and publish to `https://<username>.github.io/kirbygateliving/`.
3. **Custom domain**: same Settings → Pages page → Custom domain: `www.kirbygateliving.com` → Save. Check "Enforce HTTPS" once the certificate is issued (can take a few minutes after DNS).
4. **GoDaddy DNS** (My Products → kirbygateliving.com → DNS):
   - Edit the `www` **CNAME** record → value `<username>.github.io` (replace the old BigRig value)
   - Replace the apex `@` **A** record(s) with four A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - **Do not touch MX / email records.**
   - Wait a few minutes–hours for DNS, then confirm https://www.kirbygateliving.com shows the new site (apex redirects to www automatically).
5. **Form activation**: submit the contact form once from the live site; FormSubmit sends a one-time activation email to mechuz@kirbygateliving.com (the form's recipient) — click it. After that, every submission lands in that inbox with copies to community@kirbygateliving.com and reception@kirbygateliving.com. Changing the recipient address means activating again.
6. **Google Ads form conversion**: in Google Ads → Goals → Conversions → New → Website → "Submit lead form" (page-load on `/thank-you/`), copy the conversion **label**, paste it into `FORM_CONVERSION_LABEL` in `public/assets/js/main.js` (and `assets/js/main.js` stays in git), rebuild, push. Phone-call conversions are already tracked via call reporting.
7. **Cancel BigRig** — only after the new site has been live and stable for a few days. Before cancelling, confirm: (a) email for community@kirbygateliving.com is NOT hosted by BigRig (check MX records), (b) you have the mirrored copy of the old site (in this repo's history / scratch archive).

## Integrations (site side — already wired)

- **Google Ads**: gtag `AW-18300279647` on every page; `/thank-you/` fires the form conversion once the label is set.
- **TikTok / Shop**: footer links to @thepointeatkirbygate and the Fourthwall shop.
- **Yelp**: footer + Reviews-page links to [the Yelp listing](https://www.yelp.com/biz/the-pointe-at-kirby-gate-memphis-2) (read + write-a-review), listed in the JSON-LD `sameAs`, and outbound clicks tracked as a `review_click` gtag event. On the Yelp for Business side, set the listing's website to `https://www.kirbygateliving.com` so the link goes both ways.
- **SEO**: same URL structure as the old site (no redirects needed), JSON-LD local-business schema, sitemap.xml, per-page meta. Submit the sitemap in Google Search Console after go-live.
- **Google Business Profile / Facebook / Instagram**: link the site from those profiles; add FB/IG URLs to the footer (templates/base.html) once the accounts are confirmed.

## Old site mirror

The full WordPress site (HTML + extracted text + images) was mirrored before rebuild; content was carried over verbatim. Legacy URLs preserved: `/about-us/`, `/assisted-living/`, `/memory-care/`, `/amenities/`, `/rates-floor-plans/`, `/contact-us/`, `/privacy-policy/`, `/terms-of-service/`, `/ada-compliance/`.

## Automated publishing from Airtable

`.github/workflows/publish-blog.yml` runs daily at 15:30 UTC and on demand from the Actions tab ("Publish approved blog posts and news", Run workflow). It calls `scripts/publish_from_airtable.py prepare`, which reads two tables of the Kirby Gate Lead Engine base:

- **Content Items** (Channel = Blog, Status = Approved, Compliance Check ticked, Publish Date in the past): each article is written as `content/blog/<slug>.html` and its linked approved photo is downloaded into `public/assets/img/blog/`.
- **News Items** (Status = Approved, Compliance Check ticked, Post Date blank or not in the future, America/Chicago): each item is written as `content/news/<slug>.html` for the Senior Care News page, oldest Post Date first. A row needs a title (160 characters max), a source (unless the category is Community update), an `http(s)://` link (a site path such as `/activities-calendar/` is allowed for community updates), a category and a 20-160-word summary; HTML is stripped from the text (the summary and the why line are then HTML-escaped into the file's body, since `build.py` renders that body as HTML) and anything containing scripts, iframes, forms or event handlers is refused. The slug is the row's Slug when valid, otherwise `YYYY-MM-DD-<title>`, and the Published URL written back is `https://www.kirbygateliving.com/news/#<slug>`.

After each file is written it runs `build.py` to make sure the site still builds. The workflow then commits those files to `main`, marks the rows Published in Airtable (`finalize`: Published URL, Published At and a Publish Log that ends with the commit hash) and starts the deploy workflow. Columns are addressed by field id, so renaming a column in Airtable does not break publishing.

Requirements: a repository secret named `AIRTABLE_TOKEN` holding an Airtable personal access token with `data.records:read`, `data.records:write` and `schema.bases:read` on that base. Without it the workflow exits quietly. Rows that cannot be published are set to Failed with the reason in Publish Log. A row whose file is already committed on `main` (a previous run pushed it but could not reach Airtable afterwards) is only marked Published. A slug can only be used once: when another row already took it earlier in the same run, or its file exists without being committed, the row is set to Failed with the reason, so two rows never silently share one `/news/#<slug>` (two news rows with the same title and Post Date and no Slug fall back to the same `YYYY-MM-DD-<title>` slug, so give one of them a Slug). At most two articles (`MAX_POSTS`) and five news items (`MAX_NEWS`) are published per run.

Tests: `bash scripts/tests/run.sh` copies the repository to a temporary directory, starts a fake Airtable API (`scripts/tests/mock_airtable.py`, standard library only, no network) on a free port with a handful of fixture rows, runs `prepare` and `finalize` against it, checks the files written, the `GITHUB_OUTPUT` values and the updates sent back to Airtable, and prints PASS or FAIL.
