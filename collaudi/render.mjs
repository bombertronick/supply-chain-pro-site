import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";

const CANDIDATES = [
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
];
const executablePath = CANDIDATES.find((p) => existsSync(p));

// args: [stateFile] [outPrefix] [pin]
const stateFile = process.argv[2] || "seed-state.json";
const outPrefix = process.argv[3] || "shot";
const pin = process.argv[4] || "1234";
const state = readFileSync(stateFile, "utf8");

const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 430, height: 920 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + (e.stack || e.message)));

await page.addInitScript((stateStr) => {
  const store = new Map();
  store.set("scp:stato:v1", stateStr);
  window.storage = {
    async get(k) { return store.has(k) ? { value: store.get(k) } : null; },
    async set(k, v) { store.set(k, v); return true; },
    async delete(k) { store.delete(k); return true; },
  };
  window.__store = store;
}, state);

await page.goto("file://" + path.resolve("index.html"), { waitUntil: "networkidle" }).catch(() => {});
await page.waitForTimeout(1800);
await page.screenshot({ path: outPrefix + "-01-login.png", fullPage: true });

// try to log in: click a profile tile then type the PIN
try {
  await page.getByText("Admin", { exact: false }).first().click({ timeout: 3000 });
  await page.waitForTimeout(500);
  for (const d of String(pin).split("")) {
    await page.getByRole("button", { name: d, exact: true }).first().click({ timeout: 1500 }).catch(() => {});
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: outPrefix + "-02-home.png", fullPage: true });
} catch (e) {
  console.log("login step skipped:", e.message);
}

console.log("=== CONSOLE ERRORS:", errors.length, "===");
errors.slice(0, 30).forEach((e) => console.log("  •", e.split("\n")[0]));
await browser.close();
