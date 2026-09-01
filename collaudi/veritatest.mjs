/* gen-5.99 «Lingua e verità» — dal piano-veste (gruppo misto + 3 giudici, 31/08).

   Il rilascio R1+R6: le parole dicono il vero e l'identità è da gestionale.
   · LA BUGIA: «in tempo reale» compare 8 volte nel sorgente, e il canale è
     un giro di poll ogni 3-5 secondi. Va a zero: le frasi oneste dicono
     «si allinea da solo in qualche secondo».
   · plurali veri: «1 linee assegnate», «rifornisce 1 sedi operatore».
   · semafori sinceri: niente «A livello» verde su un magazzino VUOTO;
     la copertura bassa in Analisi si chiama «critica», non spunta verde;
     il sottotitolo del magazzino usa il nome BREVE del tipo (via il
     «Magazzino Laboratorio / Magazzino laboratorio» doppio).
   · Home admin: l'allarme (sotto scorta) è la PRIMA carta, non l'ultima.
   · report di giornata a righe con gerarchia (il testo grezzo resta dietro
     «Copia il report», non a schermo).
   · il distruttivo esce dalle liste: «Elimina» del magazzino solo nel
     foglio Modifica; «Rimuovi» della voce di listino e della postazione
     solo nei loro fogli.
   · Ordini onesto col vuoto: se ci sono articoli sotto scorta e nessuna
     riga, il vuoto lo DICE (e la frase nomina il tasto col suo nome vero).
   · identità: bottoni primari in T.blu pieno (via il gradiente), via il
     joypad (Gamepad2) dalla Plancia, scheda «Informazioni e assistenza»
     in Gestione con la versione.

   SCRITTO PRIMA DELLE MODIFICHE: contro gen-5.98 quasi tutto è ROSSO.
   Contro-controlli (verdi anche su 5.98): il magazzino CON scorte sotto
   dice ancora «sotto scorta»; «Copia il report» resta; la Conferma di
   eliminazione resta a due passi. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const prova = async (nome, fn) => { try { await fn(); } catch (e) { ok(false, `${nome} — eccezione: ${String(e.message).slice(0, 90)}`); } };

/* ═══ 1. IL SORGENTE NON MENTE (controlli sul file, non sull'interfaccia) ═══ */
console.log("\n— 1. le parole del sorgente —");
const src = readFileSync("../app/app.jsx", "utf8");
ok((src.match(/tempo reale/gi) || []).length === 0,
  `«tempo reale» non esiste più nel sorgente (trovate ${(src.match(/tempo reale/gi) || []).length})`);
ok((src.match(/Gamepad2/g) || []).length === 0,
  `il joypad (Gamepad2) non esiste più (trovate ${(src.match(/Gamepad2/g) || []).length})`);
ok(/primario: \{ background: T\.blu/.test(src),
  "il bottone primario è T.blu pieno, non un gradiente da template");

const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
/* il banco dei plurali: UNA linea all'operatore, UNA sede al laboratorio */
const lab = base.sedi.find((x) => x.tipo === "laboratorio");
const opSedi = base.sedi.filter((x) => x.tipo === "operatore");
base.sedi = [lab, opSedi[0]];
opSedi[0].labSedeId = lab.id;
base.magazzini = base.magazzini.filter((m) => m.sedeId === lab.id || m.sedeId === opSedi[0].id);
const unaLinea = base.magazzini.find((m) => m.tipo === "linea-lab" && m.sedeId === opSedi[0].id);
/* un magazzino VUOTO per il semaforo sincero */
base.magazzini.push({ id: "mag-vuoto-599", nome: "Cella frigo nuova", tipo: "retro",
  sedeId: opSedi[0].id, articoli: [] });
base.listino = [
  { id: "li-caf", nome: "Caffè", gruppo: "Bar", prezzo: 1.2, aliquota: 10, attivo: true, varianti: [], distinta: [] },
];
base.profili = [
  { id: "pr-a", nome: "Valerio", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") },
  { id: "pr-o", nome: "Sara", ruolo: "operatore", sedeId: opSedi[0].id, colore: "#E8A13C",
    magazziniIds: [unaLinea.id], cassa: true, pinHash: hash("2222") },
  { id: "pr-g", nome: "Gigi", ruolo: "laboratorio", sedeId: lab.id, colore: "#22B8CF", pinHash: hash("1111") },
];

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const errs = [];
const apri = async (nome, pin) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([j]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    localStorage.setItem("db:scp:stato:v1", j);
    window.storage = {
      async get(k) { const v = localStorage.getItem("db:" + k); return v == null ? null : { value: v }; },
      async set(k, v) { localStorage.setItem("db:" + k, v); return true; },
      async delete(k) { localStorage.removeItem("db:" + k); return true; },
    };
  }, [JSON.stringify(base)]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(nome + ": " + e.message));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText(nome, { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of pin) { await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {}); await p.waitForTimeout(130); }
  await p.waitForTimeout(1500);
  return { p, ctx };
};
const testoDi = async (p) => (await p.locator("body").innerText()).replace(/\s+/g, " ");

