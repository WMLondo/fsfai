import { USR_ENTITIES, USR_SCHEMA } from './usr/index.js';

export * from './usr/index.js';

/** Schemas de PostgreSQL y sus entidades. Cada schema nuevo se añade a ambas listas. */
export const SCHEMAS = [USR_SCHEMA];
export const ENTITIES = [...USR_ENTITIES];
