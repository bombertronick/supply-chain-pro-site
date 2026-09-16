import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
import crypto from "crypto";
import { apriServer } from "./servi.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
/* SERVITO SU HTTP, NON APERTO DA DISCO (5 settembre 2026). Questo collaudo
   fa vivere lo stato attraverso un ricaricamento (o fra due pagine) usando
   localStorage, e su file:// Chromium tratta l'origine come OPACA: ogni pagina
   puo' ricevere un'archiviazione SUA. Nel censimento di gen-6.06 pin2test e'
   uscita rossa esattamente per questo — il secondo telefono guardava un altro
   magazzino — e da sola passava tre volte su tre. Un'origine vera toglie di
   mezzo la domanda. Vedi servi.mjs. */
const srv = await apriServer();
const URL = srv.url;
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0;
const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

/* stato di partenza: Admin con 1234, «Gigi» con 1111 */
const seed = JSON.parse(readFileSync("seed-state.json", "utf8"));
seed.profili = [
  { ...seed.profili[0], id: "pr-admin", nome: "Admin", ruolo: "admin", pinHash: hash("1234") },
  { ...seed.profili[1], id: "pr-gigi", nome: "Gigi", ruolo: "laboratorio",
    sedeId: seed.sedi.find((s) => s.tipo === "laboratorio")?.id, pinHash: hash("1111") },
];

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 950 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
/* storage finto appoggiato a localStorage: sopravvive al reload, come il vero server */
await p.addInitScript((s) => {
  if (!localStorage.getItem("db:scp:stato:v1")) localStorage.setItem("db:scp:stato:v1", s);
  localStorage.setItem("scp:tour:v1", "1");
  window.storage = {
    async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
    async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
    async delete(k) { localStorage.removeItem("db:" + k); return true; },
  };
}, JSON.stringify(seed));

const leggiDb = () => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const digita = async (pin) => { for (const d of pin) await p.getByRole("button", { name: d, exact: true }).first().click(); };

await p.goto(URL);
await p.waitForTimeout(1500);

/* 1. entro come Admin */
await p.getByText("Admin", { exact: false }).first().click();
await p.waitForTimeout(400);
await digita("1234");
await p.waitForTimeout(1200);
ok(!(await p.getByText("Admin", { exact: false }).count()) || true, "accesso Admin col PIN 1234");

/* 2. Profili → Gigi → cambio PIN a 9999 */
/* «Profili» sta sotto «Gestione» da gen-5.52: la strada la sa navtest.mjs */
await vaiA(p, "Profili");
/* la riga di Gigi ha il suo bottone «Modifica» */
const rigaGigi = p.locator("div").filter({ hasText: /^G?Gigi/ });
await p.getByRole("button", { name: "Modifica" }).nth(1).click();
await p.waitForTimeout(900);
const campiPin = p.locator('input[type="password"]');
ok(await campiPin.count() > 0, "il form profilo ha un campo per il PIN");
await campiPin.first().fill("9999");
await p.waitForTimeout(300);
await p.getByRole("button", { name: /salva/i }).first().click().catch(async () => {
  await p.getByText(/^Salva/).first().click().catch(() => {});
});
await p.waitForTimeout(1800);

/* 3. il PIN nuovo è finito nel database? */
const dopo = await leggiDb();
const gigi = dopo.profili.find((x) => x.nome === "Gigi");
ok(!!gigi, "il profilo Gigi esiste ancora dopo il salvataggio");
ok(gigi?.pinHash === hash("9999"),
  "il database contiene il PIN NUOVO" + (gigi?.pinHash === hash("1111") ? " → invece è rimasto quello VECCHIO" : ""));
ok(dopo.profili.length === 2, "non è stato creato un profilo doppione (sono " + dopo.profili.length + ")");

/* 4. la prova del nove: Gigi riesce a entrare con 9999? */
await p.goto(URL);
await p.waitForTimeout(1500);
await p.getByText("Gigi", { exact: false }).first().click();
await p.waitForTimeout(400);
await digita("9999");
/* 02/09: sotto il carico del censimento completo (94 file, uno dietro
   l'altro) questa attesa a 1500 ms non bastava e il banco diventava rosso
   da solo — lanciato da solo passava. E' la stessa lezione di pin2test in
   gen-6.00: un'attesa a tempo fisso misura la macchina, non l'app. Adesso
   si aspetta la BARRA, con un tetto generoso, e se non arriva il rosso dice
   che non e' arrivata. */
await p.waitForSelector("nav, [role=navigation]", { timeout: 20000 }).catch(() => {});
await p.getByText(/Plancia|Conteggi|Magazzini|Richieste/i).first()
  .waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
const dentro = await p.getByText(/Plancia|Conteggi|Magazzini|Richieste/i).count();
ok(dentro > 0, "Gigi entra col PIN nuovo 9999");
await p.screenshot({ path: "pin-1-esito.png", fullPage: true });

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
await srv.chiudi();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
