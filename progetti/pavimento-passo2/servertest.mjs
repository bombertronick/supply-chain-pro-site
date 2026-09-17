/* IL BANCO DEL SERVER — app_kv_set dentro un Postgres VERO, a piu' connessioni.

   PERCHE' ESISTE. Fino a qui ogni banco di questa casa modellava il server con
   un finto server in JavaScript (una Map e due if): comodo per il client,
   cieco sulla funzione vera. Il PASSO 2 del pavimento del traffico
   (progetti/pavimento-traffico.md, «IL SERVER») tocca l'UNICA funzione da cui
   passa OGNI scrittura dell'app, strumenti/server/app_kv_set.sql, e un
   controllo che non puo' diventare rosso su quella funzione non e' un
   controllo. Qui la funzione gira davvero: un PostgreSQL 18 scaricato con
   npm (embedded-postgres) parte su una porta locale, esegue il testo SQL
   cosi' com'e' — FOR UPDATE, blocchi EXCEPTION, jsonb, RAISE ... USING
   ERRCODE — e accetta PIU' CONNESSIONI, che e' l'unica cosa che serve per
   vedere la Modifica 1 (il lucchetto fuori dal blocco che puo' sollevare):
   una gara fra due telefoni si mette in scena con tre connessioni e un
   lucchetto tenuto da fuori. La prima stesura girava su PGlite (Postgres in
   wasm, una connessione sola) e doveva DICHIARARE quel limite; con il server
   vero il limite non c'e' piu', e i due sabotaggi che restavano muti si
   aprono (sabotaggi-server S1 e S12).

   NON ROOT. Postgres si rifiuta di girare come root, e in questo contenitore
   il banco gira come root: initdb e postgres vengono lanciati come uid 65534
   (nobody) su una cartella temporanea di loro proprieta'. In CI il banco gira
   gia' come utente normale e non cambia niente.

   COSA MISURA. Gli osservabili nudi della funzione: il json che torna, lo
   SQLSTATE dell'eccezione, il valore delle chiavi dopo ogni chiamata, e nella
   gara CHI passa e chi riceve il 40001. Le tre promesse del PASSO 2 — la spia
   scp:rev:v1 la scrive il SERVER nella stessa transazione dello stato, la spia
   e' MONOTONA, un valore corrotto non mura nessuno E non apre una gara — e le
   tre cose che NON devono cambiare: le forme di risposta ({error:'auth'},
   {ok:true}, il RAISE 40001 col messaggio italiano), il cancello revBase con
   «<>» e non «<», il passaggio del client senza revBase.

   QUALE TESTO SI PROVA. Di regola strumenti/server/app_kv_set.sql, cioe' la
   tessera NUOVA. Con SORGENTE_SQL=<file> si prova un altro testo: la macchina
   dei sabotaggi ci passa la copia rotta, e la registrazione dei rossi ci passa
   strumenti/server/app_kv_set.ritorno.sql, che e' la produzione di prima del
   PASSO 2 byte per byte (md5 4e43d3be9cf2227b62baa090c9b5482a). Su quel testo
   §4, §5, §6b, §7, §8a e §8b DEVONO essere rosse: sono i rossi registrati
   sulla versione online.

   Uso: node servertest.mjs            (nessun browser, nessuna rete esterna) */
import { createRequire } from "module";
import { readFileSync, existsSync, mkdtempSync, rmSync, chownSync } from "fs";
import { spawn, spawnSync } from "child_process";
import { tmpdir } from "os";
import path from "path";

let ko = 0;
const ok = (c, m) => { console.log((c ? "  ok  " : "  KO  ") + m); if (!c) ko++; };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

const QUI = path.dirname(new URL(import.meta.url).pathname);
const RAD = [path.resolve(QUI, ".."), QUI, path.resolve(".."), path.resolve(".")]
  .find((d) => existsSync(path.join(d, "strumenti", "server", "app_kv_set.sql")));
if (!RAD) { console.error("KO  non trovo strumenti/server/app_kv_set.sql accanto a " + QUI); process.exit(1); }
const SORGENTE = process.env.SORGENTE_SQL || path.join(RAD, "strumenti", "server", "app_kv_set.sql");
const testoSql = readFileSync(SORGENTE, "utf8");
console.log(`sorgente: ${SORGENTE}`);

const require = createRequire(path.join(QUI, "servertest.mjs"));
const { Client } = require("pg");
const BIN = path.join(QUI, "node_modules", "@embedded-postgres", `${process.platform}-${process.arch}`, "native", "bin");
if (!existsSync(path.join(BIN, "postgres"))) {
  console.error(`KO  manca il Postgres di embedded-postgres per ${process.platform}-${process.arch} (npm install in collaudi/)`);
  process.exit(1);
}

