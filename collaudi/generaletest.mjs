/* IL GIRO COMPLETO — quattro passaggi su tutta l'app.

   Nasce da una richiesta precisa: «verifica che ogni funzione sia al proprio
   posto, funzionante e ben visibile». Guardare le schermate a occhio non
   basterebbe, e non e' un modo di dire: il difetto peggiore trovato oggi era
   un menu' in cui tre voci su sei si vedevano benissimo e non si potevano
   premere. A occhio sembrava perfetto.

   Quindi i passaggi sono quattro, e ognuno risponde a una parola della
   richiesta:

     1. AL PROPRIO POSTO — ogni schermata dichiarata dall'app si raggiunge
        davvero, passando dalla navigazione vera, con OGNI ruolo. Se un ruolo
        non deve vederla, non deve vederla; se deve, deve arrivarci.
     2. FUNZIONANTE — nessun errore di pagina e la schermata ha davvero un
        contenuto, non un guscio vuoto.
     3. BEN VISIBILE — ogni tasto che si vede si deve poter premere: si mette
        il dito al centro e si guarda chi se lo prende. E niente deve sbordare
        a destra sul telefono stretto.
     4. SPIEGATA — il « ? » deve dire qualcosa su QUESTA schermata, non una
        frase generica buona per tutte.

   Il passaggio 3 e' quello che vale di piu', ed e' l'unico che nessun altro
   collaudo faceva in modo sistematico.

   CORREZIONE DEL 2 AGOSTO, dal consiglio di revisione. Qui c'era scritto che il
   passaggio 3 «e' l'unico che avrebbe preso il difetto di stamattina». Non e'
   vero, ed e' il tipo di frase che fa smettere di cercare: quel difetto stava
   dentro «Gestione rapida», che e' una SCHEDA, e questo giro non ne apre
   nessuna delle ~40 che esistono. L'hanno preso bulk2test.mjs e
   lentesempretest.mjs. Il dito al centro di ogni tasto qui si mette solo sulle
   44 schermate di fondo — dove sta meno della meta' del lavoro vero. */
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

/* le schermate come le dichiara l'app, ruolo per ruolo */
const GESTIONE = ["Catalogo", "Analisi", "Storico", "Storico ordini", "Sedi", "Profili", "Accessi", "Sistema"];
const RUOLI = [
  { nome: "Admin", pin: "1234", barra: ["Home", "Magazzini", "Plancia", "Ordini"], gestione: GESTIONE },
  { nome: "Operatore", pin: "2222", barra: ["Home", "Conteggi", "Magazzini", "Plancia", "Ordini"], gestione: [] },
  { nome: "Laboratorio", pin: "3333", barra: ["Home", "Richieste", "Magazzini", "Plancia", "Ordini"], gestione: [] },
];

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const entra = async (r, w, h) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
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
  p.on("pageerror", (e) => errs.push(`${r.nome}: ${e.message}`));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText(r.nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of r.pin) await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1500);
  return { p, ctx };
};

/* ── L'ATTREZZO DEL PASSAGGIO 3, seconda versione ──

   La prima versione diceva 36 tasti morti su 632. Erano TUTTI falsi, e per due
   motivi miei — vale la pena scriverli, perche' un metro che mente e' peggio di
   nessun metro:

   1. Confrontavo il TESTO del tasto con il testo di chi si prendeva il tocco.
      Due tasti con la stessa etichetta si scambiavano, e un tasto il cui centro
      cade su un pezzo non-tasto (un'icona, una riga di testo) risultava morto
      pur essendo suo. Adesso confronto l'IDENTITA': l'elemento sotto il dito
      deve essere il tasto stesso o roba sua dentro.

   2. Usavo scrollIntoViewIfNeeded, che scorre il minimo indispensabile e
      quindi parcheggia il tasto SUL BORDO INFERIORE — cioe' esattamente sotto
      la barra di navigazione che galleggia in basso. Misuravo un tasto messo
      apposta dove nessuno lo userebbe. Adesso lo porto al CENTRO, che e' dove
      finisce quando una persona vera scorre per premerlo.

   Verificato: con queste due correzioni i 36 diventano 0. */
