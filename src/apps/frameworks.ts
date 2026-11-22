import type { Framework } from "../types.js";

export const FRAMEWORKS: Record<Framework, { label: string; defaultAppName: string }> = {
  nestjs: { label: "NestJS", defaultAppName: "api" },
  expo: { label: "Expo", defaultAppName: "mobile" },
  nextjs: { label: "Next.js", defaultAppName: "web" },
};

/** Orden canónico en que se piden y se crean las apps. */
export const FRAMEWORK_ORDER: ReadonlyArray<Framework> = ["nestjs", "expo", "nextjs"];

/** Frameworks de backend (skill `nestjs-backend`). */
export const BACKEND_FRAMEWORKS: ReadonlyArray<Framework> = ["nestjs"];

/** Frameworks de frontend/mobile (skill `typescript-frontend` y reglas de estilo front de Oxlint). */
export const FRONTEND_FRAMEWORKS: ReadonlyArray<Framework> = ["expo", "nextjs"];
