/* I tre lavori scelti da Valerio: il Catalogo sul telefono, il valore della
   merce, i tasti prendibili con un dito. Si prova sul catalogo VERO — 102
   prodotti — perché è la quantità che rendeva la schermata inusabile. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const st = JSON.parse(readFileSync("stato-vero.json", "utf8"));
const s = { ...st, richieste: [], ordini: [], movimenti: [], log: [],
  codici: [], accessi: [],
  profili: [{ id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }] };
const nProd = s.prodotti.length;
const nCat = s.categorie.length;
console.log(`\ncatalogo vero: ${nProd} prodotti in ${nCat} categorie\n`);

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
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

/* ─────────── 1. IL CATALOGO SUL TELEFONO ─────────── */
await vai("Catalogo");
await p.getByText(/^Prodotti · /).first().click(); await p.waitForTimeout(1000);

const righeVisibili = () => p.locator('[aria-label^="Modifica"]').count();
const gruppi = p.locator('button[aria-expanded]');
const nGruppi = await gruppi.count();
ok(nGruppi > 0 && nGruppi <= nCat + 1, `i prodotti sono raggruppati per categoria (${nGruppi} gruppi)`);
const apertiSubito = await p.locator('button[aria-expanded="true"]').count();
ok(apertiSubito === 0, "e partono tutti chiusi, come nei magazzini");
const primeRighe = await righeVisibili();
ok(primeRighe === 0, `nessuno dei ${nProd} prodotti è srotolato all'apertura (${primeRighe} righe)`);
await p.screenshot({ path: "cat-1-chiuso.png", fullPage: true });

/* la pagina deve stare in poco: prima erano 102 righe di fila */
const alto = await p.evaluate(() => document.documentElement.scrollHeight);
ok(alto < 2600, `la pagina è corta: si scorre poco (${alto}px di altezza)`);

/* aprendo un gruppo compaiono solo i suoi */
const etichetta = (await gruppi.first().innerText()).split("\n")[0].trim();
await gruppi.first().click(); await p.waitForTimeout(600);
const dopoApertura = await righeVisibili();
ok(dopoApertura > 0 && dopoApertura < nProd,
  `aprendo «${etichetta}» compaiono solo i suoi prodotti (${dopoApertura}, non ${nProd})`);
ok(await p.locator('button[aria-expanded="true"]').count() === 1, "e resta aperto solo quello");
await p.screenshot({ path: "cat-2-aperto.png", fullPage: true });
await gruppi.first().click(); await p.waitForTimeout(400);

/* cercando, i gruppi si aprono da soli: un risultato nascosto è un dispetto */
const campo = p.locator('input[aria-label="Cerca nel catalogo"]');
await campo.fill("guanciale"); await p.waitForTimeout(700);
const trovati = await righeVisibili();
ok(trovati > 0, `cercando «guanciale» il risultato si vede subito (${trovati})`);
ok((await p.locator('button[aria-expanded="true"]').count()) > 0,
  "perché i gruppi si aprono da soli mentre cerchi");

/* La ricerca resta in cima mentre si scorre.
   Attenzione a come si misura: con «guanciale» c'è un risultato solo, la
   pagina non ha niente da scorrere e il campo non ha MAI bisogno di
   appiccicarsi. Chiedere «non si è mosso» in quella condizione è un controllo
   che passa da solo, e infatti passava anche quando .sticky non c'era. Serve
   una pagina davvero lunga, e serve pretendere che il campo si FERMI in cima
   al contenitore, non solo che non scivoli. */
await campo.fill(""); await p.waitForTimeout(600);
for (const g of await p.locator('button[aria-expanded="false"]').all()) {
  await g.click().catch(() => {}); await p.waitForTimeout(120);
}
await p.waitForTimeout(400);
const app = await p.evaluate(() => {
  const c = document.querySelector('input[aria-label="Cerca nel catalogo"]').closest("div");
  const m = document.querySelector("main");
  const naturale = c.getBoundingClientRect().top - m.getBoundingClientRect().top;
  return { scorribile: Math.round(m.scrollHeight - m.clientHeight),
    naturale: Math.round(naturale), posizione: getComputedStyle(c).position };
});
ok(app.posizione === "sticky", `il campo è dichiarato appiccicato (${app.posizione})`);
ok(app.scorribile > app.naturale + 100,
  `e c'è abbastanza da scorrere per metterlo alla prova (${app.scorribile}px, ne servono piu' di ${app.naturale})`);
/* Il riferimento giusto è la posizione naturale del campo, non lo zero: sticky
   si incolla al bordo interno del contenitore, e «main» ha 20px di margine
   interno. Zero non si raggiunge mai, e pretenderlo darebbe un rosso finto. */
