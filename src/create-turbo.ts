import { rm } from "node:fs/promises";
import path from "node:path";
import { log } from "@clack/prompts";
import { run } from "./run.js";
import type { PackageManager, ProjectOptions } from "./types.js";

// Mapa de comandos de ejecución remota por gestor.
// `npx --yes` evita la pregunta "Ok to proceed?" al instalar paquetes remotos
// (mitigación prevista en la sección de riesgos de la spec 01).
export const RUNNERS: Record<PackageManager, { cmd: string; args: string[] }> = {
  pnpm: { cmd: "pnpm", args: ["dlx"] },
  npm: { cmd: "npx", args: ["--yes"] },
};

const CREATE_TURBO_PACKAGE = "create-turbo@latest";
const PACKAGE_MANAGER_FLAG = "--package-manager";

// Partes del ejemplo `basic` de create-turbo que no se usan.
const TEMPLATE_LEFTOVERS = ["apps/web", "apps/docs", "packages/ui"];

async function ensurePackageManagerInstalled(pm: PackageManager): Promise<void> {
  const code = await run(pm, ["--version"], { stdio: "ignore" });
  if (code !== 0) {
    log.error(
      `No se encontró "${pm}" instalado. Instálalo o elige otro gestor de paquetes.`,
    );
    process.exit(1);
  }
}

export async function createTurbo(options: ProjectOptions): Promise<void> {
  const { name, packageManager } = options;

  await ensurePackageManagerInstalled(packageManager);

  const runner = RUNNERS[packageManager];
  const args = [
    ...runner.args,
    CREATE_TURBO_PACKAGE,
    name,
    PACKAGE_MANAGER_FLAG,
    packageManager,
  ];

  log.step(`Ejecutando: ${runner.cmd} ${args.join(" ")}`);

  const code = await run(runner.cmd, args, { stdio: "inherit" });
  if (code !== 0) {
    log.error(`create-turbo falló (código de salida ${code}).`);
    process.exit(1);
  }
}

/** Borra las apps y paquetes de ejemplo de create-turbo. */
export async function cleanTurboTemplate(root: string): Promise<void> {
  for (const relative of TEMPLATE_LEFTOVERS) {
    await rm(path.join(root, relative), { recursive: true, force: true });
  }
  log.step(`Eliminado el ejemplo de create-turbo: ${TEMPLATE_LEFTOVERS.join(", ")}`);
}
