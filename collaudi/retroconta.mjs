/* Sonda: cosa fa il conteggio di linea se il magazzino assegnato NON è una
   linea ma un retro? calcolaEsito manda tutto quello che non è «linea-lab»
   sulla strada del retro, e quella strada cerca «un retro nella stessa sede»:
   potrebbe trovare se stesso e prelevare da sé. Prima di scriverlo nella
   roadmap voglio vederlo, non dedurlo. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = s.sedi.filter((x) => x.tipo === "operatore")[0];
const retro = s.magazzini.find((m) => m.tipo === "retro");
const [PA] = s.prodotti;
retro.sedeId = FM.id;
retro.articoli = [{ prodottoId: PA.id, uomId: PA.uomBase, qty: 10, par: 8 }];
s.magazzini = [retro];
s.richieste = []; s.ordini = []; s.movimenti = []; s.log = []; s.codici = []; s.accessi = [];
s.profili = [{ id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
  magazziniIds: [retro.id], pinHash: hash("2222") }];

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 820 }, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
    async delete(k) { localStorage.removeItem("db:" + k); return true; } };
}, JSON.stringify(s));
const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1600);
await p.getByText("Op", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "2222") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(150); }
await p.waitForTimeout(1600);
await vaiA(p, "Conteggi");
await p.getByRole("button", { name: /Conta ora/ }).first().click(); await p.waitForTimeout(1000);
/* conto 2 dove ne sono previsti 8: manca 6 */
await p.locator('input[aria-label^="Conteggio"]').first().fill("2"); await p.waitForTimeout(300);
await p.getByRole("button", { name: /Verifica e conferma/ }).click(); await p.waitForTimeout(1100);
console.log("── riepilogo ──");
console.log((await p.locator(".fixed.inset-0.z-50").last().innerText()).replace(/\n+/g, " | "));
await p.getByRole("button", { name: /Conferma tutto/ }).click(); await p.waitForTimeout(2000);
const d = await p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
console.log("\n── dopo ──");
console.log("giacenza retro:", d.magazzini[0].articoli[0].qty, "(contato 2, previsto 8)");
console.log("movimenti:", d.movimenti.map((m) => `${m.causale} ${m.delta} → ${m.dopo}${m.rif ? " [" + m.rif + "]" : ""}`).join(" | "));
console.log("ordini:", d.ordini.length, d.ordini.map((o) => `${o.qty} ${o.uomId}`).join(" | "));
console.log("errori JS:", errs.length ? errs : "nessuno");
await p.screenshot({ path: "sonda-retro.png", fullPage: true });
await b.close();
