// Bundle-size gate — total gzipped JS in dist/ must stay ≤ 1.2 MB (performance-budget.md).
// Run after `npm run build`. Windows-portable, pure Node.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const LIMIT = Math.round(1.2 * 1024 * 1024); // 1.2 MiB

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".js") || p.endsWith(".mjs")) out.push(p);
  }
  return out;
}

if (!existsSync(DIST)) {
  console.error("check-size: dist/ not found — run `npm run build` first.");
  process.exit(1);
}

let total = 0;
const rows = [];
for (const f of walk(DIST)) {
  const gz = gzipSync(readFileSync(f)).length;
  total += gz;
  rows.push({ file: relative(ROOT, f).split(sep).join("/"), gz });
}

rows.sort((a, b) => b.gz - a.gz);
for (const r of rows) console.log(`  ${(r.gz / 1024).toFixed(1).padStart(8)} KiB  ${r.file}`);
const kib = (total / 1024).toFixed(1);
const limitKib = (LIMIT / 1024).toFixed(1);
if (total > LIMIT) {
  console.error(`check-size: FAIL — ${kib} KiB gzipped JS > ${limitKib} KiB budget.`);
  process.exit(1);
}
console.log(`check-size: OK — ${kib} KiB gzipped JS ≤ ${limitKib} KiB budget.`);
