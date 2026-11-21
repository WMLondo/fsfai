import { cancel, confirm, isCancel, select, text } from "@clack/prompts";
import type { PackageManager } from "./types.js";
import { validateProjectName } from "./validate.js";

function exitOnCancel<T>(value: T): Exclude<T, symbol> {
  if (isCancel(value)) {
    cancel("Operación cancelada");
    process.exit(0);
  }
  return value as Exclude<T, symbol>;
}

export async function askConfirmCreate(): Promise<void> {
  const answer = exitOnCancel(
    await confirm({ message: "¿Quieres crear un nuevo proyecto?" }),
  );
  if (!answer) {
    cancel("Operación cancelada");
    process.exit(0);
  }
}

export async function askProjectName(): Promise<string> {
  const name = exitOnCancel(
    await text({
      message: "Nombre del proyecto",
      placeholder: "mi-proyecto",
      validate: validateProjectName,
    }),
  );
  return name.trim();
}

export async function askPackageManager(): Promise<PackageManager> {
  return exitOnCancel(
    await select<PackageManager>({
      message: "Gestor de paquetes",
      initialValue: "pnpm",
      options: [
        { value: "pnpm", label: "pnpm" },
        { value: "npm", label: "npm" },
      ],
    }),
  );
}