/* ── IL SERVER, UNO PER GIRO ── */
const UID = typeof process.getuid === "function" && process.getuid() === 0 ? 65534 : undefined;
const DATI = mkdtempSync(path.join(tmpdir(), "servertest-"));
if (UID != null) chownSync(DATI, UID, UID);
const PORTA = 54000 + (process.pid % 900);
const ambiente = { ...process.env, LD_LIBRARY_PATH: path.join(BIN, "..", "lib") };
const init = spawnSync(path.join(BIN, "initdb"), ["-D", DATI, "-U", "banco", "--auth=trust", "-E", "UTF8", "--no-locale"],
  { uid: UID, gid: UID, encoding: "utf8", env: ambiente });
if (init.status !== 0) { console.error("KO  initdb non parte: " + (init.stderr || "").slice(-300)); process.exit(1); }
const server = spawn(path.join(BIN, "postgres"), ["-D", DATI, "-p", String(PORTA), "-k", DATI, "-c", "listen_addresses=127.0.0.1", "-c", "log_min_messages=fatal"],
  { uid: UID, gid: UID, env: ambiente, stdio: ["ignore", "pipe", "pipe"] });
let logServer = ""; server.stderr.on("data", (d) => { logServer += d; });
const spegni = () => { try { server.kill("SIGINT"); } catch {} try { rmSync(DATI, { recursive: true, force: true }); } catch {} };
process.on("exit", spegni);
/* «pronto» si misura connettendosi, non leggendo il log: col log zittito la
   riga «ready to accept connections» non c'e', e un banco che aspetta una
   frase e' un banco che si rompe alla prima riga cambiata */
/* un Client di pg che ha fallito la connessione non si puo' riusare: se ne
   fa uno nuovo a ogni tentativo, e resta vivo solo quello che e' entrato */
let amministra = null;
for (let i = 0; i < 200 && !amministra; i++) {
  const c = new Client({ host: "127.0.0.1", port: PORTA, user: "banco", database: "postgres" });
  try { await c.connect(); amministra = c; }
  catch { try { await c.end(); } catch {} await pausa(100); }
}
const pronto = !!amministra;
if (!pronto) { console.error("KO  postgres non e' partito in 20 s: " + logServer.slice(-300)); process.exit(1); }
console.log(`      ${(await amministra.query("select version()")).rows[0].version.replace(/,.*$/, "")} sulla porta ${PORTA}`);

/* ── LA FIXTURE: la tabella e la sessione come sono in produzione ──
   Colonne, default e app_sess_valida letti dalla rete il 17 settembre
   (information_schema.columns e pg_get_functiondef). Niente RLS: le funzioni
   sono SECURITY DEFINER e in rete girano col proprietario, quindi le policy
   non entrano nel comportamento che qui si misura. Ogni sezione ha il suo
   database, cosi' nessuna eredita lo stato di un'altra. */
