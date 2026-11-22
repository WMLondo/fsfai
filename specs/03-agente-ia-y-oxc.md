# SPEC 03 — Agente IA, skills de convenciones y Oxlint/Oxfmt en el monorepo

> **Status:** Draft
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-21
> **Objective:** Preguntar qué agente IA se usa, generar su archivo de instrucciones y las skills de backend y frontend/mobile según las apps elegidas, y reemplazar ESLint/Prettier por Oxlint/Oxfmt en todo el monorepo.

## Por qué existe esta spec

Las convenciones (patrón NestJS y TypeScript Style Guide) tienen que aplicarlas tanto las personas como los agentes de IA.
Las skills hacen que el agente cargue la guía correcta solo cuando toca código de backend o de frontend/mobile.
Oxlint y Oxfmt aplican las reglas automatizables en todo el monorepo con una sola herramienta.

## Alcance

**Dentro:**

- Nuevo prompt `select` después de los nombres de app: "¿Qué agente de IA usas?". Opciones: `Claude Code` (preseleccionado) y `Otro (AGENTS.md)`.
- Archivo de instrucciones en la raíz del monorepo:
  - Claude Code → `CLAUDE.md` y skills en `.claude/skills/`.
  - Otro → `AGENTS.md` y skills en `.agents/skills/`.
- Contenido del archivo de instrucciones, generado desde una plantilla:
  - Resumen del monorepo: gestor de paquetes, lista de apps con framework y ruta, y `packages/`.
  - Comandos: `<pm> run dev`, `<pm> run build`, `<pm> run lint`, `<pm> run format`.
  - Reglas obligatorias:
    - "Si tocas código en `apps/<nest>` o en código de backend, usa siempre la skill `nestjs-backend`."
    - "Si tocas código en `apps/<expo>`, `apps/<next>` o en código de frontend/mobile, usa siempre la skill `typescript-frontend`."
  - Cada regla aparece solo si existe una app de ese tipo.
- Skill `nestjs-backend` (solo si se eligió NestJS): `SKILL.md` con el patrón nestjs-project-structure adaptado (ver Modelo de datos). SPEC 04 añade la referencia del ORM elegido.
- Skill `typescript-frontend` (solo si se eligió Expo o Next.js): `SKILL.md` + `references/` con el TypeScript Style Guide de mkosir, dividido por temas.
- Las plantillas viven en el repo de la CLI, en `templates/`, y se publican con el paquete (`files: ["dist", "templates"]`).
- Oxlint + Oxfmt en la raíz del monorepo generado:
  - Borrar `packages/eslint-config`.
  - Quitar `prettier` de las devDependencies de la raíz.
  - Añadir `oxlint` y `oxfmt` como devDependencies de la raíz.
  - Crear `.oxlintrc.json` y `.oxfmtrc.json` en la raíz.
  - Scripts de la raíz: `lint: "oxlint"`, `format: "oxfmt"`, `format:check: "oxfmt --check"`.
  - Quitar la tarea `lint` de `turbo.json`.
- Quitar cualquier configuración de ESLint/Prettier que dejen las CLIs de las apps. Esto se hace en el paso de configuración de cada framework (SPEC 04–06), usando el helper de esta spec.

**Fuera de alcance (specs futuras):**

- Otros agentes con archivo propio (Cursor rules, `GEMINI.md`, Copilot instructions).
- Instalar skills desde la red (`npx skills add`).
- Lint con información de tipos (type-aware de Oxlint) y la regla de `switch` exhaustivo.
- Hooks de git (lefthook, husky) y CI.
- Archivos de agente por app (`apps/<app>/CLAUDE.md`).

## Modelo de datos

```ts
// src/types.ts
export type AiAgent = "claude" | "other";

export interface ProjectOptions {
  name: string;
  packageManager: PackageManager;
  aiAgent: AiAgent;
  apps: ReadonlyArray<AppSelection>;
}
```

```ts
// src/ai/agents.ts
export const AGENT_TARGETS: Record<AiAgent, { instructionsFile: string; skillsDir: string }> = {
  claude: { instructionsFile: "CLAUDE.md", skillsDir: ".claude/skills" },
  other:  { instructionsFile: "AGENTS.md", skillsDir: ".agents/skills" },
};
```

Plantillas en el repo de la CLI:

```
templates/
├── agent/
│   └── instructions.md            # {{projectName}}, {{packageManager}}, {{appsList}}, {{rules}}
├── skills/
│   ├── nestjs-backend/
│   │   ├── SKILL.md
│   │   └── references/            # SPEC 04 añade drizzle.md o typeorm.md
│   └── typescript-frontend/
│       ├── SKILL.md
│       └── references/
│           ├── types.md
│           ├── discriminated-unions.md
│           ├── functions.md
│           ├── variables.md
│           ├── naming.md
│           ├── source-organization.md
│           ├── react.md
│           └── tests.md
└── oxc/
    ├── .oxlintrc.json
    └── .oxfmtrc.json
```

Frontmatter de las skills (el `description` decide cuándo las carga el agente):

