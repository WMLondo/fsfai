# SPEC 02 — Selección de apps (NestJS, Expo, Next.js) creadas vacías en el monorepo

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-11-21
> **Objective:** Permitir elegir con un multiselect qué apps (NestJS, Expo, Next.js) se crean vacías con su CLI oficial dentro de `apps/` de un Turborepo limpio.

## Por qué existe esta spec

SPEC 01 deja un Turborepo `basic` con `apps/web`, `apps/docs` y `packages/ui`, que no son lo que el usuario quiere.
Esta spec vacía ese esqueleto y crea solo las apps elegidas, cada una con el instalador oficial de su framework.
La configuración de cada framework (paquetes, estructura, auth, skills de IA) va en las specs 03 a 07.

## Alcance

**Dentro:**

- Nuevo prompt `multiselect` después del gestor de paquetes: "¿Qué apps quieres crear?" con las opciones `NestJS`, `Expo` y `Next.js`. Hay que elegir al menos una (`required: true`). No hay nada preseleccionado.
- Una app como máximo por framework.
- Por cada framework elegido, un prompt `text` con el nombre de la app. Valores por defecto: `api` (NestJS), `mobile` (Expo), `web` (Next.js).
- Validación del nombre de app: el mismo formato de nombre npm que el proyecto y distinto de los nombres de las otras apps. Si falla, se muestra el error y se vuelve a pedir.
- Todos los prompts se responden antes de ejecutar ningún comando.
- Después de create-turbo, se borran `apps/web`, `apps/docs` y `packages/ui`. Se mantienen `packages/typescript-config` y `packages/eslint-config`. SPEC 03 elimina este último.
- Creación de cada app vacía con su CLI oficial, ejecutada desde la raíz del monorepo y con la salida visible (`stdio: "inherit"`):
  - NestJS → `<runner> @nestjs/cli@latest new <app> --directory apps/<app> --package-manager <pm> --skip-git --skip-install --strict`
  - Expo → `<runner> create-expo-app@latest apps/<app> --template default --no-install`, y después el reset del proyecto de ejemplo (ver plan).
  - Next.js → `<runner> create-next-app@latest apps/<app> --ts --tailwind --app --src-dir --turbopack --no-linter --import-alias "@/*" --use-<pm> --skip-install --disable-git --yes`
- El repositorio git es solo el de la raíz del monorepo. Después de crear cada app, si existe `apps/<app>/.git`, se borra.
- Una única instalación al final, en la raíz: `<pm> install`.
- El `outro` muestra cada app creada con su ruta y `<pm> run dev`.

**Fuera de alcance (specs futuras):**

- Archivo de agente IA, skills y Oxlint/Oxfmt (SPEC 03).
- Configuración de NestJS (SPEC 04), de Expo (SPEC 05) y de Next.js (SPEC 06).
- Paquete `api-client` (SPEC 07).
- Varias apps del mismo framework (p. ej. dos Next.js).
- Otros frameworks (Vite, Hono, etc.).
- La "versión lite" que se instala dentro del proyecto para añadir apps a un monorepo existente.

## Modelo de datos

```ts
// src/types.ts
export type PackageManager = "pnpm" | "npm";
export type Framework = "nestjs" | "expo" | "nextjs";

export interface AppSelection {
  framework: Framework;
  name: string; // nombre validado; carpeta apps/<name>
}

export interface ProjectOptions {
  name: string;
  packageManager: PackageManager;
  apps: ReadonlyArray<AppSelection>; // en orden: nestjs, expo, nextjs
}
```

```ts
// src/apps/frameworks.ts
export const FRAMEWORKS: Record<Framework, { label: string; defaultAppName: string }> = {
  nestjs: { label: "NestJS",  defaultAppName: "api" },
  expo:   { label: "Expo",    defaultAppName: "mobile" },
  nextjs: { label: "Next.js", defaultAppName: "web" },
};
```

Convenciones:

- `<runner>` es el mismo de SPEC 01 (`pnpm dlx` o `npx --yes`).
- Las apps se crean siempre en `<proyecto>/apps/<app>`.
- Las CLIs de cada framework se ejecutan con `cwd` = raíz del monorepo.

## Estructura de archivos

```
src/
├── index.ts            # orquesta: prompts → create-turbo → limpieza → apps → install
├── types.ts            # + Framework, AppSelection, ProjectOptions.apps
├── prompts.ts          # + askFrameworks, askAppName
├── validate.ts         # + validatePackageName (formato), validateAppName (formato + únicos)
├── run.ts              # run(cmd, args, { cwd, stdio, input? }) extraído de create-turbo.ts
├── create-turbo.ts     # usa run.ts; añade cleanTurboTemplate()
└── apps/
    ├── frameworks.ts   # FRAMEWORKS
    ├── nestjs.ts       # createNestApp(options, app)
    ├── expo.ts         # createExpoApp(options, app)
    └── nextjs.ts       # createNextApp(options, app)
```

## Plan de implementación

