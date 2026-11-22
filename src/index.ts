import { intro, log, outro } from "@clack/prompts";
import { AI_AGENT_LABELS } from "./ai/agents.js";
import { writeAgentFiles } from "./ai/write-agent-files.js";
import { createExpoApp } from "./apps/expo.js";
import { FRAMEWORKS } from "./apps/frameworks.js";
import { createNestApp } from "./apps/nestjs.js";
import { createNextApp } from "./apps/nextjs.js";
import { projectRoot } from "./apps/shared.js";
import { cleanTurboTemplate, createTurbo } from "./create-turbo.js";
import {
  askAiAgent,
  askAppName,
  askConfirmCreate,
  askFrameworks,
  askPackageManager,
  askProjectName,
} from "./prompts.js";
import { run } from "./run.js";
import { formatMonorepo, setupOxc } from "./tooling/oxc.js";
import type { AppSelection, Framework, ProjectOptions } from "./types.js";

const APP_CREATORS: Record<
  Framework,
  (options: ProjectOptions, app: AppSelection) => Promise<void>
> = {
  nestjs: createNestApp,
  expo: createExpoApp,
  nextjs: createNextApp,
};

async function askApps(): Promise<AppSelection[]> {
  const frameworks = await askFrameworks();
  const apps: AppSelection[] = [];
  for (const framework of frameworks) {
    const name = await askAppName(
      framework,
      apps.map((app) => app.name),
    );
    apps.push({ framework, name });
  }
  return apps;
}

async function installDependencies(options: ProjectOptions): Promise<void> {
  log.step(`Instalando dependencias: ${options.packageManager} install`);
  const code = await run(options.packageManager, ["install"], {
    cwd: projectRoot(options),
    stdio: "inherit",
  });
  if (code !== 0) {
    log.error(`${options.packageManager} install falló (código de salida ${code}).`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  intro("fsfai");

  // Todas las preguntas antes de ejecutar nada.
  await askConfirmCreate();
  const name = await askProjectName();
  const packageManager = await askPackageManager();
  const apps = await askApps();
  const aiAgent = await askAiAgent();

  const options: ProjectOptions = { name, packageManager, aiAgent, apps };
  log.info(
    [
      `Proyecto: ${options.name}`,
      `Gestor:   ${options.packageManager}`,
      `Agente:   ${AI_AGENT_LABELS[options.aiAgent]}`,
      "Apps:",
      ...options.apps.map((app) => `  - ${FRAMEWORKS[app.framework].label}: apps/${app.name}`),
    ].join("\n"),
  );

  await createTurbo(options);
  await cleanTurboTemplate(projectRoot(options));
  await setupOxc(projectRoot(options), options.apps);

  for (const app of options.apps) {
    await APP_CREATORS[app.framework](options, app);
  }

  await installDependencies(options);
  await writeAgentFiles(options);
  await formatMonorepo(projectRoot(options), options.packageManager);

  const appLines = options.apps
    .map((app) => `   - apps/${app.name} (${FRAMEWORKS[app.framework].label})`)
    .join("\n");
  outro(
    `Proyecto creado con estas apps:\n\n${appLines}\n\nPróximos pasos:\n\n   cd ${options.name}\n   ${options.packageManager} run dev`,
  );
}

main();
