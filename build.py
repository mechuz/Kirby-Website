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
import email.utils
import hashlib
import json
import pathlib
import re
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).parent
TEMPLATE = (ROOT / "templates" / "base.html").read_text()
CONTENT = ROOT / "content"
PUBLIC = ROOT / "public"

<<<<<<< HEAD
NAV_KEYS = ["home", "about", "al", "mc", "respite", "amenities", "cal", "rates", "reviews", "shop", "contact", "blog", "news"]
=======
NAV_KEYS = ["home", "about", "al", "mc", "respite", "amenities", "cal", "rates", "reserve", "reviews", "shop", "contact", "blog"]
>>>>>>> origin/main

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

def parse(src: str, name="content file"):
    m = re.match(r"\s*<!--meta\s*(.*?)-->\s*", src, re.S)
    if not m:
        sys.exit(f"BUILD FAILED — {name} is missing its <!--meta --> block")
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


# ---------------------------------------------------------------------------
# Blog ("Family Resources")
#
# One file per post in content/blog/<slug>.html, same <!--meta --> block as a
# page plus: date (YYYY-MM-DD, required), headline, excerpt, image, image_alt,
# author, tags (comma separated), keyword, updated (YYYY-MM-DD), status
# (published|draft; drafts are skipped). An optional content/blog/<slug>.head.html
# is injected into <head> (schema, extra meta). The build writes
# /blog/<slug>/index.html, /blog/index.html, /feed.xml and sitemap entries.
# ---------------------------------------------------------------------------
BLOG = CONTENT / "blog"
SITE = "https://www.kirbygateliving.com"
BLOG_TITLE = "Family Resources"
BLOG_INDEX_IMAGE = "/assets/img/exterior-front.webp"
BLOG_DEFAULT_CARD_IMAGE = "/assets/img/exterior-front.webp"
ORG = {"@type": "Organization", "name": "The Pointe at Kirby Gate", "url": SITE,
       "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/logo.png"}}


def _ld(data):
    """A JSON-LD <script> block. "</" is escaped inside the JSON so that text from
    a content file or Airtable can never close the tag early."""
    return ('<script type="application/ld+json">'
            + json.dumps(data, ensure_ascii=False).replace("</", "<\\/") + "</script>\n")


# The tour call to action under every blog post and news page ({{phone_*}} is resolved by render_html).
TOUR_CTA = """<div class="post-cta">
      <h2>Questions about care in East Memphis?</h2>
      <p>Our team answers questions like these every day, with no pressure. Call {{phone_fmt}} or schedule a private tour. Come for the visit, stay for lunch.</p>
      <p class="cta-actions"><a href="/contact-us/" class="btn btn-primary">Schedule a Tour</a> <a href="tel:{{phone_tel}}" class="btn btn-secondary" data-track="phone">Call {{phone_fmt}}</a></p>
    </div>"""


def render_html(meta, body, head_extra=""):
    """Wrap a body in templates/base.html. Placeholders inside the body
    ({{phone_fmt}}, {{icon:...}}) are resolved too."""
    import html as _html
    main_phone = meta.get("phone") == "main"
    html = TEMPLATE.replace("{{content}}", body)
    repl = {
        "phone_tel": "9017533449" if main_phone else "9012475835",
        "phone_fmt": "(901) 753-3449" if main_phone else "(901) 247-5835",
        "title": _html.escape(meta["title"], quote=False),
        "description": _html.escape(meta.get("description", ""), quote=True),
        "path": meta["path"],
        "year": str(datetime.date.today().year),
        "css_v": fhash(PUBLIC / "assets" / "css" / "main.css"),
        "js_v": fhash(PUBLIC / "assets" / "js" / "main.js"),
        "head_extra": meta.get("head_extra", "") + head_extra,
        "body_attr": (" " + meta["body_attr"]) if meta.get("body_attr") else "",
    }
    for key in NAV_KEYS:
        repl[f"active_{key}"] = 'aria-current="page"' if meta.get("nav") == key else ""
    for k, v in repl.items():
        html = html.replace("{{%s}}" % k, v)
    html = re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: icon(m.group(1)), html)
    return html


def _fmt_date(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.strftime('%B')} {d.day}, {d.year}"


def _rfc822(iso):
    d = datetime.date.fromisoformat(iso)
    dt = datetime.datetime(d.year, d.month, d.day, 12, 0, tzinfo=datetime.timezone.utc)
    return email.utils.format_datetime(dt)


