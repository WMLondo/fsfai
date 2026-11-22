import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const WORKSPACE_FILE = "pnpm-workspace.yaml";
const ALLOW_BUILDS_KEY = "allowBuilds:";

/**
 * Añade entradas a `allowBuilds` del `pnpm-workspace.yaml` de la raíz.
 * pnpm 11+ hace fallar `pnpm install` si una dependencia tiene build scripts sin aprobar
 * (`ERR_PNPM_IGNORED_BUILDS`): `true` los permite, `false` los ignora sin error.
 * No toca las entradas que ya existan.
 */
export async function allowPnpmBuilds(
  root: string,
  builds: Readonly<Record<string, boolean>>,
): Promise<void> {
  const file = path.join(root, WORKSPACE_FILE);
  const content = existsSync(file) ? await readFile(file, "utf8") : "";
  const lines = content.length > 0 ? content.replace(/\n$/, "").split("\n") : [];

  let keyIndex = lines.findIndex((line) => line.trimEnd() === ALLOW_BUILDS_KEY);
  if (keyIndex === -1) {
    lines.push(ALLOW_BUILDS_KEY);
    keyIndex = lines.length - 1;
  }

  // Entradas actuales del bloque: líneas indentadas justo después de `allowBuilds:`.
  let blockEnd = keyIndex + 1;
  while (blockEnd < lines.length && /^\s+\S/.test(lines[blockEnd])) {
    blockEnd++;
  }
  const block = lines.slice(keyIndex + 1, blockEnd).join("\n");

  const newEntries = Object.entries(builds)
    .filter(([name]) => !block.includes(`'${name}':`))
    .map(([name, allowed]) => `  '${name}': ${allowed}`);
  lines.splice(blockEnd, 0, ...newEntries);

  await writeFile(file, `${lines.join("\n")}\n`);
}
