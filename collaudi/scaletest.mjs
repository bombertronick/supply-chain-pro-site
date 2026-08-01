import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import path from "path";
const exe = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"].find(existsSync);
const st = JSON.parse(readFileSync("seed-state.json", "utf8"));

/* ===== gonfia i dati: 8 categorie x 40 prodotti = 320, su 12 magazzini ===== */
const cats = [];
for (let c = 0; c < 8; c++) {
  const id = `cat-big-${c}`;
  cats.push({ id, nome: `Categoria ${c + 1}`, colore: ["#4C8DF6","#8A63F4","#D96AC0","#2FA97C","#E8A13C","#E25C77","#22B8CF","#7A6FF0"][c] });
}
st.categorie.push(...cats);
const uom = st.unita[0].id;
const nuoviProd = [];
for (let c = 0; c < 8; c++) for (let k = 0; k < 40; k++) {
  const id = `p-big-${c}-${k}`;
  nuoviProd.push({ id, nome: `Prodotto ${c + 1}.${k + 1}`, categoriaId: cats[c].id, fornitoreId: st.fornitori[0].id, uomBase: uom, conv: {},
    ...(k % 7 === 0 ? { soloInteri: true } : {}) });
}
st.prodotti.push(...nuoviProd);
const grande = st.magazzini.find((m) => m.articoli.length > 0);
grande.articoli.push(...nuoviProd.map((p, i) => ({ prodottoId: p.id, uomId: uom, par: 1 + (i % 9), qty: i % 4 })));
// 12 magazzini per stressare la Rete
const sede0 = st.sedi[0].id;
for (let w = 0; w < 8; w++) st.magazzini.push({ id: `mag-big-${w}`, nome: `Deposito ${w + 1}`, sedeId: sede0, tipo: ["retro","linea-retro","laboratorio","linea-lab"][w % 4], articoli: [] });
const totArt = grande.articoli.length;

const b = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 440, height: 880 }, isMobile: true, hasTouch: true });
const errs = [];
p.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !/net::ERR/.test(m.text())) errs.push(m.text()); });
await p.addInitScript((s) => { try { localStorage.setItem("scp:tour:v1", "1"); } catch {} const m = new Map(); m.set("scp:stato:v1", s); window.storage = { async get(k){return m.has(k)?{value:m.get(k)}:null}, async set(k,v){m.set(k,v);return true}, async delete(k){m.delete(k);return true} }; }, JSON.stringify(st));
const t0 = Date.now();
await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1800);
await p.getByText("Admin", { exact: false }).first().click(); await p.waitForTimeout(400);
for (const d of "1234") await p.getByRole("button", { name: d, exact: true }).first().click().catch(() => {});
await p.waitForTimeout(1600);
console.log(`avvio con ${st.prodotti.length} prodotti / ${totArt} articoli / ${st.magazzini.length} magazzini in ${Date.now() - t0}ms`);

const nav = p.getByText("Plancia", { exact: true });
for (let i = 0; i < await nav.count(); i++) { if (await nav.nth(i).isVisible()) { await nav.nth(i).click(); break; } }
await p.waitForTimeout(900);

// barra di contesto presente
const ctx = await p.getByText(/^Rete · \d+ magazzini$/).count() > 0;
console.log("barra di contesto in Rete:", ctx ? "PASS" : "CHECK");
await p.screenshot({ path: "s-1-rete-grande.png" });

// ===== Settimana con 320+ articoli =====
await p.getByRole("button", { name: "Settimana", exact: true }).click(); await p.waitForTimeout(700);
await p.locator("select").first().selectOption(grande.id).catch(() => {});
await p.waitForTimeout(900);
// gruppi chiusi per difetto quando sono tanti: conto le righe visibili
const righeVisibili = await p.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.className.includes('sc-pop')).length);
const gruppiVisibili = await p.locator('button:has-text("Categoria ")').count();
console.log(`Settimana: ${gruppiVisibili} gruppi visibili, ${righeVisibili} righe prodotto aperte (su ${totArt} articoli)`,
  gruppiVisibili >= 8 && righeVisibili < 80 ? "PASS (progressivo)" : "CHECK");
await p.screenshot({ path: "s-2-settimana-grande.png" });

// intestazione incollata: scorro e deve restare visibile
const cont = p.locator('div.sc-scroll').filter({ has: p.getByText("Prodotto", { exact: true }) }).first();
await cont.evaluate((el) => { el.scrollTop = 400; }).catch(() => {});
await p.waitForTimeout(400);
const headVis = await p.getByText("Prodotto", { exact: true }).first().isVisible();
console.log("intestazione giorni ancora visibile dopo lo scorrimento:", headVis ? "PASS" : "CHECK");
await p.screenshot({ path: "s-3-sticky.png" });

// messa a fuoco su un giorno
await p.getByRole("button", { name: /Metti a fuoco mercoledì/ }).click(); await p.waitForTimeout(600);
const focusBtn = await p.getByText(/Imposta mercoledì su tutti i prodotti/).count() > 0;
const opac = await p.evaluate(() => {
  const celle = [...document.querySelectorAll("span")].filter((s) => /^(\d|–)/.test(s.textContent || "") && s.style.opacity);
  const spente = celle.filter((s) => parseFloat(s.style.opacity) < 0.5).length;
  return { tot: celle.length, spente };
});
console.log(`messa a fuoco: pulsante ${focusBtn ? "PASS" : "CHECK"} | celle attenuate ${opac.spente}/${opac.tot}`,
  opac.spente > 0 ? "PASS" : "CHECK");
await p.screenshot({ path: "s-4-focus.png" });
await p.getByRole("button", { name: /Mostra tutti i giorni/ }).click(); await p.waitForTimeout(400);

// ===== filtro "solo i selezionati" + lampo sulle modifiche =====
await p.getByRole("button", { name: "Caselle", exact: true }).click(); await p.waitForTimeout(900);
await p.getByRole("button", { name: /Sotto scorta · \d+/ }).click(); await p.waitForTimeout(500);
await p.getByRole("button", { name: /^Tutti$/ }).click(); await p.waitForTimeout(900);
const selChip = await p.getByText(/\d+ scelte/).count() > 0;
const filtroScelti = await p.getByRole("button", { name: /Selezionate · \d+/ }).count() > 0;
console.log(`chip selezione nella barra: ${selChip ? "PASS" : "CHECK"} | filtro "Selezionate": ${filtroScelti ? "PASS" : "CHECK"}`);
await p.getByRole("button", { name: /Riempi/ }).click(); await p.waitForTimeout(300);
const lampo = await p.locator(".sc-tocco").count();
console.log(`lampo sulle caselle appena cambiate: ${lampo} elementi`, lampo > 0 ? "PASS" : "CHECK");
await p.screenshot({ path: "s-5-lampo.png" });
await p.waitForTimeout(1800);
const lampoSpento = await p.locator(".sc-tocco").count();
console.log("lampo si spegne da solo:", lampoSpento === 0 ? "PASS" : "CHECK");

console.log("errs", errs.length, errs.slice(0, 5));
const pass = ctx && gruppiVisibili >= 8 && righeVisibili < 80 && headVis && focusBtn && opac.spente > 0
  && selChip && filtroScelti && lampo > 0 && lampoSpento === 0 && errs.length === 0;
console.log("RESULT:", pass ? "PASS" : "CHECK");
await b.close();
