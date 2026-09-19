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
import { vaiA } from "./navtest.mjs";

const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
/* OGNI RIGA PORTA IL SUO § (gen-6.24). Prima lo portavano solo le eccezioni,
   e l'intestazione della sezione non basta: «— 22c-23c.» ne copre due, e un
   sabotaggio che arrossisce solo una delle due non si distingueva da uno che
   le arrossisce tutte e due. Il § si legge adesso dalla riga rossa. */
let ko = 0, SEZ = "";
const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + (SEZ ? SEZ + " " : "") + m); if (!c) ko++; };
const prova = async (nome, fn) => {
  SEZ = nome;
  try { await fn(); } catch (e) { ok(false, `— eccezione: ${String(e.message).slice(0, 130)}`); }
  SEZ = "";
};

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
  /* ── gen-6.24: IL MESTIERE UNICO CON LA STANZA VUOTA ──
     E' lo stato in cui un profilo si trova DOPO che l'admin ha cancellato la
     postazione (o il magazzino) che gli era assegnato. La demolizione ha
     scoperto che le due cure che avevo scritto erano lo stesso evento con due
     verdetti opposti; la regola nuova e' una sola — il mestiere unico e' del
     PROFILO, non della sua lista — e questi due profili la misurano.
     Su gen-6.23 il predicato guarda la lunghezza, quindi questi due si
     ritrovano la barra PIENA: e' il rosso che questa generazione esiste per
     togliere. */
  postVuoto: { id: "pr-pv", nome: "PostVuoto", ruolo: "operatore", sedeId: FM.id, colore: "#EF4444",
    postazioniIds: [], soloPostazioni: true, pinHash: hash("7777") },
  contVuoto: { id: "pr-cv", nome: "ContVuoto", ruolo: "operatore", sedeId: FM.id, colore: "#14B8A6",
    magazziniIds: [], soloConteggi: true, pinHash: hash("8888") },
  /* L'ADMIN: serve a §30, che misura la cascata della postazione cancellata.
     Prima di gen-6.24 questo banco non ne aveva uno, e infatti §29 e' dovuta
     restare una sentinella sul sorgente. */
  admin: { id: "pr-ad", nome: "Capo", ruolo: "admin", colore: "#0EA5E9", pinHash: hash("9999") },
  /* NIENTE postazioni, niente cassa, niente correzioni: e' il profilo di
     Valerio che «le comande non gliele ho assegnate ma le vede» */
  zero: { id: "pr-ze", nome: "SenzaNiente", ruolo: "operatore", sedeId: FM.id, colore: "#64748B",
    magazziniIds: [linea.id], pinHash: hash("6666") },
};

