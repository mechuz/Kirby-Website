"""Offline test for scripts/fetch_news_feeds.py: parsing, filtering, dedupe. Prints PASS or FAIL."""
import datetime as dt, email.utils, json, sys, tempfile
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import fetch_news_feeds as f  # noqa: E402

now = dt.datetime.now(dt.timezone.utc)
tmp = Path(tempfile.mkdtemp())
(tmp / "rss.xml").write_text((HERE / "fixtures/feed_rss.xml").read_text().replace("NOW_RFC", email.utils.format_datetime(now - dt.timedelta(hours=2))))
(tmp / "atom.xml").write_text((HERE / "fixtures/feed_atom.xml").read_text().replace("NOW_ISO", (now - dt.timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M:%SZ")))
f.SOURCES = [("Topical", ["unused"], True), ("General", ["unused"], False), ("Broken", ["https://127.0.0.1:9/none"], True)]
res = f.collect(now, {"Topical": str(tmp / "rss.xml"), "General": str(tmp / "atom.xml")})
titles = [i["title"] for i in res["items"]]
ok = {s["name"]: s["ok"] for s in res["sources"]}
checks = [
    ("keeps a fresh topical headline", "Assisted living occupancy keeps climbing as supply stays tight" in titles),
    ("drops company transactions", not any("acquires" in t for t in titles)),
    ("drops stories older than 14 days", not any("last year" in t for t in titles)),
    ("dedupes the same headline", titles.count("Assisted living occupancy keeps climbing as supply stays tight") == 1),
    ("keeps on-topic items from a general feed", any("hearing aids" in t for t in titles)),
    ("drops off-topic items from a general feed", not any("rural hospitals" in t for t in titles)),
    ("records a broken feed without failing", ok.get("Broken") is False and ok.get("Topical") is True),
    ("newest first", titles[0].startswith("Assisted living")),
]
bad = [n for n, c in checks if not c]
print("FAIL: " + "; ".join(bad) if bad else "PASS")
sys.exit(1 if bad else 0)
