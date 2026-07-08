// IP audit — word-boundary scan for Blizzard proper nouns anywhere in `src/**` and
// `doc/**` (excluding `doc/research/**`, which are research appendices describing the
// source game). Source list: scripts/blocked-content-names.txt.
//
// An optional allowlist (scripts/ip-allowlist.txt) exempts legitimate collisions where a
// blocked term is a substring of an allowed phrase — e.g. the game title "Diablo II" (a
// meta-reference, not content), the generic archetype word "summoner", or an original
// skill name that happens to reuse a common word ("Sanctuary Wall"). A blocked match is
// suppressed only when it falls inside an allowlisted phrase occurrence.
//
// Windows-portable, pure Node. Exit 1 with file:line + term on any un-allowlisted match.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEXT_EXT = new Set([".md", ".html", ".ts", ".tsx", ".js", ".mjs", ".txt"]);

function parseList(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return [];
  }
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildMatchers(terms) {
  return terms.map((term) => ({
    term,
    re: new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRe(term)}(?![\\p{L}\\p{N}_])`, "giu"),
  }));
}

/** Ranges [start,end) covered by any allowlist phrase in `text`. */
export function allowRanges(text, allow) {
  const ranges = [];
  for (const phrase of allow) {
    const re = new RegExp(escapeRe(phrase), "giu");
    for (const m of text.matchAll(re)) ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}

function inRanges(idx, ranges) {
  for (const [s, e] of ranges) if (idx >= s && idx < e) return true;
  return false;
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === "\n") line += 1;
  return line;
}

/** Un-allowlisted blocklist hits in one file's text. */
export function scanText(relPath, text, matchers, allow) {
  const ranges = allowRanges(text, allow);
  const hits = [];
  for (const { term, re } of matchers) {
    for (const m of text.matchAll(re)) {
      if (inRanges(m.index, ranges)) continue;
      hits.push({ file: relPath, line: lineOf(text, m.index), term, text: m[0] });
    }
  }
  return hits;
}

function walk(dir, skip) {
  const files = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const name of entries) {
    const p = join(dir, name);
    if (skip?.(p)) continue;
    const st = statSync(p);
    if (st.isDirectory()) files.push(...walk(p, skip));
    else if (TEXT_EXT.has(p.slice(p.lastIndexOf(".")))) files.push(p);
  }
  return files;
}

function main() {
  const terms = parseList(join(ROOT, "scripts", "blocked-content-names.txt"));
  const allow = parseList(join(ROOT, "scripts", "ip-allowlist.txt"));
  const matchers = buildMatchers(terms);

  const researchDir = join(ROOT, "doc", "research") + sep;
  // doc/research/** describes the source game directly. naming-and-lore.md is the in-repo
  // IP-policy reference doc — its "IP enforcement checklist" enumerates banned names on
  // purpose (the shipping companion to scripts/blocked-content-names.txt), so it is exempt
  // for the same reason the blocklist file itself is not scanned.
  const ipPolicyDoc = join(ROOT, "doc", "04-content-bible", "naming-and-lore.md");
  const skip = (p) =>
    (p + sep).startsWith(researchDir) || p === ipPolicyDoc || p.includes(`${sep}node_modules${sep}`);

  const files = [...walk(join(ROOT, "src"), skip), ...walk(join(ROOT, "doc"), skip)];

  const hits = [];
  for (const f of files) {
    hits.push(
      ...scanText(relative(ROOT, f).split(sep).join("/"), readFileSync(f, "utf8"), matchers, allow),
    );
  }

  if (hits.length > 0) {
    console.error(`ip-audit: ${hits.length} blocked-name hit(s):`);
    for (const h of hits) console.error(`  ${h.file}:${h.line}  "${h.text}" (blocklist: ${h.term})`);
    process.exit(1);
  }
  console.log(
    `ip-audit: clean (${files.length} file(s), ${terms.length} blocked terms, ${allow.length} allowlist phrases).`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
