#!/usr/bin/env python3
"""A fake of the Airtable REST API for scripts/tests/run.sh.

Serves the four tables scripts/publish_from_airtable.py touches (Content
Items, Content Topics, GBP Post Photos, News Items) from in-memory fixtures:
one due blog article with a photo, one future article, one article that is
too short, two due news items of different categories, one news item with a
bad link and one future news item. It answers GET list (filterByFormula,
returnFieldsByFieldId), GET record and PATCH record the way Airtable does,
appends every PATCH to a JSON-lines log, and serves the fixture photo.

    mock_airtable.py --info-file PATH --log PATH

The server binds a free port on 127.0.0.1 and then writes {"port", "today",
"yesterday"} (dates in America/Chicago) to the info file. Standard library
only; stop it with SIGTERM.
"""
import argparse
import json
import os
import re
import sys
import threading
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

BASE = "appZ2xOP1HzOWjug7"
ITEMS, TOPICS, PHOTOS, NEWS = "tblVtdUcldbtwe50j", "tbl2jfMNcGqANbQ2q", "tbl3Kr5c6Iovf0tx9", "tblShi8ugFZKwvz4k"

# table id -> {column name: field id}, the same ids the publisher uses
TABLES = {
    ITEMS: {
        "Title": "fldjkMH6vTJUGEnjs", "Channel": "fld5Hg2Z2bfLR9Va7", "Status": "fldVeRcuq6Kfsb1wo",
        "Publish Date": "fldBfij1yPpo8s1Vx", "Headline": "fldv61FVy374FuiQH", "Copy": "fldZ7gZVtaBtnhS9I",
        "Slug": "fld5ZytzRqrLsA43X", "Meta Description": "fldeoI39cMyiuwydL", "Primary Keyword": "fldWRoyuIDZO8VdYE",
        "Image URL": "fldsY6uzuoy7Lb2wC", "Image Alt Text": "fldBfORvhdrOFdpW9", "Photo": "fldgFZVjz31hFsS9u",
        "Compliance Check": "fldnN11jeIvb4wJqL", "Published URL": "fldWQ3lTcLXtOsA7C", "Published At": "fldTeBxf6bufiuTpe",
        "Publish Log": "fldavaVWQzLlQwuVf", "Topic": "fld2vq1JajYdLlekC",
    },
    TOPICS: {"Topic": "fld23rCLAEOvN4UlS", "Pillar": "fldE46oRrF5abE4vg", "Status": "fld9ScdnbK8TEpTuR",
             "Published URL": "fldRXkomlewHN2tux"},
    PHOTOS: {"Name": "fldSHKs2O4omHOA01", "URL": "fldGXEgC4pqcAe99d", "Status": "fldjjHNkxpR4eQV8W"},
    NEWS: {
        "Title": "fld0j3cwYUexMuUvO", "Source": "fldgsvUdQCqYnY49l", "Source URL": "fld3TwnCDts5c1kGd",
        "Article Date": "fldTY1vtCesbUxg2O", "Category": "fld4DIXgZ1xtHK06z", "Summary": "fldnCKId0CrwIsr4z",
        "Why It Matters": "fldXOLW8ZapBYq130", "Status": "fldQlakdY6hVHwaPZ", "Added By": "fldAO9f4nsvYscAqy",
        "Compliance Check": "fldO7msiyQ0IeWXPl", "Post Date": "fldrmFj75X5EfQGw3", "Slug": "fldO7qUjBnbkWWP9n",
        "Published URL": "fldfzfJUHGPygSKUq", "Published At": "fld6WOeBJcbSTXiFs", "Publish Log": "fldHzhdfKpokoBZYP",
        "Notes": "fldpJ6h0gYLJfm8dk",
    },
}

try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo("America/Chicago")
except Exception:  # pragma: no cover
    TZ = timezone.utc
