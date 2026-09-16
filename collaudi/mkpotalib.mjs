/* La libreria della POTATURA (gen-6.10).

   Espone le funzioni pure che decidono cosa NON viaggia piu' in rete a ogni
   salvataggio. Sono pure per costruzione — prendono una lista e ne tornano
   un'altra — quindi si provano qui, senza browser, con numeri veri.

   PERCHE' L'ESPORTAZIONE E' DIFENSIVA. Le altre mk*lib esportano il nome
   nudo, e se quel nome sparisce build.mjs muore con «LIBRERIA FALLITA» —
   giusto, quando il nome DEVE esserci. Qui no: potaturatest e' scritto
   PRIMA che sfoltisciRichieste esista, e deve poter registrare i suoi rossi
   sulla versione online. Se esportassi il nome nudo, il pacchetto non si
   costruirebbe nemmeno e invece dei rossi avrei un'esplosione — che non e'
   la stessa informazione. Col «typeof» la libreria si costruisce lo stesso e
   la funzione mancante arriva al collaudo come null: rosso pulito. */
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";
const target = process.argv[2] || "../app/app.jsx";
const src = readFileSync(target, "utf8") + `
const __v = (x) => (x === undefined ? null : x);
export const POTA = {
  richieste: typeof sfoltisciRichieste !== "undefined" ? __v(sfoltisciRichieste) : null,
  ordini: typeof sfoltisciOrdini !== "undefined" ? __v(sfoltisciOrdini) : null,
  vendite: typeof sfoltisciVendite !== "undefined" ? __v(sfoltisciVendite) : null,
  clienti: typeof sfoltisciClienti !== "undefined" ? __v(sfoltisciClienti) : null,
  GIORNI_RICHIESTE: typeof GIORNI_RICHIESTE !== "undefined" ? __v(GIORNI_RICHIESTE) : null,
  MAX_RICHIESTE_CHIUSE: typeof MAX_RICHIESTE_CHIUSE !== "undefined" ? __v(MAX_RICHIESTE_CHIUSE) : null,
  GIORNI_ORDINI: typeof GIORNI_ORDINI !== "undefined" ? __v(GIORNI_ORDINI) : null,
};
`;
writeFileSync("pota-lib-src.jsx", src);
await build({ entryPoints: ["pota-lib-src.jsx"], bundle: true, outfile: "pota-lib.cjs",
  loader: { ".jsx": "jsx" }, jsx: "transform", format: "cjs", platform: "node", logLevel: "error" });
console.log("pota-lib.cjs pronto da", target);
