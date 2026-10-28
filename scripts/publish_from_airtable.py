#!/usr/bin/env python3
"""Publish approved blog articles and news items from Airtable into content/.

Run by .github/workflows/publish-blog.yml in two steps:

  prepare   Read Content Items rows with Channel = Blog, Status = Approved,
            Compliance Check ticked and a Publish Date that has passed. Write
            each as content/blog/<slug>.html (plus its approved photo under
            public/assets/img/blog/), run build.py to prove the site still
            builds, and record what was written in a manifest file.
            Then do the same for News Items rows with Status = Approved,
            Compliance Check ticked and a Post Date that is blank or has
            arrived (America/Chicago): each becomes content/news/<slug>.html
            for the Senior Care News page, oldest Post Date first.
  finalize  After the workflow has pushed the commit, mark those rows
            Published in Airtable and update the articles' linked topics.

Rows that cannot be published (bad slug, unsafe HTML, too short, missing
source, bad link, a slug another row took earlier in the run or that matches
a file not committed on main, build failure) are set to Failed with the reason
in Publish Log, so nothing is retried forever. Rows whose file is already
committed on main are only marked Published.

Environment: AIRTABLE_TOKEN (required; without it the script exits quietly),
MANIFEST (path, default /tmp/publish-manifest.json), MAX_POSTS (default 2),
MAX_NEWS (default 5), AIRTABLE_API_URL (tests only), GITHUB_OUTPUT (set by
GitHub Actions). Standard library only. Tests: bash scripts/tests/run.sh.
"""
from __future__ import annotations

import html
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG_DIR = ROOT / "content" / "blog"
NEWS_DIR = ROOT / "content" / "news"
IMG_DIR = ROOT / "public" / "assets" / "img" / "blog"
SITE = "https://www.kirbygateliving.com"
SITE_NAME = "The Pointe at Kirby Gate"

API = os.environ.get("AIRTABLE_API_URL", "https://api.airtable.com/v0").rstrip("/")
BASE = "appZ2xOP1HzOWjug7"          # Kirby Gate Lead Engine
ITEMS = "tblVtdUcldbtwe50j"         # Content Items
TOPICS = "tbl2jfMNcGqANbQ2q"        # Content Topics
PHOTOS = "tbl3Kr5c6Iovf0tx9"        # GBP Post Photos
NEWS = "tblShi8ugFZKwvz4k"          # News Items

# Content Items fields (by id, so renaming a column cannot break publishing)
F = {
    "title": "fldjkMH6vTJUGEnjs",
    "channel": "fld5Hg2Z2bfLR9Va7",
    "status": "fldVeRcuq6Kfsb1wo",
    "publish_date": "fldBfij1yPpo8s1Vx",
    "headline": "fldv61FVy374FuiQH",
    "copy": "fldZ7gZVtaBtnhS9I",
    "slug": "fld5ZytzRqrLsA43X",
    "meta_description": "fldeoI39cMyiuwydL",
    "keyword": "fldWRoyuIDZO8VdYE",
    "image_url": "fldsY6uzuoy7Lb2wC",
    "image_alt": "fldBfORvhdrOFdpW9",
    "photo": "fldgFZVjz31hFsS9u",
    "compliance": "fldnN11jeIvb4wJqL",
    "published_url": "fldWQ3lTcLXtOsA7C",
    "published_at": "fldTeBxf6bufiuTpe",
    "publish_log": "fldavaVWQzLlQwuVf",
    "topic": "fld2vq1JajYdLlekC",
}
TF = {"status": "fld9ScdnbK8TEpTuR", "published_url": "fldRXkomlewHN2tux", "pillar": "fldE46oRrF5abE4vg"}
PF = {"name": "fldSHKs2O4omHOA01", "url": "fldGXEgC4pqcAe99d", "status": "fldjjHNkxpR4eQV8W"}