NOW = datetime.now(timezone.utc)
TODAY = NOW.astimezone(TZ).date()
YESTERDAY = TODAY - timedelta(days=1)
CREATED = "2026-10-01T12:00:00.000Z"
PHOTO_BYTES = b"\xff\xd8\xff\xe0" + b"\0" * 29996   # 30000 bytes, JPEG magic, no real picture


def stamp(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")


ARTICLE = "<h2>What the monthly rate covers</h2>\n" + "\n".join(f"<p>{p}</p>" for p in [
    "Families usually start comparing communities after a fall, a hospital stay or a winter that made living "
    "alone feel risky. The first question is almost always the same: what does assisted living in Tennessee cost, "
    "and what is included. The honest answer is that it depends on the care your parent needs, so the useful work "
    "is understanding how the pieces fit together.",
    "Most communities charge a base rate for the apartment, meals, housekeeping, activities and transportation, "
    "then add a care level that reflects the hands-on help a resident receives each day. Ask how the care level is "
    "assessed, who reviews it and how often, and what happens when needs change. A written assessment before "
    "move-in is a good sign.",
    "Tennessee does not pay for assisted living through traditional Medicare. Some families use the CHOICES program "
    "through TennCare, long-term care insurance, veterans benefits such as Aid and Attendance, or the proceeds of "
    "selling a home. Each has its own rules and timelines, and a community that has helped families through them "
    "before can save you weeks.",
    "When you tour, ask for the full fee schedule in writing, including community fees, care levels, medication "
    "management and any charges that change when a resident moves between assisted living and memory care. Then "
    "ask what has changed in the last two years. A clear answer tells you as much about the community as the "
    "number itself.",
    "It helps to compare communities on the same day with the same list of questions. Bring the medication list, "
    "a sense of what a good day looks like for your parent, and the things that matter most to them, whether that "
    "is a garden, a church service or a dog that visits on Thursdays.",
    "Our team walks families through this every week, with no pressure. If it would help to talk it through, call "
    "us or schedule a private tour. Come for the visit, stay for lunch, and bring your questions.",
])
SHORT = ("<p>A short note about our fall schedule. The activities calendar for November is posted on the site, "
         "and families are welcome at every event.</p>")


def word_count(s):
    return len(re.sub(r"<[^>]+>", " ", s).split())


assert word_count(ARTICLE) >= 300, "fixture article must have at least 300 words"
assert word_count(SHORT) < 300, "fixture short article must be too short"


def fixtures(port):
    """Records by table, keyed by record id, fields by column name."""
    return {
        ITEMS: {
            "recBlogDue0000001": {
                "Title": "Paying for Assisted Living in Tennessee | The Pointe at Kirby Gate",
                "Channel": "Blog", "Status": "Approved", "Publish Date": stamp(NOW - timedelta(days=1)),
                "Headline": "Paying for Assisted Living in Tennessee", "Copy": ARTICLE,
                "Slug": "paying-for-assisted-living-in-tennessee",
                "Meta Description": "How families in Tennessee pay for assisted living: what the monthly rate "
                                    "covers, how care levels work, and the programs that can help.",
                "Primary Keyword": "paying for assisted living in Tennessee",
                "Image Alt Text": "Residents sharing lunch in the dining room",
                "Photo": ["recPhotoDining001"], "Compliance Check": True, "Topic": ["recTopicPaying001"],
            },
            "recBlogFuture0001": {
                "Title": "Memory Care vs Assisted Living: How to Tell", "Channel": "Blog", "Status": "Approved",
                "Publish Date": stamp(NOW + timedelta(days=30)),
                "Headline": "Memory Care vs Assisted Living: How to Tell", "Copy": ARTICLE,
                "Slug": "memory-care-vs-assisted-living", "Compliance Check": True,
            },
            "recBlogShort00001": {
                "Title": "A Note That Is Too Short", "Channel": "Blog", "Status": "Approved",
                "Publish Date": stamp(NOW - timedelta(days=1)),
                "Headline": "A Note That Is Too Short", "Copy": SHORT,
                "Slug": "a-note-that-is-too-short", "Compliance Check": True,
            },
        },
        TOPICS: {
            "recTopicPaying001": {"Topic": "Paying for assisted living in Tennessee", "Pillar": "Paying for care",
                                  "Status": "Drafted"},
        },
        PHOTOS: {
            "recPhotoDining001": {"Name": "dining-room-lunch",
                                  "URL": f"http://127.0.0.1:{port}/photos/dining-room-lunch.jpg",
                                  "Status": "Approved"},
        },
        NEWS: {
            "recNewsFinance0001": {
                "Title": "Medicare open enrollment runs through <strong>December 7</strong>",
                "Source": "AARP", "Source URL": "https://www.aarp.org/medicare/open-enrollment-2027/",
                "Article Date": "2026-10-20", "Category": "Paying for care",
                "Summary": "Medicare's annual open enrollment period lets people with Medicare review <em>and "
                           "change</em> their Part D &amp; Medicare Advantage plans. Premiums, drug lists and "
                           "provider networks change every year,\nso a plan that fit last year may not fit now. "
                           "Free one-on-one help is available through the Tennessee SHIP counselors.",
                "Why It Matters": "Plan changes made now take effect in January.",
                "Status": "Approved", "Added By": "Curator", "Compliance Check": True,
                "Post Date": YESTERDAY.isoformat(),
            },
            "recNewsCommunity01": {
                "Title": "Fall family night at The Pointe", "Source URL": "/activities-calendar/",
                "Category": "Community update",
                "Summary": "Families are invited to an evening of music, dessert and conversation with our care "
                           "team on the first Thursday in November. Residents' families, friends and neighbors "
                           "are welcome, and no RSVP is needed.",
                "Status": "Approved", "Added By": "Human", "Compliance Check": True,
                "Slug": "fall-family-night-2026",
            },
            "recNewsBadUrl0001": {
                "Title": "Study links hearing aids to slower memory decline",
                "Source": "The New York Times",
                "Source URL": "www.nytimes.com/2026/10/15/health/hearing-aids-memory.html",
                "Article Date": "2026-10-15", "Category": "Health & research",
                "Summary": "A large study found that older adults who used hearing aids showed slower declines in "
                           "memory and thinking over three years than those who did not. Researchers say the "
                           "effect was strongest for people at higher risk.",
                "Status": "Approved", "Added By": "Curator", "Compliance Check": True,
                "Post Date": YESTERDAY.isoformat(),
            },
            "recNewsFuture0001": {
                "Title": "Tennessee CHOICES waiver adds new in-home benefits",
                "Source": "Daily Memphian", "Source URL": "https://dailymemphian.com/article/choices-waiver-2027",
                "Article Date": "2026-10-25", "Category": "Policy & benefits",
                "Summary": "TennCare says its CHOICES program will cover more hours of in-home help starting next "
                           "year, which could delay a move for some families. Details on who qualifies are "
                           "expected in December.",
                "Status": "Approved", "Added By": "Curator", "Compliance Check": True,
                "Post Date": (TODAY + timedelta(days=7)).isoformat(),
            },
        },
    }


STORE = {}
LOG_PATH = ""
LOCK = threading.Lock()

COND_RE = re.compile(r"\{([^}]+)\}=(?:'([^']*)'|(-?\d+))")


def matches(formula, rec):
    """The tiny subset of Airtable formulas the publisher uses:
    AND({Column}='text', {Checkbox}=1, ...). Anything else is an error."""
    f = formula.strip()
    if not f:
        return True
    m = re.fullmatch(r"AND\((.*)\)", f, re.S)
    inner = m.group(1) if m else f
    if COND_RE.sub("", inner).replace(",", "").strip():
        raise ValueError(f"unsupported formula: {formula}")
    for c in COND_RE.finditer(inner):
        name, text, num = c.group(1), c.group(2), c.group(3)
        v = rec.get(name)
        if num is not None:
            if (1 if v else 0) != int(num):
                return False
        elif str(v if v is not None else "") != text:
            return False
    return True


def visible(table, fields, by_id):
    """Airtable omits empty cells; by_id keys the cells by field id."""
    ids = TABLES[table]
    return {(ids.get(k, k) if by_id else k): v for k, v in fields.items() if v not in (None, "", False, [])}


class Handler(BaseHTTPRequestHandler):
    server_version = "MockAirtable/1.0"

    def log_request(self, code="-", size="-"):
        print(f"{code} {self.command} {self.path}", flush=True)

    def send_json(self, code, obj):
        data = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def error(self, code, kind, message):
        self.send_json(code, {"error": {"type": kind, "message": message}})

    def route(self):
        """(table id, record id or None), or None after sending an error."""
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer ") or not auth[7:].strip():
            self.error(401, "AUTHENTICATION_REQUIRED", "Authentication required")
            return None
        m = re.fullmatch(r"/v0/([^/]+)/([^/]+)(?:/([^/]+))?", urlparse(self.path).path)
        if not m or m.group(1) != BASE or m.group(2) not in STORE:
            self.error(404, "NOT_FOUND", "Could not find what you are looking for")
            return None
        return m.group(2), m.group(3)

    def do_GET(self):
        url = urlparse(self.path)
        if url.path.startswith("/photos/"):
            self.send_response(200)
            self.send_header("Content-Type", "image/jpeg")
            self.send_header("Content-Length", str(len(PHOTO_BYTES)))
            self.end_headers()
            self.wfile.write(PHOTO_BYTES)
            return
        r = self.route()
        if not r:
            return
        table, rid = r
        q = parse_qs(url.query)
        by_id = q.get("returnFieldsByFieldId", ["false"])[0] == "true"
        if rid:
            rec = STORE[table].get(rid)
            if rec is None:
                return self.error(404, "NOT_FOUND", f"Could not find record {rid}")
            return self.send_json(200, {"id": rid, "createdTime": CREATED, "fields": visible(table, rec, by_id)})
        try:
            rows = [{"id": k, "createdTime": CREATED, "fields": visible(table, v, by_id)}
                    for k, v in STORE[table].items() if matches(q.get("filterByFormula", [""])[0], v)]
        except ValueError as e:
            return self.error(422, "INVALID_FILTER_BY_FORMULA", str(e))
        self.send_json(200, {"records": rows})

    def do_PATCH(self):
        r = self.route()
        if not r:
            return
        table, rid = r
        rec = STORE[table].get(rid) if rid else None
        if rec is None:
            return self.error(404, "NOT_FOUND", f"Could not find record {rid}")
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
            sent = body["fields"]
            assert isinstance(sent, dict)
        except (ValueError, KeyError, AssertionError):
            return self.error(422, "INVALID_REQUEST_BODY", "Could not parse request body")
        names = {v: k for k, v in TABLES[table].items()}
        named = {names.get(k, k): v for k, v in sent.items()}
        with LOCK:
            rec.update(named)
            with open(LOG_PATH, "a", encoding="utf-8") as fh:
                fh.write(json.dumps({"table": table, "id": rid, "fields": sent, "named": named}) + "\n")
        self.send_json(200, {"id": rid, "createdTime": CREATED, "fields": visible(table, rec, False)})


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--info-file", required=True, help="written once the server listens: port and dates")
    ap.add_argument("--log", required=True, help="JSON lines, one per PATCH request")
    a = ap.parse_args()
    global STORE, LOG_PATH
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    port = server.server_address[1]
    STORE = fixtures(port)
    LOG_PATH = a.log
    open(LOG_PATH, "w").close()
    tmp = a.info_file + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump({"port": port, "today": TODAY.isoformat(), "yesterday": YESTERDAY.isoformat()}, fh)
    os.replace(tmp, a.info_file)
    print(f"mock Airtable listening on 127.0.0.1:{port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
