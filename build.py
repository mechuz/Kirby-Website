#!/usr/bin/env python3
"""Static site builder for kirbygateliving.com.

Wraps each content/*.html body in templates/base.html and writes the
result into public/. Page metadata lives in an HTML comment block at the
top of each content file:

    <!--meta
    title: Page Title
    description: Meta description.
    path: /some-page/
    nav: about        (which nav item gets aria-current)
    body_attr:  data-page="thank-you"   (optional)
    sitemap: yes|no   (default yes)
    -->

Usage: python3 build.py
"""
import datetime
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).parent
TEMPLATE = (ROOT / "templates" / "base.html").read_text()
CONTENT = ROOT / "content"
PUBLIC = ROOT / "public"

NAV_KEYS = ["home", "about", "al", "mc", "respite", "amenities", "cal", "rates", "reviews", "shop", "contact"]

ICONS = {
 "dining":   '<path d="M5 3v7a3 3 0 0 0 6 0V3"/><path d="M8 3v18"/><path d="M18 3c-2.2 0-3.5 2.8-3.5 6v4H18v8"/>',
 "home":     '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
 "clock":    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 "sparkle":  '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>',
 "calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 "pill":     '<path d="M10.5 3.5l10 10a4.95 4.95 0 0 1-7 7l-10-10a4.95 4.95 0 0 1 7-7z"/><path d="M8.5 8.5l7 7"/>',
 "tree":     '<path d="M12 2l6 9h-4l5 7H5l5-7H6z"/><path d="M12 18v4"/>',
 "car":      '<path d="M5 17h14M3 12l2-5h14l2 5v5H3z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
 "heart":    '<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
 "shield":   '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
 "users":    '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20a5 5 0 0 1 6-4"/>',
 "bed":      '<path d="M3 18v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M3 14h18M7 8V6"/>',
 "phone":    '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
 "map":      '<path d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z"/><circle cx="12" cy="10" r="2.5"/>',
 "music":    '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
 "scissors": '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/>',
 "book":     '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
 "flame":    '<path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3.5.5 1.5 1.5 2 2 2 0-3-1-5 1-7.5z"/>',
 "dumbbell": '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
 "eho":      '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 13h6M9 16h6"/>',
 "access":   '<circle cx="12" cy="4" r="1.6"/><path d="M10 8h5l1 5h4M10 8v5h5"/><path d="M8.5 13a4.5 4.5 0 1 0 6 5"/>',
 "brain":    '<path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 2 5v1a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3zM15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-2 5v1a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3z"/>',
}
def icon(name):
    body = ICONS[name]
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            'stroke-linecap="round" stroke-linejoin="round" width="26" height="26">' + body + '</svg>')

def parse(src: str):
    m = re.match(r"\s*<!--meta\s*(.*?)-->\s*", src, re.S)
    if not m:
        sys.exit("content file missing <!--meta --> block")
    meta = {}
    for line in m.group(1).strip().splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    return meta, src[m.end():]

def fhash(path):
    return hashlib.md5(path.read_bytes()).hexdigest()[:8]

def check_unique_images():
    """No photo may appear more than once across the whole site (visual slots only)."""
    import collections
    counts = collections.Counter()
    pat = re.compile(r"/assets/img/([A-Za-z0-9_-]+)\.webp")
    skip_prefixes = ("logo", "favicon", "floorplan")
    for f in CONTENT.glob("*.html"):
        if f.stem.endswith(".head"):
            continue
        for name in pat.findall(f.read_text()):
            if name.startswith(skip_prefixes):
                continue
            counts[name] += 1
    dups = {k: v for k, v in counts.items() if v > 1}
    if dups:
        sys.exit(f"BUILD FAILED — image(s) used more than once: {dups}")

def render_calendar():
    import calendar as _cal, json as _json
    f = CONTENT / "calendar.json"
    if not f.exists():
        return ""
    d = _json.loads(f.read_text())
    month_num = list(_cal.month_name).index(d["month"])
    first_wd = _cal.weekday(d["year"], month_num, 1)      # Mon=0..Sun=6
    lead = (first_wd + 1) % 7                              # Sun-first grid
    ndays = _cal.monthrange(d["year"], month_num)[1]
    out = [f'<div class="center"><p class="eyebrow">Updated Monthly</p>'
           f'<h2>{d["month"]} {d["year"]} at The Pointe</h2></div>']
    out.append('<div class="cal-wrap"><div class="cal-grid">')
    for w in ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]:
        out.append(f'<div class="cal-wd">{w}</div>')
    for _ in range(lead):
        out.append('<div class="cal-cell cal-blank"></div>')
    import html as _h
    for day in range(1, ndays + 1):
        key = str(day)
        special = d.get("special", {}).get(key)
        badge = f'<span class="cal-badge">{_h.escape(special)}</span>' if special else ""
        evs = "".join(
            f'<li><strong>{_h.escape(e.split(" ", 1)[0])}</strong> {_h.escape(e.split(" ", 1)[1])}</li>'
            if " " in e and e.split(" ", 1)[0][0].isdigit() else f"<li>{_h.escape(e)}</li>"
            for e in d["days"].get(key, []))
        wd_name = _cal.day_name[_cal.weekday(d["year"], month_num, day)]
        out.append(f'<div class="cal-cell"><div class="cal-day"><span class="cal-num">{day}</span>'
                   f'<span class="cal-wd-sm">{wd_name[:3]}</span>{badge}</div><ul>{evs}</ul></div>')
    out.append("</div></div>")
    note = d.get("note")
    if note:
        out.append(f'<p class="form-note center" style="margin-top:1.5rem">{note}</p>')
    return "\n".join(out)

