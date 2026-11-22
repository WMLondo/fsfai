import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { log, multiselect } from "@clack/prompts";
import { exitOnCancel } from "../prompts.js";
import { run } from "../run.js";
import { renderTemplate, type TemplateVars } from "../templates.js";
import { stripEslintPrettier } from "../tooling/strip-eslint.js";
import type { ExpoAppSelection, ExpoPackage, PackageManager, ProjectOptions } from "../types.js";
import {
  EXPO_PACKAGE_ORDER,
  EXPO_PACKAGES,
  expoInstallList,
  resolveExpoPackages,
} from "./expo-packages.js";
import { appDir, ensureGitignored, projectRoot, removeNestedGit, runFrameworkCli } from "./shared.js";

const RESET_SCRIPT = path.join("scripts", "reset-project.js");
const RESET_SCRIPT_NAME = "reset-project";
// Respuesta a "¿mover los ejemplos a /app-example?": "n" los borra.
const RESET_ANSWER = "n\n";

const TEMPLATES = "expo";
const SRC_DIR = "src";
// Carpetas vacías de `src/common/`; `.gitkeep` para que git las versione.
const COMMON_EMPTY_DIRS = ["consts", "hooks", "lib", "types"];
const GLOBAL_CSS = path.join(SRC_DIR, "global.css");
const ENV_FILE = ".env";
const ENV_CONTENT = "EXPO_PUBLIC_API_URL=http://localhost:3001\n";
const PATH_ALIASES: Readonly<Record<string, ReadonlyArray<string>>> = {
  "@common/*": ["./src/common/*"],
  "@modules/*": ["./src/modules/*"],
};

// `expo install` con el binario local de la app (`<runner-local>`).
const LOCAL_RUNNERS: Record<PackageManager, { cmd: string; args: ReadonlyArray<string> }> = {
  pnpm: { cmd: "pnpm", args: ["exec"] },
  npm: { cmd: "npx", args: [] },
};

/** Multiselect de paquetes base, justo después del nombre de la app. Todo marcado por defecto. */
export async function askExpoPackages(appName: string): Promise<{ packages: ReadonlyArray<ExpoPackage> }> {
  const selected = exitOnCancel(
    await multiselect<ExpoPackage>({
      message: `Paquetes para ${appName}`,
      required: false,
      initialValues: [...EXPO_PACKAGE_ORDER],
      options: EXPO_PACKAGE_ORDER.map((pkg) => ({ value: pkg, label: EXPO_PACKAGES[pkg].label })),
    }),
  );
  const { packages, added } = resolveExpoPackages(selected);
  if (added.includes("uniwind")) {
    log.info("HeroUI Native necesita Uniwind para los estilos: se añade Uniwind.");
  }
  return { packages };
}

export function describeExpoPackages(packages: ReadonlyArray<ExpoPackage>): string {
  return packages.length === 0
    ? "sin paquetes base"
    : packages.map((pkg) => EXPO_PACKAGES[pkg].label).join(", ");
}

export async function createExpoApp(options: ProjectOptions, app: ExpoAppSelection): Promise<void> {
  await runFrameworkCli(options, app, [
    "create-expo-app@latest",
    `apps/${app.name}`,
    "--template",
    "default",
    "--no-install",
  ]);
  await removeNestedGit(options, app);
  await resetExpoProject(appDir(options, app));
  await configureExpoApp(options, app);
}

/** Estructura y configuración de la app Expo según los paquetes elegidos (SPEC 05). */
export async function configureExpoApp(options: ProjectOptions, app: ExpoAppSelection): Promise<void> {
  const dir = appDir(options, app);
  const has = (pkg: ExpoPackage) => app.packages.includes(pkg);

  await configureBase(dir, app);
  if (has("uniwind")) {
    await configureUniwind(dir, has("heroui-native"));
  }
  await writeRootLayout(dir, app.packages);
  if (has("tanstack-query")) {
    await writeTemplate(dir, "query-client.ts", path.join(SRC_DIR, "common", "lib", "query-client.ts"));
  }
  if (has("better-auth")) {
    await configureBetterAuth(options, app, dir);
  }

  log.step(`Configurada la app Expo en apps/${app.name} (${describeExpoPackages(app.packages)})`);
}

/**
 * `<runner-local> expo install` desde `apps/<expo>`: elige las versiones compatibles con el
 * SDK. Se ejecuta después del `install` de la raíz. Si falla, sale con código 1.
 */
export async function installExpoPackages(options: ProjectOptions, app: ExpoAppSelection): Promise<void> {
  const packages = expoInstallList(app.packages);
  if (packages.length === 0) {
    return;
  }
  const runner = LOCAL_RUNNERS[options.packageManager];
  const args = [...runner.args, "expo", "install", ...packages];
  log.step(`Instalando paquetes en apps/${app.name}: ${runner.cmd} ${args.join(" ")}`);
  const code = await run(runner.cmd, args, { cwd: appDir(options, app), stdio: "inherit" });
  if (code !== 0) {
    log.error(`expo install falló en apps/${app.name} (código de salida ${code}).`);
    process.exit(1);
  }
}

// --- Reset del template -------------------------------------------------------

/** Ejecuta el reset del template `default` y elimina el script de reset. */
async function resetExpoProject(dir: string): Promise<void> {
  const scriptPath = path.join(dir, RESET_SCRIPT);
  if (!existsSync(scriptPath)) {
    log.warn(`No se encontró ${RESET_SCRIPT} en la app Expo; se omite el reset del proyecto.`);
    return;
  }

  log.step("Limpiando el proyecto de ejemplo de Expo (reset-project)");
  const code = await run("node", [RESET_SCRIPT], {
    cwd: dir,
    stdio: "inherit",
    input: RESET_ANSWER,
  });
  if (code !== 0) {
    log.error(`El reset del proyecto de Expo falló (código de salida ${code}).`);
    process.exit(1);
  }

  await rm(scriptPath, { force: true });
  const scriptsDir = path.dirname(scriptPath);
  if (existsSync(scriptsDir) && (await readdir(scriptsDir)).length === 0) {
    await rmdir(scriptsDir);
  }

  await removeResetScriptEntry(path.join(dir, "package.json"));
}

