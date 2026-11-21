import type { Framework } from "../types.js";

export const FRAMEWORKS: Record<Framework, { label: string; defaultAppName: string }> = {
  nestjs: { label: "NestJS", defaultAppName: "api" },
  expo: { label: "Expo", defaultAppName: "mobile" },
  nextjs: { label: "Next.js", defaultAppName: "web" },
};

/** Orden canónico en que se piden y se crean las apps. */
export const FRAMEWORK_ORDER: ReadonlyArray<Framework> = ["nestjs", "expo", "nextjs"];