/* ═══ 2. I PLURALI DICONO IL VERO ═══ */
console.log("\n— 2. i plurali —");
const O = await apri("Sara", "2222");
await prova("§2a", async () => {
  const t = await testoDi(O.p);
  ok(/1 linea assegnata/.test(t) && !/1 linee/.test(t),
    "l'operatrice con una linea legge «1 linea assegnata», non «1 linee»");
});
await O.ctx.close();
const G = await apri("Gigi", "1111");
await prova("§2b", async () => {
  const t = await testoDi(G.p);
  ok(/rifornisce 1 sede operatore/.test(t) && !/1 sedi/.test(t),
    "il laboratorio con una sede legge «rifornisce 1 sede operatore»");
});
await G.ctx.close();

/* ═══ 3. LA HOME DELL'ADMIN: PRIMA CIÒ CHE CHIEDE AZIONE ═══ */
console.log("\n— 3. l'ordine della Home —");
const A = await apri("Valerio", "1234");
await prova("§3", async () => {
  const t = await testoDi(A.p);
  const iAllarme = t.indexOf("sotto scorta"), iSedi = t.indexOf("Sedi in rete");
  ok(iAllarme >= 0 && iSedi >= 0 && iAllarme < iSedi,
    "l'allarme «sotto scorta» viene PRIMA dell'anagrafica «Sedi in rete»");
});

/* ═══ 4. SEMAFORI SINCERI ═══ */
console.log("\n— 4. i semafori —");
await prova("§4", async () => {
  await vaiA(A.p, "Magazzini");
  const t = await testoDi(A.p);
  const dopoVuoto = t.split("Cella frigo nuova")[1] || "";
  ok(/^[^.]{0,80}vuoto/i.test(dopoVuoto), "il magazzino con 0 articoli dice «vuoto», non «A livello»");
  ok(!/Magazzino laboratorio/.test(t),
    "il sottotitolo del tipo usa il nome breve: via il «Magazzino laboratorio» doppio");
  ok(/sotto scorta/.test(t), "contro-controllo: chi È sotto scorta lo dice ancora");
  await vaiA(A.p, "Gestione");
  await A.p.getByText("Analisi", { exact: true }).first().click();
  await A.p.waitForTimeout(1500);
  const ta = await testoDi(A.p);
  ok(/critica/.test(ta), "la copertura bassa si chiama «critica», non spunta verde");
});

/* ═══ 5. ORDINI ONESTO COL VUOTO ═══ */
console.log("\n— 5. Ordini e Home non si contraddicono —");
await prova("§5", async () => {
  await vaiA(A.p, "Ordini");
  const t = await testoDi(A.p);
  if (/Nessun acquisto da fare/.test(t)) {
    ok(/sotto scorta/.test(t.split("Nessun acquisto da fare")[1] || ""),
      "il vuoto ammette gli articoli sotto scorta e spiega la strada");
  } else {
    ok(true, "ci sono righe da ordinare: il vuoto non compare (banco diverso, controllo neutro)");
  }
});

