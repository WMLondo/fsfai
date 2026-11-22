import { existsSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { DEPENDENCY_FIELDS, readPackageJson, writePackageJson } from "./package-json.js";

// Patrones (no nombres exactos) por si una CLI usa una variante nueva del archivo.
const CONFIG_FILE_PATTERNS: ReadonlyArray<RegExp> = [
  /^eslint\.config\./,
  /^\.eslintrc/,
  /^\.prettierrc/,
  /^\.prettierignore$/,
];

const DEPENDENCY_PREFIXES: ReadonlyArray<string> = [
  "eslint",
  "@eslint/",
  "typescript-eslint",
  "prettier",
  "@repo/eslint-config",
];

const SCRIPTS_TO_REMOVE: ReadonlyArray<string> = ["lint", "format"];

function isEslintOrPrettierDependency(name: string): boolean {
  return DEPENDENCY_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/**
 * Borra de `appDir` los archivos de configuración de ESLint/Prettier y quita de su
 * `package.json` las dependencias de ESLint/Prettier y los scripts `lint` y `format`.
 * Lo usan los pasos de configuración de cada framework (SPEC 04–06).
 */
export async function stripEslintPrettier(appDir: string): Promise<void> {
  for (const entry of await readdir(appDir)) {
    if (CONFIG_FILE_PATTERNS.some((pattern) => pattern.test(entry))) {
      await rm(path.join(appDir, entry), { recursive: true, force: true });
    }
  }

  const packageJsonPath = path.join(appDir, "package.json");
  if (!existsSync(packageJsonPath)) {
    return;
  }

  const pkg = await readPackageJson(packageJsonPath);
  for (const field of DEPENDENCY_FIELDS) {
    const deps = pkg[field];
    if (!deps) {
      continue;
    }
    for (const name of Object.keys(deps)) {
      if (isEslintOrPrettierDependency(name)) {
        delete deps[name];
      }
    }
  }
  for (const script of SCRIPTS_TO_REMOVE) {
    delete pkg.scripts?.[script];
  }
  await writePackageJson(packageJsonPath, pkg);
}
