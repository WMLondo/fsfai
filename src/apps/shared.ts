import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { log } from "@clack/prompts";
import { RUNNERS } from "../create-turbo.js";
import { run } from "../run.js";
import type { AppSelection, ProjectOptions } from "../types.js";
import { FRAMEWORKS } from "./frameworks.js";

/** Ruta absoluta de la raíz del monorepo (creado en el directorio actual). */
export function projectRoot(options: ProjectOptions): string {
  return path.resolve(process.cwd(), options.name);
}

/** Ruta absoluta de `apps/<app>` dentro del monorepo. */
export function appDir(options: ProjectOptions, app: AppSelection): string {
  return path.join(projectRoot(options), "apps", app.name);
}

/**
 * Ejecuta la CLI oficial del framework con el runner del gestor elegido,
 * desde la raíz del monorepo y con la salida visible. Si falla, sale con código 1.
 */
export async function runFrameworkCli(
  options: ProjectOptions,
  app: AppSelection,
  cliArgs: string[],
): Promise<void> {
  const runner = RUNNERS[options.packageManager];
  const args = [...runner.args, ...cliArgs];
  const { label } = FRAMEWORKS[app.framework];

  log.step(`Creando ${label} en apps/${app.name}: ${runner.cmd} ${args.join(" ")}`);

  const code = await run(runner.cmd, args, { cwd: projectRoot(options), stdio: "inherit" });
  if (code !== 0) {
    log.error(`La CLI de ${label} falló (código de salida ${code}).`);
    process.exit(1);
  }
}

/** El único repositorio git es el de la raíz: borra `apps/<app>/.git` si existe. */
export async function removeNestedGit(options: ProjectOptions, app: AppSelection): Promise<void> {
  const gitDir = path.join(appDir(options, app), ".git");
  if (existsSync(gitDir)) {
    await rm(gitDir, { recursive: true, force: true });
  }
}

/** Añade `entry` al `.gitignore` de la raíz del monorepo si no está ya. */
export async function ensureGitignored(root: string, entry: string): Promise<void> {
  const file = path.join(root, ".gitignore");
  const content = existsSync(file) ? await readFile(file, "utf8") : "";
  if (content.split(/\r?\n/).some((line) => line.trim() === entry)) {
    return;
  }
  const separator = content.length === 0 || content.endsWith("\n") ? "" : "\n";
  await writeFile(file, `${content}${separator}${entry}\n`);
}
