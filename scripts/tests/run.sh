#!/usr/bin/env bash
# End-to-end test of scripts/publish_from_airtable.py against a fake Airtable.
#
# Copies the repository to a temporary directory (without .git), starts
# scripts/tests/mock_airtable.py on a free port, runs `prepare` and `finalize`
# with AIRTABLE_API_URL pointing at the mock, and checks the files written,
# the GITHUB_OUTPUT values and the PATCH calls the mock logged. Prints PASS
# or FAIL and exits 0 or 1. Needs python3 only; no network.
#
#   bash scripts/tests/run.sh            (VERBOSE=1 also prints what the run produced)

set -u -o pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
TMP="$(mktemp -d)"
WORK="$TMP/repo"
MOCK_PID=""
export TMP WORK

cleanup() {
  if [ -n "$MOCK_PID" ]; then
    kill "$MOCK_PID" 2>/dev/null
    wait "$MOCK_PID" 2>/dev/null
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT

fail() {
  echo "FAIL: $*"
  for f in prepare.out finalize.out mock.out; do
    if [ -s "$TMP/$f" ]; then
      echo "---- $f"
      tail -n 40 "$TMP/$f"
    fi
  done
  exit 1
}

# The assertions, in Python because the log, manifest and outputs are JSON-ish.
check() {
  python3 - "$1" <<'PYEOF'
import json, os, sys

phase = sys.argv[1]
tmp, work = os.environ["TMP"], os.environ["WORK"]
today, yesterday = os.environ["TODAY"], os.environ["YESTERDAY"]
SITE = "https://www.kirbygateliving.com"
ITEMS, TOPICS, NEWS = "tblVtdUcldbtwe50j", "tbl2jfMNcGqANbQ2q", "tblShi8ugFZKwvz4k"
BLOG_SLUG = "paying-for-assisted-living-in-tennessee"
NEWS1 = f"{yesterday}-medicare-open-enrollment-runs-through-december-7"
NEWS2 = "fall-family-night-2026"
problems = []


def check(cond, msg):
    if not cond:
        problems.append(msg)


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def exists(rel):
    return os.path.exists(os.path.join(work, rel))


log = [json.loads(line) for line in read(f"{tmp}/patch.log").splitlines() if line.strip()]
manifest = json.load(open(f"{tmp}/manifest.json", encoding="utf-8"))

if phase == "prepare":
    # files written
    check(exists(f"content/blog/{BLOG_SLUG}.html"), "due blog article was not written")
    check(exists(f"public/assets/img/blog/{BLOG_SLUG}.jpg"), "blog photo was not saved")
    check(not exists("content/blog/memory-care-vs-assisted-living.html"), "future blog article was written")
    check(not exists("content/blog/a-note-that-is-too-short.html"), "too-short blog article was written")
    check(not exists(f"content/news/{yesterday}-study-links-hearing-aids-to-slower-memory-decline.html"),
          "news item with a bad URL was written")
    check(not exists(f"content/news/{today}-tennessee-choices-waiver-adds-new-in-home-benefits.html"),
          "future news item was written")
    if exists(f"content/blog/{BLOG_SLUG}.html"):
        blog = read(f"{work}/content/blog/{BLOG_SLUG}.html")
        for line in (f"date: {yesterday}", f"path: /blog/{BLOG_SLUG}/", "headline: Paying for Assisted Living in Tennessee",
                     f"image: /assets/img/blog/{BLOG_SLUG}.jpg", "image_alt: Residents sharing lunch in the dining room",
                     "tags: paying for care, paying for assisted living in tennessee, family resources", "status: published"):
            check(f"\n{line}\n" in blog, f"blog meta line missing: {line}")
    expected1 = f"""<!--meta
title: Medicare open enrollment runs through December 7
source: AARP
source_url: https://www.aarp.org/medicare/open-enrollment-2027/
date: {yesterday}
published: 2026-10-20
category: finance
status: published
-->
<p>Medicare's annual open enrollment period lets people with Medicare review and change their Part D & Medicare Advantage plans. Premiums, drug lists and provider networks change every year, so a plan that fit last year may not fit now. Free one-on-one help is available through the Tennessee SHIP counselors.</p>
<p class="why">Why it matters: Plan changes made now take effect in January.</p>
"""
    expected2 = f"""<!--meta
title: Fall family night at The Pointe
source_url: /activities-calendar/
date: {today}
category: community
status: published
-->
<p>Families are invited to an evening of music, dessert and conversation with our care team on the first Thursday in November. Residents' families, friends and neighbors are welcome, and no RSVP is needed.</p>
"""
    for slug, expected in ((NEWS1, expected1), (NEWS2, expected2)):
        if not exists(f"content/news/{slug}.html"):
            problems.append(f"news item {slug} was not written")
        elif read(f"{work}/content/news/{slug}.html") != expected:
            problems.append(f"content/news/{slug}.html differs from the expected format:\n" + read(f"{work}/content/news/{slug}.html"))

    # GITHUB_OUTPUT
    out = dict(line.split("=", 1) for line in read(f"{tmp}/github-output").splitlines() if "=" in line)
    for k, v in {"count": "3", "finalize": "3", "headlines": "Paying for Assisted Living in Tennessee",
                 "commit_message": "Blog: Paying for Assisted Living in Tennessee; News: 2 items"}.items():
        check(out.get(k) == v, f"GITHUB_OUTPUT {k}={out.get(k)!r}, expected {v!r}")

    # manifest
    check([p["slug"] for p in manifest.get("posts", [])] == [BLOG_SLUG], f"manifest posts: {manifest.get('posts')}")
    check([n["slug"] for n in manifest.get("news", [])] == [NEWS1, NEWS2], f"manifest news: {manifest.get('news')}")
    check([n["url"] for n in manifest.get("news", [])] == [f"{SITE}/news/#{NEWS1}", f"{SITE}/news/#{NEWS2}"], "manifest news urls")

    # the rows that failed validation were marked Failed with a reason; nothing else was touched
    check(len(log) == 2, f"expected 2 PATCH calls after prepare, got {len(log)}: {log}")
    if len(log) == 2:
        short, bad = log
        check(short["table"] == ITEMS and short["id"] == "recBlogShort00001", f"first PATCH is not the short article: {short}")
        check(short["named"].get("Status") == "Failed" and "Copy has" in short["named"].get("Publish Log", "")
              and "minimum is 300" in short["named"].get("Publish Log", ""), f"short article not failed properly: {short}")
        check(bad["table"] == NEWS and bad["id"] == "recNewsBadUrl0001", f"second PATCH is not the bad-URL news item: {bad}")
        check(bad["named"].get("Status") == "Failed" and "Source URL" in bad["named"].get("Publish Log", ""),
              f"bad-URL news item not failed properly: {bad}")

elif phase == "finalize":
    check(len(log) == 6, f"expected 6 PATCH calls in total, got {len(log)}: {log}")
    if len(log) == 6:
        blog, topic, news1, news2 = log[2:]
        check(blog["table"] == ITEMS and blog["id"] == "recBlogDue0000001", f"blog row not finalized: {blog}")
        check(blog["named"].get("Status") == "Published", f"blog row status: {blog}")
        check(blog["named"].get("Published URL") == f"{SITE}/blog/{BLOG_SLUG}/", f"blog Published URL: {blog}")
        check(blog["named"].get("Published At", "").endswith("Z"), f"blog Published At: {blog}")
        check("commit " in blog["named"].get("Publish Log", "") and "published by GitHub Actions" in blog["named"].get("Publish Log", ""),
              f"blog Publish Log: {blog}")
        check(topic["table"] == TOPICS and topic["id"] == "recTopicPaying001" and topic["named"].get("Status") == "Published"
              and topic["named"].get("Published URL") == f"{SITE}/blog/{BLOG_SLUG}/", f"topic not finalized: {topic}")
        for entry, rid, slug in ((news1, "recNewsFinance0001", NEWS1), (news2, "recNewsCommunity01", NEWS2)):
            check(entry["table"] == NEWS and entry["id"] == rid, f"news row {rid} not finalized: {entry}")
            check(entry["named"].get("Status") == "Published", f"news row {rid} status: {entry}")
            check(entry["named"].get("Published URL") == f"{SITE}/news/#{slug}", f"news row {rid} Published URL: {entry}")
            check(entry["named"].get("Published At", "").endswith("Z"), f"news row {rid} Published At: {entry}")
            check(f"content/news/{slug}.html" in entry["named"].get("Publish Log", "") and "commit " in entry["named"].get("Publish Log", ""),
                  f"news row {rid} Publish Log: {entry}")
    touched = {e["id"] for e in log}
    check("recBlogFuture0001" not in touched and "recNewsFuture0001" not in touched, "a future row was updated")
else:
    problems.append(f"unknown phase {phase}")

for p in problems:
    print(f"  - {p}")
sys.exit(1 if problems else 0)
PYEOF
}

# 1. A throwaway copy of the repository, without .git so nothing here can touch it.
mkdir -p "$WORK"
tar -C "$REPO" --exclude=.git --exclude=.claude --exclude=__pycache__ -cf - . | tar -C "$WORK" -xf - || fail "could not copy the repository"

# 2. The fake Airtable, on a free port it picks itself and reports in the info file.
python3 "$HERE/mock_airtable.py" --info-file "$TMP/info.json" --log "$TMP/patch.log" > "$TMP/mock.out" 2>&1 &
MOCK_PID=$!
INFO="$(python3 - "$TMP/info.json" <<'PYEOF'
import json, os, sys, time
path = sys.argv[1]
for _ in range(200):
    if os.path.exists(path):
        d = json.load(open(path, encoding="utf-8"))
        print(d["port"], d["today"], d["yesterday"])
        break
    time.sleep(0.05)
PYEOF
)"
[ -n "$INFO" ] || fail "the mock Airtable did not start"
read -r PORT TODAY YESTERDAY <<< "$INFO"
export TODAY YESTERDAY

