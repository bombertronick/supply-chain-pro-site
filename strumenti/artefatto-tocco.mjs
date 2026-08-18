/* LA COPIA PUBBLICATA, PROVATA COME LA APRE LUI.

   Perche' esiste. Tre volte di fila gli ho detto che la roadmap era
   sistemata, e tre volte lui mi ha risposto che non si scorreva / non era
   interagibile. Ogni volta avevo provato il FILE nel repository, che non e'
   quello che lui apre: quello pubblicato viene infilato dentro un
   <!doctype><html><head></head><body> messo da chi lo ospita. Qui lo
   impacchetto allo stesso modo e ci provo davvero.

   Uso: node strumenti/artefatto-tocco.mjs <file-pubblicato.html>

   IL NUMERO DELLE VOCI NON E' SCRITTO QUI DENTRO. Prima c'era «devono
   essere 7» e sarebbe diventato rosso il giorno che un lavoro finisce e la
   voce esce dalla lista — cioe' rosso per una cosa andata bene. Adesso il
   metro e': ce n'e' almeno una, e toccandole si numerano. */
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
/* playwright sta in collaudi/node_modules, e questo file vive in strumenti/:
   node risolve i pacchetti dalla cartella del FILE, non da dove lo lanci, e
   un «import da playwright» qui muore. Lo cerco dove sta davvero. */
const QUI = path.dirname(new URL(import.meta.url).pathname);
const PW = [path.resolve(QUI, "../collaudi/node_modules/playwright/index.mjs"),
  path.resolve(QUI, "../node_modules/playwright/index.mjs")].find(existsSync);
if (!PW) { console.error("KO  playwright non trovato: manca collaudi/node_modules"); process.exit(1); }
const { chromium } = await import("file://" + PW);
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const sorgente = process.argv[2];
if (!sorgente || !existsSync(sorgente)) {
  console.error("KO  serve il file pubblicato: node strumenti/artefatto-tocco.mjs <file.html>");
  process.exit(1);
}
const dentro = readFileSync(sorgente, "utf8");

/* i tag che l'involucro mette da se': se ci sono anche qui, finiscono nel
   body come testo. E' successo davvero, alla prima pubblicazione. */
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
console.log(`\n— la copia pubblicata: ${sorgente} (${dentro.length} caratteri) —`);
ok(!/<!doctype/i.test(dentro), "non porta un doctype suo (lo mette l'involucro)");
ok(!/<meta\s+charset/i.test(dentro), "ne' un charset suo");
ok(!/<meta\s+name="viewport"/i.test(dentro), "ne' un viewport suo");

writeFileSync("/tmp/wrapped.html",
  `<!doctype html><html><head><meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1">
   <style>*,*::before,*::after{box-sizing:border-box}body{margin:0}</style>
   </head><body>${dentro}</body></html>`);

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file:///tmp/wrapped.html"); await p.waitForTimeout(800);

console.log("\n— dentro l'involucro, su un telefono —");
const quante = await p.locator(".voce").count();
ok(quante >= 1, `i lavori da scegliere si vedono (${quante})`);
const alto = await p.evaluate(() => document.documentElement.scrollHeight);
const fin = await p.evaluate(() => innerHeight);
ok(alto > fin * 2, `la pagina è più lunga dello schermo (${alto} su ${fin})`);
await p.mouse.move(195, 400); await p.mouse.wheel(0, 2000); await p.waitForTimeout(400);
const sceso = await p.evaluate(() => (document.scrollingElement || document.documentElement).scrollTop);
ok(sceso > 500, `scorre col dito (${sceso}px)`);

/* IL PUNTO: si tocca? Si prende l'ULTIMA e poi la PRIMA, cosi' il controllo
   vale sia con quattro voci che con dieci. */
console.log("\n— e si tocca —");
const ultima = quante - 1;
await p.locator(".voce").nth(ultima).click(); await p.waitForTimeout(300);
const n = (await p.locator(".voce").nth(ultima).locator(".num").innerText()).trim();
ok(n === "1", `toccando l'ultima voce prende il numero 1 (dice «${n}»)`);
if (quante > 1) {
  await p.locator(".voce").nth(0).click(); await p.waitForTimeout(300);
  const n2 = (await p.locator(".voce").nth(0).locator(".num").innerText()).trim();
  ok(n2 === "2", `e la prima diventa 2 (dice «${n2}»)`);
}
const msg = await p.locator("#msg").inputValue();
ok(/1\. /.test(msg), "e il messaggio da copiare si è riempito");
/* il messaggio deve NOMINARE il lavoro, letto dalla pagina: se dicesse solo
   «1.» sarebbe pieno e inutile */
const titolo = (await p.locator(".voce").nth(ultima).locator(".titolo").innerText())
  .replace(/\s+/g, " ").trim();
ok(msg.replace(/\s+/g, " ").includes(titolo.slice(0, 30)),
  `e nomina il lavoro giusto — «${titolo.slice(0, 40)}…»`);
ok(!(await p.locator("#copia").isDisabled()), "il tasto Copia è acceso");
ok(errs.length === 0, "nessun errore JS" + (errs.length ? " → " + errs[0] : ""));
await b.close();
console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nSI TOCCA");
process.exit(ko ? 1 : 0);
