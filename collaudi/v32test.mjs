import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const st = JSON.parse(JSON.stringify(base));
st.sedi = [
  { id: "s-lab", nome: "Portuense", tipo: "laboratorio" },
  { id: "s-fm", nome: "Fm", tipo: "operatore", labSedeId: "s-lab" },
  { id: "s-rm", nome: "Rm", tipo: "operatore", labSedeId: "s-lab" },
];
const uom = st.unita[0].id;
const perCat = {};
for (const pr of st.prodotti) (perCat[pr.categoriaId || "_"] = perCat[pr.categoriaId || "_"] || []).push(pr.id);
const pid = [];
for (let k = 0; k < 8; k++) for (const c in perCat) if (perCat[c][k]) pid.push(perCat[c][k]);
const arti = (n) => pid.slice(0, n).map((id, i) => ({ prodottoId: id, uomId: uom, par: 2 + (i % 4), qty: (i % 3) + (i % 5 === 0 ? 0.5 : 0) }));
st.magazzini = [
  { id: "m-lab", nome: "Magazzino centrale", sedeId: "s-lab", tipo: "laboratorio", articoli: arti(20) },
  { id: "m-secco-fm", nome: "Secco fm", sedeId: "s-fm", tipo: "retro", articoli: arti(16) },
  { id: "m-lin-fm", nome: "Linea fm", sedeId: "s-fm", tipo: "linea-lab", articoli: arti(11) },
  { id: "m-secco-rm", nome: "Secco rm", sedeId: "s-rm", tipo: "retro", articoli: arti(16) },
  { id: "m-linsec-rm", nome: "Linea secco rm", sedeId: "s-rm", tipo: "linea-retro", rifMagazzinoId: "m-secco-rm", articoli: arti(16) },
  /* magazzino di una sede senza laboratorio collegato: nessuno lo rifornisce */
  { id: "m-orfano", nome: "Deposito isolato", sedeId: "s-lab", tipo: "retro", articoli: arti(4) },
];
st.prodotti.find((p) => p.id === pid[0]).soloInteri = true;   // interi a metà (qty .5)
st.magazzini[1].articoli[3].par = 0;                          // senza soglia
st.magazzini[1].articoli[5].par = 3;
st.magazzini[1].articoli[5].parGiorni = { "1":3,"2":3,"3":3,"4":3,"5":3,"6":3,"0":3 };  // per-giorno inutile
st.profili = st.profili.map((p) => (p.ruolo === "admin" ? p : { ...p, sedeId: "s-fm" }));

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 900 }, isMobile: true, hasTouch: true });
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
let esito = [];
const chk = (nome, ok, extra = "") => { esito.push(ok); console.log(`[${ok ? "PASS" : "CHECK"}] ${nome}${extra ? " | " + extra : ""}`); };

/* ===== 1. i controlli trovano le incoerenze VERE ===== */
const chips = await p.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.innerText.trim())
  .filter((t) => /senza soglia|interi a metà|per-giorno inutile|senza rifornitore/.test(t)));
chk("controlli: i quattro tipi di incoerenza", chips.length === 4, chips.join(" / "));
/* la soglia mancante e' UNA sola, e le vuole trovare tutte */
const uno = chips.find((t) => /senza soglia/.test(t));
chk("controlli: conteggio soglie mancanti = 1", /(^|\D)1 senza soglia/.test(uno), uno);

