/* ── UN'ORIGINE VERA PER I COLLAUDI ──

   PERCHE' ESISTE. Il 5 settembre gen606test mi ha dato dieci risultati diversi
   sullo STESSO identico codice (11, 5, 11, 5, 3, 0, 0, 12, 0, 10 rossi), e per
   mezza giornata ho cercato un difetto dell'app che non c'era. La causa non
   erano i tempi: era il PROTOCOLLO. Su file:// Chromium tratta l'origine come
   OPACA, e ogni pagina puo' ricevere un'archiviazione tutta sua. Un collaudo
   che scrive su localStorage, ricarica o apre una seconda pagina e poi rilegge
   non sta misurando l'app: sta misurando in quale partizione e' finito.

   Non e' teoria. Nel censimento di gen-6.06 pin2test e' uscita ROSSA per
   questo: la sonda diceva che il secondo telefono non vedeva il profilo nuovo
   NE' la spia della revisione — cioe' guardava un altro magazzino. Da sola,
   tre volte su tre, passa.

   QUANDO SERVE. A ogni collaudo in cui lo stato deve SOPRAVVIVERE a un
   ricaricamento, o essere CONDIVISO fra due pagine attraverso localStorage.
   Chi apre la pagina una volta sola e non tocca localStorage puo' restare su
   file://: non ha niente da perdere.

   COME SI USA:
     import { apriServer } from "./servi.mjs";
     const srv = await apriServer();          // serve la cartella collaudi
     await p.goto(srv.url);                   // http://127.0.0.1:<porta>/index.html
     ...
     await srv.chiudi();                      // in fondo, sempre

   La porta la sceglie il sistema (listen su 0): due collaudi in parallelo non
   si pestano i piedi, e non c'e' nessun numero fisso da ricordare. */
import { createServer } from "http";
import { readFile } from "fs/promises";
import path from "path";

const TIPI = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon",
};

export async function apriServer(radice = process.cwd()) {
  const base = path.resolve(radice);
  const srv = createServer(async (req, res) => {
    const chiesto = decodeURIComponent((req.url || "/").split("?")[0]);
    const dentro = path.resolve(base, "." + (chiesto === "/" ? "/index.html" : chiesto));
    /* niente uscite dalla cartella: un collaudo non deve poter servire il
       disco intero solo perche' qualcuno scrive ../.. in un indirizzo */
    if (!dentro.startsWith(base)) { res.writeHead(403); return res.end("fuori"); }
    try {
      const dati = await readFile(dentro);
      res.writeHead(200, { "content-type": (TIPI[path.extname(dentro)] || "application/octet-stream") + "; charset=utf-8" });
      res.end(dati);
    } catch { res.writeHead(404); res.end("non c'e'"); }
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const porta = srv.address().port;
  return {
    porta,
    url: `http://127.0.0.1:${porta}/index.html`,
    chiudi: () => new Promise((r) => srv.close(r)),
  };
}
