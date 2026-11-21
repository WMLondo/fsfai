import type { AppSelection, ProjectOptions } from "../types.js";
import { removeNestedGit, runFrameworkCli } from "./shared.js";

export async function createNestApp(options: ProjectOptions, app: AppSelection): Promise<void> {
  await runFrameworkCli(options, app, [
    "@nestjs/cli@latest",
    "new",
    app.name,
    "--directory",
    `apps/${app.name}`,
    "--package-manager",
    options.packageManager,
    "--skip-git",
    "--skip-install",
    "--strict",
  ]);
  await removeNestedGit(options, app);
}