/* ═══ 6. IL DISTRUTTIVO ESCE DALLE LISTE ═══ */
console.log("\n— 6. Elimina dietro la porta giusta —");
await prova("§6", async () => {
  await vaiA(A.p, "Magazzini");
  ok(await A.p.getByRole("button", { name: "Elimina", exact: true }).count() === 0,
    "nell'elenco magazzini nessun «Elimina» a vista");
  await A.p.getByRole("button", { name: "Modifica", exact: true }).first().click();
  await A.p.waitForTimeout(700);
  ok(await A.p.getByRole("button", { name: /Elimina/ }).count() > 0,
    "dentro il foglio Modifica il tasto c'è, con la sua Conferma a valle");
  await A.p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
  await A.p.waitForTimeout(400);
  await vaiA(A.p, "Gestione");
  await A.p.getByText("Listino", { exact: true }).first().click();
  await A.p.waitForTimeout(900);
  ok(await A.p.locator('[aria-label^="Rimuovi "]').count() === 0,
    "nel Listino niente cestini a vista sulle righe (voci e postazioni)");
  await A.p.getByRole("button", { name: "Modifica Caffè" }).click();
  await A.p.waitForTimeout(700);
  ok(/Togli dal listino/.test(await testoDi(A.p)),
    "la voce si toglie da DENTRO il suo foglio, dove si vede cosa si sta togliendo");
  await A.p.getByRole("button", { name: "Chiudi", exact: true }).last().click().catch(() => {});
  await A.p.waitForTimeout(400);
});

/* ═══ 7. INFORMAZIONI E ASSISTENZA ═══ */
console.log("\n— 7. la carta d'identità —");
await prova("§7", async () => {
  await vaiA(A.p, "Gestione");
  const t = await testoDi(A.p);
  ok(/Informazioni/.test(t), "in Gestione c'è la scheda «Informazioni»");
  await A.p.getByText("Informazioni", { exact: true }).first().click();
  await A.p.waitForTimeout(800);
  const ti = await testoDi(A.p);
  ok(/gen-\d+\.\d+/.test(ti), "dice quale versione gira");
  ok(/qualche secondo/.test(ti) && !/tempo reale/.test(ti),
    "e descrive l'allineamento con la frase onesta");
});

/* ═══ 8. IL REPORT DI GIORNATA HA UNA GERARCHIA ═══ */
console.log("\n— 8. il report leggibile —");
await prova("§8", async () => {
  const S = await apri("Sara", "2222");
  await vaiA(S.p, "Cassa");
  await S.p.getByRole("button", { name: "Aggiungi Caffè" }).click(); await S.p.waitForTimeout(300);
  await S.p.getByRole("button", { name: "Incassa", exact: true }).click(); await S.p.waitForTimeout(600);
  await S.p.getByRole("button", { name: "Registra l'incasso", exact: true }).click();
  await S.p.waitForTimeout(1200);
  await S.p.getByRole("button", { name: "Report di giornata" }).click();
  await S.p.waitForTimeout(800);
  const dentro = S.p.locator(".fixed.inset-0").last();
  ok(await dentro.locator("pre").count() === 0,
    "niente blocco da terminale a schermo: righe con gerarchia");
  const t = (await dentro.innerText()).replace(/\s+/g, " ");
  ok(/Totale/.test(t) && /Contanti/.test(t), "totale e metodi si leggono come righe");
  /* l'intestazione della sezione e' resa MAIUSCOLA dal CSS e innerText
     restituisce il testo trasformato (stessa lezione di comandetest) */
  ok(/Scorporo IVA/i.test(t), "lo scorporo IVA c'è ancora, ordinato");
  ok(/Copia il report/.test(t), "contro-controllo: «Copia il report» resta (e copia il testo di sempre)");
  await S.ctx.close();
});
await A.ctx.close();

ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} controlli falliti` : "\ntutti i controlli passati");
process.exit(ko ? 1 : 0);
