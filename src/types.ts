import type { FocusManager } from "./FocusManager";
import type { ListFocusManager } from "./ListFocusManager";

/**
 * Props used to configure a FocusManager instance.
 *
 * @template T A record mapping area names to their corresponding area focus manager.
 */
export type FocusManagerProps<T extends Record<string, ListFocusManager>> = {
  /**
   * A mapping of focusable areas in the application.
   * Each key represents an area identifier, and the value is
   * the ListFocusManager responsible for managing focus within that area.
   */
  areas: T;

  /**
   * Optional cap on the number of focus area entries stored in the history stack.
   * Defaults to 20 if not provided.
   * Helps prevent unbounded growth of the history when focus changes frequently.
   */
  maxHistory?: number;
};

export type FocusAreaEntry<T extends Record<string, ListFocusManager>> = {
  [K in keyof T]: {
    area: K;
    source: FocusSource;
    meta: MetaFromAreaFocusManager<T[K]> | null;
    manager: T[K];
  };
}[keyof T];

export type FocusSource = "keyboard" | "pointer" | "programmatic";

export type MetaFromAreaFocusManager<M> = M extends ListFocusManager<infer Meta>
  ? Meta
  : never;

/**
 * Configuration options for creating a ListFocusManager instance.
 */
export type ListFocusManagerProps<Meta> = {
  /**
   * Returns the ordered list of all focusable item keys.
   *
   * This function should provide a stable array of identifiers
   * (strings or numbers) representing the items in the list.
   * The order of keys determines how keyboard navigation moves
   * focus through the list.
   *
   * @returns {FocusKey[]} An array of keys in UI order.
   */
  getKeys: (ctx: ListFocusManagerCallbackContext<Meta>) => FocusKey[];

  /**
   * Returns the index of the first visible item in the viewport.
   *
   * The application decides whether "visible" means fully or
   * partially visible. Used by PageUp navigation to determine
   * the top boundary.
   *
   * Optional: if omitted, PageUp falls back to simple clamping.
   *
   * @returns {number} The index of the first visible item.
   */
  getFirstVisibleIndex?: (ctx: ListFocusManagerCallbackContext<Meta>) => number;

  /**
   * Returns the index of the last visible item in the viewport.
   *
   * The application decides whether "visible" means fully or
   * partially visible. Used by PageDown navigation to determine
   * the bottom boundary.
   *
   * Optional: if omitted, PageDown falls back to simple clamping.
   *
   * @returns {number} The index of the last visible item.
   */
  getLastVisibleIndex?: (ctx: ListFocusManagerCallbackContext<Meta>) => number;

  /**
   * Returns the orientation of the list.
   *
   * Orientation determines which arrow keys are meaningful:
   * - `"vertical"`: Up/Down arrows move focus.
   * - `"horizontal"`: Left/Right arrows move focus.
   *
   * If omitted, defaults to `"vertical"`.
   *
   * @returns {"vertical" | "horizontal"} The orientation of the list.
   */
  getOrientation?: (
    ctx: ListFocusManagerCallbackContext<Meta>
  ) => FocusListOrientation;

  /**
   * Returns the key that should be focused when the area
   * first becomes active.
   *
   * This allows the application to control the initial focus
   * target when entering the list (e.g. first item, last item,
   * or a previously remembered item).
   *
   * @returns {FocusKey | null} The initial focus key, or null if none.
   */
  getInitialKeyOnAreaFocus?: (
    ctx: ListFocusManagerCallbackContext<Meta>
  ) => FocusKey | null;

  /**
   * Whether focus should wrap around when reaching the start or end
   * of the list.
   *
   * - `true`: Moving past the last item focuses the first, and vice versa.
   * - `false` (default): Focus stops at the boundaries.
   *
   * @returns {boolean} True if focus should wrap around, false otherwise.
   */
  wrapAround?: boolean;
};

export type FocusKey = string | number;

export type FocusListOrientation = "horizontal" | "vertical";

/**
 * Context passed into ListFocusManager callbacks.
 * Provides access to the manager itself, its parent FocusManager,
 * and the currently active entry metadata.
 */
export type ListFocusManagerCallbackContext<Meta> = {
  /** The list focus manager instance */
  manager: ListFocusManager<Meta>;

  /** The parent focus manager that owns this area */
  parent: FocusManager<any>;

  /** Metadata associated with the current focus area entry */
  meta: Meta | null;
};
