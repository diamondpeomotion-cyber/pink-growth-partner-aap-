/**
 * Small helpers for generating unique identifiers.
 *
 * These deliberately live outside of components: calling `Math.random()` or
 * `Date.now()` directly inside a component body is impure and produces a value
 * that silently changes on every re-render. Always call these from an event
 * handler (or from lazy `useState` initialisation) instead.
 */

let counter = 0;

/** Monotonic, collision-free id suitable for React keys and record ids. */
export function createId(prefix = 'id'): string {
  counter += 1;
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${random}`;
}

/** 12-digit numeric reference, used for mock UTR / transaction numbers. */
export function createNumericRef(length = 12): string {
  let out = '';
  while (out.length < length) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out.slice(0, length);
}

/** Short uppercase claim/ticket style reference, e.g. "CLM-4F19C2". */
export function createShortRef(): string {
  return createId('r').replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
}