def load_posts():
    posts = []
    if not BLOG.exists():
        return posts
    for f in sorted(BLOG.glob("*.html")):
        if f.stem.endswith(".head"):
            continue
        meta, body = parse(f.read_text(), f.name)
        if meta.get("status", "published").strip().lower() == "draft":
            continue
        slug = meta.get("slug", f.stem).strip()
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            sys.exit(f"BUILD FAILED — blog slug {slug!r} must be lowercase letters, digits and hyphens")
        if "date" not in meta:
            sys.exit(f"BUILD FAILED — blog post {f.name} has no date")
        datetime.date.fromisoformat(meta["date"])
        if meta.get("updated"):
            datetime.date.fromisoformat(meta["updated"])
        meta["path"] = f"/blog/{slug}/"
        meta.setdefault("nav", "blog")
        headline = meta.get("headline") or meta["title"].split(" | ")[0]
        words = len(re.sub(r"<[^>]+>", " ", body).split())
        head_file = BLOG / (f.stem + ".head.html")
        posts.append({
            "meta": meta, "body": body, "slug": slug, "path": meta["path"], "headline": headline,
            "excerpt": meta.get("excerpt") or meta.get("description", ""),
            "image": meta.get("image", ""), "image_alt": meta.get("image_alt", headline),
            "author": meta.get("author", "The Pointe at Kirby Gate"),
            "tags": [t.strip() for t in meta.get("tags", "").split(",") if t.strip()],
            "minutes": max(1, round(words / 200)),
            "head_extra": head_file.read_text() if head_file.exists() else "",
        })
    posts.sort(key=lambda p: (p["meta"]["date"], p["slug"]), reverse=True)
    return posts


def _post_card(p):
    import html as _h
    img = p["image"] or BLOG_DEFAULT_CARD_IMAGE
    return (
        f'<article class="card post-card">'
        f'<a href="{p["path"]}" tabindex="-1" aria-hidden="true"><img src="{img}" alt="" loading="lazy"></a>'
        f'<div class="card-body">'
        f'<p class="post-meta"><time datetime="{p["meta"]["date"]}">{_fmt_date(p["meta"]["date"])}</time> &middot; {p["minutes"]} min read</p>'
        f'<h2 class="post-card-title"><a href="{p["path"]}">{_h.escape(p["headline"])}</a></h2>'
        f'<p>{_h.escape(p["excerpt"])}</p>'
        f'<a href="{p["path"]}" class="btn btn-secondary">Read the article</a>'
        f'</div></article>'
    )


def render_post(p, posts):
    import html as _h
    m = p["meta"]
    hero_style = f' style="background-image:url(\'{p["image"]}\')"' if p["image"] else ""
    tags = "".join(f'<li>{_h.escape(t)}</li>' for t in p["tags"])
    tags_html = f'<ul class="post-tags" aria-label="Topics">{tags}</ul>' if tags else ""
    related = [q for q in posts if q["slug"] != p["slug"]][:3]
    related_html = ""
    if related:
        related_html = (
            '<section class="section section-alt"><div class="container">'
            '<p class="eyebrow">Keep reading</p><h2>More family resources</h2>'
            f'<div class="card-grid post-list">{"".join(_post_card(q) for q in related)}</div>'
            '<p class="post-all"><a href="/blog/">All articles</a></p></div></section>'
        )
    body = f"""<section class="hero hero-page hero-post"{hero_style}>
  <div class="container">
    <p class="eyebrow">{BLOG_TITLE}</p>
    <h1>{_h.escape(p["headline"])}</h1>
    <p class="tagline">{_h.escape(p["excerpt"])}</p>
  </div>
</section>
<section class="section">
  <article class="container narrow post">
    <p class="post-meta"><time datetime="{m["date"]}">{_fmt_date(m["date"])}</time> &middot; {_h.escape(p["author"])} &middot; {p["minutes"]} min read</p>
    <div class="post-body">
{p["body"]}
    </div>
    {tags_html}
    {TOUR_CTA}
    <p class="post-all"><a href="/blog/">All articles</a></p>
  </article>
</section>
{related_html}"""
    abs_url = SITE + p["path"]
    article = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": p["headline"], "description": m.get("description", ""),
        "datePublished": m["date"], "dateModified": m.get("updated", m["date"]),
        "author": {"@type": "Organization", "name": "The Pointe at Kirby Gate", "url": SITE},
        "publisher": ORG,
        "mainEntityOfPage": {"@type": "WebPage", "@id": abs_url},
    }
    if p["image"]:
        article["image"] = [SITE + p["image"]]
    if p["tags"]:
        article["keywords"] = ", ".join(p["tags"])
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": BLOG_TITLE, "item": SITE + "/blog/"},
        {"@type": "ListItem", "position": 3, "name": p["headline"], "item": abs_url},
    ]}
    head = (
        _ld(article) + _ld(crumbs)
        + f'<meta property="og:type" content="article">\n'
        f'<meta property="article:published_time" content="{m["date"]}">\n'
        + (f'<meta property="og:image" content="{SITE}{p["image"]}">\n' if p["image"] else "")
        + p["head_extra"]
    )
    return render_html(m, body, head)


