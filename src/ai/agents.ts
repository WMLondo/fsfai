import type { AiAgent } from "../types.js";

// `skillsCliAgent`: valor de `-a` en `skills add` (SPEC 08).
export const AGENT_TARGETS: Record<
  AiAgent,
  { instructionsFile: string; skillsDir: string; skillsCliAgent: string }
> = {
  claude: { instructionsFile: "CLAUDE.md", skillsDir: ".claude/skills", skillsCliAgent: "claude-code" },
  other: { instructionsFile: "AGENTS.md", skillsDir: ".agents/skills", skillsCliAgent: "codex" },
};

export const AI_AGENT_LABELS: Record<AiAgent, string> = {
  claude: "Claude Code",
  other: "Otro (AGENTS.md)",
};
