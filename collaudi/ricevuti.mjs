/* gen-5.62: in «Ordini → Ricevuti» il numero grande e' quello ARRIVATO.
   La prova sta tutta in una consegna parziale: ordinate 5, arrivate 2. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const s = JSON.parse(JSON.stringify(base));
const UPZ = s.unita.find((u) => u.simbolo === "pz").id;
const [PA] = s.prodotti;
const FM = s.sedi.filter((x) => x.tipo === "operatore")[0];
const F1 = s.fornitori[0];
s.prodotti = [{ ...PA, uomBase: UPZ, fornitoreId: F1.id, categoriaId: s.categorie[0].id }];
s.magazzini = [{ id: "mag-retro", sedeId: FM.id, nome: "Secco fm", tipo: "retro",
  articoli: [{ prodottoId: PA.id, uomId: UPZ, qty: 1, par: 20 }] }];
s.ordini = [{ id: "o-1", t: Date.now(), tipo: "diretto", sedeId: FM.id, prodottoId: PA.id,
  fornitoreId: F1.id, qty: 5, uomId: UPZ, stato: "ordinato", tOrdine: Date.now(), ordinatoDa: "Admin" }];
s.richieste = []; s.movimenti = []; s.log = []; s.codici = []; s.accessi = [];
s.profili = [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = {
    async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
    async delete(k) { localStorage.removeItem("db:" + k); return true; },
  };
}, JSON.stringify(s));
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1600);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
await p.waitForTimeout(1600);
await vaiA(p, "Ordini");

/* 1. la scheda «Ordinati» deve continuare a dire 5: li' l'ordinato e' giusto */
await p.getByRole("button", { name: /Ordinati · 1/ }).click(); await p.waitForTimeout(800);
ok(/5 pz/.test((await p.locator("body").innerText()).replace(/\s+/g, " ")),
  "nella scheda «Ordinati» il numero resta quello ordinato (5 pz)");

/* 2. arriva meno del previsto: 2 su 5 */
await p.getByRole("button", { name: "Registra la merce arrivata" }).click(); await p.waitForTimeout(900);
await p.getByRole("textbox").last().fill("2"); await p.waitForTimeout(300);
await p.getByRole("button", { name: /^Conferma|Registra|Salva/ }).last().click(); await p.waitForTimeout(1600);

const dati = await p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const ric = (dati.ordini || []).find((o) => o.id === "o-1");
const residuo = (dati.ordini || []).find((o) => o.stato === "da-ordinare");
ok(ric?.qtyRicevuta === 2 && ric?.qty === 5,
  "nei dati restano tutti e due i numeri: ordinate 5, arrivate 2");
ok(residuo?.qty === 3, "e le 3 che mancano tornano fra quelle da ordinare");
ok(dati.magazzini[0].articoli[0].qty === 3, "il magazzino si carica di 2 (da 1 a 3), non di 5");

/* 3. la scheda «Ricevuti»: il numero grande e' quello arrivato */
await p.getByRole("button", { name: /Ricevuti · 1/ }).click(); await p.waitForTimeout(900);
const t = (await p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/2 pz/.test(t), "nella scheda «Ricevuti» il numero grande e' 2 pz: quello arrivato");
ok(/ne erano stati ordinati 5 pz/.test(t), "e sotto c'e' scritto che ne erano stati ordinati 5");
ok(/3 sono tornati fra quelli da ordinare/.test(t), "e che 3 sono tornati da ordinare");
await p.waitForTimeout(4200); /* il toast copre il numero: lo lascio sparire */
await p.screenshot({ path: "g562-ricevuti.png", fullPage: true });
await ctx.close();

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 5)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
