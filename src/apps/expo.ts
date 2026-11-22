import { existsSync } from "node:fs";
import { readdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { log } from "@clack/prompts";
import { run } from "../run.js";
import type { AppSelection, ProjectOptions } from "../types.js";
import { appDir, removeNestedGit, runFrameworkCli } from "./shared.js";

const RESET_SCRIPT = path.join("scripts", "reset-project.js");
const RESET_SCRIPT_NAME = "reset-project";
// Respuesta a "¿mover los ejemplos a /app-example?": "n" los borra.
const RESET_ANSWER = "n\n";

export async function createExpoApp(options: ProjectOptions, app: AppSelection): Promise<void> {
  await runFrameworkCli(options, app, [
    "create-expo-app@latest",
    `apps/${app.name}`,
    "--template",
    "default",
    "--no-install",
  ]);
  await removeNestedGit(options, app);
  await resetExpoProject(appDir(options, app));
}

/** Ejecuta el reset del template `default` y elimina el script de reset. */
async function resetExpoProject(dir: string): Promise<void> {
  const scriptPath = path.join(dir, RESET_SCRIPT);
  if (!existsSync(scriptPath)) {
    log.warn(`No se encontró ${RESET_SCRIPT} en la app Expo; se omite el reset del proyecto.`);
    return;
  }

  log.step("Limpiando el proyecto de ejemplo de Expo (reset-project)");
  const code = await run("node", [RESET_SCRIPT], {
    cwd: dir,
    stdio: "inherit",
    input: RESET_ANSWER,
  });
  if (code !== 0) {
    log.error(`El reset del proyecto de Expo falló (código de salida ${code}).`);
    process.exit(1);
  }

  await rm(scriptPath, { force: true });
  const scriptsDir = path.dirname(scriptPath);
  if (existsSync(scriptsDir) && (await readdir(scriptsDir)).length === 0) {
    await rmdir(scriptsDir);
  }

  await removeResetScriptEntry(path.join(dir, "package.json"));
}

async function removeResetScriptEntry(packageJsonPath: string): Promise<void> {
  const pkg = JSON.parse(await readFile(packageJsonPath, "utf8"));
  if (pkg.scripts && RESET_SCRIPT_NAME in pkg.scripts) {
    delete pkg.scripts[RESET_SCRIPT_NAME];
    await writeFile(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
}
