/**
 * Configuration options for creating a ListFocusManager instance.
 */
export type ListFocusManagerProps = {
  /**
   * Returns the ordered list of all focusable item keys.
   *
   * This function should provide a stable array of identifiers
   * (strings or numbers) representing the items in the list.
   * The order of keys determines how arrow‑key navigation moves
   * focus through the list.
   *
   * @returns {FocusKey[]} An array of keys in UI order.
   */
  getKeys: () => FocusKey[];

  /**
   * Returns the key that is currently focused globally.
   *
   * This allows the manager to compute the next focus target
   * without owning focus state itself. The application remains
   * the source of truth for focus.
   *
   * @returns {FocusKey | null} The currently focused key, or null if none.
   */
  getFocusedKey: () => FocusKey | null;

  /**
   * Returns the number of items that constitute a "page" jump.
   *
   * Typically this corresponds to the number of visible rows
   * in the viewport, but the application can decide dynamically.
   *
   * @returns {number} The page size to use for PageUp/PageDown navigation.
   */
  getPageSize: () => number;

  /**
   * Whether focus should wrap around when reaching the start or end
   * of the list.
   *
   * - `true`: Moving past the last item focuses the first, and vice versa.
   * - `false` (default): Focus stops at the boundaries.
   */
  wrapAround?: boolean;
};

export type FocusKey = string | number;
