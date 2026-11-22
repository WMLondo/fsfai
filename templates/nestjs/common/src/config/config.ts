import './load-env.js';
import { config as defaults } from './envs/default.js';
import { config as development } from './envs/development.js';
import { config as production } from './envs/production.js';
import { config as test } from './envs/test.js';

export type Environment = 'development' | 'production' | 'test';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends ReadonlyArray<unknown>
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export type Config = typeof defaults & { env: Environment };
export type ConfigOverrides = DeepPartial<typeof defaults>;

const ENVIRONMENTS: Record<Environment, ConfigOverrides> = { development, production, test };

function isEnvironment(value: string): value is Environment {
  return Object.hasOwn(ENVIRONMENTS, value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, overrides: DeepPartial<T>): T {
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
    if (value === undefined) {
      continue;
    }
    result[key] =
      isPlainObject(value) && isPlainObject(result[key]) ? deepMerge(result[key], value) : value;
  }
  return result as T;
}

let cached: Config | undefined;

/** Configuración de `default.ts` sobrescrita por la del entorno indicado en `NODE_ENV`. */
export function loadConfig(): Config {
  if (cached) {
    return cached;
  }
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const env: Environment = isEnvironment(nodeEnv) ? nodeEnv : 'development';
  cached = { ...deepMerge(defaults, ENVIRONMENTS[env]), env };
  return cached;
}