let nDb = 0;
async function nuovoServer(sql) {
  const nome = "s" + (++nDb);
  await amministra.query(`create database ${nome}`);
  const connetti = async () => { const c = new Client({ host: "127.0.0.1", port: PORTA, user: "banco", database: nome }); await c.connect(); return c; };
  const db = await connetti();
  await db.query(`
create table public.kv_store(key text primary key, value text, updated_at timestamptz default now());
create table public.app_sessione(token uuid primary key default gen_random_uuid(), profilo_id text, ruolo text,
  creato timestamptz default now(), scade timestamptz default now() + interval '30 days', visto timestamptz default now());
CREATE OR REPLACE FUNCTION public.app_sess_valida(p_token uuid)
 RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  UPDATE public.app_sessione SET visto = now() WHERE token = p_token AND scade > now() RETURNING true;
$function$;
-- IL FRENO DEL BANCO: non esiste in produzione e non cambia la semantica di
-- niente; allarga una finestra di microsecondi fino a mezzo secondo. Un
-- trigger BEFORE INSERT scatta PRIMA che l'INSERT tenti di inserire, cioe'
-- prima che ON CONFLICT trovi la riga e la blocchi: e' esattamente l'istante
-- fra la fine del blocco EXCEPTION e l'INSERT dentro app_kv_set. Dorme solo
-- nella sessione che ha impostato banco.freno = '1'.
CREATE FUNCTION public.banco_freno() RETURNS trigger LANGUAGE plpgsql AS $f$
BEGIN
  IF current_setting('banco.freno', true) = '1' THEN PERFORM pg_sleep(0.4); END IF;
  RETURN NEW;
END $f$;
CREATE TRIGGER banco_freno BEFORE INSERT ON public.kv_store FOR EACH ROW EXECUTE FUNCTION public.banco_freno();`);
  await db.query(sql);
  const tok = (await db.query(`insert into app_sessione(profilo_id, ruolo) values ('pr-prova','admin') returning token`)).rows[0].token;
  /* IL SECONDO TOKEN NON E' UN DETTAGLIO: due casse vere hanno due sessioni. Con un
     token solo, app_sess_valida fa un UPDATE sulla STESSA riga di sessione e mette in
     fila le due chiamate PRIMA che arrivino al cancello — il banco diventa verde per
     il lucchetto della sessione, non per il cancello, e una gara persa non si vede. */
  const tok2 = (await db.query(`insert into app_sessione(profilo_id, ruolo) values ('pr-prova-2','admin') returning token`)).rows[0].token;
  const chiama = async (conn, k, v, t = tok) => {
    try { const r = await conn.query(`select public.app_kv_set($1::uuid, $2, $3) as r`, [t, k, v]); return { risposta: r.rows[0].r }; }
    catch (e) { return { stato: e.code || null, messaggio: String(e.message) }; }
  };
  const set = (k, v, t) => chiama(db, k, v, t);
  const get = async (k) => (await db.query(`select value from kv_store where key = $1`, [k])).rows[0]?.value ?? null;
  const riga = async (k) => (await db.query(`select value, updated_at from kv_store where key = $1`, [k])).rows[0] ?? null;
  const rev = async () => { try { return JSON.parse(await get("scp:stato:v1")).rev; } catch { return "corrotto"; } };
  const diretto = (q, p = []) => db.query(q, p);
  const impronta = async () => (await db.query(`select md5(pg_get_functiondef('public.app_kv_set'::regproc)) as md5, length(pg_get_functiondef('public.app_kv_set'::regproc)) as len`)).rows[0];
  const aperte = [db];
  const altra = async () => { const c = await connetti(); aperte.push(c); return c; };
  const chiudi = async () => { for (const c of aperte) { try { await c.end(); } catch {} } };
  return { db, tok, tok2, set, chiama, get, riga, rev, diretto, impronta, altra, chiudi };
}
const CHIAVE = "scp:stato:v1", SPIA = "scp:rev:v1";
const NESSUNO = "00000000-0000-0000-0000-000000000000";
const stato = (rev, revBase, extra = {}) => JSON.stringify({ rev, ...(revBase != null ? { revBase } : {}), ...extra });
const esitoDi = (x) => x.stato || (x.risposta && x.risposta.ok === true ? "ok" : JSON.stringify(x.risposta));

/* ═══ 1. LA FUNZIONE SI CARICA IN UN POSTGRES VERO ═══ */
console.log("\n— 1. la funzione si carica in un Postgres vero —");
let srv;
try { srv = await nuovoServer(testoSql); ok(true, "il testo SQL si carica senza errori (tabella, sessione, app_kv_set)"); }
catch (e) { ok(false, "il testo SQL NON si carica: " + String(e.message).slice(0, 160)); console.log(`\nservertest: ${ko} controlli KO`); process.exit(1); }
const imp = await srv.impronta();
console.log(`      impronta della funzione caricata: md5 ${imp.md5} · ${imp.len} caratteri`);
ok(/^[0-9a-f]{32}$/.test(imp.md5), "e pg_get_functiondef restituisce un'impronta misurabile: e' quella che il cancello del rilascio confronta");

/* ═══ 2. LE TRE FORME DI RISPOSTA NON CAMBIANO ═══
   scriviRemoto (app.jsx) riconosce tre forme: {error:'auth'} come VALORE,
   l'eccezione 40001 col messaggio italiano che nomina le due revisioni, e
   {ok:true}. Cambiarne una fa credere al client «salvato» o «caduta la linea»
   nel caso sbagliato (gen-6.07 l'ha pagato). */
console.log("\n— 2. le tre forme di risposta —");
{
  const r = await srv.set(CHIAVE, stato(1, 0), NESSUNO);
  ok(r.risposta && r.risposta.error === "auth", `sessione scaduta → torna {error:'auth'} come valore, non un'eccezione (letto: ${JSON.stringify(r.risposta ?? r.stato)})`);
  const s = await srv.set(CHIAVE, stato(1, 0));
  ok(s.risposta && s.risposta.ok === true, `scrittura riuscita → {ok:true} (letto: ${JSON.stringify(s.risposta ?? s.stato)})`);
  const c = await srv.set(CHIAVE, stato(2, 0));
  ok(c.stato === "40001", `conflitto → eccezione SQLSTATE 40001 (letto: ${c.stato ?? JSON.stringify(c.risposta)})`);
  ok(/conflitto: in rete c'e' la revisione 1, questa scrittura parte dalla 0/.test(c.messaggio || ""),
    `e il messaggio e' quello italiano con le DUE revisioni dentro (letto: «${(c.messaggio || "").slice(0, 90)}»)`);
}

