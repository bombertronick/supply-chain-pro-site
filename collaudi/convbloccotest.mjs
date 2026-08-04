/* gen-5.82: le conversioni si assegnano in blocco, ma solo dove hanno senso.

   CHIESTO DA VALERIO: «mi serve la possibilita' di poter assegnare
   conversioni in blocco, in questo modo sara' completo il processo di
   modifica in blocco».

   IL RISCHIO, detto prima di scrivere una riga. Una conversione dice «uno di
   questo vale N di quello», e il «quello» e' l'unita' BASE del singolo
   prodotto. Scrivere «1 cassa = 6 kg» su un prodotto la cui base e' «pz» non
   da' un errore: da' un numero sbagliato, in silenzio, su tutta la selezione.
   Si scopre mesi dopo, quando un ordine arriva sballato — ed e' la specie di
   danno che una modifica in blocco puo' fare in un secondo su cento prodotti.

   Per questo l'unita' base si sceglie e fa da FILTRO, e chi resta fuori viene
   contato a schermo PRIMA di premere.

   IL §3 E' IL CONTROCONTROLLO, ed e' l'unica ragione per cui questa funzione
   puo' esistere: i prodotti con un'altra base devono restare intatti. Se
   fallisce lui, la funzione va tolta, non aggiustata.

   Numeri veri dal catalogo di produzione, il 4 agosto: 62 prodotti su 102
   senza nessuna conversione, e 40 di quei 62 hanno tutti la stessa base
   («conf»). Una passata sola ne sistema quaranta — e' li' che questa cosa
   paga. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
st.profili = [{ id: "pr-a", nome: "Admin", ruolo: "admin", colore: "#8A63F4", pinHash: hash("1234") }];
const uKg = st.unita.find((u) => u.simbolo === "kg") || st.unita[0];
const uPz = st.unita.find((u) => u.simbolo === "pz") || st.unita[1];
/* «cassa» va creata se non c'e': il ripiego «prendi la terza unita'» pescava
   il CHILO, cioe' la stessa di uKg — e allora «uno di questa vale N di
   quella» diventava «un chilo vale N chili», che l'app rifiuta giustamente.
   Il collaudo misurava il rifiuto e lo scambiava per un difetto. */
let uCassa = st.unita.find((u) => u.simbolo === "cassa");
if (!uCassa) { uCassa = { id: "u-cassa-prova", nome: "Cassa", simbolo: "cassa" }; st.unita.push(uCassa); }
if (uCassa.id === uKg.id) throw new Error("banco di prova rotto: «cassa» e «kg» sono la stessa unita'");

/* tre col chilo per base, due col pezzo: la selezione li prende TUTTI, e la
   correzione deve saper distinguere da sola */
const [k1, k2, k3, z1, z2] = st.prodotti;
k1.nome = "Pomodori"; k2.nome = "Cipolle"; k3.nome = "Carote";
z1.nome = "Piatti"; z2.nome = "Tovaglioli";
for (const p of [k1, k2, k3]) { p.uomBase = uKg.id; p.conv = {}; delete p.convStim; }
for (const p of [z1, z2]) { p.uomBase = uPz.id; p.conv = {}; delete p.convStim; }
/* «Carote» ce l'ha gia', e sbagliata: serve a provare che senza la spunta non
   viene toccata, e con la spunta si'. Ed e' marcata come stima dell'app. */
k3.conv = { [uCassa.id]: 99 }; k3.convStim = [uCassa.id];
st.rev = (st.rev || 0) + 1;

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
}, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: true }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);
await vaiA(p, "Catalogo");

const leggi = async (nome) => (await p.evaluate(async () => await window.__leggi()))
  .prodotti.find((x) => x.nome === nome);

const apriBlocco = async () => {
  await p.getByRole("button", { name: /^Prodotti/ }).first().click().catch(() => {});
  await p.waitForTimeout(500);
  await p.getByRole("button", { name: /blocco|Modifica in blocco/i }).first().click();
  await p.waitForTimeout(700);
};
/* si preme la RIGA (che e' un tasto), non il testo dentro: puntare il testo
   pescava un altro elemento e la selezione restava vuota — col risultato che
   il collaudo diceva «0 prodotti» credendo di averne scelti cinque */
const scegli = async (nomi) => {
  for (const n of nomi) {
    await p.locator(".sc-foglio").last().locator("button").filter({ hasText: n }).first().click();
    await p.waitForTimeout(200);
  }
};
/* e si controlla che la scelta sia davvero entrata, se no tutto il resto
   misura il vuoto */
const quantiScelti = async () => {
  const t = await p.locator(".sc-foglio").last().innerText();
  const m = t.match(/Applica a\s*(\d+)/);
  return m ? +m[1] : 0;
};

/* ═══ 1. LA VOCE C'È ═══ */
console.log("\n— 1. fra le cose modificabili in blocco c'e' la conversione —");
await apriBlocco();
ok(await p.getByText("Modifica prodotti in blocco").count() > 0, "la scheda del blocco si apre");
const scelte = p.locator(".sc-foglio").last().getByLabel("Cosa vuoi cambiare");
await scelte.selectOption({ label: "Conversione · quanto vale un'unità" });
await p.waitForTimeout(500);
ok(await p.getByLabel("Uno di questa…").count() > 0, "e compaiono i tre campi «uno di questa vale N di quella»");