const tastiMorti = async (p) => {
  const morti = []; let provati = 0;
  for (const el of await p.getByRole("button").all()) {
    if (!(await el.isVisible().catch(() => false))) continue;
    await el.evaluate((n) => n.scrollIntoView({ block: "center" })).catch(() => {});
    await p.waitForTimeout(50);
    const esito = await el.evaluate((n) => {
      const r = n.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return null;
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return null;
      const top = document.elementFromPoint(x, y);
      if (!top) return { morto: true, da: "niente" };
      if (top === n || n.contains(top)) return { ok: true };
      const bt = top.closest("button");
      return { morto: true, da: bt ? ((bt.innerText || bt.getAttribute("aria-label") || "?").split("\n")[0]) : top.tagName.toLowerCase(),
        eti: ((n.innerText || n.getAttribute("aria-label") || "?").replace(/\s+/g, " ")).slice(0, 40) };
    }).catch(() => null);
    if (!esito) continue;
    provati++;
    if (esito.morto) morti.push({ eti: esito.eti || "?", suo: String(esito.da).slice(0, 40) });
  }
  return { provati, morti };
};

/* ── e il rischio VERO che quella deviazione ha fatto venire fuori ──
   La barra in basso galleggia SOPRA il contenuto. Se la pagina non lasciasse
   abbastanza spazio in fondo, l'ultimo tasto resterebbe sotto la barra per
   sempre: nessuno scorrimento potrebbe tirarlo fuori. Oggi lo spazio c'e'
   (7rem piu' la tacca), ma e' una riga di stile sola: se salta, se ne accorge
   questo controllo e non l'utente che non riesce a premere «Salva». */
const ultimoRaggiungibile = async (p) => {
  await p.evaluate(() => {
    const m = document.querySelector("main");
    if (m) m.scrollTop = m.scrollHeight;
  });
  await p.waitForTimeout(300);
  return await p.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Navigazione principale"]');
    if (!nav || !nav.offsetParent) return { ok: true, motivo: "niente barra galleggiante" };
    const barra = nav.getBoundingClientRect();
    const tasti = [...document.querySelectorAll("main button")].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 4 && r.height > 4 && r.top < innerHeight && r.bottom > 0;
    });
    if (!tasti.length) return { ok: true, motivo: "nessun tasto in fondo" };
    const ultimo = tasti[tasti.length - 1];
    const r = ultimo.getBoundingClientRect();
    const sotto = r.top > barra.top - 4;
    return { ok: !sotto, eti: (ultimo.innerText || ultimo.getAttribute("aria-label") || "?").replace(/\s+/g, " ").slice(0, 34),
      motivo: sotto ? "resta sotto la barra anche in fondo alla pagina" : "sale sopra la barra" };
  });
};

const sborda = (p) => p.evaluate(() =>
  Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth));

/* ═══════════════════════════════════════════════════════════════════ */
const riepilogo = { schermate: 0, tasti: 0, morti: 0, senzaAiuto: [], vuote: [], sbordano: [], sepolti: [] };

