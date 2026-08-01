import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";

const target = process.argv[2] || "../app-prod.jsx";
const src = readFileSync(target, "utf8")
  + "\nexport { esportaCatalogoRighe, parseCsvTesto, applicaCatalogoCsv, convToCsv };\n";
writeFileSync("test-lib-src.jsx", src);

await build({
  entryPoints: ["test-lib-src.jsx"],
  bundle: true,
  outfile: "test-lib.cjs",
  loader: { ".jsx": "jsx" },
  jsx: "transform",
  format: "cjs",
  platform: "node",
  logLevel: "error",
});
console.log("test-lib.cjs built");
