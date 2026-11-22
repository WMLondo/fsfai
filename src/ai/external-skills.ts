import { log } from "@clack/prompts";
import { projectRoot } from "../apps/shared.js";
import { RUNNERS } from "../create-turbo.js";
import { run } from "../run.js";
import type { ExternalSkillId, ProjectOptions } from "../types.js";
import { AGENT_TARGETS } from "./agents.js";

const SKILLS_CLI_PACKAGE = "skills@latest";

/** Catálogo de repos de skills que se instalan con `skills add` (SPEC 08). */
export const EXTERNAL_SKILLS: Record<
  ExternalSkillId,
  { label: string; repo: string; skills: ReadonlyArray<string> }
> = {
  "fernando-skills": {
    label: "Spec-driven (Fernando Herrera)",
    repo: "Klerith/fernando-skills",
    skills: ["spec", "spec-impl"],
  },
};

export const EXTERNAL_SKILL_IDS = Object.keys(EXTERNAL_SKILLS) as ExternalSkillId[];

/** `<runner> skills@latest add <repo> -a <agente> -y`, a nivel de proyecto y sin prompts. */
export function externalSkillCommand(
  options: ProjectOptions,
  id: ExternalSkillId,
): { cmd: string; args: string[] } {
  const runner = RUNNERS[options.packageManager];
  return {
    cmd: runner.cmd,
    args: [
      ...runner.args,
      SKILLS_CLI_PACKAGE,
      "add",
      EXTERNAL_SKILLS[id].repo,
      "-a",
      AGENT_TARGETS[options.aiAgent].skillsCliAgent,
      "-y",
    ],
  };
}

export function formatCommand(command: { cmd: string; args: string[] }): string {
  return [command.cmd, ...command.args].join(" ");
}

/** Instala cada repo elegido desde la raíz del proyecto. Un fallo solo avisa. */
export async function installExternalSkills(options: ProjectOptions): Promise<void> {
  for (const id of options.externalSkills) {
    const command = externalSkillCommand(options, id);
    log.step(`Instalando skills externas: ${formatCommand(command)}`);
    const code = await run(command.cmd, command.args, {
      cwd: projectRoot(options),
      stdio: "inherit",
    });
    if (code !== 0) {
      log.warn(
        `No se pudieron instalar las skills de ${EXTERNAL_SKILLS[id].repo} (código de salida ${code}).\n` +
          `Reinténtalo desde la raíz del proyecto con:\n  ${formatCommand(command)}`,
      );
    }
  }
}
