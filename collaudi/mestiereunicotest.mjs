/* ── OGNI PROFILO VEDE SOLO CIO' CHE GLI SI ASSEGNA (gen-6.23) ──

   Parole di Valerio, 17 settembre 21:56: «I profili con le postazioni che
   riceveranno le comande della cassa devono vedere solo le comande che gli
   arrivano, non devono vedere anche le altre sezioni come home ecc ecc, ogni
   profilo deve vedere solo cio' che gli si assegna, che faccia parte delle
   postazioni o dei profili conteggio (quindi come la cassa)».

   IL MECCANISMO LO NOMINA VALERIO: «quindi come la cassa». Sono INTERRUTTORI
   ESPLICITI, gemelli di `soloCassa` — NON una deduzione dai permessi. La
   deduzione questa casa l'ha gia' respinta per iscritto (app.jsx:2880-2884):
   dedurre farebbe perdere voci a un profilo senza che nessuno abbia spento
   niente, e §10 qui sotto e' il guardiano di quella regola.

   IL CONTRATTO CHE QUESTO BANCO FISSA — i nomi si fissano QUI:
   · `profilo.soloPostazioni` (vero solo con almeno una postazione assegnata):
     atterra sulle Comande, barra con la sola voce «Comande», tutto il resto
     murato;
   · `profilo.soloConteggi` (vero solo con almeno un magazzino assegnato):
     atterra sui Conteggi, barra con la sola voce «Conteggi»;
   · `profilo.soloCassa` resta com'e' e non si tocca: e' gia' in produzione.
   · si esce col tasto in alto a destra, come per la cassa: nessuna quarta
     voce «Esci» in barra.

   ROSSE PER COSTRUZIONE contro gen-6.23-senza-cura (oggi quei due campi sono
   sconosciuti, vengono ignorati e il profilo si comporta da operatore
   qualunque): §1, §2, §3 (postazioni), §4, §5, §6 (conteggi).

   CONTRO-CONTROLLI, verdi PRIMA e DOPO:
   §10 LO STESSO PROFILO SENZA L'INTERRUTTORE tiene tutte le sue voci — e' la
   regola «non si deduce» resa misurabile;
   §11 `soloCassa` continua a funzionare com'era (tre voci).

   NIENTE DATI VERI. NIENTE RETE VERA. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import crypto from "crypto";
import { apriServer } from "./servi.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 130)}`); } };

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const FM = base.sedi.find((x) => x.tipo === "operatore");
const linea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === FM.id);
if (!linea) throw new Error("banco povero: serve una linea nella sede operatore");
FM.cassaMagId = linea.id;
base.postazioni = [
  { id: "po-fri", nome: "Friggitoria", sedeId: "", gruppi: ["Fritti"] },
  { id: "po-piz", nome: "Pizzeria", sedeId: "", gruppi: ["Pizze"] },
];
base.listino = [
  { id: "li-mar", nome: "Margherita", gruppo: "Pizze", prezzo: 6, attivo: true, varianti: [], distinta: [] },
  { id: "li-sup", nome: "Supplì", gruppo: "Fritti", prezzo: 2, attivo: true, varianti: [], distinta: [] },
];
base.vendite = []; base.giornate = []; base.clienti = []; base.richieste = []; base.ordini = [];

const PR = {
  post: { id: "pr-po", nome: "AllePostazioni", ruolo: "operatore", sedeId: FM.id, colore: "#F59E0B",
    postazioniIds: ["po-fri"], soloPostazioni: true, pinHash: hash("2222") },
  cont: { id: "pr-co", nome: "AiConteggi", ruolo: "operatore", sedeId: FM.id, colore: "#10B981",
    magazziniIds: [linea.id], soloConteggi: true, pinHash: hash("3333") },
  /* LO STESSO PROFILO SENZA L'INTERRUTTORE: il guardiano della regola «non si
     deduce». Ha le postazioni assegnate esattamente come il primo, e proprio
     per questo deve tenere TUTTE le sue voci. */
  misto: { id: "pr-mi", nome: "MistoPostazioni", ruolo: "operatore", sedeId: FM.id, colore: "#3B82F6",
    magazziniIds: [linea.id], postazioniIds: ["po-fri"], pinHash: hash("4444") },
  cassa: { id: "pr-ca", nome: "SoloCassa", ruolo: "operatore", sedeId: FM.id, colore: "#8B5CF6",
    magazziniIds: [linea.id], cassa: true, soloCassa: true, pinHash: hash("5555") },
  /* NIENTE postazioni, niente cassa, niente correzioni: e' il profilo di
     Valerio che «le comande non gliele ho assegnate ma le vede» */
  zero: { id: "pr-ze", nome: "SenzaNiente", ruolo: "operatore", sedeId: FM.id, colore: "#64748B",
    magazziniIds: [linea.id], pinHash: hash("6666") },
};

