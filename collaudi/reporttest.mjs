/* IL REPORT CHE SI MANDA AL FORNITORE.

   Era una sonda: apriva la finestra, stampava «report modal: true» e usciva
   col verde. Diceva soltanto che qualcosa si era aperto — non cosa c'era
   scritto dentro. E quello che c'e' scritto dentro e' l'unica cosa che conta:
   quel testo finisce su WhatsApp e diventa un ordine vero. Se sbaglia una
   quantita', arriva merce sbagliata.

   Quindi adesso controllo il contenuto, e in particolare la promessa scritta
   nella finestra stessa: «Solo le righe da ordinare». Metto in mezzo una riga
   gia' ordinata, che NON deve comparire: e' il controllo che vale di piu',
   perche' un doppio ordine e' merce pagata due volte. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const forn = st.fornitori[0].id;
const sedeOp = st.sedi.find((s) => s.tipo === "operatore").id;
/* quattro da ordinare, con quantita' che NON seguono l'ordine alfabetico:
   cosi' se un giorno l'app cambiasse criterio me ne accorgo */
const quattro = st.prodotti.slice(0, 4);
const QTY = [3, 12, 10, 6];
/* piu' una quinta gia' ordinata: la trappola */
const gia = st.prodotti[4];
const simbolo = (id) => st.unita.find((u) => u.id === id)?.simbolo || "";
const cat = (p) => st.categorie.find((c) => c.id === p.categoriaId)?.nome || "";

st.ordini = quattro.map((p, i) => ({
  id: "ord-test" + i, t: Date.now(), tipo: "diretto", sedeId: sedeOp,
  prodottoId: p.id, fornitoreId: forn, qty: QTY[i], uomId: p.uomBase, stato: "da-ordinare",
}));
st.ordini.push({
  id: "ord-gia", t: Date.now(), tipo: "diretto", sedeId: sedeOp,
  prodottoId: gia.id, fornitoreId: forn, qty: 99, uomId: gia.uomBase, stato: "ordinato",
});
/* LA SECONDA TRAPPOLA, ed è quella che costa. Un prodotto marcato «lo fa il
   laboratorio» può avere addosso una riga «da ordinare» più VECCHIA della
   spunta: è nata quando ancora si comprava, e sparisce solo al «Ricalcola»
   successivo. Nel frattempo finiva dritta nel testo mandato al fornitore —
   cioè si ordinava fuori una cosa che ci si fa da soli. */
const prep = st.prodotti[5];
prep.preparato = true;
st.ordini.push({
  id: "ord-prep", t: Date.now(), tipo: "diretto", sedeId: sedeOp,
  prodottoId: prep.id, fornitoreId: forn, qty: 44, uomId: prep.uomBase, stato: "da-ordinare",
});
/* IL CONTROCANTO: una riga «lab» NON va filtrata. Quelle sono gli acquisti
   DEL laboratorio a un fornitore vero, non le richieste AL laboratorio (che
   stanno in un elenco a parte). Senza questo controllo, una correzione fatta
   con la mano pesante toglierebbe dal report ordini veri, e nessuno se ne
   accorgerebbe finché non manca la merce. */