/* ═══ 3. IL CANCELLO revBase RESTA COM'E' ═══ */
console.log("\n— 3. il cancello revBase —");
{
  const giusta = await srv.set(CHIAVE, stato(2, 1));
  ok(giusta.risposta?.ok === true && (await srv.rev()) === 2, `revBase uguale alla rev in rete → passa, e la rev in rete diventa 2 (letto: ${await srv.rev()})`);
  const vecchia = await srv.set(CHIAVE, stato(3, 1));
  ok(vecchia.stato === "40001" && (await srv.rev()) === 2, `revBase vecchia (1 contro 2) → 40001 e la rev in rete resta 2 (letto: ${vecchia.stato}, rev ${await srv.rev()})`);
  const futura = await srv.set(CHIAVE, stato(9, 5));
  ok(futura.stato === "40001", `revBase FUTURA (5 contro 2) → 40001 lo stesso: il confronto e' «<>», non «<» (letto: ${futura.stato ?? JSON.stringify(futura.risposta)})`);
  const senza = await srv.set(CHIAVE, stato(7));
  ok(senza.risposta?.ok === true && (await srv.rev()) === 7, `senza revBase (client vecchio durante il passaggio) → passa come prima (rev in rete ${await srv.rev()})`);
  const prima = await srv.riga(CHIAVE);
  await pausa(15);
  await srv.set(CHIAVE, stato(8, 7));
  const dopo = await srv.riga(CHIAVE);
  ok(new Date(dopo.updated_at) > new Date(prima.updated_at), "e updated_at della riga dello stato avanza a ogni scrittura riuscita");
}

/* ═══ 4. LA SPIA LA SCRIVE IL SERVER, NELLA STESSA TRANSAZIONE ═══
   E' la DECISIONE ZERO del disegno. Oggi la spia la scrive il client in una
   SECONDA chiamata, dopo lo stato, dentro un catch vuoto: puo' restare
   indietro (risposta persa) e puo' tornare indietro (ciclo sorpassato). Con
   la tessera la scrive la funzione stessa, dopo l'INSERT dello stato, quindi o
   passano tutte e due o nessuna. L'osservabile e' nudo: dopo OGNI scrittura
   riuscita dello stato, scp:rev:v1 == String(rev), su un giro intero in cui
   il client non scrive mai la spia. */
console.log("\n— 4. la spia la scrive il server, nella stessa transazione —");
{
  const s2 = await nuovoServer(testoSql);
  await s2.set(CHIAVE, stato(1, 0));
  ok((await s2.get(SPIA)) === "1", `al primo seed (rev 1) la spia nasce insieme allo stato (letto: ${JSON.stringify(await s2.get(SPIA))})`);
  await s2.set(CHIAVE, stato(2, 1));
  ok((await s2.get(SPIA)) === "2", `dopo una scrittura col cancello (1→2) la spia dice 2 (letto: ${JSON.stringify(await s2.get(SPIA))})`);
  await s2.set(CHIAVE, stato(7));
  ok((await s2.get(SPIA)) === "7", `dopo una scrittura SENZA revBase (client vecchio) la spia dice 7 lo stesso: la spia non dipende dalla versione del telefono (letto: ${JSON.stringify(await s2.get(SPIA))})`);
  const rifiutata = await s2.set(CHIAVE, stato(9, 3));
  ok(rifiutata.stato === "40001" && (await s2.get(SPIA)) === "7", `una scrittura RIFIUTATA non tocca la spia (letto: ${JSON.stringify(await s2.get(SPIA))})`);
  /* uno stato senza «rev» leggibile (un payload storto) non deve azzerare la
     spia: e' la scena che apre il sabotaggio S11, che altrimenti sarebbe muto */
  const storto = await s2.set(CHIAVE, JSON.stringify({ revBase: 7, x: 1 }));
  ok(storto.risposta?.ok === true && (await s2.get(SPIA)) === "7", `uno stato senza rev leggibile passa (revBase giusta) ma NON tocca la spia (letto: ${JSON.stringify(await s2.get(SPIA))})`);
  await s2.set(CHIAVE, stato(7));
  const rS = await s2.riga(SPIA), rR = await s2.riga(CHIAVE);
  ok(rS && rR && Math.abs(new Date(rS.updated_at) - new Date(rR.updated_at)) < 5,
    `e la spia e lo stato portano lo STESSO istante: stessa transazione, non due chiamate (letto: ${rS && rR ? Math.abs(new Date(rS.updated_at) - new Date(rR.updated_at)) + " ms" : "manca una riga"})`);
  await s2.chiudi();
}

/* ═══ 5. LA SPIA E' MONOTONA ═══
   Finche' un telefono non ricaricato (oggi in produzione scrivono gen-6.17 e
   gen-6.18) continua a scrivere la spia dal client, sulla chiave ci sono DUE
   scrittori. Il server accetta solo se il numero SALE: una spia piu' bassa —
   il ciclo sorpassato di gen-6.21, o due telefoni che atterrano fuori ordine —
   viene ignorata SENZA errore, perche' il client la manda dentro un catch
   vuoto e non deve accorgersi di niente. FAIL-OPEN sul valore in rete che non
   e' un numero: la spia deve poter guarire da un dato storto. */
