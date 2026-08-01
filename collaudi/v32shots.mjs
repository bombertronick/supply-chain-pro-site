import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
/* topologia reale: lab centrale + 2 sedi (fm, rm) */
st.sedi = [
  { id: "s-lab", nome: "Portuense", tipo: "laboratorio" },
  { id: "s-fm", nome: "Fm", tipo: "operatore", labSedeId: "s-lab" },
  { id: "s-rm", nome: "Rm", tipo: "operatore", labSedeId: "s-lab" },
];
const uom = st.unita[0].id;
/* prendo prodotti di categorie diverse, come nei magazzini veri */
const perCat = {};
for (const pr of st.prodotti) (perCat[pr.categoriaId || "_"] = perCat[pr.categoriaId || "_"] || []).push(pr.id);
const pid = [];
for (let k = 0; k < 8; k++) for (const c in perCat) if (perCat[c][k]) pid.push(perCat[c][k]);
const arti = (n) => pid.slice(0, n).map((id, i) => ({ prodottoId: id, uomId: uom, par: 2 + (i % 4), qty: (i % 3) + (i % 5 === 0 ? 0.5 : 0) }));
st.magazzini = [
  { id: "m-lab", nome: "Magazzino centrale", sedeId: "s-lab", tipo: "laboratorio", articoli: arti(20) },
  { id: "m-secco-fm", nome: "Secco fm", sedeId: "s-fm", tipo: "retro", articoli: arti(16) },
  { id: "m-bev-fm", nome: "Bevande fm", sedeId: "s-fm", tipo: "retro", articoli: arti(8) },
  { id: "m-lin-fm", nome: "Linea fm", sedeId: "s-fm", tipo: "linea-lab", articoli: arti(11) },
  { id: "m-linsec-fm", nome: "Linea secco fm", sedeId: "s-fm", tipo: "linea-retro", rifMagazzinoId: "m-secco-fm", articoli: arti(16) },
  { id: "m-linfri-fm", nome: "Linea fritti fm", sedeId: "s-fm", tipo: "linea-lab", articoli: arti(8) },
  { id: "m-secco-rm", nome: "Secco rm", sedeId: "s-rm", tipo: "retro", articoli: arti(16) },
  { id: "m-bev-rm", nome: "Bevande rm", sedeId: "s-rm", tipo: "retro", articoli: arti(8) },
  { id: "m-lin-rm", nome: "Linea rm", sedeId: "s-rm", tipo: "linea-lab", articoli: arti(11) },
  { id: "m-linsec-rm", nome: "Linea secco rm", sedeId: "s-rm", tipo: "linea-retro", rifMagazzinoId: "m-secco-rm", articoli: arti(16) },
  { id: "m-linfri-rm", nome: "Linea fritti rm", sedeId: "s-rm", tipo: "linea-lab", articoli: arti(8) },
];
/* incoerenze VERE da far trovare ai controlli */
st.prodotti[0].soloInteri = true;                              // interi a metà (qty .5)
st.magazzini[1].articoli[3].par = 0;                           // senza soglia
st.magazzini[1].articoli[5].parGiorni = { "1":3,"2":3,"3":3,"4":3,"5":3,"6":3,"0":3 };
st.magazzini[1].articoli[5].par = 3;                           // per-giorno inutile
st.magazzini[2].articoli[1].parGiorni = { "1":2,"2":2,"3":4,"4":2,"5":6,"6":8,"0":8 };
st.profili = st.profili.map((p) => (p.ruolo === "admin" ? p : { ...p, sedeId: "s-fm" }));

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 1000 }, isMobile: true, hasTouch: true });
const errs = [];
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1600);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1400);
const nav = p.getByText("Plancia", { exact: true });
for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(900);
await p.screenshot({ path: "v32-1-rete.png", fullPage: true });

// apro un controllo
const ctrl = p.getByRole("button", { name: /interi a metà/ });
if (await ctrl.count()) { await ctrl.first().click(); await p.waitForTimeout(600); await p.screenshot({ path: "v32-2-controllo.png", fullPage: true }); }

// STRUTTURA
await p.getByRole("button", { name: "Struttura", exact: true }).click(); await p.waitForTimeout(700);
await p.screenshot({ path: "v32-3-struttura.png", fullPage: true });
await p.getByText("Fm", { exact: true }).first().click().catch(async () => { await p.getByText("Fm", { exact: false }).first().click(); });
await p.waitForTimeout(700);
await p.screenshot({ path: "v32-4-struttura-aperta.png", fullPage: true });

// SETTIMANA
await p.getByRole("button", { name: "Settimana", exact: true }).click(); await p.waitForTimeout(700);
await p.locator("select").first().selectOption("m-secco-fm").catch(() => {});
await p.waitForTimeout(800);
await p.screenshot({ path: "v32-5-settimana.png", fullPage: true });
await p.getByRole("button", { name: /Metti a fuoco venerdì/ }).click(); await p.waitForTimeout(700);
await p.screenshot({ path: "v32-6-settimana-fuoco.png", fullPage: true });

// CASELLE
await p.getByRole("button", { name: "Caselle", exact: true }).click(); await p.waitForTimeout(800);
await p.screenshot({ path: "v32-7-caselle.png", fullPage: true });
console.log("errs", errs.length, errs.slice(0, 5));
await b.close();
