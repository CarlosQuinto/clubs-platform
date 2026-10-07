import { supabase } from "../supabase";

/**
 * Puente entre la firma del antiguo SDK de Data Connect y las funciones RPC de Postgres.
 *
 * Cada operación es una función SQL `nombre_en_snake(p jsonb) RETURNS jsonb` (db/migrations/1*.sql)
 * que devuelve exactamente la forma de su `<Op>Data`. El primer argumento `dataConnect` se conserva
 * para no tocar las 55 llamadas existentes; aquí es un token inerte.
 */

/** Token que las llamadas pasan como primer argumento; no hace nada. */
export const dataConnect = Object.freeze({ backend: "supabase" as const });
export type DataConnectToken = typeof dataConnect;

/** Conservado por compatibilidad: las RPC siempre leen del servidor, no hay caché. */
export enum QueryFetchPolicy {
  SERVER_ONLY = "SERVER_ONLY",
  PREFER_CACHE = "PREFER_CACHE",
  CACHE_ONLY = "CACHE_ONLY",
}

export interface ExecuteQueryOptions {
  fetchPolicy?: QueryFetchPolicy;
}

export interface OperationResult<Data> {
  data: Data;
}

/** Error de una RPC con código legible (unauthenticated, permission-denied, invalid-argument, internal). */
export class RpcError extends Error {
  code: string;
  details?: string;
  hint?: string;
  constructor(code: string, message: string, details?: string, hint?: string) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

function toRpcError(error: { code?: string; message: string; details?: string; hint?: string }): RpcError {
  const sqlState = error.code || "";
  let code = "internal";
  if (sqlState === "42501" || /unauthenticated/i.test(error.message)) code = "unauthenticated";
  else if (sqlState === "P0001") code = "permission-denied";
  else if (sqlState.startsWith("22") || sqlState.startsWith("23")) code = "invalid-argument";
  else if (sqlState === "PGRST202") code = "not-found";
  return new RpcError(code, error.message, error.details, error.hint);
}

/**
 * Frase para la persona a partir de un error de RPC (o de red / savedRow). El detalle técnico va a la
 * consola, nunca a la pantalla.
 */
export function rpcErrorHint(err: unknown): string {
  const code = err instanceof RpcError ? err.code : "";
  if (code === "unauthenticated") return "Tu sesión terminó. Vuelve a iniciar sesión e inténtalo de nuevo.";
  if (code === "permission-denied") return "No tienes permiso para hacer este cambio.";
  if (code === "invalid-argument") return "Algún dato no es válido; revisa el formulario.";
  if (code === "not-found") return "Esta función no está disponible; recarga la página.";
  return "Revisa tu conexión e inténtalo de nuevo.";
}

async function call<Data>(name: string, vars: unknown): Promise<OperationResult<Data>> {
  const { data, error } = await supabase.rpc(name, { p: vars ?? {} });
  if (error) throw toRpcError(error);
  return { data: (data ?? {}) as Data };
}

export function query<Vars, Data>(name: string) {
  return (_dc: DataConnectToken, vars: Vars, _options?: ExecuteQueryOptions) => call<Data>(name, vars);
}

export function queryNoVars<Data>(name: string) {
  return (_dc: DataConnectToken, _options?: ExecuteQueryOptions) => call<Data>(name, undefined);
}

export function mutation<Vars, Data>(name: string) {
  return (_dc: DataConnectToken, vars: Vars) => call<Data>(name, vars);
}

export function mutationNoVars<Data>(name: string) {
  return (_dc: DataConnectToken) => call<Data>(name, undefined);
}
