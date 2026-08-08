/* gen-5.90: lo stesso conto vero della Plancia, nelle altre cinque schede.

   SCELTO DA VALERIO dalla roadmap, secondo della sua lista. L'avevo trovato io
   il 5 agosto subito dopo gen-5.85, cercando apposta se l'errore della Plancia
   fosse anche altrove: cinque schede di modifica in blocco scrivono «N prodotti
   aggiornati» contando la SELEZIONE, mentre il ciclo dentro muta() salta in
   silenzio quello che non trova piu'.

   E' la stessa finestra di gen-5.85, e da gen-5.80 e' aperta davvero: fra lo
   spuntare e il premere, un altro telefono puo' togliere una riga. Qui il
   riquadro e' piu' piccolo — si lavora dentro un magazzino solo, non su tutta
   la sede — ma la bugia e' identica: l'app dice di aver fatto un lavoro su
   cose che non ha toccato.

   IL §5 E' IL CONTROCONTROLLO: quando c'e' tutto, il messaggio deve restare
   quello di sempre. Un avviso che compare anche quando non e' successo niente
   insegna a ignorare gli avvisi.

   Contro gen-5.89 i §1..§4 devono diventare rossi. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
st.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
const mag = st.magazzini.find((m) => m.tipo === "retro") || st.magazzini[0];
const dest = st.magazzini.find((m) => m.id !== mag.id && m.sedeId === mag.sedeId) || st.magazzini[1];
const [pA, pB, pC] = st.prodotti;
for (const p of [pA, pB, pC]) { delete p.preparato; delete p.ricetta; delete p.soloInteri; }
pA.nome = "Aaa uno"; pB.nome = "Bbb due"; pC.nome = "Ccc tre";
mag.articoli = [
  { prodottoId: pA.id, uomId: pA.uomBase, qty: 5, par: 5 },
  { prodottoId: pB.id, uomId: pB.uomBase, qty: 5, par: 5 },
];
dest.articoli = [];
for (const a of [...mag.articoli]) delete a.parGiorni;
st.richieste = []; st.ordini = []; st.movimenti = []; st.rev = (st.rev || 0) + 1;

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
  /* l'altro telefono: toglie una riga mentre la selezione e' gia' fatta */
  window.__altroTelefono = async (magId, pid) => {
    const s2 = JSON.parse(m.get("scp:stato:v1"));
    const mm = s2.magazzini.find((x) => x.id === magId);
    mm.articoli = mm.articoli.filter((a) => a.prodottoId !== pid);
    s2.rev = (s2.rev || 0) + 1; s2.mtime = Date.now();
    m.set("scp:stato:v1", JSON.stringify(s2));
    await window.storage.set("scp:rev:v1", String(s2.rev));
  };
}, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1400);

const stato = async () => await p.evaluate(async () => await window.__leggi());
const ultimaVoce = async () => ((await stato()).log || [])[0]?.msg || "";
const scheda = () => p.locator(".sc-foglio").last();
const apriMag = async () => {
  const nav = p.getByText("Magazzini", { exact: true });
  for (let i = 0; i < await nav.count(); i++)
    if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
  await p.waitForTimeout(900);
  await p.getByRole("button", { name: new RegExp(mag.nome) }).first().click();
  await p.waitForTimeout(900);
};
const apriDaGestione = async (voce) => {
  await scheda().getByRole("button", { name: /Gestione rapida/i }).first().click();
  await p.waitForTimeout(700);
  await scheda().getByRole("button", { name: voce }).first().click();
  await p.waitForTimeout(800);
};
/* spunta tutte le righe selezionabili della scheda aperta */
const spuntaTutti = async () => {
  const c = scheda().locator('input[type="checkbox"]');
  const n = await c.count();
  for (let i = 0; i < n; i++) await c.nth(i).check().catch(() => {});
  if (!n) {
    const t = scheda().getByText(/Aaa uno|Bbb due/);
    for (let i = 0; i < await t.count(); i++) await t.nth(i).click().catch(() => {});
  }
  await p.waitForTimeout(400);
};

/* ═══ 1. LIVELLO PREVISTO IN BLOCCO ═══ */
console.log("\n— 1. livello previsto in blocco, con una riga tolta nel frattempo —");
await apriMag();
await apriDaGestione(/Livello previsto/i);
await spuntaTutti();
await p.evaluate(async (d) => await window.__altroTelefono(d.mag, d.pid), { mag: mag.id, pid: pB.id });
await p.waitForTimeout(4500);
const campi = scheda().locator("input:not([type='checkbox'])");
await campi.first().fill("9");
await p.waitForTimeout(300);
await scheda().getByRole("button", { name: /^Applica$/ }).first().click();
await p.waitForTimeout(1500);
const v1 = await ultimaVoce();
console.log(`      [storico] «${v1}»`);
ok(/\b1\b/.test(v1) && !/\b2 prodotti\b/.test(v1),
  `dice 1, non 2: conta quelli toccati davvero — «${v1}»`);
ok(/saltat/i.test(v1), "e dice che uno è stato saltato, invece di tacerlo");

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
