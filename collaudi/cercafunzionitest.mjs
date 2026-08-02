/* gen-5.70 (B): la lente trova anche le FUNZIONI, non solo i prodotti.

   La frase da cui nasce, parola per parola: «devo poter fare tutto senza
   dovermi ricordare in che parte dell'app ho quella determinata funzionalità
   che mi serve; un centro di comando si chiama tale quando controlla tutte le
   sue periferiche e funzionalità principali».

   La diagnosi era misurabile: mettere un prodotto in un magazzino si poteva
   fare in QUATTRO modi, con quattro nomi diversi, in TRE schermate. Chi cerca
   non poteva sapere quale. Spostare i tasti non basta — ne resterebbero sempre
   troppi da ricordare. Serve UN POSTO SOLO che li trovi tutti per nome.

   I due controlli che contano davvero:
     · si cerca con la parola che userebbe una persona («togli»), non col nome
       che sta scritto nel menu' («Sposta o rimuovi prodotti»);
     · un operatore NON deve trovare porte che poi non puo' aprire. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const scena = () => {
  const s = JSON.parse(JSON.stringify(base));
  const sedeOp = s.sedi.find((x) => x.tipo === "operatore");
  s.profili = [
    { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
    { id: "pr-o", nome: "Operatore", ruolo: "operatore", sedeId: sedeOp.id, colore: "#3B82F6", pinHash: hash("2222") },
  ];
  return s;
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
const apriLente = async (p) => {
  await p.getByRole("button", { name: /Cerca/i }).first().click();
  await p.getByPlaceholder(/Un prodotto o una cosa da fare/).waitFor({ state: "visible", timeout: 30000 });
  await p.waitForTimeout(300);
};
const scrivi = async (p, t) => {
  await p.getByPlaceholder(/Un prodotto o una cosa da fare/).fill(t);
  await p.waitForTimeout(500);
  return (await p.locator(".sc-su").last().innerText()).replace(/\s+/g, " ");
};

/* ═══ 1. LE PAROLE DELLE PERSONE, NON QUELLE DEL MENÙ ═══ */
console.log("\n— 1. si cerca come si parla —");
const A = await entra("Admin", "1234");
await apriLente(A.p);

const prove = [
  ["togli", "Sposta o rimuovi prodotti"],
  ["sposta", "Sposta o rimuovi prodotti"],
  ["soglie", "Soglie per giorno"],
  ["whatsapp", "mandare"],
  ["backup", "Backup"],
  ["pin", "PIN"],
  ["ricetta", "ricette"],
  ["spreco", "Sprechi"],
  ["quanto vale", "valore"],
  ["dove sta", "In quali magazzini sta"],
];
for (const [scritto, atteso] of prove) {
  const t = await scrivi(A.p, scritto);
  ok(new RegExp(atteso, "i").test(t), `«${scritto}» → trova «${atteso}»`);
}

/* senza accenti: chi scrive di fretta non li mette */
const senzaAcc = await scrivi(A.p, "unita");
ok(/Modifica in blocco/i.test(senzaAcc), "«unita» senza accento trova lo stesso «unità di misura»");

/* ═══ 2. LE FUNZIONI STANNO IN CIMA, PRIMA DEI PRODOTTI ═══ */
console.log("\n— 2. l'ordine di quello che esce —");
const misto = await scrivi(A.p, "sposta");
ok(/funzion/i.test(misto), "l'elenco delle funzioni e' etichettato");
ok(misto.indexOf("Sposta o rimuovi") < misto.indexOf("Nessun prodotto")
  || !misto.includes("Nessun prodotto"),
  "chi scrive «sposta» cerca un comando: le funzioni vengono prima");

/* ═══ 3. CI PORTA DAVVERO ═══ */
console.log("\n— 3. non lo dice soltanto: ci porta —");
await scrivi(A.p, "backup");
await A.p.getByRole("button", { name: /^Backup, esportazioni/ }).first().click();
await A.p.waitForTimeout(1400);
const dopo = (await A.p.locator("main").innerText()).replace(/\s+/g, " ");
ok(/Backup|ripristino|Esporta/i.test(dopo),
  "toccando «Backup, esportazioni e ripristino» si arriva in Sistema");
ok(!/Un prodotto o una cosa da fare/.test(await A.p.locator("body").innerText()),
  "e la lente si chiude da sola: non resta davanti");
await A.ctx.close();

/* ═══ 4. NIENTE PORTE CHE NON SI POSSONO APRIRE ═══ */
console.log("\n— 4. un operatore non trova quello che non puo' aprire —");
const O = await entra("Operatore", "2222");
await apriLente(O.p);
const opBackup = await scrivi(O.p, "backup");
ok(!/Backup, esportazioni/i.test(opBackup),
  "l'operatore NON trova «Backup»: e' una sezione da admin, e mostrargliela sarebbe una porta murata");
const opPin = await scrivi(O.p, "pin");
ok(!/Persone, ruoli e PIN/i.test(opPin), "ne' «Persone, ruoli e PIN»");
const opSposta = await scrivi(O.p, "conta");
ok(/Contare quello che c/i.test(opSposta),
  "ma trova quello che gli serve davvero: «Contare quello che c'e'»");
await O.ctx.close();

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
