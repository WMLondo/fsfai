import { existsSync } from "node:fs";
import path from "node:path";

// Formato de nombre de paquete npm (sin scope): minúsculas, sin espacios,
// máximo 214 caracteres, no empieza por "." ni "_" y solo caracteres URL-safe.
const NPM_NAME_PATTERN = /^[a-z0-9-~][a-z0-9-._~]*$/;
const MAX_NAME_LENGTH = 214;

/**
 * Valida solo el formato de nombre de paquete npm.
 * Devuelve un mensaje de error, o `undefined` si el nombre es válido.
 */
export function validatePackageName(
  value: string | undefined,
  label = "El nombre del proyecto",
): string | undefined {
  const name = (value ?? "").trim();

  if (name.length === 0) {
    return `${label} es obligatorio.`;
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

  return undefined;
}

/**
 * Formato npm + que no exista ya la carpeta en el directorio actual.
 * Pensado para usarse directamente como `validate` de un prompt de clack.
 */
export function validateProjectName(value: string | undefined): string | undefined {
  const formatError = validatePackageName(value);
  if (formatError) {
    return formatError;
  }

  const name = (value ?? "").trim();
  if (existsSync(path.resolve(process.cwd(), name))) {
    return `Ya existe una carpeta "${name}" en el directorio actual.`;
  }

  return undefined;
}

/** Formato npm + distinto de los nombres de las otras apps ya elegidas. */
export function validateAppName(
  value: string | undefined,
  otherNames: ReadonlyArray<string>,
): string | undefined {
  const formatError = validatePackageName(value, "El nombre de la app");
  if (formatError) {
    return formatError;
  }

  const name = (value ?? "").trim();
  if (otherNames.includes(name)) {
    return `Ya hay otra app llamada "${name}". Elige un nombre distinto.`;
  }

  return undefined;
}
