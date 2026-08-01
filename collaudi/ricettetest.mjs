/* gen-5.68: LE RICETTE — quando il laboratorio prepara, gli ingredienti calano.

   Il problema vero, in una riga: fino a ieri, quando in laboratorio si
   facevano venti breccole, l'app faceva salire le breccole e basta. La farina,
   il pecorino e il guanciale finiti dentro restavano ai numeri di prima, e a
   fine settimana il magazzino centrale dichiarava roba che non c'era piu'.

   La scelta di fondo, presa esplicitamente: si scala SOLO da un gesto che dice
   «ho prodotto». Mai da una correzione a mano. Alzare un numero a mano vuol
   dire tante cose — ho ricontato, ne e' arrivata dell'altra, ieri sbagliavo —
   e solo una di quelle e' «l'ho appena fatto». Indovinare quale vorrebbe dire
   scalare farina che nessuno ha usato.

   Qui si prova il giro intero su numeri che si possono verificare a mano:
   ricetta da 20 pezzi, se ne producono 30, quindi 1,5 volte la ricetta. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const PZ = "u-pz", KG = "u-kg";
const scena = () => {
  const s = JSON.parse(JSON.stringify(base));
  const lab = s.sedi.find((x) => x.tipo === "laboratorio");
  const [A, B, C] = s.prodotti;                 // A = il preparato, B e C = ingredienti
  s.prodotti = s.prodotti.map((p) => ({ ...p, uomBase: p.id === A.id ? PZ : KG, conv: {} }));
  const pa = s.prodotti.find((p) => p.id === A.id);
  pa.preparato = true;
  /* 20 pezzi con 1 kg di B e 0,4 kg di C */
  pa.ricetta = { resa: 20, uomResa: PZ, ingredienti: [
    { prodottoId: B.id, qty: 1, uomId: KG },
    { prodottoId: C.id, qty: 0.4, uomId: KG },
  ] };
  /* il magazzino dove si produce, e quello da cui escono gli ingredienti:
     stessa sede, come vuole la regola */
  s.magazzini = [
    { id: "mag-lab", sedeId: lab.id, nome: "Magazzino Laboratorio", tipo: "laboratorio",
      articoli: [{ prodottoId: A.id, uomId: PZ, qty: 5, par: 40 }] },
    { id: "mag-secco", sedeId: lab.id, nome: "Secco laboratorio", tipo: "retro",
      articoli: [
        { prodottoId: B.id, uomId: KG, qty: 10, par: 12 },
        { prodottoId: C.id, uomId: KG, qty: 0.5, par: 3 },   // ce n'e' POCO: serve per il caso «non basta»
      ] },
  ];
  s.ordini = []; s.richieste = []; s.movimenti = []; s.log = [];
  s.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
  return { s, A, B, C };
};
const { A, B, C } = scena();

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
  const q = {};
  for (const m of s.magazzini) for (const a of m.articoli) q[m.id + "|" + a.prodottoId] = a.qty;
  return { q, mov: (s.movimenti || []).map((v) => v.causale + ":" + v.delta),
    log: (s.log || []).map((v) => v.msg || "") };
});

/* ═══ 1. IL TASTO C'È SOLO DOVE HA SENSO ═══ */
console.log("\n— 1. dove compare «Ho prodotto» —");
await vaiA(p, "Magazzini"); await p.waitForTimeout(700);
await p.getByText("Magazzino Laboratorio", { exact: false }).locator("visible=true").first().click();
await p.getByRole("button", { name: /Gestione rapida/ }).waitFor({ state: "visible", timeout: 30000 });
await p.waitForTimeout(400);
ok(await p.getByRole("button", { name: `Ho prodotto ${A.nome}` }).count() > 0,
  `nel magazzino di laboratorio, sul preparato «${A.nome}», il tasto c'e'`);

/* ═══ 2. IL CONTO SI VEDE PRIMA DI CONFERMARE ═══ */
console.log("\n— 2. cosa esce, scritto prima di toccare i numeri —");
await p.getByRole("button", { name: `Ho prodotto ${A.nome}` }).click();
await p.getByText("Quanto ne hai prodotto", { exact: false }).waitFor({ state: "visible", timeout: 30000 });
await p.waitForTimeout(300);
await p.getByPlaceholder("0", { exact: true }).last().fill("30");
await p.waitForTimeout(500);
const anteprima = (await p.locator(".sc-su").last().innerText()).replace(/\s+/g, " ");

ok(/1,5 volte la ricetta|1.5 volte la ricetta/.test(anteprima),
  "dice che sono 1,5 volte la ricetta (30 su una resa di 20)");
ok(new RegExp(`${B.nome}[\\s\\S]{0,40}−1,5 kg|${B.nome}[\\s\\S]{0,40}−1.5 kg`).test(anteprima),
  `«${B.nome}»: 1 kg × 1,5 = 1,5 kg`);
ok(/da «Secco laboratorio»/.test(anteprima),
  "e dice DA DOVE esce, prima di farlo: «Secco laboratorio»");