1. Extraer `run()` de `src/create-turbo.ts` a `src/run.ts`. Acepta `cwd` y un `input` opcional que se escribe en stdin. `create-turbo.ts` lo importa. Prueba manual: el flujo de SPEC 01 sigue funcionando igual.
2. Separar en `src/validate.ts` la validación de formato (`validatePackageName`) de la comprobación de carpeta existente. `validateProjectName` las combina. Añadir `validateAppName(value, otherNames)`. Prueba manual: los errores de nombre del proyecto no cambian.
3. Añadir `Framework`, `AppSelection` y `FRAMEWORKS`. Añadir `askFrameworks()` (multiselect, `required: true`) y `askAppName(framework, otherNames)` en `src/prompts.ts`. `index.ts` imprime las apps elegidas con `log.info`. Prueba manual: elegir NestJS + Next.js pide `api` y `web`, y un nombre repetido da error.
4. Añadir `cleanTurboTemplate(root)` en `create-turbo.ts`: borra `apps/web`, `apps/docs` y `packages/ui` con `fs.rm({ recursive: true, force: true })`. Prueba manual: después de create-turbo, `apps/` queda vacío.
5. Añadir `src/apps/nestjs.ts` con el comando de `@nestjs/cli new` y el borrado de `.git` anidado. Prueba manual: existe `apps/api/src/main.ts` y no existe `apps/api/.git`.
6. Añadir `src/apps/nextjs.ts` con el comando de `create-next-app`. Prueba manual: existe `apps/web/src/app/page.tsx` y create-next-app no hace preguntas.
7. Añadir `src/apps/expo.ts`: ejecuta `create-expo-app` y luego `node scripts/reset-project.js` en `apps/<app>` con `input: "n\n"`, que borra los ejemplos en lugar de moverlos a `app-example`. Después borra `scripts/reset-project.js` y quita el script `reset-project` del `package.json` de la app. Prueba manual: la app tiene solo la pantalla vacía y no existe `app-example/`.
8. Al final, ejecutar `<pm> install` en la raíz. Si falla, `log.error` y `exit 1`. Actualizar el `outro` con la lista de apps. Prueba manual: `<pm> run dev` en la raíz arranca todas las apps.

## Criterios de aceptación

- [ ] Después del prompt de gestor aparece el multiselect con `NestJS`, `Expo` y `Next.js`, sin nada marcado.
- [ ] Enviar el multiselect sin elegir nada muestra un error y no avanza.
- [ ] Por cada framework elegido se pide un nombre, con `api`, `mobile` o `web` como valor por defecto.
- [ ] Un nombre de app inválido (`Mi App`) o repetido muestra un error y se vuelve a pedir.
- [ ] Ctrl+C en el multiselect o en un nombre de app muestra "Operación cancelada", sale con código 0 y no crea nada.
- [ ] Al terminar no existen `apps/web` (salvo que sea el nombre elegido para Next.js), `apps/docs` ni `packages/ui`.
- [ ] Con NestJS elegido existe `apps/<app>/src/main.ts`.
- [ ] Con Expo elegido existe `apps/<app>/app.json`, y no existen `app-example/` ni `scripts/reset-project.js`.
- [ ] Con Next.js elegido existe `apps/<app>/src/app/page.tsx`.
- [ ] Ninguna carpeta `apps/*` contiene `.git`; solo existe `<proyecto>/.git`.
- [ ] Ninguna CLI de framework hace preguntas interactivas.
- [ ] `<pm> install` se ejecuta una sola vez, al final, en la raíz.
- [ ] Si una CLI de framework sale con código distinto de 0, se muestra un error que nombra el framework y la CLI sale con código 1.
- [ ] El `outro` lista cada app como `apps/<app>` y muestra `cd <proyecto>` y `<pm> run dev`.

## Decisiones

- **Sí:** multiselect con una app por framework. Es lo pedido y simplifica el modelo de datos.
- **No:** bucle "añadir otra app". Permitiría varias apps por framework, pero no se necesita ahora.
- **Sí:** `create-turbo` con el ejemplo `basic` y borrar sus apps y `packages/ui`. No existe un ejemplo oficial vacío.
- **Sí:** mantener `packages/typescript-config`. Las apps pueden extenderlo más adelante.
- **Sí:** todas las preguntas antes de ejecutar nada. Si el usuario cancela, no queda ningún proyecto a medias.
- **Sí:** CLIs oficiales sin instalar (`--skip-install`, `--no-install`) y un único `install` en la raíz. Un solo lockfile coherente con el workspace.
- **Sí:** `--skip-git` y `--disable-git`, más el borrado de cualquier `.git` anidado. El git del proyecto es el del Turborepo.
- **Sí:** template `default` de Expo + reset. Trae expo-router y TypeScript sin pantallas de ejemplo.
- **No:** template `blank-typescript`. No trae router.
- **Sí:** Next.js con App Router, TypeScript, Tailwind, `src/` y sin linter. Oxlint lo cubre todo (SPEC 03).
- **Sí:** nombres de app por defecto `api`, `mobile` y `web`. Son cortos y convencionales.
- **No:** versión lite instalada dentro del proyecto. Esta CLI es global; la lite irá en su propia spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `create-next-app@latest` renombra flags (`--no-linter`, `--turbopack`) o añade preguntas nuevas | `--yes` acepta los defaults de las preguntas no cubiertas. Los flags están centralizados en `src/apps/nextjs.ts`. |
| `reset-project.js` de Expo cambia su pregunta o desaparece | Si el script no existe, se omite el reset con `log.warn`. Se comprueba en la prueba manual del paso 7. |
| `@nestjs/cli new` ignora `--directory` en alguna versión | El paso 5 comprueba la ruta. Alternativa: ejecutar con `cwd: apps/` y nombre `<app>`. |
| Expo con pnpm en modo aislado falla en Metro | Si falla, añadir `node-linker=hoisted` al `.npmrc` de la raíz. Se decide en la prueba manual del paso 8. |
| Next.js y NestJS usan el puerto 3000 en `dev` | SPEC 04 mueve NestJS a 3001. |

## Lo que **no** está en esta spec

- Archivo de agente IA, skills y Oxlint/Oxfmt.
- Configuración interna de NestJS, Expo o Next.js.
- Paquete `api-client`.
- Varias apps por framework u otros frameworks.
- Versión lite para añadir apps a un monorepo existente.

Cada uno, si llega, va en su propia spec.