console.log("\n— 5. la spia e' monotona —");
{
  const s3 = await nuovoServer(testoSql);
  await s3.set(CHIAVE, stato(7, 0));
  const su = await s3.set(SPIA, "9");
  ok(su.risposta?.ok === true && (await s3.get(SPIA)) === "9", `il client scrive 9 sopra 7: sale, passa (letto: ${JSON.stringify(await s3.get(SPIA))})`);
  const giu = await s3.set(SPIA, "3");
  ok(giu.risposta?.ok === true, `il client scrive 3 sopra 9: la risposta resta {ok:true} — il client non deve vedere un errore (letto: ${JSON.stringify(giu.risposta ?? giu.stato)})`);
  ok((await s3.get(SPIA)) === "9", `…ma in rete resta 9: la spia NON torna indietro (letto: ${JSON.stringify(await s3.get(SPIA))})`);
  const pari = await s3.set(SPIA, "9");
  ok(pari.risposta?.ok === true && (await s3.get(SPIA)) === "9", `lo stesso numero riscritto (9 su 9) e' innocuo (letto: ${JSON.stringify(await s3.get(SPIA))})`);
  await s3.diretto(`update kv_store set value = 'boh' where key = $1`, [SPIA]);
  const guarisce = await s3.set(SPIA, "4");
  ok(guarisce.risposta?.ok === true && (await s3.get(SPIA)) === "4", `valore in rete NON numerico («boh»): la scrittura passa e la spia guarisce (letto: ${JSON.stringify(await s3.get(SPIA))})`);
  await s3.diretto(`delete from kv_store where key = $1`, [SPIA]);
  const nasce = await s3.set(SPIA, "5");
  ok(nasce.risposta?.ok === true && (await s3.get(SPIA)) === "5", `spia assente: la prima scrittura la crea (letto: ${JSON.stringify(await s3.get(SPIA))})`);
  /* NaN E' UN VELENO: numeric accetta 'NaN' e in Postgres NaN e' MAGGIORE di
     tutto, quindi una spia 'NaN' passerebbe ogni «<=» e nessun numero la
     scavalcherebbe piu' — la spia morta in alto, il traffico strozzato per
     sempre. Il ramo diretto guarda le CIFRE con un regex, non ::numeric, quindi
     'NaN' non e' nemmeno una scrittura valida e la spia resta dov'era. */
  const veleno = await s3.set(SPIA, "NaN");
  ok(veleno.risposta?.ok === true && (await s3.get(SPIA)) === "5", `una spia «NaN» viene ignorata, non avvelena (letto: ${JSON.stringify(await s3.get(SPIA))})`);
  const inf = await s3.set(SPIA, "Infinity");
  ok((await s3.get(SPIA)) === "5", `e nemmeno «Infinity» (letto: ${JSON.stringify(await s3.get(SPIA))})`);
  const dopo = await s3.set(SPIA, "8");
  ok((await s3.get(SPIA)) === "8", `e dopo un numero vero sale ancora: la spia non era rimasta murata (letto: ${JSON.stringify(await s3.get(SPIA))})`);
  await s3.chiudi();
}

/* ═══ 6. IL VALORE CORROTTO NON MURA NESSUNO, E SI RIPARA ═══
   Il disegno tiene l'apertura voluta della funzione di oggi («meglio una
   scrittura in piu' che un'app bloccata per sempre da un dato corrotto»): su
   uno stato illeggibile la prima scrittura passa e RIPARA, la seconda con la
   stessa revBase trova il valore riparato e riceve il 40001. In SEQUENZA e'
   cosi' anche oggi; quello che cambia e' che la spia segue la riparazione
   (§6b) e che due scritture CONTEMPORANEE non passano tutte e due (§8). */
console.log("\n— 6. il valore corrotto non mura nessuno, e si ripara —");
{
  const s4 = await nuovoServer(testoSql);
  await s4.set(CHIAVE, stato(7, 0));
  await s4.diretto(`update kv_store set value = 'NON-JSON' where key = $1`, [CHIAVE]);
  const prima = await s4.set(CHIAVE, stato(8, 7));
  ok(prima.risposta?.ok === true && (await s4.rev()) === 8, `§6a: sullo stato illeggibile la prima scrittura passa e ripara (rev in rete: ${await s4.rev()})`);
  ok((await s4.get(SPIA)) === "8", `§6b: e la spia segue la riparazione (letto: ${JSON.stringify(await s4.get(SPIA))})`);
  const seconda = await s4.set(CHIAVE, stato(8, 7));
  ok(seconda.stato === "40001", `§6a: la seconda, con la stessa revBase, trova il valore riparato e riceve il 40001 (letto: ${seconda.stato ?? JSON.stringify(seconda.risposta)})`);
  await s4.chiudi();
}

