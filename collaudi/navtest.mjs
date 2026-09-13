/* Da gen-5.52 la barra tiene cinque voci: Catalogo, Analisi, Storico, Sedi,
   Profili, Accessi e Sistema stanno sotto «Gestione». I test ci devono
   arrivare come ci arriva una persona — passando di lì — non con una
   scorciatoia che scavalca la navigazione vera. */
export async function vaiA(p, dove, attesa = 1300) {
  /* Sul telefono la colonna laterale c'è comunque nel documento, solo
     nascosta: senza «:visible» si finisce ad aspettare per sempre un
     elemento che non comparirà mai. */
  const menu = p.locator("nav:visible, aside:visible");
  /* ── SE LA CASSA È GIÀ APERTA, NON SI ESCE PER RIENTRARE (gen-6.17) ──
     Dentro la Cassa la barra dice «Battere», non «Cassa»: cercando «Cassa» si
     finiva al ramo qui sotto, che tocca «Esci». Finché «Esci» riportava a
     Home era solo un giro inutile. Da gen-6.17 esiste un profilo che in barra
     «Esci» NON ce l'ha — sta solo in cassa, e la sua uscita è il tasto in
     intestazione, che è il LOGOUT: un banco che lo toccasse si
     disconnetterebbe da solo e tutte le sezioni dopo cadrebbero una
     sull'altra per traboccamento, accusando l'app di una cosa che non ha
     fatto. È già successo una volta (postazionecassatest, 11 settembre). */
  if (/^cassa$/i.test(dove)) {
    const dentro = await menu.getByText("Battere", { exact: true }).count();
    if (dentro) return "gia-dentro";
  }
  const diretta = menu.getByText(dove, { exact: true });
  if (await diretta.count()) {
    await diretta.first().click();
    await p.waitForTimeout(attesa);
    return "barra";
  }
  /* ── SI ESCE DALLA CASSA COME NE ESCE UNA PERSONA (gen-6.11) ──
     Da gen-6.11 la Cassa e' una postazione: dentro, la barra e' la sua
     — Battere · Clienti · Giornata · Esci — e le voci del magazzino non ci
     sono, perche' e' esattamente quello che e' stato chiesto. Un collaudo
     che si trova li' dentro e cerca «Magazzini» non ha trovato un difetto:
     e' entrato in una stanza e non ha provato la porta. La porta e' una
     sola, sempre nello stesso posto, e da qui la si apre — poi si riprova.
     Il collaudo continua a passare dalla navigazione vera: non scavalca
     niente, fa il tocco in piu' che farebbe una persona. */
  const esci = menu.getByText("Esci", { exact: true });
  if (await esci.count()) {
    await esci.first().click();
    await p.waitForTimeout(900);
    const dopo = p.locator("nav:visible, aside:visible").getByText(dove, { exact: true });
    if (await dopo.count()) {
      await dopo.first().click();
      await p.waitForTimeout(attesa);
      return "barra-dopo-cassa";
    }
  }
  const menu2 = p.locator("nav:visible, aside:visible");
  const gest = menu2.getByText("Gestione", { exact: true });
  if (!(await gest.count())) throw new Error(`«${dove}»: né in barra né sotto Gestione`);
  await gest.first().click();
  await p.waitForTimeout(900);
  await p.getByText(dove, { exact: true }).locator("visible=true").first().click();
  await p.waitForTimeout(attesa);
  return "gestione";
}
