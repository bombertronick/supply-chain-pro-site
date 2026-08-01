import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));

/* ===== ricostruisco la topologia reale: lab centrale + 2 sedi (fm, rm) ===== */
st.sedi = [
  { id: "s-lab", nome: "laboratorio", tipo: "laboratorio" },
  { id: "s-fm", nome: "fm", tipo: "operatore", labSedeId: "s-lab" },
  { id: "s-rm", nome: "rm", tipo: "operatore", labSedeId: "s-lab" },
];
const uom = st.unita[0].id;
const pid = st.prodotti.slice(0, 20).map((p) => p.id);
const arti = (n) => pid.slice(0, n).map((id, i) => ({ prodottoId: id, uomId: uom, par: 2 + (i % 4), qty: i % 2 }));
st.magazzini = [
  { id: "m-lab", nome: "Magazzino centrale", sedeId: "s-lab", tipo: "laboratorio", articoli: arti(18) },
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
st.profili = st.profili.map((p) => (p.ruolo === "admin" ? p : { ...p, sedeId: "s-fm" }));

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 900 }, isMobile: true, hasTouch: true });
const errs = [];
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1400);
const nav = p.getByText("Plancia", { exact: true });
for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(900);

/* 1. le bande delle sedi ci sono e i nomi non sono piu troncati in modo ambiguo */
const testi = await p.evaluate(() => [...document.querySelectorAll('svg[aria-label^="Mappa della rete"] text')].map((t) => t.textContent));
const bandeOk = testi.includes("FM") && testi.includes("RM") && testi.includes("LABORATORIO") === false;
const bandeSedi = testi.filter((t) => t === "FM" || t === "RM").length;
const troncatiAmbigui = testi.filter((t) => /…$/.test(t));
console.log(`[1] bande per sede: ${bandeSedi} (fm+rm) ${bandeSedi === 2 ? "PASS" : "CHECK"} | nomi troncati: ${troncatiAmbigui.length} ${troncatiAmbigui.length === 0 ? "PASS" : "CHECK " + troncatiAmbigui.join("|")}`);
// i due "Linea fritti" devono essere distinguibili
const frittiFm = testi.some((t) => t === "fritti fm") || testi.join(" ").includes("fritti fm");
const frittiRm = testi.some((t) => t === "fritti rm") || testi.join(" ").includes("fritti rm");
console.log(`[2] i due "Linea fritti" sono distinguibili: fm ${frittiFm ? "SI" : "NO"}, rm ${frittiRm ? "SI" : "NO"}`, frittiFm && frittiRm ? "PASS" : "CHECK");
await p.screenshot({ path: "r-1-rete-sedi.png" });

/* 3. frecce di direzione */
const frecce = await p.evaluate(() => [...document.querySelectorAll('svg[aria-label^="Mappa della rete"] path')].filter((e) => (e.getAttribute("d") || "").startsWith("M-4 -3.2")).length);
console.log(`[3] punte di freccia sui collegamenti: ${frecce}`, frecce >= 8 ? "PASS" : "CHECK");

/* 4. tocco il laboratorio: si accende il percorso, il resto si spegne */
await p.evaluate(() => {
  const t = [...document.querySelectorAll('svg[aria-label^="Mappa della rete"] text')].find((e) => e.textContent === "Magazzino");
  if (t) t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await p.waitForTimeout(700);
const scheda = await p.getByText("Magazzino centrale", { exact: true }).count() > 0;
const rifornisce = await p.getByText(/Rifornisce/).count() > 0;
const formiche = await p.locator(".sc-formiche").count();
const spenti = await p.evaluate(() => [...document.querySelectorAll('svg[aria-label^="Mappa della rete"] g[opacity]')].filter((g) => parseFloat(g.getAttribute("opacity")) < 0.35).length);
console.log(`[4] tocco = traccia percorso: scheda ${scheda ? "PASS" : "CHECK"} | "Rifornisce" ${rifornisce ? "PASS" : "CHECK"} | collegamenti animati ${formiche} | elementi spenti ${spenti}`,
  formiche > 0 && spenti > 0 ? "PASS" : "CHECK");
await p.screenshot({ path: "r-2-traccia.png" });

/* 5. secondo tocco sullo stesso nodo = apre il magazzino */
await p.evaluate(() => {
  const t = [...document.querySelectorAll('svg[aria-label^="Mappa della rete"] text')].find((e) => e.textContent === "Magazzino");
  if (t) t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await p.waitForTimeout(800);
const apertoOk = await p.getByText("Riempimento medio").count() > 0;
console.log(`[5] secondo tocco apre il magazzino: ${apertoOk ? "PASS" : "CHECK"}`);
await p.screenshot({ path: "r-3-aperto.png" });

console.log("errs", errs.length, errs.slice(0, 4));
const pass = bandeSedi === 2 && troncatiAmbigui.length === 0 && frittiFm && frittiRm && frecce >= 8
  && scheda && rifornisce && formiche > 0 && spenti > 0 && apertoOk && errs.length === 0;
console.log("RESULT:", pass ? "PASS" : "CHECK");
await b.close();
