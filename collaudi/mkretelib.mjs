import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";
const target = process.argv[2] || "../app-prod.jsx";
const src = readFileSync(target, "utf8") + "\nexport { costruisciRete, COLX, NW, NH, BX };\n";
writeFileSync("rete-lib-src.jsx", src);
await build({ entryPoints: ["rete-lib-src.jsx"], bundle: true, outfile: "rete-lib.cjs",
  loader: { ".jsx": "jsx" }, jsx: "transform", format: "cjs", platform: "node", logLevel: "error" });
console.log("rete-lib.cjs pronto da", target);
