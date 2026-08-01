import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });

async function apri(stato) {
  const p = await b.newPage({ viewport: { width: 440, height: 880 }, isMobile: true, hasTouch: true });
  const errs = [];
  p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(stato));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1300);
  const nav = p.getByText("Plancia", { exact: true });
  for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
  await p.waitForTimeout(700);
  return { p, errs };
}

/* ===== DIFETTO 1: nessun magazzino -> la vista Caselle non deve crollare ===== */
{
  const st = JSON.parse(JSON.stringify(base));
  st.magazzini = [];               // caso limite: rete senza magazzini
  const { p, errs } = await apri(st);
  await p.getByRole("button", { name: "Caselle", exact: true }).click(); await p.waitForTimeout(700);
  const vuotoOk = await p.getByText(/Nessun magazzino/).count() > 0;
  await p.getByRole("button", { name: "Settimana", exact: true }).click(); await p.waitForTimeout(500);
  await p.getByRole("button", { name: "Rete", exact: true }).click(); await p.waitForTimeout(500);
  const crash = errs.filter((e) => /hook|Rendered/i.test(e));
  console.log(`[1] rete senza magazzini: messaggio ${vuotoOk ? "PASS" : "CHECK"} | errori hook: ${crash.length === 0 ? "PASS" : "FALLITO " + crash[0]}`);
  console.log(`    errori totali: ${errs.length}`, errs.slice(0, 2));
  await p.close();
  if (crash.length || !vuotoOk) process.exitCode = 1;
}

await b.close();