/* ═══ 2. PRIMA DI PREMERE SI VEDE A CHI ARRIVA ═══ */
console.log("\n— 2. il conto di chi la riceve si vede prima di premere —");
await scegli(["Pomodori", "Cipolle", "Carote", "Piatti", "Tovaglioli"]);
/* si sceglie per identificatore, non per etichetta: un ripiego «prendi la
   prima» sceglierebbe un'unita' a caso e il collaudo misurerebbe altro —
   ed e' quello che al primo giro faceva dire «3 prodotti» invece di 2 */
await p.getByLabel("Uno di questa…").selectOption(uCassa.id);
await p.getByLabel("…vale").fill("6");
await p.getByLabel("di questa, che è la base").selectOption(uKg.id);
await p.waitForTimeout(500);
const avviso = (await p.locator(".sc-foglio").last().innerText()).replace(/\n/g, " ");
ok(/restano fuori perché la loro\s*unità base non è/i.test(avviso),
  "dice che qualcuno resta fuori, e perché");
/* i numeri esatti: 3 col chilo per base, ma «Carote» ce l'ha gia' e senza la
   spunta non si tocca -> se ne scrivono 2; i due col pezzo restano fuori */
ok(/Si scrive su\s*2\b/.test(avviso.replace(/\s+/g, " ")),
  `e sono 2, non 3: «Carote» ce l'ha già — «${(avviso.match(/Si scrive su[^·]*/) || ["?"])[0].trim()}»`);
ok(/\b2\b[^·]*restano fuori/.test(avviso.replace(/\s+/g, " ")),
  "e i due col pezzo per base sono contati fuori");

/* ═══ 3. IL CONTROCONTROLLO: CHI HA UN'ALTRA BASE NON SI TOCCA ═══
   E' l'unica ragione per cui questa funzione puo' esistere. Se cade lui, la
   funzione va tolta: scriverebbe numeri sbagliati su cento prodotti in un
   secondo, senza dirlo. */
console.log("\n— 3. chi ha un'altra unità base resta intatto —");
await p.getByRole("button", { name: /Applica|Salva|Aggiorna/ }).last().click();
await p.waitForTimeout(1200);
const pom = await leggi("Pomodori"), cip = await leggi("Cipolle");
const pia = await leggi("Piatti"), tov = await leggi("Tovaglioli");
ok(pom?.conv?.[uCassa.id] === 6, `«Pomodori» (base kg) ha 1 cassa = 6 kg (${JSON.stringify(pom?.conv)})`);
ok(cip?.conv?.[uCassa.id] === 6, `«Cipolle» (base kg) pure (${JSON.stringify(cip?.conv)})`);
ok(!pia?.conv || pia.conv[uCassa.id] == null,
  `«Piatti» (base pz) NON è stato toccato (${JSON.stringify(pia?.conv)})`);
ok(!tov?.conv || tov.conv[uCassa.id] == null,
  `e nemmeno «Tovaglioli» (${JSON.stringify(tov?.conv)})`);

/* ═══ 4. QUELLA CHE C'ERA GIÀ NON SI SCHIACCIA SENZA DIRLO ═══ */
console.log("\n— 4. una conversione già scritta non si sovrascrive da sola —");
const car = await leggi("Carote");
ok(car?.conv?.[uCassa.id] === 99,
  `«Carote» aveva già 99 e se l'è tenuta (${car?.conv?.[uCassa.id]})`);

/* ═══ 5. CON LA SPUNTA SI SOSTITUISCE, E LA STIMA SPARISCE ═══
   Un numero scritto da una persona che guarda la merce non e' piu' una stima
   dell'app: se restasse marcato tale, l'avviso «conversioni da sistemare»
   continuerebbe a chiamarlo in causa per sempre. */
console.log("\n— 5. con la spunta si sostituisce, e il bollino «stimata» va via —");
await apriBlocco();
await p.locator(".sc-foglio").last().getByLabel("Cosa vuoi cambiare")
  .selectOption({ label: "Conversione · quanto vale un'unità" });
await p.waitForTimeout(400);
await scegli(["Carote"]);
await p.getByLabel("Uno di questa…").selectOption(uCassa.id);
await p.getByLabel("…vale").fill("8");
await p.getByLabel("di questa, che è la base").selectOption(uKg.id);
await p.getByLabel(/Sostituisci anche dove/).check();
await p.waitForTimeout(300);
await p.getByRole("button", { name: /Applica|Salva|Aggiorna/ }).last().click();
await p.waitForTimeout(1200);
const car2 = await leggi("Carote");
ok(car2?.conv?.[uCassa.id] === 8, `adesso «Carote» sta a 8 (${car2?.conv?.[uCassa.id]})`);
ok(!(car2?.convStim || []).includes(uCassa.id),
  `e non è più marcata come stima dell'app (${JSON.stringify(car2?.convStim || [])})`);

console.log("\nerrori di pagina:", errs.length);
for (const e of errs.slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko || errs.length ? 1 : 0);
