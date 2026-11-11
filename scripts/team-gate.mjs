#!/usr/bin/env node
// Builds content/team.html: a sign-in page whose staff content is encrypted.
//
// The website repo is public, so the real page content and the passwords are
// never committed. They live in two private files passed on the command line:
//   content.html  the HTML shown after a correct sign-in
//   users.json    [{"username": "...", "password": "..."}, ...]
//
//   node scripts/team-gate.mjs <content.html> <users.json>
//
// How it works: a random 256-bit page key encrypts the content (AES-256-GCM).
// For each person, PBKDF2-SHA256 (600,000 rounds) turns "username + password"
// into a key that wraps the page key. Only ciphertext, salts and IVs are
// published. public/assets/js/team-gate.js reverses this in the browser.
// Re-running rotates the page key, which signs everyone out on every device.
//
// Keep the two private input files OUTSIDE this repo (the script refuses paths
// inside it). Removing a person: re-run without them AND remove them from the
// Airtable interface. Older encrypted versions stay in public git history, so the
// Airtable login, not this page, is what finally protects the lead data.
import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ITER = 600000;
const [contentPath, usersPath] = process.argv.slice(2);
if (!contentPath || !usersPath) {
  console.error("usage: node scripts/team-gate.mjs <content.html> <users.json>");
  process.exit(1);
}
const repo = realpathSync(path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
for (const p of [contentPath, usersPath]) {
  const real = realpathSync(p);
  if (real === repo || real.startsWith(repo + path.sep)) {
    console.error(`refusing ${p}: private inputs must live outside the public repo`);
    process.exit(1);
  }
}
const content = readFileSync(contentPath, "utf8");
const users = JSON.parse(readFileSync(usersPath, "utf8"));
if (!Array.isArray(users) || users.length === 0) throw new Error("users.json must list at least one user");
if (!/id="kg-signout"/.test(content)) throw new Error('content.html must include a Sign out button with id="kg-signout"');

// Must match normUser / normPass in team-gate.js.
const normUser = (u) => String(u).normalize("NFKC").replace(/\p{Cf}/gu, "").trim().toLowerCase();
const normPass = (p) => String(p).normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g, "");
const PASS_ALPHABET = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{12,}$/;

const enc = new TextEncoder();
const b64 = (u8) => Buffer.from(u8).toString("base64");
const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
const subtle = crypto.subtle;

const pageKeyRaw = rand(32);
const pageKey = await subtle.importKey("raw", pageKeyRaw, "AES-GCM", false, ["encrypt"]);
const iv = rand(12);
const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, pageKey, enc.encode(content)));

const salt = rand(16);
const keys = [];
for (const u of users) {
  if (typeof u.username !== "string" || typeof u.password !== "string") throw new Error("each user needs a username and password string");
  const name = normUser(u.username);
  const pass = normPass(u.password);
  if (!/^[a-z0-9._-]{2,32}$/.test(name)) throw new Error(`bad username: ${JSON.stringify(u.username)}`);
  // 12+ random characters from a 32-letter alphabet = 60+ bits; anything weaker is refused.
  if (!PASS_ALPHABET.test(pass)) throw new Error(`password for ${name} must be 12+ random characters from ${PASS_ALPHABET.source}`);
  const counts = {};
  for (const ch of pass) counts[ch] = (counts[ch] || 0) + 1;
  if (Object.keys(counts).length < 7 || Math.max(...Object.values(counts)) > 3)
    throw new Error(`password for ${name} looks hand-made or repetitive; use a random one`);
  const base = await subtle.importKey("raw", enc.encode(name + "\n" + pass), "PBKDF2", false, ["deriveKey"]);
  const kek = await subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base,
    { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const kiv = rand(12);
  const kct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv: kiv }, kek, pageKeyRaw));
  keys.push({ iv: b64(kiv), ct: b64(kct) });
}
// Shuffle so the order does not reveal which entry belongs to whom.
for (let i = keys.length - 1; i > 0; i--) {
  const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
  [keys[i], keys[j]] = [keys[j], keys[i]];
}
const id = Buffer.from(rand(6)).toString("hex");
const data = JSON.stringify({ v: 1, id, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct), keys });
if (data.includes("{{") || data.includes("</")) throw new Error("payload contains a template or closing-tag sequence");

const page = `<!--meta
title: Team Login | The Pointe at Kirby Gate
description: Staff sign-in for The Pointe at Kirby Gate.
path: /team/
body_attr: data-page="team"
sitemap: no
robots: noindex, nofollow
analytics: no
-->
<!-- Generated by scripts/team-gate.mjs. Do not edit by hand: the staff content is encrypted below. -->
<section class="section">
  <div class="container narrow" style="padding:3rem 1.25rem;max-width:640px">
    <div id="kg-gate">
      <p class="eyebrow center">Kirby Gate Team</p>
      <h1 class="center">Team Login</h1>
      <p class="center" style="margin-top:0.75rem">For Kirby Gate staff only. Sign in with the username and password ownership gave you.</p>
      <form id="kg-gate-form" class="card" style="margin:1.75rem auto 0;max-width:440px" novalidate>
        <fieldset id="kg-gate-fields" disabled style="border:0;margin:0;padding:1.5rem">
          <div class="form-row">
            <label for="kg-user">Username</label>
            <input type="text" id="kg-user" name="username" required autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false">
          </div>
          <div class="form-row">
            <label for="kg-pass">Password</label>
            <input type="password" id="kg-pass" name="password" required autocomplete="current-password">
          </div>
          <div class="form-row">
            <label for="kg-remember" style="font-weight:normal;display:flex;align-items:center;gap:0.6rem;cursor:pointer"><input type="checkbox" id="kg-remember" checked style="width:1.35rem;height:1.35rem;margin:0;flex:none"> Keep me signed in on this phone or computer for 180 days (untick on a shared computer)</label>
          </div>
          <button type="submit" id="kg-submit" class="btn btn-primary btn-lg" style="width:100%">Sign in</button>
          <p id="kg-gate-msg" role="alert" aria-live="polite" style="margin:1rem 0 0;min-height:1.5em"></p>
        </fieldset>
      </form>
      <noscript><p class="center">This page needs JavaScript turned on.</p></noscript>
    </div>
    <div id="kg-team" hidden></div>
  </div>
</section>
<script type="application/json" id="kg-gate-data">${data}</script>
<script src="/assets/js/team-gate.js?v=${id}" defer></script>
`;
writeFileSync(new URL("../content/team.html", import.meta.url), page);
console.log(`wrote content/team.html (${users.length} users, payload ${data.length} bytes, id ${id})`);
