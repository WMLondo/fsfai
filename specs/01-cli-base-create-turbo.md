# SPEC 01 — CLI base con clack para crear un monorepo Turborepo

> **Status:** Approved
> **Depends on:** —
> **Date:** 2026-11-21
> **Objective:** Crear la CLI `fsfai` en TypeScript con `@clack/prompts` que confirma la creación, pide el nombre del proyecto y el gestor de paquetes (pnpm o npm) y ejecuta `create-turbo@latest` de forma no interactiva.

## Por qué existe esta spec

El objetivo final de `fsfai` es generar entornos ya configurados con las últimas versiones de los paquetes necesarios.
Esta spec solo monta la base: el proyecto de la CLI y el primer flujo (Turborepo como esqueleto).
Las configuraciones adicionales se apoyarán sobre este flujo en specs posteriores.

## Alcance

**Dentro:**

- Proyecto de la CLI gestionado con pnpm, en TypeScript, compilado con tsup.
- `package.json` con `name: "fsfai"`, `type: "module"`, `bin: { "fsfai": "./dist/index.js" }` y `engines.node: ">=20"`.
- Flujo interactivo con `@clack/prompts`, en este orden:
  1. `intro` con el nombre de la CLI.
  2. `confirm`: "¿Quieres crear un nuevo proyecto?".
  3. `text`: nombre del proyecto, con validación.
  4. `select`: gestor de paquetes (`pnpm` preseleccionado, `npm`).
  5. Ejecución de create-turbo.
  6. `outro` con los próximos pasos.
- Validación del nombre: formato válido de nombre de paquete npm y que no exista ya una carpeta con ese nombre en el directorio actual. Si falla, el prompt muestra el error y vuelve a pedirlo.
- Comprobación de que el gestor elegido está instalado antes de ejecutar create-turbo.
- Invocación no interactiva de create-turbo, mostrando su salida en la terminal:
  - pnpm → `pnpm dlx create-turbo@latest <nombre> --package-manager pnpm`
  - npm → `npx create-turbo@latest <nombre> --package-manager npm`
- Cancelación (responder "No" al confirm o Ctrl+C en cualquier prompt): `cancel("Operación cancelada")` y `process.exit(0)`, sin crear nada.
- Scripts del repo: `dev` (ejecución directa en desarrollo), `build` (tsup), `start` (`node dist/index.js`).
- Uso local: `pnpm build && node dist/index.js`, o `pnpm link --global` para tener el comando `fsfai`.

**Fuera de alcance (specs futuras):**

- Publicación en npm y flujo de release.
- Actualizar las dependencias del monorepo generado a `latest`.
- Configuraciones extra (linters, formatters, templates de apps, CI, etc.).
- Soporte para yarn o bun.
- Flags de línea de comandos para saltarse los prompts.
- Spinner que oculte la salida de create-turbo.

## Modelo de datos

```ts
// src/types.ts
export type PackageManager = "pnpm" | "npm";

export interface ProjectOptions {
  name: string;               // nombre validado del proyecto y de la carpeta
  packageManager: PackageManager;
}
```

```ts
// Mapa de comandos de ejecución remota por gestor
const RUNNERS: Record<PackageManager, { cmd: string; args: string[] }> = {
  pnpm: { cmd: "pnpm", args: ["dlx"] },
  npm:  { cmd: "npx",  args: [] },
};
```

Convenciones:

- El proyecto se crea siempre en `process.cwd()/<nombre>`.
- La ejecución de procesos usa `node:child_process` (`spawn` con `stdio: "inherit"`), sin dependencias extra.

## Estructura de archivos

```
fsfai/
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── src/
    ├── index.ts          # entrada con shebang; orquesta el flujo
    ├── types.ts          # PackageManager, ProjectOptions
    ├── prompts.ts        # confirm, nombre, gestor (clack)
    ├── validate.ts       # validación del nombre del proyecto
    └── create-turbo.ts   # comprobación del gestor y ejecución de create-turbo
```

## Plan de implementación

1. Inicializar el repo con pnpm: `package.json` (name, type, bin, engines, scripts), `tsconfig.json`, `tsup.config.ts` (entrada `src/index.ts`, formato ESM, target node20, banner con shebang `#!/usr/bin/env node`). Dependencias: `@clack/prompts`; dev: `typescript`, `tsup`, `tsx`, `@types/node`. `src/index.ts` muestra `intro` y `outro`. Prueba manual: `pnpm build && node dist/index.js` muestra ambos mensajes.
2. Añadir `src/types.ts` y `src/prompts.ts` con el `confirm` inicial y el manejo de cancelación (`isCancel` → `cancel` → `exit 0`). Prueba manual: responder "No" o pulsar Ctrl+C termina con "Operación cancelada".
3. Añadir `src/validate.ts` y el prompt `text` del nombre usando esa validación. Prueba manual: un nombre con mayúsculas/espacios o el de una carpeta existente muestra error y vuelve a pedirlo.
4. Añadir el prompt `select` del gestor (pnpm por defecto). `index.ts` construye un `ProjectOptions` y lo imprime con `log.info`. Prueba manual: el resumen muestra nombre y gestor elegidos.
5. Añadir `src/create-turbo.ts`: comprobar el gestor con `<pm> --version`; si no está instalado, `log.error` y `exit 1`. Ejecutar el comando de create-turbo con `stdio: "inherit"`; si el código de salida no es 0, `log.error` y `exit 1`. Prueba manual: se crea la carpeta del monorepo.
6. Conectar el `outro` final con los próximos pasos: `cd <nombre>` y `<pm> run dev`. Prueba manual: el mensaje refleja el gestor elegido.

