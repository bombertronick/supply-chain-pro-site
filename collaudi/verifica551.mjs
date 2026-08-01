/* L'app di produzione contro i dati di produzione, così come stanno adesso. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const st = JSON.parse(readFileSync("stato-vero-conv.json", "utf8"));
const s = { ...st, codici: [], accessi: [],
  profili: [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }] };
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
}, JSON.stringify(s));
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error" && !/ERR_CONNECTION/.test(m.text())) errs.push("console: " + m.text()); });
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1600);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
await p.waitForTimeout(2000);
const vai = (d) => vaiA(p, d, 1400);

ok(!/Errore/.test(await p.locator("body").innerText()), "l'app apre i dati veri senza lamentarsi");

await vai("Plancia"); await p.waitForTimeout(1200);
const tPl = await p.locator("body").innerText();
ok(!/conversione mancante/.test(tPl), "sparito l'allarme rosso «conversione mancante»");
ok(/conversione stimata/.test(tPl), "e al suo posto c'è l'avviso ambra «conversione stimata»");
await p.screenshot({ path: "v551-plancia.png", fullPage: true });

await vai("Catalogo");
await p.getByText(/^Prodotti · /).first().click(); await p.waitForTimeout(900);
const t = await p.locator("body").innerText();
const m = /Conversioni · (\d+)/.exec(t);
ok(m && +m[1] === 34, `il tasto «Conversioni» conta le 34 da pesare (${m?.[1]})`);
await p.screenshot({ path: "v551-catalogo.png", fullPage: true });

/* e i conti ora tornano: una casella in kg su un prodotto a teglie */
await vai("Magazzini");
const mag = s.magazzini.find((x) => x.nome === "Magazzino centrale");
await p.getByText(mag.nome, { exact: true }).first().click(); await p.waitForTimeout(1500);
const g = p.locator('button[aria-expanded="false"]');
if (await g.count()) { await g.first().click(); await p.waitForTimeout(800); }
const mozzi = await p.evaluate(() => [...document.querySelectorAll(".truncate")]
  .filter((e) => !e.children.length && e.scrollWidth > e.clientWidth + 1)
  .map((e) => e.textContent.trim()));
ok(mozzi.length === 0, `nessun nome tagliato nel magazzino vero (${mozzi.length})`);
await p.screenshot({ path: "v551-magazzino.png", fullPage: true });

ok(errs.length === 0, "nessun errore JS sui dati veri" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
