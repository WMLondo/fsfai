export type PackageManager = "pnpm" | "npm";

export interface ProjectOptions {
  name: string; // nombre validado del proyecto y de la carpeta
  packageManager: PackageManager;
}
