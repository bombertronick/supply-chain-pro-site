import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";
const target = process.argv[2] || "../app-dev.jsx";
const src = readFileSync(target, "utf8")
  + "\nexport { calcolaEsito, suInteri, giuInteri, converti, aggiornaOrdineDiretto, aggiornaOrdineLab, parOggi };\n";
writeFileSync("interi-lib-src.jsx", src);
await build({
  entryPoints: ["interi-lib-src.jsx"],
  bundle: true, outfile: "interi-lib.cjs",
  loader: { ".jsx": "jsx" }, jsx: "transform", format: "cjs", platform: "node", logLevel: "error",
});
console.log("interi-lib.cjs built from", target);
