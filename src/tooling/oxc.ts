import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { log } from "@clack/prompts";
import { run } from "../run.js";
import { FRONTEND_FRAMEWORKS } from "../apps/frameworks.js";
import { renderTemplate } from "../templates.js";
import type { AppSelection, PackageManager } from "../types.js";
import { readPackageJson, writePackageJson } from "./package-json.js";

const ESLINT_CONFIG_PACKAGE = path.join("packages", "eslint-config");
const OXC_DEV_DEPENDENCIES: Readonly<Record<string, string>> = { oxlint: "latest", oxfmt: "latest" };
const OXC_SCRIPTS: Readonly<Record<string, string>> = {
  lint: "oxlint",
  format: "oxfmt",
  "format:check": "oxfmt --check",
};

type OxlintOverride = { files: ReadonlyArray<string>; rules: Record<string, unknown> };
type OxlintConfig = { overrides?: Array<OxlintOverride>; [key: string]: unknown };

async function writeOxlintConfig(root: string, apps: ReadonlyArray<AppSelection>): Promise<void> {
  const frontendFiles = apps
    .filter((app) => FRONTEND_FRAMEWORKS.includes(app.framework))
    .map((app) => `apps/${app.name}/**`);
  const rendered = await renderTemplate("oxc/.oxlintrc.json", {
    frontendFiles: JSON.stringify(frontendFiles),
  });
  const config = JSON.parse(rendered) as OxlintConfig;
  // Sin apps front, el override de estilo front quedaría con `files: []`: se quita.
  config.overrides = config.overrides?.filter((override) => override.files.length > 0);
  await writeFile(path.join(root, ".oxlintrc.json"), `${JSON.stringify(config, null, 2)}\n`);
}

async function updateRootPackageJson(root: string): Promise<void> {
  const file = path.join(root, "package.json");
  const pkg = await readPackageJson(file);
  delete pkg.devDependencies?.prettier;
  delete pkg.dependencies?.prettier;
  pkg.devDependencies = { ...pkg.devDependencies, ...OXC_DEV_DEPENDENCIES };
  pkg.scripts = { ...pkg.scripts, ...OXC_SCRIPTS };
  await writePackageJson(file, pkg);
}

async function removeTurboLintTask(root: string): Promise<void> {
  const file = path.join(root, "turbo.json");
  if (!existsSync(file)) {
    return;
  }
  const turbo = JSON.parse(await readFile(file, "utf8")) as { tasks?: Record<string, unknown> };
  delete turbo.tasks?.lint;
  await writeFile(file, `${JSON.stringify(turbo, null, 2)}\n`);
}

/**
 * Reemplaza ESLint/Prettier por Oxlint/Oxfmt en la raíz del monorepo: borra
 * `packages/eslint-config`, actualiza dependencias y scripts, escribe las configs
 * y quita la tarea `lint` de `turbo.json`.
 */
export async function setupOxc(root: string, apps: ReadonlyArray<AppSelection>): Promise<void> {
  await rm(path.join(root, ESLINT_CONFIG_PACKAGE), { recursive: true, force: true });
  await updateRootPackageJson(root);
  await writeOxlintConfig(root, apps);
  await writeFile(path.join(root, ".oxfmtrc.json"), await renderTemplate("oxc/.oxfmtrc.json"));
  await removeTurboLintTask(root);
  log.step("Configurado Oxlint + Oxfmt en la raíz (eliminados ESLint y Prettier)");
}

/**
 * Formatea todo el monorepo con Oxfmt (`<pm> run format`). Se ejecuta al final, cuando
 * ya existen todas las apps y archivos generados, para que `format:check` pase de inicio.
 */
export async function formatMonorepo(root: string, packageManager: PackageManager): Promise<void> {
  log.step(`Formateando el monorepo: ${packageManager} run format`);
  const code = await run(packageManager, ["run", "format"], { cwd: root, stdio: "ignore" });
  if (code !== 0) {
    log.error(`${packageManager} run format falló (código de salida ${code}).`);
    process.exit(1);
  }
}
