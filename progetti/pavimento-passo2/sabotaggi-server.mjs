/* I SABOTAGGI DELLA TESSERA SQL DEL PASSO 2, CONTATI UNO PER UNO.

   Si parte dal testo INTEGRO della tessera, si rompe UNA cosa sola, si gira
   servertest.mjs su quella copia (via SORGENTE_SQL) e si contano i rossi. Un
   MUTO non e' un risultato: e' una domanda, e va aperta. Qui NON si costruisce
   nessun pacchetto e non si tocca app.jsx — il bersaglio e' la funzione SQL,
   quindi questa macchina puo' girare anche mentre gira un banco col browser.

   IL BERSAGLIO e' strumenti/server/app_kv_set.sql (o VERO_SQL). Serve dentro
   collaudi/ perche' servertest.mjs risolve «pg» da collaudi/node_modules.

   UNA COSA IMPARATA A CARO PREZZO, E SCRITTA QUI PERCHE' NON SI RIPETA: per un
   giro intero questo file ha portato la frase «il sabotaggio che rimette il FOR
   UPDATE DENTRO il blocco EXCEPTION non arrossisce niente, misurato 40 gare su
   40». Era FALSA. Quelle 40 gare correvano sullo STESSO token, e a mettere in
   fila le due casse era l'UPDATE di app_sess_valida sulla riga di sessione
   condivisa — mai il cancello. Con un token per cassa, come in pizzeria, il
   difetto si vede subito: 98 vendite perse su 100. Quel sabotaggio adesso c'e',
   e' S9, e arrossisce §8a e §8d.
   LA REGOLA CHE NE RESTA: un MUTO non e' mai una notizia sul codice finche' non
   hai guardato se e' il BANCO a non saper distinguere i due mondi.

   Uso: node sabotaggi-server.mjs [numero]   (senza numero: tutti) */
import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { spawnSync } from "child_process";

const VERO = process.env.VERO_SQL || "../strumenti/server/app_kv_set.sql";
const LAVORO = "/tmp/tessera-sabotata.sql";
const DIARIO = "/tmp/diario-sabotaggi-server.txt";

const MONO = `      INSERT INTO public.kv_store(key, value) VALUES (p_key, p_value)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
        WHERE (CASE WHEN kv_store.value ~ '^[0-9]{1,30}$' THEN kv_store.value::numeric END) IS NULL
           OR EXCLUDED.value::numeric > (CASE WHEN kv_store.value ~ '^[0-9]{1,30}$' THEN kv_store.value::numeric END);`;
const SPIA_STATO = `    IF v_rev IS NOT NULL THEN
      INSERT INTO public.kv_store(key, value) VALUES ('scp:rev:v1', v_rev::text)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
    END IF;`;

