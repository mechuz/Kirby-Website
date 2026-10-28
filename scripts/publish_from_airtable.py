#!/usr/bin/env python3
"""Publish approved blog articles from Airtable into content/blog/.

Run by .github/workflows/publish-blog.yml in two steps:

  prepare   Read Content Items rows with Channel = Blog, Status = Approved,
            Compliance Check ticked and a Publish Date that has passed. Write
            each as content/blog/<slug>.html (plus its approved photo under
            public/assets/img/blog/), run build.py to prove the site still
            builds, and record what was written in a manifest file.
  finalize  After the workflow has pushed the commit, mark those rows
            Published in Airtable and update their linked topics.

Rows that cannot be published (bad slug, unsafe HTML, too short, build
failure) are set to Failed with the reason in Publish Log, so nothing is
retried forever. Rows whose file is already on main are only marked Published.

Environment: AIRTABLE_TOKEN (required; without it the script exits quietly),
MANIFEST (path, default /tmp/publish-manifest.json), MAX_POSTS (default 2),
AIRTABLE_API_URL (tests only), GITHUB_OUTPUT (set by GitHub Actions).
Standard library only.
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
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG_DIR = ROOT / "content" / "blog"
IMG_DIR = ROOT / "public" / "assets" / "img" / "blog"
SITE = "https://www.kirbygateliving.com"
SITE_NAME = "The Pointe at Kirby Gate"

API = os.environ.get("AIRTABLE_API_URL", "https://api.airtable.com/v0").rstrip("/")
BASE = "appZ2xOP1HzOWjug7"          # Kirby Gate Lead Engine
ITEMS = "tblVtdUcldbtwe50j"         # Content Items
TOPICS = "tbl2jfMNcGqANbQ2q"        # Content Topics
PHOTOS = "tbl3Kr5c6Iovf0tx9"        # GBP Post Photos

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

# The filter runs inside Airtable and therefore uses column names.
DUE_FORMULA = "AND({Channel}='Blog',{Status}='Approved',{Compliance Check}=1)"

MAX_POSTS = int(os.environ.get("MAX_POSTS", "2"))
MANIFEST = Path(os.environ.get("MANIFEST", "/tmp/publish-manifest.json"))
TOKEN = os.environ.get("AIRTABLE_TOKEN", "").strip()

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
UNSAFE_RE = re.compile(r"<\s*(script|iframe|object|embed|form|style|link|meta)\b|javascript\s*:|\son[a-z]+\s*=", re.I)
TAG_RE = re.compile(r"<[^>]+>")
MIN_WORDS = 300
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
    s = re.sub(r"\s+", " ", str(s or "")).replace("-->", "").strip()
    return s[:limit].rstrip() if limit else s


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", str(s or "").lower()).strip("-")
    return s[:80].rstrip("-")


def text_of(body):
    return re.sub(r"\s+", " ", html.unescape(TAG_RE.sub(" ", body))).strip()


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
        return {"posts": []}
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


def mark_failed(rid, reason):
    print(f"  FAILED: {reason}")
    update_record(ITEMS, rid, {F["status"]: "Failed", F["publish_log"]: f"{now_iso()} {reason}"})


# ----------------------------------------------------------------- prepare
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


def prepare():
    manifest = {"prepared_at": now_iso(), "posts": []}
    if not TOKEN:
        print("AIRTABLE_TOKEN is not set; nothing to publish.")
        write_manifest(manifest)
        gh_output(count=0, finalize=0, commit_message="", headlines="")
        return 0
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
    write_manifest(manifest)
    written = [p for p in manifest["posts"] if p["files"]]
    heads = [p["headline"] for p in written]
    msg = f"Blog: {heads[0]}" if len(heads) == 1 else (f"Blog: {len(heads)} articles ({'; '.join(heads)})" if heads else "")
    gh_output(count=len(written), finalize=len(manifest["posts"]), commit_message=msg[:200], headlines="; ".join(heads))
    print(f"{len(written)} article(s) written; {len(manifest['posts']) - len(written)} already on main; manifest {MANIFEST}")
    return 0


# ---------------------------------------------------------------- finalize
def finalize():
    if not TOKEN:
        print("AIRTABLE_TOKEN is not set; nothing to finalize.")
        return 0
    posts = read_manifest().get("posts", [])
    if not posts:
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
