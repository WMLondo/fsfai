import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { log } from "@clack/prompts";
import { FRONTEND_FRAMEWORKS } from "../apps/frameworks.js";
import { appDir, projectRoot } from "../apps/shared.js";
import { run } from "../run.js";
import { copyTemplateDir } from "../templates.js";
import { readPackageJson, writePackageJson } from "../tooling/package-json.js";
import type { PackageManager, ProjectOptions } from "../types.js";

const TEMPLATE = "api-client";
const PACKAGE_NAME = "@repo/api-client";
const PACKAGE_DIR = path.join("packages", "api-client");
const EXPORT_TASK = "openapi:export";
const GENERATE_SCRIPT = "api:generate";
const NEXT_CONFIG = "next.config.ts";
const NEXT_CONFIG_OPENING = /(const\s+nextConfig\s*:\s*NextConfig\s*=\s*\{)/;

// Versión de una dependencia de workspace según el gestor.
const WORKSPACE_VERSION: Record<PackageManager, string> = {
  pnpm: "workspace:*",
  npm: "*",
};

// `<pm> run generate` solo en `@repo/api-client`.
const FILTER_ARGS: Record<PackageManager, string> = {
  pnpm: `--filter ${PACKAGE_NAME}`,
  npm: `-w ${PACKAGE_NAME}`,
};

/** El paquete existe siempre que se elija NestJS, haya o no apps front. */
export function hasApiClient(options: ProjectOptions): boolean {
  return options.apps.some((app) => app.framework === "nestjs");
}

/**
 * Copia `templates/api-client/` a `packages/api-client`, añade `api:generate` a la raíz
 * y la tarea `openapi:export` a `turbo.json` (SPEC 07).
 */
export async function createApiClientPackage(options: ProjectOptions): Promise<void> {
  const root = projectRoot(options);
  const pm = options.packageManager;
  await copyTemplateDir(TEMPLATE, path.join(root, PACKAGE_DIR), {
    workspaceVersion: WORKSPACE_VERSION[pm],
    packageManager: pm,
  });

  const file = path.join(root, "package.json");
  const pkg = await readPackageJson(file);
  pkg.scripts = {
    ...pkg.scripts,
    [GENERATE_SCRIPT]: `turbo run ${EXPORT_TASK} && ${pm} ${FILTER_ARGS[pm]} run generate`,
  };
  await writePackageJson(file, pkg);
  await addTurboExportTask(root);

  log.step(`Creado ${PACKAGE_NAME} en ${PACKAGE_DIR}`);
}

/** `turbo run` solo ejecuta tareas declaradas en `turbo.json`. Escribe fuera de la app: sin caché. */
async function addTurboExportTask(root: string): Promise<void> {
  const file = path.join(root, "turbo.json");
  if (!existsSync(file)) {
    return;
  }
  const turbo = JSON.parse(await readFile(file, "utf8")) as { tasks?: Record<string, unknown> };
  turbo.tasks = { ...turbo.tasks, [EXPORT_TASK]: { cache: false } };
  await writeFile(file, `${JSON.stringify(turbo, null, 2)}\n`);
}

/** Añade `@repo/api-client` a las apps front y, en Next.js, a `transpilePackages`. */
export async function linkToFrontApps(options: ProjectOptions): Promise<void> {
  const frontApps = options.apps.filter((app) => FRONTEND_FRAMEWORKS.includes(app.framework));
  for (const app of frontApps) {
    const dir = appDir(options, app);
    const file = path.join(dir, "package.json");
    const pkg = await readPackageJson(file);
    pkg.dependencies = {
      ...pkg.dependencies,
      [PACKAGE_NAME]: WORKSPACE_VERSION[options.packageManager],
    };
    await writePackageJson(file, pkg);

    if (app.framework === "nextjs") {
      await addTranspilePackage(dir);
    }
  }
}

/** Next.js no compila TS de `node_modules`: el paquete exporta `src/index.ts` sin compilar. */
async function addTranspilePackage(dir: string): Promise<void> {
  const file = path.join(dir, NEXT_CONFIG);
  const content = existsSync(file) ? await readFile(file, "utf8") : "";
  if (content.includes(PACKAGE_NAME)) {
    return;
  }
  if (!NEXT_CONFIG_OPENING.test(content)) {
    log.warn(
      `No se pudo añadir ${PACKAGE_NAME} a transpilePackages en ${file}: añádelo a mano.`,
    );
    return;
  }
  await writeFile(
    file,
    content.replace(NEXT_CONFIG_OPENING, `$1\n  transpilePackages: ["${PACKAGE_NAME}"],`),
  );
}

/**
 * `<pm> run api:generate` en la raíz, después del `install`. Si falla, solo avisa:
 * el proyecto ya está creado y la generación se puede reintentar.
 */
export async function generateApiClient(options: ProjectOptions): Promise<void> {
  const pm = options.packageManager;
  const command = `${pm} run ${GENERATE_SCRIPT}`;
  log.step(`Generando ${PACKAGE_NAME}: ${command}`);
  const code = await run(pm, ["run", GENERATE_SCRIPT], {
    cwd: projectRoot(options),
    stdio: "inherit",
  });
  if (code !== 0) {
    log.warn(
      `No se pudo generar ${PACKAGE_NAME} (código de salida ${code}). Reinténtalo desde la raíz con: ${command}`,
    );
  }
}
