/* La dispensa: il contesto esterno che non si esaurisce.

   COSA DEVE ESSERE VERO, e perche' e' la parte che conta:
   1. NIENTE SPARISCE IN SILENZIO. I tetti (voce, numero di voci, totale)
      si RIFIUTANO a voce alta invece di troncare. Un deposito che tronca
      zitto e' peggio di nessun deposito: ci si fida e si perde.
   2. IL RIPIEGAMENTO NON PERDE IL FILO. Compattare toglie le voci assorbite
      ma l'indice ricorda CHI ha assorbito COSA: la strada a ritroso resta.
   3. DUE MANI NON SI PESTANO. L'indice si aggiorna solo se la revisione e'
      ancora quella letta: l'SQL generato deve portare il cancello dentro.
   4. IL GIRO COMPLETO E' FEDELE: quello che entra in base64 esce identico,
      accenti e apostrofi compresi (e' il motivo per cui e' base64: la
      lezione del 2 agosto, /[̀-ͯ]/ trasformato per strada).

   Gira senza database e senza browser: prova le funzioni pure e l'SQL
   generato, cioe' tutto quello che si puo' provare da qui. Quello che non
   si puo' provare da qui (il database vero) lo copre il cancello di
   revisione dentro l'SQL stesso. */
import { TETTI, idValido, vociDopoScrittura, controllaTetti, sqlScrivi, sqlTogli, sqlCompatta, sqlLeggi }
  from "../strumenti/dispensa.mjs";
let ko = 0; const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const rifiuta = (f, perche) => { try { f(); return `NON si e' rifiutato: ${perche}`; } catch (e) { return null; } };

console.log("\n— 1. i tetti parlano invece di mordere —");
const voci = [{ id: "a", t: 1, tag: "sapere", titolo: "A", car: 100 }];
ok(controllaTetti(voci, "x".repeat(TETTI.VOCE + 1)) !== null, "una voce oltre i 16.000 caratteri viene rifiutata");
ok(String(controllaTetti(voci, "x".repeat(TETTI.VOCE + 1))).includes("divisa"), "e il rifiuto dice cosa fare");
const tante = Array.from({ length: TETTI.VOCI }, (_, i) => ({ id: `v${i}`, t: 1, tag: "x", titolo: "V", car: 10 }));
ok(controllaTetti(tante, "ciao") !== null, "la 501ª voce viene rifiutata");
ok(String(controllaTetti(tante, "ciao")).includes("compatta"), "e il rifiuto indica la compattazione");
const grosse = Array.from({ length: 200 }, (_, i) => ({ id: `g${i}`, t: 1, tag: "x", titolo: "G", car: 15000 }));
ok(controllaTetti(grosse, "ciao") !== null, "il tetto TOTALE (3 milioni) viene rifiutato");
ok(controllaTetti(voci, "una voce normale") === null, "e una scrittura normale passa");
ok(controllaTetti(grosse.slice(0, 150), "x".repeat(15000), { assorbite: ["g0", "g1"] }) === null,
  "compattare fa spazio: le assorbite non contano nel totale");

console.log("\n— 2. il ripiegamento non perde il filo —");
const dopo = vociDopoScrittura(voci.filter((v) => v.id !== "a"), { id: "sunto-1", tag: "sunto", titolo: "S", car: 50, assorbe: ["a"] });
ok(dopo.length === 1 && dopo[0].assorbe?.[0] === "a", "l'indice ricorda chi ha assorbito cosa");
const sql1 = sqlCompatta({ rev: 4, voci }, { id: "sunto-1", tag: "sunto", titolo: "S", testo: "il sunto", assorbite: ["a"] });
ok(/delete from kv_store where key in \('ctx:v1:voce:a'\)/.test(sql1), "le voci assorbite escono dal deposito");
ok(rifiuta(() => sqlCompatta({ rev: 4, voci }, { id: "sunto-1", tag: "s", titolo: "S", testo: "x", assorbite: ["manca"] }),
  "assorbire una voce che non esiste") === null, "assorbire una voce inesistente si rifiuta");
ok(rifiuta(() => sqlCompatta({ rev: 4, voci: dopo }, { id: "sunto-1", tag: "s", titolo: "S", testo: "x", assorbite: ["sunto-1"] }),
  "assorbire se stesso") === null, "un sunto non puo' assorbire se stesso");

console.log("\n— 3. due mani non si pestano: il cancello sta DENTRO l'SQL —");
const sql2 = sqlScrivi({ rev: 7, voci }, { id: "prova-x", tag: "sapere", titolo: "P", testo: "ciao" });
ok(/\(value::jsonb->>'rev'\)::int = 7/.test(sql2), "l'indice si tocca solo se la revisione e' ancora la 7");
const b64indice = [...sql2.matchAll(/decode\('([A-Za-z0-9+/=]+)', 'base64'\)/g)].pop();
const indiceScritto = JSON.parse(Buffer.from(b64indice[1], "base64").toString("utf8"));
ok(indiceScritto.rev === 8, `e la scrittura porta la revisione a 8 (porta ${indiceScritto.rev})`);
ok(indiceScritto.voci.some((v) => v.id === "prova-x" && v.car === 4), "con la voce nuova e la sua misura dentro l'indice");
ok(/CONFLITTO/.test(sql2), "e l'esito dice a voce alta se qualcun altro ha scritto prima");
ok(rifiuta(() => sqlScrivi({ rev: 7, voci }, { id: "MAIUSCOLO", tag: "x", titolo: "X", testo: "x" }),
  "id maiuscolo") === null, "un id fuori regola si rifiuta (niente chiavi sorprendenti nel database)");
ok(!idValido("a'; drop table kv_store; --"), "un id con dentro dell'SQL non e' un id");

console.log("\n— 4. il giro completo e' fedele, accenti compresi —");
const testo = "È l'unità « perché » — Ho l'apostrofo e /[\\u0300-\\u036f]/ dentro.";
const sql3 = sqlScrivi({ rev: 0, voci: [] }, { id: "fedele", tag: "prova", titolo: "F", testo });
const dentro = sql3.match(/decode\('([A-Za-z0-9+/=]+)', 'base64'\)/);
ok(!!dentro, "il testo viaggia in base64, non in chiaro");
ok(Buffer.from(dentro[1], "base64").toString("utf8") === testo, "e decodificato torna IDENTICO, apostrofi e accenti compresi");
ok(/order by key/.test(sqlLeggi(["a", "b"])), "le letture multiple tornano in ordine stabile");

console.log(ko ? `\n${ko} CONTROLLI FALLITI` : "\nTUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
