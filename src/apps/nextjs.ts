import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { log, multiselect } from "@clack/prompts";
import { RUNNERS } from "../create-turbo.js";
import { exitOnCancel } from "../prompts.js";
import { run } from "../run.js";
import { renderTemplate, type TemplateVars } from "../templates.js";
import { allowPnpmBuilds } from "../tooling/pnpm-workspace.js";
import { stripEslintPrettier } from "../tooling/strip-eslint.js";
import type { NextAppSelection, NextPackage, ProjectOptions } from "../types.js";
import {
  describeNextPackages,
  NEXT_PACKAGE_ORDER,
  NEXT_PACKAGES,
  resolveNextPackages,
} from "./next-packages.js";
import { appDir, ensureGitignored, projectRoot, removeNestedGit, runFrameworkCli } from "./shared.js";

const TEMPLATES = "nextjs";
const SRC_DIR = "src";
const APP_DIR = path.join(SRC_DIR, "app");
const COMMON_LIB = path.join(SRC_DIR, "common", "lib");
// Carpetas vacías de `src/common/`; `.gitkeep` para que git las versione.
const COMMON_EMPTY_DIRS = ["consts", "hooks", "lib", "types"];
const ENV_FILE = ".env.local";
const ENV_CONTENT = "NEXT_PUBLIC_API_URL=http://localhost:3001\n";
const PNPM_WORKSPACE = "pnpm-workspace.yaml";

// Flags de la CLI de shadcn centralizados aquí: si cambian, solo cambia este archivo.
const SHADCN = "shadcn@latest";
// shadcn 4 quitó `--base-color`: el color base va en el preset. `--defaults` usa el preset
// por defecto (`base-nova`, color base `neutral`) y `--no-monorepo` evita su pregunta.
const SHADCN_INIT_ARGS = ["init", "--yes", "--defaults", "--no-monorepo"];
const SHADCN_ADD_SONNER_ARGS = ["add", "sonner", "--yes"];
// `shadcn init` añade este componente de ejemplo; fuera de alcance: solo se deja `sonner`.
const SHADCN_INIT_EXTRAS = [path.join(SRC_DIR, "components", "ui", "button.tsx")];
const SHADCN_TOASTER = "@/components/ui/sonner";

type ToasterSource = typeof SHADCN_TOASTER | "sonner";

/** Multiselect de paquetes base, justo después del nombre de la app. Todo marcado por defecto. */
export async function askNextPackages(appName: string): Promise<{ packages: ReadonlyArray<NextPackage> }> {
  const selected = exitOnCancel(
    await multiselect<NextPackage>({
      message: `Paquetes para ${appName}`,
      required: false,
      initialValues: [...NEXT_PACKAGE_ORDER],
      options: NEXT_PACKAGE_ORDER.map((pkg) => ({ value: pkg, label: NEXT_PACKAGES[pkg].label })),
    }),
  );
  return { packages: NEXT_PACKAGE_ORDER.filter((pkg) => selected.includes(pkg)) };
}

export async function createNextApp(options: ProjectOptions, app: NextAppSelection): Promise<void> {
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
  await configureNextApp(options, app);
}

/**
 * Estructura y configuración de la app Next.js según los paquetes elegidos (SPEC 06).
 * Lo que depende de la CLI de shadcn se hace en `installNextPackages`.
 */
export async function configureNextApp(options: ProjectOptions, app: NextAppSelection): Promise<void> {
  const dir = appDir(options, app);
  const has = (pkg: NextPackage) => app.packages.includes(pkg);

  await configureBase(options, dir, app);
  if (has("cn") && !has("shadcn")) {
    await writeTemplate(dir, "cn.ts", path.join(COMMON_LIB, "cn.ts"));
  }
  await writeRootLayout(dir, app, has("shadcn") ? SHADCN_TOASTER : "sonner");
  if (has("better-auth")) {
    await configureBetterAuth(options, dir);
  }

  log.step(`Configurada la app Next.js en apps/${app.name} (${describeNextPackages(app.packages)})`);
}