# News Items fields (by id, like F)
NF = {
    "title": "fld0j3cwYUexMuUvO",
    "source": "fldgsvUdQCqYnY49l",
    "source_url": "fld3TwnCDts5c1kGd",
    "article_date": "fldTY1vtCesbUxg2O",
    "category": "fld4DIXgZ1xtHK06z",
    "summary": "fldnCKId0CrwIsr4z",
    "why": "fldXOLW8ZapBYq130",
    "status": "fldQlakdY6hVHwaPZ",
    "added_by": "fldAO9f4nsvYscAqy",
    "compliance": "fldO7msiyQ0IeWXPl",
    "post_date": "fldrmFj75X5EfQGw3",
    "slug": "fldO7qUjBnbkWWP9n",
    "published_url": "fldfzfJUHGPygSKUq",
    "published_at": "fld6WOeBJcbSTXiFs",
    "publish_log": "fldHzhdfKpokoBZYP",
    "notes": "fldpJ6h0gYLJfm8dk",
}
# Category option name in Airtable -> category key the news page understands
NEWS_CATEGORIES = {
    "Paying for care": "finance",
    "Health & research": "health",
    "Caregiving & family": "caregiving",
    "Policy & benefits": "policy",
    "Memphis & Mid-South": "local",
    "Community update": "community",
}

# The filters run inside Airtable and therefore use column names.
DUE_FORMULA = "AND({Channel}='Blog',{Status}='Approved',{Compliance Check}=1)"
NEWS_DUE_FORMULA = "AND({Status}='Approved',{Compliance Check}=1)"

MAX_POSTS = int(os.environ.get("MAX_POSTS", "2"))
MAX_NEWS = int(os.environ.get("MAX_NEWS", "5"))
MANIFEST = Path(os.environ.get("MANIFEST", "/tmp/publish-manifest.json"))
TOKEN = os.environ.get("AIRTABLE_TOKEN", "").strip()

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
UNSAFE_RE = re.compile(r"<\s*(script|iframe|object|embed|form|style|link|meta)\b|javascript\s*:|\son[a-z]+\s*=", re.I)
TAG_RE = re.compile(r"<[^>]+>")
URL_RE = re.compile(r"^https?://[^\s<>\"'`]+$", re.I)
PATH_RE = re.compile(r"^/(?!/)[^\s<>\"'`\\]*$")        # site-relative; never protocol-relative (//host)
MIN_WORDS = 300
NEWS_TITLE_MAX = 160
NEWS_MIN_WORDS, NEWS_MAX_WORDS = 20, 160
IMAGE_TYPES = {"image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp"}


# ---------------------------------------------------------------- Airtable
def api(method, path, params=None, body=None):
    url = f"{API}/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    data = None
    headers = {"Authorization": f"Bearer {TOKEN}"}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:400]
        raise RuntimeError(f"Airtable {method} {path}: HTTP {e.code} {detail}") from None
    except urllib.error.URLError as e:
        raise RuntimeError(f"Airtable {method} {path}: {e.reason}") from None


def list_records(table, formula):
    out, offset = [], None
    while True:
        params = {"filterByFormula": formula, "returnFieldsByFieldId": "true", "pageSize": "100"}
        if offset:
            params["offset"] = offset
        page = api("GET", f"{BASE}/{table}", params)
        out.extend(page.get("records", []))
        offset = page.get("offset")
        if not offset:
            return out


def get_record(table, rid):
    return api("GET", f"{BASE}/{table}/{rid}", {"returnFieldsByFieldId": "true"})


def update_record(table, rid, fields):
    return api("PATCH", f"{BASE}/{table}/{rid}", body={"fields": fields})


# ----------------------------------------------------------------- helpers
def one_line(s, limit=None):
    s = re.sub(r"\s+", " ", re.sub(r"-{2,}>", "", str(s or ""))).strip()
    return s[:limit].rstrip() if limit else s


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", str(s or "").lower()).strip("-")
    return s[:80].rstrip("-")


def text_of(body):
    return re.sub(r"\s+", " ", html.unescape(TAG_RE.sub(" ", body))).strip()


def plain_text(s):
    """Plain text for a news field: tags stripped, entities decoded, then
    stripped again so an entity-encoded tag cannot survive the decoding.
    The news page renderer escapes it."""
    return one_line(TAG_RE.sub(" ", text_of(str(s or ""))))


def is_http_url(url):
    """A full http(s) link with a host: the test build.py applies to a news source_url."""
    try:
        parts = urllib.parse.urlsplit(url)
    except ValueError:
        return False
    return bool(URL_RE.match(url)) and parts.scheme in ("http", "https") and bool(parts.netloc)


def select_name(v):
    """A single-select value as text (the API sends the name, or a choice object)."""
    return one_line(v.get("name") if isinstance(v, dict) else v)


