import type { RESOURCES } from './generated/resources';
import type { paths } from './generated/schema';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type OperationDef = {
  readonly method: HttpMethod;
  readonly path: string;
  readonly pathParams: ReadonlyArray<string>;
};

type Resources = typeof RESOURCES;

/** Operación de `schema.ts` indexada por la ruta y el método de `RESOURCES`. */
type Operation<D extends OperationDef> = D['path'] extends keyof paths
  ? D['method'] extends keyof paths[D['path']]
    ? NonNullable<paths[D['path']][D['method']]>
    : never
  : never;

// `openapi-typescript` marca lo que no existe como `?: never`.
type OrEmpty<T> = [NonNullable<T>] extends [never] ? {} : NonNullable<T>;

type PathParams<O> = O extends { parameters: { path?: infer P } } ? OrEmpty<P> : {};

type QueryParams<O> = O extends { parameters: { query?: infer Q } } ? OrEmpty<Q> : {};

type BodyParams<O> = O extends { requestBody?: infer B }
  ? [NonNullable<B>] extends [never]
    ? {}
    : NonNullable<B> extends { content: { 'application/json': infer J } }
      ? J
      : {}
  : {};

type Simplify<T> = { [K in keyof T]: T[K] } & {};

/** Un único objeto: parámetros de ruta, de query y body JSON juntos. */
export type OperationParams<D extends OperationDef> = Simplify<
  PathParams<Operation<D>> & QueryParams<Operation<D>> & BodyParams<Operation<D>>
>;

type SuccessStatus = 200 | 201 | 202 | 203 | 204 | 206;

type Responses<O> = O extends { responses: infer R } ? R : never;

type JsonContent<R> = R extends { content: { 'application/json': infer J } } ? J : unknown;

type SuccessResponse<R> = R[Extract<keyof R, SuccessStatus>];

/** Body de la respuesta 2xx documentada; `unknown` si el OpenAPI no la describe. */
export type OperationResponse<D extends OperationDef> = [
  SuccessResponse<Responses<Operation<D>>>,
] extends [never]
  ? unknown
  : JsonContent<SuccessResponse<Responses<Operation<D>>>>;

type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];

/** Sin params: sin argumento. Todos opcionales: argumento opcional. */
export type OperationFn<D extends OperationDef> = [keyof OperationParams<D>] extends [never]
  ? () => Promise<OperationResponse<D>>
  : [RequiredKeys<OperationParams<D>>] extends [never]
    ? (params?: OperationParams<D>) => Promise<OperationResponse<D>>
    : (params: OperationParams<D>) => Promise<OperationResponse<D>>;

/** `api.<recurso>.<método>(params)`. */
export type ApiClient = {
  readonly [R in keyof Resources]: {
    readonly [M in keyof Resources[R]]: Resources[R][M] extends OperationDef
      ? OperationFn<Resources[R][M]>
      : never;
  };
};