const fermato = await p.evaluate(async () => {
  const c = document.querySelector('input[aria-label="Cerca nel catalogo"]').closest("div");
  const m = document.querySelector("main");
  m.scrollTop = m.scrollHeight;
  await new Promise((r) => setTimeout(r, 400));
  return { off: Math.round(c.getBoundingClientRect().top - m.getBoundingClientRect().top),
    scorso: Math.round(m.scrollTop) };
});
ok(fermato.scorso > 500, `la pagina è scorsa davvero (${fermato.scorso}px)`);
ok(Math.abs(fermato.off - app.naturale) < 8,
  `e con tutta quella roba passata sotto la ricerca è rimasta dov'era (${fermato.off}px, partiva da ${app.naturale})`);
await campo.fill(""); await p.waitForTimeout(500);

/* ─────────── 2. I PREZZI E IL VALORE ─────────── */
const senzaPrezzo = s.prodotti.filter((x) => !(x.prezzo > 0)).length;
ok(senzaPrezzo === nProd, `di partenza nessun prodotto ha un prezzo (${senzaPrezzo} su ${nProd})`);

await vai("Analisi");
const tAn = await p.locator("body").innerText();
ok(/Valore della merce ferma/.test(tAn), "in Analisi c'è la scheda del valore");
ok(/nessun prodotto ha un prezzo/.test(tAn), "che dice perché non si può calcolare");
ok(!/€ 0,00/.test(tAn), "e NON mostra un finto «€ 0,00»");
await p.screenshot({ path: "cat-3-valore-vuoto.png", fullPage: true });

/* metto due prezzi dalla schermata nuova */
await vai("Catalogo");
await p.getByText(/^Prodotti · /).first().click(); await p.waitForTimeout(900);
await p.getByRole("button", { name: "Prezzi" }).first().click(); await p.waitForTimeout(900);
const foglio = p.locator(".fixed.inset-0.z-50").last();
const tF = await foglio.innerText();
ok(/unità base/.test(tF), "la schermata dei prezzi spiega che il prezzo è per unità base");
ok(new RegExp(`Solo i ${nProd} senza prezzo`).test(tF), `e parte filtrata sui ${nProd} da compilare`);
const campi = foglio.locator('input[aria-label^="Prezzo di"]');
const nCampi = await campi.count();
ok(nCampi === nProd, `c'è un campo per ogni prodotto, tutti in una schermata (${nCampi})`);
const nome1 = (await campi.first().getAttribute("aria-label")).replace("Prezzo di ", "");
await campi.nth(0).fill("2,50"); await p.waitForTimeout(200);
await campi.nth(1).fill("4"); await p.waitForTimeout(200);
await p.screenshot({ path: "cat-4-prezzi.png", fullPage: true });
await foglio.getByRole("button", { name: /Salva i prezzi/ }).click();
await p.waitForTimeout(1500);

const dopo = await letto();
const conPrezzo = dopo.prodotti.filter((x) => x.prezzo > 0);
ok(conPrezzo.length === 2, `salvati due prezzi (${conPrezzo.length})`);
ok(conPrezzo.some((x) => x.prezzo === 2.5), `«${nome1}» è a 2,50 — la virgola è stata letta bene`);
ok((dopo.log || []).some((e) => /prezzi aggiornati/.test(e.msg || "")), "e lo storico lo registra");

await vai("Analisi");
const tAn2 = await p.locator("body").innerText();
ok(/Valore della merce ferma/.test(tAn2), "il valore ora si calcola");
ok(/Escluse/.test(tAn2) || /senza prezzo/.test(tAn2),
  "e dice quante caselle ha dovuto escludere, invece di far finta di niente");
ok(!/€ 0,00\b/.test(tAn2.split("Valore della merce ferma")[1]?.slice(0, 200) || ""),
  "senza mostrare un totale finto");
await p.screenshot({ path: "cat-5-valore-parziale.png", fullPage: true });

/* ─────────── 3. I TASTI, OVUNQUE ─────────── */
const piccoli = [];
for (const dove of ["Home", "Catalogo", "Magazzini", "Plancia", "Ordini", "Analisi", "Sistema"]) {
  const v = p.locator("nav").getByText(dove, { exact: true });
  if (!(await v.count())) continue;
  await v.first().click(); await p.waitForTimeout(1000);
  const g = await p.evaluate((dove) => {
    const out = [];
    for (const el of document.querySelectorAll("button,[role=button]")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.height < 32 || r.width < 32) {
        const et = (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 26);
        if (et) out.push(`${dove}: ${et} (${Math.round(r.width)}×${Math.round(r.height)})`);
      }
    }
    return [...new Set(out)];
  }, dove);
  piccoli.push(...g);
}
for (const x of piccoli) console.log("  ⚠ " + x);
ok(piccoli.length === 0, `nessun tasto sotto i 32px in tutta l'app (${piccoli.length} trovati)`);

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