/* ═══ 7. LA REV ENORME VIAGGIA INTATTA ═══
   In produzione la rev e' 1785829928480461: nasce da un timestamp in
   microsecondi e sale di uno a ogni scrittura. Sta sotto 2^53, quindi il
   client la legge intera; il server la deve riscrivere nella spia SENZA
   esponente e senza arrotondamento, perche' il client la confronta con
   Number(r.value) contro base.rev. */
console.log("\n— 7. la rev enorme viaggia intatta —");
{
  const s5 = await nuovoServer(testoSql);
  await s5.set(CHIAVE, stato(1785829928480461, 0));
  const r = await s5.set(CHIAVE, stato(1785829928480462, 1785829928480461));
  ok(r.risposta?.ok === true && (await s5.rev()) === 1785829928480462, `la scrittura 1785829928480461→…462 passa il cancello (rev in rete: ${await s5.rev()})`);
  ok((await s5.get(SPIA)) === "1785829928480462", `e la spia dice esattamente «1785829928480462», senza esponente (letto: ${JSON.stringify(await s5.get(SPIA))})`);
  await s5.chiudi();
}

/* ═══ 8. LE GARE — la concorrenza vera, con tre connessioni ═══
   E' la parte che un Postgres a una connessione non poteva vedere: B chiama
   app_kv_set col FRENO acceso (un trigger del banco la fa dormire mezzo secondo
   PRIMA dell'INSERT) e dopo 150 ms arriva D senza freno.
   UNA COSA MISURATA, E DA RACCONTARE COME E' ANDATA DAVVERO, perche' qui questo
   banco ha MENTITO una volta. Il PASSO 2 propone di prendere il FOR UPDATE FUORI
   dal blocco EXCEPTION («Modifica 1»), perche' sul valore corrotto e' il cast a
   far scattare il rollback della sottotransazione, e quel rollback RILASCIA il
   lucchetto preso dentro: il cancello si spegne per tutte e due e passano
   entrambe. La prima misura diceva «non serve, 40 gare su 40 identiche»: era
   FALSA, e la colpa era del fixture, che faceva correre le due casse sullo
   STESSO token. A metterle in fila era l'UPDATE di app_sess_valida sulla riga di
   sessione condivisa — mai il cancello. Con un token per cassa, come in
   pizzeria, il testo di produzione perde 98 vendite su 100 in gara simultanea;
   con la Modifica 1, 0 su 100. Percio' la tessera la porta, e da qui in avanti
   OGNI gara di questo banco usa DUE token.
   §8 e' la guardia che la serializzazione regga e che la spia resti coerente
   sotto contesa.
   §8a LA GARA SUL VALORE CORROTTO: B ripara, D — arrivata nella finestra —
   trova il valore riparato e riceve il 40001; e la spia resta quella del
   vincitore, non un residuo.
   §8b DUE SPIE DIRETTE FUORI ORDINE: B scrive 7 e D scrive 9, in gara. La
   scrittura monotona e' UN SOLO statement (ON CONFLICT ... WHERE EXCLUDED >
   corrente), quindi il secondo rilegge il valore corrente e la piu' alta resta,
   qualunque sia l'ordine di arrivo — il ciclo sorpassato di gen-6.21, chiuso
   dal server.
   §8c DUE STATI DALLA STESSA BASE: la gara quotidiana fra due casse (valore
   leggibile) deve finire uno ok e uno 40001, come in produzione. */
