/* gen-5.83: «Annulla l'ultima modifica» disfa anche le modifiche in blocco.

   IL DIFETTO, trovato il 4 agosto subito dopo aver messo online le conversioni
   in blocco. La fotografia che lo storico scatta prima di ogni modifica —
   fotoCaselle() — riguarda SOLO magazzini.articoli: giacenza, soglia, unita',
   livelli per giorno. I campi dei PRODOTTI non ci sono mai stati.

   Quindi una modifica in blocco sbagliata (categoria, fornitore, unita' base,
   conversione, mezze confezioni) non si annulla: si preme «Annulla», l'app
   dice di averlo fatto, e non cambia niente. Un annulla che mente e' peggio
   di un annulla che non c'e', perche' la gente ci conta e smette di cercare.

   Non e' nato oggi: vale da sempre per tutte le modifiche in blocco. Ma
   finche' una passata toccava campi facili da rimettere a mano il danno era
   contenuto; da gen-5.82 con un tocco se ne scrivono quaranta.

   IL §4 E' IL CONTROCONTROLLO: la fotografia dei prodotti non deve appesantire
   ogni singola modifica. Lo stato viaggia intero a ogni scrittura, e nel
   luglio scorso il peso del traffico e' gia' stato un difetto vero: si
   registra solo quello che CAMBIA, e una modifica che non tocca prodotti non
   deve lasciare niente.

   Contro gen-5.82 il §2 e il §3 devono diventare rossi. */
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
const catA = st.categorie[0], catB = st.categorie[2] || st.categorie[1];
if (catA.id === catB.id) throw new Error("banco di prova rotto: servono due categorie diverse");
const [p1, p2, p3] = st.prodotti;
p1.nome = "Pomodori"; p2.nome = "Cipolle"; p3.nome = "Carote";
for (const p of [p1, p2, p3]) p.categoriaId = catA.id;
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
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);

const stato = async () => await p.evaluate(async () => await window.__leggi());
const catDi = async (nome) => {
  const s = await stato();
  return s.prodotti.find((x) => x.nome === nome)?.categoriaId;
};
const chiudiFogli = async () => {
  for (let i = 0; i < 4; i++) {
    if (!(await p.locator(".sc-foglio").count())) return;
    const x = p.locator(".sc-foglio").last().getByRole("button", { name: "Chiudi", exact: true });
    if (await x.count()) await x.first().click().catch(() => {});
    else await p.keyboard.press("Escape");
    await p.waitForTimeout(400);
  }
};

/* ═══ 1. SI FA UNA MODIFICA IN BLOCCO ═══ */
console.log("\n— 1. si cambia la categoria a tre prodotti in un colpo —");
await vaiA(p, "Catalogo");
await p.getByRole("button", { name: /^Prodotti/ }).first().click().catch(() => {});
await p.waitForTimeout(500);
await p.getByRole("button", { name: /blocco|Modifica in blocco/i }).first().click();
await p.waitForTimeout(700);
await p.locator(".sc-foglio").last().getByLabel("Cosa vuoi cambiare").selectOption("categoriaId");
await p.waitForTimeout(300);
await p.locator(".sc-foglio").last().getByLabel(/Nuovo valore/).selectOption(catB.id);
for (const n of ["Pomodori", "Cipolle", "Carote"]) {
  await p.locator(".sc-foglio").last().locator("button").filter({ hasText: n }).first().click();
  await p.waitForTimeout(180);
}
await p.getByRole("button", { name: /Applica/ }).last().click();
await p.waitForTimeout(1400);
ok((await catDi("Pomodori")) === catB.id, "«Pomodori» è passato alla nuova categoria");
ok((await catDi("Carote")) === catB.id, "e anche «Carote»");

/* ═══ 2. LO STORICO SE NE È ACCORTO ═══
   Prima la voce c'era ma era vuota: diceva «0 caselle», perche' la fotografia
   guardava solo i magazzini. Una riga di storico che non sa cosa e' cambiato
   non e' uno storico, e' una data. */
console.log("\n— 2. lo storico sa cosa è cambiato, non solo che è successo —");
await chiudiFogli();
const s2 = await stato();
const voce = (s2.log || [])[0];
ok(!!voce && /categoria/i.test(voce.msg || ""), `la voce c'è: «${voce?.msg}»`);
ok(Array.isArray(voce?.cambiP) && voce.cambiP.length === 3,
  `e si è segnata i 3 prodotti toccati (${voce?.cambiP?.length ?? "niente"})`);

