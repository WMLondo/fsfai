# SPEC 08 — Skills externas instaladas con `skills add`

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 03
> **Date:** 2026-11-22
> **Objective:** Preguntar qué skills externas se instalan desde un catálogo (de momento `Klerith/fernando-skills`) e instalarlas en el monorepo generado con `skills@latest add` para el agente elegido.

## Por qué existe esta spec

SPEC 03 dejó fuera instalar skills desde la red: las skills de convenciones son plantillas propias para que funcionen sin conexión.
Hay skills de terceros útiles que no tiene sentido copiar a `templates/`, como el flujo spec-driven de `Klerith/fernando-skills` (`/spec` y `/spec-impl`).
Esta spec añade esa vía como algo opcional y tolerante a fallos, sin cambiar las skills propias de SPEC 03.

## Alcance

**Dentro:**

- Catálogo de skills externas en `src/ai/external-skills.ts`. De momento con una entrada: `Klerith/fernando-skills`.
- Nuevo prompt `multiselect` justo después de "¿Qué agente de IA usas?": "Skills externas para el agente".
  - Una opción por repo del catálogo, con su `label` y un `hint` con las skills que trae.
  - Todas las opciones van marcadas por defecto.
  - Se puede no elegir ninguna (`required: false`).
- Se instala el repo completo; no se eligen skills individuales dentro de un repo.
- Comando, ejecutado desde la raíz del proyecto generado:
  - `<runner> skills@latest add <repo> -a <agente> -y`.
  - `<runner>` es el mismo de `create-turbo.ts`: `pnpm dlx` con pnpm, `npx` con npm.
  - `<agente>` sale del agente de SPEC 03: `claude` → `claude-code` (`.claude/skills/`), `other` → `codex` (`.agents/skills/`).
  - Instalación a nivel de proyecto (sin `-g`).
- Se ejecuta una vez por repo elegido, después de `writeAgentFiles` y antes de `formatMonorepo`.
- Si un comando falla (código ≠ 0 o no se pudo lanzar):
  - `log.warn` con el comando exacto para reintentarlo.
  - Se sigue con el siguiente repo y la CLI termina con código 0.
- Sección "External skills" en `CLAUDE.md` / `AGENTS.md`, solo si se eligió algún repo:
  - Una línea por repo con su nombre, las skills que trae y el comando para reinstalarlo.
  - El texto va en inglés, como el resto de la plantilla de instrucciones.
- Lo que escriba `skills add` (carpetas de skills y su lock file, si lo crea) queda en el proyecto y se versiona.
- El resumen con `log.info` antes de crear el proyecto lista las skills externas elegidas.

**Fuera de alcance (specs futuras):**

- Elegir skills individuales dentro de un repo (`--skill`).
- Fijar la versión de la CLI `skills` o de los repos.
- Skills externas por app o filtradas según las apps elegidas.
- Instalación global (`-g`).
- Añadir repos desde un flag o un archivo de configuración del usuario.
- Copiar `specs/.spec-config.yml` o crear `specs/` en el proyecto generado.
- Otros agentes además de `claude-code` y `codex`.

## Modelo de datos

```ts
// src/types.ts
export type ExternalSkillId = "fernando-skills";

export interface ProjectOptions {
  name: string;
  packageManager: PackageManager;
  aiAgent: AiAgent;
  externalSkills: ReadonlyArray<ExternalSkillId>;
  apps: ReadonlyArray<AppSelection>;
}
```

```ts
// src/ai/external-skills.ts
export const EXTERNAL_SKILLS: Record<ExternalSkillId, { label: string; repo: string; skills: ReadonlyArray<string> }> = {
  "fernando-skills": {
    label: "Spec-driven (Fernando Herrera)",
    repo: "Klerith/fernando-skills",
    skills: ["spec", "spec-impl"],
  },
};
```

```ts
// src/ai/agents.ts
export const AGENT_TARGETS: Record<AiAgent, { instructionsFile: string; skillsDir: string; skillsCliAgent: string }> = {
  claude: { instructionsFile: "CLAUDE.md", skillsDir: ".claude/skills", skillsCliAgent: "claude-code" },
  other:  { instructionsFile: "AGENTS.md", skillsDir: ".agents/skills", skillsCliAgent: "codex" },
};
```

Sección generada en el archivo de instrucciones (placeholder `{{externalSkills}}`, vacío si no se eligió ninguno):

```markdown
## External skills

- `Klerith/fernando-skills` — `/spec`, `/spec-impl`. Reinstall: `pnpm dlx skills@latest add Klerith/fernando-skills -a claude-code -y`
```

## Estructura de archivos

En la CLI:

```
templates/agent/instructions.md    # + {{externalSkills}}
src/
├── types.ts                       # + ExternalSkillId, ProjectOptions.externalSkills
├── prompts.ts                     # + askExternalSkills()
├── index.ts                       # pregunta, resumen y llamada a installExternalSkills
└── ai/
    ├── agents.ts                  # + skillsCliAgent
    ├── external-skills.ts         # EXTERNAL_SKILLS, externalSkillCommand(), installExternalSkills(options)
    └── write-agent-files.ts       # + buildExternalSkills(options)
```

En el proyecto generado (Claude Code + fernando-skills):

```
<proyecto>/
├── CLAUDE.md                      # con la sección "External skills"
└── .claude/skills/
    ├── spec/
    └── spec-impl/
```

## Plan de implementación