console.log("\n— 8. le gare: una cassa che frena e una che arriva nel frattempo —");
async function gara(s, chiamaB, chiamaD) {
  const B = await s.altra(), D = await s.altra();
  await B.query("set banco.freno = '1'");
  const t0 = Date.now();
  const pB = chiamaB(B).then((r) => ({ ...r, ms: Date.now() - t0 }));
  await pausa(150);
  const pD = chiamaD(D).then((r) => ({ ...r, ms: Date.now() - t0 }));
  const [rB, rD] = await Promise.all([pB, pD]);
  return { rB, rD, frenata: rB.ms >= 350 };
}
{
  const s8 = await nuovoServer(testoSql);
  await s8.set(CHIAVE, stato(7, 0));
  await s8.diretto(`update kv_store set value = 'NON-JSON' where key = $1`, [CHIAVE]);
  const g = await gara(s8, (B) => s8.chiama(B, CHIAVE, stato(8, 7), s8.tok), (D) => s8.chiama(D, CHIAVE, stato(9, 7), s8.tok2));
  ok(g.frenata, `§8a: il freno ha tenuto B nella finestra (B ha impiegato ${g.rB.ms} ms)`);
  const esiti = [esitoDi(g.rB), esitoDi(g.rD)];
  ok(esiti[0] === "ok" && esiti[1] === "40001",
    `§8a: B ripara, D — arrivata mentre B era nella finestra — riceve il 40001 sul valore riparato (letto: B ${esiti[0]} / D ${esiti[1]})`);
  ok((await s8.rev()) === 8 && (await s8.get(SPIA)) === "8",
    `§8a: in rete resta la riparazione di B, rev 8 e spia 8 (letto: rev ${await s8.rev()}, spia ${JSON.stringify(await s8.get(SPIA))})`);
  await s8.chiudi();

  const s9 = await nuovoServer(testoSql);
  await s9.set(CHIAVE, stato(5, 0));
  await s9.set(SPIA, "5");
  const g2 = await gara(s9, (B) => s9.chiama(B, SPIA, "7", s9.tok), (D) => s9.chiama(D, SPIA, "9", s9.tok2));
  ok(g2.frenata && esitoDi(g2.rB) === "ok" && esitoDi(g2.rD) === "ok", `§8b: le due spie tornano tutte e due {ok:true} (letto: ${esitoDi(g2.rB)} / ${esitoDi(g2.rD)}, B in ${g2.rB.ms} ms)`);
  ok((await s9.get(SPIA)) === "9", `§8b: e in rete resta la piu' alta, 9, anche se il 7 e' partito prima e ha scritto dopo (letto: ${JSON.stringify(await s9.get(SPIA))})`);
  await s9.chiudi();

  const s10 = await nuovoServer(testoSql);
  await s10.set(CHIAVE, stato(7, 0));
  const g3 = await gara(s10, (B) => s10.chiama(B, CHIAVE, stato(8, 7), s10.tok), (D) => s10.chiama(D, CHIAVE, stato(9, 7), s10.tok2));
  const e3 = [esitoDi(g3.rB), esitoDi(g3.rD)];
  ok(g3.frenata && e3[0] === "ok" && e3[1] === "40001", `§8c: due casse dalla stessa base, valore leggibile: una passa e una riceve il 40001, come sempre (letto: B ${e3[0]} / D ${e3[1]})`);
  ok((await s10.rev()) === 8, `§8c: e la rev in rete e' quella della prima, 8 (letto: ${await s10.rev()})`);
  await s10.chiudi();

  /* §8d LA GARA SIMULTANEA SUL VALORE CORROTTO — IL CONTROLLO CHE MANCAVA.
     Le gare qui sopra danno alla prima cassa un vantaggio (il freno, poi 150 ms):
     basta quello a farla finire prima, e la finestra non si apre mai. Qui le due
     casse partono NELLO STESSO ISTANTE, con due token diversi, su uno stato
     illeggibile. Deve passarne UNA SOLA: se ne passano due, la vendita dell'una
     sparisce sotto quella dell'altra. E' la scena che il disegno promette sicura
     («un valore corrotto non apre una gara») e che nessuna sezione controllava. */
  const sIns = await nuovoServer(testoSql);
  const CB = await sIns.altra(), CD = await sIns.altra();
  const GIRI = 12;
  let dueVolte = 0;
  for (let i = 0; i < GIRI; i++) {
    await sIns.diretto(`delete from kv_store`);
    await sIns.diretto(`insert into kv_store(key, value) values ($1, 'NON-JSON')`, [CHIAVE]);
    const [rB, rD] = await Promise.all([
      sIns.chiama(CB, CHIAVE, stato(8, 7), sIns.tok),
      sIns.chiama(CD, CHIAVE, stato(9, 7), sIns.tok2),
    ]);
    if (esitoDi(rB) === "ok" && esitoDi(rD) === "ok") dueVolte++;
  }
  ok(dueVolte === 0,
    `§8d: ${GIRI} gare simultanee sul valore corrotto, due casse su due sessioni: non ne passano mai due (vendite perse: ${dueVolte}/${GIRI})`);
  await sIns.chiudi();
}

/* ═══ 9. LE ALTRE CHIAVI PASSANO COME PRIMA ═══ */
console.log("\n— 9. le altre chiavi passano come prima —");
{
  const s6 = await nuovoServer(testoSql);
  await s6.set(CHIAVE, stato(3, 0));
  /* la spia la mette il CLIENT, cosi' la sezione e' verde anche sul testo di
     produzione ed e' una guardia di regressione pura, non un rosso di riflesso */
  await s6.set(SPIA, "3");
  const b = await s6.set("scp:backup:bk-1", '{"rev":3,"dati":{}}');
  ok(b.risposta?.ok === true && (await s6.get("scp:backup:bk-1")) !== null, "un backup si scrive senza cancello e senza toccare niente");
  ok((await s6.get(SPIA)) === "3", `e non muove la spia (letto: ${JSON.stringify(await s6.get(SPIA))})`);
  const idx = await s6.set("scp:backup-indice", "[]");
  ok(idx.risposta?.ok === true, "l'indice dei backup idem");
  await s6.chiudi();
}