def render_blog_index(posts):
    import html as _h
    meta = {
        "title": "Family Resources: Assisted Living & Memory Care Guides | The Pointe at Kirby Gate",
        "description": "Plain-language guides for families comparing assisted living and memory care in East Memphis: paying for care, what to look for on a tour, memory loss, and life at The Pointe at Kirby Gate.",
        "path": "/blog/", "nav": "blog",
    }
    cards = "".join(_post_card(p) for p in posts) or '<p>Articles are on the way. Check back soon.</p>'
    body = f"""<section class="hero hero-page" style="background-image:url('{BLOG_INDEX_IMAGE}')">
  <div class="container">
    <p class="eyebrow">{BLOG_TITLE}</p>
    <h1>Guidance for families, from people who do this every day</h1>
    <p class="tagline">Plain answers about assisted living, memory care, paying for care, and daily life in our East Memphis community.</p>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="card-grid post-list">{cards}</div>
    <p class="post-subscribe">Get new articles by RSS: <a href="/feed.xml">feed.xml</a></p>
  </div>
</section>"""
    head = _ld({
        "@context": "https://schema.org", "@type": "CollectionPage", "name": meta["title"],
        "url": SITE + "/blog/", "description": meta["description"], "publisher": ORG})
    return render_html(meta, body, head)


def render_feed(posts):
    import html as _h
    items = []
    for p in posts[:20]:
        url = SITE + p["path"]
        items.append(
            f"  <item>\n    <title>{_h.escape(p['headline'])}</title>\n    <link>{url}</link>\n"
            f"    <guid isPermaLink=\"true\">{url}</guid>\n    <pubDate>{_rfc822(p['meta']['date'])}</pubDate>\n"
            f"    <description>{_h.escape(p['excerpt'])}</description>\n  </item>"
        )
    last = _rfc822(posts[0]["meta"]["date"]) if posts else _rfc822(datetime.date.today().isoformat())
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n'
        f'  <title>The Pointe at Kirby Gate: {BLOG_TITLE}</title>\n  <link>{SITE}/blog/</link>\n'
        '  <description>Guides for families comparing assisted living and memory care in East Memphis.</description>\n'
        f'  <language>en-us</language>\n  <lastBuildDate>{last}</lastBuildDate>\n'
        f'  <atom:link href="{SITE}/feed.xml" rel="self" type="application/rss+xml"/>\n'
        + "\n".join(items) + "\n</channel>\n</rss>\n"
    )


def build_blog():
    """Write the blog pages and feed. Returns [(path, lastmod)] for the sitemap."""
    posts = load_posts()
    entries = []
    for p in posts:
        out = PUBLIC / p["path"].strip("/") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render_post(p, posts))
        entries.append((p["path"], p["meta"].get("updated", p["meta"]["date"])))
        print(f"built {out.relative_to(ROOT)}")
    (PUBLIC / "blog").mkdir(parents=True, exist_ok=True)
    (PUBLIC / "blog" / "index.html").write_text(render_blog_index(posts))
    (PUBLIC / "feed.xml").write_text(render_feed(posts))
    today = datetime.date.today().isoformat()
    entries.append(("/blog/", posts[0]["meta"]["date"] if posts else today))
    print(f"built blog index + feed.xml ({len(posts)} posts)")
    return entries


<<<<<<< HEAD
# ---------------------------------------------------------------------------
# Senior Care News
#
# A curated page of short summaries that link out to other publishers'
# articles, plus our own updates. One file per item in content/news/<slug>.html
# (the file name is the slug) with a <!--meta --> block: title, source,
# source_url (http(s); the community category may use a site path such as
# /blog/), date (YYYY-MM-DD, the day we posted it), published (the article's
# own date, optional), category (a NEWS_CATEGORIES key) and status
# (published|draft; drafts are skipped), then a short HTML body made of p, a,
# strong, em, ul, ol and li only. The build writes /news/index.html (the newest
# NEWS_PAGE_SIZE items under month headings), /news/archive/<year>/ for anything
# older, /news/feed.xml and sitemap entries.
# ---------------------------------------------------------------------------
NEWS = CONTENT / "news"
NEWS_TITLE = "Senior Care News"
NEWS_INDEX_IMAGE = "/assets/img/exterior-front.webp"
NEWS_INTRO = ("Articles and news we think families should see, gathered by our team. "
              "The summaries are ours; the full stories belong to their publishers.")
NEWS_DISCLAIMER = ("We share these links for information only. They are not medical, legal or financial "
                   "advice, and we are not responsible for the content of other websites.")
