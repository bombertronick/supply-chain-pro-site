/* Da gen-5.52 la barra tiene cinque voci: Catalogo, Analisi, Storico, Sedi,
   Profili, Accessi e Sistema stanno sotto «Gestione». I test ci devono
   arrivare come ci arriva una persona — passando di lì — non con una
   scorciatoia che scavalca la navigazione vera. */
export async function vaiA(p, dove, attesa = 1300) {
  /* Sul telefono la colonna laterale c'è comunque nel documento, solo
     nascosta: senza «:visible» si finisce ad aspettare per sempre un
     elemento che non comparirà mai. */
  const menu = p.locator("nav:visible, aside:visible");
  const diretta = menu.getByText(dove, { exact: true });
  if (await diretta.count()) {
    await diretta.first().click();
    await p.waitForTimeout(attesa);
    return "barra";
  }
  const gest = menu.getByText("Gestione", { exact: true });
  if (!(await gest.count())) throw new Error(`«${dove}»: né in barra né sotto Gestione`);
  await gest.first().click();
  await p.waitForTimeout(900);
  await p.getByText(dove, { exact: true }).locator("visible=true").first().click();
  await p.waitForTimeout(attesa);
  return "gestione";
}
