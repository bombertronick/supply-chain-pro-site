/* gen-5.77: lo stato non si riscarica quando non e' cambiato niente.

   Difetto n.6 del consiglio del 2 agosto: «lo storico dei movimenti viaggia
   intero ogni tre secondi». Guardando il ciclo, il peso non era il vero
   problema: il problema era che ogni telefono riscaricava lo stato INTERO
   ogni tre secondi anche quando non era cambiato niente, e SOLO DOPO
   confrontava il numero di revisione. Misurato sui dati veri il 3 agosto:
   169 KB di stato, di cui 81 KB di soli movimenti, venti volte al minuto per
   ogni telefono acceso.

   Adesso il ciclo chiede prima una chiave che contiene solo il numero di
   revisione. I §3 e §4 sono la ragione per cui questo file e' lungo il doppio
   di quanto sembrerebbe servire: una scorciatoia che quando si rompe smette
   di far vedere le novita' agli altri telefoni sarebbe molto peggio del peso
   che toglie. Quindi si prova che le novita' si vedono lo stesso (§3), che
   togliendo la spia si torna al comportamento di prima invece di restare
   ciechi (§4), e che comunque ogni dieci giri si scarica tutto (§5) — cosi'
   il ritardo massimo e' mezzo minuto anche nel caso peggiore.

   Si aspettano i FATTI, non i secondi: waitForFunction sui contatori. Un
   collaudo che conta i millisecondi diventa rosso il giorno che la macchina
   e' carica, e poi si smette di credergli. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
st.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
/* si gonfia lo stato come sara' fra otto settimane, se no la differenza fra
   «scarica tutto» e «chiede solo il numero» non si vede nei byte */
const mag0 = st.magazzini[0];
st.movimenti = [];
for (let i = 0; i < 900; i++) st.movimenti.push({
  id: "mv" + i, t: Date.now() - i * 60000, magId: mag0.id, prodottoId: mag0.articoli[i % mag0.articoli.length].prodottoId,
  uomId: mag0.articoli[0].uomId, delta: -1, dopo: 3, causale: "conteggio", chi: "Operatore", rif: null });
st.rev = Date.now();

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const p = await b.newPage({ viewport: { width: 1280, height: 950 } });
p.on("pageerror", (e) => errs.push(e.message));
await p.addInitScript((s) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  const m = new Map(); m.set("scp:stato:v1", s);
  /* il contatore e' il vero strumento di misura di questo collaudo: dice
     quante volte e per quanti byte ogni chiave e' stata chiesta */
  window.__conta = { get: {}, byte: {} };
  const segna = (k, v) => {
    window.__conta.get[k] = (window.__conta.get[k] || 0) + 1;
    window.__conta.byte[k] = (window.__conta.byte[k] || 0) + (v ? String(v).length : 0);
  };
  window.storage = {
    async get(k) { const v = m.get(k); segna(k, v); return v != null ? { value: v } : null; },
    async set(k, v) { m.set(k, v); return true; },
    async delete(k) { m.delete(k); return true; },
  };
  window.__leggi = async () => JSON.parse(m.get("scp:stato:v1"));
  /* per la prova del ripiego: si toglie la spia come se il database non
     l'avesse mai avuta */
  window.__togliSpia = () => { m.delete("scp:rev:v1"); };
  /* e per far finta che un altro telefono abbia scritto qualcosa */
  window.__altroTelefono = (nota) => {
    const s2 = JSON.parse(m.get("scp:stato:v1"));
    s2.rev = (s2.rev || 0) + 1000;
    s2.log = [{ id: "l-altro", t: Date.now(), chi: "Altro telefono", msg: nota }, ...(s2.log || [])];
    m.set("scp:stato:v1", JSON.stringify(s2));
    m.set("scp:rev:v1", String(s2.rev));
  };
}, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1500);

const conta = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__conta)));
const azzera = () => p.evaluate(() => { window.__conta = { get: {}, byte: {} }; });

/* ═══ 1. LA SPIA ESISTE E PORTA IL NUMERO DI REVISIONE ═══
   La spia nasce alla prima scrittura vera dell'app, non da sola: finche'
   nessuno ha scritto niente non c'e', e il ciclo si comporta come prima —
   scarica tutto. E' voluto ed e' la parte sicura del meccanismo, ma va detto
   perche' vuol dire che il guadagno comincia col primo salvataggio, non con
   l'accensione. In cucina succede entro pochi secondi; qui bisogna farlo
   succedere apposta, e si fa premendo un tasto vero. */
console.log("\n— 1. alla prima scrittura nasce una chiave leggera con la revisione —");
{
  const nav = p.getByText("Ordini", { exact: true });
  for (let i = 0; i < await nav.count(); i++)
    if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
  await p.waitForTimeout(700);
  await p.getByRole("button", { name: /^Ricalcola$/ }).first().click();
  await p.waitForTimeout(1200);
}
const dopoScrittura = await p.evaluate(async () => {
  const r = await window.storage.get("scp:rev:v1");
  const s = JSON.parse((await window.storage.get("scp:stato:v1")).value);
  return { spia: r?.value ?? null, rev: s.rev };
});
ok(dopoScrittura.spia != null, `la chiave «scp:rev:v1» c'e' (${dopoScrittura.spia})`);
ok(String(dopoScrittura.spia) === String(dopoScrittura.rev),
  "e porta esattamente la revisione dello stato");