NEWS_CATEGORIES = {      # meta category -> label on the badge and the filter chip
    "finance": "Paying for care",
    "health": "Health & research",
    "caregiving": "Caregiving & family",
    "policy": "Policy & benefits",
    "local": "Memphis & Mid-South",
    "community": "Community update",
}
NEWS_PAGE_SIZE = 60      # newest items on /news/; older ones move to /news/archive/<year>/
NEWS_FEED_SIZE = 20      # items in /news/feed.xml and in the ItemList schema
NEWS_TAGS = {"p", "a", "strong", "em", "ul", "ol", "li"}
NEWS_TAG_RE = re.compile(r"</?([a-zA-Z][a-zA-Z0-9]*)")
NEWS_UNSAFE_RE = re.compile(r"</?(script|iframe|style|object|embed|form)\b|\son[a-z]+\s*=|javascript\s*:", re.I)
# The topic filter. The chip row starts hidden, so without JavaScript every item is simply shown.
NEWS_SCRIPT = """<script>
(function () {
  var chips = document.querySelector(".news-chips");
  if (!chips) return;
  chips.hidden = false;
  chips.addEventListener("click", function (e) {
    var chip = e.target.closest("button");
    if (!chip) return;
    var cat = chip.dataset.category;
    chips.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b === chip ? "true" : "false"); });
    document.querySelectorAll(".news-item").forEach(function (it) { it.hidden = !!cat && it.dataset.category !== cat; });
    document.querySelectorAll(".news-group").forEach(function (g) { g.hidden = !g.querySelector(".news-item:not([hidden])"); });
    var empty = document.querySelector(".news-empty");
    if (empty) empty.hidden = !!document.querySelector(".news-item:not([hidden])");
  });
})();
</script>"""


def _is_http_url(url):
    try:
        parts = urllib.parse.urlsplit(url)
    except ValueError:
        return False
    return parts.scheme in ("http", "https") and bool(parts.netloc)


def _iso_date(value, what):
    """Normalise a YYYY-MM-DD string, or stop the build with a clear message."""
    try:
        return datetime.date.fromisoformat(value).isoformat()
    except ValueError:
        sys.exit(f"BUILD FAILED — {what} must be a YYYY-MM-DD date, not {value!r}")


def _plain_text(markup):
    """Tags stripped, entities resolved, whitespace collapsed (feed descriptions)."""
    import html as _h
    text = re.sub(r"</?(?:a|strong|em)\b[^>]*>", "", markup)         # inline tags vanish...
    return " ".join(_h.unescape(re.sub(r"<[^>]+>", " ", text)).split())  # ...block tags become spaces


def load_news_items():
    items = []
    if not NEWS.exists():
        return items
    for f in sorted(NEWS.glob("*.html")):
        meta, body = parse(f.read_text(), f.name)
        if meta.get("status", "published").strip().lower() == "draft":
            continue
        slug = f.stem
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            sys.exit(f"BUILD FAILED — news file name {f.name!r} must be lowercase letters, digits and hyphens")
        for key in ("title", "source_url", "date", "category"):
            if not meta.get(key, "").strip():
                sys.exit(f"BUILD FAILED — news item {f.name} has no {key}")
        category = meta["category"].strip().lower()
        if category not in NEWS_CATEGORIES:
            sys.exit(f"BUILD FAILED — news item {f.name} has unknown category {meta['category']!r} "
                     f"(use one of: {', '.join(NEWS_CATEGORIES)})")
        url = meta["source_url"].strip()
        external = _is_http_url(url)
        site_path = category == "community" and re.fullmatch(r"/(?!/)[^\s<>\"'\\]*", url) is not None
        if not (external or site_path):
            sys.exit(f"BUILD FAILED — news item {f.name} source_url must start with http:// or https://"
                     + (" (or / for a page on this site)" if category == "community" else ""))
        if NEWS_UNSAFE_RE.search(body):
            sys.exit(f"BUILD FAILED — news item {f.name} body contains script, iframe, style, object, embed, "
                     "form or an on* attribute")
        bad_tags = {t.lower() for t in NEWS_TAG_RE.findall(body)} - NEWS_TAGS
        if bad_tags:
            sys.exit(f"BUILD FAILED — news item {f.name} body may only use {', '.join(sorted(NEWS_TAGS))} tags, "
                     f"not {', '.join(sorted(bad_tags))}")
        published = meta.get("published", "").strip()
        source = meta.get("source", "").strip()
        if not source:
            source = (urllib.parse.urlsplit(url).hostname or url) if external else "The Pointe at Kirby Gate"
        items.append({
            "meta": meta, "body": body.strip(), "slug": slug, "title": meta["title"].strip(),
            "source": source, "url": url, "external": external,
            "date": _iso_date(meta["date"].strip(), f"news item {f.name} date"),
            "published": _iso_date(published, f"news item {f.name} published") if published else "",
            "category": category, "label": NEWS_CATEGORIES[category], "text": _plain_text(body),
        })
    items.sort(key=lambda i: (i["date"], i["slug"]), reverse=True)
    return items


