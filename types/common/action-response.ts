/**
 * Generic action response type.
 * Standardises server action results across admin, auth, car, home, settings, and test drive flows.
 */
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