def excerpt_of(body, limit=200):
    """First sentence or two of the first paragraph (headings are skipped)."""
    m = re.search(r"<p\b[^>]*>(.*?)</p>", body, re.I | re.S)
    source = text_of(m.group(1)) if m and text_of(m.group(1)) else text_of(re.sub(r"<h[1-6]\b[^>]*>.*?</h[1-6]>", " ", body, flags=re.I | re.S))
    out = ""
    for part in re.split(r"(?<=[.!?])\s+", source):
        if out and len(out) + len(part) + 1 > limit:
            break
        out = (out + " " + part).strip()
        if len(out) >= limit * 0.6:
            break
    return out[:limit].rstrip()


def parse_iso(s):
    s = str(s or "").strip()
    if not s:
        return None
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        d = datetime.fromisoformat(s)
    except ValueError:
        return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def iso_date(s):
    """YYYY-MM-DD from an Airtable date field: '' when blank, None when not a date."""
    s = str(s or "").strip()
    if not s:
        return ""
    try:
        return date.fromisoformat(s[:10]).isoformat()
    except ValueError:
        return None


def local_date(d):
    try:
        from zoneinfo import ZoneInfo
        return d.astimezone(ZoneInfo("America/Chicago")).strftime("%Y-%m-%d")
    except Exception:
        return d.astimezone(timezone.utc).strftime("%Y-%m-%d")


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def git(*args):
    r = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)
    return r.stdout.strip()


def on_main(target):
    """True when git tracks the file, i.e. a previous run (or a hand-made
    commit) already put it on main. A file that merely exists was written by
    this run or left on disk and must not pass for a published one."""
    rel = target.relative_to(ROOT).as_posix()
    return git("ls-files", "--error-unmatch", "--", rel) == rel


def slug_conflict(slug, target, entries):
    """Why this slug cannot be used, or None: another row claimed it earlier in
    this run (entries are the manifest rows so far), or its file is on disk
    without being on main. Two rows with the same title and date and no Slug
    fall back to the same slug, so the second must fail loudly instead of being
    marked Published with the first one's link and no file of its own."""
    for e in entries:
        if e["slug"] == slug:
            return f"slug {slug!r} is already used by row {e['id']} in this run; set a different Slug"
    if target.exists() and not on_main(target):
        return f"slug {slug!r} collides with {target.relative_to(ROOT).as_posix()}, which is not on main; set a different Slug"
    return None


def gh_output(**kv):
    path = os.environ.get("GITHUB_OUTPUT")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as fh:
        for k, v in kv.items():
            fh.write(f"{k}={one_line(str(v))}\n")


def write_manifest(m):
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(m, indent=2), encoding="utf-8")


