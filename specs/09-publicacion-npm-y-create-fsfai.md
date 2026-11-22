# SPEC 09 — Publicación en npm de `@alejandrohn/fsfai` y del wrapper `@alejandrohn/create-fsfai`

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-11-22
> **Objective:** Preparar la CLI para publicarse en npm como `@alejandrohn/fsfai` (instalable con `npm i -g`), con README, licencia, flags `--help`/`--version` y un wrapper `@alejandrohn/create-fsfai` para crear proyectos con `npm create @alejandrohn/fsfai` sin instalación global.

## Por qué existe esta spec

SPEC 01 dejó fuera la publicación en npm y el flujo de release: hoy la CLI solo se usa con `pnpm build && node dist/index.js` o `pnpm link --global`.
Para que otros la usen hace falta un paquete publicado con metadatos correctos, un README y una forma corta de ejecutarla.
La forma corta es la convención `npm create <x>`, que necesita un paquete `create-*` aparte. Ese wrapper es la "versión lite": no trae plantillas ni código propio, solo delega en la CLI completa.

## Alcance

**Dentro:**

- Renombrar el paquete raíz a `@alejandrohn/fsfai`. El comando sigue siendo `fsfai` (`bin: { "fsfai": "./dist/index.js" }`).
- Versión inicial pública: `0.1.0` (la actual) en los dos paquetes.
- Metadatos en el `package.json` raíz y en el del wrapper:
  - `license: "MIT"`, `author`, `keywords`, `homepage`, `bugs`.
  - `repository` apuntando a `https://github.com/WMLondo/fsfai` (el wrapper con `directory: "packages/create-fsfai"`).
  - `publishConfig: { "access": "public" }` (los paquetes con scope son privados por defecto).
- `files` del paquete raíz: `dist` y `templates`. npm añade siempre `package.json`, `README.md` y `LICENSE`.
- Script `prepublishOnly: "pnpm build"` en la raíz, para que nunca se publique un `dist/` viejo.
- Archivo `LICENSE` (MIT) en la raíz y copia en `packages/create-fsfai/LICENSE`.
- `README.md` en inglés en la raíz con dos bloques:
  - **Usage & install:** `npm create @alejandrohn/fsfai`, `pnpm create @alejandrohn/fsfai`, `npm i -g @alejandrohn/fsfai` + `fsfai`, requisitos (Node >= 20, pnpm o npm instalado, conexión a internet).
  - **What it generates:** orden de los prompts, apps disponibles (NestJS, Expo, Next.js) con lo que configura cada una, `packages/api-client`, Oxc, archivos del agente (`CLAUDE.md` / `AGENTS.md` y skills), skills externas, y un árbol de carpetas de ejemplo del proyecto generado.
- `README.md` corto en `packages/create-fsfai/` (inglés): qué es, el comando y un enlace al README principal.
- Flags de la CLI, procesados antes de `intro`:
  - `--version` / `-v`: imprime la versión del `package.json` (solo el número, p. ej. `0.1.0`) y sale con código 0.
  - `--help` / `-h`: imprime el uso y sale con código 0, sin mostrar prompts.
  - Cualquier otro argumento se ignora, como hasta ahora.
- Wrapper `packages/create-fsfai`:
  - Nombre `@alejandrohn/create-fsfai`, `type: "module"`, `engines.node: ">=20"`.
  - `bin: { "create-fsfai": "./index.js" }`, `files: ["index.js"]`.
  - Dependencia `"@alejandrohn/fsfai": "workspace:*"`; `pnpm publish` la reescribe a la versión exacta.
  - `index.js` en JS plano (sin build): resuelve el `bin` de `@alejandrohn/fsfai`, lo ejecuta con `process.execPath`, `stdio: "inherit"` y los mismos argumentos, y sale con el mismo código.
- `pnpm-workspace.yaml` con `packages: ["packages/*"]`, manteniendo `allowBuilds`.
- Script `scripts/check-versions.mjs`: compara la `version` de los dos `package.json`; si no coinciden, imprime las dos y sale con código 1.
- Scripts de release en la raíz:
  - `release:check`: `node scripts/check-versions.mjs`.
  - `release`: `pnpm release:check && pnpm -r --include-workspace-root publish --access public`.