const srv = await apriServer();
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin, opt = {}) => {
  const st = JSON.parse(JSON.stringify(base));
  st.profili = Object.values(PR);
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(({ j, tour }) => {
    /* gen-6.24: il timbro «tour gia' visto» si puo' NON mettere, perche' §23
       misura proprio il giro guidato che parte DA SOLO al primo accesso. */
    try { if (tour) localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, { j: JSON.stringify(st), tour: opt.tour !== false });
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
  /* ── gen-6.24: UNA SENTINELLA NON SI ACCONTENTA DI UNA FRASE ──
     La controprova della demolizione l'ha COSTRUITO E GIRATO: rimessi i nomi
     in un commento accanto alla riga, questa sezione torna verde; tolta del
     tutto la riga del muro e lasciato solo il commento, dice ancora «ok».
     Verde col muro tolto. Adesso le righe che cominciano per // o per * o per
     /* non contano: il muro dev'essere CODICE. */
  const nonCommento = (l) => !/^\s*(\/\/|\/\*|\*)/.test(l);
  const riga = (src.split("\n").find((l) => nonCommento(l) && l.includes("soloPost") && l.includes("vista !==")) || "");
  ok(!!riga, `il muro nomina il mestiere unico delle postazioni, in CODICE e non in un commento (letto: ${riga.trim().slice(0, 70) || "NIENTE"})`);
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
  const nonCommento = (l) => !/^\s*(\/\/|\/\*|\*)/.test(l);
  const riga = (src.split("\n").find((l) => nonCommento(l) && l.includes("soloCont") && l.includes("vista !==")) || "");
  ok(!!riga, `il muro nomina anche il mestiere unico dei conteggi, in CODICE (letto: ${riga.trim().slice(0, 70) || "NIENTE"})`);
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


/* ═══════════════════════════════════════════════════════════════════════
   gen-6.24 · LA STANZA E' UNA SOLA ANCHE FUORI DALLA BARRA

   PERCHE' QUESTE SEZIONI ESISTONO, e non e' una raffinatezza.
   gen-6.23 ha fatto i due mestieri nuovi su TRE cose — barra, atterraggio,
   muro — e si e' fermata li'. La lente, il tasto «?» e il giro guidato
   continuavano a chiedere «soloCassa?» e a rispondersi di no: cioe' a un
   profilo «solo postazioni» offrivano ancora le porte di un mestiere che non
   e' il suo. Per la Cassa quel lavoro era stato fatto a gen-6.17; ai gemelli
   non l'ho portato. Queste sezioni sono la misura di quel lavoro a meta'.

   ROSSE PER COSTRUZIONE contro gen-6.23: §20, §21, §22, §23, §24.
   CONTRO-CONTROLLI verdi prima e dopo: §20b e §21b (la lente FUNZIONA ancora
   per il suo mestiere e per chi l'interruttore non ce l'ha — senza, basterebbe
   rompere la lente per farle diventare verdi), §25, §26.

   LA PERDITA PIU' GRAVE E' LA PIU' SILENZIOSA. §23 non misura una porta che
   si vede: misura un giro guidato di OTTO passi — «Conta · Ordina · Ricevi»,
   «Dentro un magazzino», «Gestione rapida», «Ordini» — che parte DA SOLO al
   primo accesso e prende per mano un pizzaiolo dentro il mestiere di un
   altro. Nessuno lo tocca: arriva addosso. */

const lente = async (p) => {
  await p.getByRole("button", { name: "Cerca un prodotto o una funzione" }).first().click();
  await p.waitForTimeout(500);
  const campo = p.locator('input[aria-label="Cerca un prodotto o una funzione"]');
  return async (q) => {
    await campo.fill(q); await p.waitForTimeout(480);
    return (await p.locator("body").innerText()).replace(/\s+/g, " ");
  };
};
/* un prodotto vero del seme: serve a §21, dove si misura che le RIGHE dei
   prodotti non vengano offerte. Preso dai dati e non scritto a mano, cosi'
   non diventa rosso il giorno che il seme cambia. */
const PROD = base.prodotti[0].nome;

console.log("\n— 20. la lente non gli apre porte che non sono sue (postazioni) —");
{
  const L = await apri("AllePostazioni", "2222");
  const q = await lente(L.p);
  await prova("§20", async () => {
    const sposta = await q("sposta");
    ok(!/Sposta o rimuovi prodotti/.test(sposta),
      "cercando «sposta» non gli viene offerto «Sposta o rimuovi prodotti»: e' una porta sul muro");
    const scorte = await q("scorte");
    ok(!/Trasferisci le scorte/.test(scorte), "ne' «Trasferisci le scorte»");
    const conta = await q("contare");
    ok(!/Contare quello che c'è/.test(conta),
      "ne' «Contare quello che c'è»: i conteggi sono il mestiere dell'altro interruttore");
    const prod = await q("aggiungi");
    ok(!/Aggiungi più prodotti/.test(prod), "ne' «Aggiungi più prodotti»");
  });
  /* IL CONTRO-CONTROLLO CHE IMPEDISCE IL VERDE PER ASSENZA: se filtrare
     volesse dire spegnere la lente, le quattro misure qui sopra sarebbero
     verdi con la lente rotta. Qui si pretende che per il SUO mestiere la
     lente risponda ancora. */
  await prova("§20b", async () => {
    const com = await q("comande");
    ok(/Le comande in cucina/.test(com),
      "ma la lente NON e' spenta: per il suo mestiere risponde ancora — «Le comande in cucina»");
  });
  await prova("§21", async () => {
    const t = await q(PROD.slice(0, 6));
    ok(!t.includes(PROD),
      `e non gli offre nemmeno le righe dei prodotti (cercato «${PROD.slice(0, 6)}»): ognuna porta un bottone che apre i Magazzini`);
  });
  await L.ctx.close();
}

console.log("\n— 21b. e la stessa lente, a chi l'interruttore non ce l'ha, risponde come prima —");
{
  const M = await apri("MistoPostazioni", "4444");
  const q = await lente(M.p);
  await prova("§21b", async () => {
    const sposta = await q("sposta");
    ok(/Sposta o rimuovi prodotti/.test(sposta),
      "MistoPostazioni ha le stesse postazioni assegnate e la lente gli apre ancora tutto: si dichiara, non si deduce");
    const t = await q(PROD.slice(0, 6));
    ok(t.includes(PROD), `e le righe dei prodotti le vede (${PROD})`);
  });
  await M.ctx.close();
}

console.log("\n— 22. il « ? » non gli propone la Plancia ne' il giro di tutta l'app —");
{
  const L = await apri("AllePostazioni", "2222");
  await prova("§22", async () => {
    await L.p.getByRole("button", { name: "Guida e tutorial" }).first().click();
    await L.p.waitForTimeout(600);
    const t = (await L.p.locator("body").innerText()).replace(/\s+/g, " ");
    ok(!/Plancia: la rete a colpo d'occhio/.test(t),
      "niente «Plancia»: e' una porta che il muro gli chiude subito dopo");
    ok(!/Panoramica completa/.test(t),
      "e niente «Panoramica completa»: racconta un mestiere che non e' il suo");
    ok(/Guida di «Comande»/.test(t),
      "gli resta la guida della SUA stanza, col nome giusto");
  });
  await L.ctx.close();
}

console.log("\n— 23. e il giro guidato non gli parte addosso al primo accesso —");
{
  /* SENZA il timbro «gia' visto»: e' la condizione vera del primo accesso. */
  const L = await apri("AllePostazioni", "2222", { tour: false });
  await prova("§23", async () => {
    const t = (await L.p.locator("body").innerText()).replace(/\s+/g, " ");
    ok(!/Benvenuto!/.test(t) && !/Supply Chain Pro lavora in 3 mosse/.test(t),
      "al primo accesso NON parte la panoramica: otto passi su «Conta · Ordina · Ricevi» addosso a chi fa le pizze");
  });
  await L.ctx.close();
  /* e il contro-controllo: a chi NON ha l'interruttore il giro parte ancora,
     se no basterebbe rompere il tour per far diventare verde la riga sopra */
  const M = await apri("MistoPostazioni", "4444", { tour: false });
  await prova("§23b", async () => {
    const t = (await M.p.locator("body").innerText()).replace(/\s+/g, " ");
    ok(/Benvenuto!/.test(t) || /3 mosse/.test(t),
      "ma il giro guidato NON e' stato spento per tutti: a chi l'interruttore non ce l'ha parte ancora");
  });
  await M.ctx.close();
}

console.log("\n— 24. lo stesso per chi sta solo ai conteggi —");
{
  const C = await apri("AiConteggi", "3333");
  const q = await lente(C.p);
  await prova("§24", async () => {
    const sposta = await q("sposta");
    ok(!/Sposta o rimuovi prodotti/.test(sposta), "la lente non gli apre i magazzini");
    const com = await q("comande");
    ok(!/Le comande in cucina/.test(com), "ne' le comande, che sono il mestiere dell'altro");
    const conta = await q("contare");
    ok(/Contare quello che c'è/.test(conta),
      "ma il SUO mestiere la lente glielo trova ancora: «Contare quello che c'è»");
  });
  await C.ctx.close();
}

console.log("\n— 25-26. e i contro-controlli della Cassa, che non si tocca —");
{
  const K = await apri("SoloCassa", "5555");
  const q = await lente(K.p);
  await prova("§25", async () => {
    const sposta = await q("sposta");
    ok(!/Sposta o rimuovi prodotti/.test(sposta), "chi sta solo in cassa continua a non vedere i magazzini nella lente");
    const batti = await q("battere");
    ok(/Battere una vendita/.test(batti), "e continua a trovare il suo mestiere");
  });
  await prova("§26", async () => {
    await K.p.keyboard.press("Escape").catch(() => {});
    await K.p.waitForTimeout(400);
    const K2 = await apri("SoloCassa", "5555");
    await K2.p.getByRole("button", { name: "Guida e tutorial" }).first().click();
    await K2.p.waitForTimeout(600);
    const t = (await K2.p.locator("body").innerText()).replace(/\s+/g, " ");
    ok(!/Panoramica completa/.test(t) && !/Plancia: la rete/.test(t),
      "e il suo « ? » resta quello di gen-6.17: niente Plancia, niente panoramica");
    await K2.ctx.close();
  });
  await K.ctx.close();
}


/* ═══════════════════════════════════════════════════════════════════════
   gen-6.24 · IL MESTIERE UNICO E' DEL PROFILO, NON DELLA SUA LISTA

   NASCE DA UNA DEMOLIZIONE CHE HA UCCISO IL PRIMO DISEGNO. Avevo scritto due
   cure per due guasti opposti — «cancelli una postazione e il ragazzo resta
   chiuso in una stanza vuota» e «cancelli un magazzino e il profilo si
   riprende tutta l'app» — senza accorgermi che sono LO STESSO EVENTO. I due
   predicati guardavano la LUNGHEZZA della lista: la cascata che curava il
   primo portava la lista a zero e produceva il secondo, e la cura del secondo
   non cambiava un pixel (misurato: barra identica prima e dopo) perche' il
   predicato era gia' falso a lista vuota — rendeva solo la perdita
   irreversibile.

   LA DOMANDA CHE NON AVEVO POSTO: cosa deve vedere un mestiere unico quando la
   sua stanza e' vuota? Le risposte oneste erano due — gli si riapre tutta
   l'app (cioe' gli si REGALANO sezioni che nessuno ha acceso, la deduzione al
   contrario) oppure resta nel suo mestiere e la stanza dice la verita'.
   Scelta la seconda. E non costa una schermata nuova, perche' le due stanze
   vuote dicono gia' cosa manca e chi lo ripara.

   ROSSE PER COSTRUZIONE contro gen-6.23: §27, §28 (il predicato guarda la
   lunghezza, quindi questi due profili si ritrovano la barra PIENA).
   CONTRO-CONTROLLI verdi prima e dopo: §27b (la stanza vuota dice la verita',
   e non e' il muro), §28b. */

console.log("\n— 27. chi resta senza postazioni NON si riprende l'app: resta nel suo mestiere —");
{
  const V = await apri("PostVuoto", "7777");
  await prova("§27", async () => {
    const voci = await barra(V.p);
    const ha = (n) => voci.some((v) => v.toLowerCase().includes(n));
    ok(ha("comande") && voci.length === 1,
      `una voce sola, la sua — barra: ${JSON.stringify(voci)}`);
    ok(!ha("home") && !ha("magazzin") && !ha("ordini") && !ha("conteggi"),
      `e NON gli e' stata regalata nessuna sezione che nessuno ha acceso — barra: ${JSON.stringify(voci)}`);
  });
  /* IL CONTRO-CONTROLLO CHE VALE QUANTO IL ROSSO: restare nel mestiere non
     deve voler dire restare chiusi fuori. La stanza dev'essere ONESTA — deve
     dire cosa manca — e NON il muro, che e' un'altra cosa e non spiega
     niente. */
  await prova("§27b", async () => {
    const t = (await V.p.locator("body").innerText()).replace(/\s+/g, " ");
    ok(!/non è del tuo profilo/i.test(t),
      "ed e' DENTRO le Comande, non davanti al muro");
    ok(/Scegli la tua postazione|Non ci sono ancora postazioni/i.test(t),
      "e la stanza gli dice cosa manca, invece di lasciarlo a guardare il vuoto");
  });
  await V.ctx.close();
}

console.log("\n— 28. e lo stesso per chi resta senza magazzini —");
{
  const V = await apri("ContVuoto", "8888");
  await prova("§28", async () => {
    const voci = await barra(V.p);
    const ha = (n) => voci.some((v) => v.toLowerCase().includes(n));
    ok(ha("conteggi") && voci.length === 1,
      `una voce sola, la sua — barra: ${JSON.stringify(voci)}`);
    ok(!ha("home") && !ha("magazzin") && !ha("ordini"),
      `niente app regalata — barra: ${JSON.stringify(voci)}`);
  });
  await prova("§28b", async () => {
    const t = (await V.p.locator("body").innerText()).replace(/\s+/g, " ");
    ok(!/non è del tuo profilo/i.test(t), "ed e' DENTRO i Conteggi, non davanti al muro");
    ok(/Nessun magazzino linea assegnato/i.test(t),
      "e la stanza gli dice cosa manca e chi lo ripara");
  });
  await V.ctx.close();
}

console.log("\n— 22c-23c. il « ? » e il giro guidato anche per chi sta solo ai conteggi —");
{
  /* SENZA QUESTE DUE, una cura scritta «!soloQui && !soloPost» — cioe' che si
     dimentica i conteggi — farebbe diventare VERDI tutti e dieci i rossi
     mentre un ragazzo «solo conteggi» si prende ancora in faccia il giro di
     otto passi sul mestiere di un altro. Verde per assenza nel cuore della
     prova: l'ha trovato la demolizione, non io. */
  const C = await apri("AiConteggi", "3333");
  await prova("§22c", async () => {
    await C.p.getByRole("button", { name: "Guida e tutorial" }).first().click();
    await C.p.waitForTimeout(600);
    const t = (await C.p.locator("body").innerText()).replace(/\s+/g, " ");
    ok(!/Plancia: la rete a colpo d'occhio/.test(t), "niente «Plancia» nemmeno a lui");
    ok(!/Panoramica completa/.test(t), "e niente «Panoramica completa»");
    ok(/Guida di «Conteggi»/.test(t), "ma la guida della SUA stanza c'e', col nome giusto");
  });
  await C.ctx.close();
  const C2 = await apri("AiConteggi", "3333", { tour: false });
  await prova("§23c", async () => {
    const t = (await C2.p.locator("body").innerText()).replace(/\s+/g, " ");
    ok(!/Benvenuto!/.test(t) && !/3 mosse/.test(t),
      "e al primo accesso il giro guidato non parte nemmeno a lui");
  });
  await C2.ctx.close();
}

console.log("\n— 24d. ma a chi CONTA le righe dei prodotti restano: sono il suo lavoro —");
{
  /* LA DEMOLIZIONE HA UCCISO ANCHE QUESTO PEZZO DEL DISEGNO, e con una misura.
     Spegnere le righe per tutti i mestieri unici sembrava simmetrico: la
     regola pero' era stata scritta per il CASSIERE, che di magazzino non
     chiede niente. Misurato su gen-6.23, a chi conta la lente risponde
     «Patate forno · Linea Pizze fm · previsto 3 gn · 0 gn» — cioe' il
     magazzino, la soglia del giorno e la giacenza: e' il lavoro, non una
     porta. Questa sezione e' il contro-controllo che impedisce di «curare»
     togliendogli il mestiere. Verde PRIMA e DOPO. */
  const C = await apri("AiConteggi", "3333");
  const q = await lente(C.p);
  await prova("§24d", async () => {
    const t = await q(PROD.slice(0, 6));
    ok(t.includes(PROD),
      `chi conta trova ancora il prodotto nella lente (${PROD}): e' il suo mestiere, non una porta su un muro`);
  });
  await C.ctx.close();
}

console.log("\n— 29. l'interruttore gia' acceso non si nasconde mai —");
await prova("§29", async () => {
  /* SENTINELLA SUL SORGENTE, dichiarata come tale (come §3 e §6): la scheda
     del profilo si raggiunge solo da un admin, e questo banco non ne ha uno.
     Il difetto che misura e' reale e l'ha trovato la caccia: con la lista
     vuota l'interruttore spariva dalla scheda, quindi Valerio non lo vedeva e
     NON POTEVA SPEGNERLO. Un interruttore acceso si disegna sempre. */
  const src = readFileSync(process.env.SORGENTE || "app-under-test.jsx", "utf8");
  const nonCommento = (l) => !/^\s*(\/\/|\/\*|\*)/.test(l);
  const righe = src.split("\n").filter(nonCommento);
  const post = righe.find((l) => l.includes("postIds.length > 0") && l.includes("soloPosti"));
  const cont = righe.find((l) => l.includes("magIds.length > 0") && l.includes("soloCont"));
  ok(!!post, `l'interruttore delle postazioni si disegna anche a lista vuota quando e' acceso (letto: ${(post || "NIENTE").trim().slice(0, 60)})`);
  ok(!!cont, `e cosi' quello dei conteggi (letto: ${(cont || "NIENTE").trim().slice(0, 60)})`);
});

/* ═══ 30. LA CASCATA DELLA POSTAZIONE CANCELLATA (gen-6.24) ═══ */
console.log("\n— 30. cancellare una postazione la toglie anche dai profili —");
await prova("§30", async () => {
  /* QUESTA SEZIONE ESISTE PER APRIRE UN MUTO. Il sabotaggio S17 toglie la
     cascata e nessuna schermata se ne accorge: e' corretto che sia cosi',
     perche' da gen-6.24 il mestiere unico non guarda piu' la lunghezza della
     lista, quindi un id morto non accende e non spegne niente a nessuno. Ma
     «invisibile» non vuol dire «inesistente»: l'id resta appeso nel
     documento condiviso, e da li' lo rimette in piedi chiunque ricrei una
     postazione con lo stesso id, o lo conti.
     Allora si misura dove il guasto vive DAVVERO: nel documento. Questo
     banco lo tiene in localStorage sotto «db:», che e' lo stesso posto da cui
     l'app lo legge — non e' una finestra di comodo, e' la sua sorgente. */
  const AD = await apri("Capo", "9999");
  const doc = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("db:scp:stato:v1")));
  const conFri = (d) => (d.profili || []).filter((x) => (x.postazioniIds || []).includes("po-fri")).map((x) => x.nome).sort();
  const prima = conFri(await doc(AD.p));
  ok(prima.length === 2, `di partenza la Friggitoria e' assegnata a 2 profili (letti: ${prima.join(", ") || "nessuno"})`);
  await vaiA(AD.p, "Gestione");
  await AD.p.getByText("Listino", { exact: true }).first().click(); await AD.p.waitForTimeout(1100);
  await AD.p.getByRole("button", { name: "Modifica la postazione Friggitoria" }).click(); await AD.p.waitForTimeout(800);
  await AD.p.getByRole("button", { name: "Togli questa postazione" }).click(); await AD.p.waitForTimeout(700);
  await AD.p.getByRole("button", { name: "Elimina", exact: true }).click(); await AD.p.waitForTimeout(2600);
  const dopo = await doc(AD.p);
  ok(!(dopo.postazioni || []).some((x) => x.id === "po-fri"), "la postazione e' sparita dal documento");
  const resta = conFri(dopo);
  ok(resta.length === 0, `e nessun profilo si tiene l'id morto (ancora appeso a: ${resta.join(", ") || "nessuno"})`);
  /* CONTRO-CONTROLLO: la cascata ripulisce SOLO l'id cancellato. Un profilo
     che non c'entrava niente non deve perdere le sue assegnazioni. */
  const cont = (dopo.profili || []).find((x) => x.id === "pr-co");
  ok((cont?.magazziniIds || []).length === 1, `e non tocca il resto: «AiConteggi» tiene il suo magazzino (${(cont?.magazziniIds || []).length})`);
  await AD.ctx.close();
});

console.log("\n— 12. nessun errore di pagina —");
SEZ = "§12";
ok(errs.length === 0, `nessuna eccezione in pagina${errs.length ? " — " + errs[0].slice(0, 90) : ""}`);

await b.close(); await srv.chiudi();
console.log(ko ? `\nmestiereunicotest: ${ko} CONTROLLI FALLITI` : "\nmestiereunicotest: TUTTI I CONTROLLI PASSATI");
process.exit(ko === 0 ? 0 : 1);
