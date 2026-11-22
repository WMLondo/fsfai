import type { NextPackage } from "../types.js";

/**
 * Paquetes base elegibles de la app Next.js. Única fuente de la lista de paquetes npm
 * que instala `<pm> add` por cada opción.
 */
export const NEXT_PACKAGES: Record<NextPackage, { label: string; install: ReadonlyArray<string> }> = {
  "better-auth": { label: "Better Auth", install: ["better-auth"] },
  "react-hook-form": { label: "React Hook Form", install: ["react-hook-form"] },
  zod: { label: "Zod", install: ["zod"] },
  "lucide-react": { label: "Lucide React", install: ["lucide-react"] },
  // Se instala con `shadcn init`.
  shadcn: { label: "shadcn/ui", install: [] },
  nuqs: { label: "nuqs", install: ["nuqs"] },
  // Con shadcn se instala con `shadcn add sonner`.
  sonner: { label: "Sonner", install: ["sonner"] },
  cn: { label: "cn (clsx + tailwind-merge)", install: ["clsx", "tailwind-merge"] },
};

/** Orden en que se muestran las opciones del multiselect. */
export const NEXT_PACKAGE_ORDER: ReadonlyArray<NextPackage> = [
  "better-auth",
  "react-hook-form",
  "zod",
  "lucide-react",
  "shadcn",
  "nuqs",
  "sonner",
  "cn",
];

// Une React Hook Form con Zod (`zodResolver`).
const HOOKFORM_RESOLVERS = "@hookform/resolvers";

// Opciones que `shadcn init` (o `shadcn add`) ya instala: no se duplican con `<pm> add`.
const INCLUDED_IN_SHADCN: ReadonlyArray<NextPackage> = ["cn", "lucide-react", "sonner"];

export type ResolvedNextPackages = {
  /** Paquetes npm para `<pm> add`. */
  install: ReadonlyArray<string>;
  /** `shadcn init`, y `shadcn add sonner` si se eligió Sonner. */
  shadcn: { init: boolean; addSonner: boolean };
};

/**
 * Aplica las dependencias implícitas: con React Hook Form y Zod añade `@hookform/resolvers`;
 * con shadcn, `cn`, `lucide-react` y `sonner` los instala la CLI de shadcn.
 */
export function resolveNextPackages(packages: ReadonlyArray<NextPackage>): ResolvedNextPackages {
  const withShadcn = packages.includes("shadcn");
  const viaPm = withShadcn ? packages.filter((pkg) => !INCLUDED_IN_SHADCN.includes(pkg)) : packages;
  const install = viaPm.flatMap((pkg) => NEXT_PACKAGES[pkg].install);
  if (packages.includes("react-hook-form") && packages.includes("zod")) {
    install.push(HOOKFORM_RESOLVERS);
  }
  return {
    install: [...new Set(install)],
    shadcn: { init: withShadcn, addSonner: withShadcn && packages.includes("sonner") },
  };
}

/** Resumen para el usuario. Con shadcn, `cn` y Lucide se muestran como incluidos en shadcn/ui. */
export function describeNextPackages(packages: ReadonlyArray<NextPackage>): string {
  if (packages.length === 0) {
    return "sin paquetes base";
  }
  const withShadcn = packages.includes("shadcn");
  const folded: ReadonlyArray<NextPackage> = ["cn", "lucide-react"];
  return packages
    .filter((pkg) => !(withShadcn && folded.includes(pkg)))
    .map((pkg) => {
      if (pkg !== "shadcn") {
        return NEXT_PACKAGES[pkg].label;
      }
      const included = folded.filter((other) => packages.includes(other));
      return included.length === 0
        ? NEXT_PACKAGES.shadcn.label
        : `${NEXT_PACKAGES.shadcn.label} (incluye ${included.map((other) => (other === "cn" ? "cn" : NEXT_PACKAGES[other].label)).join(" y ")})`;
    })
    .join(", ");
}
