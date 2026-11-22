#!/usr/bin/env node
// Wrapper de `npm create @alejandrohn/fsfai`: ejecuta la CLI `fsfai` de la
// misma versión con los mismos argumentos y sale con su código (SPEC 09).
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const pkgPath = require.resolve("@alejandrohn/fsfai/package.json");
const { bin } = JSON.parse(readFileSync(pkgPath, "utf8"));
const binPath = path.resolve(path.dirname(pkgPath), typeof bin === "string" ? bin : bin.fsfai);

const child = spawn(process.execPath, [binPath, ...process.argv.slice(2)], { stdio: "inherit" });
child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
child.on("close", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
