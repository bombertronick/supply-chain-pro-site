/* La roadmap aperta SENZA scaricarla.

   SEGNALATO DA VALERIO: «la roadmap non me la fa scorrere verso il basso se
   la apro senza scaricarla». Quel modo di aprirla e' un'anteprima: la pagina
   gira dentro un'inquadratura che non controllo io, e che puo' bloccare gli
   script.

   ONESTA' SU COSA HO POTUTO VERIFICARE. Il suo sintomo esatto — il dito che
   non scorre — non sono riuscita a riprodurlo: in un'inquadratura normale la
   pagina scorre. Ho pero' trovato, misurandole, tre cose vere che rendono
   questa pagina fragile proprio li'. Non prometto che sistemino il suo
   sintomo; tolgono le tre ragioni note per cui potrebbe succedere, e la prima
   e' grave da sola.

   1. SENZA SCRIPT LA PAGINA ERA VUOTA. L'elenco dei lavori lo costruiva il
      codice. Un'anteprima che blocca gli script mostrava l'intestazione e poi
      DUE RIQUADRI VUOTI: la cosa per cui la pagina esiste non c'era. Misurato:
      0 voci su 7. Questo e' il difetto peggiore dei tre, e non e' un'ipotesi.

   2. MANCAVA IL DOCTYPE, quindi il browser andava in modalita' vecchia
      («BackCompat»): l'elemento che scorre diventa <body> invece di <html>.
      Chi ospita la pagina e prova a farla scorrere da fuori tocca <html> e non
      succede niente.

   3. LA BARRA ERA «FISSA», cioe' posizionata rispetto a una finestra che
      dentro un'inquadratura non e' quella che vede chi guarda.

   Contro la roadmap di prima il §1 e il §2 devono diventare rossi. */
import { chromium } from "playwright";
import { existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };

const URL = "file://" + path.resolve("../roadmap.html");
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const telefono = { viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true };

/* ═══ 1. SENZA SCRIPT, I LAVORI SI LEGGONO LO STESSO ═══
   E' il controllo che conta di piu': una pagina il cui contenuto sparisce
   quando il codice non gira non e' un documento, e' un'applicazione. Questa
   deve restare un documento. */
console.log("\n— 1. con gli script bloccati la pagina dice ancora tutto —");
const senza = await b.newContext({ ...telefono, javaScriptEnabled: false });
const p1 = await senza.newPage();
await p1.goto(URL); await p1.waitForTimeout(500);

const voci = await p1.locator(".voce").count();
ok(voci >= 5, `i lavori da scegliere ci sono lo stesso (${voci})`);

const testo = (await p1.locator("body").innerText()).replace(/\s+/g, " ");
/* non basta che i bottoni esistano: dentro ci dev'essere quello che si legge,
   titolo E spiegazione, se no si e' spostato il vuoto di un livello */
ok(/Sincronizzato con tutta la rete/.test(testo), "col titolo per esteso");
ok(/Marco conta il retro in cantina/.test(testo), "e con la spiegazione sotto, non solo il titolo");

const larghezza = await p1.evaluate(() => document.documentElement.clientWidth);
ok(larghezza <= 420,
  `e si impagina alla larghezza del telefono anche senza script (${larghezza}px, non 980)`);
await p1.screenshot({ path: "rm-anteprima-senza-script.png", fullPage: false });
await senza.close();

/* ═══ 2. LA PAGINA E' IN MODALITÀ MODERNA ═══ */
console.log("\n— 2. il browser la legge in modalità moderna —");
const con = await b.newContext(telefono);
const p2 = await con.newPage();
const errs = [];
p2.on("pageerror", (e) => errs.push(e.message));
await p2.goto(URL); await p2.waitForTimeout(500);
const modo = await p2.evaluate(() => ({
  compat: document.compatMode,
  scroller: document.scrollingElement === document.documentElement ? "html" : "body",
  barra: getComputedStyle(document.querySelector(".barra")).position,
}));
ok(modo.compat === "CSS1Compat", `modalità moderna, non quella vecchia (${modo.compat})`);
ok(modo.scroller === "html",
  `e a scorrere è <html>, che è quello che tocca chi la ospita (${modo.scroller})`);

/* ═══ 3. LA BARRA NON GALLEGGIA SOPRA IL CONTENUTO ═══ */
console.log("\n— 3. la barra in basso non si stacca dalla pagina —");
ok(modo.barra === "sticky", `la barra è «appiccicata», non «fissa» (${modo.barra})`);
/* e in fondo alla pagina non deve coprire l'ultima riga di testo */
const coperto = await p2.evaluate(() => {
  scrollTo(0, document.documentElement.scrollHeight);
  const barra = document.querySelector(".barra").getBoundingClientRect();
  const coda = document.querySelector(".coda").getBoundingClientRect();
  return coda.bottom > barra.top + 1;
});
ok(!coperto, "arrivati in fondo, l'ultima riga si legge tutta");

/* ═══ 4. IL CONTROCONTROLLO: SCORRE, E QUELLO CHE SI TOCCA FUNZIONA ═══
   Rendere la pagina leggibile senza script non deve averla resa morta con gli
   script: i numeri che compaiono toccando le voci sono il motivo per cui
   questa pagina non e' un semplice foglio. */
console.log("\n— 4. e con gli script si tocca e si numera come prima —");
const alto = await p2.evaluate(() => document.documentElement.scrollHeight);
const finestra = await p2.evaluate(() => innerHeight);
await p2.evaluate(() => scrollTo(0, 0));
await p2.mouse.move(195, 400); await p2.mouse.wheel(0, 2500); await p2.waitForTimeout(400);
const sceso = await p2.evaluate(() => (document.scrollingElement || document.documentElement).scrollTop);
ok(alto > finestra * 2, `la pagina è più lunga dello schermo (${alto}px su ${finestra}px)`);
ok(sceso > 500, `e col dito scende davvero (${sceso}px)`);

await p2.locator(".voce").first().click(); await p2.waitForTimeout(250);
const num = (await p2.locator(".voce").first().locator(".num").innerText()).trim();
ok(num === "1", `la prima toccata porta il numero 1 (dice «${num}»)`);
const msg = await p2.locator("#msg").inputValue();
const titolo = (await p2.locator(".voce").first().locator(".titolo").innerText()).trim();
ok(msg.includes("1. " + titolo),
  "e il messaggio da copiare nomina il lavoro giusto, letto dalla pagina");
ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await con.close();

await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
