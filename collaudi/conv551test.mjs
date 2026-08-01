/* gen-5.51 sullo schermo, sui dati veri di Valerio: 102 prodotti, 35 caselle
   tenute in un'unità che non è quella base del prodotto e senza il fattore. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const st = JSON.parse(readFileSync("stato-vero.json", "utf8"));
const s = { ...st, richieste: [], ordini: [], movimenti: [], log: [], codici: [], accessi: [],
  profili: [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }] };

/* quante ne mancano davvero, contate qui fuori con le stesse regole dell'app */
const simbolo = (id) => s.unita.find((u) => u.id === id)?.simbolo || "?";
const attese = new Set();
for (const m of s.magazzini) for (const a of m.articoli || []) {
  const p = s.prodotti.find((x) => x.id === a.prodottoId);
  if (!p || a.uomId === p.uomBase) continue;
  if (p.conv && p.conv[a.uomId] != null) continue;
  attese.add(p.id + "|" + a.uomId);
}
const N = attese.size;
console.log(`\ndati veri: ${s.prodotti.length} prodotti · ${N} conversioni mancanti\n`);

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const ctx = await b.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await ctx.addInitScript((j) => {
  localStorage.setItem("db:scp:stato:v1", j); localStorage.setItem("scp:tour:v1", "1");
  window.storage = { async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; }, async delete(k) { localStorage.removeItem("db:" + k); return true; } };
}, JSON.stringify(s));
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(e.message));
const letto = () => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const vai = (d) => vaiA(p, d);

await p.goto(URL); await p.waitForTimeout(1600);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
await p.waitForTimeout(1700);

/* ─────────── 1. LE CONVERSIONI IN UN POSTO SOLO ─────────── */
console.log("— 1. un posto unico per le conversioni —");
await vai("Catalogo");
await p.getByText(/^Prodotti · /).first().click(); await p.waitForTimeout(900);
const tasto = p.getByRole("button", { name: new RegExp(`^Conversioni · ${N}$`) });
ok(await tasto.count() === 1, `in Catalogo c'è «Conversioni · ${N}», col numero vero`);
await p.screenshot({ path: "c551-1-catalogo.png", fullPage: true });
await tasto.click(); await p.waitForTimeout(1100);

const foglio = p.locator(".fixed.inset-0.z-50").last();
const campi = foglio.locator('input[aria-label*="per "]');
ok(await campi.count() === N, `la schermata le elenca tutte e ${N} in una volta (${await campi.count()})`);
const testo = await foglio.innerText();
ok(/conta 1:1/.test(testo), "e dice a cosa serve: senza il fattore l'app conta 1:1");

/* la teglia contro teglia dev'essere data per esatta */
const esatte = await foglio.locator("text=esatta").count();
ok(esatte >= 1, `le conversioni fra teglie sono marcate «esatta» (${esatte})`);
ok(/geometria della teglia/.test(testo), "con la ragione: sta scritto nel nome, non si pesa");
/* «Fiori di zucca» ha DUE buchi: la teglia contro teglia (geometria) e il peso.
   Vanno presi per nome esatto, se no si finisce a misurare l'altro. */
const vFiori = await foglio.locator('input[aria-label="1 GN 1/6 = quante GN 1/3 per Fiori di zucca"]').inputValue();
ok(vFiori === "0,5", `«1 GN 1/6 = quante GN 1/3» parte da 0,5 (trovato «${vFiori}»)`);
const vFioriKg = await foglio.locator('input[aria-label="quanti kg stanno in 1 GN 1/3 per Fiori di zucca"]').inputValue();
ok(vFioriKg === "1,67", `e lo stesso prodotto, sul peso, parte da 1,67 kg per GN 1/3 (${vFioriKg})`);

/* il peso lo chiede come lo direbbe un cuoco */
ok(/quanti kg stanno in 1 GN 1\/6/.test(testo), "sul peso chiede «quanti kg stanno in 1 GN 1/6»");
ok(/quanto pesa 1 pezzo, in grammi/.test(testo), "e sui pezzi «quanto pesa 1 pezzo, in grammi»");
ok(/stimato/.test(testo), "e dichiara che quelle sono stime, non misure");
const zucc = foglio.locator('input[aria-label*="Zucchine"]').first();
ok((await zucc.inputValue()) === "0,83", `«Zucchine» parte da 0,83 kg per teglia (${await zucc.inputValue()})`);
await p.screenshot({ path: "c551-2-conversioni.png", fullPage: true });

/* correggo una a mano: quella non dev'essere marcata stimata */
await zucc.fill("1,1"); await p.waitForTimeout(250);
await foglio.getByRole("button", { name: /^Salva \d+ conversioni$/ }).click();
await p.waitForTimeout(1800);

const dopo = await letto();
const pZucc = dopo.prodotti.find((x) => x.nome === "Zucchine");
const pFiori = dopo.prodotti.find((x) => x.nome === "Fiori di zucca");
const uKg = s.unita.find((u) => u.simbolo === "kg").id;
const uG3 = s.unita.find((u) => u.simbolo === "GN 1/3").id;
const uG6 = s.unita.find((u) => u.simbolo === "GN 1/6").id;

ok(Math.abs(pZucc.conv[uKg] - 1 / 1.1) < 1e-4,
  `«1,1 kg a teglia» diventa il fattore giusto: ${pZucc.conv[uKg]?.toFixed(4)} teglie per kg`);
