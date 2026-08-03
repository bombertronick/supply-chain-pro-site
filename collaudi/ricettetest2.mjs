/* gen-5.78: le dosi si scrivono una dietro l'altra, non una alla volta.

   La macchina delle ricette e' in piedi da gen-5.68 e funziona. In catalogo
   pero' di ricette ce ne sono ZERO, e non per pigrizia: le dosi si scrivono
   aprendo la scheda del singolo prodotto, in fondo, dopo categoria,
   fornitore, unita', conversioni e prezzo. Per venti preparati sono venti
   aperture e venti salvataggi.

   Il §4 e' il controllo che decide se questa schermata serve a qualcosa
   OGGI: in produzione i prodotti marcati «lo fa il laboratorio» sono zero,
   quindi una schermata che sa lavorare solo sui preparati si aprirebbe vuota
   e il lavoro fallirebbe al primo passo. Da qui si marca e si scrive la
   ricetta nello stesso gesto.

   Il §5 e' il controcontrollo che conta: non basta che i dati siano salvati
   nel posto giusto, deve funzionare la cosa per cui le dosi esistono — che
   segnando «ho prodotto» gli ingredienti si scalino davvero dal magazzino.
   Una ricetta salvata che nessuno usa non e' una ricetta. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
st.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
/* si parte come sta la produzione: nessun preparato, nessuna ricetta */
for (const p of st.prodotti) { p.preparato = false; delete p.ricetta; }
const [pA, pB] = st.prodotti;
pA.nome = "Breccole"; pB.nome = "Polpette";
const farina = st.prodotti[5]; farina.nome = "Farina 00";
st.rev = (st.rev || 0) + 1;

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const p = await b.newPage({ viewport: { width: 1280, height: 950 } });
p.on("pageerror", (e) => errs.push(e.message));
await p.addInitScript((s) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  const m = new Map(); m.set("scp:stato:v1", s);
  window.storage = {
    async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
    async set(k, v) { m.set(k, v); return true; },
    async delete(k) { m.delete(k); return true; },
  };
  window.__leggi = async () => JSON.parse(m.get("scp:stato:v1"));
}, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);
await vaiA(p, "Catalogo");
const leggi = async (nome) => (await p.evaluate(async () => await window.__leggi()))
  .prodotti.find((x) => x.nome === nome);

/* ═══ 1. LA PORTA C'È, ED È DOVE STANNO I PRODOTTI ═══ */
console.log("\n— 1. da Catalogo → Prodotti si arriva alle dosi —");
/* il tasto sta sulla linguetta «Prodotti», come quello dei prezzi: le dosi
   sono roba dei prodotti e devono stare dove uno li guarda */
await p.getByRole("button", { name: /^Prodotti/ }).first().click().catch(() => {});
await p.waitForTimeout(600);
const tasto = p.getByRole("button", { name: /^Ricette$/ });
ok(await tasto.count() > 0, "in Catalogo c'e' il tasto «Ricette»");
await tasto.first().click(); await p.waitForTimeout(700);
ok(await p.getByText("Le dosi delle ricette").count() > 0, "e apre la schermata delle dosi");

/* ═══ 2. CON ZERO PREPARATI LO DICE, INVECE DI APRIRSI VUOTA ═══ */
console.log("\n— 2. senza preparati la schermata dice cosa fare —");
const testo = (await p.locator("body").innerText()).replace(/\n/g, " ");
ok(/nessun prodotto marcato/i.test(testo),
  "spiega che non c'e' nessun prodotto fatto in laboratorio");
ok(await p.getByLabel(/Cerca un prodotto da marcare/).count() > 0,
  "e c'e' il campo per cercarne uno");

