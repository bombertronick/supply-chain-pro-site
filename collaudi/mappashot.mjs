import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const topo = JSON.parse(readFileSync("topologia-vera.json", "utf8"));
const s = { ...base, sedi: topo.sedi, magazzini: topo.magazzini };
/* qualche articolo per riempire le barrette, altrimenti la mappa è tutta vuota */
const pr = base.prodotti.slice(0, 12);
s.magazzini.forEach((m, k) => {
  m.articoli = pr.slice(0, 5 + (k % 5)).map((p, i) => ({
    prodottoId: p.id, uomId: p.uomBase, par: 4, qty: (i + k) % 5 }));
});
s.profili = [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 430, height: 1500 }, deviceScaleFactor: 2 });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
}, JSON.stringify(s));
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await p.goto(URL); await p.waitForTimeout(1600);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
await p.waitForTimeout(1600);
await p.locator("nav").getByText("Plancia", { exact: true }).first().click(); await p.waitForTimeout(1600);
await p.screenshot({ path: process.argv[2] || "mappa.png", fullPage: true });
await b.close();
console.log("fatto");
