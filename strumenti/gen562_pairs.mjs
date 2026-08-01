import { readFileSync, writeFileSync, readdirSync } from "fs";
import crypto from "crypto";

/* gen-5.57 — tre lavori:
   1) il foglio di un inventario chiuso (la voce scelta dalla roadmap)
   2) chiedere al laboratorio più del previsto, scendendo sotto zero nel
      conteggio di linea

   I pezzi stanno in h562/NNa.txt (vecchio) e h562/NNb.txt (nuovo) invece che
   dentro questo file: dentro un template literal JS un `\d` diventa `d` e una
   graffa col dollaro va in interpolazione. Ci sono già cascato una volta e il
   danno è silenzioso — il file compila, ma la regex è un'altra. */

const A = readFileSync("app-prod.jsx", "utf8");   // == gen-5.59 in produzione
const dir = "h562";
const numeri = [...new Set(readdirSync(dir).map((f) => f.slice(0, 2)))].sort();
const P = numeri.map((n) => [
  readFileSync(`${dir}/${n}a.txt`, "utf8"),
  readFileSync(`${dir}/${n}b.txt`, "utf8"),
]);

/* nessun pezzo deve finire con un ritorno a capo di troppo: i file di testo se
   lo portano dietro e nel codice diventerebbe una riga vuota in più */
P.forEach(([a, b], i) => {
  if (a.endsWith("\n") || b.endsWith("\n")) {
    console.log(`!! hunk ${numeri[i]}: ritorno a capo finale — togli l'ultima riga vuota`);
    process.exit(1);
  }
});

let cur = A, ok = true;
P.forEach(([a, b], i) => {
  const n = cur.split(a).length - 1;
  if (n !== 1) { console.log(`!! hunk ${numeri[i]}: ${n} occorrenze, attesa 1`); ok = false; }
  cur = cur.split(a).join(b);
});
let ast = 0; for (const c of cur) if (c.codePointAt(0) > 0xffff) ast++;
console.log("hunk:", P.length, "| len", cur.length, "| astral", ast,
  "| md5", crypto.createHash("md5").update(cur, "utf8").digest("hex"));
if (!ok) process.exit(1);
writeFileSync("app-dev.jsx", cur);
writeFileSync("pairs562.json", JSON.stringify(P));
console.log("scritto app-dev.jsx e pairs562.json");
