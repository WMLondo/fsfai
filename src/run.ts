import { spawn } from "node:child_process";

export type StdioMode = "inherit" | "ignore";

export interface RunOptions {
  cwd?: string;
  stdio?: StdioMode;
  /** Texto que se escribe en stdin del proceso hijo (y después se cierra). */
  input?: string;
}

/**
 * Ejecuta un comando y resuelve con su código de salida (-1 si no se pudo lanzar).
 * Con `input`, stdin pasa a ser un pipe; stdout y stderr siguen el modo `stdio`.
 */
export function run(cmd: string, args: string[], options: RunOptions = {}): Promise<number> {
  const { cwd = process.cwd(), stdio = "inherit", input } = options;

  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: input === undefined ? stdio : ["pipe", stdio, stdio],
      // En Windows los ejecutables de pnpm/npx son .cmd y requieren shell.
      shell: process.platform === "win32",
    });
    child.on("error", () => resolve(-1));
    child.on("close", (code) => resolve(code ?? 1));

    if (input !== undefined && child.stdin) {
      child.stdin.on("error", () => {});
      child.stdin.end(input);
    }
  });
}
