export type PackageManager = "pnpm" | "npm";
export type Framework = "nestjs" | "expo" | "nextjs";
export type AiAgent = "claude" | "other";

export interface AppSelection {
  framework: Framework;
  name: string; // nombre validado; carpeta apps/<name>
}

export interface ProjectOptions {
  name: string; // nombre validado del proyecto y de la carpeta
  packageManager: PackageManager;
  aiAgent: AiAgent;
  apps: ReadonlyArray<AppSelection>; // en orden: nestjs, expo, nextjs
}
