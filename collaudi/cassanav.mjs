/* LA PORTA UNICA DELLE CELLE DEL LISTINO (gen-6.19).

   Da gen-6.19 la griglia della Cassa mostra UN GRUPPO PER VOLTA: le celle
   degli altri non sono nel DOM. Playwright non clicca quello che non c'e', ne'
   quello che c'e' ma e' nascosto: decine di riferimenti su otto banchi
   diventerebbero rossi PER IL MOTIVO SBAGLIATO — «Margherita non esiste»
   invece di «la Cassa e' rotta» — e un rosso che non parla del difetto fa
   smettere di fidarsi dei rossi. Questo e' l'unico posto che sa come si arriva
   a una cella.

   ═══ LA REGOLA DI FERRO ═══
   `cella` e `batti` NON SI USANO MAI dentro un'asserzione che conta i tocchi.
   gen603test §7 promette «ZERO tocchi: la composizione e' gia' scritta sulla
   cella» (gen-6.03, parole di Valerio) e i due contro-controlli della pizza
   liscia (gen604test §9, postazionecassatest §8) promettono UN tocco: farli
   passare di qui li renderebbe verdi dopo aver speso un tocco — un verde per
   il motivo sbagliato su una promessa del padrone di casa, che e' peggio di
   un rosso sbagliato. Quei punti restano col selettore CRUDO, per sempre, e
   col commento che dice perche'. gruppitest §22 li conta uno per uno.

   COSA GARANTISCE
   · se la cella c'e' gia', la tocca e basta: non tocca nessun pulsante di
     gruppo. I sei banchi a gruppo unico si comportano ESATTAMENTE come prima.
   · se non c'e', ci arriva COME CI ARRIVA UNA PERSONA — toccando il pulsante
     del gruppo, mai scrivendo nello stato, mai con evaluate, mai con force.
   · se non ci arriva, ALZA un'eccezione che nomina la voce, i gruppi visti, e
     dice dove guardare. Non ingoia mai.

   COSA NON GARANTISCE, ed e' la riga piu' importante del file:
   che i pulsanti funzionino. Passando di qui i banchi diventano CIECHI al
   difetto «il gruppo non si apre»: lo vedrebbero come «la cella non c'e'
   nemmeno dopo aver aperto Bere», un rosso vero ma sparso su otto file che
   nomina il sintomo invece della causa. Quel difetto lo provano a viso aperto
   §3 e §6 di gruppitest.mjs, che toccano il pulsante con un selettore crudo e
   non importano mai questo file.

   FORZA BRUTA, NON UNA MAPPA voce -> gruppo. Una mappa vorrebbe un
   data-voci="Margherita|Boscaiola" sul pulsante: superficie d'app scritta solo
   per i banchi, che duplica una verita' gia' nel listino. La forza bruta costa
   al massimo N tocchi (N <= 4 nei banchi veri, 3 in produzione) e SOLO la
   prima volta: dopo il primo `batti` il gruppo resta aperto e le chiamate
   successive imboccano il ramo veloce. Non legge nemmeno localStorage: leggere
   lo stato per sapere il gruppo sarebbe una scorciatoia che una persona non ha.

   IL CONTRATTO CON L'APP (rompendolo, ogni banco migrato diventa rosso):
   · ogni pulsante di gruppo porta   data-gruppo="<nome del gruppo>"
   · la griglia aperta porta         data-griglia="<nome del gruppo>"
   · la cella porta                  aria-label="Aggiungi <nome voce>"
   Il pulsante NON si cerca mai per nome accessibile: quello porta il conto del
   gruppo e cambia mentre si batte.

   IL NOME DEL FILE non finisce per «test.mjs» apposta: corri.mjs:92 filtra
   /test\.mjs$/ e navtest.mjs c'e' gia' cascato dentro — girava, non provava
   niente, e risultava MUTO a ogni censimento. Lo stesso sbaglio non si fa due
   volte. */

export async function cella(p, nome, attesa = 220) {
  /* accetta anche la vecchia stringa intera «Aggiungi Margherita»: la
     migrazione diventa una sostituzione che non puo' sbagliare traduzione */
  const pulito = String(nome).replace(/^Aggiungi\s+/i, "");
  const c = p.getByRole("button", { name: `Aggiungi ${pulito}`, exact: true });
  if (await c.count()) return c.first();                 // ramo veloce: zero tocchi
  const bottoni = p.locator("[data-gruppo]");
  const n = await bottoni.count();
  if (!n) throw new Error(
    `«${pulito}»: non è in griglia e non c'è nessun pulsante di gruppo — o il listino di questo banco non ce l'ha, o data-gruppo è sparito (contratto di cassanav.mjs)`);
  const visti = [];
  for (let i = 0; i < n; i++) {
    const b = bottoni.nth(i);
    visti.push(await b.getAttribute("data-gruppo"));
    if ((await b.getAttribute("aria-expanded")) === "true") continue;   // già guardato
    await b.click(); await p.waitForTimeout(attesa);
    if (await c.count()) return c.first();
  }
  throw new Error(
    `«${pulito}»: non c'è in nessuno dei gruppi (${visti.join(", ")}). Se sono rossi anche §3 e §6 di gruppitest, il difetto è l'apertura dei gruppi, non la voce.`);
}

export async function batti(p, nome, attesa = 300) {
  const c = await cella(p, nome);
  await c.click(); await p.waitForTimeout(attesa);
}