1. Añadir `ExternalSkillId`, `EXTERNAL_SKILLS` y `askExternalSkills()` (multiselect, todo marcado, `required: false`) después de `askAiAgent()`. Guardar la elección en `ProjectOptions.externalSkills` y mostrarla en el resumen. Prueba manual: el resumen lista "Spec-driven (Fernando Herrera)" y desmarcarla la quita.
2. Añadir `skillsCliAgent` a `AGENT_TARGETS` y `externalSkillCommand(options, id)`, que devuelve `{ cmd, args }` con el runner del gestor. Prueba manual: con pnpm + Claude devuelve `pnpm dlx skills@latest add Klerith/fernando-skills -a claude-code -y`.
3. Implementar `installExternalSkills(options)`: ejecuta el comando por cada repo elegido desde la raíz del proyecto con `stdio: "inherit"`. Si falla, `log.warn` con el comando y sigue. Llamarla después de `writeAgentFiles`. Prueba manual: un proyecto nuevo con Claude Code trae `.claude/skills/spec/SKILL.md` y `.claude/skills/spec-impl/SKILL.md`.
4. Añadir `{{externalSkills}}` a `templates/agent/instructions.md` y `buildExternalSkills(options)` en `write-agent-files.ts`. Prueba manual: con fernando-skills, `CLAUDE.md` tiene la sección "External skills"; sin ninguna, la sección no aparece.

## Criterios de aceptación

- [ ] Después de "¿Qué agente de IA usas?" aparece "Skills externas para el agente" con `Klerith/fernando-skills` marcada.
- [ ] Ctrl+C en ese prompt muestra "Operación cancelada" y sale con código 0.
- [ ] Con Claude Code y fernando-skills existen `.claude/skills/spec/SKILL.md` y `.claude/skills/spec-impl/SKILL.md` en el proyecto generado.
- [ ] Con "Otro (AGENTS.md)" y fernando-skills las skills están en `.agents/skills/` y no existe `.claude/skills/spec`.
- [ ] Con pnpm el comando ejecutado empieza por `pnpm dlx skills@latest add`; con npm, por `npx skills@latest add`.
- [ ] La instalación no muestra ningún prompt interactivo de la CLI `skills`.
- [ ] Las skills propias de SPEC 03 (`nestjs-backend`, `typescript-frontend`) siguen existiendo después de instalar las externas.
- [ ] Sin ninguna skill externa elegida no se ejecuta `skills add` y el archivo de instrucciones no tiene la sección "External skills".
- [ ] Con fernando-skills elegida, el archivo de instrucciones tiene la sección "External skills" con el repo y su comando de reinstalación para el gestor y agente elegidos.
- [ ] Sin conexión a internet, la CLI muestra un aviso con el comando para reintentarlo, crea el resto del proyecto y termina con código 0.
- [ ] `<pm> run lint` y `<pm> run format:check` terminan con código 0 en el proyecto recién generado con fernando-skills.

## Decisiones

- **Sí:** catálogo en `src/ai/external-skills.ts` con multiselect. Añadir otro repo es una entrada nueva, sin tocar el prompt.
- **No:** un `confirm` sí/no. Habría que cambiarlo en cuanto llegue un segundo repo.
- **No:** instalarlas siempre sin preguntar. Dependen de la red y de terceros; el usuario decide.
- **Sí:** todo marcado por defecto. Igual que los multiselect de paquetes de SPEC 05 y SPEC 06.
- **Sí:** `<runner>` del gestor (`pnpm dlx` / `npx`). Coherente con `create-turbo` y `shadcn` (SPEC 06).
- **Sí:** `skills@latest`. Es lo que da el README del repo y el proyecto ya instala en `latest`.
- **Sí:** `-a <agente> -y` para que no haya prompts de la CLI `skills` dentro del flujo de la CLI.
- **Sí:** `other` → `codex`. Instala en `.agents/skills/`, la carpeta que SPEC 03 ya usa para "Otro".
- **Sí:** repo completo. Es lo que da el README y evita mantener la lista de skills internas como opciones.
- **Sí:** fallo → `log.warn` y seguir. Igual que `api:generate` en SPEC 07; el proyecto sirve sin estas skills.
- **Sí:** instalar después de `writeAgentFiles` y antes de `formatMonorepo`. Así las skills propias ya existen y lo instalado también pasa por Oxfmt.
- **Sí:** sección "External skills" en el archivo de instrucciones. Deja escrito qué se instaló y cómo reinstalarlo.
- **No:** copiar `fernando-skills` a `templates/`. Se quedaría desactualizado respecto al repo original.
- **Sí:** mantener las skills propias de SPEC 03 como plantillas. Esta spec no cambia esa decisión.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La CLI `skills` cambia los flags `-a` o `-y` o el nombre de los agentes | Los flags viven solo en `externalSkillCommand()`. Si deja de ser no interactiva, se ve en la prueba manual del paso 3. |
| `codex` deja de instalar en `.agents/skills/` | `skillsCliAgent` está en `AGENT_TARGETS`; se cambia ahí sin tocar el resto. |
| `skills add` sobrescribe una skill propia con el mismo nombre | Hoy no hay colisión (`spec`, `spec-impl` vs `nestjs-backend`, `typescript-frontend`). Un repo nuevo del catálogo se revisa al añadirlo. |
| Oxfmt reformatea o rompe los `.md` instalados y `format:check` falla | `formatMonorepo` corre después de instalar. Si falla, se añaden las carpetas de skills externas a los ignores de `.oxfmtrc.json`. |
| `pnpm dlx` tarda o pide confirmación la primera vez | `stdio: "inherit"` muestra la salida; el `log.step` previo muestra el comando que se ejecuta. |

## Lo que **no** está en esta spec

- Elegir skills sueltas dentro de un repo.
- Versiones fijadas de `skills` o de los repos.
- Skills externas según las apps.
- Instalación global.
- Repos definidos por el usuario fuera del catálogo.
- Crear `specs/` o `.spec-config.yml` en el proyecto generado.

Cada uno, si llega, va en su propia spec.
