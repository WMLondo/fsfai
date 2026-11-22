# SPEC 10 — Configuración de VS Code con TypeScript 7 en el monorepo generado

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 03
> **Date:** 2026-11-22
> **Objective:** Que cada monorepo generado instale `typescript@latest` (TypeScript 7) en la raíz y traiga una carpeta `.vscode/` que haga que VS Code use esa versión y recomiende la extensión de Oxc.

## Por qué existe esta spec

El repo de la CLI ya usa TypeScript 7 en VS Code con `.vscode/settings.json` (`"js/ts.tsdk.path": "node_modules/typescript"`).
Los proyectos generados no traen nada parecido: VS Code usa su TypeScript integrado y no sugiere la extensión de Oxc, aunque SPEC 03 cambió ESLint/Prettier por Oxlint/Oxfmt.
Esta spec lleva al proyecto generado la misma configuración del editor, sin tocar el TypeScript de cada app.

## Alcance

**Dentro:**

- `devDependencies.typescript: "latest"` en el `package.json` raíz del monorepo generado.
  - Si create-turbo ya puso `typescript` (p. ej. `5.x`), se sustituye por `"latest"`.
  - Se aplica igual que `oxlint` y `oxfmt` en `src/tooling/oxc.ts`: se escribe en el `package.json` antes de `installDependencies`.
- `.vscode/settings.json` en la raíz del monorepo generado con estas claves:
  - `"js/ts.tsdk.path": "node_modules/typescript"`.
  - `"typescript.enablePromptUseWorkspaceTsdk": true`, para que VS Code ofrezca cambiar a la versión del workspace al abrir el proyecto.
- `.vscode/extensions.json` en la raíz con `recommendations: ["oxc.oxc-vscode"]`.
- Siempre se genera: no hay prompt nuevo en el asistente.
- Si el archivo ya existe (p. ej. lo creó create-turbo):
  - `settings.json`: se fusionan las claves; las nuestras ganan y el resto se conserva.
  - `extensions.json`: se unen las `recommendations` sin duplicados; el resto de campos se conserva.
  - Si el archivo existente no se puede parsear como JSON, se muestra `log.warn` y se escribe el nuestro.
- Plantillas nuevas en `templates/vscode/settings.json` y `templates/vscode/extensions.json`.
- Nuevo módulo `src/tooling/vscode.ts` con `setupVscode(root)`, llamado en `src/index.ts` justo después de `setupOxc`.
- Una línea `log.step` al terminar: `Configurado VS Code (.vscode/) con TypeScript 7 del workspace`.

**Fuera de alcance (specs futuras):**

- Cambiar la versión de TypeScript dentro de `apps/*` o `packages/api-client`.
- Oxc como formateador por defecto o "format on save" en `settings.json`.
- Configuración de otros editores (Zed, JetBrains, Neovim).
- `launch.json`, `tasks.json` o configuración de depuración.
- Prompt para desactivar la configuración de VS Code.
- Cambios en el `.vscode/` del repo de la CLI.
- Mencionar la configuración de VS Code en `CLAUDE.md` / `AGENTS.md` o en el README.

## Modelo de datos

Esta spec no añade estructuras de datos a las opciones de la CLI (`ProjectOptions` no cambia). Añade dos plantillas y una dependencia en el `package.json` generado.

```jsonc
// templates/vscode/settings.json
{
  "js/ts.tsdk.path": "node_modules/typescript",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

```jsonc
// templates/vscode/extensions.json
{
  "recommendations": ["oxc.oxc-vscode"]
}
```

```jsonc
// <proyecto>/package.json (raíz, campo añadido o sustituido)
{
  "devDependencies": {
    "typescript": "latest"
  }
}
```

```ts
// src/tooling/vscode.ts (forma, no implementación)
const TYPESCRIPT_DEV_DEPENDENCY = { typescript: "latest" } as const;
type VscodeExtensions = { recommendations?: string[]; [key: string]: unknown };
export async function setupVscode(root: string): Promise<void>;
```

## Estructura de archivos

```
fsfai/
├── templates/
│   └── vscode/
│       ├── settings.json      # nuevo
│       └── extensions.json    # nuevo
└── src/
    ├── index.ts               # llama a setupVscode después de setupOxc
    └── tooling/
        └── vscode.ts          # nuevo: setupVscode(root)
