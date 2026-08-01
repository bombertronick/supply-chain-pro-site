import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { vaiA } from "./navtest.mjs";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const base = JSON.parse(readFileSync("seed-state.json", "utf8"));
const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });

async function apri(stato) {
  const p = await b.newPage({ viewport: { width: 440, height: 880 }, isMobile: true, hasTouch: true });
  const errs = [];
  p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(stato));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
  for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
  await p.waitForTimeout(1300);
  /* la strada per le voci sotto «Gestione» la sa la libreria condivisa */
  await vaiA(p, "Plancia");
  await p.waitForTimeout(700);
  return { p, errs };
}

/* ===== DIFETTO 1: nessun magazzino -> la vista Caselle non deve crollare ===== */
{
  const st = JSON.parse(JSON.stringify(base));
  st.magazzini = [];               // caso limite: rete senza magazzini
  const { p, errs } = await apri(st);
  await p.getByRole("button", { name: "Caselle", exact: true }).click(); await p.waitForTimeout(700);
  const vuotoOk = await p.getByText(/Nessun magazzino/).count() > 0;
  await p.getByRole("button", { name: "Settimana", exact: true }).click(); await p.waitForTimeout(500);
  await p.getByRole("button", { name: "Rete", exact: true }).click(); await p.waitForTimeout(500);
  const crash = errs.filter((e) => /hook|Rendered/i.test(e));
  console.log(`[1] rete senza magazzini: messaggio ${vuotoOk ? "PASS" : "CHECK"} | errori hook: ${crash.length === 0 ? "PASS" : "FALLITO " + crash[0]}`);
  console.log(`    errori totali: ${errs.length}`, errs.slice(0, 2));
  await p.close();
  if (crash.length || !vuotoOk) process.exitCode = 1;
}

/* ===== DIFETTO 2: filtro "Selezionate" non deve incastrarsi ===== */
{
  const st = JSON.parse(JSON.stringify(base));
  const A = st.magazzini.find((m) => m.articoli.length >= 3);
  const { p, errs } = await apri(st);
  await p.getByRole("button", { name: "Caselle", exact: true }).click(); await p.waitForTimeout(700);
  await p.locator("select").first().selectOption(A.id).catch(() => {});
  await p.waitForTimeout(600);
  await p.getByRole("button", { name: /^Tutti$/ }).click(); await p.waitForTimeout(700);
  await p.getByRole("button", { name: /Selezionate · \d+/ }).click(); await p.waitForTimeout(500);
  const conFiltro = await p.locator(".sc-pop").count();
  // ora svuoto la selezione: la lista NON deve restare vuota
  await p.getByRole("button", { name: /Deseleziona/ }).click(); await p.waitForTimeout(800);
  const dopo = await p.locator(".sc-pop").count();
  const bloccato = await p.getByText("Nessuna casella con questo filtro").count() > 0;
  console.log(`[2] filtro Selezionate: ${conFiltro} caselle, dopo deseleziona ${dopo} (blocco: ${bloccato ? "SI" : "no"})`,
    dopo > 0 && !bloccato ? "PASS" : "CHECK");
  await p.close();
  if (!(dopo > 0) || bloccato) process.exitCode = 1;
}

/* ===== DIFETTO 3 + ANIMAZIONI: onda, contatore in volo, traguardo, annulla ===== */
{
  const st = JSON.parse(JSON.stringify(base));
  const A = st.magazzini.find((m) => m.articoli.length >= 3);
  const { p, errs } = await apri(st);
  await p.getByRole("button", { name: "Caselle", exact: true }).click(); await p.waitForTimeout(700);
  await p.locator("select").first().selectOption(A.id).catch(() => {});
  await p.waitForTimeout(600);
  await p.getByRole("button", { name: /^Tutti$/ }).click(); await p.waitForTimeout(700);
  await p.getByRole("button", { name: /Riempi/ }).click(); await p.waitForTimeout(260);

  // onda sfalsata: i veli del lampo hanno ritardi diversi
  const ritardi = await p.evaluate(() => [...document.querySelectorAll(".sc-tocco")].map((e) => e.style.animationDelay));
  const distinti = new Set(ritardi).size;
  console.log(`[3a] onda sul lampo: ${ritardi.length} veli, ${distinti} ritardi distinti`, ritardi.length > 0 && distinti > 1 ? "PASS" : "CHECK");
  // contatore in volo
  const volo = await p.locator(".sc-vola").count();
  const testoVolo = volo ? await p.locator(".sc-vola").first().innerText() : "";
  console.log(`[3b] contatore in volo: ${volo} ("${testoVolo.replace(/\n/g, " ")}")`, volo === 1 ? "PASS" : "CHECK");
  await p.screenshot({ path: "f-1-onda.png" });
  // traguardo: dopo Riempi il magazzino è al 100% e la percentuale pulsa
  await p.waitForTimeout(900);
  const traguardo = await p.locator(".sc-traguardo").count();
  const pct = await p.getByText(/^100%$/).count();
  console.log(`[3c] traguardo 100%: pulsazione ${traguardo} | chip 100% ${pct}`, traguardo > 0 && pct > 0 ? "PASS" : "CHECK");
  await p.screenshot({ path: "f-2-traguardo.png" });
  // le animazioni si spengono
  await p.waitForTimeout(1200);
  const restano = await p.locator(".sc-tocco").count() + await p.locator(".sc-vola").count();
  console.log(`[3d] animazioni si spengono da sole: ${restano === 0 ? "PASS" : "CHECK (" + restano + " attive)"}`);

  // annulla presente e funzionante
  await p.getByRole("button", { name: /Deseleziona/ }).click().catch(() => {});
  await p.waitForTimeout(600);
  const undoC = await p.getByText("Annulla l'ultima modifica").count();
  console.log(`[3e] annulla disponibile dopo Riempi: ${undoC > 0 ? "PASS" : "CHECK"}`);

  // difetto 3: dopo uno SPOSTAMENTO l'annulla non deve piu comparire (fotografia non valida)
  const B2 = st.magazzini.find((m) => m.id !== A.id);
  await p.getByRole("button", { name: /^Tutti$/ }).click(); await p.waitForTimeout(600);
  /* questo pezzo e' nella PLANCIA, non nel magazzino: li' i comandi stanno in
     gruppi da gen-5.47 e «Sposta» e' sotto «Articoli». «Gestione rapida» non
     esiste in quella schermata — l'avevo corretto con la ricetta sbagliata. */
  await p.getByRole("button", { name: /^Articoli$/ }).click(); await p.waitForTimeout(400);
  await p.getByRole("button", { name: /Sposta/ }).last().click(); await p.waitForTimeout(500);
  await p.locator(".sc-su select").last().selectOption(B2.id).catch(async () => {
    await p.locator("select").last().selectOption(B2.id).catch(() => {});
  });
  await p.waitForTimeout(200);
  await p.getByRole("button", { name: /^Applica$/ }).click(); await p.waitForTimeout(1000);
  const undoDopoSposta = await p.getByText("Annulla l'ultima modifica").count();
  console.log(`[3f] annulla NON offerto dopo uno spostamento: ${undoDopoSposta === 0 ? "PASS" : "CHECK"}`);

  console.log(`    errori totali: ${errs.length}`, errs.slice(0, 3));
  await p.close();
  if (errs.length) process.exitCode = 1;
}

await b.close();
console.log("--- fine verifica ---");
