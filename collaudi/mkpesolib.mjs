import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";
const src = readFileSync(process.argv[2] || "../app-dev.jsx", "utf8") + "\nexport { fotoCaselle, voceLog, applicaRipristino, differenzaCaselle, sfoltisci, MAX_VOCI_CAMBI };\n";
writeFileSync("peso-lib-src.jsx", src);
await build({ entryPoints: ["peso-lib-src.jsx"], bundle: true, outfile: "peso-lib.cjs",
  loader: { ".jsx": "jsx" }, jsx: "transform", format: "cjs", platform: "node", logLevel: "error" });