const srv = await apriServer();
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin) => {
  const st = JSON.parse(JSON.stringify(base));
  st.profili = Object.values(PR);
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript((j) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, JSON.stringify(st));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto(srv.url); await p.waitForTimeout(1400);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1700);
  return { p, ctx };
};
const barra = (p) => p.evaluate(() => [...document.querySelectorAll('nav[aria-label="Navigazione principale"] button, nav[aria-label="Navigazione principale"] a')]
  .map((x) => x.textContent.trim()).filter(Boolean));
const testo = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");

/* ═══ 1-3. CHI STA ALLE POSTAZIONI ═══ */
const P = await apri("AllePostazioni", "2222");
console.log("\n— 1. chi sta alle postazioni ATTERRA sulle comande —");
await prova("§1", async () => {
  const t = await testo(P.p);
  ok(!/Inizia conteggio/i.test(t), "non ha davanti la Home con «Inizia conteggio»");
  ok(!/Buonasera|Buongiorno/i.test(t), "e nemmeno il saluto della Home: e' gia' al suo posto di lavoro");
  /* ── QUESTA RIGA NASCE DA UN MUTO, E VA SPIEGATA (gen-6.23) ──
     Le due misure qui sopra dicono «NON e' sulla Home». E' piu' debole di
     quanto sembri: se l'atterraggio fosse sbagliato, il MURO intercetterebbe
     comunque la vista e mostrerebbe «questa sezione non e' del tuo profilo» —
     niente saluto, niente «Inizia conteggio», e le due misure resterebbero
     VERDI su un difetto vero. L'ha scoperto il sabotaggio S5 uscendo muto.
     Serve una misura POSITIVA: dove sei, non dove non sei. */
  ok(!/non è del tuo profilo/i.test(t),
    "e soprattutto NON e' davanti al muro: e' atterrato DENTRO le Comande, non in una stanza chiusa");
});
console.log("\n— 2. la sua barra ha una voce sola: Comande —");
await prova("§2", async () => {
  const voci = await barra(P.p);
  const ha = (n) => voci.some((v) => v.toLowerCase().includes(n));
  ok(ha("comande"), `c'e' «Comande» — barra: ${JSON.stringify(voci)}`);
  ok(!ha("home") && !ha("conteggi") && !ha("magazzin") && !ha("ordini"),
    `e NON ci sono Home, Conteggi, Magazzini, Ordini — barra: ${JSON.stringify(voci)}`);
  ok(!ha("esci"), "nessuna voce «Esci» in barra: l'uscita e' quella in alto, come per la cassa");
  ok(voci.length === 1, `una voce esatta, non due — ne trovo ${voci.length}`);
});
console.log("\n— 3. e il muro vale anche per le porte di domani —");
await prova("§3", async () => {
  /* SENTINELLA SUL SORGENTE, dichiarata: il muro di `contenuto()` e' di
     riserva — oggi nessun bottone ci porta, quindi dallo schermo non e'
     provabile. E' la stessa scelta di cassa617test §14. */
  const src = readFileSync(process.env.SORGENTE || "app-under-test.jsx", "utf8");
  const riga = (src.split("\n").find((l) => l.includes("soloPost") && l.includes("vista !==")) || "");
  ok(!!riga, `il muro nomina il mestiere unico delle postazioni (letto: ${riga.trim().slice(0, 70) || "NIENTE"})`);
});
await P.ctx.close();