```

Resultado en el proyecto generado:

```
<proyecto>/
├── .vscode/
│   ├── settings.json
│   └── extensions.json
└── package.json               # devDependencies.typescript: "latest"
```

## Plan de implementación

1. Crear `templates/vscode/settings.json` y `templates/vscode/extensions.json` con el contenido del modelo de datos. Prueba manual: `pnpm build && pnpm pack` incluye `templates/vscode/` en el tarball.
2. Crear `src/tooling/vscode.ts` con `setupVscode(root)` que escribe los dos archivos en `<root>/.vscode/` cuando no existen. Llamarla en `src/index.ts` después de `setupOxc`. Prueba manual: generar un proyecto y ver `.vscode/settings.json` y `.vscode/extensions.json` con el contenido de las plantillas.
3. Añadir la fusión: si `settings.json` existe, se fusionan las claves; si `extensions.json` existe, se unen las `recommendations` sin duplicados; si alguno no es JSON válido, `log.warn` y se sobrescribe. Prueba manual: con un `.vscode/settings.json` previo que tenga `"editor.tabSize": 4`, el resultado conserva esa clave y añade las nuestras.
4. En `setupVscode`, añadir `devDependencies.typescript: "latest"` al `package.json` raíz con `readPackageJson` / `writePackageJson`, y el `log.step` final. Prueba manual: en un proyecto generado con pnpm, `node -p "require('./node_modules/typescript/package.json').version"` en la raíz empieza por `7.`.

## Criterios de aceptación

- [ ] Un proyecto generado (con cualquier combinación de apps) tiene `.vscode/settings.json` con `"js/ts.tsdk.path": "node_modules/typescript"` y `"typescript.enablePromptUseWorkspaceTsdk": true`.
- [ ] Un proyecto generado tiene `.vscode/extensions.json` con `"oxc.oxc-vscode"` en `recommendations`.
- [ ] El `package.json` raíz del proyecto generado tiene `devDependencies.typescript` igual a `"latest"`.
- [ ] Tras la instalación, `node_modules/typescript/package.json` en la raíz tiene una versión que empieza por `7.`, tanto con pnpm como con npm.
- [ ] Si `.vscode/settings.json` ya existía con otras claves, esas claves siguen presentes tras generar el proyecto.
- [ ] Si `.vscode/extensions.json` ya existía con otras recomendaciones, siguen presentes y `"oxc.oxc-vscode"` aparece una sola vez.
- [ ] Si `.vscode/settings.json` existía con JSON inválido, se muestra un aviso y el archivo final contiene nuestras claves.
- [ ] El asistente no muestra ningún prompt nuevo.
- [ ] El `typescript` de `apps/*` y de `packages/api-client` no cambia respecto a antes de esta spec.
- [ ] `<pm> run format:check` pasa en el proyecto recién generado.
- [ ] Al abrir el proyecto generado en VS Code, "TypeScript: Select TypeScript Version" muestra la versión del workspace 7.x.

## Decisiones

- **Sí:** configurar el monorepo generado, no el repo de la CLI. El repo de la CLI ya tiene su `.vscode/settings.json`.
- **Sí:** `typescript: "latest"` en la raíz. Sigue la regla del proyecto de instalar todo en su última versión, y hoy `latest` es TypeScript 7.
- **No:** fijar `^7.0.0`. Rompe la regla de "latest"; si TS 8 rompe algo, se fija en otra spec.
- **No:** forzar TypeScript 7 en cada app. NestJS, Expo y Next.js instalan su propia versión y puede que aún no soporten TS 7; el editor usa la de la raíz.
- **Sí:** `js/ts.tsdk.path`, la misma clave que usa el repo de la CLI. Así el comportamiento es el mismo en los dos sitios.
- **Sí:** `typescript.enablePromptUseWorkspaceTsdk`. Sin él, VS Code sigue con su TypeScript integrado hasta que el usuario lo cambie a mano.
- **Sí:** recomendar `oxc.oxc-vscode` en `extensions.json`. SPEC 03 dejó Oxlint/Oxfmt como herramientas del proyecto.
- **No:** Oxc como formateador por defecto ni "format on save". Es una preferencia personal; se puede añadir en otra spec.
- **Sí:** siempre se genera, sin prompt. Son dos archivos pequeños que no molestan a quien no usa VS Code.
- **Sí:** fusionar si el archivo existe. Conserva lo que create-turbo u otra herramienta haya escrito.
- **Sí:** si el JSON existente no es válido, aviso y sobrescritura. El proyecto es recién creado, así que no se pierde trabajo del usuario.
- **Sí:** `setupVscode` justo después de `setupOxc`. La dependencia queda en el `package.json` antes de `installDependencies` y los archivos se formatean con `formatMonorepo` al final.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `latest` deja de ser TypeScript 7 (sale TS 8) | El criterio de "empieza por `7.`" fallará y se verá; se decide en otra spec si fijar la versión. |
| create-turbo escribe `.vscode/settings.json` como JSONC (con comentarios) | `JSON.parse` falla, se muestra `log.warn` y se escribe el nuestro; se pierden esas claves, pero el proyecto es nuevo. |
| `typescript.enablePromptUseWorkspaceTsdk` cambia de nombre en VS Code (migración a claves `js/ts.*`) | Se comprueba en el último criterio de aceptación; si cambió, se usa la clave nueva. |
| `oxfmt` reformatea `.vscode/*.json` y cambia su estilo | Es lo esperado: `formatMonorepo` corre al final y el criterio de `format:check` lo confirma. |
| Con npm, `node_modules/typescript` de la raíz lo ocupa la versión de una app por el hoisting | La raíz declara `typescript` directamente, así que npm instala ahí esa versión; se comprueba con npm en los criterios. |

## Lo que **no** está en esta spec

- TypeScript 7 dentro de las apps o de `packages/api-client`.
- Oxc como formateador por defecto o "format on save".
- Otros editores.
- `launch.json` o `tasks.json`.
- Prompt para desactivar la configuración.
- Cambios en el `.vscode/` del repo de la CLI.

Cada uno, si llega, va en su propia spec.