/* ===== 2. dal controllo alla selezione, e "Arrotonda" corregge ===== */
await p.getByRole("button", { name: /interi a metà/ }).first().click(); await p.waitForTimeout(500);
const bottoneSel = p.getByRole("button", { name: /Seleziona queste \d+ caselle/ });
chk("controlli: bottone di selezione pronto", await bottoneSel.count() > 0);
await bottoneSel.first().click(); await p.waitForTimeout(700);
const prima = await p.evaluate(async (k) => {
  const s = JSON.parse((await window.storage.get("scp:stato:v1", true)).value);
  let mezzi = 0;
  for (const m of s.magazzini) for (const a of m.articoli)
    if (a.prodottoId === k && Math.abs(a.qty - Math.round(a.qty)) > 1e-9) mezzi++;
  return mezzi;
}, pid[0]);
await p.getByRole("button", { name: /Arrotonda/ }).click(); await p.waitForTimeout(900);
const dopo = await p.evaluate(async (k) => {
  const s = JSON.parse((await window.storage.get("scp:stato:v1", true)).value);
  let mezzi = 0;
  for (const m of s.magazzini) for (const a of m.articoli)
    if (a.prodottoId === k && Math.abs(a.qty - Math.round(a.qty)) > 1e-9) mezzi++;
  return mezzi;
}, pid[0]);
chk("Arrotonda: i prodotti interi tornano interi", prima > 0 && dopo === 0, `${prima} -> ${dopo}`);
const undo = await p.getByText("Annulla l'ultima modifica").count();
await p.getByRole("button", { name: /Deseleziona/ }).click().catch(() => {});
await p.waitForTimeout(600);
chk("Arrotonda: annulla disponibile", (await p.getByText("Annulla l'ultima modifica").count()) > 0 || undo > 0);
await p.getByText("Annulla l'ultima modifica").click().catch(() => {}); await p.waitForTimeout(900);
const ripristino = await p.evaluate(async (k) => {
  const s = JSON.parse((await window.storage.get("scp:stato:v1", true)).value);
  let mezzi = 0;
  for (const m of s.magazzini) for (const a of m.articoli)
    if (a.prodottoId === k && Math.abs(a.qty - Math.round(a.qty)) > 1e-9) mezzi++;
  return mezzi;
}, pid[0]);
chk("Arrotonda: l'annulla riporta i mezzi", ripristino === prima, `${ripristino} vs ${prima}`);
await p.screenshot({ path: "v32t-1-controlli.png" });

/* ===== 3. Struttura: selezione di tutta una sede ===== */
await p.getByRole("button", { name: "Struttura", exact: true }).click(); await p.waitForTimeout(600);
await p.getByRole("button", { name: "Seleziona tutta la sede Fm" }).click(); await p.waitForTimeout(700);
const attesiFm = st.magazzini.filter((m) => m.sedeId === "s-fm").reduce((n, m) => n + m.articoli.length, 0);
const hud = await p.getByText(/\d+ caselle ·/).first().innerText();
chk("Struttura: la sede si seleziona tutta", parseInt(hud) === attesiFm, `${hud.replace(/\n/g," ")} (attesi ${attesiFm})`);
/* secondo tocco = deseleziona */
await p.getByRole("button", { name: "Seleziona tutta la sede Fm" }).click(); await p.waitForTimeout(700);
chk("Struttura: secondo tocco deseleziona", (await p.getByText(/\d+ caselle ·/).count()) === 0);
await p.getByRole("button", { name: "Apri tutto" }).click(); await p.waitForTimeout(700);
const magVis = await p.getByText("Secco fm", { exact: false }).count();
chk("Struttura: Apri tutto espande le sedi", magVis > 0);
await p.screenshot({ path: "v32t-2-struttura.png" });

/* ===== 4. Settimana: riepilogo per categoria + selezione categoria ===== */
await p.getByRole("button", { name: "Settimana", exact: true }).click(); await p.waitForTimeout(700);
await p.locator("select").first().selectOption("m-secco-fm").catch(() => {});
await p.waitForTimeout(800);
const magRiga = await p.getByText(/^magazzino$/).count();
chk("Settimana: riga totale del magazzino", magRiga > 0);
const catRighe = await p.getByText(/^categoria$/).count();
chk("Settimana: riepilogo per ogni categoria", catRighe >= 2, `${catRighe} categorie`);
const selCat = p.getByRole("button", { name: /^Seleziona categoria / });
const nCat = await selCat.count();
await selCat.first().click(); await p.waitForTimeout(700);
const hud2 = await p.getByText(/\d+ caselle ·/).count();
chk("Settimana: la categoria si seleziona dal riepilogo", nCat >= 2 && hud2 > 0, `${nCat} caselline`);
await p.screenshot({ path: "v32t-3-settimana.png" });

/* ===== 5. Caselle: gruppi per categoria e scarto in chiaro ===== */
await p.getByRole("button", { name: "Caselle", exact: true }).click(); await p.waitForTimeout(800);
const scarti = await p.getByText(/^mancano /).count();
chk("Caselle: lo scarto dalla soglia e' scritto", scarti > 0, `${scarti} caselle`);
const senzaSoglia = await p.getByText("senza soglia").count();
chk("Caselle: la casella senza soglia e' segnalata", senzaSoglia > 0);
const gruppiC = await p.getByRole("button", { name: /^Seleziona categoria / }).count();
chk("Caselle: gruppi per categoria", gruppiC >= 2, `${gruppiC} gruppi`);
await p.screenshot({ path: "v32t-4-caselle.png" });

/* ===== 6. nessun errore ===== */
chk("nessun errore in console", errs.length === 0, errs.slice(0, 3).join(" | "));
console.log("RESULT:", esito.every(Boolean) ? "PASS" : "CHECK");
await b.close();