- Publicación manual desde la máquina del usuario, que ya es dueño del scope `alejandrohn` en npm.

**Fuera de alcance (specs futuras):**

- Publicación automática con GitHub Actions, provenance o trusted publishing.
- Changesets, `CHANGELOG.md` o generación de notas de release.
- Sección de contribución / desarrollo en el README.
- Una CLI reducida con menos opciones o presets no interactivos (`--preset`, `-y`).
- Nombre del proyecto como argumento (`fsfai my-app`).
- Paquete sin scope `create-fsfai` o `fsfai`.
- Traducción del README o de los prompts.
- Mover la CLI a `packages/fsfai/`.
- Comprobación de nuevas versiones disponibles al arrancar la CLI.

## Modelo de datos

Esta spec no añade estructuras de datos a la CLI. Cambia la configuración de los paquetes.

```jsonc
// package.json (raíz, campos nuevos o cambiados)
{
  "name": "@alejandrohn/fsfai",
  "version": "0.1.0",
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/WMLondo/fsfai.git" },
  "homepage": "https://github.com/WMLondo/fsfai#readme",
  "bugs": { "url": "https://github.com/WMLondo/fsfai/issues" },
  "keywords": ["cli", "turborepo", "monorepo", "nestjs", "expo", "nextjs", "scaffold"],
  "bin": { "fsfai": "./dist/index.js" },
  "files": ["dist", "templates"],
  "publishConfig": { "access": "public" },
  "scripts": {
    "prepublishOnly": "pnpm build",
    "release:check": "node scripts/check-versions.mjs",
    "release": "pnpm release:check && pnpm -r --include-workspace-root publish --access public"
  }
}
```

```jsonc
// packages/create-fsfai/package.json
{
  "name": "@alejandrohn/create-fsfai",
  "version": "0.1.0",
  "description": "Create a new fsfai project with `npm create @alejandrohn/fsfai`",
  "type": "module",
  "bin": { "create-fsfai": "./index.js" },
  "files": ["index.js"],
  "engines": { "node": ">=20" },
  "dependencies": { "@alejandrohn/fsfai": "workspace:*" },
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/WMLondo/fsfai.git", "directory": "packages/create-fsfai" },
  "publishConfig": { "access": "public" }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - packages/*
allowBuilds:
  esbuild: true
```

Texto de `fsfai --help` (en español, como los prompts):

```
fsfai — genera un monorepo Turborepo ya configurado

Uso:
  fsfai                    inicia el asistente interactivo
  npm create @alejandrohn/fsfai
  pnpm create @alejandrohn/fsfai

Opciones:
  -h, --help               muestra esta ayuda
  -v, --version            muestra la versión

Requisitos: Node >= 20 y pnpm o npm instalado.
```

## Estructura de archivos

```
fsfai/
├── package.json               # @alejandrohn/fsfai + metadatos y scripts de release
├── pnpm-workspace.yaml        # + packages/*
├── README.md                  # nuevo, en inglés
├── LICENSE                    # nuevo, MIT
├── scripts/
│   └── check-versions.mjs     # nuevo
├── src/
│   ├── cli-args.ts            # nuevo: handleCliArgs(argv) para --help / --version
│   └── index.ts               # llama a handleCliArgs antes de intro
└── packages/
    └── create-fsfai/
        ├── package.json
        ├── index.js
        ├── README.md
        └── LICENSE
```

## Plan de implementación

