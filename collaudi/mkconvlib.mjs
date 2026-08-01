import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";
const src = readFileSync(process.argv[2] || "../app-dev.jsx", "utf8") +
  "\nexport { gnFrazione, domandaConv, convDaRisposta, coppieConv, convStimata, sfoltisciMov, registraMov, SETT_USCITE, MAX_ALTRI_MOV, USCITE_STORICO, soglieConsigliate };\n";
writeFileSync("conv-lib-src.jsx", src);
await build({ entryPoints: ["conv-lib-src.jsx"], bundle: true, outfile: "conv-lib.cjs",
  loader: { ".jsx": "jsx" }, jsx: "transform", format: "cjs", platform: "node", logLevel: "error" });