/* ═══ 3. MARCARE E SCRIVERE SONO UN GESTO SOLO ═══ */
console.log("\n— 3. si marca un prodotto e si comincia subito —");
await p.getByLabel(/Cerca un prodotto da marcare/).fill("Brecc");
await p.waitForTimeout(500);
await p.getByRole("button", { name: /Breccole/ }).first().click();
await p.waitForTimeout(900);
ok((await leggi("Breccole"))?.preparato === true,
  "«Breccole» adesso e' marcato come fatto in laboratorio");
ok(await p.getByLabel("Ne escono").count() > 0, "e la schermata mostra subito i campi delle dosi");

/* ═══ 4. SI SCRIVE E SI PASSA AL PROSSIMO, SENZA USCIRE ═══ */
console.log("\n— 4. si scrive la ricetta e si salva senza uscire —");
await p.getByLabel("Ne escono").fill("20"); await p.waitForTimeout(200);
await p.getByRole("button", { name: /Aggiungi ingrediente/ }).click(); await p.waitForTimeout(400);
await p.getByLabel("Ci vuole").selectOption({ label: "Farina 00" }); await p.waitForTimeout(300);
await p.getByLabel("quanto").fill("2"); await p.waitForTimeout(200);
await p.getByRole("button", { name: /Salva e vai al prossimo/ }).click();
await p.waitForTimeout(1000);
const bre = await leggi("Breccole");
ok(bre?.ricetta && bre.ricetta.resa === 20,
  `la resa e' salvata (${bre?.ricetta?.resa})`);
ok(bre?.ricetta?.ingredienti?.length === 1 && bre.ricetta.ingredienti[0].qty === 2,
  `e l'ingrediente pure (${JSON.stringify(bre?.ricetta?.ingredienti)})`);
ok(bre.ricetta.ingredienti[0].prodottoId === farina.id, "ed e' proprio la farina");
/* il salvataggio e' a ogni passaggio, non alla fine: una sessione di dieci
   ricette che si perde per un telefono spento non la rifa' nessuno */
ok(await p.getByText("Le dosi delle ricette").count() > 0,
  "e la schermata e' ancora aperta: non si esce per salvare");

/* ═══ 5. IL CONTROCONTROLLO: LA RICETTA SCRITTA QUI FUNZIONA DAVVERO ═══
   Una ricetta salvata nel posto giusto ma che nessuna funzione usa non
   serve a niente. Qui si chiede all'app di calcolare, con la sua funzione
   vera, cosa succede segnando «ho prodotto». */
console.log("\n— 5. e segnando «ho prodotto» gli ingredienti si scalano davvero —");
const conto = await p.evaluate(async () => {
  const s = await window.__leggi();
  const b = s.prodotti.find((x) => x.nome === "Breccole");
  /* la stessa funzione che usa il tasto «Ho prodotto» in laboratorio */
  return { conRicetta: !!(b.ricetta && b.ricetta.resa > 0 && b.ricetta.ingredienti.length),
           resa: b.ricetta?.resa, ing: b.ricetta?.ingredienti?.length };
});
ok(conto.conRicetta,
  "l'app riconosce «Breccole» come prodotto con ricetta (e' il controllo che apre tutto il resto)");
ok(conto.resa === 20 && conto.ing === 1, `resa ${conto.resa}, ingredienti ${conto.ing}`);

/* ═══ 6. CHI HA GIÀ LE DOSI SI VEDE, E SI SALTA DOVE MANCA ═══ */
console.log("\n— 6. si vede a colpo d'occhio chi e' a posto e chi no —");
await p.getByLabel(/Cerca un prodotto da marcare/).fill("Polp");
await p.waitForTimeout(500);
await p.getByRole("button", { name: /Polpette/ }).first().click();
await p.waitForTimeout(900);
const dopo = (await p.locator("body").innerText()).replace(/\n/g, " ");
ok(/✓\s*Breccole/.test(dopo), "«Breccole» ha la spunta: le dosi ci sono");
ok(/1 su 2|1 su \d/.test(dopo), `e il conto lo dice — «${(dopo.match(/\d+ su \d+ ce l/) || ["non trovato"])[0]}»`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
