// Lee `openapi.json` y escribe `src/generated/resources.ts`: un recurso por controlador de Nest
// y una función por método, a partir del `operationId` `<Controller>Controller_<método>`.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const INPUT_FILE = fileURLToPath(new URL('../openapi.json', import.meta.url));
const OUTPUT_FILE = fileURLToPath(new URL('../src/generated/resources.ts', import.meta.url));
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const OPERATION_ID = /^([A-Za-z_$][\w$]*)Controller_([A-Za-z_$][\w$]*)$/;
const PATH_PARAM = /\{([^}]+)\}/g;

const lowerFirst = (value) => value.charAt(0).toLowerCase() + value.slice(1);

const pathParamsOf = (path) => [...path.matchAll(PATH_PARAM)].map((match) => match[1]);

/** Recorre `paths` y devuelve `{ recurso: { método: { method, path, pathParams, operationId } } }`. */
const collectResources = (document) => {
  const resources = {};
  for (const [path, item] of Object.entries(document.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = item[method];
      if (!operation) {
        continue;
      }
      const match = OPERATION_ID.exec(operation.operationId ?? '');
      if (!match) {
        console.warn(
          `[api-client] Se omite ${method.toUpperCase()} ${path}: operationId "${operation.operationId ?? ''}" no tiene el formato <Controller>Controller_<método>.`,
        );
        continue;
      }
      const resource = lowerFirst(match[1]);
      const name = match[2];
      resources[resource] ??= {};
      const existing = resources[resource][name];
      if (existing) {
        throw new Error(
          `[api-client] Dos operaciones generan ${resource}.${name}: "${existing.operationId}" (${existing.method.toUpperCase()} ${existing.path}) y "${operation.operationId}" (${method.toUpperCase()} ${path}). Renombra uno de los controladores o métodos.`,
        );
      }
      resources[resource][name] = {
        method,
        path,
        pathParams: pathParamsOf(path),
        operationId: operation.operationId,
      };
    }
  }
  return resources;
};

const key = (name) => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name));

const renderResources = (resources) => {
  const blocks = Object.entries(resources).map(([resource, operations]) => {
    const lines = Object.entries(operations).map(
      ([name, { method, path, pathParams }]) =>
        `    ${key(name)}: { method: '${method}', path: '${path}', pathParams: [${pathParams.map((param) => `'${param}'`).join(', ')}] },`,
    );
    return `  ${key(resource)}: {\n${lines.join('\n')}\n  },`;
  });
  const body = blocks.length > 0 ? `{\n${blocks.join('\n')}\n}` : '{}';
  return `// Generado por scripts/generate-resources.mjs desde openapi.json. No editar a mano.\n\nexport const RESOURCES = ${body} as const;\n`;
};

const document = JSON.parse(await readFile(INPUT_FILE, 'utf8'));
await mkdir(dirname(OUTPUT_FILE), { recursive: true });
await writeFile(OUTPUT_FILE, renderResources(collectResources(document)));
console.log(`[api-client] Escrito ${OUTPUT_FILE}`);