async function removeResetScriptEntry(packageJsonPath: string): Promise<void> {
  const pkg = JSON.parse(await readFile(packageJsonPath, "utf8"));
  if (pkg.scripts && RESET_SCRIPT_NAME in pkg.scripts) {
    delete pkg.scripts[RESET_SCRIPT_NAME];
    await writeFile(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
}

// --- Helpers -----------------------------------------------------------------

/** Renderiza `templates/expo/<template>` en `<dir>/<target>`. */
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

async function updateJson<T>(file: string, update: (json: T) => void): Promise<void> {
  const json = JSON.parse(await readFile(file, "utf8")) as T;
  update(json);
  await writeFile(file, `${JSON.stringify(json, null, 2)}\n`);
}

/**
 * Carpeta de rutas de expo-router, relativa a la app. El template actual usa `src/app/`;
 * si una versión la deja en `app/`, se respeta.
 */
function routesDir(dir: string): string {
  return existsSync(path.join(dir, "app")) && !existsSync(path.join(dir, SRC_DIR, "app"))
    ? "app"
    : path.join(SRC_DIR, "app");
}

// --- Base: estructura, ruta index y alias ------------------------------------

async function configureBase(dir: string, app: ExpoAppSelection): Promise<void> {
  await stripEslintPrettier(dir);

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
  await writeTemplate(dir, "index.tsx", path.join(routesDir(dir), "index.tsx"));

  type Tsconfig = { compilerOptions?: { paths?: Record<string, ReadonlyArray<string>> } };
  await updateJson<Tsconfig>(path.join(dir, "tsconfig.json"), (tsconfig) => {
    tsconfig.compilerOptions ??= {};
    tsconfig.compilerOptions.paths = { ...tsconfig.compilerOptions.paths, ...PATH_ALIASES };
  });
}

// --- Uniwind -----------------------------------------------------------------

async function configureUniwind(dir: string, withHeroUi: boolean): Promise<void> {
  await writeTemplate(dir, "metro.config.js", "metro.config.js");
  await writeTemplate(dir, "global.css", GLOBAL_CSS, {
    heroUiStyles: withHeroUi ? '\n@import "heroui-native/styles";' : "",
  });
}

// --- Layout raíz -------------------------------------------------------------

type Wrapper = { open: string; close: string };

/** Anida `inner` dentro de los wrappers (de fuera hacia dentro), indentando cada nivel. */
function wrapJsx(wrappers: ReadonlyArray<Wrapper>, inner: string, depth: number): string {
  const indent = "  ".repeat(depth);
  const [outer, ...rest] = wrappers;
  if (!outer) {
    return `${indent}${inner}`;
  }
  return [`${indent}${outer.open}`, wrapJsx(rest, inner, depth + 1), `${indent}${outer.close}`].join("\n");
}

/** `_layout.tsx` con los providers de los paquetes elegidos. */
async function writeRootLayout(dir: string, packages: ReadonlyArray<ExpoPackage>): Promise<void> {
  const routes = routesDir(dir);
  const imports: Array<string> = [];
  const wrappers: Array<Wrapper> = [];

  if (packages.includes("uniwind")) {
    const cssPath = path.relative(path.join(dir, routes), path.join(dir, GLOBAL_CSS));
    imports.push(`import "${cssPath.split(path.sep).join("/")}";`);
  }
  if (packages.includes("heroui-native")) {
    imports.push(
      'import { HeroUINativeProvider } from "heroui-native";',
      'import { GestureHandlerRootView } from "react-native-gesture-handler";',
    );
    wrappers.push(
      { open: "<GestureHandlerRootView style={{ flex: 1 }}>", close: "</GestureHandlerRootView>" },
      { open: "<HeroUINativeProvider>", close: "</HeroUINativeProvider>" },
    );
  }
  if (packages.includes("tanstack-query")) {
    imports.push(
      'import { queryClient } from "@common/lib/query-client";',
      'import { QueryClientProvider } from "@tanstack/react-query";',
    );
    wrappers.push({
      open: "<QueryClientProvider client={queryClient}>",
      close: "</QueryClientProvider>",
    });
  }

  await writeTemplate(dir, "_layout.tsx", path.join(routes, "_layout.tsx"), {
    imports: imports.map((line) => `${line}\n`).join(""),
    content: wrapJsx(wrappers, "<Stack />", 2),
  });
}

// --- Better Auth -------------------------------------------------------------

async function configureBetterAuth(
  options: ProjectOptions,
  app: ExpoAppSelection,
  dir: string,
): Promise<void> {
  // El scheme es el nombre de la app; SPEC 04 lo añade a TRUSTED_ORIGINS como `<scheme>://`.
  const scheme = app.name;
  await writeTemplate(dir, "auth-client.ts", path.join(SRC_DIR, "common", "lib", "auth-client.ts"), {
    scheme,
  });

  type AppJson = { expo?: Record<string, unknown> };
  await updateJson<AppJson>(path.join(dir, "app.json"), (appJson) => {
    appJson.expo = { ...appJson.expo, scheme };
  });

  await writeFile(path.join(dir, ENV_FILE), ENV_CONTENT);
  await ensureGitignored(projectRoot(options), ENV_FILE);
}