def build():
    check_unique_images()
    year = str(datetime.date.today().year)
    css_v = fhash(PUBLIC / "assets" / "css" / "main.css")
    js_v = fhash(PUBLIC / "assets" / "js" / "main.js")
    sitemap_paths = []
    for f in sorted(CONTENT.glob("*.html")):
        if f.stem.endswith(".head"):
            continue
        meta, body = parse(f.read_text())
        html = TEMPLATE
        body = re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: icon(m.group(1)), body)
        if "{{calendar}}" in body:
            body = body.replace("{{calendar}}", render_calendar())
        import html as _html
        repl = {
            "title": _html.escape(meta["title"], quote=False),
            "description": _html.escape(meta.get("description", ""), quote=True),
            "path": meta["path"],
            "content": body,
            "year": year,
            "css_v": css_v,
            "js_v": js_v,
            "head_extra": meta.get("head_extra", ""),
            "body_attr": (" " + meta["body_attr"]) if meta.get("body_attr") else "",
        }
        for key in NAV_KEYS:
            repl[f"active_{key}"] = 'aria-current="page"' if meta.get("nav") == key else ""
        for k, v in repl.items():
            html = html.replace("{{%s}}" % k, v)
        html = re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: icon(m.group(1)), html)
        # Support per-page head extras stored in a sibling file
        extra_file = CONTENT / (f.stem + ".head.html")
        if extra_file.exists():
            html = html.replace("</head>", extra_file.read_text() + "\n</head>")
        path = meta["path"]
        out = PUBLIC / path.strip("/") / "index.html" if path != "/" else PUBLIC / "index.html"
        if f.stem == "404":
            out = PUBLIC / "404.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html)
        if meta.get("sitemap", "yes") != "no" and f.stem != "404":
            sitemap_paths.append(path)
        print(f"built {out.relative_to(ROOT)}")

    today = datetime.date.today().isoformat()
    urls = "\n".join(
        f"  <url><loc>https://www.kirbygateliving.com{p}</loc><lastmod>{today}</lastmod></url>"
        for p in sitemap_paths
    )
    (PUBLIC / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>\n"
    )
    (PUBLIC / "robots.txt").write_text(
        "User-agent: *\nAllow: /\nSitemap: https://www.kirbygateliving.com/sitemap.xml\n"
    )
    # GitHub Pages custom domain
    (PUBLIC / "CNAME").write_text("www.kirbygateliving.com\n")
    build_redirects()
    print(f"built sitemap.xml ({len(sitemap_paths)} urls) + robots.txt")

def build_redirects():
    """GitHub Pages ignores public/_redirects (a Netlify/Cloudflare convention),
    so emit a meta-refresh stub for each legacy URL listed there. The stub is
    noindex + canonical to the target so search engines consolidate on the new URL."""
    rfile = PUBLIC / "_redirects"
    if not rfile.exists():
        return
    n = 0
    for line in rfile.read_text().splitlines():
        parts = line.split()
        if len(parts) < 2 or parts[0].startswith("#"):
            continue
        src, dst = parts[0], parts[1]
        target = dst if dst.startswith("http") else "https://www.kirbygateliving.com" + dst
        out = PUBLIC / src.strip("/") / "index.html"
        if out.exists() and "<!-- redirect stub -->" not in out.read_text():
            sys.exit(f"BUILD FAILED — redirect {src} collides with a real page")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(
            "<!doctype html><!-- redirect stub --><html lang=\"en\"><head><meta charset=\"utf-8\">"
            f"<title>Redirecting…</title><meta name=\"robots\" content=\"noindex\">"
            f"<link rel=\"canonical\" href=\"{target}\">"
            f"<meta http-equiv=\"refresh\" content=\"0; url={target}\">"
            f"<script>location.replace(\"{target}\")</script></head>"
            f"<body><p>This page has moved to <a href=\"{target}\">{target}</a>.</p></body></html>\n"
        )
        n += 1
    print(f"built {n} redirect stubs from _redirects")

if __name__ == "__main__":
    build()
