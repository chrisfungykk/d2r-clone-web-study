// Determinism gate — the authoritative purity + boundary enforcer.
//
// 1. Purity: no non-deterministic APIs may appear in `src/sim/**` or `src/world_api.ts`
//    (Math.random, transcendental Math.*, Date, performance, crypto, timers, DOM globals,
//    or `three` imports). Table-based trig lives in src/sim/fixedmath.ts as literal
//    constants; Math.sqrt is allowed (IEEE-exact across engines).
// 2. Boundary: `src/render`, `src/ui`, `src/game` may import `src/world_api.ts` but NEVER
//    reach into `src/sim/**`.
//
// Windows-portable, pure Node (no ripgrep, no shell). Exit 1 with file:line on any violation.
// Exported helpers are unit-tested (tests/unit/sim-purity.test.ts) against a fixture.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Blank out comments while preserving newlines (so line numbers stay accurate). */
export function stripComments(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  let state = "code";
  while (i < n) {
    const c = src[i];
    const d = i + 1 < n ? src[i + 1] : "";
    if (state === "code") {
      if (c === "/" && d === "/") {
        state = "line";
        out += "  ";
        i += 2;
      } else if (c === "/" && d === "*") {
        state = "block";
        out += "  ";
        i += 2;
      } else if (c === "'" || c === '"' || c === "`") {
        state = c;
        out += c;
        i += 1;
      } else {
        out += c;
        i += 1;
      }
    } else if (state === "line") {
      if (c === "\n") {
        state = "code";
        out += c;
      } else {
        out += c === "\t" ? "\t" : " ";
      }
      i += 1;
    } else if (state === "block") {
      if (c === "*" && d === "/") {
        state = "code";
        out += "  ";
        i += 2;
      } else {
        out += c === "\n" ? "\n" : " ";
        i += 1;
      }
    } else {
      // inside a string/template literal — keep content, honor escapes
      out += c;
      if (c === "\\") {
        out += d;
        i += 2;
      } else {
        if (c === state) state = "code";
        i += 1;
      }
    }
  }
  return out;
}

const BANNED = [
  { rule: "Math.random", re: /\bMath\.random\b/g },
  {
    rule: "transcendental Math.*",
    re: /\bMath\.(?:atan2|asinh|acosh|atanh|asin|acos|atan|sinh|cosh|tanh|sin|cos|tan|pow|expm1|exp|log10|log2|log1p|log|cbrt|hypot)\b/g,
  },
  { rule: "Date", re: /\bDate\b/g },
  { rule: "performance", re: /\bperformance\b/g },
  { rule: "crypto", re: /\bcrypto\b/g },
  { rule: "setTimeout", re: /\bsetTimeout\b/g },
  { rule: "setInterval", re: /\bsetInterval\b/g },
  { rule: "queueMicrotask", re: /\bqueueMicrotask\b/g },
  { rule: "requestAnimationFrame", re: /\brequestAnimationFrame\b/g },
  { rule: "window", re: /\bwindow\b/g },
  { rule: "document", re: /\bdocument\b/g },
  {
    rule: "import 'three'",
    re: /(?:from\s*['"]three['"/]|require\(\s*['"]three|import\s*['"]three['"/])/g,
  },
];

function lineOf(src, index) {
  let line = 1;
  for (let i = 0; i < index && i < src.length; i++) if (src[i] === "\n") line += 1;
  return line;
}

/** Purity violations for a single sim-side source. */
export function checkPurity(relPath, rawSrc) {
  const src = stripComments(rawSrc);
  const out = [];
  for (const { rule, re } of BANNED) {
    for (const m of src.matchAll(re)) {
      out.push({ file: relPath, line: lineOf(src, m.index), rule, text: m[0] });
    }
  }
  return out;
}

const IMPORT_RES = [
  /\bimport\b[^'"();]*?['"]([^'"]+)['"]/g,
  /\bexport\b[^'"();]*?\bfrom\b\s*['"]([^'"]+)['"]/g,
  /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];

/** Extract every import/export/require/dynamic-import specifier from a source. */
export function importSpecifiers(rawSrc) {
  const src = stripComments(rawSrc);
  const specs = [];
  for (const re of IMPORT_RES) {
    for (const m of src.matchAll(re)) specs.push({ spec: m[1], line: lineOf(src, m.index) });
  }
  return specs;
}

const SIM_DIR = join(ROOT, "src", "sim") + sep;
const WORLD_API = join(ROOT, "src", "world_api.ts");

/** True if a specifier from `absFromFile` reaches into src/sim (world_api.ts excepted). */
export function isSimImport(spec, absFromFile) {
  if (!spec.startsWith(".")) return false;
  let target = resolve(dirname(absFromFile), spec);
  if (target === WORLD_API || target === WORLD_API.replace(/\.ts$/, "")) return false;
  if (!target.endsWith(".ts")) target += ".ts";
  if (target === WORLD_API) return false;
  return (target + (target.endsWith(sep) ? "" : "")).startsWith(SIM_DIR);
}

/** Boundary violations for a single client-side (render/ui/game) source. */
export function checkBoundary(relPath, rawSrc) {
  const abs = join(ROOT, relPath);
  const out = [];
  for (const { spec, line } of importSpecifiers(rawSrc)) {
    if (isSimImport(spec, abs)) {
      out.push({
        file: relPath,
        line,
        rule: "boundary: render/ui/game may not import src/sim",
        text: spec,
      });
    }
  }
  return out;
}

function walk(dir) {
  const files = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files.push(...walk(p));
    else if (p.endsWith(".ts")) files.push(p);
  }
  return files;
}

function main() {
  const violations = [];

  // Purity: src/sim/** + world_api.ts
  const simFiles = walk(join(ROOT, "src", "sim"));
  const worldApi = join(ROOT, "src", "world_api.ts");
  try {
    statSync(worldApi);
    simFiles.push(worldApi);
  } catch {
    /* world_api not created yet */
  }
  for (const f of simFiles) {
    violations.push(...checkPurity(relative(ROOT, f).split(sep).join("/"), readFileSync(f, "utf8")));
  }

  // Boundary: render/ui/game may not import src/sim
  for (const d of ["render", "ui", "game"]) {
    for (const f of walk(join(ROOT, "src", d))) {
      violations.push(...checkBoundary(relative(ROOT, f).split(sep).join("/"), readFileSync(f, "utf8")));
    }
  }

  if (violations.length > 0) {
    console.error(`sim-purity: ${violations.length} violation(s):`);
    for (const v of violations) console.error(`  ${v.file}:${v.line}  [${v.rule}]  ${v.text}`);
    process.exit(1);
  }
  console.log(`sim-purity: clean (${simFiles.length} sim file(s) scanned).`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
