export type PackageManager = "pnpm" | "npm";
export type Framework = "nestjs" | "expo" | "nextjs";
export type AiAgent = "claude" | "other";
export type Orm = "drizzle" | "typeorm";

// `name`: nombre validado; carpeta apps/<name>.
export type AppSelection =
  | { framework: "nestjs"; name: string; orm: Orm }
  | { framework: "expo"; name: string } // SPEC 05 lo amplía
  | { framework: "nextjs"; name: string }; // SPEC 06 lo amplía

export type NestAppSelection = Extract<AppSelection, { framework: "nestjs" }>;

export interface ProjectOptions {
  name: string; // nombre validado del proyecto y de la carpeta
  packageManager: PackageManager;
  aiAgent: AiAgent;
  apps: ReadonlyArray<AppSelection>; // en orden: nestjs, expo, nextjs
}