1. Añadir `src/cli-args.ts` con `handleCliArgs(argv)`: con `-v`/`--version` imprime la versión (importada de `package.json` en el build) y sale; con `-h`/`--help` imprime la ayuda y sale. Llamarla al principio de `main()`. Prueba manual: `pnpm build && node dist/index.js -v` imprime `0.1.0`; `node dist/index.js --help` imprime la ayuda sin `intro`.
2. Renombrar el paquete a `@alejandrohn/fsfai` y añadir metadatos, `publishConfig`, `prepublishOnly` y `LICENSE`. Prueba manual: `pnpm pack` crea `alejandrohn-fsfai-0.1.0.tgz` con `dist/`, `templates/`, `package.json` y `LICENSE`, y sin `src/` ni `specs/`.
3. Instalar el tarball global y crear un proyecto. Prueba manual: `npm i -g ./alejandrohn-fsfai-0.1.0.tgz`, luego `fsfai` en una carpeta temporal crea un proyecto con plantillas (p. ej. `.oxlintrc.json` existe); después `npm rm -g @alejandrohn/fsfai`.
4. Escribir `README.md` en inglés con los bloques "Usage & install" y "What it generates". Prueba manual: el tarball de `pnpm pack` incluye `README.md` y se ve bien en la vista previa de GitHub.
5. Crear `packages/create-fsfai/` (`package.json`, `index.js`, `README.md`, `LICENSE`) y añadir `packages/*` a `pnpm-workspace.yaml`. Prueba manual: tras `pnpm install`, `node packages/create-fsfai/index.js -v` imprime `0.1.0` y sin flags arranca el asistente.
6. Añadir `scripts/check-versions.mjs` y los scripts `release:check` y `release`. Prueba manual: cambiar a mano la versión del wrapper a `0.1.1` hace que `pnpm release:check` salga con código 1; restaurarla lo deja en 0.
7. Ensayo de publicación: `pnpm -r --include-workspace-root publish --access public --dry-run --no-git-checks`. Prueba manual: lista los dos paquetes y el `package.json` empaquetado del wrapper tiene `"@alejandrohn/fsfai": "0.1.0"`.
8. Publicación real (manual, por el usuario): `npm login`, `pnpm release` en `main` con el árbol limpio. Prueba manual: `npm view @alejandrohn/fsfai version` y `npm view @alejandrohn/create-fsfai version` devuelven `0.1.0`.

## Criterios de aceptación

- [ ] `node dist/index.js --version` y `-v` imprimen exactamente la versión del `package.json` y salen con código 0.
- [ ] `node dist/index.js --help` y `-h` imprimen la ayuda, no muestran `intro` ni prompts y salen con código 0.
- [ ] `node dist/index.js` sin argumentos arranca el asistente igual que antes de esta spec.
- [ ] El `package.json` raíz tiene `name: "@alejandrohn/fsfai"`, `license: "MIT"`, `repository`, `publishConfig.access: "public"` y `prepublishOnly`.
- [ ] El tarball de `pnpm pack` en la raíz contiene `dist/index.js`, `templates/`, `README.md`, `LICENSE` y `package.json`, y no contiene `src/`, `specs/`, `.claude/` ni `.agents/`.
- [ ] Con el tarball instalado global, `fsfai` crea un proyecto completo (las plantillas se encuentran desde `node_modules`).
- [ ] Existe `README.md` en inglés con las secciones "Usage & install" y "What it generates", y menciona `npm create @alejandrohn/fsfai` y `npm i -g @alejandrohn/fsfai`.
- [ ] `packages/create-fsfai/package.json` tiene `name: "@alejandrohn/create-fsfai"`, `bin.create-fsfai` y la dependencia `"@alejandrohn/fsfai": "workspace:*"`.
- [ ] `node packages/create-fsfai/index.js --version` imprime la misma versión que la CLI y el código de salida del wrapper es el de la CLI.
- [ ] `pnpm release:check` sale con código 1 si las versiones de los dos paquetes no coinciden y con 0 si coinciden.
- [ ] El ensayo con `--dry-run` publica `@alejandrohn/fsfai` y `@alejandrohn/create-fsfai`, y el wrapper empaquetado depende de la versión exacta `0.1.0`.
- [ ] Tras publicar, `npm create @alejandrohn/fsfai` y `pnpm create @alejandrohn/fsfai` en una carpeta vacía muestran el `intro` "fsfai".

## Decisiones

