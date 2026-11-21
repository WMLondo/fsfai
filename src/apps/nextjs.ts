import type { AppSelection, ProjectOptions } from "../types.js";
import { removeNestedGit, runFrameworkCli } from "./shared.js";

export async function createNextApp(options: ProjectOptions, app: AppSelection): Promise<void> {
  // Flags centralizados aquí: si create-next-app los renombra, solo cambia este archivo.
  // `--yes` acepta los valores por defecto de cualquier pregunta no cubierta.
  await runFrameworkCli(options, app, [
    "create-next-app@latest",
    `apps/${app.name}`,
    "--ts",
    "--tailwind",
    "--app",
    "--src-dir",
    "--turbopack",
    "--no-linter",
    "--import-alias",
    "@/*",
    `--use-${options.packageManager}`,
    "--skip-install",
    "--disable-git",
    "--yes",
  ]);
  await removeNestedGit(options, app);
}
