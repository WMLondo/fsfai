import { intro, log, outro } from "@clack/prompts";
import { createTurbo } from "./create-turbo.js";
import { askConfirmCreate, askPackageManager, askProjectName } from "./prompts.js";
import type { ProjectOptions } from "./types.js";

async function main(): Promise<void> {
  intro("fsfai");

  await askConfirmCreate();
  const name = await askProjectName();
  const packageManager = await askPackageManager();

  const options: ProjectOptions = { name, packageManager };
  log.info(`Proyecto: ${options.name}\nGestor:   ${options.packageManager}`);

  await createTurbo(options);

  outro(
    `Proyecto creado. Próximos pasos:\n\n   cd ${options.name}\n   ${options.packageManager} run dev`,
  );
}

main();
