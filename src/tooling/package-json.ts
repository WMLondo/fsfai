import { readFile, writeFile } from "node:fs/promises";

export type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown;
};

export const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

export async function readPackageJson(file: string): Promise<PackageJson> {
  return JSON.parse(await readFile(file, "utf8")) as PackageJson;
}

export async function writePackageJson(file: string, pkg: PackageJson): Promise<void> {
  await writeFile(file, `${JSON.stringify(pkg, null, 2)}\n`);
}
