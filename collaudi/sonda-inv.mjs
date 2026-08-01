import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const UPZ = base.unita.find((u) => u.simbolo === "pz").id;
const [PA] = base.prodotti;
const s = JSON.parse(JSON.stringify(base));
s.prodotti = [{ ...PA, uomBase: UPZ, fornitoreId: s.fornitori[0].id, categoriaId: s.categorie[0].id }];
s.sedi = [{ id: "sede-fm", nome: "Fiumicino", tipo: "operatore" }];
s.magazzini = [{ id: "mag-fm", sedeId: "sede-fm", nome: "Secco fm", tipo: "retro",
  articoli: [{ prodottoId: PA.id, uomId: UPZ, qty: 5, par: 8 }] }];
s.ordini = []; s.richieste = []; s.movimenti = []; s.log = []; s.codici = []; s.accessi = [];
s.profili = [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
s.invCorso = { "sede-fm": { id: "inv-1", t: Date.now(), chi: "Gigi", sedeId: "sede-fm",
  magIds: ["mag-fm"], valori: {}, chiusi: ["mag-fm"] } };

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k){const v=localStorage.getItem("db:"+k);return v==null?null:{value:v}},
    async set(k,v){localStorage.setItem("db:"+k,v);return true}, async delete(k){localStorage.removeItem("db:"+k);return true} };
}, JSON.stringify(s));
const p = await ctx.newPage();
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1600);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
await p.waitForTimeout(1600);
await vaiA(p, "Magazzini");
const st = await p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
console.log("invCorso nel db:", JSON.stringify(st.invCorso));
console.log("stato.inventario (vecchio campo):", JSON.stringify(st.inventario));
const tasti = await p.getByRole("button", { name: /Inventario/ }).allInnerTexts();
console.log("tasti che contengono «Inventario»:", JSON.stringify(tasti));
await b.close();
