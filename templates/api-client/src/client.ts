import { RESOURCES } from './generated/resources';
import type { ApiClient, HttpMethod, OperationDef } from './types';

export type ApiClientOptions = {
  baseUrl: string;
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  credentials?: RequestCredentials;
};

type ApiErrorArgs = { status: number; body: unknown };

/** Respuesta que no es 2xx. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor({ status, body }: ApiErrorArgs) {
    super(`La petición a la API falló con estado ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type Params = Readonly<Record<string, unknown>>;

type SplitParams = { path: string; rest: Params };

const BODY_METHODS: ReadonlySet<HttpMethod> = new Set(['post', 'put', 'patch']);

/** Las claves que son parámetros de ruta van a la ruta; el resto queda para query o body. */
const splitParams = ({ operation, params }: { operation: OperationDef; params: Params }): SplitParams => {
  const pathParams = new Set(operation.pathParams);
  const path = operation.pathParams.reduce(
    (current, name) => current.replace(`{${name}}`, encodeURIComponent(String(params[name]))),
    operation.path,
  );
  const rest = Object.fromEntries(Object.entries(params).filter(([key]) => !pathParams.has(key)));
  return { path, rest };
};

const toQueryString = (params: Params): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      search.append(key, typeof item === 'object' ? JSON.stringify(item) : String(item));
    }
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : '';
};

const readBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (text.length === 0) {
    return undefined;
  }
  const isJson = response.headers.get('content-type')?.includes('json') ?? false;
  if (!isJson) {
    return text;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

type RequestArgs = { options: ApiClientOptions; operation: OperationDef; params: Params };

const request = async ({ options, operation, params }: RequestArgs): Promise<unknown> => {
  const { path, rest } = splitParams({ operation, params });
  const hasBody = BODY_METHODS.has(operation.method);
  const url = `${options.baseUrl.replace(/\/+$/, '')}${path}${hasBody ? '' : toQueryString(rest)}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(await options.getHeaders?.()),
  };

  const response = await fetch(url, {
    method: operation.method.toUpperCase(),
    headers,
    body: hasBody ? JSON.stringify(rest) : undefined,
    credentials: options.credentials,
  });
  const body = await readBody(response);
  if (!response.ok) {
    throw new ApiError({ status: response.status, body });
  }
  return body;
};

/** `api.<recurso>.<método>(params)` a partir de `RESOURCES`, con `fetch` nativo. */
export const createApiClient = (options: ApiClientOptions): ApiClient => {
  const resources: Readonly<Record<string, Readonly<Record<string, OperationDef>>>> = RESOURCES;
  const client = Object.fromEntries(
    Object.entries(resources).map(([resource, operations]) => [
      resource,
      Object.fromEntries(
        Object.entries(operations).map(([name, operation]) => [
          name,
          (params: Params = {}) => request({ options, operation, params }),
        ]),
      ),
    ]),
  );
  return client as unknown as ApiClient;
};