def _news_abs(i):
    """The item's link as an absolute URL (community items may point at this site)."""
    return i["url"] if i["external"] else SITE + i["url"]


def _news_item(i):
    import html as _h
    href = _h.escape(i["url"])
    target = ' target="_blank" rel="noopener"' if i["external"] else ""
    when = _h.escape(i["source"])
    if i["published"]:
        when += f' &middot; Published <time datetime="{i["published"]}">{_fmt_date(i["published"])}</time>'
    when += f' &middot; Shared <time datetime="{i["date"]}">{_fmt_date(i["date"])}</time>'
    more = f'Read the full story at {_h.escape(i["source"])}' if i["external"] else "Read more on our site"
    return (
        f'<article class="news-item news-{i["category"]}" id="{i["slug"]}" data-category="{i["category"]}">'
        f'<p class="news-badge">{_h.escape(i["label"])}</p>'
        f'<h3 class="news-title"><a href="{href}"{target}>{_h.escape(i["title"])}</a></h3>'
        f'<p class="news-meta">{when}</p>'
        f'<div class="news-body">{i["body"]}</div>'
        f'<p class="news-more"><a href="{href}"{target}>{more}</a></p>'
        f'</article>'
    )


def _news_groups(items):
    """Items (already newest first) grouped under month headings: [("October 2026", [...]), ...]."""
    groups = []
    for i in items:
        d = datetime.date.fromisoformat(i["date"])
        month = f"{d.strftime('%B')} {d.year}"
        if not groups or groups[-1][0] != month:
            groups.append((month, []))
        groups[-1][1].append(i)
    return groups


def _news_list(items):
    return "\n".join(
        f'<div class="news-group"><h2 class="news-month">{month}</h2>\n'
        + "\n".join(_news_item(i) for i in group) + "\n</div>"
        for month, group in _news_groups(items))


def _news_chips():
    import html as _h
    chips = ['<button type="button" data-category="" aria-pressed="true">All</button>'] + [
        f'<button type="button" data-category="{key}" aria-pressed="false">{_h.escape(label)}</button>'
        for key, label in NEWS_CATEGORIES.items()]
    return '<div class="news-chips" role="group" aria-label="Show one topic" hidden>' + "".join(chips) + "</div>"


def _news_crumbs(*extra):
    """BreadcrumbList for /news/ and the pages below it; extra = (name, path) pairs."""
    crumbs = [("Home", "/"), (NEWS_TITLE, "/news/"), *extra]
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": n, "name": name, "item": SITE + path}
        for n, (name, path) in enumerate(crumbs, 1)]}


def render_news_index(items, archive_years):
    meta = {
        "title": "Senior Care News: Articles Families Should See | The Pointe at Kirby Gate",
        "description": "Short summaries of news families should see about paying for care, health research, caregiving, benefits and the Mid-South, gathered by the team at The Pointe at Kirby Gate in East Memphis.",
        "path": "/news/", "nav": "news",
    }
    listing = _news_list(items) or "<p>News items are on the way. Check back soon.</p>"
    archive = ""
    if archive_years:
        links = " &middot; ".join(f'<a href="/news/archive/{y}/">{y}</a>' for y in archive_years)
        archive = f'<p class="news-archive">Older items: {links}</p>'
    body = f"""<section class="hero hero-page" style="background-image:url('{NEWS_INDEX_IMAGE}')">
  <div class="container">
    <p class="eyebrow">For Families</p>
    <h1>{NEWS_TITLE}</h1>
    <p class="tagline">{NEWS_INTRO}</p>
  </div>
</section>
<section class="section">
  <div class="container narrow news">
    {_news_chips()}
    <p class="news-empty" hidden>Nothing in this topic yet. Check back soon.</p>
    {listing}
    {archive}
    <p class="post-subscribe">Get new items by RSS: <a href="/news/feed.xml">news/feed.xml</a></p>
    <p class="news-disclaimer">{NEWS_DISCLAIMER}</p>
  </div>
</section>
{NEWS_SCRIPT}"""
    head = _ld({
        "@context": "https://schema.org", "@type": "CollectionPage", "name": meta["title"],
        "url": SITE + "/news/", "description": meta["description"], "publisher": ORG,
    }) + _ld({
        "@context": "https://schema.org", "@type": "ItemList", "name": NEWS_TITLE,
        "itemListOrder": "https://schema.org/ItemListOrderDescending",
        "numberOfItems": len(items[:NEWS_FEED_SIZE]),
        "itemListElement": [{"@type": "ListItem", "position": n, "name": i["title"], "url": _news_abs(i)}
                            for n, i in enumerate(items[:NEWS_FEED_SIZE], 1)],
    }) + _ld(_news_crumbs())
    return render_html(meta, body, head)