/**
 * Instala los paquetes elegidos desde `apps/<next>`, después del `install` de la raíz:
 * `<pm> add` con los paquetes npm y, si se eligió, `shadcn init` (y `shadcn add sonner`).
 */
export async function installNextPackages(options: ProjectOptions, app: NextAppSelection): Promise<void> {
  const dir = appDir(options, app);
  const resolved = resolveNextPackages(app.packages);

  await addPackages(options, app, resolved.install);
  if (!resolved.shadcn.init) {
    return;
  }

  if (!(await runShadcn(options, app, SHADCN_INIT_ARGS))) {
    log.warn("shadcn init falló: se continúa sin shadcn.");
    await fallbackWithoutShadcn(options, app);
    return;
  }
  for (const extra of SHADCN_INIT_EXTRAS) {
    await rm(path.join(dir, extra), { force: true });
  }

  if (resolved.shadcn.addSonner && !(await runShadcn(options, app, SHADCN_ADD_SONNER_ARGS))) {
    log.warn("shadcn add sonner falló: se instala sonner sin shadcn.");
    await addPackages(options, app, NEXT_PACKAGES.sonner.install);
    await writeRootLayout(dir, app, "sonner");
  }
}

// --- Instalación -------------------------------------------------------------

/** `<pm> add <paquetes>` desde `apps/<next>`. Si falla, sale con código 1. */
async function addPackages(
  options: ProjectOptions,
  app: NextAppSelection,
  packages: ReadonlyArray<string>,
): Promise<void> {
  if (packages.length === 0) {
    return;
  }
  const pm = options.packageManager;
  const args = ["add", ...packages];
  log.step(`Instalando paquetes en apps/${app.name}: ${pm} ${args.join(" ")}`);
  const code = await run(pm, args, { cwd: appDir(options, app), stdio: "inherit" });
  if (code !== 0) {
    log.error(`${pm} add falló en apps/${app.name} (código de salida ${code}).`);
    process.exit(1);
  }
}

/** `<runner> shadcn@latest <args>` desde `apps/<next>`. Devuelve si terminó bien. */
async function runShadcn(
  options: ProjectOptions,
  app: NextAppSelection,
  shadcnArgs: ReadonlyArray<string>,
): Promise<boolean> {
  const runner = RUNNERS[options.packageManager];
  const args = [...runner.args, SHADCN, ...shadcnArgs];
  log.step(`Configurando shadcn/ui en apps/${app.name}: ${runner.cmd} ${args.join(" ")}`);
  const code = await run(runner.cmd, args, { cwd: appDir(options, app), stdio: "inherit" });
  return code === 0;
}

/** Sin shadcn: instala por `<pm> add` lo que iba a instalar shadcn y usa los archivos propios. */
async function fallbackWithoutShadcn(options: ProjectOptions, app: NextAppSelection): Promise<void> {
  const dir = appDir(options, app);
  const packages = app.packages.filter((pkg) => pkg !== "shadcn");
  const { install } = resolveNextPackages(packages);
  const alreadyInstalled = new Set(resolveNextPackages(app.packages).install);
  await addPackages(
    options,
    app,
    install.filter((name) => !alreadyInstalled.has(name)),
  );
  if (packages.includes("cn")) {
    await writeTemplate(dir, "cn.ts", path.join(COMMON_LIB, "cn.ts"));
  }
  await writeRootLayout(dir, app, "sonner");
}

// --- Helpers -----------------------------------------------------------------

/** Renderiza `templates/nextjs/<template>` en `<dir>/<target>`. */
async function writeTemplate(
  dir: string,
  template: string,
  target: string,
  vars: TemplateVars = {},
): Promise<void> {
  const file = path.join(dir, target);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, await renderTemplate(path.join(TEMPLATES, template), vars));
}

