import { cancel, confirm, isCancel, multiselect, select, text } from "@clack/prompts";
import { AI_AGENT_LABELS } from "./ai/agents.js";
import { FRAMEWORK_ORDER, FRAMEWORKS } from "./apps/frameworks.js";
import type { AiAgent, Framework, PackageManager } from "./types.js";
import { validateAppName, validateProjectName } from "./validate.js";

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

/** Multiselect de frameworks. Devuelve los elegidos en orden: nestjs, expo, nextjs. */
export async function askFrameworks(): Promise<Framework[]> {
  const selected = exitOnCancel(
    await multiselect<Framework>({
      message: "¿Qué apps quieres crear?",
      required: true,
      options: FRAMEWORK_ORDER.map((framework) => ({
        value: framework,
        label: FRAMEWORKS[framework].label,
      })),
    }),
  );
  return FRAMEWORK_ORDER.filter((framework) => selected.includes(framework));
}

export async function askAppName(
  framework: Framework,
  otherNames: ReadonlyArray<string>,
): Promise<string> {
  const { label, defaultAppName } = FRAMEWORKS[framework];
  const name = exitOnCancel(
    await text({
      message: `Nombre de la app ${label}`,
      initialValue: defaultAppName,
      validate: (value) => validateAppName(value, otherNames),
    }),
  );
  return name.trim();
}

export async function askAiAgent(): Promise<AiAgent> {
  return exitOnCancel(
    await select<AiAgent>({
      message: "¿Qué agente de IA usas?",
      initialValue: "claude",
      options: [
        { value: "claude", label: AI_AGENT_LABELS.claude },
        { value: "other", label: AI_AGENT_LABELS.other },
      ],
    }),
  );
}
