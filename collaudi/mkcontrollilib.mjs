import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";
const src = readFileSync(process.argv[2] || "../app-prod.jsx", "utf8")
  + "\nexport { controlli, fattore, converti, chiaveArt };\n";
writeFileSync("controlli-lib-src.jsx", src);
await build({ entryPoints: ["controlli-lib-src.jsx"], bundle: true, outfile: "controlli-lib.cjs",
  loader: { ".jsx": "jsx" }, jsx: "transform", format: "cjs", platform: "node", logLevel: "error" });