ok(!(pZucc.convStim || []).includes(uKg), "e siccome l'ho scritta io, NON risulta stimata");
ok(Math.abs(pFiori.conv[uG6] - 0.5) < 1e-9, `«Fiori di zucca»: 1 GN 1/6 = ${pFiori.conv[uG6]} GN 1/3`);
ok(!(pFiori.convStim || []).includes(uG6), "la geometria non è una stima: nessun marchio");
const stimati = dopo.prodotti.filter((x) => (x.convStim || []).length);
ok(stimati.length > 0, `${stimati.length} prodotti restano marcati «da confermare con la bilancia»`);
ok((dopo.log || []).some((e) => /conversioni impostate/.test(e.msg || "")), "e lo storico lo registra");

/* Il giro di ritorno: le stime salvate devono tornare MODIFICABILI da qui,
   se no il marchio «da pesare» è una condanna a vita. Ne restano 33 stimate
   (35 meno la geometria esatta e meno quella che ho scritto a mano). */
await p.waitForTimeout(700);
const nStim = dopo.prodotti.reduce((n, x) => n + (x.convStim || []).length, 0);
const tasto2 = p.getByRole("button", { name: new RegExp(`^Conversioni · ${nStim}$`) });
ok(await tasto2.count() === 1,
  `il tasto resta e ora conta le ${nStim} stimate, non più le mancanti`);
await tasto2.click(); await p.waitForTimeout(1100);
const f2 = p.locator(".fixed.inset-0.z-50").last();
const t2 = await f2.innerText();
ok(/stimato dall'app: pesane uno e correggi/.test(t2), "e ognuna dice che è una stima da pesare");
/* riapro una stima: dev'essere ripresentata NEL MODO IN CUI L'HO SCRITTA */
const supp = f2.locator('input[aria-label="quanto pesa 1 pezzo, in grammi per Supplì nerone"]');
ok(await supp.count() === 1, "il campo del supplì è di nuovo lì, in grammi");
ok((await supp.inputValue()) === "100", `e riporta i 100 g stimati (${await supp.inputValue()})`);
/* lo correggo con il peso vero e il marchio deve cadere */
await supp.fill("110"); await p.waitForTimeout(250);
await f2.getByRole("button", { name: /^Salva \d+ conversioni$/ }).click();
await p.waitForTimeout(1800);
const dopo2 = await letto();
const pSup = dopo2.prodotti.find((x) => x.nome === "Supplì nerone");
ok(Math.abs(pSup.conv[uKg] - 1000 / 110) < 1e-3,
  `110 g a pezzo diventano ${pSup.conv[uKg]?.toFixed(3)} pezzi per kg`);
ok(!(pSup.convStim || []).includes(uKg), "e il marchio «stimata» cade, perché ora è pesata");
const nStim2 = dopo2.prodotti.reduce((n, x) => n + (x.convStim || []).length, 0);
ok(nStim2 === nStim - 1, `le stime da confermare scendono da ${nStim} a ${nStim2}`);
await p.screenshot({ path: "c551-5-correzione.png", fullPage: true });

/* ─────────── 2. LA PLANCIA: STIMATA È AMBRA, NON ROSSO ─────────── */
console.log("\n— la Plancia distingue il provvisorio dal rotto —");
await vai("Plancia");
await p.waitForTimeout(1400);
const tPl = await p.locator("body").innerText();
ok(/conversione stimata/.test(tPl), "la Plancia segnala le conversioni stimate");
ok(!/conversione mancante/.test(tPl), "e non parla più di conversioni mancanti: non ce ne sono");
await p.screenshot({ path: "c551-3-plancia.png", fullPage: true });

/* ─────────── 3. I NOMI NON SI TAGLIANO PIÙ ─────────── */
console.log("\n— i nomi dentro il magazzino —");
await vai("Magazzini");
const mag = s.magazzini.find((m) => (m.articoli || []).length > 6);
await p.getByText(mag.nome, { exact: true }).first().click(); await p.waitForTimeout(1500);
const gruppo = p.locator('button[aria-expanded="false"]');
if (await gruppo.count()) { await gruppo.first().click(); await p.waitForTimeout(800); }
const mozzi = await p.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("div,span")) {
    if (el.children.length) continue;
    const st = getComputedStyle(el);
    if (st.textOverflow !== "ellipsis" && !el.className.includes("truncate")) continue;
    if (el.scrollWidth > el.clientWidth + 1) out.push(`«${(el.textContent || "").trim()}» ${el.clientWidth}px per ${el.scrollWidth}px`);
  }
  return [...new Set(out)];
});
for (const x of mozzi) console.log("  ⚠ " + x);
const nomiMozzi = mozzi.filter((x) => !/rifornita dal laboratorio/.test(x));
ok(nomiMozzi.length === 0, `nessun nome di prodotto tagliato a 360px (${nomiMozzi.length})`);
const largo = await p.evaluate(() => {
  const el = [...document.querySelectorAll(".truncate")].find((e) => /Pachino|Patate|Prosciutto/.test(e.textContent || ""));
  return el ? Math.round(el.getBoundingClientRect().width) : null;
});
ok(largo != null && largo > 150, `al nome ora tocca tutta la riga: ${largo}px (prima 47)`);
await p.screenshot({ path: "c551-4-magazzino.png", fullPage: true });

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
