# SPEC 06 — App Next.js configurada con paquetes base elegibles

> **Status:** Draft
> **Depends on:** SPEC 02, SPEC 03
> **Date:** 2026-11-21
> **Objective:** Preguntar qué paquetes base se instalan en la app Next.js (Better Auth, React Hook Form, Zod, Lucide, shadcn, nuqs, Sonner, cn), instalarlos en `latest` y dejarlos conectados con la estructura del TypeScript Style Guide.

## Alcance

**Dentro:**

- Nuevo prompt `multiselect` justo después del nombre de la app Next.js: "Paquetes para <app>". Todas las opciones van marcadas por defecto:
  - `better-auth` — cliente de Better Auth
  - `react-hook-form` — React Hook Form
  - `zod` — Zod
  - `lucide-react` — Lucide React
  - `shadcn` — shadcn/ui (`init`)
  - `nuqs` — nuqs
  - `sonner` — Sonner
  - `cn` — utilidad `cn` (`clsx` + `tailwind-merge`)
- Se puede no elegir ninguno.
- Dependencias implícitas:
  - Con `react-hook-form` y `zod` se añade `@hookform/resolvers`.
  - Con `shadcn`, `cn` y `lucide-react` vienen incluidos en `shadcn init`; no se duplican.
- Instalación desde `apps/<next>`, después del `install` de la raíz:
  - Paquetes npm: `<pm> add <paquetes>`.
  - shadcn: `<runner> shadcn@latest init --yes --base-color neutral`.
  - Sonner con shadcn: `<runner> shadcn@latest add sonner --yes`. Sin shadcn: `<pm> add sonner`.
- Configuración según los paquetes elegidos:
  - `nuqs`: `NuqsAdapter` (`nuqs/adapters/next/app`) en `src/app/layout.tsx`.
  - `sonner`: `<Toaster />` en `src/app/layout.tsx`.
  - `cn` sin shadcn: `src/common/lib/cn.ts`.
  - `better-auth`: `src/common/lib/auth-client.ts` con `createAuthClient({ baseURL: process.env.NEXT_PUBLIC_API_URL })` y `.env.local` con `NEXT_PUBLIC_API_URL=http://localhost:3001`.
- Estructura del TypeScript Style Guide: `src/app/` solo enruta, `src/modules/HomePage/index.tsx` con `HomePage` y `src/common/`.
- `src/app/page.tsx` queda como `export { HomePage as default } from '@/modules/HomePage';`.

**Fuera de alcance (specs futuras):**

- TanStack Query en Next.js.
- Páginas de login/registro y middleware de sesión.
- Componentes shadcn aparte de `sonner`.
- Tema, modo oscuro y fuentes personalizadas.
- Storybook y tests (Vitest/Playwright).
- Consumir `api-client` (SPEC 07).

## Modelo de datos

```ts
// src/types.ts (CLI)
export type NextPackage =
  | "better-auth" | "react-hook-form" | "zod" | "lucide-react"
  | "shadcn" | "nuqs" | "sonner" | "cn";

// variante Next.js de AppSelection
{ framework: "nextjs"; name: string; packages: ReadonlyArray<NextPackage> }
```

```ts
// src/apps/next-packages.ts
export const NEXT_PACKAGES: Record<NextPackage, { label: string; install: ReadonlyArray<string> }> = {
  "better-auth":     { label: "Better Auth",      install: ["better-auth"] },
  "react-hook-form": { label: "React Hook Form",  install: ["react-hook-form"] },
  "zod":             { label: "Zod",              install: ["zod"] },
  "lucide-react":    { label: "Lucide React",     install: ["lucide-react"] },
  "shadcn":          { label: "shadcn/ui",        install: [] },              // se instala con `shadcn init`
  "nuqs":            { label: "nuqs",             install: ["nuqs"] },
  "sonner":          { label: "Sonner",           install: ["sonner"] },      // o `shadcn add sonner`
  "cn":              { label: "cn (clsx + tailwind-merge)", install: ["clsx", "tailwind-merge"] },
};
```

Convenciones:

- Con shadcn, `cn` vive donde lo pone shadcn (`src/lib/utils.ts`) y los componentes en `src/components/ui/`. Sin shadcn, `cn` vive en `src/common/lib/cn.ts`.
- El alias es `@/*` → `src/*`, el que crea `create-next-app` (SPEC 02).

## Estructura de archivos

App generada (`apps/<next>/`), con todos los paquetes elegidos:

```
apps/<next>/
├── components.json             # shadcn
├── .env.local
└── src/
    ├── app/
    │   ├── layout.tsx          # NuqsAdapter + Toaster
    │   └── page.tsx            # re-exporta HomePage
    ├── components/ui/sonner.tsx
    ├── lib/utils.ts            # cn (shadcn)
    ├── common/
    │   ├── components/
    │   ├── consts/
    │   ├── hooks/
    │   ├── lib/auth-client.ts
    │   └── types/
    └── modules/
        └── HomePage/index.tsx
```

En la CLI:

