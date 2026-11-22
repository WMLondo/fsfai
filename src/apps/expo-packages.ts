import type { ExpoPackage } from "../types.js";

/**
 * Paquetes base elegibles de la app Expo. Única fuente de la lista de paquetes que
 * instala `expo install` por cada opción (incluidos sus peers, según su documentación).
 */
export const EXPO_PACKAGES: Record<ExpoPackage, { label: string; install: ReadonlyArray<string> }> = {
  "heroui-native": {
    label: "HeroUI Native",
    install: [
      "heroui-native",
      "react-native-reanimated",
      "react-native-gesture-handler",
      "react-native-worklets",
      "react-native-safe-area-context",
      "react-native-svg",
      "tailwind-variants",
      "tailwind-merge",
    ],
  },
  uniwind: { label: "Uniwind", install: ["uniwind", "tailwindcss"] },
  "better-auth": {
    label: "Better Auth",
    install: [
      "better-auth",
      "@better-auth/expo",
      "expo-secure-store",
      "expo-network",
      "expo-linking",
      "expo-web-browser",
      "expo-constants",
    ],
  },
  "vector-icons": { label: "Expo Vector Icons", install: ["@expo/vector-icons"] },
  "react-hook-form": { label: "React Hook Form", install: ["react-hook-form"] },
  "tanstack-query": { label: "TanStack Query", install: ["@tanstack/react-query"] },
  zod: { label: "Zod", install: ["zod"] },
  "flash-list": { label: "FlashList", install: ["@shopify/flash-list"] },
};

/** Orden en que se muestran las opciones del multiselect. */
export const EXPO_PACKAGE_ORDER: ReadonlyArray<ExpoPackage> = [
  "heroui-native",
  "uniwind",
  "better-auth",
  "vector-icons",
  "react-hook-form",
  "tanstack-query",
  "zod",
  "flash-list",
];

// Une React Hook Form con Zod (`zodResolver`).
const HOOKFORM_RESOLVERS = "@hookform/resolvers";

export type ResolvedExpoPackages = {
  packages: ReadonlyArray<ExpoPackage>;
  /** Paquetes añadidos por dependencia implícita (no elegidos por el usuario). */
  added: ReadonlyArray<ExpoPackage>;
};

/** Aplica las dependencias implícitas entre opciones: HeroUI Native necesita Uniwind. */
export function resolveExpoPackages(selected: ReadonlyArray<ExpoPackage>): ResolvedExpoPackages {
  const added: Array<ExpoPackage> = [];
  if (selected.includes("heroui-native") && !selected.includes("uniwind")) {
    added.push("uniwind");
  }
  const all = new Set([...selected, ...added]);
  return { packages: EXPO_PACKAGE_ORDER.filter((pkg) => all.has(pkg)), added };
}

/** Lista de paquetes npm para `expo install`. Con React Hook Form y Zod añade `@hookform/resolvers`. */
export function expoInstallList(packages: ReadonlyArray<ExpoPackage>): Array<string> {
  const names = packages.flatMap((pkg) => EXPO_PACKAGES[pkg].install);
  if (packages.includes("react-hook-form") && packages.includes("zod")) {
    names.push(HOOKFORM_RESOLVERS);
  }
  return [...new Set(names)];
}