/* ═══ 10. LA SPIA SEGUE LO STATO, ANCHE IN GIU' ═══
   E' l'accusa piu' grave che la demolizione ha trovato, e la sola che il
   disegno lasciava ambigua. Nel ramo dello stato la spia NON e' monotona: lo
   stato ha appena passato il cancello ed e' la verita'. Se lo fosse, un ri-seed
   (Valerio cancella scp:stato:v1 per ripartire pulito, il primo telefono scrive
   il seme a rev 1) sopra una spia a 1785… la lascerebbe ALTA, e da quel momento
   OGNI telefono troverebbe rr > base.rev a ogni giro e scaricherebbe lo stato
   intero per sempre — «finche' la rev non la risorpassa» sono 1,78e15 scritture,
   cioe' mai. Qui si mette in scena: spia alta, stato cancellato, seed a rev 1,
   e si pretende che la spia SCENDA a 1. Il sabotaggio che rende monotona questa
   riga fa arrossire proprio questa sezione. */
console.log("\n— 10. la spia segue lo stato, anche in giu' (ri-seed) —");
{
  const s7 = await nuovoServer(testoSql);
  await s7.set(CHIAVE, stato(1785829928480461, 0));
  ok((await s7.get(SPIA)) === "1785829928480461", `la spia parte alta come lo stato (letto: ${JSON.stringify(await s7.get(SPIA))})`);
  await s7.diretto(`delete from kv_store where key = $1`, [CHIAVE]);
  const seed = await s7.set(CHIAVE, stato(1, 0));
  ok(seed.risposta?.ok === true && (await s7.rev()) === 1, `dopo il ri-seed lo stato e' a rev 1 (letto: ${await s7.rev()})`);
  ok((await s7.get(SPIA)) === "1", `e la spia SCENDE a 1 con lui: non resta alta a strozzare il traffico per sempre (letto: ${JSON.stringify(await s7.get(SPIA))})`);
  await s7.chiudi();
}

/* ═══ 11. UN NUL NELLO STATO NON SPEGNE IL CANCELLO PER TUTTI ═══
   L'unica corruzione che un client vero puo' produrre: JSON.stringify di una
   stringa con dentro un carattere U+0000 mette l'escape di sei caratteri nel
   testo, e ::jsonb lo rifiuta con 22P05. Senza riparazione, quel payload fa
   sollevare il primo cast, spegne il cancello per TUTTI e ferma la spia. La
   riparazione sostituisce quell'escape con quello di U+FFFD, stessa lunghezza,
   JSON valido. IL COSTO DICHIARATO: cambia quel singolo carattere dentro la
   stringa. */
console.log("\n— 11. un NUL nello stato non spegne il cancello per tutti —");
{
  const s8 = await nuovoServer(testoSql);
  await s8.set(CHIAVE, stato(3, 0));
  const conNul = '{"rev":4,"revBase":3,"nota":"tavolo\\u00001"}';
  const r = await s8.set(CHIAVE, conNul);
  ok(r.risposta?.ok === true && (await s8.rev()) === 4, `uno stato con \\u0000 dentro una stringa passa e non solleva (rev in rete: ${await s8.rev()})`);
  ok((await s8.get(SPIA)) === "4", `e la spia lo segue: il cancello non si e' spento (letto: ${JSON.stringify(await s8.get(SPIA))})`);
  const salvato = JSON.parse(await s8.get(CHIAVE));
  ok(salvato.nota === "tavolo�1", `il NUL e' diventato il carattere «sconosciuto», la struttura e' intatta (letto: ${JSON.stringify(salvato.nota)})`);
  /* la scrittura DOPO deve ancora vedere il cancello: se il NUL avesse spento
     il ramo, revBase non sarebbe piu' guardata */
  const conflitto = await s8.set(CHIAVE, stato(9, 3));
  ok(conflitto.stato === "40001", `e il cancello regge ancora dopo: una revBase vecchia riceve il 40001 (letto: ${conflitto.stato ?? JSON.stringify(conflitto.risposta)})`);
  /* E IL ROVESCIO: un testo VALIDO che contiene per davvero le sei lettere
     barra-u-zero-zero-zero-zero (con la barra a sua volta escapata) NON e' rotto
     e NON va riparato. Con la replace fatta sempre, veniva alterato in silenzio. */
  const conLett = await s8.set(CHIAVE, stato(5, 4, { nota: "\\u0000" }));
  const nota2 = JSON.parse(await s8.get(CHIAVE)).nota;
  ok(conLett.risposta?.ok === true && nota2 === "\\u0000",
    `un testo valido con dentro quelle sei lettere non viene alterato (letto: ${JSON.stringify(nota2)})`);
  await s8.chiudi();
}

await srv.chiudi();
await amministra.end();
spegni();
console.log(ko ? `\nservertest: ${ko} controlli KO` : "\nservertest: TUTTI I CONTROLLI PASSATI");
process.exit(ko ? 1 : 0);
