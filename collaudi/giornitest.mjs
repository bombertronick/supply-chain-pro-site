import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const A = st.magazzini.find((m) => m.articoli.length >= 3);
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 880 }, isMobile: true, hasTouch: true });
const errs = [];
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);
const nav = p.getByText("Plancia", { exact: true });
for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(700);

// ===== 1. seleziona i sotto scorta di tutta la rete =====
const sottoRete = st.magazzini.reduce((n, m) => {
  const parOggi = (a) => { const g = new Date().getDay(); return a.parGiorni && a.parGiorni[g] != null ? a.parGiorni[g] : a.par; };
  return n + m.articoli.filter(a => a.qty < parOggi(a)).length;
}, 0);
const bannerOk = await p.getByText(/caselle sotto scorta in tutta la rete/).count() > 0;
await p.getByText(/caselle sotto scorta in tutta la rete/).click(); await p.waitForTimeout(600);
const selTxt = await p.getByText(/\d+ caselle ·/).first().innerText();
const nSel = parseInt(selTxt);
console.log(`banner sotto scorta: ${bannerOk ? "PASS" : "CHECK"} | selezionate ${nSel} (attese ${sottoRete})`, nSel === sottoRete ? "PASS" : "CHECK");
await p.screenshot({ path: "g-1-sotto.png" });

// ===== 2. azione "Per giorno" con decimali =====
/* I comandi della Plancia sono in gruppi da gen-5.47: si parte da «Quantità»
   e «Per giorno» sta sotto «Soglie». Prima il collaudo lo cercava sciolto e
   da allora scadeva in un timeout senza provare piu' niente. */
await p.getByRole("button", { name: /^Soglie$/ }).click(); await p.waitForTimeout(400);
await p.getByRole("button", { name: /Per giorno/ }).click(); await p.waitForTimeout(600);
const grigliaOk = await p.getByLabel("Livello lunedì").count() > 0;
await p.getByLabel("Livello lunedì").fill("2");
await p.getByLabel("Livello martedì").fill("0,5");
await p.getByLabel("Livello sabato").fill("3,5");
await p.waitForTimeout(300);
await p.screenshot({ path: "g-2-giorni.png" });
await p.getByRole("button", { name: /^Applica$/ }).click(); await p.waitForTimeout(900);
const res = await p.evaluate(async () => {
  const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value);
  let conPg = 0, lun2 = 0, mar05 = 0, sab35 = 0;
  for (const m of s.magazzini) for (const a of m.articoli) {
    if (a.parGiorni) { conPg++;
      if (a.parGiorni["1"] === 2) lun2++;
      if (a.parGiorni["2"] === 0.5) mar05++;
      if (a.parGiorni["6"] === 3.5) sab35++; }
  }
  return { conPg, lun2, mar05, sab35 };
});
console.log(`per-giorno applicato: ${res.conPg} caselle | lun=2 ${res.lun2} | mar=0,5 ${res.mar05} | sab=3,5 ${res.sab35}`,
  res.conPg === nSel && res.mar05 === nSel && res.sab35 === nSel ? "PASS" : "CHECK");

// ===== 3. annulla =====
await p.getByRole("button", { name: /Deseleziona/ }).click(); await p.waitForTimeout(500);
const undoVis = await p.getByText("Annulla l'ultima modifica").count() > 0;
await p.getByText("Annulla l'ultima modifica").click(); await p.waitForTimeout(900);
// l'annulla deve riportare ESATTAMENTE allo stato di partenza (comprese le
// caselle che avevano già i giorni impostati prima della modifica)
const dopoUndo = await p.evaluate(async () => {
  const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value);
  const out = {};
  for (const m of s.magazzini) for (const a of m.articoli) if (a.parGiorni) out[m.id + "|" + a.prodottoId] = a.parGiorni;
  return out;
});
const atteso = {};
for (const m of st.magazzini) for (const a of m.articoli) if (a.parGiorni) atteso[m.id + "|" + a.prodottoId] = a.parGiorni;
const identico = JSON.stringify(dopoUndo) === JSON.stringify(atteso);
console.log(`annulla visibile: ${undoVis ? "PASS" : "CHECK"} | ripristino identico all'originale (${Object.keys(atteso).length} caselle):`, identico ? "PASS" : "CHECK");

// ===== 4. filtri + passo 0,5 nelle Caselle =====
await p.getByRole("button", { name: "Caselle", exact: true }).click(); await p.waitForTimeout(600);
const filtroOk = await p.getByRole("button", { name: /Sotto scorta · \d+/ }).count() > 0;
await p.getByRole("button", { name: /Sotto scorta · \d+/ }).click(); await p.waitForTimeout(500);
await p.getByRole("button", { name: "0,5", exact: true }).click(); await p.waitForTimeout(300);
const q0 = await p.evaluate(async () => { const r = await window.storage.get("scp:stato:v1", true); return JSON.parse(r.value); });
await p.getByRole("button", { name: "Aumenta" }).first().click(); await p.waitForTimeout(600);
const q1 = await p.evaluate(async () => { const r = await window.storage.get("scp:stato:v1", true); return JSON.parse(r.value); });
let mezzo = false;
for (const m of q1.magazzini) for (const a of m.articoli) {
  const prima = q0.magazzini.find(x => x.id === m.id).articoli.find(x => x.prodottoId === a.prodottoId);
  if (prima && Math.abs((a.qty - prima.qty) - 0.5) < 1e-9) mezzo = true;
}
console.log(`filtri caselle: ${filtroOk ? "PASS" : "CHECK"} | passo 0,5 sul +: ${mezzo ? "PASS" : "CHECK"}`);
await p.screenshot({ path: "g-3-caselle.png" });

console.log("errs", errs.length, errs.slice(0, 4));
const pass = bannerOk && nSel === sottoRete && grigliaOk && res.mar05 === nSel && res.sab35 === nSel
  && undoVis && identico && filtroOk && mezzo && errs.length === 0;
console.log("RESULT:", pass ? "PASS" : "CHECK");
await b.close();
