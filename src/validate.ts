import { existsSync } from "node:fs";
import path from "node:path";

// Formato de nombre de paquete npm (sin scope): minúsculas, sin espacios,
// máximo 214 caracteres, no empieza por "." ni "_" y solo caracteres URL-safe.
const NPM_NAME_PATTERN = /^[a-z0-9-~][a-z0-9-._~]*$/;
const MAX_NAME_LENGTH = 214;

/**
 * Devuelve un mensaje de error si el nombre no es válido, o `undefined` si lo es.
 * Pensado para usarse directamente como `validate` de un prompt de clack.
 */
export function validateProjectName(value: string | undefined): string | undefined {
  const name = (value ?? "").trim();

  if (name.length === 0) {
    return "El nombre del proyecto es obligatorio.";
  }
  if (name.length > MAX_NAME_LENGTH) {
    return `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`;
  }
  if (name.startsWith(".") || name.startsWith("_")) {
    return 'El nombre no puede empezar por "." ni "_".';
  }
  if (!NPM_NAME_PATTERN.test(name)) {
    return "Nombre de paquete npm no válido: usa minúsculas, números, guiones, puntos, guiones bajos o \"~\", sin espacios.";
  }
  if (existsSync(path.resolve(process.cwd(), name))) {
    return `Ya existe una carpeta "${name}" en el directorio actual.`;
  }

  return undefined;
}
