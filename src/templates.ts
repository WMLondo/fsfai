import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Archivos que solo existen para versionar carpetas vacías en el repo de la CLI.
const IGNORED_FILES = new Set([".gitkeep"]);

export type TemplateVars = Readonly<Record<string, string>>;

/**
 * Carpeta `templates/` del paquete de la CLI.
 * Se resuelve desde `import.meta.url` (no desde `process.cwd()`), así funciona
 * igual desde `src/` con tsx, desde `dist/` y tras `pnpm link --global`.
 */
export function templatesDir(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "templates");
}

/** Reemplaza `{{clave}}` por su valor. Las claves desconocidas se dejan tal cual. */
export function renderString(content: string, vars: TemplateVars): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    Object.hasOwn(vars, key) ? vars[key] : match,
  );
}

/** Lee una plantilla (ruta relativa a `templates/`) y la devuelve renderizada. */
export async function renderTemplate(file: string, vars: TemplateVars = {}): Promise<string> {
  const content = await readFile(path.join(templatesDir(), file), "utf8");
  return renderString(content, vars);
}

/** Copia recursivamente una carpeta de `templates/` a `dest`, renderizando cada archivo. */
export async function copyTemplateDir(
  src: string,
  dest: string,
  vars: TemplateVars = {},
): Promise<void> {
  const from = path.join(templatesDir(), src);
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const relative = path.join(src, entry.name);
    const target = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyTemplateDir(relative, target, vars);
    } else if (entry.isFile() && !IGNORED_FILES.has(entry.name)) {
      await writeFile(target, await renderTemplate(relative, vars));
    }
  }
}
