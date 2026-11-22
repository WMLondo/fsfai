import type { AiAgent } from "../types.js";

export const AGENT_TARGETS: Record<AiAgent, { instructionsFile: string; skillsDir: string }> = {
  claude: { instructionsFile: "CLAUDE.md", skillsDir: ".claude/skills" },
  other: { instructionsFile: "AGENTS.md", skillsDir: ".agents/skills" },
};

export const AI_AGENT_LABELS: Record<AiAgent, string> = {
  claude: "Claude Code",
  other: "Otro (AGENTS.md)",
};
