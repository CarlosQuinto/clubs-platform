/** Códigos de error, los mismos que usaba HttpsError de Cloud Functions. El cliente los lee como `functions/<code>`. */
export type FnErrorCode =
  | "unauthenticated"
  | "permission-denied"
  | "invalid-argument"
  | "not-found"
  | "failed-precondition"
  | "already-exists"
  | "resource-exhausted"
  | "unavailable"
  | "internal";

export const FN_ERROR_STATUS: Record<FnErrorCode, number> = {
  unauthenticated: 401,
  "permission-denied": 403,
  "invalid-argument": 400,
  "not-found": 404,
  "failed-precondition": 412,
  "already-exists": 409,
  "resource-exhausted": 429,
  unavailable: 503,
  internal: 500,
};

/** Error que el servidor devuelve como `{ code, message }` con el status HTTP del código. */
export class FnError extends Error {
  readonly code: FnErrorCode;

  constructor(code: FnErrorCode, message: string) {
    super(message);
    this.name = "FnError";
    this.code = code;
  }

  get status() {
    return FN_ERROR_STATUS[this.code];
  }
}
