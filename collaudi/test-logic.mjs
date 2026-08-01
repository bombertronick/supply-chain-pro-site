import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lib = require("./test-lib.cjs");

const stato = JSON.parse(readFileSync("../stato-prod.json", "utf8"));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("  ✗ FAIL:", m); } };

const esc = (v) => { const s = String(v ?? ""); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCsv = (righe) => "﻿" + righe.map((r) => r.map(esc).join(";")).join("\r\n");
const prodKeys = (p) => ({ id: p.id, nome: p.nome, categoriaId: p.categoriaId, fornitoreId: p.fornitoreId, uomBase: p.uomBase, conv: p.conv, uomLavorazione: p.uomLavorazione, uomFornitore: p.uomFornitore, uomFornitoreDiretto: p.uomFornitoreDiretto });
const byId = (arr) => Object.fromEntries(arr.map((p) => [p.id, prodKeys(p)]));

console.log("=== TEST 1: round-trip identity (export -> import) ===");
const righe = lib.esportaCatalogoRighe(stato);
ok(righe.length === 104, `export rows = ${righe.length} (expected 104 = header + 103)`);
ok(righe[0][0] === "ID" && righe[0][1] === "Nome", "header row correct");
const csv = toCsv(righe);
const c1 = structuredClone(stato);
const r1 = lib.applicaCatalogoCsv(c1, csv);
ok(r1.creati === 0, `creati = ${r1.creati} (expected 0)`);
ok(r1.aggiornati === 103, `aggiornati = ${r1.aggiornati} (expected 103)`);
ok(c1.prodotti.length === 103, `prodotti after = ${c1.prodotti.length} (expected 103, no dupes)`);
ok(c1.categorie.length === stato.categorie.length, "no new categorie");
ok(c1.fornitori.length === stato.fornitori.length, "no new fornitori");
ok(c1.unita.length === stato.unita.length, "no new unita");
const before = byId(stato.prodotti), after = byId(c1.prodotti);
const diff = Object.keys(before).filter((id) => JSON.stringify(before[id]) !== JSON.stringify(after[id]));
ok(diff.length === 0, `products changed on round-trip: ${diff.length} (${diff.slice(0,3).join(",")})`);

console.log("=== TEST 2: modified import (new supplier + conv + price) ===");
const righe2 = lib.esportaCatalogoRighe(stato);
// find header indexes
const H = righe2[0];
const iForn = H.indexOf("Fornitore"), iPrezzo = H.indexOf("Prezzo"), iConv = H.indexOf("Conversioni"), iNome = H.indexOf("Nome");
// modify row index 1 (first product)
const target = righe2[1];
const targetNome = target[iNome];
target[iForn] = "Birrificio Rossi";
target[iPrezzo] = "2,50";
target[iConv] = "cassa=24|bott=1";
const csv2 = toCsv(righe2);
const c2 = structuredClone(stato);
const r2 = lib.applicaCatalogoCsv(c2, csv2);
ok(r2.fornNuovi.includes("Birrificio Rossi"), `new supplier reported: ${JSON.stringify(r2.fornNuovi)}`);
ok(r2.unitaNuove.includes("cassa") && r2.unitaNuove.includes("bott"), `new units reported: ${JSON.stringify(r2.unitaNuove)}`);
const prod = c2.prodotti.find((p) => p.nome === targetNome);
const fornRossi = c2.fornitori.find((f) => f.nome === "Birrificio Rossi");
ok(prod.fornitoreId === fornRossi.id, "product points to new supplier");
ok(prod.prezzo === 2.5, `price set = ${prod.prezzo} (expected 2.5)`);
const cassaU = c2.unita.find((u) => u.simbolo === "cassa");
ok(cassaU && prod.conv[cassaU.id] === 24, `conv cassa=24 set (${JSON.stringify(prod.conv)})`);

console.log("=== TEST 3: new product row (upsert create) ===");
const righe3 = lib.esportaCatalogoRighe(stato);
righe3.push(["", "Prodotto Nuovo Test", "Categoria X", "Fornitore Y", "kg", "9,99", "cassa=10", "kg", "kg", "kg"]);
const c3 = structuredClone(stato);
const r3 = lib.applicaCatalogoCsv(c3, toCsv(righe3));
ok(r3.creati === 1, `creati = ${r3.creati} (expected 1)`);
ok(c3.prodotti.length === 104, `prodotti = ${c3.prodotti.length} (expected 104)`);
const nuovo = c3.prodotti.find((p) => p.nome === "Prodotto Nuovo Test");
ok(!!nuovo && nuovo.prezzo === 9.99, `new product price = ${nuovo?.prezzo}`);
ok(r3.catNuove.includes("Categoria X") && r3.fornNuovi.includes("Fornitore Y"), "new cat+forn created");

console.log("=== TEST 4: idempotency (import same file twice) ===");
const c4 = structuredClone(stato);
lib.applicaCatalogoCsv(c4, csv);
const r4b = lib.applicaCatalogoCsv(c4, csv);
ok(r4b.creati === 0 && c4.prodotti.length === 103, `2nd import stable: creati=${r4b.creati}, prodotti=${c4.prodotti.length}`);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
