// Comprueba que la CLI y el wrapper tienen la misma versión antes de publicar (SPEC 09).
import { readFileSync } from "node:fs";

const PACKAGES = ["package.json", "packages/create-fsfai/package.json"];

const versions = PACKAGES.map((file) => {
  const { name, version } = JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"));
  return { file, name, version };
});

if (new Set(versions.map((pkg) => pkg.version)).size > 1) {
  console.error("Las versiones no coinciden:");
  for (const pkg of versions) {
    console.error(`  ${pkg.name} (${pkg.file}): ${pkg.version}`);
  }
  process.exit(1);
}

console.log(`Versiones alineadas: ${versions[0].version}`);