const lab = st.prodotti[6];
st.ordini.push({
  id: "ord-lab", t: Date.now(), tipo: "lab", sedeId: sedeOp,
  prodottoId: lab.id, fornitoreId: forn, qty: 21, uomId: lab.uomBase, stato: "da-ordinare",
});
st.rev = (st.rev || 0) + 1;

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.addInitScript((s) => {
  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
  const m = new Map(); m.set("scp:stato:v1", s);
  window.storage = {
    async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
    async set(k, v) { m.set(k, v); return true; },
    async delete(k) { m.delete(k); return true; },
  };
}, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);
const nav = p.getByText("Ordini", { exact: true }); const n = await nav.count();
for (let i = 0; i < n; i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(700);
/* ═══ 0. «DA MANDARE ADESSO» ═══
   E' l'altra porta da cui esce testo verso un fornitore, ed e' quella che si
   usa di piu': la scheda verde in cima a Ordini, col tasto WhatsApp. Va provata
   PRIMA di aprire il report, perche' sta sulla pagina sotto. */
await p.getByRole("button", { name: /^Vedi il testo$/ }).first().click();
await p.waitForTimeout(600);
/* il riquadro e' una textarea, e il suo valore e' ESATTAMENTE quello che
   finisce negli appunti e su WhatsApp: i tasti «Copia» e «WhatsApp» mandano
   quella stessa stringa. Leggere la pagina intera non servirebbe — i nomi
   compaiono anche nell'elenco sotto, che e' un'altra cosa. */
const daMandare = await p.locator("textarea").first().inputValue();
ok(daMandare.includes(quattro[0].nome),
  "nel testo da mandare ci sono le righe da comprare");
ok(!daMandare.includes(prep.nome),
  `«${prep.nome}» e' fatto in casa: non entra nemmeno qui, che e' il testo che finisce su WhatsApp`);
ok(daMandare.includes(lab.nome),
  `«${lab.nome}» invece c'e': il laboratorio quello lo compra davvero`);
await p.getByRole("button", { name: /^Nascondi il testo$|^Vedi il testo$/ }).first().click().catch(() => {});
await p.waitForTimeout(400);

await p.getByRole("button", { name: /Report ordine/i }).click();
await p.getByText("Report ordine da inviare", { exact: false }).first()
  .waitFor({ state: "visible", timeout: 30000 });
await p.waitForTimeout(400);
await p.screenshot({ path: "report.png", fullPage: false });

/* la finestra e' l'ultimo pezzo di pagina: taglio da li' in giu' e leggo
   solo quello, cosi' non conto per buone le righe che stanno dietro */
const tutto = (await p.locator("body").innerText());
const modale = tutto.slice(tutto.indexOf("Report ordine da inviare")).replace(/\s+/g, " ");

ok(tutto.includes("Report ordine da inviare"), "la finestra si apre");

/* ── 1. le quattro righe da ordinare, ognuna con la SUA quantita' ── */
for (let i = 0; i < 4; i++) {
  const atteso = `${quattro[i].nome} ${QTY[i]} ${simbolo(quattro[i].uomBase)}`;
  ok(modale.includes(atteso), `«${atteso}»: prodotto e quantita' stanno attaccati`);
}

/* ── 2. LA TRAPPOLA: la riga gia' ordinata non deve esserci ── */
ok(!modale.includes(gia.nome),
  `«${gia.nome}» era gia' ordinato e resta fuori: rimandarlo sarebbe merce pagata due volte`);
ok(!modale.includes("99"), "e nemmeno la sua quantita' compare da qualche parte");

/* ── 2b. IL PREPARATO: non si ordina a nessuno ── */
ok(!modale.includes(prep.nome),
  `«${prep.nome}» lo fa il laboratorio: la sua riga vecchia NON finisce dal fornitore`);
ok(!modale.includes("44"), "ne' la sua quantita': comprarlo fuori sarebbe pagare una cosa che ci si fa in casa");

/* ── 2c. MA la riga «lab» ci deve stare: e' un acquisto vero ── */
ok(modale.includes(lab.nome) && modale.includes("21"),
  `«${lab.nome}» invece resta: una riga «lab» e' il laboratorio che compra da un fornitore vero`);

/* ── 3. raggruppate per categoria, come promette la finestra ── */
const categorie = [...new Set(quattro.map(cat))];
for (const c of categorie) ok(modale.includes(c), `la categoria «${c}» fa da titolo`);
ok(await p.getByRole("button", { name: "Copia tutto", exact: true }).isVisible(),
  "c'e' il tasto per copiare tutto in blocco");
ok(await p.getByRole("button", { name: /Invia su WhatsApp/ }).last().isVisible(),
  "e quello per mandarlo su WhatsApp");

/* ── 4. l'ordine delle righe: alfabetico, non per quantita' ──
   Non e' un dettaglio: il fornitore legge la lista dall'alto, e alfabetico
   e' l'unico ordine che resta stabile fra un ordine e l'altro. */
const posizioni = quattro.map((q) => ({ nome: q.nome, i: modale.indexOf(q.nome) }))
  .sort((a, b) => a.i - b.i).map((x) => x.nome);
const alfabetico = [...quattro.map((q) => q.nome)].sort((a, b) => a.localeCompare(b, "it"));
ok(JSON.stringify(posizioni) === JSON.stringify(alfabetico),
  "le righe sono in ordine alfabetico: " + posizioni.join(", "));

ok(errs.length === 0, "nessun errore di pagina" + (errs.length ? ": " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
