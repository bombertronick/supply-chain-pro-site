import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
let gn13 = s.unita.find((u) => /^GN 1\/3$/.test(u.simbolo));
if (!gn13) { gn13 = { id: "u-gn13", nome: "Teglia GN 1/3", simbolo: "GN 1/3" }; s.unita.push(gn13); }
const mag = s.magazzini.find((m) => m.tipo.startsWith("linea"));
mag.articoli = mag.articoli.slice(0, 8).map((a) => ({ ...a, uomId: gn13.id, qty: 0, par: 2 }));
s.profili = [{ id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: mag.sedeId, colore: "#E8A13C",
  magazziniIds: [mag.id], pinHash: hash("2222") }];
const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
}, JSON.stringify(s));
const p = await ctx.newPage();
await p.goto(URL); await p.waitForTimeout(1500);
await p.getByText("Op", { exact: true }).first().click(); await p.waitForTimeout(300);
for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(150); }
await p.waitForTimeout(1500);
await p.locator("nav").getByText("Conteggi", { exact: true }).first().click(); await p.waitForTimeout(900);
await p.getByRole("button", { name: "Conta ora" }).first().click(); await p.waitForTimeout(1200);
/* la tacca del telefono, che in headless non esiste */
await p.evaluate(() => { for (const el of document.querySelectorAll("*")) { const st = el.getAttribute("style");
  if (st && st.includes("env(safe-area-inset-bottom)")) el.setAttribute("style", st.replace(/env\(safe-area-inset-bottom\)/g, "34px")); } });
await p.waitForTimeout(400);
await p.screenshot({ path: process.argv[2] });
await b.close();
