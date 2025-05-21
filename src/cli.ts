#!/usr/bin/env node

import { build } from "esbuild";
import * as path from "path";

// Command line args
const [entry, outfile] = process.argv.slice(2);

if (!entry || !outfile) {
  console.error("Usage: bundle <entry-file> <output-file>");
  process.exit(1);
}

const entryPath = path.resolve(entry);
const outPath = path.resolve(outfile);

build({
  entryPoints: [entryPath],
  bundle: true,
  outfile: outPath,
  platform: "node",
  format: "esm",
  target: "es2020",
})
  .then(() => {
    console.log(`✅ Bundled ${entry} → ${outfile}`);
  })
  .catch((err) => {
    console.error("❌ Build failed:", err);
    process.exit(1);
  });