for (const r of RUOLI) {
  console.log(`\n══════ ${r.nome.toUpperCase()} ══════`);
  for (const [w, h, come] of [[390, 844, "telefono"], [1280, 900, "computer"]]) {
    console.log(`\n— ${come} ${w}×${h} —`);
    const { p, ctx } = await entra(r, w, h);
    const tappe = [...r.barra, ...r.gestione];

    for (const dove of tappe) {
      let arrivato = true;
      try { await vaiA(p, dove, 1100); } catch { arrivato = false; }
      ok(arrivato, `«${dove}» si raggiunge dalla navigazione`);
      if (!arrivato) continue;
      riepilogo.schermate++;

      /* 2. c'è davvero qualcosa dentro */
      const testo = (await p.locator("main, body").first().innerText()).replace(/\s+/g, " ").trim();
      if (testo.length < 60) { riepilogo.vuote.push(`${r.nome}/${come}/${dove}`); }

      /* 3a. i tasti si premono */
      const { provati, morti } = await tastiMorti(p);
      riepilogo.tasti += provati;
      riepilogo.morti += morti.length;
      if (morti.length) {
        console.log(`  KO  «${dove}»: ${morti.length} tasti su ${provati} non prendono il tocco`);
        for (const m of morti.slice(0, 4)) console.log(`        «${m.eti}» → lo prende: ${m.suo}`);
        ko++;
      }

      /* 3b. niente sborda a destra */
      const extra = await sborda(p);
      if (extra > 1) riepilogo.sbordano.push(`${r.nome}/${come}/${dove} (+${extra}px)`);

      /* 3c. in fondo alla pagina l'ultimo tasto esce da sotto la barra */
      if (come === "telefono") {
        const u = await ultimoRaggiungibile(p);
        if (!u.ok) riepilogo.sepolti.push(`${r.nome}/${dove}: «${u.eti}» ${u.motivo}`);
      }
    }

    /* 4. il « ? » parla di QUESTA schermata — solo una volta per ruolo */
    if (come === "telefono") {
      for (const dove of tappe) {
        try { await vaiA(p, dove, 900); } catch { continue; }
        const aiuto = p.locator('[data-tour="aiuto"]');
        if (!(await aiuto.count())) { riepilogo.senzaAiuto.push(`${r.nome}/${dove} (niente « ? »)`); continue; }
        await aiuto.first().click().catch(() => {});
        await p.waitForTimeout(700);
        const t = (await p.locator("body").innerText()).replace(/\s+/g, " ");
        /* «spiegata» vuol dire che il pannello nomina la schermata in cui sei */
        const nomina = new RegExp(dove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(t);
        if (!nomina) riepilogo.senzaAiuto.push(`${r.nome}/${dove}`);
        await p.keyboard.press("Escape").catch(() => {});
        await p.waitForTimeout(400);
        const chiudi = p.getByRole("button", { name: "Chiudi" });
        if (await chiudi.count()) await chiudi.first().click().catch(() => {});
        await p.waitForTimeout(300);
      }
    }
    await ctx.close();
  }
}

/* ═══ IL CONTO ═══ */
console.log(`\n════════ RIEPILOGO ════════`);
console.log(`schermate visitate: ${riepilogo.schermate}`);
console.log(`tasti misurati:     ${riepilogo.tasti}`);
ok(riepilogo.morti === 0, `tasti che si vedono ma non si premono: ${riepilogo.morti}`);
ok(riepilogo.vuote.length === 0, `schermate che si aprono vuote: ${riepilogo.vuote.length}`
  + (riepilogo.vuote.length ? " → " + riepilogo.vuote.join(", ") : ""));
ok(riepilogo.sbordano.length === 0, `schermate che sbordano a destra: ${riepilogo.sbordano.length}`
  + (riepilogo.sbordano.length ? " → " + riepilogo.sbordano.slice(0, 6).join(", ") : ""));
ok(riepilogo.sepolti.length === 0, `tasti sepolti sotto la barra in basso: ${riepilogo.sepolti.length}`
  + (riepilogo.sepolti.length ? " → " + riepilogo.sepolti.slice(0, 5).join(" · ") : ""));
ok(riepilogo.senzaAiuto.length === 0, `schermate senza un aiuto che le nomini: ${riepilogo.senzaAiuto.length}`
  + (riepilogo.senzaAiuto.length ? " → " + riepilogo.senzaAiuto.join(", ") : ""));
ok(errs.length === 0, `errori di pagina: ${errs.length}` + (errs.length ? " → " + errs[0] : ""));

await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