- **Sí:** scope `@alejandrohn`. El usuario es dueño del scope y evita que otro ocupe el nombre.
- **No:** `fsfai` sin scope. Estaba libre, pero se prefirió un espacio de nombres propio.
- **Sí:** el comando sigue siendo `fsfai`. El scope solo cambia el nombre del paquete, no el binario.
- **Sí:** "versión lite" = wrapper `@alejandrohn/create-fsfai`. Da `npm create @alejandrohn/fsfai` sin instalación global y sin duplicar código.
- **No:** una CLI reducida con menos opciones. Habría dos flujos que mantener; si hace falta, va en otra spec.
- **No:** presets no interactivos en esta spec. Otra spec si llega.
- **Sí:** wrapper con dependencia fijada a la misma versión. Una sola descarga y el wrapper nunca ejecuta una CLI de otra versión.
- **No:** wrapper que lanza `npx @alejandrohn/fsfai@latest`. Segunda descarga y depende de `npx`.
- **Sí:** la CLI se queda en la raíz y el wrapper en `packages/create-fsfai`. No cambia ninguna ruta de `templates/` ni de tsup.
- **No:** mover la CLI a `packages/fsfai/`. Toca todas las rutas sin ganar nada para publicar.
- **Sí:** wrapper en JS plano. Son pocas líneas y no necesita build.
- **Sí:** publicación manual con `pnpm -r publish`. `pnpm publish` reescribe `workspace:*` a la versión exacta; `npm publish` no.
- **No:** GitHub Actions ni Changesets. El usuario prefiere publicar a mano; se puede añadir en otra spec.
- **Sí:** `release:check` antes de publicar. Con versiones manuales, es fácil subir solo una de las dos.
- **Sí:** `prepublishOnly: "pnpm build"`. Impide publicar un `dist/` viejo o inexistente.
- **Sí:** versión `0.1.0`. Indica pre-1.0 y permite cambios incompatibles.
- **Sí:** MIT. Licencia permisiva estándar para una CLI pública.
- **Sí:** README en inglés. Público de npm más amplio; la plantilla de instrucciones ya está en inglés.
- **No:** sección de contribución en el README. El usuario no la pidió; el flujo de release queda en los scripts.
- **Sí:** `--help` y `--version` se procesan antes de `intro`. Así no se muestra ningún prompt al pedir ayuda.
- **Sí:** el resto de argumentos se ignora. Es el comportamiento actual y el nombre como argumento quedó fuera.
- **Sí:** ayuda en español. Coincide con los prompts de la CLI.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `pnpm -r publish` no incluye el paquete raíz | Se usa `--include-workspace-root`; el ensayo `--dry-run` del paso 7 confirma que salen los dos. |
| `workspace:*` no enlaza con el paquete raíz | Se comprueba en el paso 5. Si falla, la dependencia pasa a la versión literal y `check-versions.mjs` también la compara. |
| Se publica el wrapper y falla la publicación de la CLI | pnpm publica en orden de dependencias (CLI primero). Si la CLI falla, se corrige y se vuelve a lanzar `pnpm release`; pnpm salta las versiones ya publicadas. |
| `pnpm publish` exige `main` y el árbol limpio | Es lo deseado para releases. El ensayo usa `--no-git-checks`. |
| npm descarta archivos `.gitignore` de `templates/` al empaquetar | Hoy no hay ninguno. Si una plantilla lo necesita, se guarda como `gitignore` y se renombra al copiar. |
| `templatesDir()` no encuentra las plantillas instalado desde npm | La ruta es relativa a `dist/`; se verifica en el paso 3 con el tarball instalado global. |
| El nombre `@alejandrohn/create-fsfai` y `npm create @alejandrohn/fsfai` no coinciden | npm mapea `npm create @scope/x` a `@scope/create-x`; se verifica en el último criterio de aceptación. |

## Lo que **no** está en esta spec

- Publicación automática con CI, provenance o Changesets.
- Sección de contribución en el README.
- CLI reducida o presets no interactivos.
- Nombre del proyecto como argumento.
- Paquetes sin scope.
- Mover la CLI a `packages/fsfai/`.
- Aviso de nuevas versiones.

Cada uno, si llega, va en su propia spec.
