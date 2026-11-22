import type { Orm } from "../types.js";

export type DependencyList = Readonly<Record<string, string>>;
export type DependencySet = { dependencies: DependencyList; devDependencies: DependencyList };

function latest(...names: ReadonlyArray<string>): DependencyList {
  return Object.fromEntries(names.map((name) => [name, "latest"]));
}

/** Vitest con SWC (sustituye a Jest). */
export const TEST_DEPENDENCIES: DependencySet = {
  dependencies: {},
  devDependencies: latest(
    "vitest",
    "@vitest/coverage-v8",
    "unplugin-swc",
    "@swc/core",
    "supertest",
    "@types/supertest",
  ),
};

/** Dependencias comunes a ambos ORM. */
export const COMMON_DEPENDENCIES: DependencySet = {
  dependencies: latest(
    "@nestjs/config",
    "nestjs-pino",
    "pino-http",
    "class-validator",
    "class-transformer",
    "@nestjs/swagger",
    "@scalar/nestjs-api-reference",
    "better-auth",
    "@thallesp/nestjs-better-auth",
    "pg",
  ),
  devDependencies: latest("pino-pretty", "@types/pg"),
};

export const ORM_DEPENDENCIES: Record<Orm, DependencySet> = {
  drizzle: {
    dependencies: latest("drizzle-orm"),
    devDependencies: latest("drizzle-kit"),
  },
  typeorm: {
    dependencies: latest("@nestjs/typeorm", "typeorm"),
    devDependencies: {},
  },
};

const TYPEORM_DATA_SOURCE = "-d dist/database/data-source.js";

/**
 * Scripts de base de datos por ORM. Los de TypeORM usan el DataSource compilado (`build` antes).
 * `db:generate` de TypeORM recibe la ruta: `db:generate database/migrations/<nombre>`; genera
 * JavaScript ESM para que `db:migrate` lo ejecute sin compilar.
 */
export const ORM_SCRIPTS: Record<Orm, Readonly<Record<string, string>>> = {
  drizzle: {
    "entity:sync": "drizzle-kit push",
    "entity:load": "drizzle-kit pull",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
  },
  typeorm: {
    "entity:sync": `typeorm schema:sync ${TYPEORM_DATA_SOURCE}`,
    "db:generate": `typeorm migration:generate ${TYPEORM_DATA_SOURCE} --outputJs --esm`,
    "db:migrate": `typeorm migration:run ${TYPEORM_DATA_SOURCE}`,
  },
};

/** Paquetes de Jest que se quitan al pasar a Vitest. */
export const JEST_DEPENDENCIES: ReadonlyArray<string> = ["jest", "ts-jest", "@types/jest"];

/**
 * Build scripts de las dependencias de la app para `allowBuilds` (solo pnpm).
 * `@swc/core` y `esbuild` (drizzle-kit, Vite) instalan su binario; `@scarf/scarf` es telemetría.
 */
export const PNPM_ALLOW_BUILDS: Readonly<Record<string, boolean>> = {
  "@swc/core": true,
  esbuild: true,
  "@scarf/scarf": false,
};
