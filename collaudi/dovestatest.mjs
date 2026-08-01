/* gen-5.69 (A): il prodotto si porta dietro i suoi magazzini.

   La frase da cui nasce: «se mi capita di aggiungere un prodotto non devo fare
   il giro dell'app per andare a inserirlo in un magazzino».

   Il conto era peggio della frase. Mettere un prodotto in un magazzino si
   poteva fare in QUATTRO modi, con quattro nomi diversi, in TRE schermate:
   «Assegna a più magazzini» (lista Magazzini), «Aggiungi articolo» (dentro un
   magazzino), «Aggiungi più prodotti» e «Copia da un magazzino» (Gestione
   rapida). Nessuno dei quattro stava dove sta il prodotto.

   E il Catalogo scriveva «questi prodotti vanno assegnati a un magazzino»
   tenendo l'unico tasto che li assegna in un'altra sezione: un cartello che
   nomina il problema e non porta la strada.

   Il controllo che conta di piu' e' l'ultimo: togliere la spunta a un
   magazzino che ha ancora della merce NON deve far sparire quella merce. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const scena = () => {
  const s = JSON.parse(JSON.stringify(base));
  const [ORFANO, CON_ROBA] = s.prodotti;
  /* ORFANO: in nessun magazzino. CON_ROBA: in uno solo, con della merce dentro. */
  for (const m of s.magazzini) m.articoli = (m.articoli || [])
    .filter((a) => a.prodottoId !== ORFANO.id && a.prodottoId !== CON_ROBA.id);
  s.magazzini[0].articoli.push({ prodottoId: CON_ROBA.id, uomId: CON_ROBA.uomBase, qty: 7, par: 10 });
  s.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
  return { s, ORFANO, CON_ROBA, mag0: s.magazzini[0], mag1: s.magazzini[1] };
};
const { ORFANO, CON_ROBA, mag0, mag1 } = scena();

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  const m = new Map(); m.set("scp:stato:v1", j);
  window.storage = {
    async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
    async set(k, v) { m.set(k, v); return true; },
    async delete(k) { m.delete(k); return true; },
  };
}, JSON.stringify(scena().s));
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1500);

const leggi = () => p.evaluate(async () => {
  const r = await window.storage.get("scp:stato:v1", true);
  const s = JSON.parse(r.value);
  return s.magazzini.map((m) => ({ id: m.id, nome: m.nome,
    art: m.articoli.map((a) => ({ id: a.prodottoId, qty: a.qty, par: a.par })) }));
});
const apriCatalogo = async () => {
  await vaiA(p, "Catalogo"); await p.waitForTimeout(600);
  await p.getByText(/Prodotti ·/).first().click().catch(() => {});
  await p.waitForTimeout(500);
};
/* i gruppi di categoria nascono chiusi: finche' non si aprono le righe dei
   prodotti non esistono proprio nella pagina. Cercare il nome nella casella
   di ricerca li apre tutti, ed e' anche il gesto che farebbe una persona. */
const cerca = async (nome) => {
  const box = p.getByPlaceholder("Cerca prodotto…").first();
  await box.fill(nome);
  await p.waitForTimeout(700);
};

/* ═══ 1. IL TASTO STA SULLA RIGA DEL PRODOTTO ═══ */
console.log("\n— 1. le azioni stanno sull'oggetto —");
await apriCatalogo();
await cerca(ORFANO.nome);
ok(await p.getByRole("button", { name: `Magazzini di ${ORFANO.nome}` }).count() > 0,
  `sulla riga di «${ORFANO.nome}», nel Catalogo, c'e' il tasto dei magazzini`);

/* ═══ 2. L'AVVISO PORTA IL RIMEDIO CON SÉ ═══ */
console.log("\n— 2. il cartello porta la strada —");
await cerca("");
const avviso = (await p.locator("main").innerText()).replace(/\s+/g, " ");
ok(/non stanno in nessun magazzino|non sta in nessun magazzino/.test(avviso),
  "l'avviso dei prodotti fuori da ogni magazzino c'e' ancora");
ok(await p.getByRole("button", { name: /^Assegna «/ }).count() > 0,
  "e adesso ha dentro il tasto che li assegna, non solo quello che li filtra");

/* ═══ 3. ASSEGNARE SENZA USCIRE DAL CATALOGO ═══ */
console.log("\n— 3. si assegna da qui —");
await cerca(ORFANO.nome);
await p.getByRole("button", { name: `Magazzini di ${ORFANO.nome}` }).click();
await p.getByText("Spunta i magazzini dove questo prodotto deve stare", { exact: false })
  .waitFor({ state: "visible", timeout: 30000 });
await p.waitForTimeout(400);
const foglio = p.locator(".sc-su").last();
ok((await foglio.innerText()).includes(mag0.nome), "il foglio elenca i magazzini veri");

await foglio.getByRole("button", { name: new RegExp(mag1.nome) }).first().click();
await p.waitForTimeout(400);
await p.getByPlaceholder("0", { exact: true }).last().fill("6");
await p.waitForTimeout(200);
await p.getByRole("button", { name: /^Salva/ }).click();
await p.waitForTimeout(1200);

const d3 = await leggi();
const in1 = d3.find((m) => m.id === mag1.id).art.find((a) => a.id === ORFANO.id);
ok(!!in1, `«${ORFANO.nome}» adesso sta in «${mag1.nome}», e non sono mai uscito dal Catalogo`);
ok(in1 && in1.qty === 0, "entra a quantita' zero: la conta chi ce l'ha davanti");
ok(in1 && in1.par === 6, "col livello previsto che ho scritto (6)");

/* ═══ 4. LA COSA CHE NON DEVE SUCCEDERE ═══ */
console.log("\n— 4. una spunta non fa sparire la merce —");
await apriCatalogo();
await cerca(CON_ROBA.nome);
await p.getByRole("button", { name: `Magazzini di ${CON_ROBA.nome}` }).click();
await p.getByText("Spunta i magazzini dove questo prodotto deve stare", { exact: false })
  .waitFor({ state: "visible", timeout: 30000 });
await p.waitForTimeout(400);
const f2 = p.locator(".sc-su").last();
ok(/non si toglie con della merce dentro/.test(await f2.innerText()),
  `«${mag0.nome}» ha 7 pezzi dentro e la riga lo dice`);
/* provo a toglierlo lo stesso */
await f2.getByRole("button", { name: new RegExp(mag0.nome) }).first().click();
await p.waitForTimeout(600);
const dopoTocco = (await p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/ha ancora della merce|Sposta o rimuovi/.test(dopoTocco),
  "toccandolo l'app rifiuta e spiega, invece di ubbidire");

const d4 = await leggi();
const ancora = d4.find((m) => m.id === mag0.id).art.find((a) => a.id === CON_ROBA.id);
ok(ancora && ancora.qty === 7,
  `e i 7 pezzi sono ancora li' (${ancora?.qty}): una spunta non cancella una giacenza`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
