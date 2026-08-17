/* gen-5.91: la bugia dell'offline.

   TERZO LAVORO SCELTO DA VALERIO. Dal consiglio: «Marco conta il retro in
   cantina, dove non prende. L'app gli scrive a lettere grandi "Conteggio
   registrato — e' aggiornato e sincronizzato con tutta la rete". Quella frase
   e' falsa: e' scritta subito, in locale, senza guardare se la rete abbia
   risposto. Se lui chiude l'app prima che la rete torni, la mattina dopo il
   magazzino ha i numeri di ieri e il laboratorio non ha ricevuto niente. Sul
   telefono non c'e' nemmeno una spia: la pastiglia "Riconnessione…" e'
   nascosta sotto una certa larghezza, cioe' su tutti i telefoni».

   Verificato nel codice, ed era vero alla lettera: la pastiglia aveva
   «hidden sm:inline-flex», cioe' spariva sotto i 640px — su ogni telefono. E
   la frase era scritta senza guardare niente.

   Un'app che dichiara un esito che non ha verificato e' peggio di una che
   tace: chi la legge smette di controllare.

   IL §3 E' IL CONTROCONTROLLO, e conta quanto il resto: quando la rete c'e'
   davvero, la frase di sempre deve restare, e la pastiglia non deve mettersi
   a gridare. Un avviso che compare anche quando va tutto bene diventa
   arredamento, e il giorno che serve non lo legge piu' nessuno.

   Contro gen-5.90 il §1 e il §2 devono diventare rossi. */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path"; import crypto from "crypto";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const hash = (p) => crypto.createHash("sha256").update("scp·" + p, "utf8").digest("hex");

const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
const sede = st.sedi.find((x) => x.tipo === "operatore") || st.sedi[0];
st.profili = [{ id: "pr-o", nome: "Operatore", ruolo: "operatore", sedeId: sede.id,
  colore: "#3B82F6", pinHash: hash("2222") }];
const mag = st.magazzini.find((m) => m.sedeId === sede.id && (m.articoli || []).length > 0)
  || st.magazzini[0];
st.richieste = []; st.ordini = []; st.rev = (st.rev || 0) + 1;

/* IL TELEFONO IN CANTINA: la scrittura in rete non risponde mai. Non e' un
   errore secco — e' il caso peggiore e piu' comune, quello in cui la rete c'e'
   ma non arriva niente, e l'app non ha ancora avuto un no. */
const avvia = async (b, rete) => {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.addInitScript(([s, viva]) => {
    try { localStorage.setItem("scp:tour:v1", "1"); } catch {}
    const m = new Map(); m.set("scp:stato:v1", s);
    window.storage = {
      async get(k) { return m.has(k) ? { value: m.get(k) } : null; },
      async set(k, v) {
        /* la cantina si accende DOPO l'accesso: bloccare anche l'avvio non
           sarebbe il caso di Marco, sarebbe un'app che non parte */
        if (!viva && window.__inCantina && k === "scp:stato:v1") {
          /* la scrittura parte e non torna piu': e' il caso peggiore, quello
             in cui l'app non ha nemmeno avuto un no */
          await new Promise(() => {});
        }
        m.set(k, v); return true;
      },
      async delete(k) { m.delete(k); return true; },
    };
  }, [JSON.stringify(st), rete]);
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
  await p.getByText("Operatore", { exact: true }).first().click(); await p.waitForTimeout(400);
  for (const d of "2222") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1600);
  await p.evaluate(() => { window.__inCantina = true; });
  return { p, errs };
};

const conta = async (p) => {
  const nav = p.getByText("Conteggi", { exact: true });
  for (let i = 0; i < await nav.count(); i++)
    if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; }
  await p.waitForTimeout(1100);
  await p.getByRole("button", { name: new RegExp(mag.nome) }).first().click();
  await p.waitForTimeout(1100);
  /* si arriva in fondo al conteggio senza toccare le quantità: vanno bene
     quelle che ci sono, il punto non è il numero ma cosa dice l'app dopo */
  for (let giro = 0; giro < 60; giro++) {
    const fine = p.getByRole("button", { name: /Registra il conteggio|Concludi|Salva il conteggio/i }).first();
    if (await fine.count()) { await fine.click(); break; }
    const avanti = p.getByRole("button", { name: /^(Avanti|Prossimo|Conferma)/i }).first();
    if (!(await avanti.count())) break;
    await avanti.click(); await p.waitForTimeout(120);
  }
  await p.waitForTimeout(1800);
};

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });

/* ═══ 1. LA SPIA SI VEDE SUL TELEFONO ═══ */
console.log("\n— 1. in cantina, sul telefono, si vede che la rete non c'è —");
const giu = await avvia(b, false);
await giu.p.waitForTimeout(2500);
const testoSu = (await giu.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/Riconnessione|Solo locale|Salvataggio/i.test(testoSu),
  `la pastiglia dello stato rete si vede — «${(testoSu.match(/Riconnessione…|Solo locale|Salvataggio…/) || ["nessuna"])[0]}»`);

/* ═══ 2. E LA FRASE NON DICE UNA COSA CHE NON SA ═══ */
console.log("\n— 2. e finito il conteggio non dice «sincronizzato con tutta la rete» —");
await conta(giu.p);
const dopo = (await giu.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/Conteggio registrato/.test(dopo), "il conteggio è stato registrato");
ok(!/sincronizzato con tutta la rete/i.test(dopo),
  "NON dice «sincronizzato con tutta la rete»: la rete non ha risposto");
ok(/non ancora in rete|Salvato sul telefono/i.test(dopo),
  `dice che è salvato qui e basta — «${(dopo.match(/Salvato sul telefono[^.]*/) || ["non detto"])[0]}»`);
ok(/lascia l'app aperta/i.test(dopo),
  "e dice cosa fare: lasciare l'app aperta finché non parte");
await giu.p.screenshot({ path: "offline-cantina.png", fullPage: false });
await giu.p.close();

/* ═══ 3. IL CONTROCONTROLLO: COL COLLEGAMENTO NON CAMBIA NIENTE ═══
   Se la frase di sempre sparisse anche quando la rete c'e', o se la pastiglia
   si mettesse a gridare tutto il giorno, avremmo scambiato una bugia con del
   rumore — e il rumore, il giorno che serve, non lo legge nessuno. */
console.log("\n— 3. e col collegamento buono resta tutto come prima —");
const su = await avvia(b, true);
await conta(su.p);
const dopo2 = (await su.p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/Conteggio registrato/.test(dopo2), "il conteggio è registrato");
ok(/sincronizzato con tutta la rete/i.test(dopo2),
  "e adesso sì che dice «sincronizzato con tutta la rete», perché è vero");
ok(!/Salvato sul telefono/i.test(dopo2), "senza l'avviso di quando la rete manca");
await su.p.close();

console.log("\nerrori di pagina:", giu.errs.length + su.errs.length);
for (const e of [...giu.errs, ...su.errs].slice(0, 4)) console.log("  !!", e);
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
