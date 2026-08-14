/**
 * Opens the demo in a throwaway Chrome that has html-in-canvas turned on,
 * using its own profile directory.
 *
 * Why not just flip chrome://flags in your everyday browser: that flag is a
 * global renderer switch, so *every* site you visit gets the experimental
 * paint path, not just localhost. This keeps the capability scoped to a
 * browser you only open to look at shaders.
 *
 *   npm run lab            # http://localhost:5173
 *   npm run lab -- <url>
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROFILE = resolve(ROOT, ".lab-profile");
const url = process.argv[2] ?? "http://localhost:5173";

const CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

const chrome = CANDIDATES.find(existsSync);
if (!chrome) {
  console.error("Could not find Chrome. Pass a path via CHROME_PATH.");
  process.exit(1);
}

const child = spawn(
  process.env.CHROME_PATH || chrome,
  [
    // The one that matters. Verified present in Chrome 151 as blink feature
    // `CanvasDrawElement` / flag id `canvas-draw-element`.
    "--enable-blink-features=CanvasDrawElement",
    `--user-data-dir=${PROFILE}`,
    "--no-first-run",
    "--no-default-browser-check",
    url,
  ],
  { detached: true, stdio: "ignore" },
);
child.unref();

console.log(`\n  Lab browser launched — html-in-canvas ON\n`);
console.log(`  url      ${url}`);
console.log(`  profile  ${PROFILE}  (isolated; delete it to reset)\n`);
console.log(`  Your normal Chrome is untouched.\n`);
