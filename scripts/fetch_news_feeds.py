#!/usr/bin/env python3
"""Collect today's senior living headlines from publishers' RSS/Atom feeds.

Runs in GitHub Actions (.github/workflows/refresh-news-feeds.yml) and writes
content/news_feeds.json, which build.py turns into the "Headlines from across
senior living" list on /news/ and the latest-news strip on the home page.

Only the headline, the publisher, the date and the link are kept: the stories
belong to their publishers and every headline links straight to the original.
A feed that fails is recorded in "sources" with its error and simply skipped,
so one broken feed never empties the page. Standard library only.

    python3 scripts/fetch_news_feeds.py [--out content/news_feeds.json] [--from-file name=path ...]

--from-file reads a saved feed instead of fetching it (used by the tests).
"""
import datetime as dt
import email.utils
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "content" / "news_feeds.json"
UA = "Mozilla/5.0 (compatible; KirbyGateNewsBot/1.0; +https://www.kirbygateliving.com/news/)"
MAX_AGE_DAYS = 14
MAX_ITEMS = 60
PER_SOURCE = 8           # keeps one busy publisher from filling the list

# name, feed URLs (first one that works wins), topical: True when every item on
# the feed is about older adults or senior living, False when items must match TOPIC_RE.
SOURCES = [
    ("Senior Housing News", ["https://seniorhousingnews.com/feed/"], True),
    ("NIC MAP", ["https://www.nicmap.com/feed/"], True),
    ("Argentum", ["https://www.argentum.org/feed/"], True),
    ("LeadingAge", ["https://leadingage.org/feed/"], True),
    ("KFF Health News", ["https://kffhealthnews.org/topics/aging/feed/"], True),
    ("KFF Health News", ["https://kffhealthnews.org/topics/long-term-care/feed/"], True),
    ("Next Avenue", ["https://www.nextavenue.org/feed/"], True),
    ("Being Patient", ["https://www.beingpatient.com/feed/"], True),
    ("Alzheimer's News Today", ["https://alzheimersnewstoday.com/feed/"], True),
    ("ScienceDaily", ["https://www.sciencedaily.com/rss/mind_brain/alzheimer's.xml"], False),
    ("ScienceDaily", ["https://www.sciencedaily.com/rss/health_medicine/healthy_aging.xml"], False),
    ("NIH News", ["https://www.nih.gov/news-releases/feed.xml"], False),
    ("NPR Health", ["https://feeds.npr.org/1128/rss.xml"], False),
    ("McKnight's Senior Living", ["https://www.mcknightsseniorliving.com/feed/"], True),
    ("NIC", ["https://www.nic.org/feed/"], True),
]

TOPIC_RE = re.compile(
    r"\b(senior|older (adult|american|people|patient)s?|aging|ageing|elder|dementia|alzheimer|"
    r"assisted living|memory care|caregiv|medicare|long-term care|nursing|retire|social security|"
    r"hospice|falls?\b|hearing loss|medicaid)", re.I)

# Single-company news, incidents and business items are left out; the page is for families.
EXCLUDE_RE = re.compile(
    r"\b(lawsuit|sues|sued|settle(s|ment)|arrest|charged|indict|abuse|neglect|death of|dies|died|killed|"
    r"fraud|bankrupt|acqui(re|res|red|sition)|sells|sold|buys|purchase[sd]?|merger|layoffs?|"
    r"transactions?|refinanc\w*|financing for|loan for|people in the news|business briefs|"
    r"webinar|sponsored|podcast|grand opening|breaks ground|groundbreaking|appoint(s|ed|ment)|"
    r"names .{0,40}(ceo|president|director|officer)|hires|earnings|quarterly results|REIT|dealbook|awards?|"
    r"deadline|president|ceo|partners? (with|on)|official .{0,40}partner|welcomes|buying spree|"
    r"largest .{0,30}operator|operators? (enters|expands)|readers|letters|refugees?|immigra\w*)\b", re.I)
