import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));
// segna un prodotto come "solo interi" per verificare i vincoli
const A = st.magazzini.find((m) => m.articoli.length >= 3);
const pidIntero = A.articoli[0].prodottoId;
st.prodotti.find((p) => p.id === pidIntero).soloInteri = true;
const nomeIntero = st.prodotti.find((p) => p.id === pidIntero).nome;

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 880 }, isMobile: true, hasTouch: true });
const errs = [];
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(st));
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1400);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1200);
const nav = p.getByText("Plancia", { exact: true });
for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(700);

// ===== 1. vista Settimana: mappa prodotti x giorni =====
await p.getByRole("button", { name: "Settimana", exact: true }).click(); await p.waitForTimeout(600);
await p.locator("select").first().selectOption(A.id).catch(() => {});
await p.waitForTimeout(500);
const settOk = await p.getByText("Prodotto", { exact: true }).count() > 0;
const badgeInteri = await p.getByText("solo interi").count() > 0;
console.log(`vista Settimana: ${settOk ? "PASS" : "CHECK"} | badge "solo interi" su ${nomeIntero}: ${badgeInteri ? "PASS" : "CHECK"}`);
await p.screenshot({ path: "i-1-settimana.png" });

// ===== 2. colonna: cambia un solo giorno su tutti =====
// nuovo flusso: prima metto a fuoco il giorno, poi il pulsante dedicato
await p.getByRole("button", { name: /Metti a fuoco mercoledì/ }).click(); await p.waitForTimeout(500);
await p.getByText(/Imposta mercoledì su tutti i prodotti/).click(); await p.waitForTimeout(600);
// il prodotto "solo interi" è nella selezione: 2,5 deve essere RIFIUTATO
await p.getByPlaceholder("0").fill("2,5"); await p.waitForTimeout(200);
await p.getByRole("button", { name: /^Applica$/ }).click(); await p.waitForTimeout(700);
const rifiutato = await p.getByText(/prodotti da spedire interi/).count() > 0;
const ancoraAperto = await p.getByText(/Livello di mercoledì/).count() > 0;
console.log(`decimale rifiutato con prodotti interi: ${rifiutato && ancoraAperto ? "PASS" : "CHECK"}`);
// ora un valore intero passa
await p.getByPlaceholder("0").fill("3"); await p.waitForTimeout(200);
await p.getByRole("button", { name: /^Applica$/ }).click(); await p.waitForTimeout(900);
const res = await p.evaluate(async (aid) => {
  const r = await window.storage.get("scp:stato:v1", true); const s = JSON.parse(r.value);
  const m = s.magazzini.find((x) => x.id === aid);
  return { tot: m.articoli.length, mer3: m.articoli.filter((a) => a.parGiorni && a.parGiorni["3"] === 3).length,
    altriIntatti: m.articoli.filter((a) => a.parGiorni && a.parGiorni["1"] != null).length };
}, A.id);
console.log(`mercoledì=3 su ${res.mer3}/${res.tot} | altri giorni popolati su ${res.altriIntatti}`,
  res.mer3 === res.tot ? "PASS" : "CHECK");

// ===== 3. riga: settimana del singolo prodotto, passo forzato a 1 =====
// apro i gruppi SOLO se sono chiusi (il pulsante fa da interruttore)
const apri = p.getByRole("button", { name: "Apri tutto", exact: true });
if (await apri.count()) { await apri.click(); await p.waitForTimeout(500); }
await p.getByText(nomeIntero, { exact: false }).first().click(); await p.waitForTimeout(700);
const notaInteri = await p.getByText(/prodotti da spedire interi: solo numeri interi, passo 1/).count() > 0;
const primaL = await p.getByLabel("Livello lunedì").inputValue();
await p.getByRole("button", { name: "Più lunedì" }).click(); await p.waitForTimeout(300);
const dopoL = await p.getByLabel("Livello lunedì").inputValue();
const salto = Math.abs(parseFloat(dopoL.replace(",", ".")) - parseFloat(primaL.replace(",", ".")));
console.log(`nota interi nella griglia: ${notaInteri ? "PASS" : "CHECK"} | passo forzato a 1 (${primaL} -> ${dopoL}): ${salto === 1 ? "PASS" : "CHECK"}`);
await p.screenshot({ path: "i-2-griglia-interi.png" });
await p.getByRole("button", { name: /Annulla/ }).first().click(); await p.waitForTimeout(400);

// ===== 4. il +/- sulle caselle rispetta gli interi anche col passo 0,5 =====
await p.getByRole("button", { name: "Caselle", exact: true }).click(); await p.waitForTimeout(600);
await p.getByRole("button", { name: "0,5", exact: true }).click(); await p.waitForTimeout(300);
const q0 = await p.evaluate(async () => JSON.parse((await window.storage.get("scp:stato:v1", true)).value));
// trova la tessera del prodotto "solo interi" e premi +
const card = p.locator("div").filter({ hasText: nomeIntero }).last();
await card.getByRole("button", { name: "Aumenta" }).click().catch(async () => {
  await p.getByRole("button", { name: "Aumenta" }).first().click();
});
await p.waitForTimeout(700);
const q1 = await p.evaluate(async () => JSON.parse((await window.storage.get("scp:stato:v1", true)).value));
const prima = q0.magazzini.find(m => m.id === A.id).articoli.find(a => a.prodottoId === pidIntero);
const dopo = q1.magazzini.find(m => m.id === A.id).articoli.find(a => a.prodottoId === pidIntero);
const deltaIntero = dopo.qty - prima.qty;
console.log(`+ su prodotto intero con passo 0,5 -> delta ${deltaIntero}`, deltaIntero === 1 ? "PASS" : "CHECK");

console.log("errs", errs.length, errs.slice(0, 4));
const pass = settOk && badgeInteri && rifiutato && ancoraAperto && res.mer3 === res.tot
  && notaInteri && salto === 1 && deltaIntero === 1 && errs.length === 0;
console.log("RESULT:", pass ? "PASS" : "CHECK");
await b.close();
