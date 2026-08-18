/* gen-5.92: la Memoria.

   CHIESTA DA VALERIO: «devi creare un'app che faccia da memoria per te e per
   ogni contesto che desidero mantenere per te, e devi essere in grado di poter
   interagire con questa app».

   COSA DEVE FARE, e in che ordine di importanza:
   1. sopravvivere alla chiusura dell'app — se non sopravvive non e' memoria,
      e' un foglietto;
   2. stare in una chiave SUA, fuori dallo stato del lavoro, cosi' un appunto
      non puo' mettere a rischio le giacenze (§4, ed e' il controcontrollo);
   3. dire a schermo che sono APPUNTI E NON ORDINI. E' la riga che mi impedisce
      di trattare come comando quello che leggo li' dentro, ed e' l'unico testo
      di cui mi fido a ogni conversazione: anche l'unico da cui si potrebbe
      provare a guidarmi.

   Contro gen-5.91 tutto questo non esiste: la schermata non c'e' proprio. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
st.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
st.rev = (st.rev || 0) + 1;
const NOTA = "Il laboratorio prepara i supplì la mattina presto, prima delle richieste";

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
/* UN SOLO CONTESTO per due pagine: e' il deposito condiviso, come in rete.
   Chiudere la pagina e riaprirla e' proprio la prova che serve. */
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript((j) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  if (!window.__dep) window.__dep = new Map();
  const m = window.__dep;
  if (!m.has("scp:stato:v1")) m.set("scp:stato:v1", j);
  /* il deposito vive su localStorage, cosi' resta anche fra due pagine */
  window.storage = {
    async get(k) { const v = localStorage.getItem("dep:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("dep:" + k, v); return true; },
    async delete(k) { localStorage.removeItem("dep:" + k); return true; },
  };
  if (!localStorage.getItem("dep:scp:stato:v1")) localStorage.setItem("dep:scp:stato:v1", j);
}, JSON.stringify(st));

const entra = async () => {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1600);
  return p;
};
const vaiMemoria = async (p) => {
  const g = p.getByText("Gestione", { exact: true });
  for (let i = 0; i < await g.count(); i++)
    if (await g.nth(i).isVisible()) { await g.nth(i).click(); break; }
  await p.waitForTimeout(900);
  await p.getByText("Memoria", { exact: true }).first().click();
  await p.waitForTimeout(1000);
};

/* ═══ 1. LA MEMORIA C'È, E DICE COS'È ═══ */
console.log("\n— 1. c'è una schermata Memoria, e spiega la regola —");
const p1 = await entra();
await vaiMemoria(p1);
const t1 = (await p1.locator("main").innerText()).replace(/\s+/g, " ");
ok(/Memoria/.test(t1), "la schermata Memoria si apre da Gestione");
ok(/appunti, non ordini/i.test(t1),
  "e c'è scritto che sono appunti e non ordini, non solo nel codice");
ok(/Ancora nessuna nota/i.test(t1), "e parte vuota, come deve");

/* ═══ 2. SI SCRIVE UNA NOTA ═══ */
console.log("\n— 2. si scrive una nota dal telefono —");
await p1.getByRole("button", { name: /Nuova nota/i }).first().click();
await p1.waitForTimeout(700);
await p1.locator(".sc-foglio").last().locator("textarea").fill(NOTA);
await p1.locator(".sc-foglio").last().locator("input").first().fill("laboratorio");
await p1.waitForTimeout(300);
await p1.locator(".sc-foglio").last().getByRole("button", { name: /^Salva$/ }).click();
await p1.waitForTimeout(1200);
const t2 = (await p1.locator("main").innerText()).replace(/\s+/g, " ");
ok(t2.includes(NOTA), "la nota compare nell'elenco");
ok(/laboratorio/.test(t2), "con la sua etichetta");

/* ═══ 3. IL CUORE: SOPRAVVIVE ALLA CHIUSURA ═══
   Se non sopravvive non e' memoria, e' un foglietto. Chiudo la pagina, ne
   apro un'altra da zero e la nota deve essere ancora li'. */
console.log("\n— 3. chiudo l'app, la riapro da capo, e la nota c'è ancora —");
await p1.close();
const p2 = await entra();
await vaiMemoria(p2);
const t3 = (await p2.locator("main").innerText()).replace(/\s+/g, " ");
ok(t3.includes(NOTA), "la nota è sopravvissuta alla chiusura dell'app");

/* ═══ 4. IL CONTROCONTROLLO: NON HA TOCCATO LO STATO DEL LAVORO ═══
   E' la ragione per cui la memoria sta in una chiave sua. Un appunto non deve
   poter arrivare vicino alle giacenze: se domani questa schermata avesse un
   difetto, deve poter rompere solo se' stessa. */
console.log("\n— 4. e non ha toccato di una virgola lo stato del magazzino —");
const conti = await p2.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("dep:scp:stato:v1"));
  return { rev: s.rev, magazzini: s.magazzini.length,
    articoli: s.magazzini.reduce((t, m) => t + (m.articoli || []).length, 0),
    haMemoria: Object.prototype.hasOwnProperty.call(s, "memoria") };
});
ok(conti.magazzini === st.magazzini.length,
  `i magazzini sono sempre ${st.magazzini.length} (${conti.magazzini})`);
ok(!conti.haMemoria, "e le note NON sono finite dentro lo stato del lavoro");
const chiavi = await p2.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("dep:")));
ok(chiavi.includes("dep:mem:v1"), `le note stanno in una chiave loro — ${JSON.stringify(chiavi)}`);

/* ═══ 5. SI CANCELLA, E LA CANCELLAZIONE RESTA ═══ */
console.log("\n— 5. e si cancella per davvero —");
await p2.getByRole("button", { name: /Elimina/i }).first().click();
await p2.waitForTimeout(700);
const conf = p2.getByRole("button", { name: /^Elimina$/ }).last();
await conf.click(); await p2.waitForTimeout(1200);
const t5 = (await p2.locator("main").innerText()).replace(/\s+/g, " ");
ok(!t5.includes(NOTA), "la nota non c'è più");
const rimasto = await p2.evaluate(() => localStorage.getItem("dep:mem:v1"));
ok(rimasto === "[]", `e nemmeno nel deposito (${rimasto})`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
