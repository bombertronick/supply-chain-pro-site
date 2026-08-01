import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
// pick two categories that each have >=1 product
const cnt = {}; for (const p of st.prodotti) cnt[p.categoriaId] = (cnt[p.categoriaId]||0)+1;
const cats = st.categorie.filter((c) => cnt[c.id] > 0).slice(0, 2);
const n1 = cnt[cats[0].id], n2 = cnt[cats[1].id];
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
const errs = []; p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1100);
/* Da gen-5.52 «Catalogo» non e' piu' in barra ma sotto «Gestione». Cercarlo
   a mano qui voleva dire riscrivere quella conoscenza in ogni file: quando la
   barra e' cambiata, quindici collaudi sono diventati ciechi insieme. Adesso
   la strada la sa solo navtest.mjs, e si aggiusta in un posto solo. */
await vaiA(p, "Catalogo");
// prodotti tab
await p.getByText(/^Prodotti · /).click(); await p.waitForTimeout(400);
await p.getByRole("button", { name: /Modifica in blocco/ }).click(); await p.waitForTimeout(500);

const counter = () => p.getByText(/\d+ selezionati/).first().innerText();
// select category 1 -> Tutti
await p.getByRole("button", { name: cats[0].nome, exact: true }).click(); await p.waitForTimeout(250);
await p.getByRole("button", { name: /^Tutti \(/ }).click(); await p.waitForTimeout(250);
const after1 = await counter();
// switch to category 2 -> Tutti (should ADD, not replace)
await p.getByRole("button", { name: cats[1].nome, exact: true }).click(); await p.waitForTimeout(250);
await p.getByRole("button", { name: /^Tutti \(/ }).click(); await p.waitForTimeout(250);
const after2 = await counter();
const got1 = parseInt(after1), got2 = parseInt(after2);
console.log(`cat "${cats[0].nome}"(${n1}) -> ${got1} | +cat "${cats[1].nome}"(${n2}) -> ${got2} (expect ${n1+n2})`);
const accPass = got1 === n1 && got2 === n1 + n2;
// now "Nessuno" while viewing cat2 should remove only cat2 -> back to n1
await p.getByRole("button", { name: /^Nessuno$/ }).click(); await p.waitForTimeout(250);
const after3 = await counter(); const got3 = parseInt(after3);
console.log(`Nessuno on cat2 -> ${got3} (expect ${n1})`);
const remPass = got3 === n1;
console.log("errs", errs.length, errs.slice(0,3));
console.log("RESULT:", accPass && remPass && errs.length === 0 ? "PASS" : "CHECK");
await b.close();