ok(/10 → 8,5|10 → 8.5/.test(anteprima),
  "col prima e il dopo: 10 → 8,5");
ok(/non ce n'è abbastanza|non bast/i.test(anteprima),
  `e avvisa che di «${C.nome}» non ce n'e' abbastanza (0,5 kg contro 0,6 che servono)`);

/* ═══ 3. SI APPLICA, E I NUMERI TORNANO ═══ */
console.log("\n— 3. i numeri dopo la conferma —");
await p.getByRole("button", { name: /^Ho prodotto$/ }).click();
await p.waitForTimeout(1200);
const d = await leggi();
ok(Math.abs(d.q["mag-lab|" + A.id] - 35) < 1e-6,
  `il preparato sale da 5 a 35 (${d.q["mag-lab|" + A.id]})`);
ok(Math.abs(d.q["mag-secco|" + B.id] - 8.5) < 1e-6,
  `«${B.nome}» scende da 10 a 8,5 (${d.q["mag-secco|" + B.id]})`);
ok(Math.abs(d.q["mag-secco|" + C.id] - (-0.1)) < 1e-6,
  `«${C.nome}» scende da 0,5 a −0,1 (${d.q["mag-secco|" + C.id]}): non si nasconde il buco, si mostra`);

/* ═══ 4. LA TRACCIA ═══ */
console.log("\n— 4. cosa resta scritto —");
ok(d.mov.includes("produzione:30"), "una riga «produzione» da +30 sul preparato");
ok(d.mov.includes("consumo:-1.5"), "una riga «consumo» da −1,5 sull'ingrediente");
ok(d.mov.filter((m) => m.startsWith("consumo")).length === 2, "una per ogni ingrediente, non una sola cumulativa");
ok(d.log.some((m) => /Prodotti .*30.*«/.test(m)), "e lo storico lo racconta: " + (d.log[0] || ""));

/* ═══ 5. SENZA RICETTA NON SI INVENTA NIENTE ═══
   In un contesto NUOVO, non ricaricando questo: lo script d'avvio rimette il
   seme originale a ogni navigazione, quindi un reload riporterebbe indietro la
   ricetta e il controllo proverebbe il contrario di quello che dice. */
console.log("\n— 5. un preparato senza ricetta —");
await ctx.close();
const senzaRic = scena().s;
delete senzaRic.prodotti.find((x) => x.id === A.id).ricetta;
const ctx2 = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
await ctx2.addInitScript((j) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  const m = new Map(); m.set("scp:stato:v1", j);
  window.storage = {
    async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
    async set(k, v) { m.set(k, v); return true; },
    async delete(k) { m.delete(k); return true; },
  };
}, JSON.stringify(senzaRic));
const p2 = await ctx2.newPage();
p2.on("pageerror", (e) => errs.push(e.message));
await p2.goto("file://" + path.resolve("index.html")); await p2.waitForTimeout(1500);
await p2.getByText("Admin", { exact: true }).first().click(); await p2.waitForTimeout(400);
for (const dg of "1234") await p2.getByRole("button", { name: dg, exact: true }).first().click().catch(() => {});
await p2.waitForTimeout(1500);
await vaiA(p2, "Magazzini"); await p2.waitForTimeout(700);
await p2.getByText("Magazzino Laboratorio", { exact: false }).locator("visible=true").first().click();
await p2.getByRole("button", { name: /Gestione rapida/ }).waitFor({ state: "visible", timeout: 30000 });
await p2.getByRole("button", { name: `Ho prodotto ${A.nome}` }).click();
await p2.getByText("Quanto ne hai prodotto", { exact: false }).waitFor({ state: "visible", timeout: 30000 });
await p2.getByPlaceholder("0", { exact: true }).last().fill("10");
await p2.waitForTimeout(500);
const senza = (await p2.locator(".sc-su").last().innerText()).replace(/\s+/g, " ");
ok(/Non c'è una ricetta/.test(senza),
  "lo dice invece di far finta di niente: «Non c'è una ricetta per questo prodotto»");
ok(!/Esce dai magazzini/.test(senza),
  "e non mostra nessun ingrediente da scalare, perche' non ne conosce");
/* e la quantita' sale lo stesso: senza ricetta il gesto resta utile */
await p2.getByRole("button", { name: /^Ho prodotto$/ }).click();
await p2.waitForTimeout(1000);
const d5 = await p2.evaluate(async (aid) => {
  const r = await window.storage.get("scp:stato:v1", true);
  const s = JSON.parse(r.value);
  return { q: s.magazzini.find((m) => m.id === "mag-lab").articoli.find((a) => a.prodottoId === aid).qty,
    secco: s.magazzini.find((m) => m.id === "mag-secco").articoli.map((a) => a.qty) };
}, A.id);
ok(d5.q === 15, `la quantita' sale lo stesso: 5 → ${d5.q}`);
ok(d5.secco[0] === 10 && d5.secco[1] === 0.5,
  "e nessun ingrediente viene toccato: senza ricetta non si indovina niente");

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
