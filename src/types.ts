export type PackageManager = "pnpm" | "npm";
export type Framework = "nestjs" | "expo" | "nextjs";
export type AiAgent = "claude" | "other";
export type Orm = "drizzle" | "typeorm";
export type ExpoPackage =
  | "heroui-native"
  | "uniwind"
  | "better-auth"
  | "vector-icons"
  | "react-hook-form"
  | "tanstack-query"
  | "zod"
  | "flash-list";
export type NextPackage =
  | "better-auth"
  | "react-hook-form"
  | "zod"
  | "lucide-react"
  | "shadcn"
  | "nuqs"
  | "sonner"
  | "cn";

// `name`: nombre validado; carpeta apps/<name>.
export type AppSelection =
  | { framework: "nestjs"; name: string; orm: Orm }
  | { framework: "expo"; name: string; packages: ReadonlyArray<ExpoPackage> }
  | { framework: "nextjs"; name: string; packages: ReadonlyArray<NextPackage> };

export type NestAppSelection = Extract<AppSelection, { framework: "nestjs" }>;
export type ExpoAppSelection = Extract<AppSelection, { framework: "expo" }>;
export type NextAppSelection = Extract<AppSelection, { framework: "nextjs" }>;

export interface ProjectOptions {
  name: string; // nombre validado del proyecto y de la carpeta
  packageManager: PackageManager;
  aiAgent: AiAgent;
  apps: ReadonlyArray<AppSelection>; // en orden: nestjs, expo, nextjs
}
