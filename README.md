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

## To update content

Edit the relevant file in `content/`, run `python3 build.py`, commit, push. Cloudflare Pages redeploys automatically on push (~30 seconds). Photos go in `public/assets/img/` (keep them under ~700KB; `sips -s format jpeg -s formatOptions 65 --resampleWidth 1800 in.jpg --out out.jpg`).

## Go-live checklist (one-time)

1. **GitHub**: create a private repo (e.g. `medhcp/kirbygateliving`), push this folder.
2. **Cloudflare**: create a free account (or use existing) → Workers & Pages → Create → Pages → connect the GitHub repo. Build command: `python3 build.py` (or none, since `public/` is committed). Output directory: `public`.
3. **Add the domain**: in the Pages project → Custom domains → add `kirbygateliving.com` and `www.kirbygateliving.com`. Cloudflare will ask to move DNS: in **GoDaddy** → Domain Settings → Nameservers → change to the two Cloudflare nameservers it shows. (Domain stays registered at GoDaddy; only DNS moves. Keep any MX/email records — Cloudflare imports them, verify email still works.)
4. **Wait for DNS** (minutes to a few hours), confirm the new site is live at kirbygateliving.com.
5. **Form activation**: submit the contact form once; FormSubmit sends a one-time activation email to info@kirbygateliving.com — click it. After that, every submission lands in that inbox.
6. **Google Ads form conversion**: in Google Ads → Goals → Conversions → New → Website → "Submit lead form" (page-load on `/thank-you/`), copy the conversion **label**, paste it into `FORM_CONVERSION_LABEL` in `public/assets/js/main.js` (and `assets/js/main.js` stays in git), rebuild, push. Phone-call conversions are already tracked via call reporting.
7. **Cancel BigRig** — only after the new site has been live and stable for a few days. Before cancelling, confirm: (a) email for info@kirbygateliving.com is NOT hosted by BigRig (check MX records), (b) you have the mirrored copy of the old site (in this repo's history / scratch archive).

## Integrations (site side — already wired)

- **Google Ads**: gtag `AW-18300279647` on every page; `/thank-you/` fires the form conversion once the label is set.
- **TikTok / Shop**: footer links to @thepointeatkirbygate and the Fourthwall shop.
- **SEO**: same URL structure as the old site (no redirects needed), JSON-LD local-business schema, sitemap.xml, per-page meta. Submit the sitemap in Google Search Console after go-live.
- **Google Business Profile / Facebook / Instagram**: link the site from those profiles; add FB/IG URLs to the footer (templates/base.html) once the accounts are confirmed.

## Old site mirror

The full WordPress site (HTML + extracted text + images) was mirrored before rebuild; content was carried over verbatim. Legacy URLs preserved: `/about-us/`, `/assisted-living/`, `/memory-care/`, `/amenities/`, `/rates-floor-plans/`, `/contact-us/`, `/privacy-policy/`, `/terms-of-service/`, `/ada-compliance/`.