/* ═══ 4-6. CHI STA AI CONTEGGI ═══ */
const C = await apri("AiConteggi", "3333");
console.log("\n— 4-5. chi sta ai conteggi atterra sui conteggi, e ha una voce sola —");
await prova("§4", async () => {
  const t = await testo(C.p);
  ok(!/Buonasera|Buongiorno/i.test(t), "non parte dalla Home");
  /* stessa lezione di §1: senza questa, il muro terrebbe verde un atterraggio
     sbagliato */
  ok(!/non è del tuo profilo/i.test(t),
    "ed e' atterrato DENTRO i Conteggi, non davanti al muro");
});
await prova("§5", async () => {
  const voci = await barra(C.p);
  const ha = (n) => voci.some((v) => v.toLowerCase().includes(n));
  ok(ha("conteggi"), `c'e' «Conteggi» — barra: ${JSON.stringify(voci)}`);
  ok(!ha("home") && !ha("magazzin") && !ha("ordini") && !ha("comande"),
    `e NON c'e' nient'altro — barra: ${JSON.stringify(voci)}`);
  ok(voci.length === 1, `una voce esatta — ne trovo ${voci.length}`);
});
await prova("§6", async () => {
  const src = readFileSync(process.env.SORGENTE || "app-under-test.jsx", "utf8");
  const riga = (src.split("\n").find((l) => l.includes("soloCont") && l.includes("vista !==")) || "");
  ok(!!riga, `il muro nomina anche il mestiere unico dei conteggi (letto: ${riga.trim().slice(0, 70) || "NIENTE"})`);
});
await C.ctx.close();

/* ═══ 10-11. I CONTRO-CONTROLLI ═══ */
const M = await apri("MistoPostazioni", "4444");
console.log("\n— 10. lo stesso profilo SENZA l'interruttore tiene tutte le sue voci —");
await prova("§10", async () => {
  const voci = await barra(M.p);
  const ha = (n) => voci.some((v) => v.toLowerCase().includes(n));
  ok(ha("home") && ha("conteggi") && ha("magazzin") && ha("ordini"),
    `ha ancora Home, Conteggi, Magazzini e Ordini — barra: ${JSON.stringify(voci)}`);
  ok(voci.length >= 4,
    `avere le postazioni assegnate NON toglie niente da solo: i permessi si dichiarano, non si deducono (${voci.length} voci)`);
});
await M.ctx.close();

console.log("\n— 7. le Comande compaiono solo a chi le postazioni sono ASSEGNATE —");
await prova("§7", async () => {
  /* Parole di Valerio, 17 settembre: «al profilo non ho assegnato le comande
     ma le vede». Era la regola di gen-5.98: il posto lasciato vuoto dalla
     Plancia andava alla cucina SENZA chiedere niente. Qui si misura la regola
     nuova, nei due versi: MistoPostazioni le postazioni le ha (e le Comande le
     vede), SenzaNiente non le ha (e non le vede). Un verso solo non
     proverebbe niente: direbbe «non c'e'» senza dire «quando c'e' si vede». */
  const M2 = await apri("MistoPostazioni", "4444");
  const conPost = await barra(M2.p);
  await M2.ctx.close();
  const Z = await apri("SenzaNiente", "6666");
  const senzaPost = await barra(Z.p);
  await Z.ctx.close();
  ok(conPost.some((v) => /comande/i.test(v)),
    `con le postazioni assegnate le Comande ci sono — barra: ${JSON.stringify(conPost)}`);
  ok(!senzaPost.some((v) => /comande/i.test(v)),
    `senza postazioni assegnate le Comande NON ci sono — barra: ${JSON.stringify(senzaPost)}`);
  ok(senzaPost.some((v) => /conteggi/i.test(v)) && senzaPost.some((v) => /magazzin/i.test(v)),
    `e quello che gli resta assegnato ce l'ha ancora: quattro voci vanno benissimo (${senzaPost.length})`);
});

const K = await apri("SoloCassa", "5555");
console.log("\n— 11. e «Sta solo in cassa» continua a fare quello che faceva —");
await prova("§11", async () => {
  const voci = await barra(K.p);
  const ha = (n) => voci.some((v) => v.toLowerCase().includes(n));
  ok(ha("battere") && ha("clienti") && ha("giornata"), `Battere, Clienti, Giornata — barra: ${JSON.stringify(voci)}`);
  ok(voci.length === 3, `tre voci esatte — ne trovo ${voci.length}`);
});
await K.ctx.close();

console.log("\n— 12. nessun errore di pagina —");
ok(errs.length === 0, `nessuna eccezione in pagina${errs.length ? " — " + errs[0].slice(0, 90) : ""}`);

await b.close(); await srv.chiudi();
console.log(ko ? `\nmestiereunicotest: ${ko} CONTROLLI FALLITI` : "\nmestiereunicotest: TUTTI I CONTROLLI PASSATI");
process.exit(ko === 0 ? 0 : 1);