const SABOTAGGI = [
  { n: 1, nome: "via la WHERE monotona del ramo diretto: un numero piu' basso scavalca",
    attesa: "§5 rossa: la spia torna indietro (9 poi 3 diventa 3)",
    da: MONO,
    a: `      INSERT INTO public.kv_store(key, value) VALUES (p_key, p_value)\n        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();` },

  { n: 2, nome: "il ramo diretto usa ::numeric invece del regex delle cifre",
    attesa: "§5 rossa: 'NaN' e' un numeric valido, e in Postgres NaN e' maggiore di tutto: la spia si avvelena",
    da: "    IF p_value ~ '^[0-9]{1,30}$' THEN",
    a: "    IF p_value::numeric IS NOT NULL THEN" },

  { n: 3, nome: "via la scrittura della spia nel ramo dello stato",
    attesa: "§4 rossa (e §7, §10): la spia non nasce piu' insieme allo stato",
    da: SPIA_STATO,
    a: "    IF false THEN NULL; END IF;" },

  { n: 4, nome: "la spia del ramo dello stato diventa monotona",
    attesa: "§10 rossa: un ri-seed a rev 1 sopra una spia a 1785… la lascia alta per sempre",
    da: SPIA_STATO,
    a: `    IF v_rev IS NOT NULL THEN\n      INSERT INTO public.kv_store(key, value) VALUES ('scp:rev:v1', v_rev::text)\n        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()\n        WHERE EXCLUDED.value::numeric > kv_store.value::numeric;\n    END IF;` },

  { n: 5, nome: "la spia del ramo dello stato passa da float8",
    attesa: "§7 rossa: la rev enorme 1785829928480462 in float8 perde cifre",
    da: "      INSERT INTO public.kv_store(key, value) VALUES ('scp:rev:v1', v_rev::text)",
    a: "      INSERT INTO public.kv_store(key, value) VALUES ('scp:rev:v1', v_rev::float8::text)" },

  { n: 6, nome: "il cancello confronta con «<» invece che con «<>»",
    attesa: "§3 rossa: con il minore-di una revBase futura passa, cioe' il caso per cui il cancello esiste",
    da: "      IF v_c_e AND coalesce(v_ora, 0) <> v_atteso THEN",
    a: "      IF v_c_e AND coalesce(v_ora, 0) < v_atteso THEN" },

  { n: 7, nome: "l'ERRCODE del conflitto cambia (40001 -> 40002)",
    attesa: "§2 rossa (e §3): scriviRemoto e i banchi riconoscono r.code === '40001'",
    da: "USING ERRCODE = '40001';",
    a: "USING ERRCODE = '40002';" },

  { n: 8, nome: "via la riparazione del NUL",
    attesa: "§11 rossa: uno stato con l'escape NUL manda in errore ::jsonb e spegne il cancello per tutti",
    da: `    EXCEPTION WHEN others THEN
      p_value := replace(p_value, chr(92) || 'u0000', chr(92) || 'ufffd');
      BEGIN
        v_atteso := (p_value::jsonb ->> 'revBase')::numeric;
      EXCEPTION WHEN others THEN v_atteso := NULL;
      END;
    END;`,
    a: `    EXCEPTION WHEN others THEN v_atteso := NULL;
    END;` },

  { n: 9, nome: "via la Modifica 1: il lucchetto torna DENTRO il blocco con l'EXCEPTION",
    attesa: "§8a e §8d rosse: sul valore corrotto il rollback della sottotransazione rilascia il lucchetto, passano due casse e una vendita sparisce sotto l'altra",
    da: `      SELECT true INTO v_c_e FROM public.kv_store WHERE key = p_key FOR UPDATE;
      v_c_e := coalesce(v_c_e, false);
      IF v_c_e THEN
        BEGIN
          SELECT (value::jsonb ->> 'rev')::numeric INTO v_ora
            FROM public.kv_store WHERE key = p_key;
        EXCEPTION WHEN others THEN v_c_e := false; v_ora := NULL;
        END;
      END IF;`,
    a: `      BEGIN
        SELECT true, (value::jsonb ->> 'rev')::numeric INTO v_c_e, v_ora
          FROM public.kv_store WHERE key = p_key FOR UPDATE;
      EXCEPTION WHEN others THEN v_c_e := false; v_ora := NULL;
      END;` },

  { n: 10, nome: "la riparazione del NUL torna golosa (fatta sempre, non solo sul rotto)",
    attesa: "§11 rossa sul rovescio: un testo VALIDO che contiene quelle sei lettere viene alterato in silenzio",
    da: `    BEGIN
      v_atteso := (p_value::jsonb ->> 'revBase')::numeric;
    EXCEPTION WHEN others THEN
      p_value := replace(p_value, chr(92) || 'u0000', chr(92) || 'ufffd');`,
    a: `    p_value := replace(p_value, chr(92) || 'u0000', chr(92) || 'ufffd');
    BEGIN
      v_atteso := (p_value::jsonb ->> 'revBase')::numeric;
    EXCEPTION WHEN others THEN
      p_value := replace(p_value, chr(92) || 'u0000', chr(92) || 'ufffd');` },
];

const arg = process.argv[2] ? Number(process.argv[2]) : null;
const vero = readFileSync(VERO, "utf8");
appendFileSync(DIARIO, `\n=== giro del ${new Date().toISOString()} su ${VERO} ===\n`);
console.log(`sabotaggi della tessera SQL del PASSO 2 — ${arg ? "solo S" + arg : SABOTAGGI.length + " da girare"} · bersaglio ${VERO}\n`);
let buoni = 0, cattivi = 0;
for (const sab of SABOTAGGI) {
  if (arg && sab.n !== arg) continue;
  const c = vero.split(sab.da).length - 1;
  if (c !== 1) {
    const riga = `S${sab.n} «${sab.nome}» — NON APPLICABILE: l'ancora compare ${c} volte`;
    console.log("  !!  " + riga); appendFileSync(DIARIO, riga + "\n"); cattivi++;
    continue;
  }
  writeFileSync(LAVORO, vero.replace(sab.da, sab.a));
  const r = spawnSync(process.execPath, ["servertest.mjs"], { encoding: "utf8", maxBuffer: 16e6, env: { ...process.env, SORGENTE_SQL: LAVORO } });
  const out = (r.stdout || "") + (r.stderr || "");
  if (/NON si carica/.test(out)) {
    const riga = `S${sab.n} «${sab.nome}» — IL TESTO NON SI CARICA (e' un'informazione, non un rosso)`;
    console.log("  !!  " + riga); appendFileSync(DIARIO, riga + "\n"); cattivi++;
    continue;
  }
  const rossi = (out.match(/^ {2}KO {2}/gm) || []).length;
  const sezioni = [...new Set(out.split("\n").reduce((acc, l) => {
    if (/^— \d+[a-z]?\./.test(l)) acc.sez = "§" + l.match(/^— (\d+[a-z]?)\./)[1];
    if (/^ {2}KO {2}/.test(l) && acc.sez) acc.list.push(acc.sez);
    return acc;
  }, { sez: null, list: [] }).list)].join(" ");
  const esito = rossi === 0 ? "MUTO — DA APRIRE" : `${rossi} rossi in ${sezioni}`;
  const buono = rossi > 0;
  buono ? buoni++ : cattivi++;
  const riga = `S${sab.n} «${sab.nome}» — atteso ${sab.attesa} · ${esito}`;
  console.log((buono ? "  ok  " : "  !!  ") + riga);
  appendFileSync(DIARIO, riga + "\n");
}
console.log(`\n${buoni} come attesi, ${cattivi} da guardare · diario in ${DIARIO}`);
process.exit(cattivi ? 1 : 0);