```markdown
---
name: nestjs-backend
description: Úsala SIEMPRE que leas, escribas o revises código de backend NestJS (apps/<nest>): módulos, controladores, servicios, DTOs, auth, base de datos, schemas o tests.
---
```

```markdown
---
name: typescript-frontend
description: Úsala SIEMPRE que leas, escribas o revises código de frontend o mobile (Next.js, Expo, React): componentes, hooks, tipos, formularios, data fetching o tests.
---
```

Contenido obligatorio de `nestjs-backend/SKILL.md`:

- ESM en lugar de CommonJS, Oxlint en lugar de ESLint, Oxfmt en lugar de Prettier y pnpm/npm según el proyecto.
- Configuración en `src/config/envs/` (`default`, `development`, `production`, `test`) y `.env.sample` → `.env`.
- Estructura de carpetas: `bin`, `public`, `src/config`, `src/auth`, `src/common/{constants,controllers,decorators,dto,filters,guards,interceptors,middleware,pipes,providers}`, `src/shared`, `src/database/schemas`, `test`, `typings`.
- Estructura de módulo: `<name>.constant.ts`, `.controller.ts`, `.service.ts`, `.module.ts`, `index.ts`.
- Nombres de archivo de clases: `PascalCaseSuffix` → `pascal-case.suffix.ts`.
- `index.ts` en cada carpeta e imports desde la carpeta. Nunca importar desde una ruta que termina en `.` o `..`.
- Base de datos segmentada por schema de PostgreSQL. Carpeta `src/database/schemas/<schema>/<tabla>.ts`. Tabla `<schema>.<schema>_<tabla>`. Ejemplo: `usr/user.ts` → `usr.usr_user`. Un archivo por tabla.
- Validación con class-validator/class-transformer, logs con nestjs-pino, documentación OpenAPI con Scalar en `/reference`.
- Tests con Vitest: `*.spec.ts` junto al código y e2e en `test/`.

Configuración de Oxc:

```jsonc
// .oxlintrc.json
{
  "plugins": ["typescript", "unicorn", "oxc", "import", "react"],
  "categories": { "correctness": "error", "suspicious": "warn" },
  "rules": {
    "typescript/no-explicit-any": "error",
    "typescript/consistent-type-imports": "error"
  },
  "overrides": [
    {
      "files": ["apps/<expo>/**", "apps/<next>/**"],   // se rellena con las apps front reales
      "rules": {
        "typescript/consistent-type-definitions": ["error", "type"],
        "typescript/array-type": ["error", { "default": "generic" }],
        "typescript/no-non-null-assertion": "error",
        "import/no-default-export": "error"
      }
    },
    {
      // Archivos de ruta y configuración que exigen export default
      "files": ["apps/*/src/app/**", "apps/*/app/**", "**/*.config.*"],
      "rules": { "import/no-default-export": "off" }
    }
  ],
  "ignorePatterns": ["**/dist/**", "**/.next/**", "**/.expo/**", "**/generated/**"]
}
```

```json
// .oxfmtrc.json
{ "singleQuote": true, "printWidth": 120 }
```

## Estructura de archivos

```
fsfai/
├── package.json                 # files: ["dist", "templates"]
├── templates/                   # ver Modelo de datos
└── src/
    ├── prompts.ts               # + askAiAgent
    ├── templates.ts             # templatesDir(), renderTemplate(file, vars), copyTemplateDir(src, dest, vars)
    ├── ai/
    │   ├── agents.ts            # AGENT_TARGETS
    │   └── write-agent-files.ts # archivo de instrucciones + skills según apps
    └── tooling/
        ├── oxc.ts               # setupOxc(root, apps): borra eslint-config, añade deps, configs y scripts
        └── strip-eslint.ts      # stripEslintPrettier(appDir): borra configs y deps de ESLint/Prettier de una app
```

## Plan de implementación

1. Crear `src/templates.ts`. `templatesDir()` resuelve `../templates` desde `import.meta.url`. `renderTemplate` reemplaza `{{clave}}`. Añadir `templates` a `files` en `package.json`. Prueba manual: `pnpm build && node dist/index.js` encuentra las plantillas desde `dist/`.
2. Añadir `AiAgent` y `askAiAgent()` (Claude Code preseleccionado) después de los nombres de app. Prueba manual: el resumen con `log.info` muestra el agente elegido.
3. Escribir `templates/agent/instructions.md` y `src/ai/write-agent-files.ts`. Genera el archivo de instrucciones con la lista de apps y solo las reglas que aplican. Se ejecuta después del `install` final. Prueba manual: con Claude + NestJS + Next.js se crea `CLAUDE.md` con las dos reglas.
4. Escribir `templates/skills/nestjs-backend/SKILL.md` y copiarlo a `<skillsDir>/nestjs-backend/` solo si hay NestJS. Prueba manual: con solo Next.js no existe la carpeta `nestjs-backend`.
5. Escribir `templates/skills/typescript-frontend/` (`SKILL.md` + `references/`) y copiarlo solo si hay Expo o Next.js. `SKILL.md` contiene el TLDR y una tabla que dice qué referencia cargar según la tarea. Prueba manual: con solo NestJS no existe la carpeta `typescript-frontend`.
6. Crear `src/tooling/strip-eslint.ts`. Borra `eslint.config.*`, `.eslintrc*`, `.prettierrc*` y `.prettierignore` de una carpeta, y quita del `package.json` las dependencias que empiezan por `eslint`, `@eslint/`, `typescript-eslint`, `prettier` o `@repo/eslint-config`, además de los scripts `lint` y `format`. Prueba manual: aplicado a una app Nest recién creada, deja `package.json` sin ESLint ni Prettier.
7. Crear `src/tooling/oxc.ts` y llamarlo justo después de `cleanTurboTemplate`. Borra `packages/eslint-config`, quita `prettier` de la raíz, añade `oxlint` y `oxfmt` (`latest`) como devDependencies, escribe las configs (rellenando el override con las apps front reales), cambia los scripts de la raíz y quita `lint` de `turbo.json`. Prueba manual: `<pm> run lint` y `<pm> run format:check` funcionan en el monorepo generado.

