import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";
const src = readFileSync("../app-gen532.jsx", "utf8") + "\nexport { calcolaEsito };\n";
writeFileSync("old532-src.jsx", src);
await build({ entryPoints: ["old532-src.jsx"], bundle: true, outfile: "old532.cjs",
  loader: { ".jsx": "jsx" }, jsx: "transform", format: "cjs", platform: "node", logLevel: "error" });
console.log("old532.cjs built");
