/* La libreria delle SPIE (gen-6.15).

   Espone quello che si puo' provare senza browser: il contratto degli
   esecutori (chi riferisce «false» e quando), il battito di versione e le
   due costanti che il banco NON deve riscrivere a mano.

   PERCHE' L'ESPORTAZIONE E' DIFENSIVA, come in mkpotalib. Questo banco e'
   scritto PRIMA del codice e deve poter registrare i suoi rossi sulla
   versione online, dove «battito» e «SOGLIA_VISTA_FERMA» non esistono
   ancora. Col nome nudo il pacchetto non si costruirebbe nemmeno, e invece
   dei rossi arriverebbe un'esplosione — che non e' la stessa informazione.
   Col «typeof» la libreria si costruisce lo stesso e il pezzo mancante
   arriva al collaudo come null: rosso pulito.

   LE COSTANTI SI LEGGONO, NON SI SCRIVONO. La soglia oltre la quale l'eta'
   della lista diventa ambra sta nel sorgente: se un giorno qualcuno la
   cambia, il banco si ritara invece di arrossire a sproposito. E' la stessa
   regola che il documento del pavimento chiede per §5 di spialeggeratest. */
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";
const target = process.argv[2] || "../app/app.jsx";
const src = readFileSync(target, "utf8") + `
const __v = (x) => (x === undefined ? null : x);
export const SPIE = {
  ESECUTORI: typeof ESECUTORI !== "undefined" ? __v(ESECUTORI) : null,
  battito: typeof battito !== "undefined" ? __v(battito) : null,
  MAX_TELEFONI: typeof MAX_TELEFONI !== "undefined" ? __v(MAX_TELEFONI) : null,
  SOGLIA_VISTA_FERMA: typeof SOGLIA_VISTA_FERMA !== "undefined" ? __v(SOGLIA_VISTA_FERMA) : null,
  MAX_GIRI_MAGRI: typeof MAX_GIRI_MAGRI !== "undefined" ? __v(MAX_GIRI_MAGRI) : null,
  VERSIONE: typeof VERSIONE !== "undefined" ? __v(VERSIONE) : null,
};
`;
writeFileSync("spie-lib-src.jsx", src);
await build({ entryPoints: ["spie-lib-src.jsx"], bundle: true, outfile: "spie-lib.cjs",
  loader: { ".jsx": "jsx" }, jsx: "transform", format: "cjs", platform: "node", logLevel: "error" });
console.log("spie-lib.cjs pronto da", target);