export AIRTABLE_TOKEN="test-token"
export AIRTABLE_API_URL="http://127.0.0.1:$PORT/v0"
export MANIFEST="$TMP/manifest.json"
export GITHUB_OUTPUT="$TMP/github-output"
export MAX_POSTS="2" MAX_NEWS="5"
export no_proxy="127.0.0.1,localhost" NO_PROXY="127.0.0.1,localhost"
: > "$GITHUB_OUTPUT"

# 3. prepare: files, build, manifest, outputs, Failed rows
python3 "$WORK/scripts/publish_from_airtable.py" prepare > "$TMP/prepare.out" 2>&1 || fail "prepare exited with status $?"
check prepare || fail "prepare did not produce what was expected"

# 4. finalize: the rows are marked Published
python3 "$WORK/scripts/publish_from_airtable.py" finalize > "$TMP/finalize.out" 2>&1 || fail "finalize exited with status $?"
check finalize || fail "finalize did not update Airtable as expected"

if [ "${VERBOSE:-0}" = "1" ]; then
  for f in prepare.out finalize.out github-output patch.log; do
    echo "---- $f"
    cat "$TMP/$f"
  done
  for f in "$WORK"/content/news/*.html; do
    echo "---- ${f#"$WORK/"}"
    cat "$f"
  done
fi
echo "PASS"