/* ═══ 3. IL CUORE: L'ANNULLA DISFA DAVVERO ═══ */
console.log("\n— 3. «Annulla» rimette le categorie di prima —");
const nav = p.getByText("Home", { exact: true });
for (let i = 0; i < await nav.count(); i++)
  if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
await p.waitForTimeout(800);
/* il giro vero e' in tre tempi: «vedi cosa» apre il dettaglio, «Riporta tutto
   com'era prima» chiede conferma, e la conferma esegue. Il tasto di mezzo
   PRIMA non compariva nemmeno su una modifica di soli prodotti: il pannello
   si apriva solo se c'erano cambi di magazzino. */
const vediCosa = p.getByRole("button", { name: /^vedi cosa$/ }).first();
ok(await vediCosa.count() > 0, "sulla voce c'è «vedi cosa»");
await vediCosa.click(); await p.waitForTimeout(700);
const dettaglio = (await p.locator("body").innerText()).replace(/\n/g, " ");
ok(/scheda del prodotto/.test(dettaglio),
  "e il dettaglio mostra cosa è cambiato sui prodotti");
const riporta = p.getByRole("button", { name: /Riporta tutto com'era prima/ }).first();
ok(await riporta.count() > 0, "e c'è il tasto per riportare tutto com'era");
await riporta.click(); await p.waitForTimeout(700);
const conferma = p.getByRole("button", { name: /Riporta|Conferma|Ripristina/i }).last();
if (await conferma.count()) { await conferma.click(); await p.waitForTimeout(1500); }
ok((await catDi("Pomodori")) === catA.id,
  `«Pomodori» è tornato alla categoria di prima (${(await catDi("Pomodori")) === catA.id ? "sì" : "NO"})`);
ok((await catDi("Cipolle")) === catA.id, "e «Cipolle» pure");
ok((await catDi("Carote")) === catA.id, "e «Carote»");

/* ═══ 4. IL CONTROCONTROLLO: NON SI APPESANTISCE QUELLO CHE NON SERVE ═══
   Lo stato viaggia intero a ogni scrittura. Una fotografia di tutti i prodotti
   appiccicata a ogni modifica sarebbe il peso che a gen-5.77 abbiamo appena
   tolto dal traffico. Si registra SOLO quello che cambia. */
console.log("\n— 4. una modifica che non tocca i prodotti non lascia niente —");
const primaDelNulla = (await stato()).log.length;
await vaiA(p, "Catalogo");
await p.getByRole("button", { name: /^Prodotti/ }).first().click().catch(() => {});
await p.waitForTimeout(500);
await p.getByRole("button", { name: /blocco|Modifica in blocco/i }).first().click();
await p.waitForTimeout(700);
await p.locator(".sc-foglio").last().getByLabel("Cosa vuoi cambiare").selectOption("categoriaId");
await p.locator(".sc-foglio").last().getByLabel(/Nuovo valore/).selectOption(catA.id);
await p.locator(".sc-foglio").last().locator("button").filter({ hasText: "Pomodori" }).first().click();
await p.waitForTimeout(200);
await p.getByRole("button", { name: /Applica/ }).last().click();
await p.waitForTimeout(1400);
await chiudiFogli();
const s4 = await stato();
const ultima = s4.log[0];
ok(s4.log.length > primaDelNulla, "la modifica a vuoto lascia comunque la sua riga di storico");
ok(!ultima.cambiP || ultima.cambiP.length === 0,
  `ma senza fotografia dei prodotti, perché non è cambiato niente (${JSON.stringify(ultima.cambiP || [])})`);

/* ═══ 5. E IL PESO RESTA SOTTO CONTROLLO ═══ */
console.log("\n— 5. la fotografia dei prodotti non gonfia lo stato —");
const peso = JSON.stringify(s4.log).length;
ok(peso < 60000, `tutto lo storico sta in ${(peso / 1024).toFixed(1)}KB`);
ok((s4.log || []).every((v) => !v.cambiP || v.cambiP.length <= 60),
  "e nessuna voce si porta dietro più di 60 prodotti");

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
