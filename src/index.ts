import { intro, log, outro } from "@clack/prompts";
import { AI_AGENT_LABELS } from "./ai/agents.js";
import { handleCliArgs } from "./cli-args.js";
import { EXTERNAL_SKILLS, installExternalSkills } from "./ai/external-skills.js";
import { writeAgentFiles } from "./ai/write-agent-files.js";
import {
  askExpoPackages,
  createExpoApp,
  describeExpoPackages,
  installExpoPackages,
} from "./apps/expo.js";
import { FRAMEWORKS } from "./apps/frameworks.js";
import { askNestOptions, createNestApp, ORM_LABELS } from "./apps/nestjs.js";
import { describeNextPackages } from "./apps/next-packages.js";
import { askNextPackages, createNextApp, installNextPackages } from "./apps/nextjs.js";
import { projectRoot } from "./apps/shared.js";
import {
  createApiClientPackage,
  generateApiClient,
  hasApiClient,
  linkToFrontApps,
} from "./packages/api-client.js";
import { cleanTurboTemplate, createTurbo } from "./create-turbo.js";
import {
  askAiAgent,
  askAppName,
  askConfirmCreate,
  askExternalSkills,
  askFrameworks,
  askPackageManager,
  askProjectName,
} from "./prompts.js";
import { run } from "./run.js";
import { formatMonorepo, setupOxc } from "./tooling/oxc.js";
import type { AppSelection, Framework, ProjectOptions } from "./types.js";

async function createApp(options: ProjectOptions, app: AppSelection): Promise<void> {
  switch (app.framework) {
    case "nestjs":
      return createNestApp(options, app);
    case "expo":
      return createExpoApp(options, app);
    case "nextjs":
      return createNextApp(options, app);
  }
}

async function askAppSelection(framework: Framework, name: string): Promise<AppSelection> {
  switch (framework) {
    case "nestjs":
      return { framework, name, ...(await askNestOptions()) };
    case "expo":
      return { framework, name, ...(await askExpoPackages(name)) };
    case "nextjs":
      return { framework, name, ...(await askNextPackages(name)) };
  }
}

function describeApp(app: AppSelection): string {
  const base = `${FRAMEWORKS[app.framework].label}: apps/${app.name}`;
  switch (app.framework) {
    case "nestjs":
      return `${base} (PostgreSQL + ${ORM_LABELS[app.orm]})`;
    case "expo":
      return `${base} (${describeExpoPackages(app.packages)})`;
    case "nextjs":
      return `${base} (${describeNextPackages(app.packages)})`;
  }
}

async function askApps(): Promise<AppSelection[]> {
  const frameworks = await askFrameworks();
  const apps: AppSelection[] = [];
  for (const framework of frameworks) {
    const name = await askAppName(
      framework,
      apps.map((app) => app.name),
    );
    apps.push(await askAppSelection(framework, name));
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
  handleCliArgs(process.argv.slice(2));
  intro("fsfai");

  // Todas las preguntas antes de ejecutar nada.
  await askConfirmCreate();
  const name = await askProjectName();
  const packageManager = await askPackageManager();
  const apps = await askApps();
  const aiAgent = await askAiAgent();
  const externalSkills = await askExternalSkills();

  const options: ProjectOptions = { name, packageManager, aiAgent, externalSkills, apps };
  log.info(
    [
      `Proyecto: ${options.name}`,
      `Gestor:   ${options.packageManager}`,
      `Agente:   ${AI_AGENT_LABELS[options.aiAgent]}`,
      `Skills:   ${
        options.externalSkills.length > 0
          ? options.externalSkills.map((id) => EXTERNAL_SKILLS[id].label).join(", ")
          : "ninguna externa"
      }`,
      "Apps:",
      ...options.apps.map((app) => `  - ${describeApp(app)}`),
    ].join("\n"),
  );

  await createTurbo(options);
  await cleanTurboTemplate(projectRoot(options));
  await setupOxc(projectRoot(options), options.apps);

  for (const app of options.apps) {
    await createApp(options, app);
  }
  if (hasApiClient(options)) {
    await createApiClientPackage(options);
    await linkToFrontApps(options);
  }

  await installDependencies(options);
  // `expo install` necesita el `expo` local que instala el paso anterior.
  for (const app of options.apps) {
    if (app.framework === "expo") {
      await installExpoPackages(options, app);
    } else if (app.framework === "nextjs") {
      await installNextPackages(options, app);
    }
  }
  // Una sola vez, con todo instalado; un fallo solo avisa (SPEC 07).
  if (hasApiClient(options)) {
    await generateApiClient(options);
  }
  await writeAgentFiles(options);
  // Depende de la red; un fallo solo avisa (SPEC 08).
  await installExternalSkills(options);
  await formatMonorepo(projectRoot(options), options.packageManager);

  const appLines = options.apps
    .map((app) => `   - apps/${app.name} (${FRAMEWORKS[app.framework].label})`)
    .join("\n");
  outro(
    `Proyecto creado con estas apps:\n\n${appLines}\n\nPróximos pasos:\n\n   cd ${options.name}\n   ${options.packageManager} run dev`,
  );
}

main();