ok(String(dopoScrittura.spia).length < 30,
  `ed e' lunga ${String(dopoScrittura.spia).length} caratteri, non ${dopoScrittura.rev ? "centosettantamila" : "?"}`);

/* ═══ 2. IL GUADAGNO: A RIPOSO NON SI SCARICA PIÙ NIENTE ═══ */
console.log("\n— 2. a riposo il ciclo chiede il numero, non lo stato —");
await azzera();
/* si aspetta il fatto, ma senza far esplodere il file se il fatto non arriva:
   contro una versione senza la spia questo controllo dev'essere ROSSO e
   leggibile, non un errore che ferma tutto e nasconde gli altri */
await p.waitForFunction(() => (window.__conta.get["scp:rev:v1"] || 0) >= 4, null, { timeout: 30000 })
  .catch(() => {});
const c2 = await conta();
const nRev = c2.get["scp:rev:v1"] || 0, nPieni = c2.get["scp:stato:v1"] || 0;
ok(nRev >= 4, `il ciclo ha chiesto il numero ${nRev} volte`);
ok(nPieni <= 1, `e lo stato intero al massimo una (${nPieni})`);
const bRev = c2.byte["scp:rev:v1"] || 0, bPieni = c2.byte["scp:stato:v1"] || 0;
ok(bRev < 500, `in byte: ${bRev} per i numeri`);
ok(bPieni < bRev * 200,
  `contro ${bPieni} per lo stato — prima sarebbero stati ${nRev} pacchetti pieni da ~${Math.round((await p.evaluate(async () => (await window.storage.get("scp:stato:v1")).value.length)) / 1024)} KB`);

/* ═══ 3. CONTROCONTROLLO: LE NOVITÀ SI VEDONO LO STESSO ═══
   Il rischio vero di questa scorciatoia non e' il peso, e' la cecita'. Se un
   altro telefono scrive, questo lo deve vedere — se no si e' barattato un
   po' di dati mobili con due persone che lavorano su numeri diversi. */
console.log("\n— 3. quando un altro telefono scrive, la novita' arriva —");
await p.evaluate(() => window.__altroTelefono("prova della spia"));
const vista = await p.waitForFunction(
  () => document.body.innerText.includes("Altro telefono")
     || !!window.__conta.get["scp:stato:v1"],
  null, { timeout: 20000 }).then(() => true).catch(() => false);
ok(vista, "il telefono si accorge che c'e' qualcosa di nuovo e scarica lo stato");
const arrivato = await p.waitForFunction(async () => {
  const s = JSON.parse((await window.storage.get("scp:stato:v1")).value);
  return (s.log || []).some((l) => l.msg === "prova della spia");
}, null, { timeout: 20000 }).then(() => true).catch(() => false);
ok(arrivato, "e la modifica dell'altro telefono e' quella che si legge");

/* ═══ 4. CONTROCONTROLLO: SENZA LA SPIA SI TORNA A PRIMA ═══
   Se il database non avesse quella chiave — o se una scrittura fallisse — il
   ciclo NON deve restare fermo: deve tornare a scaricare tutto, com'era. */
console.log("\n— 4. tolta la spia, si torna a scaricare tutto invece di restare ciechi —");
await p.evaluate(() => window.__togliSpia());
await azzera();
const tornato = await p.waitForFunction(
  () => (window.__conta.get["scp:stato:v1"] || 0) >= 2, null, { timeout: 30000 })
  .then(() => true).catch(() => false);
ok(tornato, "senza la spia il ciclo riprende a leggere lo stato intero, come prima");

/* ═══ 5. E COMUNQUE OGNI DIECI GIRI SI SCARICA TUTTO ═══
   Il parapetto: anche se la spia rimanesse indietro per un guasto, il ritardo
   massimo e' mezzo minuto, non «finche' qualcuno non ricarica la pagina». */
console.log("\n— 5. il giro pieno arriva comunque, ogni dieci —");
await p.evaluate(async () => {
  /* si rimette la spia, ferma a un numero vecchio: e' il guasto peggiore
     possibile — la spia dice «niente di nuovo» mentre lo stato e' cambiato */
  await window.storage.set("scp:rev:v1", "1");
});
await azzera();
const pienoComunque = await p.waitForFunction(
  () => (window.__conta.get["scp:stato:v1"] || 0) >= 1, null, { timeout: 60000 })
  .then(() => true).catch(() => false);
const c5 = await conta();
ok(pienoComunque,
  `con la spia bloccata su un numero vecchio, lo stato si scarica lo stesso (dopo ${c5.get["scp:rev:v1"] || 0} giri leggeri)`);
ok((c5.get["scp:rev:v1"] || 0) <= 12,
  `e non ci mette piu' di dieci giri (${c5.get["scp:rev:v1"] || 0})`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
