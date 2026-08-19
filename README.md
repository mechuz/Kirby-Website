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