# Names of senior living operators and REITs: stories about one company are not shown.
OPERATOR_RE = re.compile(
    r"\b(Welltower|Ventas|Brookdale|Discovery|Belmont Village|Sunrise|Atria|Cogir|LCS|Watermark|Kaplan|"
    r"Erickson|Holiday Retirement|Benchmark|Senior Lifestyle|Sonida|Capital Senior|Five Star|AlerisLife|"
    r"Morning Pointe|Allegro|Trilogy|Arbor Company|Integral|Silverado|Sagora|Solera|Life Care Services|"
    r"Civitas|Priority Life Care|Legend|Avamere|Frontier|Spring Hills|Charter Senior|Thrive|Merrill Gardens|"
    r"Pacifica|American House|StoryPoint|Elegance|Inspired Healthcare|Revelle|Omega|Sabra|NHI|CareTrust|"
    r"Harrison Street|Blackstone|Kayne|Grace Management|Senior Resource Group|Vi Living|Acts Retirement)\b")

ATOM = "{http://www.w3.org/2005/Atom}"
DC = "{http://purl.org/dc/elements/1.1/}"


def clean(text):
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    return re.sub(r"\s+", " ", text).strip()


def parse_date(s):
    s = (s or "").strip()
    if not s:
        return None
    try:
        d = email.utils.parsedate_to_datetime(s)
    except (TypeError, ValueError):
        try:
            d = dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
        except ValueError:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc)


def parse_feed(data):
    """[(title, link, datetime|None)] from RSS 2.0, RSS 1.0 or Atom bytes."""
    root = ET.fromstring(data)
    out = []
    for it in root.iter():
        tag = it.tag.rsplit("}", 1)[-1]
        if tag not in ("item", "entry"):
            continue
        title = link = date = ""
        for ch in it:
            t = ch.tag.rsplit("}", 1)[-1]
            if t == "title":
                title = "".join(ch.itertext())
            elif t == "link":
                href = ch.get("href")
                if href and ch.get("rel", "alternate") == "alternate":
                    link = link or href
                elif not href and (ch.text or "").strip():
                    link = link or ch.text.strip()
            elif t in ("pubDate", "published", "updated", "date") and not date:
                date = ch.text or ""
        title, link = clean(title), (link or "").strip()
        if title and link.startswith(("https://", "http://")):
            out.append((title, link, parse_date(date)))
    return out


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def norm_title(t):
    return re.sub(r"[^a-z0-9]+", " ", t.lower()).strip()


def collect(now, overrides=None):
    overrides = overrides or {}
    cutoff = now - dt.timedelta(days=MAX_AGE_DAYS)
    sources, items, seen = [], [], set()
    for name, urls, topical in SOURCES:
        entries, used, error = None, None, ""
        for url in ([overrides[name]] if name in overrides else urls):
            try:
                data = Path(url).read_bytes() if name in overrides else fetch(url)
                entries, used = parse_feed(data), url
                break
            except Exception as e:  # noqa: BLE001 - any failure just skips this URL
                error = f"{type(e).__name__}: {e}"[:200]
        if entries is None:
            sources.append({"name": name, "url": urls[0], "ok": False, "count": 0, "error": error})
            continue
        kept = 0
        for title, link, when in entries:
            if kept >= PER_SOURCE:
                break
            if when is None or when < cutoff or when > now + dt.timedelta(days=1):
                continue
            if EXCLUDE_RE.search(title) or OPERATOR_RE.search(title) or (not topical and not TOPIC_RE.search(title)):
                continue
            key = norm_title(title)
            if key in seen or len(title) < 20:
                continue
            seen.add(key)
            items.append({"title": title[:200], "link": link, "source": name,
                          "published": when.strftime("%Y-%m-%dT%H:%M:%SZ")})
            kept += 1
        sources.append({"name": name, "url": used, "ok": True, "count": kept, "error": ""})
    items.sort(key=lambda i: i["published"], reverse=True)
    return {"fetched_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "sources": sources, "items": items[:MAX_ITEMS]}


def main(argv):
    out, overrides, args = OUT, {}, argv[1:]
    while args:
        a = args.pop(0)
        if a == "--out":
            out = Path(args.pop(0))
        elif a == "--from-file":
            name, path = args.pop(0).split("=", 1)
            overrides[name] = path
        else:
            print(__doc__)
            return 2
    result = collect(dt.datetime.now(dt.timezone.utc), overrides)
    ok = [s for s in result["sources"] if s["ok"]]
    for s in result["sources"]:
        print(f"{'ok ' if s['ok'] else 'ERR'} {s['name']}: {s['count'] if s['ok'] else s['error']}")
    if not result["items"] and out.exists():
        print("no headlines collected; keeping the previous file")
        return 0
    out.write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n")
    print(f"{len(result['items'])} headlines from {len(ok)} of {len(result['sources'])} feeds -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