def render_news_archive(year, items, archive_years):
    meta = {
        "title": f"Senior Care News from {year} | The Pointe at Kirby Gate",
        "description": f"Older Senior Care News items from {year}: short summaries of articles about paying for care, health research, caregiving and benefits, gathered for families by The Pointe at Kirby Gate.",
        "path": f"/news/archive/{year}/", "nav": "news",
    }
    others = " &middot; ".join(f"<strong>{y}</strong>" if y == year else f'<a href="/news/archive/{y}/">{y}</a>'
                               for y in archive_years)
    body = f"""<section class="hero hero-page" style="background-image:url('{NEWS_INDEX_IMAGE}')">
  <div class="container">
    <p class="eyebrow">{NEWS_TITLE}</p>
    <h1>News archive: {year}</h1>
    <p class="tagline">{NEWS_INTRO}</p>
  </div>
</section>
<section class="section">
  <div class="container narrow news">
    <p class="news-archive"><a href="/news/">Latest news</a> &middot; Archive: {others}</p>
    {_news_chips()}
    <p class="news-empty" hidden>Nothing in this topic for {year}.</p>
    {_news_list(items)}
    <p class="news-disclaimer">{NEWS_DISCLAIMER}</p>
    <p class="post-all"><a href="/news/">Back to the latest news</a></p>
  </div>
</section>
{NEWS_SCRIPT}"""
    head = _ld({
        "@context": "https://schema.org", "@type": "CollectionPage", "name": meta["title"],
        "url": SITE + meta["path"], "description": meta["description"], "publisher": ORG,
    }) + _ld(_news_crumbs((f"{year} archive", meta["path"])))
    return render_html(meta, body, head)


def render_news_feed(items):
    import html as _h
    out = []
    for i in items[:NEWS_FEED_SIZE]:
        out.append(
            f"  <item>\n    <title>{_h.escape(i['title'])}</title>\n    <link>{_h.escape(_news_abs(i))}</link>\n"
            f"    <guid isPermaLink=\"false\">{SITE}/news/#{i['slug']}</guid>\n    <pubDate>{_rfc822(i['date'])}</pubDate>\n"
            f"    <category>{_h.escape(i['label'])}</category>\n    <description>{_h.escape(i['text'])}</description>\n  </item>"
        )
    last = _rfc822(items[0]["date"]) if items else _rfc822(datetime.date.today().isoformat())
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n'
        f'  <title>The Pointe at Kirby Gate: {NEWS_TITLE}</title>\n  <link>{SITE}/news/</link>\n'
        f'  <description>{_h.escape(NEWS_INTRO)}</description>\n'
        f'  <language>en-us</language>\n  <lastBuildDate>{last}</lastBuildDate>\n'
        f'  <atom:link href="{SITE}/news/feed.xml" rel="self" type="application/rss+xml"/>\n'
        + "\n".join(out) + "\n</channel>\n</rss>\n"
    )


def build_news():
    """Write the news page, its archive pages and feed. Returns [(path, lastmod)] for the sitemap."""
    items = load_news_items()
    by_year = {}
    for i in items[NEWS_PAGE_SIZE:]:
        by_year.setdefault(i["date"][:4], []).append(i)
    archive_years = sorted(by_year, reverse=True)
    (PUBLIC / "news").mkdir(parents=True, exist_ok=True)
    (PUBLIC / "news" / "index.html").write_text(render_news_index(items[:NEWS_PAGE_SIZE], archive_years))
    (PUBLIC / "news" / "feed.xml").write_text(render_news_feed(items))
    today = datetime.date.today().isoformat()
    entries = [("/news/", items[0]["date"] if items else today)]
    for year in archive_years:
        out = PUBLIC / "news" / "archive" / year / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render_news_archive(year, by_year[year], archive_years))
        entries.append((f"/news/archive/{year}/", by_year[year][0]["date"]))
        print(f"built {out.relative_to(ROOT)}")
    print(f"built news index + news/feed.xml ({len(items)} items)")
    return entries

=======


DOORLOOP_FEED = ("https://kirbygate.app.doorloop.com/api/units/listings/mits/json/no_id/1"
                 "?partnerKey=doorLoopListingSites&subdomain=kirbygate"
                 "&filter_rentalAppListed=true&filter_showPropertyList=false")
DOORLOOP_APPLY = "https://kirbygate.app.doorloop.com/tenant-portal/rental-applications/listing?source=CompanyLink"
# Stripe Payment Link for the $199 reservation deposit. Paste the
# buy.stripe.com URL here and rebuild — every deposit button appears.
STRIPE_DEPOSIT_URL = ""
STRIPE_DEPOSIT_AMOUNT = "$199"
DL_TYPES = {
    "companion": "Companion Suite", "studio": "Standard Studio",
    "lgstudio": "Large Studio", "onebed": "One Bedroom", "mc": "Memory Care Suite",
}

