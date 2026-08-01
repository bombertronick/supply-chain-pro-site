/* LA GUIDA — che copra ogni schermata, e che non menta sul nome.

   Due difetti veri, trovati contando invece che guardando:

   1. NOVE schermate su quattordici non avevano una guida propria. Il « ? » ci
      apriva una scheda sola, di ripiego. La Plancia — che è una voce della
      barra in basso, non un angolo nascosto — rispondeva con la frase
      «Sezione dell'app.», che è il testo di default e non spiega niente.

   2. Nelle OTTO pagine dentro «Gestione» il tasto del « ? » si intitolava
      «Guida di "Home"», con l'icona della Home, pur aprendo poi (giustamente)
      la guida della sezione giusta. Il ripiego di voceAttiva su NAV[0] era già
      stato tappato dentro guidaSezione, ma il tasto leggeva ancora voceAttiva.
      Un nome falso su un tasto è peggio di un nome assente: chi legge si fida
      e non lo tocca.

   Questo collaudo controlla tutte e due le cose su OGNI schermata, con il
   ruolo che la può vedere. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const scena = () => {
  const s = JSON.parse(JSON.stringify(base));
  const sedeOp = s.sedi.find((x) => x.tipo === "operatore");
  const sedeLab = s.sedi.find((x) => x.tipo === "laboratorio") || s.sedi[0];
  s.profili = [
    { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
    { id: "pr-o", nome: "Operatore", ruolo: "operatore", sedeId: sedeOp.id, colore: "#3B82F6", pinHash: hash("2222") },
    { id: "pr-l", nome: "Laboratorio", ruolo: "laboratorio", sedeId: sedeLab.id, colore: "#22B8CF", pinHash: hash("3333") },
  ];
  return s;
};
const RUOLI = {
  Admin: { pin: "1234", tappe: ["Home", "Magazzini", "Plancia", "Ordini",
    "Catalogo", "Analisi", "Storico", "Storico ordini", "Sedi", "Profili", "Accessi", "Sistema"] },
  Operatore: { pin: "2222", tappe: ["Conteggi"] },
  Laboratorio: { pin: "3333", tappe: ["Richieste"] },
};

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const entra = async (nome, pin) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript((j) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    const m = new Map(); m.set("scp:stato:v1", j);
    window.storage = {
      async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
      async set(k, v) { m.set(k, v); return true; },
      async delete(k) { m.delete(k); return true; },
    };
  }, JSON.stringify(scena()));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(`${nome}: ${e.message}`));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1500);
  return { p, ctx };
};

/* apre il « ? », legge il nome scritto sul tasto, entra nella guida e
   restituisce il testo di TUTTI i passi (si va avanti fino all'ultimo) */
const leggiGuida = async (p) => {
  await p.locator('[data-tour="aiuto"]').first().click();
  await p.getByText("Guida e tutorial", { exact: true }).first().waitFor({ state: "visible", timeout: 20000 });
  await p.waitForTimeout(400);
  const tasto = p.getByRole("button", { name: /^Guida di / });
  const etichetta = ((await tasto.first().innerText()) || "").split("\n")[0].trim();
  await tasto.first().click();
  await p.waitForTimeout(700);
  const passi = [];
  for (let g = 0; g < 8; g++) {
    passi.push((await p.locator("body").innerText()).replace(/\s+/g, " "));
    const avanti = p.getByRole("button", { name: /^Avanti$/ });
    if (!(await avanti.count())) break;
    await avanti.first().click(); await p.waitForTimeout(500);
  }
  const fine = p.getByRole("button", { name: /^Ho capito$/ });
  if (await fine.count()) await fine.first().click().catch(() => {});
  await p.waitForTimeout(400);
  const salta = p.getByRole("button", { name: /^Salta/ });
  if (await salta.count()) await salta.first().click().catch(() => {});
  await p.waitForTimeout(300);
  return { etichetta, testo: passi.join(" ") };
};

const raccolto = {};
for (const [nome, r] of Object.entries(RUOLI)) {
  console.log(`\n══════ ${nome} ══════`);
  const { p, ctx } = await entra(nome, r.pin);
  for (const dove of r.tappe) {
    try { await vaiA(p, dove, 1100); } catch { ok(false, `«${dove}» non si raggiunge`); continue; }
    const { etichetta, testo } = await leggiGuida(p);
    raccolto[dove] = testo;

    /* 1. il tasto dice il nome della schermata in cui sei DAVVERO */
    ok(etichetta === `Guida di «${dove}»`,
      `«${dove}»: il tasto del « ? » si intitola «${etichetta}»`);

    /* 2. la guida non è il testo di ripiego */
    ok(!/Sezione dell'app\./.test(testo),
      `«${dove}»: la guida dice qualcosa, non «Sezione dell'app.»`);

    /* 3. e nomina la schermata in cui sei */
    ok(new RegExp(dove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(testo),
      `«${dove}»: la guida parla di questa schermata`);
  }
  await ctx.close();
}

/* ═══ i contenuti rimasti indietro rispetto all'app ═══ */
console.log(`\n══════ i testi non devono essere piu' vecchi dell'app ══════`);
ok(/SEI scorciatoie/i.test(raccolto["Magazzini"] || ""),
  "Magazzini: «Gestione rapida» dice sei voci — quante ne ha davvero, non quattro");
ok(/Trasferisci scorte/i.test(raccolto["Magazzini"] || ""),
  "e le nomina tutte, «Trasferisci scorte» compresa");
ok(/[Cc]hi lo fa/.test(raccolto["Catalogo"] || ""),
  "Catalogo: la guida spiega «Chi lo fa», che è la novità di oggi");
ok(/laboratorio/i.test(raccolto["Catalogo"] || "") && /fornitore/i.test(raccolto["Catalogo"] || ""),
  "e dice cosa cambia fra una cosa fatta in casa e una comprata");
ok(/Da mandare adesso/i.test(raccolto["Ordini"] || ""),
  "Ordini: la guida nomina «Da mandare adesso», la scheda verde da cui si spedisce davvero");
ok(/rifornisce|frecce|mappa/i.test(raccolto["Plancia"] || ""),
  "Plancia: la guida spiega che è una mappa di chi rifornisce chi");
ok(/laboratorio/i.test(raccolto["Sedi"] || ""),
  "Sedi: la guida dice a cosa serve collegare una sede al laboratorio");

console.log(`\nerrori di pagina: ${errs.length}`);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