## Criterios de aceptación

- [ ] `pnpm build` genera `dist/index.js` sin errores de TypeScript.
- [ ] `node dist/index.js` arranca mostrando el `intro` de clack.
- [ ] Tras `pnpm link --global`, el comando `fsfai` ejecuta la CLI.
- [ ] Responder "No" al confirm inicial muestra "Operación cancelada", sale con código 0 y no crea ninguna carpeta.
- [ ] Pulsar Ctrl+C en cualquiera de los tres prompts muestra "Operación cancelada" y sale con código 0.
- [ ] Un nombre inválido (p. ej. `Mi Proyecto`) muestra un error de validación y vuelve a pedir el nombre.
- [ ] El nombre de una carpeta existente en el directorio actual muestra un error y vuelve a pedir el nombre.
- [ ] El prompt de gestor aparece con `pnpm` preseleccionado.
- [ ] Eligiendo pnpm se ejecuta `pnpm dlx create-turbo@latest <nombre> --package-manager pnpm` y create-turbo no hace ninguna pregunta.
- [ ] Eligiendo npm se ejecuta `npx create-turbo@latest <nombre> --package-manager npm` y create-turbo no hace ninguna pregunta.
- [ ] Al terminar, existe `./<nombre>/turbo.json`.
- [ ] Si el gestor elegido no está instalado, se muestra un error claro y la CLI sale con código 1 sin ejecutar create-turbo.
- [ ] Si create-turbo falla, se muestra un error y la CLI sale con código 1.
- [ ] El `outro` final muestra `cd <nombre>` y `<pm> run dev` con el gestor elegido.

## Decisiones

- **Sí:** TypeScript + tsup. Tipado y un único bundle ejecutable con shebang.
- **No:** tsx como único runner. No sirve bien para distribuir; se mantiene solo para `dev`.
- **No:** JavaScript puro. Se pierde el tipado con poco ahorro real.
- **Sí:** ejecución local con `bin` + `pnpm link --global`. Publicar en npm implica decisiones de release que van en otra spec.
- **Sí:** create-turbo no interactivo con `--package-manager`. Evita preguntar dos veces el gestor; nuestra CLI controla todas las preguntas.
- **No:** dejar que create-turbo pregunte. Duplicaría preguntas y rompería la experiencia unificada.
- **No:** spinner ocultando la salida de create-turbo. Se prefiere ver el progreso real; puede revisarse en otra spec.
- **Sí:** validar y volver a pedir el nombre si la carpeta existe o es inválido. Más amable que abortar.
- **No:** ofrecer sobrescribir una carpeta existente. Riesgo de pérdida de datos.
- **Sí:** pnpm preseleccionado; `pnpm dlx` y `npx` como runners.
- **Sí:** cancelación con `cancel()` y código 0. Cancelar es una acción del usuario, no un error.
- **Sí:** pnpm como gestor del propio repo de la CLI. Coherente con el default del prompt.
- **Sí:** `engines.node >= 20`. LTS con soporte amplio.
- **Sí:** `node:child_process` en lugar de `execa`. Evita una dependencia para un caso simple.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| create-turbo cambia o renombra el flag `--package-manager` en `@latest` | Si sale con código distinto de 0, la CLI muestra el error. El flag está centralizado en `src/create-turbo.ts`. |
| create-turbo añade una pregunta nueva no cubierta por flags | `stdio: "inherit"` permite que el usuario la responda; se detecta en la prueba manual. |
| `npx` pide confirmación para instalar create-turbo | Pasar `--yes` a `npx` si ocurre en la prueba manual del paso 5. |
| El gestor elegido no está instalado | Comprobación previa con `<pm> --version` y salida con código 1. |

## Lo que **no** está en esta spec

- Publicación en npm.
- Actualización de dependencias a `latest` en el monorepo generado.
- Linters, formatters, templates, CI u otras configuraciones.
- Soporte para yarn o bun.
- Flags para modo no interactivo de la propia CLI.

Cada uno, si llega, va en su propia spec.
