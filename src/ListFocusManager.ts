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
    this.getKeys = props.getKeys;
    this.getPageSize = props.getPageSize;
    this._getOrientation = props.getOrientation;
    this._getInitialKeyOnAreaFocus = props.getInitialKeyOnAreaFocus;
    this.wrapAround = !!props.wrapAround;
  }

  kind = "list" as const;

  protected _key: FocusKey | null = null;

  protected getKeys;
  protected getPageSize;
  protected _getOrientation;
  protected _getInitialKeyOnAreaFocus;
  protected wrapAround;

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

  getInitialKeyOnAreaFocus() {
    return this._getInitialKeyOnAreaFocus?.(this.getCallbackContext()) ?? null;
  }

  /**
   * Moves focus by one step in the list based on arrow key input.
   *
   * @param delta - Direction of movement:
   *   - `-1` for previous (Up/Left depending on orientation)
   *   - `1` for next (Down/Right depending on orientation)
   */
  focusOnArrow(delta: -1 | 1): void {
    const keys = this.getKeys(this.getCallbackContext());

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
      targetIndex = this.wrapAround
        ? this.wrapIndex(nextIndex, keysLen)
        : this.clampIndex(nextIndex, keysLen);
    }

    this._key = keys[targetIndex];
  }

  /**
   * Moves focus by a "page" of items, typically triggered by PageUp/PageDown.
   *
   * @param delta - Direction of movement:
   *   - `-1` for PageUp (previous page)
   *   - `1` for PageDown (next page)
   */
  focusOnPage(delta: -1 | 1): void {
    const ctx = this.getCallbackContext();

    const keys = this.getKeys(ctx);
    const keysLen = keys.length;

    if (keysLen === 0) return;

    const currentKey = this._key;
    const currentIndex = currentKey != null ? keys.indexOf(currentKey) : -1;
    const pageSize = this.getPageSize(ctx);

    let targetIndex: number;

    if (currentIndex === -1) {
      // No current focus: jump directly to boundary
      targetIndex = delta === 1 ? keysLen - 1 : 0;
    }
    //
    else {
      const nextIndex = currentIndex + delta * pageSize;

      if (pageSize >= keysLen) {
        // If page size covers the whole list, just go to boundary
        targetIndex = delta === 1 ? keysLen - 1 : 0;
      }
      //
      else {
        targetIndex = this.wrapAround
          ? this.wrapIndex(nextIndex, keysLen)
          : this.clampIndex(nextIndex, keysLen);
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
    const keys = this.getKeys(this.getCallbackContext());

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
