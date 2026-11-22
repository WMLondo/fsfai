import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { log, select } from "@clack/prompts";
import { exitOnCancel } from "../prompts.js";
import { copyTemplateDir, renderTemplate, type TemplateVars } from "../templates.js";
import { type PackageJson, readPackageJson, writePackageJson } from "../tooling/package-json.js";
import { allowPnpmBuilds } from "../tooling/pnpm-workspace.js";
import { stripEslintPrettier } from "../tooling/strip-eslint.js";
import type { NestAppSelection, Orm, ProjectOptions } from "../types.js";
import {
  COMMON_DEPENDENCIES,
  type DependencySet,
  JEST_DEPENDENCIES,
  ORM_DEPENDENCIES,
  ORM_SCRIPTS,
  PNPM_ALLOW_BUILDS,
  TEST_DEPENDENCIES,
} from "./nestjs-deps.js";
import { appDir, projectRoot, removeNestedGit, runFrameworkCli } from "./shared.js";

// Archivos que algunas versiones de @nestjs/cli añaden y que esta CLI sustituye:
// instrucciones de agente propias (las de la raíz las genera SPEC 03) y config de Oxlint
// por app (Oxlint se configura en la raíz).
const NEST_CLI_EXTRA_FILES = ["AGENTS.md", "CLAUDE.md", ".oxlintrc.json"];
const NEST_CLI_EXTRA_DEPENDENCIES = ["oxlint", "oxlint-tsgolint"];
const SOURCE_DIRS = ["src", "test"];
// `from './x'`, `import './x'` y `import('./x')` con especificador relativo.
const RELATIVE_IMPORT_PATTERN = /(\bfrom\s+|\bimport\s*\(?\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;
const KNOWN_EXTENSIONS = /\.(m|c)?js$|\.json$/;

const TEMPLATES = "nestjs";
// Configs de Jest (y la de Vitest que trae @nestjs/cli 12) sustituidas por las de la plantilla.
const REPLACED_TEST_CONFIGS = [
  "jest.config.js",
  "jest.config.ts",
  "jest.config.json",
  path.join("test", "jest-e2e.json"),
  "vitest.config.e2e.ts",
];
const VITEST_CONFIGS = ["vitest.config.ts", "vitest.e2e.config.ts"];
const TEST_SCRIPTS: Readonly<Record<string, string>> = {
  test: "vitest run",
  "test:cov": "vitest run --coverage",
  "test:e2e": "vitest run --config vitest.e2e.config.ts",
};
const REMOVED_TEST_SCRIPTS = ["test:watch", "test:debug"];

// Ejemplo de @nestjs/cli sustituido por `health/` y el `app.module.ts` de la plantilla.
const NEST_SAMPLE_FILES = [
  "src/app.controller.ts",
  "src/app.controller.spec.ts",
  "src/app.service.ts",
  "test/app.e2e-spec.ts",
];
// Telemetría de Observe y `nest deploy` (@nestjs/cli 12): su uso estaba en los archivos sustituidos.
const NEST_SAMPLE_DEPENDENCIES = ["@nestjs/observe", "@nestjs/mau"];
const APP_SCRIPTS: Readonly<Record<string, string>> = {
  dev: "nest start --watch",
  build: "nest build",
  start: "node dist/main.js",
  "start:repl": "nest start --watch --entryFile repl",
};
// Carpetas vacías de la estructura; `.gitkeep` para que git las versione.
const EMPTY_DIRS = ["public", "typings", path.join("database", "migrations")];
const ENV_SAMPLE = ".env.sample";
const ENV_FILE = ".env";
const NEXT_DEV_ORIGIN = "http://localhost:3000";

export const ORMS: ReadonlyArray<Orm> = ["drizzle", "typeorm"];

export const ORM_LABELS: Record<Orm, string> = {
  drizzle: "Drizzle",
  typeorm: "TypeORM",
};

/** Preguntas propias de NestJS, justo después del nombre de la app. La base de datos es siempre PostgreSQL. */
export async function askNestOptions(): Promise<{ orm: Orm }> {
  const orm = exitOnCancel(
    await select<Orm>({
      message: "ORM",
      initialValue: "drizzle",
      options: [
        { value: "drizzle", label: ORM_LABELS.drizzle },
        { value: "typeorm", label: ORM_LABELS.typeorm },
      ],
    }),
  );
  return { orm };
}

export async function createNestApp(options: ProjectOptions, app: NestAppSelection): Promise<void> {
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
  await configureNestApp(options, app);
}

/** Convierte la app recién generada por @nestjs/cli en el backend descrito en SPEC 04. */
export async function configureNestApp(options: ProjectOptions, app: NestAppSelection): Promise<void> {
  const dir = appDir(options, app);
  await convertToEsm(dir);
  await replaceJestWithVitest(dir);
  await copyCommonTemplate(options, app, dir);
  await copyOrmTemplate(options, app, dir);
  if (options.packageManager === "pnpm") {
    await allowPnpmBuilds(projectRoot(options), PNPM_ALLOW_BUILDS);
  }
  log.step(
    `Configurada la app NestJS en apps/${app.name} (ESM, Vitest, PostgreSQL + ${ORM_LABELS[app.orm]}, pino, Scalar)`,
  );
}

// --- package.json ------------------------------------------------------------

async function updatePackageJson(dir: string, update: (pkg: PackageJson) => void): Promise<void> {
  const file = path.join(dir, "package.json");
  const pkg = await readPackageJson(file);
  update(pkg);
  await writePackageJson(file, pkg);
}

function addDependencies(pkg: PackageJson, set: DependencySet): void {
  pkg.dependencies = { ...pkg.dependencies, ...set.dependencies };
  pkg.devDependencies = { ...pkg.devDependencies, ...set.devDependencies };
}

function removeDependencies(pkg: PackageJson, names: ReadonlyArray<string>): void {
  for (const name of names) {
    delete pkg.dependencies?.[name];
    delete pkg.devDependencies?.[name];
  }
}

/** Copia archivos sueltos de `templates/nestjs/<from>/` a la app, con la misma ruta relativa. */
async function copyTemplateFiles(
  dir: string,
  from: string,
  files: ReadonlyArray<string>,
): Promise<void> {
  for (const file of files) {
    const target = path.join(dir, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await renderTemplate(path.join(TEMPLATES, from, file)));
  }
}

// --- ESM ---------------------------------------------------------------------

async function convertToEsm(dir: string): Promise<void> {
  await stripEslintPrettier(dir);
  await removeNestCliExtras(dir);

  await updatePackageJson(dir, (pkg) => {
    pkg.type = "module";
  });

  await setTsconfigNodeNext(path.join(dir, "tsconfig.json"));

  for (const sourceDir of SOURCE_DIRS) {
    await addJsExtensions(path.join(dir, sourceDir));
  }
}

async function removeNestCliExtras(dir: string): Promise<void> {
  for (const file of NEST_CLI_EXTRA_FILES) {
    await rm(path.join(dir, file), { force: true });
  }
  await updatePackageJson(dir, (pkg) => removeDependencies(pkg, NEST_CLI_EXTRA_DEPENDENCIES));
}

type Tsconfig = { compilerOptions?: Record<string, unknown>; [key: string]: unknown };

async function updateTsconfig(file: string, update: (tsconfig: Tsconfig) => void): Promise<void> {
  const tsconfig = JSON.parse(await readFile(file, "utf8")) as Tsconfig;
  tsconfig.compilerOptions ??= {};
  update(tsconfig);
  await writeFile(file, `${JSON.stringify(tsconfig, null, 2)}\n`);
}

async function setTsconfigNodeNext(file: string): Promise<void> {
  await updateTsconfig(file, (tsconfig) => {
    Object.assign(tsconfig.compilerOptions!, { module: "nodenext", moduleResolution: "nodenext" });
  });
}

/** Añade `.js` (o `/index.js` si apunta a una carpeta) a los imports relativos de los `.ts` de `dir`. */
async function addJsExtensions(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    return;
  }
  for (const entry of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    const source = await readFile(file, "utf8");
    const updated = source.replace(
      RELATIVE_IMPORT_PATTERN,
      (match, prefix: string, quote: string, specifier: string) => {
        if (KNOWN_EXTENSIONS.test(specifier)) {
          return match;
        }
        const target = path.resolve(path.dirname(file), specifier);
        const suffix = existsSync(path.join(target, "index.ts")) ? "/index.js" : ".js";
        return `${prefix}${quote}${specifier}${suffix}${quote}`;
      },
    );
    if (updated !== source) {
      await writeFile(file, updated);
    }
  }
}

// --- Vitest ------------------------------------------------------------------

async function replaceJestWithVitest(dir: string): Promise<void> {
  for (const file of REPLACED_TEST_CONFIGS) {
    await rm(path.join(dir, file), { force: true });
  }
  await copyTemplateFiles(dir, "common", VITEST_CONFIGS);

  await updatePackageJson(dir, (pkg) => {
    delete pkg.jest;
    removeDependencies(pkg, JEST_DEPENDENCIES);
    addDependencies(pkg, TEST_DEPENDENCIES);
    for (const script of REMOVED_TEST_SCRIPTS) {
      delete pkg.scripts?.[script];
    }
    pkg.scripts = { ...pkg.scripts, ...TEST_SCRIPTS };
  });

  // Globales de Vitest (`describe`, `it`, `expect`) en lugar de los de Jest.
  await updateTsconfig(path.join(dir, "tsconfig.json"), (tsconfig) => {
    const types = (tsconfig.compilerOptions!.types as string[] | undefined) ?? [];
    const withoutJest = types.filter((type) => type !== "jest");
    tsconfig.compilerOptions!.types = [...new Set(["vitest/globals", "node", ...withoutJest])];
  });
}

// --- Plantilla común ---------------------------------------------------------

/** `TRUSTED_ORIGINS`: Next.js en desarrollo y, si hay app Expo, su scheme (`<app>://`). */
function trustedOrigins(options: ProjectOptions): string {
  const expoSchemes = options.apps
    .filter((app) => app.framework === "expo")
    .map((app) => `${app.name}://`);
  return [NEXT_DEV_ORIGIN, ...expoSchemes].join(",");
}

function templateVars(options: ProjectOptions, app: NestAppSelection): TemplateVars {
  return {
    projectName: options.name,
    appName: app.name,
    trustedOrigins: trustedOrigins(options),
    authSecret: "",
  };
}

async function copyCommonTemplate(
  options: ProjectOptions,
  app: NestAppSelection,
  dir: string,
): Promise<void> {
  for (const file of NEST_SAMPLE_FILES) {
    await rm(path.join(dir, file), { force: true });
  }

  const vars = templateVars(options, app);
  await copyTemplateDir(path.join(TEMPLATES, "common"), dir, vars);
  // Solo `.env` lleva el secreto; `.env.sample` lo deja vacío.
  const secret = randomBytes(32).toString("base64");
  await writeFile(
    path.join(dir, ENV_FILE),
    await renderTemplate(path.join(TEMPLATES, "common", ENV_SAMPLE), { ...vars, authSecret: secret }),
  );
  await ensureGitignored(projectRoot(options), ENV_FILE);

  for (const emptyDir of EMPTY_DIRS) {
    await mkdir(path.join(dir, emptyDir), { recursive: true });
    await writeFile(path.join(dir, emptyDir, ".gitkeep"), "");
  }

  await updatePackageJson(dir, (pkg) => {
    removeDependencies(pkg, NEST_SAMPLE_DEPENDENCIES);
    addDependencies(pkg, COMMON_DEPENDENCIES);
    // Solo los scripts de la spec: se descartan `start:dev`, `start:prod`, `deploy`...
    const testScripts = Object.fromEntries(
      Object.keys(TEST_SCRIPTS).map((name) => [name, pkg.scripts?.[name] ?? TEST_SCRIPTS[name]]),
    );
    pkg.scripts = { ...APP_SCRIPTS, ...testScripts };
  });
}

// --- ORM ---------------------------------------------------------------------

/** `src/database/` (schemas `usr`) y la config del ORM: `drizzle.config.ts` o `data-source.ts`. */
async function copyOrmTemplate(
  options: ProjectOptions,
  app: NestAppSelection,
  dir: string,
): Promise<void> {
  await copyTemplateDir(path.join(TEMPLATES, app.orm), dir, templateVars(options, app));
  await updatePackageJson(dir, (pkg) => {
    addDependencies(pkg, ORM_DEPENDENCIES[app.orm]);
    pkg.scripts = { ...pkg.scripts, ...ORM_SCRIPTS[app.orm] };
  });
}

/** Añade `entry` al `.gitignore` de la raíz del monorepo si no está ya. */
async function ensureGitignored(root: string, entry: string): Promise<void> {
  const file = path.join(root, ".gitignore");
  const content = existsSync(file) ? await readFile(file, "utf8") : "";
  if (content.split(/\r?\n/).some((line) => line.trim() === entry)) {
    return;
  }
  const separator = content.length === 0 || content.endsWith("\n") ? "" : "\n";
  await writeFile(file, `${content}${separator}${entry}\n`);
}
