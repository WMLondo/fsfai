import pkg from "../package.json" with { type: "json" };

const HELP = `fsfai — genera un monorepo Turborepo ya configurado

Uso:
  fsfai                    inicia el asistente interactivo
  npm create @alejandrohn/fsfai
  pnpm create @alejandrohn/fsfai

Opciones:
  -h, --help               muestra esta ayuda
  -v, --version            muestra la versión

Requisitos: Node >= 20 y pnpm o npm instalado.`;

/**
 * Procesa `--help` y `--version` antes de mostrar ningún prompt.
 * Cualquier otro argumento se ignora (SPEC 09).
 */
export function handleCliArgs(argv: ReadonlyArray<string>): void {
  if (argv.includes("-v") || argv.includes("--version")) {
    console.log(pkg.version);
    process.exit(0);
  }
  if (argv.includes("-h") || argv.includes("--help")) {
    console.log(HELP);
    process.exit(0);
  }
}
