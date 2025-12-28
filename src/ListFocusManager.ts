import type { FocusManager } from "./FocusManager";
import type {
  FocusKey,
  ListFocusManagerCallbackContext,
  ListFocusManagerProps,
} from "./types";

/**
 * ListFocusManager coordinates focus behavior within a single "list"-style area.
 *
 * Responsibilities:
 * - Tracks the currently focused key (`_key`) and optional metadata (`_meta`).
 * - Provides orientation awareness (horizontal vs. vertical) for arrow and page navigation.
 * - Supports configurable wrap‑around behavior when navigating past the first/last item.
 * - Delegates to helper functions for key retrieval, page sizing, and initial focus selection.
 *
 * @template Meta Optional metadata type associated with focus entries.
 */
export class ListFocusManager<Meta = any> {
  /**
   * Creates a new ListFocusManager.
   *
   * @param props Configuration options for the manager:
   * - `getKeys`: Function returning the ordered set of focusable keys in this area.
   * - `getPageSize`: Function returning the number of items considered a "page" for PageUp/PageDown.
   * - `getOrientation`: Function returning the orientation ("horizontal" or "vertical").
   * - `getInitialKeyOnAreaFocus`: Function returning the initial key when the area receives focus.
   * - `wrapAround`: Whether navigation should wrap around at the boundaries (default: false).
   *
   * The constructor wires these functions into the manager and initializes
   * orientation and wrap‑around behavior.
   */
  constructor(props: ListFocusManagerProps<Meta>) {
    this._getKeys = props.getKeys;
    this._getFirstVisibleIndex = props.getFirstVisibleIndex;
    this._getLastVisibleIndex = props.getLastVisibleIndex;
    this._getOrientation = props.getOrientation;
    this._getInitialKeyOnAreaFocus = props.getInitialKeyOnAreaFocus;
    this._wrapAround = !!props.wrapAround;
  }

  kind = "list" as const;

  protected _key: FocusKey | null = null;

  protected _getKeys;
  protected _getFirstVisibleIndex;
  protected _getLastVisibleIndex;
  protected _getOrientation;
  protected _getInitialKeyOnAreaFocus;
  protected _wrapAround;

  protected _parent?: FocusManager<any>;

  get parent() {
    return this._parent;
  }

  set parent(value: FocusManager<any> | undefined) {
    this._parent = value;
  }

  get orientation() {
    return this._getOrientation?.(this.getCallbackContext()) ?? "vertical";
  }

  get key() {
    return this._key;
  }

  set key(value: FocusKey | null) {
    this._key = value;
  }

  /**
   * Returns the ordered set of focusable keys for this area,
   * as provided by the `getKeys` callback.
   *
   * @returns {FocusKey[]} An array of focusable keys in UI order.
   */
  getKeys(): FocusKey[] {
    return this._getKeys(this.getCallbackContext());
  }

  /**
   * Returns the index of the given key within the ordered set of focusable keys.
   *
   * @param key The focusable key to look up.
   * @returns {number} The index of the key, or -1 if the key is not found.
   */
  getKeyIndex(key: FocusKey): number {
    const keys = this.getKeys();
    return keys.indexOf(key);
  }

  /**
   * Returns the index of the currently focused key within the ordered set of keys.
   *
   * If no key is currently focused, this returns -1.
   *
   * @returns {number} The index of the focused key, or -1 if none is focused.
   */
  getFocusedKeyIndex(): number {
    const currentKey = this.key;
    if (currentKey == null) return -1;

    return this.getKeyIndex(currentKey);
  }

  /**
   * Returns the initial focus key when this area receives focus.
   *
   * Delegates to the `getInitialKeyOnAreaFocus` callback provided in the
   * constructor props. If no callback is defined, this method returns `null`.
   *
   * @returns {FocusKey | null} The key that should be focused initially,
   * or `null` if no initial key is specified.
   */
  getInitialKeyOnAreaFocus() {
    return this._getInitialKeyOnAreaFocus?.(this.getCallbackContext()) ?? null;
  }

  /**
   * Returns the index of the first visible item in the viewport.
   *
   * Delegates to the `getFirstVisibleIndex` callback provided in the
   * constructor props. If no callback is defined, this method returns 0.
   *
   * @returns {number} The index of the first visible item,
   * or 0 if no callback is specified.
   */
  getFirstVisibleIndex(): number {
    return this._getFirstVisibleIndex?.(this.getCallbackContext()) ?? 0;
  }

