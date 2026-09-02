/* gen-6.01: le postazioni sono di chi ci lavora.

   CHIESTO DA VALERIO il 1 settembre, parole sue: «non posso ancora
   visualizzare le postazioni nei profili nei quali li assegno, ogni cassa
   deve mandare le domande [comande] solo alle postazioni di appartenenza».

   IL CONTRATTO DI QUESTO BANCO (i nomi si fissano QUI, il codice si adegua):
   · profilo.postazioniIds: [id] — si assegna in Gestione → Profili, per i
     profili NON admin, in un blocco FUORI dal riquadro «Autorizzazioni»
     (assegnare una postazione non e' un permesso: non toglie e non da'
     accesso a niente, dice solo «di solito tu stai qui»);
   · IL PROFILO PROPONE, IL DISPOSITIVO COMANDA: se questo schermo non ha
     mai scelto (chiave localStorage assente) ci si siede alle postazioni
     del profilo; appena qualcuno tocca, il dispositivo prende il comando
     per sempre — il tablet di cucina non deve cambiare sedia perche' ha
     cambiato chi ha fatto il login a meta' servizio;
   · «Torna alle mie postazioni» rimette la scelta del profilo e cancella
     quella del dispositivo;
   · OGNI CASSA MANDA SOLO ALLE SUE: il pannello offre le postazioni della
     PROPRIA sede piu' quelle dichiarate «tutte le sedi»; una postazione di
     un'altra sede non si vede e non si puo' scegliere (l'admin le vede
     tutte, con scritto di quale sede sono);
   · una postazione assegnata a te che sta in un'altra sede NON ti fa vedere
     le comande di quella sede: il filtro della sede resta quello di sempre.

   SCRITTO PRIMA DELLE MODIFICHE. Contro gen-6.00 devono essere ROSSI:
   §1 (fonte), §2 (il blocco nel form), §3 (seduto dal profilo), §4 (torna
   alle mie), §5 (solo le postazioni della mia sede). Sono contro-controlli
   verdi anche su gen-6.00: §4a (il dispositivo comanda) e §6 (le comande
   di un'altra sede non arrivano). */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 90)}`); } };
const giornoDi = (t) => { const d = new Date(t);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const sediOp = base.sedi.filter((x) => x.tipo === "operatore");
if (sediOp.length < 2) throw new Error("banco povero: servono due sedi operatore");
const [sedeA, sedeB] = sediOp;
const lineaA = base.magazzini.find((m) => m.sedeId === sedeA.id && (m.articoli || []).length >= 1);
sedeA.cassaMagId = lineaA.id;

base.listino = [
  { id: "li-fri", nome: "Fritto misto", gruppo: "Fritti", prezzo: 6, attivo: true, varianti: [], distinta: [] },
  { id: "li-piz", nome: "Margherita", gruppo: "Pizze", prezzo: 7, attivo: true, varianti: [], distinta: [] },
];
/* tre postazioni: una di sede A, una di sede B, una «tutte le sedi» */
base.postazioni = [
  { id: "po-fri-a", nome: "Friggitoria A", sedeId: sedeA.id, gruppi: ["Fritti"] },
  { id: "po-piz-b", nome: "Pizzeria B", sedeId: sedeB.id, gruppi: ["Pizze"] },
  { id: "po-tut", nome: "Passe tutte", sedeId: "", gruppi: ["Pizze"] },
];
/* una vendita battuta nella sede A, mezz'ora fa (dentro le 12 ore) */
const t0 = Date.now() - 30 * 60 * 1000;
base.vendite = [{
  id: "vn-a", t: t0, giorno: giornoDi(t0), sedeId: sedeA.id, chi: "Cassa A", n: 1,
  stato: "registrata", metodo: "contanti", totale: 13, scarico: [],
  righe: [{ voceId: "li-fri", nome: "Fritto misto", qty: 1, prezzo: 6, gruppo: "Fritti" },
          { voceId: "li-piz", nome: "Margherita", qty: 1, prezzo: 7, gruppo: "Pizze" }],
}];

const PR = {
  admin: { id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#111", pinHash: hash("1234") },
  /* Marco lavora in sede A e la sua postazione e' la Friggitoria */
  marco: { id: "pr-m", nome: "Marco", ruolo: "operatore", sedeId: sedeA.id, colore: "#3B82F6",
    magazziniIds: [lineaA.id], postazioniIds: ["po-fri-a"], pinHash: hash("3333") },
  /* Nino lavora in sede B e non ha nessuna postazione assegnata */
  nino: { id: "pr-n", nome: "Nino", ruolo: "operatore", sedeId: sedeB.id, colore: "#3B82F6",
    magazziniIds: [], pinHash: hash("4444") },
};

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
/* sedia: null = questo schermo non ha MAI scelto (chiave assente);
   un array = il dispositivo ha gia' scelto (anche se vuoto) */
const apri = async (profili, nome, pin, sedia = null) => {
  const st = JSON.parse(JSON.stringify(base));
  st.profili = profili;
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j, s]) => {
    try {
      localStorage.setItem("scp:tour:v1", "1");
      if (s !== "NESSUNA") localStorage.setItem("scp:comande:v1", s);
    } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, [JSON.stringify(st), sedia === null ? "NESSUNA" : JSON.stringify(sedia)]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1500);
  return { p, ctx };
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");
const stato = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
const laSedia = (p) => p.evaluate(() => localStorage.getItem("scp:comande:v1"));

/* ═══ 1. LA FONTE ═══ */
console.log("\n— 1. la fonte —");
const src = readFileSync("../app/app.jsx", "utf8");
/* 02/09: qui la versione era inchiodata a «gen-6.01». Era giusta il giorno
   del rilascio e SBAGLIATA da quello dopo: al primo rilascio successivo
   (gen-6.02, le aggiunte) e' diventata rossa da sola senza che niente fosse
   rotto — lo stesso rosso che cassa2test aveva gia' insegnato il 1/9, e che
   memoria.json aveva gia' scritto come regola. Quello che questo banco deve
   difendere e' che le postazioni ai profili non tornino indietro: la
   versione non puo' essere PIU' VECCHIA di quella che le ha portate. */
const ver = (src.match(/const VERSIONE = "gen-(\d+)\.(\d+)"/) || []).slice(1).map(Number);
ok(ver.length === 2 && (ver[0] > 6 || (ver[0] === 6 && ver[1] >= 1)),
  `VERSIONE e' gen-${ver.join(".")}: non piu' vecchia di gen-6.01, che ha portato le postazioni ai profili`);
ok(/postazioniIds/.test(src), "il sorgente conosce «postazioniIds»");
/* il campo va salvato dal form dei profili, e MAI per l'admin (come
   magazziniIds: l'admin non porta campi che non gli servono) */
const salva = src.slice(src.indexOf("function FormProfilo"), src.indexOf("function VistaProfili"));
ok(/postazioniIds/.test(salva), "e lo salva FormProfilo");
ok(/ruolo === "admin" \? undefined : /.test(salva) || /ruolo !== "admin"/.test(salva),
  "col ramo che lo lascia fuori dall'admin");

/* ═══ 2. IL BLOCCO NEL FORM DEI PROFILI, FUORI DALLE AUTORIZZAZIONI ═══ */
console.log("\n— 2. si assegna in Gestione → Profili —");
const A = await apri([PR.admin, PR.marco], "Admin", "1234");
await prova("§2", async () => {
  await vaiA(A.p, "Gestione");
  await A.p.getByText("Profili", { exact: true }).first().click(); await A.p.waitForTimeout(800);
  /* 01/09: il PRIMO «Modifica» e' quello dell'Admin, e per l'admin il blocco
     NON deve esserci (non ha sede, non sta a una postazione) — se il banco
     restasse li' misurerebbe la cosa sbagliata. Si apre quello di Marco, e
     l'assenza sull'admin diventa un contro-controllo. */
  await A.p.getByRole("button", { name: /Modifica/ }).first().click(); await A.p.waitForTimeout(800);
  const tAdmin = (await A.p.locator(".fixed.inset-0").last().innerText()).replace(/\s+/g, " ");
  ok(!/Postazioni di cucina/.test(tAdmin),
    "contro-controllo: il profilo Admin NON ha il blocco delle postazioni");
  await A.p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
  await A.p.waitForTimeout(500);
  await A.p.getByRole("button", { name: /Modifica/ }).nth(1).click(); await A.p.waitForTimeout(800);
  const foglio = A.p.locator(".fixed.inset-0").last();
  const t = (await foglio.innerText()).replace(/\s+/g, " ");
  ok(/Marco/.test(t), "è aperto il profilo di Marco (non quello dell'Admin)");
  ok(/[Pp]ostazioni/.test(t), "il foglio del profilo ha il blocco delle postazioni");
  ok(/Friggitoria A/.test(t), "con la Friggitoria A fra le scelte");
  /* fuori dalle Autorizzazioni: il titolo delle postazioni viene PRIMA di
     «Autorizzazioni», che e' l'ultimo riquadro del foglio */
  const iPost = t.search(/[Pp]ostazioni/), iAut = t.search(/Autorizzazioni/);
  ok(iPost >= 0 && iAut >= 0 && iPost < iAut,
    `le postazioni stanno FUORI (e prima) dalle Autorizzazioni — non sono un permesso (pos ${iPost} vs ${iAut})`);
});
await A.ctx.close();

/* ═══ 3. IL PROFILO PROPONE: schermo nuovo, gia' seduto ═══ */
console.log("\n— 3. uno schermo che non ha mai scelto parte dalle postazioni del profilo —");
const M = await apri([PR.marco, PR.admin], "Marco", "3333", null);
await prova("§3", async () => {
  await vaiA(M.p, "Comande");
  const t = await testoDi(M.p);
  ok(!/Scegli la tua postazione/.test(t),
    "non chiede di scegliere: Marco è già seduto alla sua Friggitoria");
  ok(/1× Fritto misto/.test(t), "e vede il fritto della comanda battuta in sede A");
  ok(!/1× Margherita/.test(t) || /senza postazione/.test(t),
    "la Margherita non è sua (la reclama la Pizzeria)");
  ok((await laSedia(M.p)) === null,
    "e il dispositivo NON ha ancora scritto niente: la scelta è ancora del profilo");
});

/* ═══ 4. IL DISPOSITIVO COMANDA, e si può tornare indietro ═══ */
console.log("\n— 4. appena tocchi, comanda il dispositivo —");
await prova("§4", async () => {
  await M.p.getByRole("button", { name: /^Alzati da Friggitoria A/ }).click();
  await M.p.waitForTimeout(600);
  ok((await laSedia(M.p)) === "[]",
    "§4a contro-controllo: alzandosi il dispositivo scrive la sua scelta (vuota) e comanda lui");
  ok(/Scegli la tua postazione/.test(await testoDi(M.p)),
    "e adesso lo schermo è libero, come chi si è alzato davvero");
  ok(await M.p.getByRole("button", { name: "Torna alle mie postazioni" }).isVisible(),
    "c'è la via del ritorno: «Torna alle mie postazioni»");
  await M.p.getByRole("button", { name: "Torna alle mie postazioni" }).click();
  await M.p.waitForTimeout(600);
  ok((await laSedia(M.p)) === null, "che cancella la scelta del dispositivo");
  ok(/1× Fritto misto/.test(await testoDi(M.p)), "e rimette Marco alla sua Friggitoria");
});
await M.ctx.close();

/* ═══ 5. OGNI CASSA ALLE SUE: il pannello offre solo le postazioni della sede ═══ */
console.log("\n— 5. le postazioni delle altre sedi non si vedono nemmeno —");
const N = await apri([PR.nino, PR.admin], "Nino", "4444", null);
await prova("§5", async () => {
  await vaiA(N.p, "Comande");
  const t = await testoDi(N.p);
  ok(!/Friggitoria A/.test(t),
    "Nino (sede B) non vede la Friggitoria della sede A fra le postazioni");
  ok(/Pizzeria B/.test(t), "vede la sua Pizzeria B");
  ok(/Passe tutte/.test(t), "e la postazione dichiarata «tutte le sedi»");
});

/* ═══ 6. CONTRO-CONTROLLO: le comande di un'altra sede non arrivano ═══ */
console.log("\n— 6. una comanda battuta in sede A non compare in sede B —");
await prova("§6", async () => {
  await N.p.getByRole("button", { name: /^Siediti a Pizzeria B/ }).click();
  await N.p.waitForTimeout(700);
  const t = await testoDi(N.p);
  ok(!/1× Margherita/.test(t),
    "la Margherita battuta in sede A NON arriva alla Pizzeria della sede B");
  ok(!/1× Fritto misto/.test(t), "e nemmeno il fritto");
});
await N.ctx.close();

await b.close();
ok(errs.length === 0, "zero errori JavaScript in tutto il giro" + (errs.length ? " — " + errs[0] : ""));
console.log(ko === 0 ? "\npostazionitest: tutti i controlli passati" : `\npostazionitest: ${ko} controlli KO`);
process.exit(ko === 0 ? 0 : 1);
