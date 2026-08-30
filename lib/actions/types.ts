export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function actionError(message: string): ActionResult<never> {
  return { ok: false, error: message }
}