  /**
   * Returns the index of the last visible item in the viewport.
   *
   * Delegates to the `getLastVisibleIndex` callback provided in the
   * constructor props. If no callback is defined, this method returns
   * the index of the last key in the list.
   *
   * @returns {number} The index of the last visible item,
   * or the last key index if no callback is specified.
   */
  getLastVisibleIndex(): number {
    const keys = this._getKeys(this.getCallbackContext());

    return (
      this._getLastVisibleIndex?.(this.getCallbackContext()) ??
      (keys.length > 0 ? keys.length - 1 : 0)
    );
  }

  /**
   * Moves focus by one step in the list based on arrow key input.
   *
   * @param delta - Direction of movement:
   *   - `-1` for previous (Up/Left depending on orientation)
   *   - `1` for next (Down/Right depending on orientation)
   */
  focusOnArrow(delta: -1 | 1): void {
    const keys = this.getKeys();

    const keysLen = keys.length;

    if (keysLen === 0) return;

    const currentKey = this._key;
    const currentIndex = currentKey != null ? keys.indexOf(currentKey) : -1;

    let targetIndex: number;
    if (currentIndex === -1) {
      targetIndex = delta === 1 ? 0 : keysLen - 1;
    }
    //
    else {
      const nextIndex = currentIndex + delta;
      targetIndex = this._wrapAround
        ? this.wrapIndex(nextIndex, keysLen)
        : this.clampIndex(nextIndex, keysLen);
    }

    this._key = keys[targetIndex];
  }

  /**
   * Moves focus by a "page" of items, typically triggered by PageUp/PageDown.
   *
   * Semantics:
   * - PageUp:
   *   • If focus is not yet at the first visible item, jump to that top item.
   *   • If focus is already at the first visible item, move one visible page up
   *     so the old top becomes the new bottom.
   *
   * - PageDown:
   *   • If focus is not yet at the last visible item, jump to that bottom item.
   *   • If focus is already at the last visible item, move one visible page down
   *     so the old bottom becomes the new top.
   *
   * Visibility is defined by the application via getFirstVisibleIndex/getLastVisibleIndex.
   *
   * @param delta - Direction of movement:
   *   - `-1` for PageUp (previous page)
   *   - `1` for PageDown (next page)
   */
  focusOnPage(delta: -1 | 1): void {
    const keys = this.getKeys();
    if (keys.length === 0) return;

    const currentIndex = this._key != null ? keys.indexOf(this._key) : -1;
    const firstVisible = this.getFirstVisibleIndex();
    const lastVisible = this.getLastVisibleIndex();
    const visibleCount = Math.max(1, lastVisible - firstVisible + 1);

    let targetIndex: number;

    if (delta === -1) {
      if (currentIndex > firstVisible) {
        targetIndex = firstVisible;
      }
      //
      else {
        targetIndex = Math.max(0, firstVisible - visibleCount + 1);
      }
    }
    //
    else {
      if (currentIndex < lastVisible) {
        targetIndex = lastVisible;
      }
      //
      else {
        targetIndex = Math.min(keys.length - 1, lastVisible + visibleCount - 1);
      }
    }

    this._key = keys[targetIndex];
  }

  /**
   * Moves focus directly to the first or last item in the list,
   * typically triggered by Home or End keys.
   *
   * @param direction - Direction of movement:
   *   - `-1`: Home → first item
   *   - `1`: End → last item
   */
  focusOnHomeEnd(direction: -1 | 1): void {
    const keys = this.getKeys();

    const keysLen = keys.length;

    if (keysLen === 0) return;

    const targetIndex = direction === -1 ? 0 : keysLen - 1;
    this._key = keys[targetIndex];
  }

  clear() {
    this._key = null;
  }

  protected clampIndex(index: number, keysLength: number): number {
    return Math.max(0, Math.min(keysLength - 1, index));
  }

  protected wrapIndex(index: number, keysLength: number): number {
    return (index + keysLength) % keysLength;
  }

  protected getCallbackContext(): ListFocusManagerCallbackContext<Meta> {
    if (!this.parent) {
      throw new Error(
        "ListFocusManager: parent not assigned. You need to pass this area manager into FocusManager.areas."
      );
    }

    return {
      manager: this,
      parent: this.parent,
      meta: (this.parent?.entry?.meta as Meta) ?? null,
    };
  }
}