## Criterios de aceptación

- [ ] Después de los nombres de app aparece "¿Qué agente de IA usas?" con `Claude Code` preseleccionado.
- [ ] Ctrl+C en ese prompt muestra "Operación cancelada" y sale con código 0.
- [ ] Con Claude Code existe `<proyecto>/CLAUDE.md` y no existe `AGENTS.md`.
- [ ] Con "Otro" existe `<proyecto>/AGENTS.md`, no existe `CLAUDE.md` y las skills están en `.agents/skills/`.
- [ ] El archivo de instrucciones lista cada app con su framework y su ruta `apps/<app>`.
- [ ] Con NestJS, el archivo de instrucciones contiene la regla de `nestjs-backend` y existe `<skillsDir>/nestjs-backend/SKILL.md`.
- [ ] Con Expo o Next.js, el archivo contiene la regla de `typescript-frontend` y existe `<skillsDir>/typescript-frontend/SKILL.md` con sus 8 referencias.
- [ ] Una regla no aparece si no hay ninguna app de su tipo.
- [ ] Las skills se generan aunque la CLI se ejecute sin conexión a internet.
- [ ] No existe `packages/eslint-config`.
- [ ] Ningún `package.json` del monorepo tiene dependencias de ESLint ni de Prettier.
- [ ] `<pm> run lint` ejecuta Oxlint en la raíz y termina con código 0 en el proyecto recién generado.
- [ ] `<pm> run format:check` termina con código 0 en el proyecto recién generado.
- [ ] `turbo.json` no tiene la tarea `lint`.

## Decisiones

- **Sí:** preguntar el agente con Claude Code preseleccionado. Si es Claude, todo apunta a `CLAUDE.md` y `.claude/skills/`.
- **No:** generar siempre `AGENTS.md` + un `CLAUDE.md` que lo importa. El usuario prefiere que Claude tenga su propio archivo.
- **Sí:** skills como plantillas propias versionadas en la CLI. Funcionan sin red y no dependen de terceros.
- **No:** `npx skills add mkosir/typescript-style-guide`. Depende de la red y de un repo externo que puede cambiar.
- **Sí:** una sola skill `typescript-frontend` para Expo y Next.js. La guía es la misma; las diferencias van en las specs de cada framework.
- **Sí:** reglas "usa siempre la skill X" en el archivo de instrucciones, además del `description` de cada skill. Así la carga no depende solo de que el agente la descubra.
- **Sí:** `references/` por tema en la skill de frontend. El agente carga solo la sección que necesita.
- **Sí:** Oxlint + Oxfmt en todo el monorepo, configurado en la raíz. Una herramienta y una config para Nest, Expo y Next.
- **No:** ESLint `strict-type-checked` que pide la guía de mkosir. Lo reemplaza Oxlint; las reglas que necesitan tipos quedan fuera por ahora.
- **Sí:** reglas de estilo de frontend (`type` en lugar de `interface`, `Array<T>`, sin `export default`) solo en las apps front. Nest usa clases, interfaces y decoradores.
- **Sí:** comillas simples y 120 de ancho en Oxfmt. Coinciden con los ejemplos de la guía.
- **No:** un `CLAUDE.md` por app. Uno en la raíz con reglas por ruta es suficiente.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Oxlint no tiene alguna de las reglas listadas o cambia su nombre | Oxlint avisa de las reglas desconocidas. Se ajusta `templates/oxc/.oxlintrc.json` en la prueba manual del paso 7. |
| Oxfmt cambia el formato de su config (proyecto joven) | La config es mínima. Si falla `format:check`, se ajusta la plantilla. |
| Una CLI de framework añade un archivo de ESLint con un nombre nuevo | `stripEslintPrettier` usa patrones (`eslint.config.*`, `.eslintrc*`). |
| Las plantillas no se encuentran tras `pnpm link --global` | `templatesDir()` se resuelve desde `import.meta.url`, no desde `process.cwd()`. |

## Lo que **no** está en esta spec

- Archivos para Cursor, Gemini o Copilot.
- Instalar skills desde la red.
- Lint con información de tipos.
- Hooks de git y CI.
- Archivos de agente por app.

Cada uno, si llega, va en su propia spec.
