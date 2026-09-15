/* LA LIBRERIA DELLA RICEVUTA DI CONSEGNA (gen-6.20).

   `consegnata` e `sfoltisciScritture` sono funzioni PURE di modulo: si provano
   senza browser, con la tabella di verita' completa, invece di pagare venti
   secondi di Playwright per riga. Stesso metodo di mkconvlib.mjs, e stessa
   ragione scritta in build.mjs:55-62 — una libreria ferma a ieri da' verde su
   codice che non esiste piu'.

   VA AGGIUNTA a LIBRERIE in build.mjs NELLO STESSO COMMIT DEL CODICE, non
   prima: finche' le due funzioni non esistono questo file non si costruisce, e
   il passo delle librerie FERMEREBBE ogni build — compresa quella che serve a
   registrare i rossi. protopurotest.mjs se la costruisce da solo apposta, e
   quando non ci riesce lo dice invece di tacere. */
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";
const src = readFileSync(process.argv[2] || "./app-under-test.jsx", "utf8") +
  "\nexport { consegnata, sfoltisciScritture, MAX_SCRITTURE, MAX_MIEI };\n";
writeFileSync("proto-lib-src.jsx", src);
await build({ entryPoints: ["proto-lib-src.jsx"], bundle: true, outfile: "proto-lib.cjs",
  loader: { ".jsx": "jsx" }, jsx: "transform", format: "cjs", platform: "node", logLevel: "error" });
