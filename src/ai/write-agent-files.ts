import { writeFile } from "node:fs/promises";
import path from "node:path";
import { log } from "@clack/prompts";
import { BACKEND_FRAMEWORKS, FRAMEWORKS, FRONTEND_FRAMEWORKS } from "../apps/frameworks.js";
import { projectRoot } from "../apps/shared.js";
import { copyTemplateDir, renderTemplate } from "../templates.js";
import type { AppSelection, Framework, ProjectOptions } from "../types.js";
import { AGENT_TARGETS } from "./agents.js";

function appsOf(options: ProjectOptions, frameworks: ReadonlyArray<Framework>): AppSelection[] {
  return options.apps.filter((app) => frameworks.includes(app.framework));
}

function appPaths(apps: ReadonlyArray<AppSelection>): string {
  return apps.map((app) => `\`apps/${app.name}\``).join(", ");
}

function buildAppsList(options: ProjectOptions): string {
  return options.apps
    .map((app) => `- \`apps/${app.name}\` — ${FRAMEWORKS[app.framework].label}`)
    .join("\n");
}

function buildRules(options: ProjectOptions): string {
  const rules: string[] = [];
  const backend = appsOf(options, BACKEND_FRAMEWORKS);
  const frontend = appsOf(options, FRONTEND_FRAMEWORKS);

  if (backend.length > 0) {
    rules.push(
      `- Si tocas código en ${appPaths(backend)} o en código de backend, usa siempre la skill \`nestjs-backend\`.`,
    );
  }
  if (frontend.length > 0) {
    rules.push(
      `- Si tocas código en ${appPaths(frontend)} o en código de frontend/mobile, usa siempre la skill \`typescript-frontend\`.`,
    );
  }
  return rules.join("\n");
}

/** Genera el archivo de instrucciones del agente y sus skills en la raíz del monorepo. */
export async function writeAgentFiles(options: ProjectOptions): Promise<void> {
  const root = projectRoot(options);
  const target = AGENT_TARGETS[options.aiAgent];

  const instructions = await renderTemplate("agent/instructions.md", {
    projectName: options.name,
    packageManager: options.packageManager,
    appsList: buildAppsList(options),
    rules: buildRules(options),
  });
  await writeFile(path.join(root, target.instructionsFile), instructions);
  log.step(`Creado ${target.instructionsFile}`);

  const skillsDir = path.join(root, target.skillsDir);
  await writeBackendSkill(options, skillsDir);
  await writeFrontendSkill(options, skillsDir);
}

async function writeBackendSkill(options: ProjectOptions, skillsDir: string): Promise<void> {
  const [nest] = appsOf(options, BACKEND_FRAMEWORKS);
  if (!nest) {
    return;
  }
  await copyTemplateDir("skills/nestjs-backend", path.join(skillsDir, "nestjs-backend"), {
    nestAppPath: `apps/${nest.name}`,
    packageManager: options.packageManager,
  });
  log.step(`Creada la skill nestjs-backend en ${path.relative(projectRoot(options), skillsDir)}`);
}

async function writeFrontendSkill(options: ProjectOptions, skillsDir: string): Promise<void> {
  const frontend = appsOf(options, FRONTEND_FRAMEWORKS);
  if (frontend.length === 0) {
    return;
  }
  await copyTemplateDir("skills/typescript-frontend", path.join(skillsDir, "typescript-frontend"), {
    frontendAppPaths: appPaths(frontend),
    packageManager: options.packageManager,
  });
  log.step(`Creada la skill typescript-frontend en ${path.relative(projectRoot(options), skillsDir)}`);
}