def _dl_classify(rent, sqft, name):
    if "memory care" in name.lower() or rent == 5450:
        return "mc"
    if sqft >= 420: return "onebed"
    if sqft >= 350: return "lgstudio"
    if sqft >= 250: return "studio"
    return "companion"

def fetch_doorloop():
    """Refresh content/doorloop.json from the public DoorLoop listings feed.
    Units with a non-empty Availability.UnitAvailabilityURL are open to apply;
    everything else is leased. Falls back silently to the cached file."""
    import json as _json, urllib.request, datetime as _dt
    cache = CONTENT / "doorloop.json"
    try:
        req = urllib.request.Request(DOORLOOP_FEED, headers={"User-Agent": "kirbygateliving-build/1.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            data = _json.load(r)
        units = []
        for p in data["PhysicalProperty"]["Property"]:
            name = (p.get("PropertyID", {}).get("unitName") or "").strip()
            ils = p.get("ILS_Unit", {})
            u = (ils.get("Units", {}).get("Unit") or [{}])[0]
            rent = u.get("MarketRent") or u.get("UnitRent") or 0
            sqft = u.get("MaxSquareFeet") or 0
            apply_url = (ils.get("Availability", {}) or {}).get("UnitAvailabilityURL") or ""
            if not name or not rent:
                continue
            photo = ""
            for fl in (ils.get("File") or []):
                if fl.get("FileType") == "Photo" and fl.get("Caption") == "Unit Photo" and fl.get("Src"):
                    photo = fl["Src"]; break
            units.append({
                "room": name.replace(" - Memory Care", ""),
                "type": _dl_classify(rent, sqft, name),
                "sqft": sqft, "rent": rent, "photo": photo,
                "available": bool(apply_url), "apply_url": apply_url,
            })
        if units:
            cache.write_text(_json.dumps({
                "fetched": _dt.date.today().isoformat(), "units": units}, indent=1))
            print(f"doorloop: {sum(1 for u in units if u['available'])} of {len(units)} listed units available")
    except Exception as e:
        print(f"doorloop fetch skipped ({e}); using cached data")

def doorloop_tokens():
    import json as _json, datetime as _dt
    cache = CONTENT / "doorloop.json"
    tok = {}
    if not cache.exists():
        for t in DL_TYPES:
            tok[f"dl_badge_{t}"] = ""
        tok["dl_units"] = "<p class=\"center\">Call (901) 247-5835 for today&rsquo;s availability.</p>"
        tok["dl_updated"] = ""
        tok["dl_from_companion"] = "$2,800"
        return tok
    data = _json.loads(cache.read_text())
    units = data["units"]
    for t in DL_TYPES:
        tu = [u for u in units if u["type"] == t]
        n = sum(1 for u in tu if u["available"])
        if n:
            tok[f"dl_badge_{t}"] = f'<span class="avail-badge">{n} available now</span>'
        else:
            tok[f"dl_badge_{t}"] = '<span class="avail-badge off">Currently leased &middot; join the waitlist</span>'
    comp = [u["rent"] for u in units if u["type"] == "companion" and u["available"]] or            [u["rent"] for u in units if u["type"] == "companion"]
    tok["dl_from_companion"] = "${:,.0f}".format(min(comp)) if comp else "$2,800"
    avail = sorted([u for u in units if u["available"]], key=lambda u: (u["rent"], u["room"]))
    groups = {}
    for u in avail:
        groups.setdefault((u["type"], u["sqft"], u["rent"]), []).append(u)
    cards = []
    for (t, sqft, rent), us in sorted(groups.items(), key=lambda kv: kv[0][2]):
        rooms = ", ".join(u["room"].replace("Room ", "") for u in us)
        label = "1 suite available" if len(us) == 1 else f"{len(us)} suites available"
        cards.append(
            '<div class="unit-card">'
            f'<div class="unit-room">{DL_TYPES[t]}</div>'
            f'<div class="unit-type">{label} &middot; Room{"s" if len(us) > 1 else ""} {rooms}</div>'
            f'<div class="unit-meta">{sqft} sq ft &middot; <strong>${rent:,.0f}/mo</strong>'
            + (" &middot; all care included" if t == "mc" else "")
            + "</div>"
            f'<a href="{us[0]["apply_url"] or DOORLOOP_APPLY}" target="_blank" rel="noopener" class="btn btn-primary btn-arrow" data-track="apply" data-plan="{t}">Apply for This Suite</a>'
            "</div>")
    tok["dl_units"] = "\n".join(cards) if cards else         '<p class="center">Every suite is spoken for at the moment &mdash; <a href="' + DOORLOOP_APPLY + '" target="_blank" rel="noopener">join the waiting list</a> or call (901) 247-5835.</p>'
    d = _dt.date.fromisoformat(data["fetched"])
    tok["dl_updated"] = "Live availability from our resident system &middot; updated " + d.strftime("%B %-d, %Y")

    if STRIPE_DEPOSIT_URL:
        tok["stripe_deposit"] = (
            f'<a href="{STRIPE_DEPOSIT_URL}" target="_blank" rel="noopener" class="btn btn-primary btn-lg btn-arrow" '
            f'data-track="deposit">Pay the {STRIPE_DEPOSIT_AMOUNT} Deposit Securely</a>'
            '<p class="form-note" style="margin-top:0.6rem">Payment is processed by Stripe on a secure stripe.com page.</p>')
    else:
        tok["stripe_deposit"] = (
            "<p>As soon as your application arrives, our team sends you a secure payment "
            f"request for the {STRIPE_DEPOSIT_AMOUNT} deposit &mdash; usually the same business day.</p>")

    # Reservation wizard step-2 cards: only types with availability, tagged by stay
    FP_FALLBACK = {"studio": "/assets/img/floorplan-studio.png", "mc": "/assets/img/floorplan-studio.png",
                   "lgstudio": "/assets/img/floorplan-studio-deluxe.png", "onebed": "/assets/img/floorplan-1bed.png",
                   "companion": ""}
    wiz = []
    for (t, sqft, rent), us in sorted(groups.items(), key=lambda kv: kv[0][2]):
        stay = "mc" if t == "mc" else "al"
        label = "1 suite open" if len(us) == 1 else f"{len(us)} suites open"
        img = next((u["photo"] for u in us if u.get("photo")), "") or FP_FALLBACK.get(t, "")
        img_tag = f'<span class="wiz-card-img"><img src="{img}" alt="{DL_TYPES[t]} floor plan" loading="lazy"></span>' if img else ""
        wiz.append(
            f'<button type="button" class="wiz-card" data-stay="{stay}" data-key="{t}" data-type="{DL_TYPES[t]}" '
            f'data-price="${rent:,.0f}/mo" data-apply="{us[0]["apply_url"] or DOORLOOP_APPLY}" data-img="{img}">'
            + img_tag +
            f'<span class="wiz-card-name">{DL_TYPES[t]}</span>'
            f'<span class="wiz-card-price">${rent:,.0f}<small>/mo</small></span>'
            f'<span class="wiz-card-meta">{sqft} sq ft &middot; {label}'
            + (" &middot; all care included" if t == "mc" else "") + "</span>"
            "</button>")
    wiz.append(
        '<button type="button" class="wiz-card" data-stay="respite" data-key="respite" data-type="Respite Suite" '
        'data-price="billed daily" data-apply="/respite-care/#book">'
        '<span class="wiz-card-name">Furnished Respite Suite</span>'
        '<span class="wiz-card-price">Daily rate</span>'
        '<span class="wiz-card-meta">Cozy furnished suite &middot; 5-night minimum &middot; pick your dates next</span>'
        "</button>")
    tok["dl_wizard"] = "\n".join(wiz)
    return tok
>>>>>>> origin/main

def build():
    check_unique_images()
    year = str(datetime.date.today().year)
    css_v = fhash(PUBLIC / "assets" / "css" / "main.css")
    js_v = fhash(PUBLIC / "assets" / "js" / "main.js")
    fetch_doorloop()
    _dl_tokens = doorloop_tokens()
    sitemap_paths = []
    for f in sorted(CONTENT.glob("*.html")):
        if f.stem.endswith(".head"):
            continue
        meta, body = parse(f.read_text(), f.name)
        html = TEMPLATE
        body = re.sub(r"\{\{icon:([a-z]+)\}\}", lambda m: icon(m.group(1)), body)
        if "{{calendar}}" in body:
            body = body.replace("{{calendar}}", render_calendar())
        if "{{dl_" in body:
            for _k, _v in _dl_tokens.items():
                body = body.replace("{{%s}}" % _k, _v)
        import html as _html
        main_phone = meta.get("phone") == "main"
        repl = {
            "phone_tel": "9017533449" if main_phone else "9012475835",
            "phone_fmt": "(901) 753-3449" if main_phone else "(901) 247-5835",
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

    blog_entries = build_blog()
    news_entries = build_news()
    today = datetime.date.today().isoformat()
    urls = "\n".join(
        [f"  <url><loc>https://www.kirbygateliving.com{p}</loc><lastmod>{today}</lastmod></url>"
         for p in sitemap_paths]
        + [f"  <url><loc>https://www.kirbygateliving.com{p}</loc><lastmod>{lm}</lastmod></url>"
           for p, lm in blog_entries + news_entries]
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
    print(f"built sitemap.xml ({len(sitemap_paths) + len(blog_entries) + len(news_entries)} urls) + robots.txt")

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