def read_manifest():
    if not MANIFEST.exists():
        return {"posts": [], "news": []}
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def fetch_image(url, slug):
    """Download the hero photo. Returns (site path or None, log line)."""
    if not url or not str(url).lower().startswith(("http://", "https://")):
        return None, "no usable image URL"
    req = urllib.request.Request(url, headers={"User-Agent": "KirbyGateBlogPublisher/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            ctype = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
            data = r.read(15 * 1024 * 1024 + 1)
    except Exception as e:  # network errors are not fatal: the post gets a text hero
        return None, f"image download failed: {e}"
    ext = IMAGE_TYPES.get(ctype)
    if not ext:
        return None, f"image skipped: unsupported type {ctype or 'unknown'}"
    if len(data) < 20_000 or len(data) > 15 * 1024 * 1024:
        return None, f"image skipped: {len(data)} bytes"
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    dest = IMG_DIR / f"{slug}.{ext}"
    dest.write_bytes(data)
    return f"/assets/img/blog/{slug}.{ext}", f"image saved as {dest.relative_to(ROOT)} ({len(data)} bytes)"


def build_site():
    r = subprocess.run([sys.executable, "build.py"], cwd=ROOT, capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        tail = (r.stderr or r.stdout or "").strip().splitlines()[-8:]
        return False, "build.py failed: " + " | ".join(tail)
    return True, "build ok"


def mark_failed(rid, reason, table=ITEMS, fields=F):
    print(f"  FAILED: {reason}")
    update_record(table, rid, {fields["status"]: "Failed", fields["publish_log"]: f"{now_iso()} {reason}"})


# ------------------------------------------------------------ prepare: blog
def prepare_one(rec, due_at, manifest):
    rid, f = rec["id"], rec.get("fields", {})
    headline = one_line(f.get(F["headline"]) or f.get(F["title"]), 120)
    headline = re.sub(r"\s*\|\s*The Pointe at Kirby Gate\s*$", "", headline).strip()
    print(f"- {rid}: {headline or '(no headline)'}")
    if not headline:
        return mark_failed(rid, "no Headline or Title")

    slug = str(f.get(F["slug"]) or "").strip().lower()
    if not SLUG_RE.match(slug):
        slug = slugify(slug or headline)
    if not SLUG_RE.match(slug):
        return mark_failed(rid, f"cannot make a valid slug from {slug!r}")
    url = f"{SITE}/blog/{slug}/"
    target = BLOG_DIR / f"{slug}.html"
    topics = list(f.get(F["topic"]) or [])

    conflict = slug_conflict(slug, target, manifest["posts"])
    if conflict:
        return mark_failed(rid, conflict)
    if target.exists():
        print(f"  {target.relative_to(ROOT)} is already on main; the row will be marked Published")
        manifest["posts"].append({"id": rid, "slug": slug, "headline": headline, "url": url, "files": [],
                                  "topics": topics,
                                  "log": f"{now_iso()} {target.relative_to(ROOT)} was already on main; row marked Published by the publisher workflow"})
        return

    body = str(f.get(F["copy"]) or "").strip()
    words = len(text_of(body).split())
    if words < MIN_WORDS:
        return mark_failed(rid, f"Copy has {words} words; the minimum is {MIN_WORDS}")
    if UNSAFE_RE.search(body):
        return mark_failed(rid, "Copy contains scripts, iframes, forms, style or link tags, or event handlers")
    body = re.sub(r"<(/?)h1\b", r"<\1h2", body, flags=re.I)  # the template owns the h1

    # hero image: the linked approved photo first, then the Image URL column
    image_path, image_log, src = None, "no image", None
    photo_ids = list(f.get(F["photo"]) or [])
    if photo_ids:
        try:
            p = get_record(PHOTOS, photo_ids[0]).get("fields", {})
            if p.get(PF["status"]) == "Approved":
                src = p.get(PF["url"])
            else:
                image_log = "linked photo is not Approved; no image"
        except RuntimeError as e:
            image_log = f"photo lookup failed: {e}"
    if not src and f.get(F["image_url"]):
        src = f.get(F["image_url"])
    if src:
        image_path, image_log = fetch_image(src, slug)

    # tags: topic pillar, primary keyword, section name
    tags, kw = [], one_line(f.get(F["keyword"]), 60)
    for tid in topics[:1]:
        try:
            pillar = get_record(TOPICS, tid).get("fields", {}).get(TF["pillar"])
            if isinstance(pillar, dict):
                pillar = pillar.get("name")
            if pillar:
                tags.append(one_line(pillar, 40).lower())
        except RuntimeError:
            pass
    if kw:
        tags.append(kw.lower())
    tags.append("family resources")
    tags = list(dict.fromkeys(t for t in tags if t))

    desc = one_line(f.get(F["meta_description"]), 160) or excerpt_of(body, 155)
    meta = [
        ("title", f"{headline} | {SITE_NAME}"),
        ("description", desc),
        ("path", f"/blog/{slug}/"),
        ("nav", "blog"),
        ("date", local_date(due_at)),
        ("author", SITE_NAME),
        ("headline", headline),
        ("excerpt", excerpt_of(body)),
    ]
    if image_path:
        meta += [("image", image_path), ("image_alt", one_line(f.get(F["image_alt"]), 160) or headline)]
    meta += [("tags", ", ".join(tags)), ("keyword", kw), ("status", "published")]
    BLOG_DIR.mkdir(parents=True, exist_ok=True)
    target.write_text("\n".join(["<!--meta"] + [f"{k}: {v}" for k, v in meta if v] + ["-->", body, ""]), encoding="utf-8")

    ok, build_log = build_site()
    if not ok:
        target.unlink(missing_ok=True)
        if image_path:
            (ROOT / "public" / image_path.lstrip("/")).unlink(missing_ok=True)
        return mark_failed(rid, build_log)

    files = [str(target.relative_to(ROOT))]
    if image_path:
        files.append("public" + image_path)
    manifest["posts"].append({"id": rid, "slug": slug, "headline": headline, "url": url, "files": files,
                              "topics": topics,
                              "log": f"{now_iso()} files: {', '.join(files)}; {image_log}; {build_log}; {words} words"})
    print(f"  wrote {files[0]} ({words} words); {image_log}")


def prepare_blog(manifest):
    rows = list_records(ITEMS, DUE_FORMULA)
    now = datetime.now(timezone.utc)
    due = []
    for r in rows:
        d = parse_iso(r.get("fields", {}).get(F["publish_date"]))
        if d is None:
            print(f"- {r['id']}: no Publish Date, skipped")
        elif d > now:
            print(f"- {r['id']}: due {d.isoformat()}, not yet")
        else:
            due.append((d, r))
    due.sort(key=lambda x: x[0])
    print(f"{len(rows)} approved blog row(s), {len(due)} due, publishing up to {MAX_POSTS}")
    for d, r in due[:MAX_POSTS]:
        prepare_one(r, d, manifest)


# ------------------------------------------------------------ prepare: news
def prepare_news_one(rec, post_date, manifest):
    """Write one News Items row as content/news/<slug>.html:

        <!--meta
        title: ...            plain text (the renderer escapes it)
        source: ...           omitted when blank (community updates only)
        source_url: ...       http(s), or a site path for community updates
        date: YYYY-MM-DD      Post Date, or today in America/Chicago
        published: YYYY-MM-DD Article Date, omitted when blank
        category: finance | health | caregiving | policy | local | community
        status: published
        -->
        <p>Summary</p>                           plain text, HTML-escaped here
        <p class="why">Why it matters: ...</p>   (only when set, escaped too)

    build.py escapes the meta values itself but renders the body as HTML (a few
    tags are allowed in hand-written items), so the body text is escaped here.
    """
    rid, f = rec["id"], rec.get("fields", {})
    fail = lambda reason: mark_failed(rid, reason, NEWS, NF)  # noqa: E731
    title = plain_text(f.get(NF["title"]))
    print(f"- {rid}: {title or '(no title)'}")

    raw = "\n".join(str(f.get(NF[k]) or "") for k in ("title", "source", "source_url", "summary", "why"))
    if UNSAFE_RE.search(raw) or UNSAFE_RE.search(html.unescape(raw)):
        return fail("fields contain scripts, iframes, forms, style or link tags, or event handlers")
    if not 1 <= len(title) <= NEWS_TITLE_MAX:
        return fail(f"Title is {len(title)} characters after stripping HTML; it must be 1 to {NEWS_TITLE_MAX}")
    category_name = select_name(f.get(NF["category"]))
    category = NEWS_CATEGORIES.get(category_name)
    if not category:
        return fail(f"Category {category_name!r} is not one of: {', '.join(NEWS_CATEGORIES)}")
    source = plain_text(f.get(NF["source"]))
    if not source and category != "community":
        return fail("Source is required (only a Community update may leave it blank)")
    source_url = one_line(f.get(NF["source_url"]))
    if not (is_http_url(source_url) or (category == "community" and PATH_RE.match(source_url))):
        return fail(f"Source URL {source_url!r} must be a full http:// or https:// link"
                    + (" (or / for a page on this site)" if category == "community" else ""))
    summary = plain_text(f.get(NF["summary"]))
    words = len(summary.split())
    if not NEWS_MIN_WORDS <= words <= NEWS_MAX_WORDS:
        return fail(f"Summary has {words} words; it must have {NEWS_MIN_WORDS} to {NEWS_MAX_WORDS}")
    article_date = iso_date(f.get(NF["article_date"]))
    if article_date is None:
        return fail(f"Article Date {f.get(NF['article_date'])!r} is not a date")
    why = plain_text(f.get(NF["why"]))

    slug = str(f.get(NF["slug"]) or "").strip().lower()
    if not SLUG_RE.match(slug):
        slug = slugify(f"{post_date} {title}")
    if not SLUG_RE.match(slug):
        return fail(f"cannot make a valid slug from {title!r}")
    url = f"{SITE}/news/#{slug}"
    target = NEWS_DIR / f"{slug}.html"

    conflict = slug_conflict(slug, target, manifest["news"])
    if conflict:
        return fail(conflict)
    if target.exists():
        print(f"  {target.relative_to(ROOT)} is already on main; the row will be marked Published")
        manifest["news"].append({"id": rid, "slug": slug, "title": title, "url": url, "files": [],
                                 "log": f"{now_iso()} {target.relative_to(ROOT)} was already on main; row marked Published by the publisher workflow"})
        return

    meta = [
        ("title", title),
        ("source", source),
        ("source_url", source_url),
        ("date", post_date),
        ("published", article_date),
        ("category", category),
        ("status", "published"),
    ]
    body = f"<p>{html.escape(summary, quote=False)}</p>"
    if why:
        why = re.sub(r"^\s*why it matters:\s*", "", why, flags=re.I)
        body += f'\n<p class="why">Why it matters: {html.escape(why, quote=False)}</p>'
    NEWS_DIR.mkdir(parents=True, exist_ok=True)
    target.write_text("\n".join(["<!--meta"] + [f"{k}: {v}" for k, v in meta if v] + ["-->", body, ""]), encoding="utf-8")

    ok, build_log = build_site()
    if not ok:
        target.unlink(missing_ok=True)
        return fail(build_log)

    files = [str(target.relative_to(ROOT))]
    manifest["news"].append({"id": rid, "slug": slug, "title": title, "url": url, "files": files,
                             "log": f"{now_iso()} files: {files[0]}; {build_log}; {words} words; {category}"})
    print(f"  wrote {files[0]} ({words} words, {category})")


def prepare_news(manifest):
    rows = list_records(NEWS, NEWS_DUE_FORMULA)
    today = local_date(datetime.now(timezone.utc))
    due = []
    for r in rows:
        raw = r.get("fields", {}).get(NF["post_date"])
        d = iso_date(raw)
        if d is None:
            print(f"- {r['id']}: Post Date {raw!r}")
            mark_failed(r["id"], f"Post Date {raw!r} is not a date", NEWS, NF)
        elif d > today:
            print(f"- {r['id']}: Post Date {d}, not yet")
        else:
            due.append((d or today, r))   # blank means as soon as approved
    due.sort(key=lambda x: x[0])
    print(f"{len(rows)} approved news row(s), {len(due)} due, publishing up to {MAX_NEWS}")
    for d, r in due[:MAX_NEWS]:
        prepare_news_one(r, d, manifest)


def prepare():
    manifest = {"prepared_at": now_iso(), "posts": [], "news": []}
    if not TOKEN:
        print("AIRTABLE_TOKEN is not set; nothing to publish.")
        write_manifest(manifest)
        gh_output(count=0, finalize=0, commit_message="", headlines="")
        return 0
    prepare_blog(manifest)
    prepare_news(manifest)
    write_manifest(manifest)
    written = [p for p in manifest["posts"] if p["files"]]
    news_written = [n for n in manifest["news"] if n["files"]]
    heads = [p["headline"] for p in written]
    parts = []
    if heads:
        parts.append(f"Blog: {heads[0]}" if len(heads) == 1 else f"Blog: {len(heads)} articles ({'; '.join(heads)})")
    if news_written:
        parts.append(f"News: {len(news_written)} item" + ("" if len(news_written) == 1 else "s"))
    total = len(manifest["posts"]) + len(manifest["news"])
    gh_output(count=len(written) + len(news_written), finalize=total,
              commit_message="; ".join(parts)[:200], headlines="; ".join(heads))
    print(f"{len(written)} article(s) and {len(news_written)} news item(s) written; "
          f"{total - len(written) - len(news_written)} already on main; manifest {MANIFEST}")
    return 0


# ---------------------------------------------------------------- finalize
def finalize():
    if not TOKEN:
        print("AIRTABLE_TOKEN is not set; nothing to finalize.")
        return 0
    manifest = read_manifest()
    posts, news = manifest.get("posts", []), manifest.get("news", [])
    if not posts and not news:
        print("nothing to finalize")
        return 0
    sha = git("rev-parse", "--short", "HEAD") or "unknown"
    errors = 0
    for p in posts:
        try:
            update_record(ITEMS, p["id"], {
                F["status"]: "Published",
                F["published_url"]: p["url"],
                F["published_at"]: now_iso(),
                F["publish_log"]: f"{p['log']}; commit {sha}; published by GitHub Actions",
            })
            for tid in p.get("topics") or []:
                update_record(TOPICS, tid, {TF["status"]: "Published", TF["published_url"]: p["url"]})
            print(f"- {p['headline']}: Published at {p['url']}")
        except RuntimeError as e:
            errors += 1
            print(f"- {p['headline']}: Airtable update failed: {e}")
    for n in news:
        try:
            update_record(NEWS, n["id"], {
                NF["status"]: "Published",
                NF["published_url"]: n["url"],
                NF["published_at"]: now_iso(),
                NF["publish_log"]: f"{n['log']}; commit {sha}; published by GitHub Actions",
            })
            print(f"- {n['title']}: Published at {n['url']}")
        except RuntimeError as e:
            errors += 1
            print(f"- {n['title']}: Airtable update failed: {e}")
    return 1 if errors else 0


def main(argv):
    cmd = argv[1] if len(argv) > 1 else ""
    if cmd == "prepare":
        return prepare()
    if cmd == "finalize":
        return finalize()
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
