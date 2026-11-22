import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { log } from "@clack/prompts";
import { renderTemplate } from "../templates.js";
import { readPackageJson, writePackageJson } from "./package-json.js";

const VSCODE_DIR = ".vscode";
const TYPESCRIPT_DEV_DEPENDENCY = { typescript: "latest" } as const;

type JsonObject = Record<string, unknown>;
type VscodeExtensions = { recommendations?: string[]; [key: string]: unknown };

/** Lee un JSON existente como objeto. Devuelve `undefined` si no existe; avisa y devuelve `undefined` si no es válido. */
async function readExistingJson(file: string): Promise<JsonObject | undefined> {
  if (!existsSync(file)) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(await readFile(file, "utf8"));
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as JsonObject;
    }
  } catch {
    // Se trata igual que un JSON que no es un objeto.
  }
  log.warn(`${path.relative(process.cwd(), file)} no es JSON válido: se sobrescribe.`);
  return undefined;
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

/** Fusiona las claves de la plantilla en `settings.json`; las nuestras ganan. */
async function writeSettings(dir: string): Promise<void> {
  const file = path.join(dir, "settings.json");
  const ours = JSON.parse(await renderTemplate("vscode/settings.json")) as JsonObject;
  const existing = await readExistingJson(file);
  await writeJson(file, { ...existing, ...ours });
}

/** Une las `recommendations` de la plantilla con las existentes, sin duplicados. */
async function writeExtensions(dir: string): Promise<void> {
  const file = path.join(dir, "extensions.json");
  const ours = JSON.parse(await renderTemplate("vscode/extensions.json")) as VscodeExtensions;
  const existing = (await readExistingJson(file)) as VscodeExtensions | undefined;
  const previous = Array.isArray(existing?.recommendations) ? existing.recommendations : [];
  const recommendations = [...new Set([...previous, ...(ours.recommendations ?? [])])];
  await writeJson(file, { ...existing, ...ours, recommendations });
}

async function addTypescriptDevDependency(root: string): Promise<void> {
  const file = path.join(root, "package.json");
  const pkg = await readPackageJson(file);
  pkg.devDependencies = { ...pkg.devDependencies, ...TYPESCRIPT_DEV_DEPENDENCY };
  await writePackageJson(file, pkg);
}

/**
 * Configura VS Code en la raíz del monorepo: `.vscode/settings.json` usa el
 * TypeScript del workspace (`typescript@latest`, TS 7) y `.vscode/extensions.json`
 * recomienda la extensión de Oxc. Si los archivos existen, se fusionan.
 */
export async function setupVscode(root: string): Promise<void> {
  const dir = path.join(root, VSCODE_DIR);
  await mkdir(dir, { recursive: true });
  await writeSettings(dir);
  await writeExtensions(dir);
  await addTypescriptDevDependency(root);
  log.step("Configurado VS Code (.vscode/) con TypeScript 7 del workspace");
}