// --- Base: estructura y página index -----------------------------------------

async function configureBase(options: ProjectOptions, dir: string, app: NextAppSelection): Promise<void> {
  await stripEslintPrettier(dir);
  await removeNestedPnpmWorkspace(options, dir);

  const common = path.join(dir, SRC_DIR, "common");
  await mkdir(path.join(common, "components"), { recursive: true });
  await writeFile(path.join(common, "components", "index.tsx"), "export {};\n");
  for (const emptyDir of COMMON_EMPTY_DIRS) {
    await mkdir(path.join(common, emptyDir), { recursive: true });
    await writeFile(path.join(common, emptyDir, ".gitkeep"), "");
  }

  await writeTemplate(dir, "HomePage.tsx", path.join(SRC_DIR, "modules", "HomePage", "index.tsx"), {
    appName: app.name,
  });
  await writeTemplate(dir, "page.tsx", path.join(APP_DIR, "page.tsx"));
}

/**
 * create-next-app deja un `pnpm-workspace.yaml` propio (solo `allowBuilds`) que convierte la
 * app en otro workspace: `pnpm add` y shadcn instalarían fuera del monorepo. Sus entradas
 * pasan al `pnpm-workspace.yaml` de la raíz y el archivo se borra.
 */
async function removeNestedPnpmWorkspace(options: ProjectOptions, dir: string): Promise<void> {
  const file = path.join(dir, PNPM_WORKSPACE);
  if (!existsSync(file)) {
    return;
  }
  const builds: Record<string, boolean> = {};
  let inAllowBuilds = false;
  for (const line of (await readFile(file, "utf8")).split(/\r?\n/)) {
    if (/^\S/.test(line)) {
      inAllowBuilds = line.trimEnd() === "allowBuilds:";
      continue;
    }
    const entry = inAllowBuilds ? /^\s+['"]?([^'":\s]+)['"]?:\s*(true|false)\s*$/.exec(line) : null;
    if (entry) {
      builds[entry[1]] = entry[2] === "true";
    }
  }
  if (Object.keys(builds).length > 0) {
    await allowPnpmBuilds(projectRoot(options), builds);
  }
  await rm(file, { force: true });
}

// --- Layout raíz -------------------------------------------------------------

/**
 * `src/app/layout.tsx`: parte del layout de create-next-app (fuentes y metadata) y solo
 * envuelve `children` en `NuqsAdapter` y añade `<Toaster />` según lo elegido.
 */
async function writeRootLayout(
  dir: string,
  app: NextAppSelection,
  toasterSource: ToasterSource,
): Promise<void> {
  const indent = "        ";
  const imports: Array<string> = [];
  const lines: Array<string> = [];

  if (app.packages.includes("nuqs")) {
    imports.push('import { NuqsAdapter } from "nuqs/adapters/next/app";');
    lines.push(`${indent}<NuqsAdapter>{children}</NuqsAdapter>`);
  } else {
    lines.push(`${indent}{children}`);
  }
  if (app.packages.includes("sonner")) {
    imports.push(`import { Toaster } from "${toasterSource}";`);
    lines.push(`${indent}<Toaster />`);
  }

  await writeTemplate(dir, "layout.tsx", path.join(APP_DIR, "layout.tsx"), {
    appName: app.name,
    imports: imports.map((line) => `${line}\n`).join(""),
    content: lines.join("\n"),
  });
}

// --- Better Auth -------------------------------------------------------------

/** Solo el cliente: el servidor de Better Auth vive en la app NestJS (SPEC 04). */
async function configureBetterAuth(options: ProjectOptions, dir: string): Promise<void> {
  await writeTemplate(dir, "auth-client.ts", path.join(COMMON_LIB, "auth-client.ts"));
  await writeFile(path.join(dir, ENV_FILE), ENV_CONTENT);
  await ensureGitignored(projectRoot(options), ENV_FILE);
}
