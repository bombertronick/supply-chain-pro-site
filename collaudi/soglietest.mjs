import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const seed = JSON.parse(readFileSync("seed-state.json", "utf8"));
seed.profili = [
  { ...seed.profili[0], id: "pr-admin", nome: "Admin", ruolo: "admin", pinHash: hash("1234") },
  { ...seed.profili[1], id: "pr-op", nome: "Op", ruolo: "operatore",
    sedeId: seed.sedi.find((s) => s.tipo === "operatore")?.id, magazziniIds: [], pinHash: hash("2222") },
];

/* prendo tre articoli di una linea e costruisco uno storico finto ma plausibile */
const mag = seed.magazzini.find((m) => m.tipo.startsWith("linea"));
const [A1, A2, A3] = mag.articoli;
const nome = (a) => seed.prodotti.find((p) => p.id === a.prodottoId)?.nome;
A1.par = 10; delete A1.parGiorni;   // sabato ne escono ~20 → deve proporre di alzare
A2.par = 10; delete A2.parGiorni;   // un solo sabato di dati → NON deve proporre
A3.par = 10; delete A3.parGiorni;   // consumo in linea col previsto → NON deve proporre

/* sabati passati (oggi è martedì 28/07/2026) */
const sabati = [];
for (let g = 1; g <= 40 && sabati.length < 3; g++) {
  const d = new Date(Date.now() - g * 86400000);
  if (d.getDay() === 6) { d.setHours(14, 0, 0, 0); sabati.push(d.getTime()); }
}
const mv = (t, art, delta) => ({ id: "mv" + t + art.prodottoId, t, magId: mag.id,
  prodottoId: art.prodottoId, uomId: art.uomId, delta, dopo: 0, causale: "conteggio", chi: "Op" });
seed.movimenti = [
  ...sabati.map((t) => mv(t, A1, -20)),        // 3 sabati, 20 a botta
  mv(sabati[0], A2, -25),                       // un sabato solo
  ...sabati.map((t) => mv(t, A3, -10)),        // 3 sabati, ma in linea col previsto
];

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 950 } });
await ctx.addInitScript((s) => {
  if (!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1", s);
  localStorage.setItem("scp:tour:v1", "1");
  window.storage = {
    async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
    async delete(k) { localStorage.removeItem("db:" + k); return true; },
  };
}, JSON.stringify(seed));
const errs = []; ctx.on("page", (pg) => pg.on("pageerror", (e) => errs.push(e.message)));
const p = await ctx.newPage();
const digita = async (pin) => { for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(170); } await p.waitForTimeout(1600); };

await p.goto(URL); await p.waitForTimeout(1600);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
await digita("1234");
await vaiA(p, "Analisi", 1000);   /* da gen-5.52 Analisi sta sotto «Gestione» */
const testo = async () => await p.locator("body").innerText();
/* la scheda è l'ultimo blocco della pagina: leggo solo da lì in giù, così non
   confondo i consigli con l'elenco «Previsione fabbisogni» che sta sopra */
const scheda = async () => ((await testo()).split("Soglie consigliate")[1] || "");

const t1 = await testo();
ok(/Soglie consigliate/.test(t1), "in Analisi compare la scheda «Soglie consigliate»");
const c1 = await scheda();
ok(c1.includes(nome(A1)), `propone «${nome(A1)}», quello che consuma il doppio del previsto`);
ok(!c1.includes(nome(A2)), `NON propone «${nome(A2)}»: un sabato solo non fa una regola`);
ok(!c1.includes(nome(A3)), `NON propone «${nome(A3)}»: consuma quanto previsto, non c'è niente da correggere`);
ok(/sabato/.test(c1), "dice di quale giorno si tratta");
ok(/su 3 volte/.test(c1), "dice su quante volte ha misurato");
/* 20 di media + 15% = 23 */
ok(/\b23\b/.test(c1), "propone 23: la media di 20 con un margine del 15%");
await p.screenshot({ path: "soglie-1-analisi.png", fullPage: true });

/* applico e controllo che finisca nei dati, sul giorno giusto */
await p.getByRole("button", { name: "Applica", exact: true }).first().click();
await p.waitForTimeout(1800);
const db = JSON.parse(await p.evaluate(() => localStorage.getItem("db:scp:stato:v1")));
const art = db.magazzini.find((m) => m.id === mag.id).articoli.find((a) => a.prodottoId === A1.prodottoId);
ok(art.parGiorni && art.parGiorni["6"] === 23, "il sabato è passato a 23 → " + JSON.stringify(art.parGiorni));
ok(art.par === 10, "il previsto degli altri giorni non è stato toccato");
const log = db.log[0]?.msg || "";
ok(/sabato/.test(log) && /→/.test(log), "lo storico spiega cosa è cambiato: «" + log + "»");
ok(!(await scheda()).includes(nome(A1)), "applicata, la riga sparisce dai consigli");
await p.screenshot({ path: "soglie-2-applicata.png", fullPage: true });

/* un operatore la legge ma non la può applicare */
await p.evaluate(() => localStorage.removeItem("db:scp:stato:v1"));
const ctx2 = await b.newContext({ viewport: { width: 1280, height: 950 } });
await ctx2.addInitScript((s) => {
  localStorage.setItem("db:scp:stato:v1", s);
  localStorage.setItem("scp:tour:v1", "1");
  window.storage = {
    async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
    async delete(k) { localStorage.removeItem("db:" + k); return true; },
  };
}, JSON.stringify(seed));
const p2 = await ctx2.newPage();
await p2.goto(URL); await p2.waitForTimeout(1600);
await p2.getByText("Op", { exact: true }).first().click(); await p2.waitForTimeout(400);
for (const d of "2222") { await p2.getByRole("button", { name: d, exact: true }).first().click(); await p2.waitForTimeout(170); }
await p2.waitForTimeout(1600);
const haAnalisi = await p2.getByText("Analisi", { exact: true }).count();
if (haAnalisi) {
  await p2.getByText("Analisi", { exact: true }).first().click(); await p2.waitForTimeout(1000);
  const t2 = await p2.locator("body").innerText();
  ok(/Soglie consigliate/.test(t2), "l'operatore vede il consiglio…");
  ok(!/Applica/.test(t2), "…ma non ha il bottone per applicarlo");
} else {
  ok(true, "l'operatore non ha proprio la voce Analisi (nessun bottone da nascondere)");
}
await ctx2.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