```
templates/nextjs/
├── layout.tsx               # con marcadores por paquete
├── page.tsx
├── HomePage.tsx
├── auth-client.ts
└── cn.ts
src/apps/nextjs.ts           # + askNextPackages(), configureNextApp(options, app)
src/apps/next-packages.ts    # NEXT_PACKAGES, resolveNextPackages()
```

## Plan de implementación

1. Añadir `NextPackage`, `NEXT_PACKAGES`, el multiselect con todo marcado y `resolveNextPackages()` con las dependencias implícitas. Prueba manual: con shadcn marcado, el resumen no lista `clsx` ni `tailwind-merge` por separado.
2. `configureNextApp`, paso base: `stripEslintPrettier`, crear `src/common/` y `src/modules/HomePage/`, y reemplazar `src/app/page.tsx` por la re-exportación. Prueba manual: `<pm> run dev` en la app muestra `HomePage`.
3. Instalar los paquetes npm resueltos con `<pm> add`. Si falla, `log.error` y `exit 1`. Prueba manual: aparecen en `package.json` de la app.
4. Si se eligió shadcn, ejecutar `shadcn init` (y `add sonner` si aplica). Si no, crear `src/common/lib/cn.ts` cuando se eligió `cn`. Prueba manual: existe `components.json` y `cn('a', false && 'b')` devuelve `'a'`.
5. Generar `src/app/layout.tsx` con `NuqsAdapter` y `Toaster` según lo elegido. Prueba manual: un `toast('hola')` en `HomePage` se muestra.
6. Configurar Better Auth: `auth-client.ts` y `.env.local`. Prueba manual: con la app Nest de SPEC 04 en marcha, `authClient.signUp.email(...)` crea un usuario.

## Criterios de aceptación

- [ ] Con Next.js elegido, después de su nombre aparece "Paquetes para <app>" con las 8 opciones marcadas.
- [ ] Ctrl+C en ese prompt muestra "Operación cancelada" y sale con código 0.
- [ ] Con todos los paquetes, `apps/<next>/package.json` contiene `better-auth`, `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`, `nuqs`, `sonner`, `clsx` y `tailwind-merge`.
- [ ] Con shadcn existen `components.json`, `src/lib/utils.ts` y `src/components/ui/sonner.tsx`.
- [ ] Sin shadcn y con `cn` existe `src/common/lib/cn.ts` y no existe `components.json`.
- [ ] Un paquete desmarcado no aparece en `package.json` y su configuración no se genera.
- [ ] Con nuqs, `src/app/layout.tsx` envuelve `children` en `NuqsAdapter`.
- [ ] Con Sonner, `src/app/layout.tsx` renderiza `<Toaster />`.
- [ ] Con Better Auth existe `.env.local` con `NEXT_PUBLIC_API_URL=http://localhost:3001` y `src/common/lib/auth-client.ts`.
- [ ] `src/app/page.tsx` solo re-exporta `HomePage` de `@/modules/HomePage`.
- [ ] La app no tiene dependencias ni configs de ESLint.
- [ ] `<pm> run build` en la app termina sin errores con todos los paquetes elegidos.
- [ ] `<pm> run lint` en la raíz termina con código 0.

## Decisiones

- **Sí:** multiselect con todo marcado, igual que en Expo. Mantiene la misma experiencia en las dos apps front.
- **Sí:** instalar en `latest` con `<pm> add`. En Next.js no hay un equivalente a `expo install`.
- **Sí:** `shadcn init` en lugar de instalar sus dependencias a mano. Configura Tailwind, `components.json` y `cn` de forma oficial.
- **Sí:** aceptar las rutas por defecto de shadcn (`src/components/ui`, `src/lib/utils.ts`). Cambiarlas complica `init` y la CLI de shadcn espera esos alias.
- **Sí:** Sonner vía `shadcn add sonner` si hay shadcn. Queda con los estilos del design system.
- **Sí:** Better Auth en Next.js solo como cliente. El servidor vive en NestJS (SPEC 04).
- **Sí:** `page.tsx` solo re-exporta una `Page` de `modules/`. Es lo que pide la guía.
- **No:** TanStack Query en Next.js. No está en la lista que pidió el usuario.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `shadcn init` cambia sus flags o hace preguntas nuevas | `--yes` acepta los defaults. Los flags están en `src/apps/nextjs.ts`. |
| `shadcn init` no detecta Tailwind v4 en una versión nueva de Next.js | Se comprueba en el paso 4. Si falla, `log.warn` y se continúa sin shadcn. |
| Reescribir `layout.tsx` pisa cambios de `create-next-app` (fuentes, metadata) | La plantilla parte del `layout.tsx` generado y solo envuelve `children`. |

## Lo que **no** está en esta spec

- TanStack Query en Next.js.
- Páginas de auth y middleware de sesión.
- Más componentes de shadcn.
- Tema, modo oscuro y fuentes.
- Storybook y tests.
- Integración con `api-client`.

Cada uno, si llega, va en su propia spec.
