import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

/* ricostruisco la topologia vera: Portuense (laboratorio) + Fm e Rm operative */
const s = JSON.parse(readFileSync("seed-state.json", "utf8"));
const prod = s.prodotti.slice(0, 6);
const art = (n) => prod.slice(0, n).map((p) => ({ prodottoId: p.id, uomId: p.uomBase, qty: 1, par: 2 }));
s.sedi = [
  { id: "sede-po", nome: "Portuense", tipo: "laboratorio" },
  { id: "sede-fm", nome: "Fm", tipo: "operatore", labSedeId: "sede-po" },
  { id: "sede-rm", nome: "Rm", tipo: "operatore", labSedeId: "sede-po" },
];
const perSede = (sg) => [
  { id: "mag-linea-" + sg, nome: "Linea " + sg, tipo: "linea-lab", sedeId: "sede-" + sg, articoli: art(5) },
  { id: "mag-fritti-" + sg, nome: "Linea fritti " + sg, tipo: "linea-lab", sedeId: "sede-" + sg, articoli: art(4) },
  { id: "mag-lsecco-" + sg, nome: "Linea secco " + sg, tipo: "linea-retro", sedeId: "sede-" + sg,
    rifMagazzinoId: "mag-secco-" + sg, articoli: art(3) },
  { id: "mag-lconf-" + sg, nome: "Linea confezionati " + sg, tipo: "linea-retro", sedeId: "sede-" + sg,
    rifMagazzinoId: "mag-secco-" + sg, articoli: art(2) },
  { id: "mag-secco-" + sg, nome: "Secco " + sg, tipo: "retro", sedeId: "sede-" + sg, articoli: art(6) },
  { id: "mag-bev-" + sg, nome: "Bevande " + sg, tipo: "retro", sedeId: "sede-" + sg, articoli: art(3) },
];
s.magazzini = [
  { id: "mag-centrale", nome: "Magazzino centrale", tipo: "laboratorio", sedeId: "sede-po", articoli: art(6) },
  ...perSede("fm"), ...perSede("rm"),
];
s.profili = [
  { id: "pr-admin", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  /* DAL 30 AGOSTO (gen-5.95) la «Plancia» esce dalla barra per chi non ha
     «correzioni»: è un cruscotto di comandi, e senza autorizzazione sarebbe
     una porta su una stanza vuota. Qui la Plancia serve perché è la schermata
     che DISEGNA LA MAPPA della rete, quindi i due profili non-admin hanno la
     spunta accesa (31/08/2026, dal triage del censimento). */
  { id: "pr-gigi", nome: "Gigi", ruolo: "laboratorio", sedeId: "sede-po", colore: "#22B8CF", correzioni: true, pinHash: hash("1111") },
  { id: "pr-op", nome: "Op", ruolo: "operatore", sedeId: "sede-fm", colore: "#E8A13C",
    correzioni: true, magazziniIds: ["mag-linea-fm", "mag-fritti-fm"], pinHash: hash("2222") },
];
s.movimenti = [];

const URL = "file://" + path.resolve("index.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin, file) => {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1100 } });
  await ctx.addInitScript((j) => {
    localStorage.setItem("db:scp:stato:v1", j);
    localStorage.setItem("scp:tour:v1", "1");
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(s));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(1600);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click(); await p.waitForTimeout(160); }
  await p.waitForTimeout(1600);
  await p.getByText("Plancia", { exact: true }).first().click(); await p.waitForTimeout(1500);
  const testo = await p.locator("body").innerText();
  await p.screenshot({ path: file, fullPage: true });
  return { p, ctx, testo };
};

/* ── ADMIN ── */
const A = await apri("Admin", "1234", "rete539-admin.png");
ok(/da Magazzino/.test(A.testo), "le linee dicono «da Magazzino centrale»");
ok(/da Secco fm/.test(A.testo), "le linee del secco dicono «da Secco fm»");
ok(/serve le linee/.test(A.testo), "il laboratorio dice cosa fa");
/* i retro si riforniscono dal fornitore della loro sede: niente freccia dal laboratorio */
const rigaSecco = A.testo.split("Secco fm")[1] || "";
ok(/^\s*da fornitore/.test(rigaSecco), "«Secco fm» riceve dal fornitore → " + rigaSecco.slice(0, 22).trim());
const rigaBev = A.testo.split("Bevande fm")[1] || "";
ok(/^\s*da fornitore/.test(rigaBev), "«Bevande fm» pure → " + rigaBev.slice(0, 22).trim());
const archi = await A.p.evaluate(() => document.querySelectorAll("svg path[stroke-dasharray]").length);
/* 2 sedi x (2 linee dal laboratorio + 2 linee dal secco) = 8 */
ok(archi === 8, "otto collegamenti: lab→linee e secco→linee, nessuno verso i retro · trovati " + archi);
const mappa = A.testo.split("Ogni riquadro")[0] || "";
ok(!/Linea → Lab ·/.test(mappa), "sui riquadri la sigla del tipo ha lasciato il posto al rifornitore");
await A.ctx.close();

/* ── LABORATORIO ── */
const L = await apri("Gigi", "1111", "rete539-lab.png");
ok(/serve le linee/.test(L.testo), "il laboratorio si legge da sé cosa fa");
await L.ctx.close();

/* ── OPERATORE ── */
const O = await apri("Op", "2222", "rete539-op.png");
ok(/da Magazzino/.test(O.testo),
  "l'operatore legge da chi arriva la merce anche se il laboratorio non è in mappa");
ok(/da Secco fm/.test(O.testo), "e per il secco vede il magazzino della sua sede");
const rigaSeccoOp = O.testo.split("Secco fm")[1] || "";
ok(/^\s*da fornitore/.test(rigaSeccoOp), "e vede che il suo Secco lo riempie il fornitore");
await O.ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
