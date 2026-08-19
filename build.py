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
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).parent
TEMPLATE = (ROOT / "templates" / "base.html").read_text()
CONTENT = ROOT / "content"
PUBLIC = ROOT / "public"

NAV_KEYS = ["home", "about", "al", "mc", "amenities", "rates", "reviews", "contact"]

def parse(src: str):
    m = re.match(r"\s*<!--meta\s*(.*?)-->\s*", src, re.S)
    if not m:
        sys.exit("content file missing <!--meta --> block")
    meta = {}
    for line in m.group(1).strip().splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    return meta, src[m.end():]

def build():
    year = str(datetime.date.today().year)
    sitemap_paths = []
    for f in sorted(CONTENT.glob("*.html")):
        if f.stem.endswith(".head"):
            continue
        meta, body = parse(f.read_text())
        html = TEMPLATE
        repl = {
            "title": meta["title"],
            "description": meta.get("description", ""),
            "path": meta["path"],
            "content": body,
            "year": year,
            "head_extra": meta.get("head_extra", ""),
            "body_attr": (" " + meta["body_attr"]) if meta.get("body_attr") else "",
        }
        for key in NAV_KEYS:
            repl[f"active_{key}"] = 'aria-current="page"' if meta.get("nav") == key else ""
        for k, v in repl.items():
            html = html.replace("{{%s}}" % k, v)
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
    print(f"built sitemap.xml ({len(sitemap_paths)} urls) + robots.txt")

if __name__ == "__main__":
    build()
