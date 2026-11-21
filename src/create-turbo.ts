import { spawn } from "node:child_process";
import { log } from "@clack/prompts";
import type { PackageManager, ProjectOptions } from "./types.js";

// Mapa de comandos de ejecución remota por gestor.
// `npx --yes` evita la pregunta "Ok to proceed?" al instalar create-turbo
// (mitigación prevista en la sección de riesgos de la spec 01).
const RUNNERS: Record<PackageManager, { cmd: string; args: string[] }> = {
  pnpm: { cmd: "pnpm", args: ["dlx"] },
  npm: { cmd: "npx", args: ["--yes"] },
};

const CREATE_TURBO_PACKAGE = "create-turbo@latest";
const PACKAGE_MANAGER_FLAG = "--package-manager";

type StdioMode = "inherit" | "ignore";

function run(cmd: string, args: string[], stdio: StdioMode): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: process.cwd(),
      stdio,
      // En Windows los ejecutables de pnpm/npx son .cmd y requieren shell.
      shell: process.platform === "win32",
    });
    child.on("error", () => resolve(-1));
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function ensurePackageManagerInstalled(pm: PackageManager): Promise<void> {
  const code = await run(pm, ["--version"], "ignore");
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

  const code = await run(runner.cmd, args, "inherit");
  if (code !== 0) {
    log.error(`create-turbo falló (código de salida ${code}).`);
    process.exit(1);
  }
}
