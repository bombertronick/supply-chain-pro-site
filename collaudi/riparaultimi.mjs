import { readFileSync, writeFileSync } from "fs";

/* 1. render-test non spegneva la panoramica del primo accesso: il tutorial si
      apriva sopra a tutto e la barra non era piu' cliccabile. */
{
  const f = "render-test.mjs";
  let s = readFileSync(f, "utf8");
  if (/scp:tour:v1/.test(s)) console.log(f + ": la panoramica era gia' spenta");
  else {
    const anc = "await page.addInitScript((s) => {";
    if (!s.includes(anc)) console.log(f + ": !! non trovo dove infilarlo");
    else {
      s = s.replace(anc, anc + '\n  /* spegne la panoramica guidata: se si apre, copre la barra e il collaudo\n     resta fermo su una schermata che nessuno gli ha chiesto */\n  try { localStorage.setItem("scp:tour:v1", "1"); } catch {}');
      writeFileSync(f, s); console.log(f + ": panoramica spenta");
    }
  }
}

/* 2. finaltest: «Sposta» sta dentro «Gestione rapida» da gen-5.52. */
{
  const f = "finaltest.mjs";
  let s = readFileSync(f, "utf8");
  const vecchio = 'await p.getByRole("button", { name: /Sposta/ }).click(); await p.waitForTimeout(500);';
  const nuovo = [
    "/* da gen-5.52 «Sposta» sta dentro «Gestione rapida» */",
    'await p.getByRole("button", { name: /Gestione rapida/ }).click(); await p.waitForTimeout(500);',
    'await p.getByRole("button", { name: /Sposta/ }).last().click(); await p.waitForTimeout(500);',
  ].join("\n  ");
  if (!s.includes(vecchio)) console.log(f + ": !! riga non trovata");
  else { writeFileSync(f, s.replace(vecchio, nuovo)); console.log(f + ": passa da «Gestione rapida»"); }
}
